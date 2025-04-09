# UniSwapper 🦄

A simplified implementation of the UniSwap interface built with React, enabling users to swap tokens, add and remove liquidity, and interact with a simulated AMM (Automated Market Maker).

## Features

- **Token Swapping**: Exchange between various ERC-20 tokens with real-time price calculation
- **Liquidity Management**: Add and remove liquidity to trading pairs
- **AMM Visualization**: Interactive charts showing the constant product curve and simulations
- **Wallet Integration**: Connect with MetaMask and other wallets via RainbowKit
- **Slippage Control**: Set custom slippage tolerance for transactions

## Screenshots

<img width="1477" alt="image" src="https://github.com/user-attachments/assets/0cf8a38e-8def-424f-9fd4-c76eb970d756" />

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- A web3 wallet (like MetaMask)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/uniswap-frontend.git
   cd uniswap-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
src/
├── assets/          # Static assets like images
├── components/      # Reusable UI components
├── config/          # Configuration files
├── constants/       # Application constants
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── App.jsx          # Main application component
├── App.css          # Global CSS
├── index.css        # Global CSS
└── main.jsx         # Application entry point
```

## Key Components

### Swap Page
The Swap page allows users to exchange tokens. It features:
- Token selection dropdowns
- Amount inputs with automatic price calculation
- Price impact visualization
- Slippage tolerance settings

### Liquidity Page
The Liquidity page enables users to add or remove liquidity from trading pairs:
- Tab-based interface for adding or removing liquidity
- Token pair selection
- Visual simulation of liquidity changes
- LP token management

### AMM Visualization
Interactive components for visualizing the AMM mechanism:
- `AMMCurve`: Displays the constant product curve (x * y = k)
- `AMMSimulation`: Shows how adding or removing liquidity affects the curve

## Custom Hooks

### `useToken`
Fetches token information including symbol, decimals, and user balance.

### `useSwap`
Handles the token swap logic, price calculations, and transaction execution.

### `useLiquidity`
Manages liquidity operations, including pair creation, adding liquidity, and removing liquidity.

## Technology Stack

- **React**: Frontend library
- **Vite**: Build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **ethers.js**: Ethereum library
- **RainbowKit**: Wallet connection UI
- **wagmi**: React hooks for Ethereum

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by [Uniswap](https://uniswap.org/)
- Built as an educational project for cryptocurrency and DeFi concepts
