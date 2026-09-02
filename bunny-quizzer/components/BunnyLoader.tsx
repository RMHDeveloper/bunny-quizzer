
import React from 'react';

const BunnyLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 p-8 sm:p-12 bg-white rounded-3xl border-2 border-orange-100 w-full max-w-lg mx-auto">
      <div className="relative w-24 h-24 sm:w-32 sm:h-32 animate-bounce">
         <svg viewBox="0 0 100 100" className="w-full h-full text-orange-400">
            <ellipse cx="30" cy="30" rx="10" ry="25" fill="currentColor" />
            <ellipse cx="70" cy="30" rx="10" ry="25" fill="currentColor" />
            <circle cx="50" cy="65" r="30" fill="currentColor" />
            <circle cx="40" cy="60" r="3" fill="white" />
            <circle cx="60" cy="60" r="3" fill="white" />
            <path d="M45 75 Q50 80 55 75" stroke="white" strokeWidth="2" fill="none" />
         </svg>
      </div>
      <div className="text-center">
        <h3 className="text-xl sm:text-2xl font-bold text-orange-600">Preparing Your Quiz...</h3>
        <p className="text-orange-400 mt-1 text-sm sm:text-base">Please wait a few seconds</p>
      </div>
      <div className="flex space-x-2">
        <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-150"></div>
      </div>
    </div>
  );
};

export default BunnyLoader;
