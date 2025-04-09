// src/hooks/useToken.js
import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { TOKEN_LIST } from '../constants/tokens';

import { formatUnits, parseUnits } from "viem";
import { ERC20_ABI } from "../constants/contracts";

export function useToken(tokenAddress) {
  const [balance, setBalance] = useState(null);
  const [formattedBalance, setFormattedBalance] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");

  const { address } = useAccount();

  // Get token info from TOKEN_LIST
  const tokenInfo = TOKEN_LIST.find(token => token.address.toLowerCase() === tokenAddress?.toLowerCase());
  
  // Set decimals from token info if available
  useEffect(() => {
    if (tokenInfo) {
      setDecimals(tokenInfo.decimals);
      setSymbol(tokenInfo.symbol);
      setName(tokenInfo.name);
    }
  }, [tokenInfo]);

  // Read token balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
    watch: false,
    enabled: !!tokenAddress && !!address,
  });

  // Approve token
  const { writeContractAsync: approveToken, isPending: isApproving } = useWriteContract();
    
  const approveSpender = async (spenderAddress, amount) => {
    if (!tokenAddress || !spenderAddress) return;

    const parsedAmount = parseUnits(amount.toString(), decimals);
    return approveToken({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [spenderAddress, parsedAmount],
    });
  };

  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData);
      setFormattedBalance(formatUnits(balanceData, decimals));
    }
  }, [balanceData, decimals]);

  return {
    balance,
    formattedBalance,
    decimals,
    symbol,
    name,
    approveSpender,
    isApproving,
    refetchBalance,
  };
}