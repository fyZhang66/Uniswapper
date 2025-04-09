// Token addresses on Ethereum mainnet (used in Tenderly virtual fork)
export const MAINNET_TOKENS = {
  // Ethereum and wrapped ETH
  ETH: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",

  // Stablecoins
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  DAI: "0x6B175474E89094C44Da98b954EedeAC495271d0F",

  // Other popular tokens
  SHIB: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
  UNI: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
  LINK: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
};

// Token list for UI display
export const TOKEN_LIST = [
  {
    address: MAINNET_TOKENS.ETH,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  },
  {
    address: MAINNET_TOKENS.SHIB,
    symbol: "SHIB",
    name: "SHIBA INU",
    decimals: 18,
    logoURI: "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE/logo.png",
  },
  {
    address: MAINNET_TOKENS.WETH,
    symbol: "WETH",
    name: "Wrapped Ether",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2/logo.png",
  },
  {
    address: MAINNET_TOKENS.USDC,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/logo.png",
  },
  {
    address: MAINNET_TOKENS.DAI,
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x6B175474E89094C44Da98b954EedeAC495271d0F/logo.png",
  },
  {
    address: MAINNET_TOKENS.USDT,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    logoURI:
      "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0xdAC17F958D2ee523a2206206994597C13D831ec7/logo.png",
  },
  {
    address: MAINNET_TOKENS.LINK,
    symbol: "LINK",
    name: "ChainLink Token",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x514910771AF9Ca656af840dff83E8264EcF986CA/logo.png",
  },
  {
    address: MAINNET_TOKENS.UNI,
    symbol: "UNI",
    name: "Uniswap",
    decimals: 18,
    logoURI:
      "https://raw.githubusercontent.com/Uniswap/assets/master/blockchains/ethereum/assets/0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984/logo.png",
  },
];
