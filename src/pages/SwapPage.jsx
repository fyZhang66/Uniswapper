import SwapCard from '../components/SwapCard';

export default function SwapPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">Swap Tokens</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Trade tokens instantly with low fees and high liquidity on our decentralized exchange
        </p>
      </div>
      
      <div className="flex justify-center">
        <SwapCard />
      </div>
      
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Note: Connect your wallet to start trading. All transactions happen directly on-chain.</p>
      </div>
    </div>
  );
}