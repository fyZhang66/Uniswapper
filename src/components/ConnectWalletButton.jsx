import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const ConnectWalletButton = ({ message = 'Connect your wallet to continue' }) => {
  return (
    <div className="flex flex-col items-center my-10 space-y-4">
      <p className="text-gray-400 text-center mb-4">
        {message}
      </p>
      <ConnectButton />
    </div>
  );
};

export default ConnectWalletButton;