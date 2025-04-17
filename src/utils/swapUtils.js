import { parseUnits, formatUnits } from 'viem';
import { readContract } from '@wagmi/core';
import { ROUTER_ABI, FACTORY_ABI, CONTRACTS, ERC20_ABI } from '../constants/contracts'; // Import ERC20_ABI
import config from '../config/wagmiConfig';
import { approveToken } from './tokenUtils'; // Import approveToken utility

/**
 * Fetch token decimals.
 * @param {string} tokenAddress - Address of the token.
 * @param {function} onStatus - Callback for status updates.
 * @returns {Promise<number>} - The token decimals.
 */
const getTokenDecimals = async (tokenAddress, onStatus) => {
  try {
    const decimals = await readContract(config, {
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'decimals',
    });
    return Number(decimals);
  } catch (error) {
    console.warn(`Could not fetch decimals for ${tokenAddress}, assuming 18.`, error);
    onStatus?.(`Warning: Could not fetch decimals for ${tokenAddress}, assuming 18.`);
    return 18; // Default to 18 if fetching fails
  }
};

/**
 * Check if a liquidity pair exists for two tokens
 * @param {string} tokenA - Address of first token
 * @param {string} tokenB - Address of second token
 * @returns {Promise<{exists: boolean, pairAddress: string}>}
 */
export const checkPairExists = async (tokenA, tokenB) => {
  try {
    const pairAddress = await readContract(config, {
      address: CONTRACTS.FACTORY,
      abi: FACTORY_ABI,
      functionName: 'getPair',
      args: [tokenA, tokenB],
    });
    
    const exists = pairAddress && pairAddress !== '0x0000000000000000000000000000000000000000';
    return {
      exists,
      pairAddress
    };
  } catch (error) {
    console.error("Error checking pair existence:", error);
    return {
      exists: false,
      pairAddress: null
    };
  }
};

/**
 * Execute a token swap on Uniswap
 * @param {Object} params - Swap parameters
 * @param {string} params.tokenInAddr - Address of token to swap from
 * @param {string} params.tokenOutAddr - Address of token to swap to
 * @param {string} params.inputAmount - Amount to swap as string
 * @param {number} params.slippageTolerance - Slippage tolerance percentage
 * @param {string} params.tokenInSymbol - Symbol of input token
 * @param {string} params.tokenOutSymbol - Symbol of output token
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
  userAddress,
  writeContractAsync,
  onStatus
}) => {
  if (!tokenInAddr || !tokenOutAddr || !inputAmount || !userAddress) {
    return { success: false, message: "Missing required parameters for swap" };
  }

  try {
    onStatus?.(`Processing swap: ${inputAmount} ${tokenInSymbol} → ${tokenOutSymbol}`);

    // Step 1: Fetch decimals for both tokens
    const [tokenInDecimals, tokenOutDecimals] = await Promise.all([
      getTokenDecimals(tokenInAddr, onStatus),
      getTokenDecimals(tokenOutAddr, onStatus),
    ]);

    // Step 2: Check if pair exists
    const { exists } = await checkPairExists(tokenInAddr, tokenOutAddr);
    if (!exists) {
      return { success: false, message: `Error: No liquidity pool exists for ${tokenInSymbol}-${tokenOutSymbol}` };
    }

    // Step 3: Parse input amount with correct decimals
    const amountIn = parseUnits(inputAmount.toString(), tokenInDecimals);

    // Step 4: Get expected output amount
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
    const formattedOutput = formatUnits(expectedAmountOut, tokenOutDecimals);

    onStatus?.(`Executing swap: ${inputAmount} ${tokenInSymbol} → approximately ${parseFloat(formattedOutput).toFixed(6)} ${tokenOutSymbol} (slippage: ${slippageTolerance}%)`);

    // Step 5: Calculate minimum output with slippage tolerance
    const minAmountOut = (expectedAmountOut * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);

    // Step 6: Set deadline to 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    // Step 7: Approve token spending using the utility function
    onStatus?.(`Approving ${tokenInSymbol} for swap...`);
    const approved = await approveToken(
      tokenInAddr,
      CONTRACTS.ROUTER,
      inputAmount, // Approve the exact input amount
      writeContractAsync,
      onStatus
    );

    if (!approved) {
      // approveToken already calls onStatus with error, just return
      return { success: false, message: `Approval failed for ${tokenInSymbol}` };
    }

    onStatus?.(`${tokenInSymbol} approved. Executing swap...`);
    // Short delay often helps after approval
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 8: Execute the swap
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
    const message = error.shortMessage || error.message; // Handle potential wagmi/viem error structure
    onStatus?.(`Error executing swap: ${message}`);
    return { success: false, message: `Error executing swap: ${message}` };
  }
};