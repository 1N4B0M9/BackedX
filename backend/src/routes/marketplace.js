import { Router } from 'express';
import pool from '../db/pool.js';
import * as xrplService from '../services/xrpl.js';

const router = Router();

// ─── Browse Listed NFTs ──────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { assetType, minBacking, maxPrice, sort } = req.query;

    let query = `
      SELECT n.*, c.name as company_name, c.verification_tier as company_tier
      FROM nfts n
      JOIN companies c ON n.company_id = c.id
      WHERE n.status = 'listed'
    `;
    const params = [];

    if (assetType) {
      params.push(assetType);
      query += ` AND n.asset_type = $${params.length}`;
    }

    if (minBacking) {
      params.push(parseFloat(minBacking));
      query += ` AND n.backing_xrp >= $${params.length}`;
    }

    if (maxPrice) {
      params.push(parseFloat(maxPrice));
      query += ` AND n.list_price_xrp <= $${params.length}`;
    }

    switch (sort) {
      case 'price_asc':
        query += ' ORDER BY n.list_price_xrp ASC';
        break;
      case 'price_desc':
        query += ' ORDER BY n.list_price_xrp DESC';
        break;
      case 'backing_desc':
        query += ' ORDER BY n.backing_xrp DESC';
        break;
      default:
        query += ' ORDER BY n.created_at DESC';
    }

    const result = await pool.query(query, params);
    res.json({ nfts: result.rows });
  } catch (err) {
    console.error('Error browsing marketplace:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Get Single NFT Detail ──────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, c.name as company_name, c.verification_tier as company_tier,
              c.wallet_address as company_wallet
       FROM nfts n
       JOIN companies c ON n.company_id = c.id
       WHERE n.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'NFT not found' });
    }

    // Get transaction history
    const txResult = await pool.query(
      `SELECT * FROM transactions WHERE nft_id = $1 ORDER BY created_at DESC`,
      [req.params.id]
    );

    res.json({
      nft: result.rows[0],
      transactions: txResult.rows,
    });
  } catch (err) {
    console.error('Error fetching NFT detail:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Purchase NFT ───────────────────────────────────────────────
router.post('/:id/buy', async (req, res) => {
  try {
    const { buyerWalletAddress, buyerWalletSeed } = req.body;
    const nftId = req.params.id;

    if (!buyerWalletAddress || !buyerWalletSeed) {
      return res.status(400).json({ error: 'Buyer wallet info required' });
    }

    // Get NFT
    const nftResult = await pool.query(
      `SELECT n.*, c.wallet_address as company_wallet, c.wallet_seed as company_seed
       FROM nfts n JOIN companies c ON n.company_id = c.id
       WHERE n.id = $1 AND n.status = 'listed'`,
      [nftId]
    );

    if (nftResult.rows.length === 0) {
      return res.status(404).json({ error: 'NFT not found or not available' });
    }

    const nft = nftResult.rows[0];

    // Get sell offers for this NFT
    let sellOffers = [];
    if (nft.token_id) {
      sellOffers = await xrplService.getSellOffers(nft.token_id);
    }

    let purchaseTx;

    if (sellOffers.length > 0) {
      // Accept the sell offer on XRPL
      purchaseTx = await xrplService.acceptSellOffer(buyerWalletSeed, sellOffers[0].nft_offer_index);
    } else {
      // Fallback: direct payment for demo
      purchaseTx = await xrplService.sendPayment(
        buyerWalletSeed,
        nft.company_wallet,
        nft.list_price_xrp
      );
    }

    // Update NFT ownership
    await pool.query(
      `UPDATE nfts SET status = 'owned', owner_address = $1, updated_at = NOW() WHERE id = $2`,
      [buyerWalletAddress, nftId]
    );

    // Record transaction
    await pool.query(
      `INSERT INTO transactions (nft_id, tx_type, from_address, to_address, amount_xrp, tx_hash, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [nftId, 'purchase', buyerWalletAddress, nft.company_wallet, nft.list_price_xrp, purchaseTx.txHash, 'confirmed']
    );

    // Update or create user record
    await pool.query(
      `INSERT INTO users (wallet_address, wallet_seed, display_name)
       VALUES ($1, $2, $3)
       ON CONFLICT (wallet_address) DO NOTHING`,
      [buyerWalletAddress, buyerWalletSeed, `Buyer_${buyerWalletAddress.slice(-6)}`]
    );

    res.json({
      message: 'NFT purchased successfully',
      txHash: purchaseTx.txHash,
      nft: {
        id: nftId,
        tokenId: nft.token_id,
        owner: buyerWalletAddress,
      },
    });
  } catch (err) {
    console.error('Error purchasing NFT:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
