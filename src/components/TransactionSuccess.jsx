import React from 'react';

const TransactionSuccess = ({ success, message = 'Transaction completed successfully!' }) => {
  if (!success) return null;
  
  return (
    <div className="text-green-500 text-sm bg-green-500/10 p-2 rounded border border-green-500/20">
      {message}
    </div>
  );
};

export default TransactionSuccess;