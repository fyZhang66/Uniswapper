import { parseUnits } from "viem";
import { readContract } from "@wagmi/core";
import config from "../config/wagmiConfig";
import { ERC20_ABI } from "../constants/contracts";

/**
 * Approve a token for spending by a spender contract.
 * @param {string} tokenAddress - The address of the token contract.
 * @param {string} spenderAddress - The address of the contract allowed to spend the token.
 * @param {string|number} amount - The amount of the token to approve (in human-readable format).
 * @param {function} writeContractAsync - Wagmi function to execute a contract write.
 * @param {function} addStatus - Callback function to report status updates.
 * @returns {Promise<boolean>} - True if approval was successful, otherwise throws error.
 */
export const approveToken = async (
  tokenAddress,
  spenderAddress,
  amount,
  writeContractAsync,
  addStatus
) => {
  try {
    // Need decimals to parse the amount for approval
    let decimals = 18;
    try {
      decimals = await readContract(config, {
        address: tokenAddress,
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
    } catch (decError) {
      console.warn(
        `Could not fetch decimals for approval of ${tokenAddress}, assuming 18.`,
        decError
      );
      addStatus(
        `Warning: Could not fetch decimals for ${tokenAddress}, assuming 18.`
      );
    }
    const parsedAmount = parseUnits(amount.toString(), decimals);

    addStatus(`Requesting approval for token ${tokenAddress}...`);
    await writeContractAsync({
      address: tokenAddress,
      abi: ERC20_ABI, // Use standard ERC20 ABI for approval
      functionName: "approve",
      args: [spenderAddress, parsedAmount],
    });
    addStatus(`Token ${tokenAddress} approved for spending by ${spenderAddress}.`);
    return true;
  } catch (error) {
    console.error(`Approval failed for token ${tokenAddress}:`, error);
    addStatus(`Error approving token ${tokenAddress}: ${error.message}`);
    throw error; // Re-throw error to stop the calling operation (e.g., liquidity add/remove)
  }
};