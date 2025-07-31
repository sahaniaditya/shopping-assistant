'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChatBubbleLeftRightIcon, 
  CogIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { ApiStatus } from '@/types/api';
import AISettings from '@/components/ai/AISettings';

interface HeaderProps {
  apiStatus: ApiStatus;
}

const Header: React.FC<HeaderProps> = ({ apiStatus }) => {
  const [showAISettings, setShowAISettings] = useState(false);

  const getStatusColor = (status: ApiStatus) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: ApiStatus) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">W</span>
                </div>
                <span className="text-xl font-bold text-gray-900">Walmart</span>
                <span className="text-sm text-gray-500">2025</span>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/"
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/chat"
                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
                Chat Assistant
              </Link>
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/* AI Status Indicator */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(apiStatus)}`}></div>
                  <span className="text-sm text-gray-600">
                    AI {getStatusText(apiStatus)}
                  </span>
                </div>
              </div>

              {/* AI Settings Button */}
              <button
                onClick={() => setShowAISettings(true)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="AI Settings"
              >
                <SparklesIcon className="w-5 h-5" />
                <CogIcon className="w-4 h-4" />
                <span className="hidden sm:inline">AI Settings</span>
              </button>

              {/* Mobile Menu Button */}
              <div className="md:hidden">
                <button className="p-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-2 space-y-1">
            <Link 
              href="/"
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              Home
            </Link>
            <Link 
              href="/chat"
              className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Chat Assistant
            </Link>
            <div className="flex items-center px-3 py-2 text-sm text-gray-600">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(apiStatus)} mr-2`}></div>
              AI {getStatusText(apiStatus)}
            </div>
          </div>
        </div>
      </header>

      {/* AI Settings Modal */}
      <AISettings 
        isOpen={showAISettings}
        onClose={() => setShowAISettings(false)}
      />
    </>
  );
};

export default Header; 