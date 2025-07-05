'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon, 
  TrashIcon, 
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { Conversation } from '@/types/chat';
import Button from '@/components/ui/Button';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
}

const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onClearAll,
}) => {
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const formatRelativeTime = (date: Date) => {
    // Safety check: convert string dates to Date objects
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Additional safety check: ensure we have a valid Date object
    if (!dateObj || isNaN(dateObj.getTime())) {
      return 'Unknown time';
    }
    
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return dateObj.toLocaleDateString();
  };

  const handleClearAll = () => {
    if (showClearConfirm) {
      onClearAll();
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 3000);
    }
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <Button
            onClick={onNewConversation}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:bg-blue-50"
          >
            <PlusIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-3">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mb-3 text-gray-400" />
            <p className="text-sm text-center mb-4">No conversations yet</p>
            <Button
              onClick={onNewConversation}
              variant="primary"
              size="sm"
            >
              Start a new chat
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                onDelete={() => onDeleteConversation(conversation.id)}
                formatTime={formatRelativeTime}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {conversations.length > 0 && (
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleClearAll}
            variant="ghost"
            size="sm"
            className={`w-full justify-start ${
              showClearConfirm 
                ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            {showClearConfirm ? 'Click again to confirm' : 'Clear all conversations'}
          </Button>
        </div>
      )}
    </div>
  );
};

// Individual conversation item component
interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  formatTime: (date: Date) => string;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onClick,
  onDelete,
  formatTime,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const lastMessage = conversation.messages[conversation.messages.length - 1];
  const preview = lastMessage?.text.slice(0, 50) + (lastMessage?.text.length > 50 ? '...' : '');

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !(event.target as Element).closest('.conversation-menu')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  return (
    <div
      className={`group relative rounded-lg p-3 cursor-pointer transition-all duration-200 ${
        isActive 
          ? 'bg-blue-50 border border-blue-200 shadow-sm' 
          : 'hover:bg-gray-50 border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <h3 className={`text-sm font-medium truncate ${
            isActive ? 'text-blue-900' : 'text-gray-900'
          }`}>
            {conversation.title}
          </h3>
          
          {preview && (
            <p className={`text-xs mt-1 truncate ${
              isActive ? 'text-blue-600' : 'text-gray-500'
            }`}>
              {preview}
            </p>
          )}
          
          <p className={`text-xs mt-1 ${
            isActive ? 'text-blue-500' : 'text-gray-400'
          }`}>
            {formatTime(conversation.updatedAt)}
          </p>
        </div>

        {/* Menu button */}
        <div className="flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all duration-200"
          >
            <EllipsisHorizontalIcon className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Dropdown menu */}
        {showMenu && (
          <div className="conversation-menu absolute right-2 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
                setShowMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationSidebar; 