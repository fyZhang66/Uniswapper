import React from 'react';

const TransactionError = ({ error }) => {
  if (!error) return null;
  
  return (
    <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
      {error}
    </div>
  );
};

export default TransactionError;