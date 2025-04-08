// src/config/wagmiConfig.js
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http } from 'wagmi';
import { QueryClient } from '@tanstack/react-query';

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
    public: { http: ['https://virtual.mainnet.rpc.tenderly.co/4cbb7988-0b91-409b-bbb0-ccee52c414e6'] },
    default: { http: ['https://virtual.mainnet.rpc.tenderly.co/4cbb7988-0b91-409b-bbb0-ccee52c414e6'] },
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