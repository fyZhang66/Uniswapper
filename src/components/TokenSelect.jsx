// src/components/TokenSelect.jsx
import { useState, useRef, useEffect } from 'react';
import { TOKEN_LIST } from '../constants/tokens.js';

export default function TokenSelect({ value, onChange, excludeToken }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  // Find the selected token details
  const selectedToken = TOKEN_LIST.find(token => token.address === value);
  
  // Filter out the excluded token and apply search
  const filteredTokens = TOKEN_LIST.filter(token => {
    // Exclude the token that's already selected in the other input
    if (excludeToken && token.address === excludeToken) {
      return false;
    }
    
    // Apply search filtering
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        token.symbol.toLowerCase().includes(query) || 
        token.name.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg p-2 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedToken ? (
          <>
            {selectedToken.logoURI && (
              <img 
                src={selectedToken.logoURI} 
                alt={selectedToken.symbol} 
                className="w-6 h-6 rounded-full"
              />
            )}
            <span className="font-medium">{selectedToken.symbol}</span>
          </>
        ) : (
          <span>Select token</span>
        )}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute mt-1 w-72 max-h-96 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10 overflow-hidden right-0">
          <div className="p-3 border-b border-gray-700">
            <h3 className="text-sm font-medium mb-2">Select a token</h3>
            <input
              type="text"
              placeholder="Search by name or symbol"
              className="w-full px-3 py-2 bg-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
          
          <div className="max-h-60 overflow-auto">
            {filteredTokens.length > 0 ? (
              <ul className="py-1">
                {filteredTokens.map(token => (
                  <li 
                    key={token.address}
                    className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => {
                      onChange(token.address);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    {token.logoURI && (
                      <img 
                        src={token.logoURI} 
                        alt={token.symbol} 
                        className="w-7 h-7 rounded-full"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium">{token.symbol}</span>
                      <span className="text-sm text-gray-400">{token.name}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-8 text-center text-gray-400">
                No tokens found matching "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}