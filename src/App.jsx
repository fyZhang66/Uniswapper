import { useState } from 'react';
import { WagmiProvider } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import config from './config/wagmiConfig';
import '@rainbow-me/rainbowkit/styles.css';

// Import pages
import SwapPage from './pages/SwapPage';
import LiquidityPage from './pages/LiquidityPage';
import HistoryPage from './pages/HistoryPage';
import NaturalLanguageInterface from './components/NaturalLanguageInterface';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';

// Create QueryClient for tanstack/react-query
const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState('swap');

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="container mx-auto px-4 py-8 flex-grow">
              {/* Main content area */}
              <div className="w-full">
                {activeTab === 'swap' ? (
                  <SwapPage />
                ) : activeTab === 'liquidity' ? (
                  <LiquidityPage />
                ) : activeTab === 'history' ? (
                  <HistoryPage />
                ) : (
                  <SwapPage />
                )}
              </div>
              
              {/* Natural Language Interface - overlaid, visibility self-managed */}
              <NaturalLanguageInterface />
            </main>
            
            <Footer />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;