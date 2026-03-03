import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { baseSepolia, base } from "wagmi/chains";

export const CONTRACTS = {
  [baseSepolia.id]: {
    bountyEscrow: "0xC9fe8831242905B5C9215F8529EC1817c0E16c26",
    usdc: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  },
  [base.id]: {
    bountyEscrow: "",
    usdc: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
};

export const config = getDefaultConfig({
  appName: "Base Micro-Bounties Hub",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "",
  chains: [baseSepolia, base],
  ssr: true,
});

export const STATUS_MAP = { 0: "Open", 1: "Submitted", 2: "Completed", 3: "Refunded", 4: "Cancelled" };
export const TOKEN_TYPE_MAP = { 0: "ETH", 1: "ERC20" };

export function getContractAddress(chainId) {
  return CONTRACTS[chainId]?.bountyEscrow || "";
}
export function getUsdcAddress(chainId) {
  return CONTRACTS[chainId]?.usdc || "";
}
export function shortenAddress(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}
export function formatDeadline(ts) {
  return new Date(Number(ts) * 1000).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
