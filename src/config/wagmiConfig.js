// src/config/wagmiConfig.js
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { QueryClient } from '@tanstack/react-query';

const RPC_URL = "https://virtual.mainnet.rpc.tenderly.co/ea2dd410-e28d-4863-8441-f84de967fe7f"
// Define Tenderly Virtual network as a custom chain
const tenderlyVirtualChain = {
  id: 1, // Same as Ethereum mainnet ID since it's a fork
  name: 'Tenderly Virtual Mainnet',
  network: 'tenderly',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: [RPC_URL] },
    default: { http: [RPC_URL] },
  },
};

// Create config with the new API
const config = getDefaultConfig({
  appName: 'Uniswap Frontend',
  projectId: '2ae494dbd32b82ba3a71ae90f788ce6d', // Get one from WalletConnect Cloud
  chains: [tenderlyVirtualChain],
  transports: {
    [tenderlyVirtualChain.id]: http(),
  },
});
export const queryClient = new QueryClient();

export default config;