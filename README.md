# Digital Asset Tartan (DAT)

**Asset-Backed NFTs on the XRP Ledger**

Transform real-world assets into verifiable, tradeable NFTs backed by XRP escrow. Mint, trade, and redeem with full transparency on XRPL Testnet.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ ([download](https://nodejs.org))
- **PostgreSQL** running locally ([download](https://www.postgresql.org/download/) or `brew install postgresql`)

### 1. Install Dependencies

```bash
# From project root
npm run install:all
```

### 2. Set Up Database

```bash
# Create the database
createdb digital_asset_tartan

# Initialize schema
npm run db:init
```

### 3. Configure Environment

The backend `.env` file is pre-configured for local development. Edit `backend/.env` if needed:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/digital_asset_tartan
XRPL_NETWORK=wss://s.altnet.rippletest.net:51233
PORT=3001
```

### 4. Start the App

```bash
# Start both backend and frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001

---

## Demo Flow

### 1. Company Mints NFTs (TechCorp)

1. Go to **Wallet** → Create a new testnet wallet (~100 XRP funded)
2. Go to **Company** → Register "TechCorp" (creates a separate company wallet)
3. Fill in the mint form:
   - Asset Name: "iPhone 15 Pro"
   - Backing: 50 XRP per NFT
   - List Price: 60 XRP
   - Quantity: 3
4. Click **Mint & List NFTs** → NFTs appear on the marketplace

### 2. Buyer Purchases NFT

1. Disconnect the company wallet
2. Create a **new buyer wallet** (gets ~100 XRP)
3. Go to **Marketplace** → Browse listed NFTs
4. Click an NFT → **Buy for 60 XRP**
5. NFT is now in the buyer's portfolio

### 3. Holder Redeems NFT

1. Go to **Portfolio** → See owned NFTs
2. Click an NFT → **Redeem for 50 XRP**
3. NFT is burned on XRPL → 50 XRP backing released to the holder
4. View redemption history in the Portfolio tab

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌──────────────┐
│   React + Vite   │────▶│  Express API    │────▶│  XRPL Testnet │
│   TailwindCSS    │     │  Node.js        │     │  NFTs + Escrow │
└─────────────────┘     └────────┬────────┘     └──────────────┘
                                 │
                         ┌───────▼────────┐
                         │   PostgreSQL    │
                         │  (off-chain)    │
                         └────────────────┘
```

### Backend API Routes

| Endpoint | Description |
|---|---|
| `POST /api/company/register` | Register company + create XRPL wallet |
| `POST /api/company/:id/mint` | Deposit XRP, mint NFTs, create sell offers |
| `GET /api/marketplace` | Browse listed NFTs |
| `POST /api/marketplace/:id/buy` | Purchase NFT (accept sell offer) |
| `GET /api/holder/:addr/portfolio` | View owned NFTs + balance |
| `POST /api/holder/redeem/:nftId` | Burn NFT + release XRP backing |
| `POST /api/wallet/create` | Create funded testnet wallet |
| `POST /api/wallet/login` | Login with wallet seed |

### Key XRPL Operations

- **NFTokenMint** — Mint burnable, transferable NFTs with metadata URI
- **NFTokenCreateOffer** — List NFT for sale at fixed XRP price
- **NFTokenAcceptOffer** — Buyer accepts sell offer (atomic swap)
- **NFTokenBurn** — Destroy NFT on redemption
- **EscrowCreate** — Lock XRP backing in escrow
- **Payment** — Release XRP to redeemer

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 6, TailwindCSS 4 |
| Backend | Node.js, Express |
| Blockchain | XRPL Testnet (xrpl.js v4) |
| Database | PostgreSQL |
| Icons | Lucide React |

---

## Project Structure

```
DigitalAssetTartan/
├── backend/
│   └── src/
│       ├── server.js          # Express server
│       ├── db/
│       │   ├── pool.js        # PostgreSQL connection
│       │   └── init.js        # Schema initialization
│       ├── routes/
│       │   ├── company.js     # Company registration & minting
│       │   ├── marketplace.js # Browse & purchase NFTs
│       │   ├── holder.js      # Portfolio & redemption
│       │   └── wallet.js      # Wallet management
│       └── services/
│           ├── xrpl.js        # XRPL blockchain operations
│           └── ipfs.js        # Metadata pinning (mock/Pinata)
├── frontend/
│   └── src/
│       ├── App.jsx            # Router & providers
│       ├── pages/
│       │   ├── Home.jsx       # Landing page
│       │   ├── CompanyDashboard.jsx
│       │   ├── Marketplace.jsx
│       │   ├── NFTDetail.jsx
│       │   ├── Portfolio.jsx
│       │   └── WalletPage.jsx
│       ├── components/
│       │   ├── Layout.jsx     # Nav, header, footer
│       │   ├── NFTCard.jsx
│       │   ├── StatusBadge.jsx
│       │   └── LoadingSpinner.jsx
│       ├── hooks/
│       │   └── useWallet.jsx  # Wallet context & state
│       └── services/
│           └── api.js         # API client
└── README.md
```

---

## Hackathon Notes

- **Testnet Only** — All XRP operations use the XRPL Testnet faucet
- **Wallet Seeds** — Stored in localStorage for demo convenience (not production-safe)
- **IPFS Mock** — Metadata is simulated unless Pinata keys are provided
- **Escrow Simplified** — Direct payments used as fallback when escrow timing constraints apply
- **No Order Book** — Simple list-and-buy model
