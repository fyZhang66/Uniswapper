// src/pages/HistoryPage.jsx
import { useState, useEffect } from 'react';
import { parseAbiItem } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import TokenSelect from '../components/TokenSelect';
import SwapHistogram from '../components/SwapHistogram';
import { MAINNET_TOKENS } from '../constants/tokens';
import { useToken } from '../hooks/useToken';
import { FACTORY_ABI, PAIR_ABI, CONTRACTS } from '../constants/contracts';
import { readContract } from '@wagmi/core';
import config from '../config/wagmiConfig';

// Define swap event using parseAbiItem
const SWAP_EVENT = parseAbiItem('event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)');

export default function HistoryPage() {
  const { isConnected } = useAccount();
  
  // Default tokens
  const [tokenAAddress, setTokenAAddress] = useState(MAINNET_TOKENS.DAI);
  const [tokenBAddress, setTokenBAddress] = useState(MAINNET_TOKENS.UNI);
  
  // Get token details
  const tokenA = useToken(tokenAAddress);
  const tokenB = useToken(tokenBAddress);
  
  // State for pair data and swaps
  const [pairAddress, setPairAddress] = useState(null);
  const [pairExists, setPairExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [swapEvents, setSwapEvents] = useState([]);
  const [error, setError] = useState(null);
  const [isTokenAToken0, setIsTokenAToken0] = useState(true);
  
  // Function to get pair address from factory
  const getPairAddress = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!tokenAAddress || !tokenBAddress) {
        setError("Please select both tokens");
        setIsLoading(false);
        return null;
      }
      
      console.log(`Getting pair address for tokens: ${tokenA.symbol}=${tokenAAddress} and ${tokenB.symbol}=${tokenBAddress}`);
      
      const pairAddr = await readContract(config, {
        address: CONTRACTS.FACTORY,
        abi: FACTORY_ABI,
        functionName: "getPair",
        args: [tokenAAddress, tokenBAddress],
      });
      
      console.log(`Pair address: ${pairAddr}`);
      
      setPairAddress(pairAddr);
      
      if (pairAddr === "0x0000000000000000000000000000000000000000") {
        setError("Pair does not exist yet. Try adding liquidity first to create this pair.");
        setPairExists(false);
        setIsLoading(false);
        return null;
      }
      
      // Determine token order (which is token0 and which is token1)
      const token0Addr = await readContract(config, {
        address: pairAddr,
        abi: PAIR_ABI,
        functionName: "token0",
      });
      
      setIsTokenAToken0(token0Addr.toLowerCase() === tokenAAddress.toLowerCase());
      setPairExists(true);
      
      return pairAddr;
    } catch (error) {
      console.error("Error getting pair address:", error);
      setError(`Error getting pair address: ${error.message}`);
      setPairExists(false);
      return null;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to fetch swap events from the pair contract
  const fetchSwapEvents = async (pairAddr) => {
    if (!pairAddr || pairAddr === "0x0000000000000000000000000000000000000000") {
      return [];
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get current block number to set range
      const currentBlock = await window.ethereum.request({
        method: 'eth_blockNumber',
      });
      
      // Convert hex to number and look back 1000 blocks
      const currentBlockNum = parseInt(currentBlock, 16);
      const fromBlock = Math.max(0, currentBlockNum - 10000); // Look back 10000 blocks or to genesis
      
      console.log(`Fetching swap events from block ${fromBlock} to ${currentBlockNum}...`);
      
      // Request logs with pagination to avoid timeout
      const logsRequest = {
        address: pairAddr,
        topics: [SWAP_EVENT.selector],
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: currentBlock,
      };
      
      const logs = await window.ethereum.request({
        method: 'eth_getLogs',
        params: [logsRequest],
      });
      
      console.log(`Found ${logs.length} swap logs`);
      
      // Process the logs
      const processedLogs = logs.map(log => {
        // Decode parameters - we're doing this manually since we don't have full ethers here
        const data = log.data.slice(2); // Remove 0x prefix
        const dataParams = [];
        
        // Each parameter is 32 bytes (64 hex chars)
        for (let i = 0; i < data.length; i += 64) {
          const param = BigInt("0x" + data.slice(i, i + 64));
          dataParams.push(param);
        }
        
        // Parameters are in this order: amount0In, amount1In, amount0Out, amount1Out
        return {
          transactionHash: log.transactionHash,
          blockNumber: parseInt(log.blockNumber, 16),
          logIndex: parseInt(log.logIndex, 16),
          amount0In: dataParams[0],
          amount1In: dataParams[1],
          amount0Out: dataParams[2],
          amount1Out: dataParams[3],
          // Extract sender from topics (first indexed parameter)
          sender: log.topics && log.topics[1] ? "0x" + log.topics[1].slice(26) : "unknown",
          // The 'to' address might not be indexed in all events or might be at a different position
          to: log.topics && log.topics[2] ? "0x" + log.topics[2].slice(26) : "unknown"
        };
      });
      
      // Calculate prices and handle token ordering
      const processedEvents = calculateExecutionPrices(processedLogs);
      setSwapEvents(processedEvents);
      return processedEvents;
    } catch (error) {
      console.error('Error fetching swap events:', error);
      setError(`Error fetching swap events: ${error.message}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Calculate execution prices for swap events
  const calculateExecutionPrices = (events) => {
    if (!events || events.length === 0) return [];
    
    return events.map(swap => {
      let executionPrice = null;
      let tradeDirection = null;
      let details = "";
      let price = null;
      
      try {
        // Make sure we have valid numbers by using BigInt and then converting
        const amount0In = typeof swap.amount0In === 'bigint' ? Number(swap.amount0In) : Number(swap.amount0In || 0);
        const amount1In = typeof swap.amount1In === 'bigint' ? Number(swap.amount1In) : Number(swap.amount1In || 0);
        const amount0Out = typeof swap.amount0Out === 'bigint' ? Number(swap.amount0Out) : Number(swap.amount0Out || 0);
        const amount1Out = typeof swap.amount1Out === 'bigint' ? Number(swap.amount1Out) : Number(swap.amount1Out || 0);
        
        // Format amounts according to token decimals
        const formattedAmount0In = amount0In / (10 ** (isTokenAToken0 ? tokenA.decimals : tokenB.decimals));
        const formattedAmount1In = amount1In / (10 ** (isTokenAToken0 ? tokenB.decimals : tokenA.decimals));
        const formattedAmount0Out = amount0Out / (10 ** (isTokenAToken0 ? tokenA.decimals : tokenB.decimals));
        const formattedAmount1Out = amount1Out / (10 ** (isTokenAToken0 ? tokenB.decimals : tokenA.decimals));
        
        // Determine which token is token0 and which is token1 based on isTokenAToken0 flag
        if (isTokenAToken0) {
          // TOKEN_A is token0, TOKEN_B is token1
          
          // Selling TOKEN_A (token0) for TOKEN_B (token1)
          if (amount0In > 0 && amount1Out > 0) {
            // Price should be A/B (how much of token A you spend to get 1 token B)
            price = formattedAmount0In / formattedAmount1Out; 
            tradeDirection = `Sell ${tokenB.symbol}`;
            details = `${formattedAmount0In.toFixed(6)} ${tokenB.symbol} → ${formattedAmount1Out.toFixed(6)} ${tokenA.symbol}`;
          }
          // Selling TOKEN_B (token1) for TOKEN_A (token0)
          else if (amount1In > 0 && amount0Out > 0) {
            // Price should be A/B (how much of token A you get for 1 token B)
            price = formattedAmount1In / formattedAmount0Out; 
            tradeDirection = `Sell ${tokenA.symbol}`;
            details = `${formattedAmount1In.toFixed(6)} ${tokenA.symbol} → ${formattedAmount0Out.toFixed(6)} ${tokenB.symbol}`;
          }
        } else {
          // TOKEN_B is token0, TOKEN_A is token1
          
          // Selling TOKEN_B (token0) for TOKEN_A (token1)
          if (amount0In > 0 && amount1Out > 0) {
            // Price should be B/A (how much of token B you spend to get 1 token A)
            price = formattedAmount0In / formattedAmount1Out; 
            tradeDirection = `Sell ${tokenA.symbol}`;
            details = `${formattedAmount0In.toFixed(6)} ${tokenA.symbol} → ${formattedAmount1Out.toFixed(6)} ${tokenB.symbol}`;
          }
          // Selling TOKEN_A (token1) for TOKEN_B (token0)
          else if (amount1In > 0 && amount0Out > 0) {
            // Price should be B/A (how much of token B you get for 1 token A)
            price = formattedAmount0Out / formattedAmount1In;
            tradeDirection = `Sell ${tokenB.symbol}`;
            details = `${formattedAmount1In.toFixed(6)} ${tokenB.symbol} → ${formattedAmount0Out.toFixed(6)} ${tokenA.symbol}`;
          }
        }
        
        return {
          ...swap,
          formattedAmount0In,
          formattedAmount1In,
          formattedAmount0Out,
          formattedAmount1Out,
          tradeDirection,
          details,
          price,
        };
      } catch (error) {
        console.error("Error processing swap:", error, swap);
        return {
          ...swap,
          formattedAmount0In: 0,
          formattedAmount1In: 0,
          formattedAmount0Out: 0,
          formattedAmount1Out: 0,
          tradeDirection: "Unknown",
          details: "Error processing swap data",
          price: null,
        };
      }
    }).filter(swap => swap.price !== null && !isNaN(swap.price) && isFinite(swap.price));
  };
  
  // Function to load pair and swap data
  const loadPairData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const pairAddr = await getPairAddress();
      
      if (!pairAddr || pairAddr === "0x0000000000000000000000000000000000000000") {
        setError(`No liquidity pool exists for ${tokenA.symbol}-${tokenB.symbol}. Try adding liquidity first.`);
        return;
      }
      
      const events = await fetchSwapEvents(pairAddr);
      
      if (events.length === 0) {
        setError(`No swap events found for ${tokenA.symbol}-${tokenB.symbol} pair. The pool may exist but has no trading activity.`);
      }
    } catch (error) {
      console.error("Error loading pair data:", error);
      setError(`Failed to load data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Swap token positions
  const swapTokenPositions = () => {
    const tempToken = tokenAAddress;
    setTokenAAddress(tokenBAddress);
    setTokenBAddress(tempToken);
  };
  
  // Calculate price statistics
  const calculatePriceStats = () => {
    if (!swapEvents || swapEvents.length === 0) return null;
    
    const prices = swapEvents.map(swap => swap.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    return {
      count: swapEvents.length,
      min: minPrice,
      max: maxPrice,
      avg: avgPrice
    };
  };
  
  // Load data when tokens change
  useEffect(() => {
    // Reset state when tokens change
    setPairAddress(null);
    setPairExists(false);
    setSwapEvents([]);
    setError(null);
  }, [tokenAAddress, tokenBAddress]);
  
  const priceStats = calculatePriceStats();
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">Swap History</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          View swap history and price distribution for any token pair
        </p>
      </div>
      
      {!isConnected ? (
        <div className="flex flex-col items-center my-10 space-y-4">
          <p className="text-gray-400 text-center mb-4">
            Connect your wallet to view swap history
          </p>
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Token Selection */}
          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4">Select Token Pair</h2>
            
            <div className="flex flex-col md:flex-row items-center gap-4">
              {/* First token */}
              <div className="w-full md:w-auto">
                <label className="block text-gray-400 mb-2">First Token</label>
                <TokenSelect
                  value={tokenAAddress}
                  onChange={setTokenAAddress}
                  excludeToken={tokenBAddress}
                />
              </div>
              
              {/* Swap direction button */}
              <div className="flex justify-center">
                <button 
                  onClick={swapTokenPositions}
                  className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full shadow-lg transition-transform hover:rotate-180 duration-300"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                  </svg>
                </button>
              </div>
              
              {/* Second token */}
              <div className="w-full md:w-auto">
                <label className="block text-gray-400 mb-2">Second Token</label>
                <TokenSelect
                  value={tokenBAddress}
                  onChange={setTokenBAddress}
                  excludeToken={tokenAAddress}
                />
              </div>
              
              {/* Load button */}
              <div className="ml-auto">
                <button
                  onClick={loadPairData}
                  disabled={isLoading || !tokenAAddress || !tokenBAddress}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Loading...' : 'Load History'}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
                {error}
              </div>
            )}
          </div>
          
          {/* Results Section */}
          {pairExists && swapEvents.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Histogram */}
              <div className="bg-gray-800 rounded-xl shadow-xl  p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Price Distribution</h2>
                
                {priceStats && (
                  <div className="flex flex-wrap justify-between mb-4 text-sm bg-gray-700/40 rounded-lg p-3">
                    <div>
                      <span className="text-gray-400">Swaps:</span>{" "}
                      <span className="font-medium">{priceStats.count}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Min Price:</span>{" "}
                      <span className="font-medium">{priceStats.min.toFixed(6)} {tokenB.symbol}/{tokenA.symbol}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Price:</span>{" "}
                      <span className="font-medium">{priceStats.max.toFixed(6)} {tokenB.symbol}/{tokenA.symbol}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Avg Price:</span>{" "}
                      <span className="font-medium">{priceStats.avg.toFixed(6)} {tokenB.symbol}/{tokenA.symbol}</span>
                    </div>
                  </div>
                )}
                
                <SwapHistogram
                  swapData={swapEvents}
                  tokenASymbol={tokenA.symbol}
                  tokenBSymbol={tokenB.symbol}
                />
              </div>
              
              {/* Recent Swaps */}
              <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4">Recent Swaps</h2>
                
                <div className="overflow-x-auto">
                  <div className="max-h-[400px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="sticky top-0 bg-gray-800 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Transaction</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Direction</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Amount</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Price ({tokenB.symbol}/{tokenA.symbol})</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {[...swapEvents].reverse().map((swap, index) => (
                          <tr key={`${swap.transactionHash}-${swap.logIndex}`} className={index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              <a 
                                href={`https://etherscan.io/tx/${swap.transactionHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                {`${swap.transactionHash.substring(0, 6)}...${swap.transactionHash.substring(62)}`}
                              </a>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{swap.tradeDirection}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm">{swap.details}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{swap.price.toFixed(6)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 text-center text-sm text-gray-400">
                    Showing all {swapEvents.length} swaps
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {pairExists && swapEvents.length === 0 && !isLoading && !error && (
            <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700 text-center py-12">
              <p className="text-gray-400">
                No swap history found for this pair. Try executing some swaps first.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}