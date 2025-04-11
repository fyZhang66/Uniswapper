import React, { useState, useEffect, useRef } from 'react';
import TokenSelect from './TokenSelect';

const TokenInput = ({ label, value, onChange, tokenAddress, onTokenChange, excludeToken, balance, symbol, readOnly = false, showMaxButton = true, }) => {
  // Local state to manage input value with debounce
  const [localValue, setLocalValue] = useState(value);
  const debounceTimerRef = useRef(null);
  
  // Update local value when prop value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  // Handle input change with validation to ensure only valid numeric values
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    
    // Regex to validate decimal number format
    // Allows empty string, digits, and one decimal point with optional digits after
    if (inputValue === '' || /^[0-9]*\.?[0-9]*$/.test(inputValue)) {
      setLocalValue(inputValue);
      
      // Clear any existing timeout
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // Set a new timeout to update the parent component after delay
      debounceTimerRef.current = setTimeout(() => {
        onChange(inputValue);
      }, 300); // 300ms delay
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Handle max button click without debounce
  const handleMaxClick = () => {
    setLocalValue(balance);
    onChange(balance);
  };

  return (
    <div className="bg-gray-700/70 rounded-lg p-4 border border-gray-600">
      <div className="flex justify-between mb-2">
        <label className="text-gray-400">{label}</label>
        <span className="text-gray-400 text-sm">
          Balance: {parseFloat(balance || '0').toFixed(4)} {symbol}
        </span>
      </div>

      <div className="flex items-center space-x-4">
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder="0.0"
          className="bg-transparent text-xl outline-none flex-grow font-medium"
          readOnly={readOnly}
        />
        {tokenAddress ? (
          <TokenSelect
            value={tokenAddress}
            onChange={onTokenChange}
            excludeToken={excludeToken}
          />
        ) : (
          <span className="text-gray-400">{symbol}</span>
        )}
      </div>

      {/* Max button */}
      {showMaxButton && balance && !readOnly && (
        <div className="flex justify-end mt-1">
          <button
            onClick={handleMaxClick}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Max
          </button>
        </div>
      )}
    </div>
  );
};

export default TokenInput;