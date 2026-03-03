// FILE: src/hooks/useBountyEscrow.js
// Real wagmi v2 hooks for BountyEscrow.sol — ZERO mock
import { useReadContract, useReadContracts, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits } from "viem";
import { useState, useEffect, useCallback } from "react";

const STATUS_MAP = { 0:"Open", 1:"Submitted", 2:"Completed", 3:"Refunded", 4:"Cancelled" };

// Fetch all bounties from chain
export function useAllBounties(contractAddress, abi) {
  const { data: bountyCount, refetch: refetchCount } = useReadContract({
    address: contractAddress, abi, functionName: "bountyCount",
    query: { enabled: !!contractAddress },
  });
  const [bounties, setBounties] = useState([]);
  const [loading, setLoading] = useState(true);
  const count = bountyCount ? Number(bountyCount) : 0;
  const contracts = Array.from({ length: count }, (_, i) => ({
    address: contractAddress, abi, functionName: "getBounty", args: [BigInt(i + 1)],
  }));
  const { data: rawBounties, refetch: refetchBounties } = useReadContracts({
    contracts, query: { enabled: count > 0 },
  });
  useEffect(() => {
    if (!rawBounties) { setLoading(count === 0 ? false : true); return; }
    const parsed = rawBounties.filter(r => r.status === "success" && r.result).map(r => {
      const b = r.result;
      const isETH = Number(b.tokenType) === 0;
      return {
        id: Number(b.id), creator: b.creator, title: b.title, description: b.description,
        reward: isETH ? formatEther(b.reward) : formatUnits(b.reward, 6),
        rewardRaw: b.reward, deadline: Number(b.deadline),
        status: STATUS_MAP[Number(b.status)] || "Open",
        tokenType: isETH ? "ETH" : "USDC", tokenAddress: b.tokenAddress,
        contributor: b.contributor, submissionURI: b.submissionURI,
        tags: b.tags || [], createdAt: Number(b.createdAt),
      };
    });
    setBounties(parsed.reverse());
    setLoading(false);
  }, [rawBounties, count]);
  const refetch = useCallback(() => { refetchCount(); refetchBounties(); }, [refetchCount, refetchBounties]);
  return { bounties, loading, count, refetch };
}

// Create Bounty with ETH
export function useCreateBountyETH(contractAddress, abi) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const createBounty = useCallback(({ title, description, deadline, tags, rewardETH }) => {
    writeContract({
      address: contractAddress, abi, functionName: "createBountyETH",
      args: [title, description, BigInt(Math.floor(new Date(deadline).getTime() / 1000)), tags],
      value: parseEther(rewardETH),
    });
  }, [writeContract, contractAddress, abi]);
  return { createBounty, hash, isPending, isConfirming, isSuccess, error };
}

// Create Bounty with USDC (approve + create)
export function useCreateBountyERC20(contractAddress, usdcAddr, abi, erc20Abi) {
  const { writeContract: doApprove, data: aHash, isPending: aPending } = useWriteContract();
  const { isSuccess: aConfirmed } = useWaitForTransactionReceipt({ hash: aHash });
  const { writeContract: doCreate, data: cHash, isPending: cPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: cHash });
  const approveUSDC = useCallback((amt) => {
    doApprove({ address: usdcAddr, abi: erc20Abi, functionName: "approve", args: [contractAddress, parseUnits(amt, 6)] });
  }, [doApprove, usdcAddr, contractAddress, erc20Abi]);
  const createBounty = useCallback(({ title, description, reward, deadline, tags }) => {
    doCreate({
      address: contractAddress, abi, functionName: "createBountyERC20",
      args: [title, description, parseUnits(reward, 6), BigInt(Math.floor(new Date(deadline).getTime() / 1000)), usdcAddr, tags],
    });
  }, [doCreate, contractAddress, abi, usdcAddr]);
  return { approveUSDC, createBounty, aConfirmed, aPending, cPending, isConfirming, isSuccess, error };
}

// Submit Work
export function useSubmitWork(contractAddress, abi) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const submitWork = useCallback((id, uri) => {
    writeContract({ address: contractAddress, abi, functionName: "submitWork", args: [BigInt(id), uri] });
  }, [writeContract, contractAddress, abi]);
  return { submitWork, hash, isPending, isConfirming, isSuccess, error };
}

// Approve and release payment
export function useApproveSubmission(contractAddress, abi) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const approve = useCallback((id) => {
    writeContract({ address: contractAddress, abi, functionName: "approveSubmission", args: [BigInt(id)] });
  }, [writeContract, contractAddress, abi]);
  return { approve, hash, isPending, isConfirming, isSuccess, error };
}

// Refund expired bounty
export function useRefund(contractAddress, abi) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const refund = useCallback((id) => {
    writeContract({ address: contractAddress, abi, functionName: "refund", args: [BigInt(id)] });
  }, [writeContract, contractAddress, abi]);
  return { refund, hash, isPending, isConfirming, isSuccess, error };
}

// Cancel open bounty
export function useCancelBounty(contractAddress, abi) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  const cancel = useCallback((id) => {
    writeContract({ address: contractAddress, abi, functionName: "cancelBounty", args: [BigInt(id)] });
  }, [writeContract, contractAddress, abi]);
  return { cancel, hash, isPending, isConfirming, isSuccess, error };
}
