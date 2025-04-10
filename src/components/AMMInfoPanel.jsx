import React from 'react';
import AMMCurve from './AMMCurve';

// Shared component for displaying AMM information used by both Swap and Liquidity pages
export const AMMCurveWithInfo = ({ 
  reserveA, 
  reserveB, 
  tokenASymbol, 
  tokenBSymbol,
  title = "AMM Constant Product Curve"
}) => {
  const k = parseFloat(reserveA) * parseFloat(reserveB);
  
  return (
    <div>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      
      <div className="flex justify-between text-sm mb-4">
        <div className="text-blue-400">
          <div>Current Pool</div>
          <div>{parseFloat(reserveA).toFixed(4)} {tokenASymbol}</div>
          <div>{parseFloat(reserveB).toFixed(4)} {tokenBSymbol}</div>
        </div>
        <div className="text-blue-400">
          <div>Constant Product (k)</div>
          <div>{k.toFixed(2)}</div>
        </div>
      </div>
      
      <div className="mb-6">
        <AMMCurve 
          reserveA={reserveA}
          reserveB={reserveB}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
        />
      </div>
      
      <div className="bg-gray-700/40 rounded-lg p-4 text-sm text-gray-300">
        <h4 className="font-medium mb-2">How AMM Works:</h4>
        <p>
          Automated Market Makers use the constant product formula: <span className="font-mono bg-gray-600/50 px-1 rounded">x·y=k</span> where:
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li><span className="text-blue-300">{tokenASymbol}</span> reserves: {parseFloat(reserveA).toFixed(4)}</li>
          <li><span className="text-blue-300">{tokenBSymbol}</span> reserves: {parseFloat(reserveB).toFixed(4)}</li>
          <li><span className="text-blue-300">k</span> (constant product): {k.toFixed(2)}</li>
        </ul>
        <p className="mt-2">
          When swapping tokens, you move along this curve. When adding or removing liquidity, the entire curve shifts.
        </p>
      </div>
    </div>
  );
};

// Component specifically for swap page with swap-focused instructions
export const SwapAMMInfo = (props) => (
  <AMMCurveWithInfo 
    {...props}
    title="Swap Pool Information" 
  />
);

// Component specifically for liquidity page with liquidity-focused instructions
export const LiquidityAMMInfo = (props) => (
  <AMMCurveWithInfo 
    {...props}
    title="Liquidity Pool Information" 
  />
);

export default AMMCurveWithInfo; 