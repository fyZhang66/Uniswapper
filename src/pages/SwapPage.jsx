import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import TokenSelect from "../components/TokenSelect";
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

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          Swap
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Swap tokens instantly with low fees and minimal slippage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* First column - Swap Form */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Swap Tokens
            </h2>

            {!isConnected ? (
              <div className="flex flex-col items-center my-10 space-y-4">
                <p className="text-gray-400 text-center mb-4">
                  Connect your wallet to swap tokens
                </p>
                <ConnectButton />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Token in input */}
                <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between mb-2">
                    <label className="text-gray-400">You Send</label>
                    <span className="text-gray-400 text-sm">
                      Balance:{" "}
                      {parseFloat(tokenIn.formattedBalance || "0").toFixed(4)}{" "}
                      {tokenIn.symbol}
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
                        onClick={() =>
                          handleAmountInChange(tokenIn.formattedBalance)
                        }
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
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
                    </svg>
                  </button>
                </div>

                {/* Token out input */}
                <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
                  <div className="flex justify-between mb-2">
                    <label className="text-gray-400">You Receive</label>
                    <span className="text-gray-400 text-sm">
                      Balance:{" "}
                      {parseFloat(tokenOut.formattedBalance || "0").toFixed(4)}{" "}
                      {tokenOut.symbol}
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
                <div className="flex items-center justify-between bg-gray-700/40 rounded-lg p-3">
                  <span className="text-gray-400 text-sm">
                    Slippage Tolerance
                  </span>
                  <div className="flex space-x-2">
                    {[0.1, 0.5, 1].map((value) => (
                      <button
                        key={value}
                        onClick={() => setSlippage(value)}
                        className={`px-2 py-1 text-xs rounded ${
                          slippage === value
                            ? "bg-blue-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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

                {/* Success message */}
                {success && (
                  <div className="text-green-500 text-sm bg-green-500/10 p-2 rounded border border-green-500/20">
                    Swap completed successfully!
                  </div>
                )}

                {/* Swap button */}
                <button
                  onClick={() => swap(amountIn, slippage)}
                  disabled={
                    isSwapping ||
                    !amountIn ||
                    !amountOut ||
                    Number(amountIn) <= 0 ||
                    Number(amountOut) <= 0 ||
                    !pairExists
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSwapping ? "Swapping..." : "Swap"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Second column - AMM Curve/Simulation */}
        <div className="flex justify-center">
          <div className="w-full bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700">
            {pairExists && reserves ? (
              amountIn &&
              amountOut &&
              Number(amountIn) > 0 &&
              Number(amountOut) > 0 ? (
                <SwapSimulation
                  reserveA={reserves.reserve1}
                  reserveB={reserves.reserve0}
                  tokenASymbol={
                    tokenIn.symbol === tokenOut.symbol
                      ? "Token A"
                      : tokenIn.symbol
                  }
                  tokenBSymbol={
                    tokenIn.symbol === tokenOut.symbol
                      ? "Token B"
                      : tokenOut.symbol
                  }
                  amountIn={amountIn}
                  amountOut={amountOut}
                  tokenInIsTokenA={true}
                  priceImpact={priceImpact || 0}
                />
              ) : (
                <SwapAMMInfo
                  reserveA={reserves.reserve1}
                  reserveB={reserves.reserve0}
                  tokenASymbol={
                    tokenIn.symbol === tokenOut.symbol
                      ? "Token A"
                      : tokenIn.symbol
                  }
                  tokenBSymbol={
                    tokenIn.symbol === tokenOut.symbol
                      ? "Token B"
                      : tokenOut.symbol
                  }
                />
              )
            ) : (
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
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        <p>
          Note: Swapping tokens will require two transactions: one to approve
          spending your tokens and one to execute the swap.
        </p>
      </div>
    </div>
  );
}
