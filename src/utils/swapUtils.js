import { parseUnits, formatUnits } from 'viem';
import { readContract } from '@wagmi/core';
import { ROUTER_ABI, FACTORY_ABI, CONTRACTS } from '../constants/contracts';
import config from '../config/wagmiConfig';

/**
 * Execute a token swap on Uniswap
 * @param {Object} params - Swap parameters
 * @param {string} params.tokenInAddr - Address of token to swap from
 * @param {string} params.tokenOutAddr - Address of token to swap to
 * @param {string} params.inputAmount - Amount to swap as string
 * @param {number} params.slippageTolerance - Slippage tolerance percentage
 * @param {string} params.tokenInSymbol - Symbol of input token
 * @param {string} params.tokenOutSymbol - Symbol of output token
 * @param {Object} params.tokenIn - Token input object with decimals and approveSpender
 * @param {Object} params.tokenOut - Token output object with decimals
 * @param {string} params.userAddress - User's wallet address
 * @param {function} params.writeContractAsync - Function to write to a contract
 * @param {function} params.onStatus - Callback for status updates
 * @returns {Promise<{success: boolean, message: string, outputAmount?: string}>}
 */
export const executeSwap = async ({
  tokenInAddr,
  tokenOutAddr,
  inputAmount,
  slippageTolerance,
  tokenInSymbol,
  tokenOutSymbol,
  tokenIn,
  tokenOut,
  userAddress,
  writeContractAsync,
  onStatus
}) => {
  if (!tokenInAddr || !tokenOutAddr || !inputAmount || !userAddress) {
    return { success: false, message: "Missing required parameters for swap" };
  }

  try {
    onStatus?.(`Processing swap: ${inputAmount} ${tokenInSymbol} → ${tokenOutSymbol}`);
    
    // Step 1: Check if pair exists by getting pair address from factory
    const pairAddress = await readContract(config, {
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [tokenInAddr, tokenOutAddr],
    });
    
    if (!pairAddress || pairAddress === '0x0000000000000000000000000000000000000000') {
      return { success: false, message: `Error: No liquidity pool exists for ${tokenInSymbol}-${tokenOutSymbol}` };
    }
    
    // Step 2: Parse input amount with correct decimals
    const amountIn = parseUnits(inputAmount.toString(), tokenIn.decimals || 18);
    
    // Step 3: Get expected output amount
    const amounts = await readContract(config, {
      address: CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'getAmountsOut',
      args: [amountIn, [tokenInAddr, tokenOutAddr]],
    });
    
    if (!amounts || !amounts[1]) {
      return { success: false, message: `Error: Failed to calculate output amount for ${tokenInSymbol}-${tokenOutSymbol} swap` };
    }
    
    const expectedAmountOut = amounts[1];
    const formattedOutput = formatUnits(expectedAmountOut, tokenOut.decimals || 18);
    
    onStatus?.(`Executing swap: ${inputAmount} ${tokenInSymbol} → approximately ${parseFloat(formattedOutput).toFixed(6)} ${tokenOutSymbol} (slippage: ${slippageTolerance}%)`);
    
    // Step 4: Calculate minimum output with slippage tolerance
    const minAmountOut = (expectedAmountOut * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);
    
    // Step 5: Set deadline to 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);
    
    // Step 6: Approve token spending
    await tokenIn.approveSpender(CONTRACTS.ROUTER, inputAmount);
    
    // Short delay to allow approval transaction to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 7: Execute the swap
    await writeContractAsync({
      address: CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'swapExactTokensForTokens',
      args: [
        amountIn,
        minAmountOut,
        [tokenInAddr, tokenOutAddr],
        userAddress,
        deadline
      ],
    });
    
    return {
      success: true,
      message: `Swap completed: ${inputAmount} ${tokenInSymbol} → ${parseFloat(formattedOutput).toFixed(6)} ${tokenOutSymbol}`,
      outputAmount: formattedOutput
    };
    
  } catch (error) {
    console.error("Swap error:", error);
    return { success: false, message: `Error executing swap: ${error.message}` };
  }
};