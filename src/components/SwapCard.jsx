// src/components/SwapCard.jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenSelect from './TokenSelect';
import { useSwap } from '../hooks/useSwap.js';
import { MAINNET_TOKENS } from '../constants/tokens.js';
import { useToken } from '../hooks/useToken.js';
import { CONTRACTS } from '../constants/contracts.js';

export default function SwapCard() {
  const { address, isConnected } = useAccount();
  
  // Default tokens
  const [tokenInAddress, setTokenInAddress] = useState(MAINNET_TOKENS.WETH);
  const [tokenOutAddress, setTokenOutAddress] = useState(MAINNET_TOKENS.USDC);
  
  // Get token details
  const tokenIn = useToken(tokenInAddress);
  const tokenOut = useToken(tokenOutAddress);
  
  // Initialize swap hook
  const {
    amountIn,
    amountOut,
    slippage,
    setSlippage,
    handleAmountInChange,
    executeSwap,
    isSwapPending,
    error,
    txHash,
  } = useSwap(tokenInAddress, tokenOutAddress);
  
  // Check if token needs approval
  const [needsApproval, setNeedsApproval] = useState(false);
  
  // Check allowance when amount changes
  useEffect(() => {
    const checkAllowance = async () => {
      if (!address || !amountIn || Number(amountIn) <= 0) return;
      
      const allowance = await tokenIn.checkAllowance(address, CONTRACTS.ROUTER);
      const parsedAmount = parseUnits(amountIn, tokenIn.decimals);
      
      setNeedsApproval(allowance < parsedAmount);
    };
    
    checkAllowance();
  }, [address, amountIn, tokenIn]);
  
  // Swap tokens positions
  const swapTokenPositions = () => {
    const tempToken = tokenInAddress;
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(tempToken);
  };
  
  return (
    <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 text-center">Swap</h2>
      
      {!isConnected ? (
        <div className="flex flex-col items-center my-10 space-y-4">
          <p className="text-gray-400 text-center mb-4">
            Connect your wallet to access token swapping
          </p>
          <ConnectButton />
        </div>
      ) : (
        <div className="space-y-4">
          {/* From token section */}
          <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between mb-2">
              <label className="text-gray-400">From</label>
              <span className="text-gray-400 text-sm">
                Balance: {tokenIn.formattedBalance || '0'} {tokenIn.symbol}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={amountIn}
                onChange={(e) => handleAmountInChange(e.target.value)}
                placeholder="0.0"
                className="bg-transparent text-xl outline-none flex-grow font-medium"
              />
              <TokenSelect
                value={tokenInAddress}
                onChange={setTokenInAddress}
                excludeToken={tokenOutAddress}
              />
            </div>
            
            {/* Max button */}
            {tokenIn.balance && (
              <div className="flex justify-end mt-1">
                <button 
                  onClick={() => handleAmountInChange(tokenIn.formattedBalance)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Max
                </button>
              </div>
            )}
          </div>
          
          {/* Swap direction button */}
          <div className="flex justify-center relative z-10">
            <button 
              onClick={swapTokenPositions}
              className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full absolute -translate-y-1/2 shadow-lg transition-transform hover:rotate-180 duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
              </svg>
            </button>
          </div>
          
          {/* To token section */}
          <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
            <div className="flex justify-between mb-2">
              <label className="text-gray-400">To</label>
              <span className="text-gray-400 text-sm">
                Balance: {tokenOut.formattedBalance || '0'} {tokenOut.symbol}
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={amountOut}
                readOnly
                placeholder="0.0"
                className="bg-transparent text-xl outline-none flex-grow font-medium"
              />
              <TokenSelect
                value={tokenOutAddress}
                onChange={setTokenOutAddress}
                excludeToken={tokenInAddress}
              />
            </div>
          </div>
          
          {/* Exchange rate */}
          {amountIn && amountOut && Number(amountIn) > 0 && Number(amountOut) > 0 && (
            <div className="text-sm text-right text-gray-400 px-1">
              1 {tokenIn.symbol} ≈ {(Number(amountOut) / Number(amountIn)).toFixed(6)} {tokenOut.symbol}
            </div>
          )}
          
          {/* Slippage settings */}
          <div className="flex items-center justify-between bg-gray-700/40 rounded p-3">
            <span className="text-gray-400 text-sm">Slippage Tolerance</span>
            <div className="flex space-x-2">
              {[0.1, 0.5, 1].map((value) => (
                <button
                  key={value}
                  onClick={() => setSlippage(value)}
                  className={`px-2 py-1 text-xs rounded ${
                    slippage === value 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {value}%
                </button>
              ))}
            </div>
          </div>
          
          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
              {error}
            </div>
          )}
          
          {/* Swap button */}
          {needsApproval ? (
            <button
              onClick={() => tokenIn.approveSpender(CONTRACTS.ROUTER, amountIn)}
              disabled={tokenIn.isApproving || !amountIn || Number(amountIn) <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {tokenIn.isApproving ? 'Approving...' : `Approve ${tokenIn.symbol}`}
            </button>
          ) : (
            <button
              onClick={executeSwap}
              disabled={isSwapPending || !amountIn || !amountOut || Number(amountIn) <= 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSwapPending ? 'Swapping...' : 'Swap'}
            </button>
          )}
          
          {/* Transaction hash */}
          {txHash && (
            <div className="text-center mt-2 bg-blue-500/10 p-2 rounded border border-blue-500/20">
              <p className="text-sm text-gray-400 mb-1">Transaction submitted</p>
              <a
                href={`https://etherscan.io/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                View on Etherscan
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}