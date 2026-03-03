# Base Micro-Bounties Hub

**Small Tasks. Instant On-Chain Payments.**

Decentralized micro-bounty marketplace on Base. Post tasks, lock rewards in on-chain escrow, get paid on approval.

## Tech Stack

- **Contract**: Solidity 0.8.20 + OpenZeppelin
- **Frontend**: Next.js 14 + React 18
- **Web3**: wagmi v2 + viem + RainbowKit v2
- **Chain**: Base Sepolia / Base Mainnet

## Setup (No Terminal Needed)

### 1. Deploy Contract via Remix IDE

1. Open [remix.ethereum.org](https://remix.ethereum.org)
2. Create `BountyEscrow.sol` -> paste from `contracts/BountyEscrow.sol`
3. Compiler: version 0.8.20, optimizer 200 runs -> Compile
4. Deploy tab: Injected Provider (MetaMask)
5. MetaMask -> switch to Base Sepolia
6. Constructor: your wallet address -> Deploy -> confirm
7. Copy deployed contract address
8. Call `whitelistToken(0x036CbD53842c5426634e7929541eC2318f3dCF7e, true)`

### 2. Get WalletConnect ID

1. [cloud.walletconnect.com](https://cloud.walletconnect.com) -> free account
2. Create project -> copy Project ID

### 3. Update Config

Edit `src/config/wagmi.js` -> paste your contract address in `bountyEscrow` field

### 4. Deploy to Vercel

1. Push repo to GitHub
2. [vercel.com](https://vercel.com) -> Add New Project -> import repo
3. Environment Variables:
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` = your project ID
   - `NEXT_PUBLIC_CONTRACT_ADDRESS_TESTNET` = contract address
4. Deploy!

## Features

- RainbowKit wallet connection
- ETH + USDC bounties
- On-chain escrow
- Submit work (GitHub / IPFS)
- Approve and auto-payout
- Refund expired bounties
- 1.5% platform fee
- Zero backend, all on-chain

## Security

- ReentrancyGuard
- SafeERC20
- CEI pattern
- Deadline validation
- Access control

---

Built on [Base](https://base.org)
