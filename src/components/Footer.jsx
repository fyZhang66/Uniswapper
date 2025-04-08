const Footer = () => {
    return (
      <footer className="bg-gray-800 border-t border-gray-700 py-6">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center justify-center md:justify-start">
                <div className="text-blue-500 text-2xl mr-2">🦄</div>
                <span className="text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                  UniswapV2 Frontend
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-1 text-center md:text-left">
                Decentralized trading protocol for Ethereum tokens
              </p>
            </div>
            
            <div className="flex flex-col items-center md:items-end">
              <div className="text-gray-400 text-sm mb-2">
                Built with Vite, React, wagmi, viem & RainbowKit
              </div>
              <div className="text-gray-500 text-xs">
                Using Tenderly Virtual Network
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700 flex flex-col md:flex-row justify-between items-center text-gray-500 text-xs">
            <div>
              © {new Date().getFullYear()} UniswapV2 Frontend Demo. All rights reserved.
            </div>
            <div className="mt-2 md:mt-0 flex space-x-4">
              <a href="#" className="hover:text-gray-300 transition-colors">Terms</a>
              <a href="#" className="hover:text-gray-300 transition-colors">Privacy</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    );
  };
  
  export default Footer;