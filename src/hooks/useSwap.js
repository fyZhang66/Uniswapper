// src/hooks/useSwap.js
import { useState } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { ROUTER_ABI, CONTRACTS } from '../constants/contracts';
import { useToken } from './useToken';

export function useSwap(tokenIn, tokenOut) {
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  const [txHash, setTxHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const tokenInDetails = useToken(tokenIn);
  const tokenOutDetails = useToken(tokenOut);

  const {address} = useAccount();

  // Get amounts out prediction
  const { data: amountsOutData, refetch: fetchAmountsOut } = useReadContract({
    address: CONTRACTS.ROUTER,
    abi: ROUTER_ABI,
    functionName: 'getAmountsOut',
    args: [
      amountIn && tokenInDetails.decimals 
        ? parseUnits(amountIn, tokenInDetails.decimals) 
        : BigInt(0),
      [tokenIn, tokenOut]
    ],
    enabled: !!amountIn && !!tokenIn && !!tokenOut && Number(amountIn) > 0,
  });

  // Handle swap transaction
  const { writeContract: swap, isPending: isSwapPending } = useWriteContract();
  const { isLoading: isWaitingForTx } = useWaitForTransactionReceipt({
    hash: txHash,
    onSuccess: () => {
      setIsLoading(false);
      tokenInDetails.refetchBalance();
      tokenOutDetails.refetchBalance();
    },
  });

  const executeSwap = async () => {
    if (!tokenIn || !tokenOut || !amountIn || Number(amountIn) <= 0 || !amountsOutData) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse input amount
      const parsedAmountIn = parseUnits(amountIn, tokenInDetails.decimals);
      
      // Calculate minimum output with slippage
      const minAmountOut = amountsOutData[1] * BigInt(Math.floor((100 - slippage) * 100)) / BigInt(10000);
      
      // Set deadline to 20 minutes from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      // Execute swap
      const hash = await swap({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          parsedAmountIn,
          minAmountOut,
          [tokenIn, tokenOut],
          address, // recipient address
          deadline,
        ],
      });
      
      setTxHash(hash);
    } catch (err) {
      console.error('Swap error:', err);
      setError(err.message || 'Failed to execute swap');
      setIsLoading(false);
    }
  };

  // Update amount out when amountsOutData changes
  useState(() => {
    if (amountsOutData && amountsOutData.length >= 2 && tokenOutDetails.decimals) {
      setAmountOut(formatUnits(amountsOutData[1], tokenOutDetails.decimals));
    } else {
      setAmountOut('');
    }
  }, [amountsOutData, tokenOutDetails.decimals]);

  // Handle input amount change
  const handleAmountInChange = (value) => {
    setAmountIn(value);
    fetchAmountsOut();
  };

  return {
    amountIn,
    amountOut,
    slippage,
    setSlippage,
    handleAmountInChange,
    executeSwap,
    isSwapPending: isSwapPending || isWaitingForTx,
    isLoading,
    error,
    txHash,
  };
}