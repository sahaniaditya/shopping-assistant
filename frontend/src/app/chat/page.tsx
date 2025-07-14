'use client';

import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, PaperAirplaneIcon, StopIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { MicrophoneIcon as MicrophoneIconSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import Header from '@/components/ui/Header';
import MessageComponent from '@/components/chat/MessageComponent';
import TypingIndicator from '@/components/chat/TypingIndicator';
import ConversationSidebar from '@/components/chat/ConversationSidebar';
import { useApiStatus } from '@/hooks/useApiStatus';
import { useChat } from '@/hooks/useChat';
import { Product } from '@/types/product';
import { ProductResearchResult } from '@/services/deepResearchService';
import { ApiStatus } from '@/types/api';

// Disable static generation for localStorage usage
export const runtime = 'edge';

export default function ChatPage() {
  const { apiStatus: apiStatusObj } = useApiStatus();
  const chat = useChat();
  
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Convert the object status to the string status expected by Header
  const apiStatus: ApiStatus = apiStatusObj?.status === 'error' ? 'disconnected' :
                              apiStatusObj?.status === 'healthy' ? 'connected' :
                              apiStatusObj ? 'connecting' : 'unknown';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat.messages, chat.isTyping]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        chat.setError('Voice recognition failed. Please try again or type your message.');
      };
    }
  }, [chat]);

  // Initialize sidebar state based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSendMessage = async () => {
    if (!inputText.trim() || chat.isLoading) return;

    const userText = inputText.trim();
    setInputText('');
    
    // Clear any previous errors
    chat.clearError();
    
    try {
      // Process user message - this will handle product search automatically
      await chat.processUserMessage(userText);
    } catch (error) {
      console.error('Failed to process message:', error);
      chat.setError('Failed to send message. Please try again.');
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        chat.clearError();
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        chat.setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRetryMessage = (messageId: string) => {
    const message = chat.messages.find(m => m.id === messageId);
    if (message && message.isUser) {
      setInputText(message.text);
      chat.deleteMessage(messageId);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    chat.deleteMessage(messageId);
  };

  const handleAddToCart = (product: Product) => {
    chat.addToCart(product);
  };

  const handleViewProductDetails = (product: Product) => {
    chat.viewProductDetails(product);
  };

  // Deep Research specific handlers
  const handleAddToCartFromDeepResearch = (product: ProductResearchResult) => {
    chat.addToCartFromDeepResearch(product);
  };

  const handleViewDeepResearchProduct = (product: ProductResearchResult) => {
    chat.viewDeepResearchProduct(product);
  };

  const handleCompareDeepResearchProducts = (products: ProductResearchResult[]) => {
    chat.compareDeepResearchProducts(products);
  };

  // Determine if we're currently processing a message
  const isProcessing = chat.isLoading || chat.isTyping || chat.isSearchingProducts;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header apiStatus={apiStatus} />
      
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'block' : 'hidden'} w-80 flex-shrink-0`}>
          <ConversationSidebar
            conversations={chat.conversations}
            activeConversationId={chat.activeConversationId}
            onSelectConversation={chat.setActiveConversation}
            onNewConversation={chat.newConversation}
            onDeleteConversation={chat.deleteConversation}
            onClearAll={chat.clearAllConversations}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sidebar Toggle */}
          <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <XMarkIcon className="h-5 w-5 text-gray-600" />
              ) : (
                <Bars3Icon className="h-5 w-5 text-gray-600" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-900">
              {chat.activeConversation?.title || 'New Chat'}
            </h1>
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>

          {/* Chat Header - Desktop */}
          <div className="hidden lg:block bg-white border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {chat.activeConversation?.title || 'Walmart Shopping Assistant'}
                </h1>
                <p className="text-gray-600 mt-1">
                  Ask me anything about products you&apos;d like to buy! I can research the web for the best options.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${chat.isSearchingProducts ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`}></div>
                  <span className="text-sm text-gray-600">
                    {chat.researchStatus 
                      ? chat.researchStatus
                      : chat.isSearchingProducts 
                      ? 'Conducting Deep Research...' 
                      : 'Voice & Text Ready'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Error Message */}
            {chat.error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-red-700">{chat.error}</p>
                  <button
                    onClick={chat.clearError}
                    className="text-red-500 hover:text-red-700 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
              {chat.messages.map((message) => (
                <MessageComponent
                  key={message.id}
                  message={message}
                  onDelete={handleDeleteMessage}
                  onRetry={handleRetryMessage}
                  onAddToCart={handleAddToCart}
                  onViewProductDetails={handleViewProductDetails}
                  onAddToCartFromDeepResearch={handleAddToCartFromDeepResearch}
                  onViewDeepResearchProduct={handleViewDeepResearchProduct}
                  onCompareDeepResearchProducts={handleCompareDeepResearchProducts}
                  showActions={true}
                />
              ))}
              
              {/* Typing indicator */}
              <TypingIndicator 
                isVisible={chat.isTyping}
                message={
                  chat.researchStatus 
                    ? chat.researchStatus
                    : chat.isSearchingProducts 
                    ? "Conducting Deep Research to find the best products for you..."
                    : "Walmart Assistant is typing..."
                }
              />
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Container */}
          <div className="bg-white border-t">
            <div className="max-w-4xl mx-auto px-4 py-4">
              {/* Error Message - Mobile */}
              {chat.error && (
                <div className="lg:hidden mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-red-700">{chat.error}</p>
                    <button
                      onClick={chat.clearError}
                      className="text-red-500 hover:text-red-700 text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-end space-x-3">
                {/* Voice Button */}
                <Button
                  variant={isListening ? "primary" : "ghost"}
                  size="md"
                  onClick={handleVoiceToggle}
                  className={`flex-shrink-0 ${isListening ? 'bg-red-500 hover:bg-red-600' : ''}`}
                  disabled={isProcessing}
                >
                  {isListening ? (
                    <StopIcon className="h-5 w-5" />
                  ) : (
                    <MicrophoneIcon className="h-5 w-5" />
                  )}
                </Button>

                {/* Text Input */}
                <div className="flex-1">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      isListening 
                        ? "Listening..." 
                        : isProcessing 
                        ? "Processing..." 
                        : "Type your message or use voice input..."
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-base bg-gray-50 focus:bg-white transition-colors text-black"
                    rows={1}
                    disabled={isListening || isProcessing}
                  />
                </div>

                {/* Send Button */}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isProcessing || isListening}
                  className="flex-shrink-0"
                  loading={isProcessing}
                >
                  <PaperAirplaneIcon className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Voice Status */}
              {isListening && (
                <div className="mt-3 flex items-center justify-center space-x-2">
                  <MicrophoneIconSolid className="h-4 w-4 text-red-500 animate-pulse" />
                  <span className="text-sm text-red-500">Listening... Click stop when done</span>
                </div>
              )}
              
              {/* Example prompts for better UX */}
              {!isProcessing && chat.messages.length <= 1 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setInputText("find me the best coffee under ₹500")}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                    disabled={isListening}
                  >
                    find me the best coffee under ₹500
                  </button>
                  <button
                    onClick={() => setInputText("show me top rated headphones")}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                    disabled={isListening}
                  >
                    show me top rated headphones
                  </button>
                  <button
                    onClick={() => setInputText("best gaming laptop under $1000")}
                    className="px-4 py-2 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                    disabled={isListening}
                  >
                    best gaming laptop under $1000
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
} 