import React from 'react';

const ActionButton = ({
  onClick,
  disabled,
  isLoading,
  loadingText,
  actionText,
  variant = 'primary'
}) => {
  const colorClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700',
    danger: 'bg-red-600 hover:bg-red-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`w-full ${colorClasses[variant]} text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
    >
      {isLoading ? loadingText : actionText}
    </button>
  );
};

export default ActionButton;