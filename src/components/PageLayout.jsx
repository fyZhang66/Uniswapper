import React from 'react';

const PageLayout = ({ title, description, leftColumn, rightColumn, footerNote }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-500 to-purple-500 text-transparent bg-clip-text">
          {title}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {description}
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex justify-center">
          <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            {leftColumn}
          </div>
        </div>
        
        {/* Right column */}
        <div className="flex justify-center">
          <div className="w-full bg-gray-800 rounded-xl shadow-xl overflow-hidden p-6 border border-gray-700">
            {rightColumn}
          </div>
        </div>
      </div>
      
      {footerNote && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>{footerNote}</p>
        </div>
      )}
    </div>
  );
};

export default PageLayout;