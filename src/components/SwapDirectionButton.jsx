import React from 'react';

const SwapDirectionButton = ({ onClick }) => {
  return (
    <div className="flex justify-center relative z-10">
      <button
        onClick={onClick}
        className="bg-blue-600 hover:bg-blue-500 p-2 rounded-full absolute -translate-y-1/2 shadow-lg transition-transform hover:rotate-180 duration-300"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z" />
        </svg>
      </button>
    </div>
  );
};

export default SwapDirectionButton;