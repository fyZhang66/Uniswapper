import { useState, useEffect, useRef } from "react";
import { MAINNET_TOKENS } from "../constants/tokens";
import { useToken } from "../hooks/useToken";
import { useWriteContract, useAccount } from "wagmi";
import { executeSwap, checkPairExists } from "../utils/swapUtils";
import { parseUnits, formatUnits } from "viem";
import { readContract } from "@wagmi/core";
import { ROUTER_ABI, PAIR_ABI, CONTRACTS } from "../constants/contracts";
import config from "../config/wagmiConfig";

function NaturalLanguageInterface() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [useOpenSource, setUseOpenSource] = useState(false);
  const [openSourceUrl, setOpenSourceUrl] = useState("");
  const chatContainerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  // For demo/test purposes, set default token addresses
  const [tokenInAddress, setTokenInAddress] = useState(MAINNET_TOKENS.DAI);
  const [tokenOutAddress, setTokenOutAddress] = useState(MAINNET_TOKENS.ETH);

  // Account
  const { address } = useAccount();

  // Initialize hooks for tokens
  const tokenIn = useToken(tokenInAddress);
  const tokenOut = useToken(tokenOutAddress);

  // Direct contract writes
  const { writeContractAsync } = useWriteContract();

  // Scroll to bottom of chat when history updates
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Function to toggle chat visibility
  const toggleChatVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Direct implementation for getting pool reserves
  const handleGetPoolReserves = async (
    tokenAAddr,
    tokenBAddr,
    tokenASymbol,
    tokenBSymbol
  ) => {
    // Add status update
    const addStatus = (status) => {
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: status, timestamp: new Date() },
      ]);
    };

    try {
      addStatus(
        `Fetching current reserves for ${tokenASymbol}-${tokenBSymbol} pool...`
      );

      // Step 1: Check if pair exists
      const { exists, pairAddress } = await checkPairExists(
        tokenAAddr,
        tokenBAddr
      );

      if (!exists) {
        addStatus(
          `No liquidity pool exists for ${tokenASymbol}-${tokenBSymbol}`
        );
        return;
      }

      // Step 2: Get token decimals directly without using hooks
      let tokenADecimals = 18;
      let tokenBDecimals = 18;

      try {
        // Get token decimals by direct contract call instead of using hooks
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
        - ${tokenBSymbol}: ${parseFloat(formattedReservesB).toFixed(6)}`);

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
          - Last updated: Block timestamp ${reservesData[2]}`);
      } catch (error) {
        console.error("Error fetching additional pool info:", error);
      }
    } catch (error) {
      console.error("Error fetching pool reserves:", error);
      addStatus(`Error fetching pool reserves: ${error.message}`);
    }
  };

  // Function to execute based on NL interface output
  const handleExecuteFunction = (functionName, args) => {
    // Map token names to addresses
    const getTokenAddress = (tokenName) => {
      const normalized = tokenName.toUpperCase();
      switch (normalized) {
        case "ETH":
          return MAINNET_TOKENS.ETH;
        case "USDC":
          return MAINNET_TOKENS.USDC;
        case "DAI":
          return MAINNET_TOKENS.DAI;
        case "WETH":
          return MAINNET_TOKENS.WETH;
        case "LINK":
          return MAINNET_TOKENS.LINK;
        case "WBTC":
          return MAINNET_TOKENS.WBTC;
        case "UNI":
          return MAINNET_TOKENS.UNI;
        case "USDT":
        case "TETHER":
          return MAINNET_TOKENS.USDT;
        default:
          return null;
      }
    };

    const addResponse = (text) => {
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text, timestamp: new Date() },
      ]);
    };

    switch (functionName) {
      case "swap_tokens": {
        // Get token addresses
        const tokenInAddr = getTokenAddress(args.tokenIn);
        const tokenOutAddr = getTokenAddress(args.tokenOut);

        if (!tokenInAddr || !tokenOutAddr) {
          addResponse(
            `Error: Unknown token: ${
              !tokenInAddr ? args.tokenIn : args.tokenOut
            }`
          );
          return;
        }

        // Update state for tokens
        setTokenInAddress(tokenInAddr);
        setTokenOutAddress(tokenOutAddr);

        // Handle the swap using our utility function
        handleSwap(
          tokenInAddr,
          tokenOutAddr,
          args.amountIn.toString(),
          args.slippageTolerance || 0.5,
          args.tokenIn,
          args.tokenOut
        );

        break;
      }

      case "add_liquidity": {
        // Get token addresses
        const tokenAAddr = getTokenAddress(args.tokenA);
        const tokenBAddr = getTokenAddress(args.tokenB);

        if (!tokenAAddr || !tokenBAddr) {
          addResponse(
            `Error: Unknown token: ${!tokenAAddr ? args.tokenA : args.tokenB}`
          );
          return;
        }

        // Update state
        setTokenInAddress(tokenAAddr);
        setTokenOutAddress(tokenBAddr);

        // Execute add liquidity directly
        addResponse(
          `Adding liquidity: ${args.amountA} ${args.tokenA} and ${
            args.amountB
          } ${args.tokenB} (slippage: ${args.slippageTolerance || 0.5}%)`
        );

        // Use the addLiquidity function from the hook
        addLiquidity(
          args.amountA.toString(),
          args.amountB.toString(),
          args.slippageTolerance || 0.5
        )
          .then(() => {
            addResponse(
              `Successfully added liquidity: ${args.amountA} ${args.tokenA} and ${args.amountB} ${args.tokenB}`
            );
          })
          .catch((error) => {
            addResponse(`Error adding liquidity: ${error.message}`);
          });
        break;
      }

      case "remove_liquidity": {
        // Get token addresses
        const tokenARmAddr = getTokenAddress(args.tokenA);
        const tokenBRmAddr = getTokenAddress(args.tokenB);

        if (!tokenARmAddr || !tokenBRmAddr) {
          addResponse(
            `Error: Unknown token: ${!tokenARmAddr ? args.tokenA : args.tokenB}`
          );
          return;
        }

        // Update state
        setTokenInAddress(tokenARmAddr);
        setTokenOutAddress(tokenBRmAddr);

        // Execute remove liquidity directly
        addResponse(
          `Removing liquidity: ${args.lpAmount} LP tokens from ${args.tokenA}-${
            args.tokenB
          } pool (slippage: ${args.slippageTolerance || 0.5}%)`
        );

        // Use the removeLiquidity function from the hook
        removeLiquidity(args.lpAmount.toString(), args.slippageTolerance || 0.5)
          .then(() => {
            addResponse(
              `Successfully removed liquidity: ${args.lpAmount} LP tokens from ${args.tokenA}-${args.tokenB} pool`
            );
          })
          .catch((error) => {
            addResponse(`Error removing liquidity: ${error.message}`);
          });
        break;
      }

      case "get_pool_reserves": {
        // Get token addresses
        const tokenAResAddr = getTokenAddress(args.tokenA);
        const tokenBResAddr = getTokenAddress(args.tokenB);

        if (!tokenAResAddr || !tokenBResAddr) {
          addResponse(
            `Error: Unknown token: ${
              !tokenAResAddr ? args.tokenA : args.tokenB
            }`
          );
          return;
        }

        // Execute get pool reserves directly without relying on hooks
        handleGetPoolReserves(
          tokenAResAddr,
          tokenBResAddr,
          args.tokenA,
          args.tokenB
        );
        break;
      }

      case "get_swap_count": {
        // Placeholder for swap count feature
        addResponse(`Swap count analysis feature is under development. 
          It will analyze swap events for the ${args.tokenA}-${args.tokenB} pair over the ${args.period} period.`);
        break;
      }

      default:
        addResponse(`Unknown function: ${functionName}`);
    }
  };

  const handleSwap = async (
    tokenInAddr,
    tokenOutAddr,
    inputAmount,
    slippageTolerance,
    tokenInSymbol,
    tokenOutSymbol
  ) => {
    // Execute the swap using the abstracted utility function
    const result = await executeSwap({
      tokenInAddr,
      tokenOutAddr,
      inputAmount,
      slippageTolerance,
      tokenInSymbol,
      tokenOutSymbol,
      tokenIn,
      tokenOut,
      userAddress: address,
      writeContractAsync,
      onStatus: (status) => {
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: status, timestamp: new Date() },
        ]);
      },
    });

    // Update UI based on result
    setChatHistory((prev) => [
      ...prev,
      { sender: "ai", text: result.message, timestamp: new Date() },
    ]);

    // If swap was successful, refresh balances
    if (result.success) {
      setTimeout(() => {
        tokenIn.refetchBalance();
        tokenOut.refetchBalance();
      }, 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = message;
    setChatHistory((prev) => [
      ...prev,
      { sender: "user", text: userMessage, timestamp: new Date() },
    ]);
    setMessage("");
    setLoading(true);

    try {
      const endpoint = useOpenSource
        ? "/api/process-nl-open-source"
        : "/api/process-nl";

      const requestBody = useOpenSource
        ? { message: userMessage, modelUrl: openSourceUrl }
        : { message: userMessage };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.type === "function_call") {
        setChatHistory((prev) => [
          ...prev,
          {
            sender: "ai",
            text: data.message || "Processing your request...",
            timestamp: new Date(),
          },
        ]);
        // Execute the function(s)
        data.functions.forEach((func) => {
          handleExecuteFunction(func.name, func.arguments);
        });
      } else {
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: data.message, timestamp: new Date() },
        ]);
      }
    } catch (error) {
      console.error("Error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Error processing your request: " + error.message,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format the timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button 
          onClick={toggleChatVisibility}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
    >
      <div className="flex items-center justify-center h-full">
        <div className="w-full max-w-[50%] flex flex-col h-[500px] rounded-lg bg-gray-800 border border-gray-700 shadow-2xl pointer-events-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <h2 className="text-xl font-semibold">Uniswap Assistant</h2>
            <div className="flex items-center">
              <label className="flex items-center text-xs text-gray-400 mr-2">
                <input
                  type="checkbox"
                  checked={useOpenSource}
                  onChange={(e) => setUseOpenSource(e.target.checked)}
                  className="mr-1 h-3 w-3"
                />
                Open Source LLM
              </label>
              {useOpenSource && (
                <input
                  type="text"
                  value={openSourceUrl}
                  onChange={(e) => setOpenSourceUrl(e.target.value)}
                  placeholder="LLM API URL"
                  className="bg-gray-700 border border-gray-600 rounded text-xs w-24 px-2 py-1"
                />
              )}
              <button 
                onClick={toggleChatVisibility}
                className="ml-2 text-gray-400 hover:text-white"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Chat messages container */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {chatHistory.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                <p className="text-center">
                  Ask me anything about Uniswap!
                  <br />
                  Try "Swap 10 DAI for ETH" or
                  <br />
                  "What are the reserves for the DAI-ETH pool?"
                </p>
              </div>
            ) : (
              chatHistory.map((chat, index) => (
                <div
                  key={index}
                  className={`flex ${
                    chat.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      chat.sender === "user"
                        ? "bg-blue-600 text-white rounded-tr-none"
                        : "bg-gray-700 text-white rounded-tl-none"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">{chat.text}</div>
                    <div
                      className={`text-xs mt-1 ${
                        chat.sender === "user" ? "text-blue-200" : "text-gray-400"
                      }`}
                    >
                      {formatTime(chat.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Message input form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-700 p-3">
            <div className="flex items-center">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your request..."
                className="input flex-1 text-sm"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !message.trim()}
                className="btn btn-primary ml-2"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </span>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default NaturalLanguageInterface;
