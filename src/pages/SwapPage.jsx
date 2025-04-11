import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import TokenInput from "../components/TokenInput";
import SwapDirectionButton from "../components/SwapDirectionButton";
import SlippageTolerance from "../components/SlippageTolerance";
import ConnectWalletButton from "../components/ConnectWalletButton";
import TransactionError from "../components/TransactionError";
import TransactionSuccess from "../components/TransactionSuccess";
import PageLayout from "../components/PageLayout";
import ActionButton from "../components/ActionButton";
import { MAINNET_TOKENS } from "../constants/tokens";
import { useToken } from "../hooks/useToken";
import { useSwap } from "../hooks/useSwap";
import AMMCurve from "../components/AMMCurve";
import { SwapAMMInfo } from "../components/AMMInfoPanel";

// Create a SwapSimulation component that extends AMMCurve
const SwapSimulation = ({
  reserveA,
  reserveB,
  tokenASymbol,
  tokenBSymbol,
  amountIn,
  amountOut,
  tokenInIsTokenA,
  priceImpact,
}) => {
  // Calculate expected point after swap
  const [expectedPoint, setExpectedPoint] = useState({
    reserveA: reserveA,
    reserveB: reserveB,
  });

  useEffect(() => {
    // Reset to actual reserves when they change
    setExpectedPoint({
      reserveA: reserveA,
      reserveB: reserveB,
    });
  }, [reserveA, reserveB]);

  // Calculate new point position after swap
  useEffect(() => {
    if (!reserveA || !reserveB || !amountIn || !amountOut) return;

    const currentReserveA = parseFloat(reserveA);
    const currentReserveB = parseFloat(reserveB);
    const swapAmountIn = parseFloat(amountIn);

    // Instead of using the estimated output, we'll calculate the exact output that
    // maintains the constant product formula x*y=k
    const k = currentReserveA * currentReserveB;

    if (tokenInIsTokenA) {
      // For tokenA → tokenB swap
      // New reserveA = currentReserveA - amountIn
      const newReserveA = currentReserveA + swapAmountIn;

      // Calculate newReserveB to maintain the constant product formula
      // newReserveA * newReserveB = k
      const newReserveB = k / newReserveA;

      setExpectedPoint({
        reserveA: newReserveA.toString(),
        reserveB: newReserveB.toString(),
      });
    } else {
      // For tokenB → tokenA swap
      // New reserveB = currentReserveB - amountIn
      const newReserveB = currentReserveB + swapAmountIn;

      // Calculate newReserveA to maintain the constant product formula
      // newReserveA * newReserveB = k
      const newReserveA = k / newReserveB;

      setExpectedPoint({
        reserveA: newReserveA.toString(),
        reserveB: newReserveB.toString(),
      });
    }
  }, [reserveA, reserveB, amountIn, amountOut, tokenInIsTokenA]);

  return (
    <div>
      <h3 className="text-xl font-medium mb-2">Swap Simulation</h3>

      <div className="flex justify-between text-sm mb-4">
        <div className="text-blue-400">
          <div>Current Position</div>
          <div>
            {parseFloat(reserveA).toFixed(4)} {tokenASymbol}
          </div>
          <div>
            {parseFloat(reserveB).toFixed(4)} {tokenBSymbol}
          </div>
        </div>
        <div className="text-emerald-400">
          <div>Expected Position</div>
          <div>
            {parseFloat(expectedPoint.reserveA).toFixed(4)} {tokenASymbol}
          </div>
          <div>
            {parseFloat(expectedPoint.reserveB).toFixed(4)} {tokenBSymbol}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 mb-2">
        Constant Product (k):{" "}
        {(parseFloat(reserveA) * parseFloat(reserveB)).toLocaleString(
          undefined,
          { maximumFractionDigits: 4 }
        )}
      </div>

      <div className="mb-6">
        <AMMCurve
          reserveA={reserveA}
          reserveB={reserveB}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          expectedPointA={expectedPoint.reserveA}
          expectedPointB={expectedPoint.reserveB}
        />
      </div>

      <div className="bg-gray-700/40 rounded-lg p-4 text-sm text-gray-300">
        <h4 className="font-medium mb-2">What's happening:</h4>
        <p>
          When you swap {parseFloat(amountIn).toFixed(4)} {tokenASymbol} for
          approximately {parseFloat(amountOut).toFixed(4)} {tokenBSymbol}, you
          move along the same constant product curve (x·y=k).
        </p>
        <div className="mt-2 flex justify-between items-center">
          <span>Price Impact:</span>
          <span
            className={`font-medium ${
              priceImpact > 3
                ? "text-yellow-400"
                : priceImpact > 1
                ? "text-yellow-300"
                : "text-green-400"
            }`}
          >
            {priceImpact.toFixed(2)}%
          </span>
        </div>
        {priceImpact > 3 && (
          <p className="mt-1 text-yellow-400">
            This is a relatively high price impact, which means your trade
            significantly affects the price.
          </p>
        )}
      </div>
    </div>
  );
};

export default function SwapPage() {
  const { isConnected } = useAccount();

  // Default tokens
  const [tokenInAddress, setTokenInAddress] = useState(MAINNET_TOKENS.DAI);
  const [tokenOutAddress, setTokenOutAddress] = useState(MAINNET_TOKENS.UNI);

  // Amount inputs
  const [amountIn, setAmountIn] = useState("");
  const [amountOut, setAmountOut] = useState("");

  // Slippage tolerance
  const [slippage, setSlippage] = useState(0.5); // Default 0.5%

  // Price impact
  const [priceImpact, setPriceImpact] = useState(null);

  // Get token details
  const tokenIn = useToken(tokenInAddress);
  const tokenOut = useToken(tokenOutAddress);

  // Use swap hook
  const {
    pairExists,
    reserves,
    estimatedOutput,
    isSwapping,
    error,
    success,
    swap,
    calculateOutputAmount,
    calculatePriceImpact,
  } = useSwap(tokenInAddress, tokenOutAddress);

  // Swap token positions
  const swapTokenPositions = () => {
    const tempTokenAddress = tokenInAddress;
    setTokenInAddress(tokenOutAddress);
    setTokenOutAddress(tempTokenAddress);

    setAmountIn(amountOut);
    setAmountOut(estimatedOutput || "");
  };

  // Handle input change and calculate the output amount
  const handleAmountInChange = async (value) => {
    setAmountIn(value);
    if (pairExists && value && Number(value) > 0) {
      calculateOutputAmount(value);

      // Calculate price impact
      const impact = calculatePriceImpact(value);
      setPriceImpact(impact);
    } else {
      setAmountOut("");
      setPriceImpact(null);
    }
  };

  // Update output amount when estimated output changes
  useEffect(() => {
    if (estimatedOutput) {
      setAmountOut(estimatedOutput);
    }
  }, [estimatedOutput]);

  // Reset fields when tokens change
  useEffect(() => {
    setAmountIn("");
    setAmountOut("");
    setPriceImpact(null);
  }, [tokenInAddress, tokenOutAddress]);

  // Component for swap form
  const SwapForm = () => (
    <>
      <h2 className="text-xl font-semibold mb-4 text-center">
        Swap Tokens
      </h2>

      {!isConnected ? (
        <ConnectWalletButton message="Connect your wallet to swap tokens" />
      ) : (
        <div className="space-y-4">
          {/* Token in input */}
          <TokenInput 
            label="You Send"
            value={amountIn}
            onChange={handleAmountInChange}
            tokenAddress={tokenInAddress}
            onTokenChange={setTokenInAddress}
            excludeToken={tokenOutAddress}
            balance={tokenIn.formattedBalance}
            symbol={tokenIn.symbol}
          />

          {/* Swap direction button */}
          <SwapDirectionButton onClick={swapTokenPositions} />

          {/* Token out input */}
          <TokenInput 
            label="You Receive"
            value={amountOut}
            onChange={() => {}}
            tokenAddress={tokenOutAddress}
            onTokenChange={setTokenOutAddress}
            excludeToken={tokenInAddress}
            balance={tokenOut.formattedBalance}
            symbol={tokenOut.symbol}
            readOnly={true}
          />

          {/* Exchange rate information */}
          {pairExists && reserves && amountIn && amountOut && (
            <div className="bg-gray-700/40 rounded-lg p-3">
              <div className="text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Exchange Rate:</span>
                  <span>
                    1 {tokenIn.symbol} ≈{" "}
                    {(Number(amountOut) / Number(amountIn)).toFixed(4)}{" "}
                    {tokenOut.symbol}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span>Price Impact:</span>
                  <span
                    className={`${
                      priceImpact && priceImpact > 5
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {priceImpact ? `${priceImpact.toFixed(2)}%` : "0.00%"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* No liquidity warning */}
          {!pairExists && (
            <div className="bg-yellow-700/20 text-yellow-400 p-3 rounded-lg text-sm border border-yellow-700/30">
              <p>
                This pair doesn't have liquidity yet. You'll need to add
                liquidity to create the trading pair first.
              </p>
            </div>
          )}

          {/* Slippage settings */}
          <SlippageTolerance slippage={slippage} onChange={setSlippage} />

          {/* Error and success messages */}
          <TransactionError error={error} />
          <TransactionSuccess success={success} message="Swap completed successfully!" />

          {/* Swap button */}
          <ActionButton
            onClick={() => swap(amountIn, slippage)}
            disabled={
              !amountIn ||
              !amountOut ||
              Number(amountIn) <= 0 ||
              Number(amountOut) <= 0 ||
              !pairExists
            }
            isLoading={isSwapping}
            loadingText="Swapping..."
            actionText="Swap"
          />
        </div>
      )}
    </>
  );

  // Component for AMM visualization
  const AMMVisualization = () => {
    // Check if pair exists and reserves is properly initialized with all required properties
    if (!pairExists || !reserves || !reserves.reserve0 || !reserves.reserve1) {
      return (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">
            AMM Constant Product Curve
          </h3>
          <p className="text-gray-400">
            {!pairExists
              ? "No liquidity pool exists for this token pair yet. Add liquidity to create it!"
              : "Loading pool data..."}
          </p>
        </div>
      );
    }
    
    // Only render SwapSimulation if all required values are available
    if (amountIn && amountOut && Number(amountIn) > 0 && Number(amountOut) > 0) {
      return (
        <SwapSimulation
          reserveA={reserves.reserve1}
          reserveB={reserves.reserve0}
          tokenASymbol={
            tokenIn.symbol === tokenOut.symbol ? "Token A" : tokenIn.symbol
          }
          tokenBSymbol={
            tokenIn.symbol === tokenOut.symbol ? "Token B" : tokenOut.symbol
          }
          amountIn={amountIn}
          amountOut={amountOut}
          tokenInIsTokenA={true}
          priceImpact={priceImpact || 0}
        />
      );
    }
    
    // Default to showing basic AMM info
    return (
      <SwapAMMInfo
        reserveA={reserves.reserve1}
        reserveB={reserves.reserve0}
        tokenASymbol={
          tokenIn.symbol === tokenOut.symbol ? "Token A" : tokenIn.symbol
        }
        tokenBSymbol={
          tokenIn.symbol === tokenOut.symbol ? "Token B" : tokenOut.symbol
        }
      />
    );
  };

  const footerNote = "Note: Swapping tokens will require two transactions: one to approve spending your tokens and one to execute the swap.";

  return (
    <PageLayout
      title="Swap"
      description="Swap tokens instantly with low fees and minimal slippage"
      leftColumn={<SwapForm />}
      rightColumn={<AMMVisualization />}
      footerNote={footerNote}
    />
  );
}
