import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import companyRoutes from './routes/company.js';
import marketplaceRoutes from './routes/marketplace.js';
import holderRoutes from './routes/holder.js';
import walletRoutes from './routes/wallet.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/company', companyRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/holder', holderRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const { default: pool } = await import('./db/pool.js');
    const [companies, nfts, transactions, redemptions] = await Promise.all([
      pool.query('SELECT COUNT(*) as cnt FROM companies'),
      pool.query('SELECT COUNT(*) as cnt FROM nfts'),
      pool.query('SELECT COUNT(*) as cnt FROM transactions'),
      pool.query('SELECT COUNT(*) as cnt FROM redemptions'),
    ]);

    const totalBacking = await pool.query("SELECT COALESCE(SUM(backing_xrp), 0) as total FROM nfts WHERE status != 'redeemed'");

    res.json({
      companies: parseInt(companies.rows[0]?.cnt || 0),
      nfts: parseInt(nfts.rows[0]?.cnt || 0),
      transactions: parseInt(transactions.rows[0]?.cnt || 0),
      redemptions: parseInt(redemptions.rows[0]?.cnt || 0),
      totalBackingXrp: parseFloat(totalBacking.rows[0]?.total || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   Digital Asset Tartan - Backend Server      ║
  ║   Running on http://localhost:${PORT}           ║
  ║   XRPL: Testnet                              ║
  ╚══════════════════════════════════════════════╝
  `);
});
