import { Router } from 'express';
import { syncWallet, syncNFT, syncAllKnownWallets } from '../services/sync.js';

const router = Router();

// ─── Sync a specific wallet's on-chain state ────────────────────
router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    if (!address || address.length < 20) {
      return res.status(400).json({ error: 'Valid wallet address required' });
    }

    await syncWallet(address);
    res.json({ message: `Sync complete for ${address}` });
  } catch (err) {
    console.error('Sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Sync a single NFT by token ID ─────────────────────────────
router.get('/nft/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    if (!tokenId) {
      return res.status(400).json({ error: 'Token ID required' });
    }

    await syncNFT(tokenId);
    res.json({ message: `Sync complete for NFT ${tokenId.slice(0, 12)}...` });
  } catch (err) {
    console.error('NFT sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Sync all known wallets ─────────────────────────────────────
router.post('/all', async (req, res) => {
  try {
    await syncAllKnownWallets();
    res.json({ message: 'Full sync complete' });
  } catch (err) {
    console.error('Full sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
