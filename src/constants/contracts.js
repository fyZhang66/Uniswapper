// Import tokens configuration if needed
// import { MAINNET_TOKENS } from './tokens';

// Tenderly virtual network custom address from scripts
export const CUSTOM_ADDRESS = "0x91c2F30bc8f156B345B166c9b1F31C4acf7f2163";

// Contract addresses for your deployed contracts
export const CONTRACTS = {
  FACTORY: "0x3803FC3f2A9c546129E76Ae34c51CEaAc70b0266", 
  ROUTER: "0xc2798c4b96F1dAd1413d59290c5dEBC38bFaE427",
};

// ERC20 Token ABI
export const ERC20_ABI = [
  {
    name: "name",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }]
  },
  {
    name: "symbol",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "string" }]
  },
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint8" }]
  },
  {
    name: "totalSupply",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address", name: "owner" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "allowance",
    type: "function",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "owner" },
      { type: "address", name: "spender" }
    ],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "value" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "value" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    name: "transferFrom",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "from" },
      { type: "address", name: "to" },
      { type: "uint256", name: "value" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "value" }
    ],
    outputs: [{ type: "bool" }]
  }
];

// Router ABI (updated for Uniswap V2 Router)
export const ROUTER_ABI = [
  {
    name: "factory",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }]
  },
  {
    name: "addLiquidity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "tokenA" },
      { type: "address", name: "tokenB" },
      { type: "uint256", name: "amountADesired" },
      { type: "uint256", name: "amountBDesired" },
      { type: "uint256", name: "amountAMin" },
      { type: "uint256", name: "amountBMin" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" }
    ],
    outputs: [
      { type: "uint256", name: "amountA" },
      { type: "uint256", name: "amountB" },
      { type: "uint256", name: "liquidity" }
    ]
  },
  {
    name: "removeLiquidity",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "tokenA" },
      { type: "address", name: "tokenB" },
      { type: "uint256", name: "liquidity" },
      { type: "uint256", name: "amountAMin" },
      { type: "uint256", name: "amountBMin" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" }
    ],
    outputs: [
      { type: "uint256", name: "amountA" },
      { type: "uint256", name: "amountB" }
    ]
  },
  {
    name: "swapExactTokensForTokens",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "amountIn" },
      { type: "uint256", name: "amountOutMin" },
      { type: "address[]", name: "path" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" }
    ],
    outputs: [{ type: "uint256[]", name: "amounts" }]
  },
  {
    name: "getAmountsOut",
    type: "function",
    stateMutability: "view",
    inputs: [
      { type: "uint256", name: "amountIn" },
      { type: "address[]", name: "path" }
    ],
    outputs: [{ type: "uint256[]", name: "amounts" }]
  },
  {
    name: "getAmountsIn",
    type: "function",
    stateMutability: "view",
    inputs: [
      { type: "uint256", name: "amountOut" },
      { type: "address[]", name: "path" }
    ],
    outputs: [{ type: "uint256[]", name: "amounts" }]
  },
  {
    name: "quote",
    type: "function",
    stateMutability: "pure",
    inputs: [
      { type: "uint256", name: "amountA" },
      { type: "uint256", name: "reserveA" },
      { type: "uint256", name: "reserveB" }
    ],
    outputs: [{ type: "uint256", name: "amountB" }]
  }
];

// Factory ABI
export const FACTORY_ABI = [
  {
    name: "getPair",
    type: "function",
    stateMutability: "view",
    inputs: [
      { type: "address", name: "tokenA" },
      { type: "address", name: "tokenB" }
    ],
    outputs: [{ type: "address", name: "pair" }]
  },
  {
    name: "createPair",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "tokenA" },
      { type: "address", name: "tokenB" }
    ],
    outputs: [{ type: "address", name: "pair" }]
  },
  {
    name: "allPairs",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "uint256", name: "index" }],
    outputs: [{ type: "address", name: "pair" }]
  },
  {
    name: "allPairsLength",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }]
  }
];

// Pair ABI
export const PAIR_ABI = [
  {
    name: "getReserves",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [
      { type: "uint112", name: "_reserve0" },
      { type: "uint112", name: "_reserve1" },
      { type: "uint32", name: "_blockTimestampLast" }
    ]
  },
  {
    name: "token0",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }]
  },
  {
    name: "token1",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }]
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ type: "address", name: "owner" }],
    outputs: [{ type: "uint256" }]
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "spender" },
      { type: "uint256", name: "value" }
    ],
    outputs: [{ type: "bool" }]
  },
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ type: "address", name: "to" }],
    outputs: [{ type: "uint256", name: "liquidity" }]
  },
  {
    name: "burn",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ type: "address", name: "to" }],
    outputs: [
      { type: "uint256", name: "amount0" },
      { type: "uint256", name: "amount1" }
    ]
  },
  {
    name: "swap",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "amount0Out" },
      { type: "uint256", name: "amount1Out" },
      { type: "address", name: "to" },
      { type: "bytes", name: "data" }
    ],
    outputs: []
  }
];