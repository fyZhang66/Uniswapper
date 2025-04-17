import { formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { PAIR_ABI } from "../constants/contracts";
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