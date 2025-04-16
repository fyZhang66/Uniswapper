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

// Import components (to be created)
import Header from './components/Header';
import Footer from './components/Footer';

// Create QueryClient for tanstack/react-query
const queryClient = new QueryClient();

function App() {
  const [activeTab, setActiveTab] = useState('swap');
  const [assistantOpen, setAssistantOpen] = useState(false);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />
            
            <main className="container mx-auto px-4 py-8 flex-grow relative">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Main content area */}
                <div className={`flex-grow transition-all ${assistantOpen ? 'lg:w-2/3' : 'w-full'}`}>
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
                
                {/* Assistant sidebar */}
                <div className={`${assistantOpen ? 'block lg:w-1/3' : 'hidden'} transition-all`}>
                  <NaturalLanguageInterface />
                </div>
              </div>
              
              {/* Assistant toggle button */}
              <button 
                onClick={() => setAssistantOpen(prev => !prev)}
                className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors z-10"
                aria-label={assistantOpen ? "Close assistant" : "Open assistant"}
              >
                {assistantOpen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}
              </button>
            </main>
            
            <Footer />
          </div>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;