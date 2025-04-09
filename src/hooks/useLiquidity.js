// src/hooks/useLiquidity.js
import { useState, useEffect, useRef } from 'react';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { 
  ROUTER_ABI, 
  FACTORY_ABI, 
  PAIR_ABI, 
  CONTRACTS 
} from '../constants/contracts';
import { useToken } from './useToken';

export function useLiquidity(tokenAAddress, tokenBAddress) {
  const [pairAddress, setPairAddress] = useState(null);
  const [pairExists, setPairExists] = useState(false);
  const [reserves, setReserves] = useState(null);
  const [isTokenAToken0, setIsTokenAToken0] = useState(true);
  const [lpTokenBalance, setLpTokenBalance] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState(null);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [success, setSuccess] = useState(false);

  // Track if component is mounted
  const isMounted = useRef(true);
  
  // Track if we've already fetched the data
  const initialFetchDone = useRef(false);

  const { address } = useAccount();
  const tokenA = useToken(tokenAAddress);
  const tokenB = useToken(tokenBAddress);

  // Get pair address from factory
  const { data: pairAddressData, refetch: refetchPair } = useReadContract({
    address: CONTRACTS.FACTORY,
    abi: FACTORY_ABI,
    functionName: 'getPair',
    args: [tokenAAddress, tokenBAddress],
    enabled: !!tokenAAddress && !!tokenBAddress && !initialFetchDone.current,
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

  // Get LP token balance
  const { data: lpBalance, refetch: refetchLpBalance } = useReadContract({
    address: pairAddress,
    abi: PAIR_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!pairAddress && !!address && pairAddress !== '0x0000000000000000000000000000000000000000' && pairExists,
  });

  // Handle write contracts
  const { writeContractAsync: addLiquidityTx } = useWriteContract();


  // One-time initialization effect
  useEffect(() => {
    if (!initialFetchDone.current && tokenAAddress && tokenBAddress) {
      refetchPair();
      initialFetchDone.current = true;
    }
  }, [tokenAAddress, tokenBAddress, refetchPair]);

  // Update pair address when data changes
  useEffect(() => {
    if (pairAddressData) {
      setPairAddress(pairAddressData);
      setPairExists(pairAddressData !== '0x0000000000000000000000000000000000000000');
      
      if (pairAddressData !== '0x0000000000000000000000000000000000000000') {
        refetchReserves();
        if (address) {
          refetchLpBalance();
        }
      }
    } else {
      setPairAddress(null);
      setPairExists(false);
    }
  }, [pairAddressData, address, refetchReserves, refetchLpBalance]);

  // Update token order when token0 is known
  useEffect(() => {
    if (token0Address && tokenAAddress) {
      setIsTokenAToken0(token0Address.toLowerCase() === tokenAAddress.toLowerCase());
    }
  }, [token0Address, tokenAAddress]);

  // Update reserves when data changes
  useEffect(() => {
    if (reservesData && reservesData.length >= 2) {
      const reserve0 = reservesData[0];
      const reserve1 = reservesData[1];
      
      const reserveA = isTokenAToken0 ? reserve0 : reserve1;
      const reserveB = isTokenAToken0 ? reserve1 : reserve0;
      
      setReserves({
        reserve0: formatUnits(reserve0, 18),
        reserve1: formatUnits(reserve1, 18),
        reserveA: formatUnits(reserveA, tokenA.decimals || 18),
        reserveB: formatUnits(reserveB, tokenB.decimals || 18),
        reserveABigInt: reserveA,
        reserveBBigInt: reserveB,
      });
    } else {
      setReserves(null);
    }
  }, [reservesData, isTokenAToken0, tokenA.decimals, tokenB.decimals]);

  // Update LP token balance
  useEffect(() => {
    if (lpBalance) {
      setLpTokenBalance(formatUnits(lpBalance, 18));
    } else {
      setLpTokenBalance(null);
    }
  }, [lpBalance]);

  // Calculate optimal amount based on reserves
  const calculateOptimalAmount = (amount, isCalculatingB) => {
    if (!reserves || !amount || Number(amount) <= 0) return '';
    
    try {
      const { reserveABigInt, reserveBBigInt } = reserves;
      
      if (isCalculatingB) {
        const amountABigInt = parseUnits(
          amount, 
          tokenA.decimals || 18
        );
        const amountBBigInt = (amountABigInt * reserveBBigInt) / reserveABigInt;
        return formatUnits(
          amountBBigInt, 
          tokenB.decimals || 18
        );
      } else {
        const amountBBigInt = parseUnits(
          amount, 
          tokenB.decimals || 18
        );
        const amountABigInt = (amountBBigInt * reserveABigInt) / reserveBBigInt;
        return formatUnits(
          amountABigInt, 
          tokenA.decimals || 18
        );
      }
    } catch (err) {
      console.error('Error calculating optimal amount:', err);
      return '';
    }
  };

  // Add liquidity function
  const addLiquidity = async (amountAInput, amountBInput, slippageTolerance) => {
    if (!tokenAAddress || !tokenBAddress || !amountAInput || !amountBInput || !address) {
      return;
    }

    setIsAddingLiquidity(true);
    setError(null);

    try {
      // Parse input amounts
      const amountA = parseUnits(amountAInput, tokenA.decimals || 18);
      const amountB = parseUnits(amountBInput, tokenB.decimals || 18);

      // Calculate minimum amounts with slippage tolerance
      const minAmountA = (amountA * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);
      const minAmountB = (amountB * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);

      // Set deadline to 20 minutes from now
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

      // Approve token A
      console.log(`Approving ${tokenA.symbol}...`);
      const approveATx = await tokenA.approveSpender(CONTRACTS.ROUTER, amountAInput);
      setTxHash(approveATx);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for approval

      // Approve token B
      console.log(`Approving ${tokenB.symbol}...`);
      const approveBTx = await tokenB.approveSpender(CONTRACTS.ROUTER, amountBInput);
      setTxHash(approveBTx);
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for approval

      // Add liquidity
      console.log('Adding liquidity...');
      const addLiquidityTxHash = await addLiquidityTx({
        address: CONTRACTS.ROUTER,
        abi: ROUTER_ABI,
        functionName: 'addLiquidity',
        args: [
          tokenAAddress,
          tokenBAddress,
          amountA,
          amountB,
          minAmountA,
          minAmountB,
          address,
          deadline
        ],
      });

      setTxHash(addLiquidityTxHash);
      setSuccess(true);

      // Wait for transaction to be mined
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Update balances and reserves
      tokenA.refetchBalance();
      tokenB.refetchBalance();
      refetchReserves();
      refetchLpBalance();
    } catch (err) {
      console.error('Error adding liquidity:', err);
      setError(err.message || 'Failed to add liquidity');
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  return {
    pairAddress,
    pairExists,
    reserves,
    isTokenAToken0,
    lpTokenBalance,
    txHash,
    error,
    isAddingLiquidity,
    success,
    calculateOptimalAmount,
    addLiquidity,
  };
}