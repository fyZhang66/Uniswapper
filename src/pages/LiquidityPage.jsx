// src/pages/LiquidityPage.jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import TokenSelect from '../components/TokenSelect';
import FirstLiquidityInfo from '../components/FirstLiquidityInfo';
import { MAINNET_TOKENS } from '../constants/tokens';
import { useToken } from '../hooks/useToken';
import { useLiquidity } from '../hooks/useLiquidity';

export default function LiquidityPage() {
  const { isConnected } = useAccount();
  
  // Default tokens
  const [tokenAAddress, setTokenAAddress] = useState(MAINNET_TOKENS.WETH);
  const [tokenBAddress, setTokenBAddress] = useState(MAINNET_TOKENS.USDC);
  
  // Amount inputs
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  
  // Slippage tolerance
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%
  
  // LP token amount
  const [lpAmount, setLpAmount] = useState('');
  
  // Get token details
  const tokenA = useToken(tokenAAddress);
  const tokenB = useToken(tokenBAddress);
  
  // Use custom liquidity hook (we'll create this next)
  const {
    pairExists,
    reserves,
    addLiquidity,
    removeLiquidity,
    calculateOptimalAmount,
    isAddingLiquidity,
    error,
    lpTokenBalance,
  } = useLiquidity(tokenAAddress, tokenBAddress);
  
  // Swap token positions
  const swapTokenPositions = () => {
    const tempToken = tokenAAddress;
    setTokenAAddress(tokenBAddress);
    setTokenBAddress(tempToken);
    
    const tempAmount = amountA;
    setAmountA(amountB);
    setAmountB(tempAmount);
  };
  
  // Handle input change and calculate the other amount based on reserves
  const handleAmountAChange = (value) => {
    setAmountA(value);
    if (pairExists && reserves && value) {
      // Calculate token B amount based on the ratio of reserves
      const calculatedAmountB = calculateOptimalAmount(value, true);
      setAmountB(calculatedAmountB);
    }
  };
  
  const handleAmountBChange = (value) => {
    setAmountB(value);
    if (pairExists && reserves && value) {
      // Calculate token A amount based on the ratio of reserves
      const calculatedAmountA = calculateOptimalAmount(value, false);
      setAmountA(calculatedAmountA);
    }
  };
  
  // Handle LP token amount change
  const handleLpAmountChange = (value) => {
    setLpAmount(value);
  };
  
  // Reset fields when tokens change
  useEffect(() => {
    setAmountA('');
    setAmountB('');
    setLpAmount('');
  }, [tokenAAddress, tokenBAddress]);
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">Liquidity</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Add or remove liquidity to earn fees from trades on this pair
        </p>
      </div>
      
      <div className="flex justify-center">
        <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 text-center">Add Liquidity</h2>
          
          {!isConnected ? (
            <div className="flex flex-col items-center my-10 space-y-4">
              <p className="text-gray-400 text-center mb-4">
                Connect your wallet to manage liquidity
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-4">
              {/* First token input */}
              <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between mb-2">
                  <label className="text-gray-400">First Token</label>
                  <span className="text-gray-400 text-sm">
                    Balance: {tokenA.formattedBalance || '0'} {tokenA.symbol}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={amountA}
                    onChange={(e) => handleAmountAChange(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-xl outline-none flex-grow font-medium"
                  />
                  <TokenSelect
                    value={tokenAAddress}
                    onChange={setTokenAAddress}
                    excludeToken={tokenBAddress}
                  />
                </div>
                
                {/* Max button */}
                {tokenA.balance && (
                  <div className="flex justify-end mt-1">
                    <button 
                      onClick={() => handleAmountAChange(tokenA.formattedBalance)}
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
              
              {/* Second token input */}
              <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
                <div className="flex justify-between mb-2">
                  <label className="text-gray-400">Second Token</label>
                  <span className="text-gray-400 text-sm">
                    Balance: {tokenB.formattedBalance || '0'} {tokenB.symbol}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4">
                  <input
                    type="number"
                    value={amountB}
                    onChange={(e) => handleAmountBChange(e.target.value)}
                    placeholder="0.0"
                    className="bg-transparent text-xl outline-none flex-grow font-medium"
                  />
                  <TokenSelect
                    value={tokenBAddress}
                    onChange={setTokenBAddress}
                    excludeToken={tokenAAddress}
                  />
                </div>
                
                {/* Max button */}
                {tokenB.balance && (
                  <div className="flex justify-end mt-1">
                    <button 
                      onClick={() => handleAmountBChange(tokenB.formattedBalance)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Max
                    </button>
                  </div>
                )}
              </div>
              
              {/* First Liquidity Provider Info */}
              {!pairExists && (
                <FirstLiquidityInfo />
              )}
              
              {/* Existing Pool Information */}
              {pairExists && reserves && (
                <div className="bg-gray-700/40 rounded-lg p-3">
                  <div className="text-sm text-gray-300">
                    <div className="flex justify-between">
                      <span>Pool Information:</span>
                    </div>
                    <div className="mt-1 space-y-1">
                      <div className="flex justify-between">
                        <span>{tokenA.symbol} Reserves:</span>
                        <span className="font-medium">{reserves.reserveA || '0'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{tokenB.symbol} Reserves:</span>
                        <span className="font-medium">{reserves.reserveB || '0'}</span>
                      </div>
                      {lpTokenBalance && (
                        <div className="flex justify-between">
                          <span>Your LP Tokens:</span>
                          <span className="font-medium">{lpTokenBalance}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Remove Liquidity Section */}
              {pairExists && lpTokenBalance && Number(lpTokenBalance) > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700">
                  <h3 className="text-lg font-semibold mb-4 text-center">Remove Liquidity</h3>
                  <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
                    <div className="flex justify-between mb-2">
                      <label className="text-gray-400">LP Tokens</label>
                      <span className="text-gray-400 text-sm">
                        Balance: {lpTokenBalance}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        value={lpAmount}
                        onChange={(e) => handleLpAmountChange(e.target.value)}
                        placeholder="0.0"
                        className="bg-transparent text-xl outline-none flex-grow font-medium"
                      />
                      <span className="text-gray-400">LP</span>
                    </div>
                    
                    {/* Max button */}
                    <div className="flex justify-end mt-1">
                      <button 
                        onClick={() => handleLpAmountChange(lpTokenBalance)}
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Slippage settings */}
              <div className="flex items-center justify-between bg-gray-700/40 rounded-lg p-3">
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
              
              {/* Add Liquidity button */}
              <button
                onClick={() => addLiquidity(amountA, amountB, slippage)}
                disabled={isAddingLiquidity || !amountA || !amountB || Number(amountA) <= 0 || Number(amountB) <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAddingLiquidity ? 'Adding Liquidity...' : 'Add Liquidity'}
              </button>

              {/* Remove Liquidity button */}
              {pairExists && lpTokenBalance && Number(lpTokenBalance) > 0 && (
                <button
                  onClick={() => removeLiquidity(lpAmount, slippage)}
                  disabled={isAddingLiquidity || !lpAmount || Number(lpAmount) <= 0 || Number(lpAmount) > Number(lpTokenBalance)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-4"
                >
                  {isAddingLiquidity ? 'Removing Liquidity...' : 'Remove Liquidity'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Note: Adding liquidity will require two transactions: one to approve spending your tokens and one to add liquidity to the pool.</p>
      </div>
    </div>
  );
}