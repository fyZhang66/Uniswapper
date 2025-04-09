import { useState, useEffect, useRef } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { readContract } from '@wagmi/core'
import { parseUnits, formatUnits } from 'viem';
import { 
  ROUTER_ABI, 
  FACTORY_ABI, 
  PAIR_ABI, 
  CONTRACTS 
} from '../constants/contracts';
import { useToken } from './useToken';
import config from '../config/wagmiConfig';

export function useSwap(tokenInAddress, tokenOutAddress) {
  const [pairAddress, setPairAddress] = useState(null);
  const [pairExists, setPairExists] = useState(false);
  const [reserves, setReserves] = useState(null);
  const [isTokenInToken0, setIsTokenInToken0] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [estimatedOutput, setEstimatedOutput] = useState(null);

  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Track if we've already fetched the data
  const initialFetchDone = useRef(false);

  const { address } = useAccount();
  const tokenIn = useToken(tokenInAddress);
  const tokenOut = useToken(tokenOutAddress);

  // Get pair address from factory
  const { data: pairAddressData, refetch: refetchPair } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenInAddress, tokenOutAddress],
    enabled: !!tokenInAddress && !!tokenOutAddress && !initialFetchDone.current,
  });

  // Read pair reserves
  const { data: reservesData, refetch: refetchReserves } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' && pairExists,
  });

  // Get token0 of the pair to determine the order
  const { data: token0Address } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'token0',
    enabled: !!pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000' && pairExists,
  });

  // Handle write contracts
  const { writeContractAsync: swapTx } = useWriteContract();
  
  // One-time initialization effect
  useEffect(() => {
    if (!initialFetchDone.current && tokenInAddress && tokenOutAddress) {
      refetchPair();
      initialFetchDone.current = true;
    }
  }, [tokenInAddress, tokenOutAddress, refetchPair]);

  // Update pair address when data changes
  useEffect(() => {
    if (pairAddressData) {
      setPairAddress(pairAddressData);
      setPairExists(pairAddressData !== '0x0000000000000000000000000000000000000000');
      
      if (pairAddressData !== '0x0000000000000000000000000000000000000000') {
        refetchReserves();
      }
    } else {
      setPairAddress(null);
      setPairExists(false);
    }
  }, [pairAddressData, refetchReserves]);

  // Update token order when token0 is known
  useEffect(() => {
    if (token0Address && tokenInAddress) {
      setIsTokenInToken0(token0Address.toLowerCase() === tokenInAddress.toLowerCase());
    }
  }, [token0Address, tokenInAddress]);

  // Update reserves when data changes
  useEffect(() => {
    if (reservesData && reservesData.length >= 2) {
      const reserve0 = reservesData[0];
      const reserve1 = reservesData[1];
      
      const reserveIn = isTokenInToken0 ? reserve0 : reserve1;
      const reserveOut = isTokenInToken0 ? reserve1 : reserve0;
      
      setReserves({
        reserve0: formatUnits(reserve0, 18),
        reserve1: formatUnits(reserve1, 18),
        reserveIn: formatUnits(reserveIn, tokenIn.decimals || 18),
        reserveOut: formatUnits(reserveOut, tokenOut.decimals || 18),
        reserveInBigInt: reserveIn,
        reserveOutBigInt: reserveOut,
      });
    } else {
      setReserves(null);
    }
  }, [reservesData, isTokenInToken0, tokenIn.decimals, tokenOut.decimals]);

  // Calculate output amount based on input amount
  const calculateOutputAmount = async (inputAmount) => {
    if (!pairExists || !inputAmount || Number(inputAmount) <= 0 || !tokenInAddress || !tokenOutAddress) {
      setEstimatedOutput(null);
      return null;
    }
    
    try {
      // Using router's getAmountsOut function
      const amountIn = parseUnits(inputAmount.toString(), tokenIn.decimals || 18);
      console.log('Amount In:', amountIn);
      
      // Make a direct contract read without using hooks
      const amounts = await readContract(config, {
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountIn, [tokenInAddress, tokenOutAddress]],
      });
      
      if (!amounts || !amounts[1]) {
        console.error('Invalid response from getAmountsOut:', amounts);
        setEstimatedOutput(null);
        return null;
      }
      
      console.log('Amounts:', amounts);
      
      const amountOut = amounts[1];
      const formatted = formatUnits(amountOut, tokenOut.decimals || 18);
      setEstimatedOutput(formatted);
      return formatted;
    } catch (err) {
      console.error('Error calculating output amount:', err);
      setEstimatedOutput(null);
      return null;
    }
  };

  // Swap tokens
  const swap = async (inputAmount, slippageTolerance) => {
    if (!tokenInAddress || !tokenOutAddress || !inputAmount || !address || !pairExists) {
      return;
    }

    setIsSwapping(true);
    setError(null);
    setSuccess(false);

    try {
      // Parse input amount
      const amountIn = parseUnits(inputAmount.toString(), tokenIn.decimals || 18);
      
      // Get expected output amount using direct contract read
      const amounts = await readContract(config, {
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'getAmountsOut',
        args: [amountIn, [tokenInAddress, tokenOutAddress]],
      });
      
      if (!amounts || !amounts[1]) {
        throw new Error('Failed to get expected output amount');
      }
      
      console.log(amounts, "amounts1----");
      
      const expectedAmountOut = amounts[1];
      
      // Calculate minimum output with slippage tolerance
      const minAmountOut = (expectedAmountOut * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);
      
      // Set deadline to 20 minutes from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      // Approve token spending
      console.log(`Approving ${tokenIn.symbol}...`);
      await tokenIn.approveSpender(CONTRACTS.ROUTER, inputAmount);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for approval

      // Execute swap
      console.log('Swapping tokens...');
      await swapTx({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountIn,
          minAmountOut,
          [tokenInAddress, tokenOutAddress],
          address,
          deadline
        ],
      });

      setSuccess(true);

      // Wait for transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update balances
      tokenIn.refetchBalance();
      tokenOut.refetchBalance();
      refetchReserves();
    } catch (err) {
      console.error('Error swapping tokens:', err);
      setError(err.message || 'Failed to swap tokens');
    } finally {
      setIsSwapping(false);
    }
  };

  // Calculate price impact
  const calculatePriceImpact = (inputAmount) => {
    if (!pairExists || !reserves || !inputAmount || Number(inputAmount) <= 0) {
      return null;
    }

    try {
      const { reserveInBigInt, reserveOutBigInt } = reserves;
      
      // Convert input to BigInt
      const amountIn = parseUnits(inputAmount.toString(), tokenIn.decimals || 18);
      
      // Calculate output using x * y = k formula
      const amountInWithFee = amountIn * BigInt(997); // 0.3% fee
      const numerator = amountInWithFee * reserveOutBigInt;
      const denominator = reserveInBigInt * BigInt(1000) + amountInWithFee;
      const amountOut = numerator / denominator;
      
      // Calculate price before swap (reserveOut / reserveIn)
      const priceBefore = (reserveOutBigInt * BigInt(10**18)) / reserveInBigInt;
      
      // Calculate price after swap ((reserveOut - amountOut) / (reserveIn + amountIn))
      const priceAfter = ((reserveOutBigInt - amountOut) * BigInt(10**18)) / (reserveInBigInt + amountIn);
      
      // Calculate price impact
      const impact = (priceBefore - priceAfter) * BigInt(10000) / priceBefore;
      
      return Number(impact) / 100; // Convert to percentage
    } catch (err) {
      console.error('Error calculating price impact:', err);
      return null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    pairExists,
    reserves,
    estimatedOutput,
    isSwapping,
    error,
    success,
    swap,
    calculateOutputAmount,
    calculatePriceImpact,
  };
} 