import { formatUnits, parseUnits } from "viem";
import { readContract } from "@wagmi/core";
import { PAIR_ABI, ROUTER_ABI, CONTRACTS } from "../constants/contracts";
import { checkPairExists } from "./swapUtils";
import config from "../config/wagmiConfig";

/**
 * Get pool reserves data for a token pair
 * @param {string} tokenAAddr - Address of first token
 * @param {string} tokenBAddr - Address of second token
 * @param {string} tokenASymbol - Symbol of first token
 * @param {string} tokenBSymbol - Symbol of second token
 * @param {function} addStatus - Callback function to add status updates
 * @returns {Promise<void>}
 */
export const getPoolReserves = async (
  tokenAAddr,
  tokenBAddr,
  tokenASymbol,
  tokenBSymbol,
  addStatus
) => {
  try {
    addStatus(`Fetching current reserves for ${tokenASymbol}-${tokenBSymbol} pool...`);

    // Step 1: Check if pair exists
    const { exists, pairAddress } = await checkPairExists(
      tokenAAddr,
      tokenBAddr
    );

    if (!exists) {
      addStatus(`No liquidity pool exists for ${tokenASymbol}-${tokenBSymbol}`);
      return;
    }

    // Step 2: Get token decimals directly without using hooks
    let tokenADecimals = 18;
    let tokenBDecimals = 18;

    try {
      // Get token decimals by direct contract call
      const tokenADecimalsResult = await readContract(config, {
        address: tokenAAddr,
        abi: [
          {
            inputs: [],
            name: "decimals",
            outputs: [{ type: "uint8" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "decimals",
      });
      tokenADecimals = tokenADecimalsResult;

      const tokenBDecimalsResult = await readContract(config, {
        address: tokenBAddr,
        abi: [
          {
            inputs: [],
            name: "decimals",
            outputs: [{ type: "uint8" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        functionName: "decimals",
      });
      tokenBDecimals = tokenBDecimalsResult;
    } catch (error) {
      console.error("Error fetching token decimals:", error);
      // Continue with default 18 decimals
    }

    // Step 3: Get reserves for the pair
    const reservesData = await readContract(config, {
      address: pairAddress,
      abi: PAIR_ABI,
      functionName: "getReserves",
    });

    // Step 4: Determine which token is token0 and token1
    const token0 = await readContract(config, {
      address: pairAddress,
      abi: PAIR_ABI,
      functionName: "token0",
    });

    const isAToken0 = token0.toLowerCase() === tokenAAddr.toLowerCase();

    // Step 5: Format reserves with correct decimals
    const formattedReservesA = formatUnits(
      isAToken0 ? reservesData[0] : reservesData[1],
      tokenADecimals
    );

    const formattedReservesB = formatUnits(
      isAToken0 ? reservesData[1] : reservesData[0],
      tokenBDecimals
    );

    // Step 6: Add formatted reserves to chat
    addStatus(`Current reserves for ${tokenASymbol}-${tokenBSymbol} pool:
      - ${tokenASymbol}: ${parseFloat(formattedReservesA).toFixed(6)}
      - ${tokenBSymbol}: ${parseFloat(formattedReservesB).toFixed(6)}`
    );

    // Step 7: Display additional information if available
    try {
      const totalSupply = await readContract(config, {
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: "totalSupply",
      });

      const formattedTotalSupply = formatUnits(totalSupply, 18); // LP tokens have 18 decimals

      addStatus(`Additional pool information:
        - Pair address: ${pairAddress}
        - Total LP tokens: ${parseFloat(formattedTotalSupply).toFixed(6)}
        - Last updated: Block timestamp ${reservesData[2]}`
      );
    } catch (error) {
      console.error("Error fetching additional pool info:", error);
    }

    // Return the formatted reserves data
    return {
      reserveA: formattedReservesA,
      reserveB: formattedReservesB,
      pairAddress,
      exists: true
    };
  } catch (error) {
    console.error("Error fetching pool reserves:", error);
    addStatus(`Error fetching pool reserves: ${error.message}`);
    return {
      exists: false,
      error: error.message
    };
  }
};

/**
 * Add liquidity directly without using hooks
 * @param {string} tokenAAddr - Address of first token
 * @param {string} tokenBAddr - Address of second token
 * @param {string} amountA - Amount of token A to add
 * @param {string} amountB - Amount of token B to add
 * @param {number} slippageTolerance - Slippage tolerance percentage
 * @param {string} userAddress - User's wallet address
 * @param {function} writeContractAsync - Function to write to a contract
 * @param {function} approveToken - Function to approve token spending
 * @param {function} addStatus - Callback function to add status updates
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const addLiquidityDirect = async (
  tokenAAddr,
  tokenBAddr,
  amountA,
  amountB,
  slippageTolerance,
  userAddress,
  writeContractAsync,
  approveToken, // Pass a function to handle approvals
  addStatus
) => {
  try {
    addStatus(`Processing add liquidity...`);

    // Step 1: Get token decimals (needed for parsing amounts)
    let tokenADecimals = 18;
    let tokenBDecimals = 18;
    try {
      tokenADecimals = await readContract(config, {
        address: tokenAAddr,
        abi: [{ inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
        functionName: 'decimals',
      });
      tokenBDecimals = await readContract(config, {
        address: tokenBAddr,
        abi: [{ inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" }],
        functionName: 'decimals',
      });
    } catch (error) {
      console.error("Error fetching token decimals:", error);
      addStatus("Warning: Could not fetch token decimals, assuming 18.");
    }

    // Step 2: Parse amounts with the correct decimals
    const parsedAmountA = parseUnits(amountA.toString(), tokenADecimals);
    const parsedAmountB = parseUnits(amountB.toString(), tokenBDecimals);

    // Step 3: Calculate minimum amounts based on slippage tolerance
    const minAmountA = (parsedAmountA * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);
    const minAmountB = (parsedAmountB * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);

    // Step 4: Set deadline to 20 minutes from now
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    addStatus(`Approving tokens for liquidity addition...`);
    // Step 5: Approve token spending using the provided function
    await approveToken(tokenAAddr, CONTRACTS.ROUTER, amountA);
    await approveToken(tokenBAddr, CONTRACTS.ROUTER, amountB);

    // Short delay to allow approval transactions to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));

    addStatus(`Executing addLiquidity transaction...`);
    // Step 6: Execute addLiquidity
    await writeContractAsync({
      address: CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'addLiquidity',
      args: [
        tokenAAddr,
        tokenBAddr,
        parsedAmountA,
        parsedAmountB,
        minAmountA,
        minAmountB,
        userAddress,
        deadline
      ],
    });

    return { success: true, message: `Successfully added liquidity.` };
  } catch (error) {
    console.error("Error adding liquidity directly:", error);
    addStatus(`Error adding liquidity: ${error.message}`);
    return { success: false, message: `Error adding liquidity: ${error.message}` };
  }
};

/**
 * Remove liquidity directly without using hooks
 * @param {string} tokenAAddr - Address of first token
 * @param {string} tokenBAddr - Address of second token
 * @param {string} lpAmount - Amount of LP tokens to remove
 * @param {number} slippageTolerance - Slippage tolerance percentage
 * @param {string} userAddress - User's wallet address
 * @param {function} writeContractAsync - Function to write to a contract
 * @param {function} approveToken - Function to approve token spending
 * @param {function} addStatus - Callback function to add status updates
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const removeLiquidityDirect = async (
  tokenAAddr,
  tokenBAddr,
  lpAmount,
  slippageTolerance,
  userAddress,
  writeContractAsync,
  approveToken, // Pass a function to handle approvals
  addStatus
) => {
  try {
    addStatus(`Processing remove liquidity...`);

    // Step 1: Check if pair exists
    const { exists, pairAddress } = await checkPairExists(tokenAAddr, tokenBAddr);
    if (!exists) {
      addStatus(`Error: No liquidity pool exists for the token pair.`);
      return { success: false, message: `No liquidity pool exists for the token pair.` };
    }

    // Step 2: Parse LP amount (LP tokens always have 18 decimals)
    const parsedLpAmount = parseUnits(lpAmount.toString(), 18);

    // Step 3: Calculate expected token amounts and minimums
    let minAmountA, minAmountB;
    try {
      const totalSupply = await readContract(config, {
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'totalSupply',
      });
      const reservesData = await readContract(config, {
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'getReserves',
      });
      const token0 = await readContract(config, {
        address: pairAddress,
        abi: PAIR_ABI,
        functionName: 'token0',
      });

      const isAToken0 = token0.toLowerCase() === tokenAAddr.toLowerCase();
      const reserveA = isAToken0 ? reservesData[0] : reservesData[1];
      const reserveB = isAToken0 ? reservesData[1] : reservesData[0];

      const expectedAmountA = (reserveA * parsedLpAmount) / totalSupply;
      const expectedAmountB = (reserveB * parsedLpAmount) / totalSupply;

      minAmountA = (expectedAmountA * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);
      minAmountB = (expectedAmountB * BigInt(Math.floor((100 - slippageTolerance) * 1000))) / BigInt(100000);
    } catch (error) {
      console.error("Error calculating minimum amounts for removal:", error);
      addStatus(`Error calculating expected amounts: ${error.message}`);
      return { success: false, message: `Error calculating expected amounts: ${error.message}` };
    }

    // Step 4: Set deadline
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

    addStatus(`Approving LP tokens for removal...`);
    // Step 5: Approve LP token spending using the provided function
    // Note: The token to approve is the pairAddress (LP token contract)
    await approveToken(pairAddress, CONTRACTS.ROUTER, lpAmount);

    // Short delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    addStatus(`Executing removeLiquidity transaction...`);
    // Step 6: Execute removeLiquidity
    await writeContractAsync({
      address: CONTRACTS.ROUTER,
      abi: ROUTER_ABI,
      functionName: 'removeLiquidity',
      args: [
        tokenAAddr,
        tokenBAddr,
        parsedLpAmount,
        minAmountA,
        minAmountB,
        userAddress,
        deadline
      ],
    });

    return { success: true, message: `Successfully removed liquidity.` };
  } catch (error) {
    console.error("Error removing liquidity directly:", error);
    addStatus(`Error removing liquidity: ${error.message}`);
    return { success: false, message: `Error removing liquidity: ${error.message}` };
  }
};