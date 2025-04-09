// src/components/FirstLiquidityInfo.jsx
export default function FirstLiquidityInfo() {
    return (
      <div className="bg-blue-900/20 border border-blue-900/30 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <div className="mr-3 mt-1 text-blue-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="font-medium text-blue-400 mb-1">You are the first liquidity provider</h4>
            <p className="text-sm text-gray-300">
              The ratio of tokens you add will set the price of this pool.
            </p>
            <ul className="mt-2 text-sm text-gray-300 list-disc pl-5 space-y-1">
              <li>Once you are happy with the rate, click supply to review.</li>
              <li>When you add liquidity, you will receive pool tokens representing your position.</li>
              <li>These tokens automatically earn fees proportional to your share of the pool.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }