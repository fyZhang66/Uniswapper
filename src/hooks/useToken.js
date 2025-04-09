// src/hooks/useToken.js
import { useState, useEffect } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { readContract } from 'wagmi/actions';
import config from '../config/wagmiConfig';

import { formatUnits, parseUnits } from "viem";
import { ERC20_ABI } from "../constants/contracts";

export function useToken(tokenAddress) {
  const [balance, setBalance] = useState(null);
  const [formattedBalance, setFormattedBalance] = useState("");
  const [decimals, setDecimals] = useState(18);
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");

  const { address } = useAccount();

  // Read token decimals
  const { data: decimalsData } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "decimals",
    enabled: !!tokenAddress,
  });

  // Read token symbol
  const { data: symbolData } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "symbol",
    enabled: !!tokenAddress,
  });

  // Read token name
  const { data: nameData } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "name",
    enabled: !!tokenAddress,
  });

  // Read token balance
  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [address],
    watch: false,
    enabled: !!tokenAddress && !!address,
  });

  // Check token allowance
  const checkAllowance = async (ownerAddress, spenderAddress) => {
    if (!tokenAddress || !ownerAddress || !spenderAddress) return BigInt(0);
  
    try {
      // For wagmi v2, readContract returns the data directly
      const allowance = await readContract(config, {
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: "allowance",
        watch: false,
        args: [ownerAddress, spenderAddress],
      });
      
      return allowance || BigInt(0);
    } catch (error) {
      console.error("Error checking allowance:", error);
      return BigInt(0);
    }
  };

  // Approve token
  const { writeContract: approveToken, isPending: isApproving } =
    useWriteContract();
    
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
    if (decimalsData !== undefined) {
      setDecimals(Number(decimalsData));
    }
  }, [decimalsData]);

  useEffect(() => {
    if (symbolData) {
      setSymbol(symbolData);
    }
  }, [symbolData]);

  useEffect(() => {
    if (nameData) {
      setName(nameData);
    }
  }, [nameData]);

  useEffect(() => {
    if (balanceData) {
      setBalance(balanceData);
      setFormattedBalance(formatUnits(balanceData, decimals));
    }
  }, [balanceData, decimals]);

  // Refresh balance on address or token change, and every 15 seconds
  // useEffect(() => {
  //   if (tokenAddress && address) {
  //     // Initial fetch
  //     refetchBalance();
      
  //     // Set up periodic refresh
  //     const intervalId = setInterval(() => {
  //       refetchBalance();
  //     }, 15000); // 15 seconds
      
  //     return () => clearInterval(intervalId);
  //   }
  // }, [tokenAddress, address, refetchBalance]);

  return {
    balance,
    formattedBalance,
    decimals,
    symbol,
    name,
    checkAllowance,
    approveSpender,
    isApproving,
    refetchBalance,
  };
}