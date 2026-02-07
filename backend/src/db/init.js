import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', '..', 'data.db');

const db = Database(dbPath);
db.pragma('journal_mode = WAL');

const schema = `
-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_seed TEXT,
  xrp_balance REAL DEFAULT 0,
  escrow_balance REAL DEFAULT 0,
  verification_tier TEXT DEFAULT 'unverified',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- NFTs table
CREATE TABLE IF NOT EXISTS nfts (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  token_id TEXT UNIQUE,
  company_id TEXT REFERENCES companies(id),
  asset_type TEXT NOT NULL DEFAULT 'electronics',
  asset_name TEXT NOT NULL,
  asset_description TEXT,
  asset_image_url TEXT,
  metadata_uri TEXT,
  backing_xrp REAL NOT NULL,
  list_price_xrp REAL,
  escrow_id TEXT,
  escrow_sequence INTEGER,
  status TEXT DEFAULT 'minted',
  owner_address TEXT,
  verification_tier TEXT DEFAULT 'unverified',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nft_id TEXT REFERENCES nfts(id),
  tx_type TEXT NOT NULL,
  from_address TEXT,
  to_address TEXT,
  amount_xrp REAL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Redemptions table
CREATE TABLE IF NOT EXISTS redemptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  nft_id TEXT REFERENCES nfts(id),
  redeemer_address TEXT NOT NULL,
  redemption_type TEXT DEFAULT 'xrp_cashout',
  amount_xrp REAL,
  burn_tx_hash TEXT,
  escrow_release_tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_seed TEXT,
  display_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nfts_status ON nfts(status);
CREATE INDEX IF NOT EXISTS idx_nfts_company ON nfts(company_id);
CREATE INDEX IF NOT EXISTS idx_nfts_owner ON nfts(owner_address);
CREATE INDEX IF NOT EXISTS idx_transactions_nft ON transactions(nft_id);
CREATE INDEX IF NOT EXISTS idx_redemptions_nft ON redemptions(nft_id);
`;

try {
  console.log('Initializing SQLite database...');
  db.exec(schema);
  console.log('Database initialized successfully at:', dbPath);
} catch (err) {
  console.error('Error initializing database:', err);
  process.exit(1);
} finally {
  db.close();
}
