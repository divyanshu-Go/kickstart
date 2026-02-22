# Kickstart — Decentralized Crowdfunding

A blockchain-based crowdfunding platform built on Ethereum (Sepolia testnet). Campaigns are smart contracts — every contribution, vote, and fund transfer is on-chain and transparent.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Smart Contracts | Solidity 0.8.30 |
| Frontend | Next.js, React |
| Blockchain connection | Web3.js |
| Wallet | MetaMask / WalletConnect |
| Network | Sepolia Testnet |
| Styling | CSS Modules |

---

## How It Works

1. **Manager** deploys a campaign contract with a title, goal, minimum contribution, and deadline
2. **Contributors** send ETH above the minimum — they become voters
3. **Manager** creates spending requests (with description, amount, recipient, proof link)
4. **Contributors** vote to approve each request
5. Once **>50% approve**, the manager finalizes — ETH transfers directly to the recipient

No intermediaries. No escrow. Everything enforced by the contract.

---

## Project Structure

```
├── ethereum/
│   ├── contracts/
│   │   └── Campaign.sol       # Factory + Campaign contracts
│   ├── compile.js             # Solidity compiler script
│   ├── deploy.mjs             # Deployment script
│   ├── factory.js             # Factory contract instance
│   ├── campaign.js            # Campaign contract instance
│   └── web3.js                # Web3 provider (SSR-safe)
│
├── pages/
│   ├── index.js               # Home — campaign discovery
│   ├── campaigns/
│   │   ├── new.js             # Create campaign (4-step form)
│   │   └── [address]/
│   │       ├── index.js       # Campaign detail
│   │       └── requests/
│   │           ├── index.js   # Spending requests + voting
│   │           └── new.js     # Create spending request
│
├── component/
│   ├── Header.js              # Navbar with wallet connect
│   ├── Layout.js              # Page wrapper
│   └── WalletModal.js         # Wallet connection modal
│
└── styles/                    # CSS Modules per component
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- MetaMask browser extension
- Sepolia ETH (free from any Sepolia faucet)

### Install

```bash
git clone <your-repo-url>
cd kickstart
npm install
```

### Compile & Deploy Contracts

```bash
# Compile
node ethereum/compile.js

# Deploy to Sepolia
node ethereum/deploy.mjs
```

Copy the deployed factory address into `ethereum/factory.js`.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Smart Contract — Key Functions

| Function | Who | Description |
|----------|-----|-------------|
| `createCampaign()` | Anyone | Deploys a new Campaign contract |
| `contribute()` | Anyone | Send ETH, become a voter |
| `createRequest()` | Manager | Propose a fund withdrawal |
| `approveRequest()` | Contributors | Vote to approve a request |
| `finalizeRequest()` | Manager | Transfer ETH once majority approved |
| `getSummary()` | View | Returns all campaign data in one call |
| `getRequest()` | View | Returns full request data including proof link |

---

## Environment

No `.env` needed. The factory address lives in `ethereum/factory.js`. Web3 uses MetaMask's injected provider on the client and Infura as a read-only fallback on the server.

