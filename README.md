# 0G Notary

Decentralized document notarization powered by [0G Network](https://0g.ai).

Upload any file to 0G's permanent decentralized storage, then your wallet signs an on-chain transaction recording the document's content hash, your address, and a block timestamp. The result is an immutable, verifiable certificate — cryptographic proof that this exact document existed at this exact time, with no middleman.

## How It Works

1. **Upload** — your file is stored permanently on 0G decentralized storage
2. **Notarize** — your wallet signs an on-chain transaction recording the content hash + timestamp
3. **Verify** — anyone can verify the document's authenticity by looking up its hash on-chain

---

## Prerequisites

- Node.js 18+
- A Web3 wallet (MetaMask or any injected wallet)
- Testnet OG tokens — get them free at [faucet.0g.ai](https://faucet.0g.ai)
- A funded deployer private key for the server-side storage upload

---

## Setup

### 1. Install dependencies

```bash
cd 0g-vibe-hackathon
npm install
```

### 2. Configure environment

```bash
cp packages/web/.env.example packages/web/.env.local
```

Open `packages/web/.env.local` and fill in:

```env
NEXT_PUBLIC_RPC_URL=https://evmrpc-testnet.0g.ai
STORAGE_INDEXER_RPC=https://indexer-storage-testnet-turbo.0g.ai

# Your deployer/server private key (never exposed to the browser)
# Used to pay for 0G storage uploads and to deploy the contract
PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Populated automatically after `npm run deploy` — leave blank for now
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

> Get testnet OG at [faucet.0g.ai](https://faucet.0g.ai). You need a small amount for contract deployment and storage uploads.

### 3. Deploy the Notary smart contract

```bash
npm run deploy
```

This compiles and deploys `Notary.sol` to the 0G Galileo Testnet and automatically writes the contract address into `packages/web/.env.local`.

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Using the App

### Notarize a document

1. Connect your wallet (MetaMask or injected)
2. Go to the **Notarize** tab
3. Drop any file or click to browse
4. The file uploads to 0G storage — you'll see its root hash
5. Optionally add a description, then click **Notarize on Chain**
6. Approve the transaction in your wallet
7. Once confirmed, you receive a certificate with a shareable verify link

### Verify a document

1. Go to the **Verify** tab
2. Paste a root hash (from a certificate or shared link)
3. Click **Verify** — the on-chain record shows who notarized it and when
4. Optionally download the original file from 0G storage

### My Records

Connect your wallet and open the **My Records** tab to see your full notarization history, pulled directly from the blockchain.

### Sharing

Every certificate includes a **Share Verify Link** button. The link opens the app with the Verify tab pre-loaded — anyone can confirm the document's provenance without a wallet.

---

## Project Structure

```
packages/
  contracts/
    contracts/
      Notary.sol          # On-chain notarization registry
    scripts/
      deploy.ts           # Deploys Notary, writes address to .env.local
    hardhat.config.ts
  web/
    app/
      page.tsx            # Main page with tab navigation
      api/upload/         # Server-side 0G storage upload
      api/download/       # Server-side 0G storage download
    components/
      NotarizeTab.tsx     # Upload + on-chain notarize flow
      VerifyTab.tsx       # Look up any document by root hash
      MyDocsTab.tsx       # Wallet's notarization history
      CertCard.tsx        # Reusable notarization certificate card
      Navbar.tsx          # Wallet connect/disconnect
    lib/
      notary.ts           # Notary ABI + helper functions
      0g-storage.ts       # Upload/download wrappers
      wagmi.ts            # Wagmi config for 0G Galileo Testnet
```

---

## Network

| | |
|---|---|
| Network | 0G Galileo Testnet |
| Chain ID | 16602 |
| RPC | https://evmrpc-testnet.0g.ai |
| Explorer | https://chainscan-galileo.0g.ai |
| Faucet | https://faucet.0g.ai |

---

## Resources

- [0G Docs](https://docs.0g.ai)
- [0G TS SDK](https://www.npmjs.com/package/@0glabs/0g-ts-sdk)
- [0G Explorer](https://chainscan-galileo.0g.ai)
- [Faucet](https://faucet.0g.ai)
