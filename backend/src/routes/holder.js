import { Router } from 'express';
import pool from '../db/pool.js';
import * as xrplService from '../services/xrpl.js';

const router = Router();

// ─── Get Holder Portfolio ────────────────────────────────────────
router.get('/:address/portfolio', async (req, res) => {
  try {
    const address = req.params.address;

    // Get owned NFTs
    const nftsResult = await pool.query(
      `SELECT n.*, c.name as company_name
       FROM nfts n
       JOIN companies c ON n.company_id = c.id
       WHERE n.owner_address = $1 AND n.status IN ('owned', 'listed')
       ORDER BY n.created_at DESC`,
      [address]
    );

    // Get live XRP balance
    const balance = await xrplService.getBalance(address);

    // Calculate portfolio stats
    const totalBacking = nftsResult.rows.reduce(
      (sum, nft) => sum + parseFloat(nft.backing_xrp || 0),
      0
    );

    res.json({
      address,
      xrpBalance: balance,
      nfts: nftsResult.rows,
      stats: {
        totalNFTs: nftsResult.rows.length,
        totalBackingValue: totalBacking,
      },
    });
  } catch (err) {
    console.error('Error fetching portfolio:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Redeem NFT for XRP ──────────────────────────────────────────
router.post('/redeem/:nftId', async (req, res) => {
  try {
    const { holderWalletSeed, holderWalletAddress } = req.body;
    const nftId = req.params.nftId;

    if (!holderWalletSeed || !holderWalletAddress) {
      return res.status(400).json({ error: 'Wallet info required' });
    }

    // Get NFT and company info
    const nftResult = await pool.query(
      `SELECT n.*, c.wallet_address as company_wallet, c.wallet_seed as company_seed, c.id as comp_id
       FROM nfts n JOIN companies c ON n.company_id = c.id
       WHERE n.id = $1 AND n.status = 'owned' AND n.owner_address = $2`,
      [nftId, holderWalletAddress]
    );

    if (nftResult.rows.length === 0) {
      return res.status(404).json({ error: 'NFT not found or you are not the owner' });
    }

    const nft = nftResult.rows[0];

    // 1. Burn the NFT
    let burnResult;
    try {
      burnResult = await xrplService.burnNFT(holderWalletSeed, nft.token_id);
    } catch (burnErr) {
      // If holder can't burn (issuer-only burn), use issuer seed
      console.warn('Holder burn failed, trying issuer burn:', burnErr.message);
      burnResult = await xrplService.burnNFT(nft.company_seed, nft.token_id);
    }

    // 2. Release escrow / send backing XRP to holder
    let releaseResult;
    if (nft.escrow_sequence) {
      try {
        releaseResult = await xrplService.finishEscrow(
          nft.company_seed,
          nft.company_wallet,
          nft.escrow_sequence
        );
      } catch (escrowErr) {
        console.warn('Escrow finish failed, using direct payment:', escrowErr.message);
        releaseResult = await xrplService.sendPayment(
          nft.company_seed,
          holderWalletAddress,
          nft.backing_xrp
        );
      }
    } else {
      // No escrow — send payment directly
      releaseResult = await xrplService.sendPayment(
        nft.company_seed,
        holderWalletAddress,
        nft.backing_xrp
      );
    }

    // 3. Update NFT status
    await pool.query(
      `UPDATE nfts SET status = 'redeemed', updated_at = NOW() WHERE id = $1`,
      [nftId]
    );

    // 4. Record redemption
    await pool.query(
      `INSERT INTO redemptions (nft_id, redeemer_address, redemption_type, amount_xrp, burn_tx_hash, escrow_release_tx_hash, status, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [nftId, holderWalletAddress, 'xrp_cashout', nft.backing_xrp, burnResult.txHash, releaseResult.txHash, 'completed']
    );

    // 5. Record transaction
    await pool.query(
      `INSERT INTO transactions (nft_id, tx_type, from_address, to_address, amount_xrp, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nftId, 'redemption', nft.company_wallet, holderWalletAddress, nft.backing_xrp, releaseResult.txHash, 'confirmed']
    );

    // 6. Update company escrow balance
    await pool.query(
      `UPDATE companies SET escrow_balance = escrow_balance - $1, updated_at = NOW() WHERE id = $2`,
      [parseFloat(nft.backing_xrp), nft.comp_id]
    );

    res.json({
      message: 'NFT redeemed successfully!',
      redemption: {
        nftId,
        amountXrp: nft.backing_xrp,
        burnTxHash: burnResult.txHash,
        releaseTxHash: releaseResult.txHash,
      },
    });
  } catch (err) {
    console.error('Error redeeming NFT:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Redemption History ──────────────────────────────────────
router.get('/:address/redemptions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, n.asset_name, n.token_id
       FROM redemptions r
       JOIN nfts n ON r.nft_id = n.id
       WHERE r.redeemer_address = $1
       ORDER BY r.created_at DESC`,
      [req.params.address]
    );
    res.json({ redemptions: result.rows });
  } catch (err) {
    console.error('Error fetching redemptions:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Transaction History ─────────────────────────────────────
router.get('/:address/transactions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, n.asset_name, n.token_id
       FROM transactions t
       JOIN nfts n ON t.nft_id = n.id
       WHERE t.from_address = $1 OR t.to_address = $1
       ORDER BY t.created_at DESC`,
      [req.params.address]
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
