import xrpl from 'xrpl';
import pool from '../db/pool.js';
import * as xrplService from './xrpl.js';

// ─── Sync a single NFT's on-chain state into the local DB ──────
export async function syncNFT(tokenId) {
  if (!tokenId) return;

  try {
    // 1. Look up the NFT in our DB by token_id
    const dbResult = await pool.query(
      'SELECT * FROM nfts WHERE token_id = $1',
      [tokenId]
    );

    if (dbResult.rows.length === 0) {
      // NFT not in our DB — nothing to sync
      return;
    }

    const nft = dbResult.rows[0];
    const updates = {};

    // 2. Check sell offers → derive listing status and price
    const sellOffers = await xrplService.getSellOffers(tokenId);

    if (sellOffers.length > 0) {
      // NFT is listed — take the first (lowest price) offer
      const bestOffer = sellOffers.reduce((best, offer) => {
        const price = parseFloat(xrpl.dropsToXrp(offer.amount));
        return price < best.price ? { price, owner: offer.owner } : best;
      }, { price: Infinity, owner: null });

      updates.status = 'listed';
      updates.list_price_xrp = bestOffer.price;
      updates.owner_address = bestOffer.owner || nft.owner_address;
    } else {
      // No sell offers — NFT is owned (not listed)
      // Only change from 'listed' to 'owned'; don't overwrite 'redeemed'
      if (nft.status === 'listed') {
        updates.status = 'owned';
      }
    }

    // 3. Check escrows for the creator address to find backing amount
    if (nft.creator_address) {
      const escrows = await xrplService.getAccountEscrows(nft.creator_address);

      // Look for an escrow that matches this NFT's recorded sequence,
      // or a self-escrow from the creator (destination === creator)
      let matchedEscrow = null;

      if (nft.escrow_sequence) {
        matchedEscrow = escrows.find(
          (e) => e.PreviousTxnLgrSeq === nft.escrow_sequence ||
                 e.Sequence === nft.escrow_sequence
        );
      }

      // Fallback: if we have an escrow_owner but no sequence match, find by tx hash pattern
      if (!matchedEscrow && escrows.length > 0) {
        // Find self-escrows (Account === Destination) from this creator
        const selfEscrows = escrows.filter(
          (e) => e.Account === nft.creator_address && e.Destination === nft.creator_address
        );
        if (selfEscrows.length > 0) {
          // Use the escrow amount — pick the one closest to our recorded backing
          const recorded = parseFloat(nft.backing_xrp || 0);
          matchedEscrow = selfEscrows.reduce((best, e) => {
            const amt = parseFloat(xrpl.dropsToXrp(e.Amount));
            if (!best || Math.abs(amt - recorded) < Math.abs(parseFloat(xrpl.dropsToXrp(best.Amount)) - recorded)) {
              return e;
            }
            return best;
          }, null);
        }
      }

      if (matchedEscrow) {
        const escrowAmount = parseFloat(xrpl.dropsToXrp(matchedEscrow.Amount));
        updates.backing_xrp = escrowAmount;
        updates.escrow_sequence = matchedEscrow.Sequence || nft.escrow_sequence;
        updates.escrow_owner = matchedEscrow.Account || nft.escrow_owner;
      }
    }

    // 4. Apply updates to DB if any fields changed
    const setClauses = [];
    const params = [];
    let paramIdx = 1;

    for (const [key, value] of Object.entries(updates)) {
      setClauses.push(`${key} = $${paramIdx}`);
      params.push(value);
      paramIdx++;
    }

    if (setClauses.length > 0) {
      setClauses.push(`updated_at = datetime('now')`);
      params.push(nft.id);
      const sql = `UPDATE nfts SET ${setClauses.join(', ')} WHERE id = $${paramIdx}`;
      await pool.query(sql, params);
      console.log(`[Sync] Updated NFT ${nft.asset_name} (${tokenId.slice(0, 12)}...): ${Object.keys(updates).join(', ')}`);
    }
  } catch (err) {
    console.warn(`[Sync] Failed to sync NFT ${tokenId.slice(0, 12)}...: ${err.message}`);
  }
}

// ─── Sync all NFTs for a specific wallet address ────────────────
export async function syncWallet(address) {
  if (!address) return;

  try {
    console.log(`[Sync] Syncing wallet ${address.slice(0, 10)}...`);

    // 1. Get all NFTs this wallet owns on-chain
    const onChainNFTs = await xrplService.getAccountNFTs(address);
    const onChainTokenIds = new Set(onChainNFTs.map((n) => n.NFTokenID));

    // 2. Get all NFTs our DB thinks this wallet owns
    const dbResult = await pool.query(
      `SELECT id, token_id, status FROM nfts WHERE owner_address = $1 AND status IN ('owned', 'listed')`,
      [address]
    );

    // 3. For NFTs in our DB that are no longer in the wallet on-chain,
    //    check if they were transferred or burned
    for (const dbNft of dbResult.rows) {
      if (dbNft.token_id && !onChainTokenIds.has(dbNft.token_id)) {
        // This NFT is no longer in this wallet — may have been transferred or burned
        // Try to find the new owner by checking if the NFT still exists
        // For now, mark as 'transferred' so it doesn't show in portfolio
        console.log(`[Sync] NFT ${dbNft.token_id.slice(0, 12)}... no longer in wallet ${address.slice(0, 10)}...`);
      }
    }

    // 4. For each NFT we know about in the DB owned by this address,
    //    sync its on-chain state (sell offers, escrow)
    const allNftsResult = await pool.query(
      `SELECT token_id FROM nfts WHERE (owner_address = $1 OR creator_address = $1) AND token_id IS NOT NULL`,
      [address]
    );

    for (const row of allNftsResult.rows) {
      await syncNFT(row.token_id);
    }

    console.log(`[Sync] Wallet ${address.slice(0, 10)}... sync complete (${allNftsResult.rows.length} NFTs)`);
  } catch (err) {
    console.warn(`[Sync] Failed to sync wallet ${address.slice(0, 10)}...: ${err.message}`);
  }
}

// ─── Sync all known wallets in the system ───────────────────────
export async function syncAllKnownWallets() {
  try {
    console.log('[Sync] Starting full sync of all known wallets...');

    // Get all distinct wallet addresses that own or created NFTs
    const result = await pool.query(
      `SELECT DISTINCT address FROM (
         SELECT creator_address as address FROM nfts WHERE creator_address IS NOT NULL
         UNION
         SELECT owner_address as address FROM nfts WHERE owner_address IS NOT NULL
       )`
    );

    const addresses = result.rows.map((r) => r.address).filter(Boolean);
    console.log(`[Sync] Found ${addresses.length} wallet(s) to sync`);

    for (const address of addresses) {
      await syncWallet(address);
    }

    console.log('[Sync] Full sync complete');
  } catch (err) {
    console.error('[Sync] Full sync failed:', err.message);
  }
}

// ─── Start background sync interval ─────────────────────────────
let syncInterval = null;

export function startBackgroundSync(intervalMs = 60000) {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // Run initial sync after a short delay (let XRPL connection establish first)
  setTimeout(() => {
    syncAllKnownWallets().catch((err) =>
      console.error('[Sync] Initial sync error:', err.message)
    );
  }, 5000);

  // Schedule recurring syncs
  syncInterval = setInterval(() => {
    syncAllKnownWallets().catch((err) =>
      console.error('[Sync] Background sync error:', err.message)
    );
  }, intervalMs);

  console.log(`[Sync] Background sync started (every ${intervalMs / 1000}s)`);
}

export function stopBackgroundSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('[Sync] Background sync stopped');
  }
}
