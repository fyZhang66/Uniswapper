import { ConnectButton } from '@rainbow-me/rainbowkit';
import { FEATURES } from '../constants/config.js';

const Header = ({ activeTab, setActiveTab }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Title */}
          <div className="flex items-center">
            <div className="text-blue-500 text-3xl font-bold mr-2">🦄</div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                UniswapV2 Frontend
              </h1>
              <p className="text-xs text-gray-400">Decentralized Token Exchange</p>
            </div>
          </div>
          
          {/* Navigation Tabs - Desktop */}
          <div className="hidden md:flex space-x-1 mx-4">
            {FEATURES.ENABLE_SWAP && (
              <button
                onClick={() => setActiveTab('swap')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'swap' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Swap
              </button>
            )}
            
            {FEATURES.ENABLE_LIQUIDITY && (
              <button
                onClick={() => setActiveTab('liquidity')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'liquidity' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Liquidity
              </button>
            )}
            
            {FEATURES.ENABLE_HISTORY && (
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'history' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                History
              </button>
            )}
            
            {FEATURES.ENABLE_STAKING && (
              <button
                onClick={() => setActiveTab('staking')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  activeTab === 'staking' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                Staking
              </button>
            )}
          </div>
          
          {/* Navigation Tabs - Mobile */}
          <div className="md:hidden flex">
            <select 
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-2 py-1 text-sm"
            >
              {FEATURES.ENABLE_SWAP && (
                <option value="swap">Swap</option>
              )}
              {FEATURES.ENABLE_LIQUIDITY && (
                <option value="liquidity">Liquidity</option>
              )}
              {FEATURES.ENABLE_HISTORY && (
                <option value="history">History</option>
              )}
              {FEATURES.ENABLE_STAKING && (
                <option value="staking">Staking</option>
              )}
            </select>
          </div>
          
          {/* Connect Wallet Button */}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
};

export default Header;