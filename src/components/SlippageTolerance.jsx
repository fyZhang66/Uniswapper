import React from 'react';

const SlippageTolerance = ({ slippage, onChange }) => {
  // Common slippage values
  const slippageOptions = [0.1, 0.5, 1];

  return (
    <div className="flex items-center justify-between bg-gray-700/40 rounded-lg p-3">
      <span className="text-gray-400 text-sm">Slippage Tolerance</span>
      <div className="flex space-x-2">
        {slippageOptions.map((value) => (
          <button
            key={value}
            onClick={() => onChange(value)}
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
  );
};

export default SlippageTolerance;