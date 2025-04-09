import { useEffect, useState } from 'react';
import AMMCurve from './AMMCurve';

const AMMSimulation = ({ 
  reserveA, 
  reserveB, 
  tokenASymbol, 
  tokenBSymbol,
  amountA = '0',
  amountB = '0',
  isRemoving = false,
  lpAmount = '0',
  lpTokenBalance = '0'
}) => {
  const [simulated, setSimulated] = useState({
    reserveA: reserveA,
    reserveB: reserveB
  });

  useEffect(() => {
    // Reset to actual reserves when they change
    setSimulated({
      reserveA: reserveA,
      reserveB: reserveB
    });
  }, [reserveA, reserveB]);

  // Calculate new reserves after liquidity change
  useEffect(() => {
    if (!reserveA || !reserveB) return;
    
    const currentReserveA = parseFloat(reserveA);
    const currentReserveB = parseFloat(reserveB);
    
    if (isRemoving) {
      // Simulate removing liquidity
      if (lpAmount && lpTokenBalance) {
        const ratio = parseFloat(lpAmount) / parseFloat(lpTokenBalance);
        if (ratio > 0 && ratio <= 1) {
          const newReserveA = currentReserveA * (1 - ratio);
          const newReserveB = currentReserveB * (1 - ratio);
          
          setSimulated({
            reserveA: newReserveA.toString(),
            reserveB: newReserveB.toString()
          });
        }
      }
    } else {
      // Simulate adding liquidity
      const newAmountA = parseFloat(amountA) || 0;
      const newAmountB = parseFloat(amountB) || 0;
      
      if (newAmountA > 0 && newAmountB > 0) {
        const newReserveA = currentReserveA + newAmountA;
        const newReserveB = currentReserveB + newAmountB;
        
        setSimulated({
          reserveA: newReserveA.toString(),
          reserveB: newReserveB.toString()
        });
      }
    }
  }, [reserveA, reserveB, amountA, amountB, isRemoving, lpAmount, lpTokenBalance]);

  // Calculate k values
  const currentK = parseFloat(reserveA) * parseFloat(reserveB);
  const simulatedK = parseFloat(simulated.reserveA) * parseFloat(simulated.reserveB);
  const kChange = ((simulatedK - currentK) / currentK) * 100;

  return (
    <div>
      <h3 className="text-xl font-medium mb-2">Liquidity Pool Simulation</h3>
      
      <div className="flex justify-between text-sm mb-4">
        <div className="text-blue-400">
          <div>Current Pool</div>
          <div>k = {currentK.toFixed(2)}</div>
        </div>
        <div className="text-emerald-400">
          <div>After {isRemoving ? 'Removal' : 'Addition'}</div>
          <div>k = {simulatedK.toFixed(2)}</div>
          <div className={kChange >= 0 ? 'text-green-500' : 'text-red-500'}>
            {kChange > 0 ? '+' : ''}{kChange.toFixed(2)}%
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <AMMCurve 
          reserveA={reserveA}
          reserveB={reserveB}
          tokenASymbol={tokenASymbol}
          tokenBSymbol={tokenBSymbol}
          simulatedReserveA={simulated.reserveA}
          simulatedReserveB={simulated.reserveB}
        />
      </div>
      
      <div className="bg-gray-700/40 rounded-lg p-4 text-sm text-gray-300">
        <h4 className="font-medium mb-2">What's happening:</h4>
        {isRemoving ? (
          <p>
            When you remove {parseFloat(lpAmount).toFixed(4)} LP tokens 
            ({((parseFloat(lpAmount) / parseFloat(lpTokenBalance)) * 100).toFixed(2)}% of your position),
            you're withdrawing {(parseFloat(reserveA) * parseFloat(lpAmount) / parseFloat(lpTokenBalance)).toFixed(4)} {tokenASymbol} and
            {' '}{(parseFloat(reserveB) * parseFloat(lpAmount) / parseFloat(lpTokenBalance)).toFixed(4)} {tokenBSymbol}.
            The constant product curve will shift down as the pool size decreases.
          </p>
        ) : (
          <p>
            When you add {parseFloat(amountA).toFixed(4)} {tokenASymbol} and {parseFloat(amountB).toFixed(4)} {tokenBSymbol},
            the constant product curve shifts up as the pool size increases. This allows for deeper liquidity and smaller
            price impacts for traders.
          </p>
        )}
      </div>
    </div>
  );
};

export default AMMSimulation; 