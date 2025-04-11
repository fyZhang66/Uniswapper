// src/pages/LiquidityPage.jsx
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import TokenInput from '../components/TokenInput';
import SwapDirectionButton from '../components/SwapDirectionButton';
import SlippageTolerance from '../components/SlippageTolerance';
import ConnectWalletButton from '../components/ConnectWalletButton';
import TransactionError from '../components/TransactionError';
import PageLayout from '../components/PageLayout';
import ActionButton from '../components/ActionButton';
import FirstLiquidityInfo from '../components/FirstLiquidityInfo';
import { MAINNET_TOKENS } from '../constants/tokens';
import { useToken } from '../hooks/useToken';
import { useLiquidity } from '../hooks/useLiquidity';
import AMMSimulation from '../components/AMMSimulation';
import { LiquidityAMMInfo } from '../components/AMMInfoPanel';

export default function LiquidityPage() {
  const { isConnected } = useAccount();
  
  // Default tokens
  const [tokenAAddress, setTokenAAddress] = useState(MAINNET_TOKENS.DAI);
  const [tokenBAddress, setTokenBAddress] = useState(MAINNET_TOKENS.UNI);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('add'); // 'add' or 'remove'
  
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
  
  // Use custom liquidity hook
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

  // Reset LP amount when tab changes to add
  useEffect(() => {
    if (activeTab === 'add') {
      setLpAmount('');
    } else {
      setAmountA('');
      setAmountB('');
    }
  }, [activeTab]);

  // Component for liquidity form tabs
  const LiquidityTabs = () => (
    <div className="flex mb-6 border-b border-gray-700">
      <button 
        className={`flex-1 pb-3 font-medium text-center ${activeTab === 'add' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        onClick={() => setActiveTab('add')}
      >
        Add Liquidity
      </button>
      <button 
        className={`flex-1 pb-3 font-medium text-center ${activeTab === 'remove' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-300'}`}
        onClick={() => setActiveTab('remove')}
        disabled={!pairExists || !lpTokenBalance || Number(lpTokenBalance) <= 0}
      >
        Remove Liquidity
      </button>
    </div>
  );

  // Component for add liquidity form
  const AddLiquidityForm = () => (
    <>
      {/* First token input */}
      <TokenInput 
        label="First Token"
        value={amountA}
        onChange={handleAmountAChange}
        tokenAddress={tokenAAddress}
        onTokenChange={setTokenAAddress}
        excludeToken={tokenBAddress}
        balance={tokenA.formattedBalance}
        symbol={tokenA.symbol}
      />
      
      {/* Swap direction button */}
      <SwapDirectionButton onClick={swapTokenPositions} />
      
      {/* Second token input */}
      <TokenInput 
        label="Second Token"
        value={amountB}
        onChange={handleAmountBChange}
        tokenAddress={tokenBAddress}
        onTokenChange={setTokenBAddress}
        excludeToken={tokenAAddress}
        balance={tokenB.formattedBalance}
        symbol={tokenB.symbol}
      />
      
      {/* First Liquidity Provider Info */}
      {!pairExists && (
        <FirstLiquidityInfo />
      )}
      
      {/* Add Liquidity button */}
      <ActionButton
        onClick={() => addLiquidity(amountA, amountB, slippage)}
        disabled={!amountA || !amountB || Number(amountA) <= 0 || Number(amountB) <= 0}
        isLoading={isAddingLiquidity}
        loadingText="Adding Liquidity..."
        actionText="Add Liquidity"
      />
    </>
  );

  // Component for remove liquidity form
  const RemoveLiquidityForm = () => (
    <>
      <TokenInput
        label="LP Tokens to Remove"
        value={lpAmount}
        onChange={handleLpAmountChange}
        balance={lpTokenBalance}
        symbol="LP"
        tokenAddress={null}
      />
      
      {/* Expected output information */}
      {pairExists && reserves && lpAmount && Number(lpAmount) > 0 && (
        <div className="bg-gray-700/40 rounded-lg p-3">
          <div className="text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Expected Withdrawal:</span>
            </div>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between">
                <span>{tokenA.symbol}:</span>
                <span className="font-medium">
                  {(parseFloat(reserves.reserveA) * (parseFloat(lpAmount) / parseFloat(lpTokenBalance))).toFixed(4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{tokenB.symbol}:</span>
                <span className="font-medium">
                  {(parseFloat(reserves.reserveB) * (parseFloat(lpAmount) / parseFloat(lpTokenBalance))).toFixed(4)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove Liquidity button */}
      <ActionButton
        onClick={() => removeLiquidity(lpAmount, slippage)}
        disabled={!lpAmount || Number(lpAmount) <= 0 || Number(lpAmount) > Number(lpTokenBalance)}
        isLoading={isAddingLiquidity}
        loadingText="Removing Liquidity..."
        actionText="Remove Liquidity"
        variant="danger"
      />
    </>
  );

  // Component for pool information
  const PoolInformation = () => {
    if (!pairExists || !reserves) return null;
    
    return (
      <div className="bg-gray-700/40 rounded-lg p-3">
        <div className="text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Pool Information:</span>
          </div>
          <div className="mt-1 space-y-1">
            <div className="flex justify-between">
              <span>{tokenA.symbol} Reserves:</span>
              <span className="font-medium">{parseFloat(reserves.reserveA || '0').toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>{tokenB.symbol} Reserves:</span>
              <span className="font-medium">{parseFloat(reserves.reserveB || '0').toFixed(4)}</span>
            </div>
            {lpTokenBalance && (
              <div className="flex justify-between">
                <span>Your LP Tokens:</span>
                <span className="font-medium">{parseFloat(lpTokenBalance).toFixed(4)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Component for liquidity form
  const LiquidityForm = () => (
    <>
      <LiquidityTabs />
      
      {!isConnected ? (
        <ConnectWalletButton message="Connect your wallet to manage liquidity" />
      ) : (
        <div className="space-y-4">
          {/* Add or Remove Liquidity Form based on active tab */}
          {activeTab === 'add' ? <AddLiquidityForm /> : <RemoveLiquidityForm />}
          
          {/* Pool information - shown in both tabs */}
          <PoolInformation />
          
          {/* Slippage settings */}
          <SlippageTolerance slippage={slippage} onChange={setSlippage} />
          
          {/* Error message */}
          <TransactionError error={error} />
        </div>
      )}
    </>
  );

  // Component for AMM visualization
  const AMMVisualization = () => {
    if (!pairExists || !reserves || !reserves.reserveA || !reserves.reserveB) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">AMM Constant Product Curve</h3>
          <p className="text-gray-400">
            {!pairExists 
              ? "No liquidity pool exists for this token pair yet. Add liquidity to create it!"
              : "Loading pool data..."}
          </p>
        </div>
      );
    }
    
    if (activeTab === 'remove' && lpAmount && Number(lpAmount) > 0) {
      return (
        <AMMSimulation
          reserveA={reserves.reserveA}
          reserveB={reserves.reserveB}
          tokenASymbol={tokenA.symbol}
          tokenBSymbol={tokenB.symbol}
          isRemoving={true}
          lpAmount={lpAmount}
          lpTokenBalance={lpTokenBalance}
        />
      );
    } 
    
    if (activeTab === 'add' && amountA && amountB && Number(amountA) > 0 && Number(amountB) > 0) {
      return (
        <AMMSimulation
          reserveA={reserves.reserveA}
          reserveB={reserves.reserveB}
          tokenASymbol={tokenA.symbol}
          tokenBSymbol={tokenB.symbol}
          amountA={amountA}
          amountB={amountB}
          isRemoving={false}
        />
      );
    }
    
    return (
      <LiquidityAMMInfo 
        reserveA={reserves.reserveA}
        reserveB={reserves.reserveB}
        tokenASymbol={tokenA.symbol}
        tokenBSymbol={tokenB.symbol}
      />
    );
  };

  const footerNote = `Note: ${activeTab === 'add' ? 'Adding' : 'Removing'} liquidity will require two transactions: one to approve spending your tokens and one to ${activeTab === 'add' ? 'add liquidity to' : 'remove liquidity from'} the pool.`;

  return (
    <PageLayout
      title="Liquidity"
      description="Add or remove liquidity to earn fees from trades on this pair"
      leftColumn={<LiquidityForm />}
      rightColumn={<AMMVisualization />}
      footerNote={footerNote}
    />
  );
}