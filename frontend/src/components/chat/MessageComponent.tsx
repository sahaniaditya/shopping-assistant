'use client';

import React, { useState } from 'react';
import { 
  CheckIcon, 
  ExclamationTriangleIcon, 
  ClipboardIcon, 
  TrashIcon,
  ArrowPathIcon,
  ChatBubbleBottomCenterTextIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { CheckIcon as CheckIconSolid } from '@heroicons/react/24/solid';
import { Message, MessageStatus, MessageType } from '@/types/chat';
import { Product } from '@/types/product';
import { ProductResearchResult } from '@/services/deepResearchService';
import ProductMessage from './ProductMessage';
import DeepResearchResults from './DeepResearchResults';

interface MessageComponentProps {
  message: Message;
  onDelete?: (id: string) => void;
  onRetry?: (id: string) => void;
  onAddToCart?: (product: Product) => void;
  onViewProductDetails?: (product: Product) => void;
  onAddToCartFromDeepResearch?: (product: ProductResearchResult) => void;
  onViewDeepResearchProduct?: (product: ProductResearchResult) => void;
  onCompareDeepResearchProducts?: (products: ProductResearchResult[]) => void;
  showActions?: boolean;
}

const MessageComponent: React.FC<MessageComponentProps> = ({ 
  message, 
  onDelete, 
  onRetry,
  onAddToCart,
  onViewProductDetails,
  onAddToCartFromDeepResearch,
  onViewDeepResearchProduct,
  onCompareDeepResearchProducts,
  showActions = true 
}) => {
  const [copied, setCopied] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  const getStatusIcon = (status: MessageStatus) => {
    switch (status) {
      case 'sending':
        return <div className="w-3 h-3 border border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
      case 'sent':
        return <CheckIcon className="w-3 h-3 text-gray-400" />;
      case 'delivered':
        return <CheckIconSolid className="w-3 h-3 text-blue-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="w-3 h-3 text-red-500" />;
      default:
        return null;
    }
  };

  const getMessageTypeStyle = (type: MessageType) => {
    switch (type) {
      case 'welcome':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'system':
        return 'bg-gray-50 border-gray-200 text-gray-700';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'product_result':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'deep_research_result':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'product_details':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'product_comparison':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      default:
        return '';
    }
  };

  const getMessageIcon = (type: MessageType) => {
    switch (type) {
      case 'welcome':
        return <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />;
      case 'system':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'deep_research_result':
        return <MagnifyingGlassIcon className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const isSpecialMessage = ['welcome', 'system', 'error', 'deep_research_result', 'product_details', 'product_comparison'].includes(message.type);
  const isProductResult = message.type === 'product_result' && message.metadata?.productSearchResult;
  const isDeepResearchResult = message.type === 'deep_research_result' && message.metadata?.deepResearchData;

  // If this is a Deep Research result message, render the DeepResearchResults component
  if (isDeepResearchResult && message.metadata?.deepResearchData) {
    // The metadata should contain the actual DeepResearchResponse
    const deepResearchData = JSON.parse(message.metadata.deepResearchData as unknown as string);

    return (
      <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}>
        <div className={`max-w-[95%] lg:max-w-[90%] relative ${message.isUser ? 'order-2' : 'order-1'}`}>
          <DeepResearchResults
            results={deepResearchData}
            onAddToCart={onAddToCartFromDeepResearch}
            onViewProduct={onViewDeepResearchProduct}
            onCompareProducts={onCompareDeepResearchProducts}
          />
        </div>
      </div>
    );
  }

  // If this is a product result message, render the ProductMessage component
  if (isProductResult && message.metadata?.productSearchResult) {
    return (
      <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}>
        <div className={`max-w-[90%] lg:max-w-[80%] relative ${message.isUser ? 'order-2' : 'order-1'}`}>
          {/* Regular message text first */}
          {message.text && (
            <div className="mb-3">
              <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="text-base leading-relaxed text-gray-800">
                  {message.text}
                </div>
                <div className="flex items-center justify-between mt-2 text-gray-500">
                  <span className="text-xs">
                    {message.timestamp.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Product results */}
          <ProductMessage
            searchResult={message.metadata.productSearchResult}
            onAddToCart={onAddToCart}
            onViewDetails={onViewProductDetails}
          />

          {/* Action menu */}
          {showActions && showActionMenu && (
            <div className={`absolute top-0 ${
              message.isUser ? 'right-full mr-3' : 'left-full ml-3'
            } flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1`}>
              
              {/* Copy button */}
              <button
                onClick={handleCopy}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Copy message"
              >
                {copied ? (
                  <CheckIconSolid className="w-4 h-4 text-green-500" />
                ) : (
                  <ClipboardIcon className="w-4 h-4 text-gray-600" />
                )}
              </button>

              {/* Delete button */}
              {onDelete && (
                <button
                  onClick={() => onDelete(message.id)}
                  className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                  title="Delete message"
                >
                  <TrashIcon className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Regular message rendering
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`max-w-[75%] lg:max-w-[60%] relative ${message.isUser ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
            isSpecialMessage
              ? `border-2 ${getMessageTypeStyle(message.type)}`
              : message.isUser
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
          }`}
          onMouseEnter={() => setShowActionMenu(true)}
          onMouseLeave={() => setShowActionMenu(false)}
        >
          {/* Message type icon for special messages */}
          {isSpecialMessage && (
            <div className="flex items-center mb-2">
              {getMessageIcon(message.type)}
              <span className="ml-2 text-xs font-semibold uppercase tracking-wide">
                {message.type.replace('_', ' ')}
              </span>
            </div>
          )}

          {/* Message text */}
          <div className="text-base leading-relaxed whitespace-pre-wrap break-words">
            {message.text}
          </div>

          {/* Metadata display for special messages */}
          {message.metadata && !isProductResult && (
            <div className="mt-3 pt-2 border-t border-current opacity-60">
              <div className="text-xs space-y-1">
                {message.metadata.intent && (
                  <div className="flex items-center">
                    <span className="font-medium">Intent:</span>
                    <span className="ml-1">{message.metadata.intent}</span>
                  </div>
                )}
                {message.metadata.confidence && (
                  <div className="flex items-center">
                    <span className="font-medium">Confidence:</span>
                    <span className="ml-1">{(message.metadata.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp and status */}
          <div className={`flex items-center justify-between mt-2 ${
            message.isUser && !isSpecialMessage ? 'text-blue-200' : 'text-gray-500'
          }`}>
            <span className="text-xs">
              {message.timestamp.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </span>
            
            {message.isUser && (
              <div className="ml-2 flex items-center">
                {getStatusIcon(message.status)}
              </div>
            )}
          </div>
        </div>

        {/* Action menu */}
        {showActions && showActionMenu && (
          <div className={`absolute top-0 ${
            message.isUser ? 'right-full mr-3' : 'left-full ml-3'
          } flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white rounded-lg shadow-lg border border-gray-200 px-2 py-1`}>
            
            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
              title="Copy message"
            >
              {copied ? (
                <CheckIconSolid className="w-4 h-4 text-green-500" />
              ) : (
                <ClipboardIcon className="w-4 h-4 text-gray-600" />
              )}
            </button>

            {/* Retry button for failed messages */}
            {message.status === 'failed' && onRetry && (
              <button
                onClick={() => onRetry(message.id)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Retry message"
              >
                <ArrowPathIcon className="w-4 h-4 text-blue-500" />
              </button>
            )}

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                className="p-1.5 hover:bg-gray-100 rounded transition-colors"
                title="Delete message"
              >
                <TrashIcon className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageComponent; 