'use client';

import React from 'react';

interface TypingIndicatorProps {
  isVisible: boolean;
  message?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  isVisible, 
  message = "Walmart Assistant is typing..." 
}) => {
  if (!isVisible) return null;

  return (
    <div className="flex justify-start">
      <div className="max-w-[75%] lg:max-w-[60%]">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm px-4 py-3">
          <div className="flex items-center space-x-3">
            {/* Animated dots */}
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" 
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div 
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" 
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
            
            {/* Typing message */}
            <span className="text-sm text-gray-600 font-medium">{message}</span>
          </div>
          
          {/* Timestamp */}
          <div className="text-xs text-gray-500 mt-2">
            {new Date().toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator; 