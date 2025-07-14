'use client';

import { useReducer, useEffect, useCallback, useState } from 'react';
import { ChatState, ChatAction, Conversation, Message, MessageType, MessageStatus, MessageMetadata, ProductSearchIntent } from '@/types/chat';
import { Product, ProductSearchQuery } from '@/types/product';
import { productService } from '@/services/productService';
import { aiService } from '@/services/aiService';
import { contextManager } from '@/services/contextManager';
import { ConversationContext, LLMResponse } from '@/types/ai';
import { ProductResearchResult } from '@/services/deepResearchService';

// Generate user ID if not exists
const getUserId = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    let userId = localStorage.getItem('walmart_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('walmart_user_id', userId);
    }
    return userId;
  }
  // Fallback for server-side rendering
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Generate session ID
const getSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Initial state
const initialChatState: ChatState = {
  conversations: [],
  activeConversationId: null,
  isLoading: false,
  isTyping: false,
  isSearchingProducts: false,
  error: null,
  lastMessageTime: null,
};

// Chat reducer
function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'LOAD_CONVERSATIONS':
      return {
        ...state,
        conversations: action.payload,
        activeConversationId: action.payload[0]?.id || null,
      };

    case 'NEW_CONVERSATION':
      const newConversation: Conversation = {
        id: `conv_${Date.now()}`,
        title: 'New Chat',
        messages: [{
          id: `msg_${Date.now()}`,
          text: "Hi! I'm your Walmart shopping assistant powered by AI. I can help you find products, compare options, and make the best purchasing decisions. What are you looking for today?",
          isUser: false,
          timestamp: new Date(),
          type: 'welcome',
          status: 'delivered',
          metadata: {
            intent: 'greeting',
            confidence: 1.0
          }
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };
      
      return {
        ...state,
        conversations: [newConversation, ...state.conversations.slice(0, 9)], // Keep max 10 conversations
        activeConversationId: newConversation.id,
      };

    case 'SET_ACTIVE_CONVERSATION':
      return {
        ...state,
        activeConversationId: action.payload,
        error: null,
      };

    case 'ADD_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv => 
          conv.id === state.activeConversationId 
            ? {
                ...conv,
                messages: [...conv.messages, action.payload],
                updatedAt: new Date(),
                title: conv.messages.length === 1 ? generateConversationTitle(action.payload.text) : conv.title,
              }
            : conv
        ),
        lastMessageTime: new Date(),
      };

    case 'UPDATE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: conv.messages.map(msg =>
                  msg.id === action.payload.id ? { ...msg, ...action.payload } : msg
                ),
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'DELETE_MESSAGE':
      return {
        ...state,
        conversations: state.conversations.map(conv =>
          conv.id === state.activeConversationId
            ? {
                ...conv,
                messages: conv.messages.filter(msg => msg.id !== action.payload),
                updatedAt: new Date(),
              }
            : conv
        ),
      };

    case 'DELETE_CONVERSATION':
      const remainingConversations = state.conversations.filter(conv => conv.id !== action.payload);
      return {
        ...state,
        conversations: remainingConversations,
        activeConversationId: remainingConversations[0]?.id || null,
      };

    case 'CLEAR_ALL_CONVERSATIONS':
      return {
        ...state,
        conversations: [],
        activeConversationId: null,
      };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };

    case 'SET_SEARCHING_PRODUCTS':
      return { ...state, isSearchingProducts: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'CLEAR_ERROR':
      return { ...state, error: null };

    default:
      return state;
  }
}

// Utility functions
function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.trim().split(' ');
  return words.slice(0, 4).join(' ') + (words.length > 4 ? '...' : '');
}

function saveToLocalStorage(conversations: Conversation[]) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('walmart_conversations', JSON.stringify(conversations));
    }
  } catch (error) {
    console.warn('Failed to save conversations to localStorage:', error);
  }
}

function loadFromLocalStorage(): Conversation[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('walmart_conversations');
      if (saved) {
        const conversations = JSON.parse(saved);
        // Convert date strings back to Date objects
        return conversations.map((conv: any) => ({
          ...conv,
          createdAt: new Date(conv.createdAt),
          updatedAt: new Date(conv.updatedAt),
          messages: conv.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
    }
  } catch (error) {
    console.warn('Failed to load conversations from localStorage:', error);
  }
  return [];
}

// Legacy product search intent detection (kept as fallback)
function detectProductSearchIntent(text: string): ProductSearchIntent | null {
  const lowerText = text.toLowerCase();
  
  const searchPatterns = [
    /(?:find|search|look for|show me|get me|buy me|need|want)\s+(.+)/i,
    /(.+)(?:\s+under|\s+below|\s+less than)\s*\$(\d+)/i,
  ];

  for (const pattern of searchPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      const query = match[1] || text;
      
      let priceRange: { min?: number; max?: number } | undefined;
      const underMatch = lowerText.match(/under\s*\$(\d+)/);
      if (underMatch) {
        priceRange = { max: parseInt(underMatch[1]) };
      }

      return {
        query: query.trim(),
        priceRange,
        intent: 'product_search',
        confidence: 0.8
      };
    }
  }

  return null;
}

// Main hook
export function useChat() {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const [researchStatus, setResearchStatus] = useState<string>('');
  const userId = getUserId();
  const sessionId = getSessionId();

  // Load conversations on mount
  useEffect(() => {
    const savedConversations = loadFromLocalStorage();
    if (savedConversations.length > 0) {
      dispatch({ type: 'LOAD_CONVERSATIONS', payload: savedConversations });
    } else {
      // Create initial conversation if none exist
      dispatch({ type: 'NEW_CONVERSATION' });
    }
  }, []);

  // Save conversations whenever they change
  useEffect(() => {
    if (state.conversations.length > 0) {
      saveToLocalStorage(state.conversations);
    }
  }, [state.conversations]);

  // Actions
  const addMessage = useCallback((text: string, isUser: boolean, type: MessageType = 'text', metadata?: MessageMetadata) => {
    const message: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      isUser,
      timestamp: new Date(),
      type,
      status: isUser ? 'sending' : 'delivered',
      metadata,
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    
    // Update status to sent after a brief delay for user messages
    if (isUser) {
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { id: message.id, status: 'sent' as MessageStatus }
        });
      }, 100);
    }
    
    return message.id;
  }, []);

  const updateMessage = useCallback((id: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, ...updates } });
  }, []);

  const deleteMessage = useCallback((id: string) => {
    dispatch({ type: 'DELETE_MESSAGE', payload: id });
  }, []);

  const newConversation = useCallback(() => {
    dispatch({ type: 'NEW_CONVERSATION' });
  }, []);

  const setActiveConversation = useCallback((id: string) => {
    dispatch({ type: 'SET_ACTIVE_CONVERSATION', payload: id });
  }, []);

  const deleteConversation = useCallback((id: string) => {
    dispatch({ type: 'DELETE_CONVERSATION', payload: id });
  }, []);

  const clearAllConversations = useCallback(() => {
    dispatch({ type: 'CLEAR_ALL_CONVERSATIONS' });
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setTyping = useCallback((typing: boolean) => {
    dispatch({ type: 'SET_TYPING', payload: typing });
  }, []);

  const setSearchingProducts = useCallback((searching: boolean) => {
    dispatch({ type: 'SET_SEARCHING_PRODUCTS', payload: searching });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const clearResearchStatus = useCallback(() => {
    setResearchStatus('');
  }, []);

  // Handle product search from AI response
  const handleProductSearch = useCallback(async (aiResponse: LLMResponse, originalQuery: string, _context: ConversationContext) => {
    setSearchingProducts(true);
    setTyping(true);
    
    try {
      // Check if this is a Deep Research response
      if (aiResponse.reasoning?.includes('Deep Research')) {
        // The aiResponse should contain the actual Deep Research data
        // For now, we'll conduct the actual Deep Research here
        try {
          const { deepResearchService } = await import('@/services/deepResearchService');
          
          // Show progressive status messages
          setResearchStatus('🔍 Starting Deep Research...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setResearchStatus('📊 Understanding your request...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          setResearchStatus('🛒 Searching Walmart products...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setResearchStatus('📦 Analyzing product details...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setResearchStatus('⭐ Reading customer reviews...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setResearchStatus('🧠 Analyzing sentiment & ranking...');
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          setResearchStatus('📝 Generating research report...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Actually conduct the research
          const deepResearchResult = await deepResearchService.conductDeepResearch(originalQuery);
          
          setResearchStatus('✅ Deep Research completed!');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Clear status
          setResearchStatus('');
          
          // Create message with Deep Research results
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: deepResearchResult.researchSummary,
            isUser: false,
            timestamp: new Date(),
            type: 'deep_research_result',
            status: 'delivered',
            metadata: {
              intent: aiResponse.intent.intent,
              confidence: aiResponse.intent.confidence,
              productQuery: originalQuery,
              deepResearchData: JSON.stringify(deepResearchResult),
              searchSummary: `Deep Research completed: ${deepResearchResult.products.length} products analyzed`,
              reasoning: aiResponse.reasoning
            }
          };

          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
          
          // Update context with research results
          contextManager.updateContext(userId, sessionId, assistantMessage);
          
          return;
        } catch (deepResearchError) {
          console.error('Deep Research failed:', deepResearchError);
          setResearchStatus('❌ Deep Research failed, trying basic search...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          setResearchStatus('');
          // Fall through to regular product search
        }
      }

      // Fallback to regular product search
      setResearchStatus('🔍 Searching products...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const searchQuery: ProductSearchQuery = {
        query: originalQuery,
        ...aiResponse.intent.parameters
      };

      const searchResult = await productService.searchProducts(searchQuery);
      
      setResearchStatus('✅ Search completed!');
      await new Promise(resolve => setTimeout(resolve, 500));
      setResearchStatus('');
      
      // Add AI response message first
      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: aiResponse.content,
        isUser: false,
        timestamp: new Date(),
        type: 'product_result',
        status: 'delivered',
        metadata: {
          intent: aiResponse.intent.intent,
          confidence: aiResponse.intent.confidence,
          productQuery: originalQuery,
          productSearchResult: searchResult,
          searchSummary: `${searchResult.total} products found`,
          reasoning: aiResponse.reasoning
        }
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      
      // Update context with search results
      contextManager.updateContext(userId, sessionId, assistantMessage, searchResult.products);

    } catch (error) {
      console.error('Product search failed:', error);
      setResearchStatus('');
      setError('Failed to search for products. Please try again.');
    } finally {
      setSearchingProducts(false);
      setTyping(false);
    }
  }, [userId, sessionId, setSearchingProducts, setTyping, setError]);

  // Legacy product search functionality (kept for backward compatibility)
  const searchProducts = useCallback(async (intent: ProductSearchIntent) => {
    setSearchingProducts(true);
    setTyping(true);
    
    try {
      setResearchStatus('🔍 Searching for products...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const searchQuery: ProductSearchQuery = {
        query: intent.query,
        category: intent.category,
        minPrice: intent.priceRange?.min,
        maxPrice: intent.priceRange?.max,
        brand: intent.brand,
        sortBy: 'relevance',
        limit: 10
      };

      const searchResult = await productService.searchProducts(searchQuery);
      
      setResearchStatus('📊 Analyzing search results...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResearchStatus('✅ Search completed!');
      await new Promise(resolve => setTimeout(resolve, 500));
      setResearchStatus('');
      
      const resultText = searchResult.products.length > 0
        ? `I found ${searchResult.total} products for "${intent.query}". Here are the best matches:`
        : `I couldn't find any products matching "${intent.query}". Try different keywords or check the spelling.`;

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: resultText,
        isUser: false,
        timestamp: new Date(),
        type: 'product_result',
        status: 'delivered',
        metadata: {
          intent: 'product_search',
          confidence: intent.confidence,
          productQuery: intent.query,
          productSearchResult: searchResult,
          searchSummary: `${searchResult.total} products found`
        }
      };

      dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
      
      // Update context
      contextManager.updateContext(userId, sessionId, assistantMessage, searchResult.products);

    } catch (error) {
      console.error('Product search failed:', error);
      setResearchStatus('');
      setError('Failed to search for products. Please try again.');
    } finally {
      setSearchingProducts(false);
      setTyping(false);
    }
  }, [userId, sessionId, setSearchingProducts, setTyping, setError]);

  // Enhanced AI-powered message processing
  const processUserMessage = useCallback(async (text: string) => {
    let userMessageId = '';
    
    try {
      // Add user message
      const userMessage: Message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text,
        isUser: true,
        timestamp: new Date(),
        type: 'text',
        status: 'sending',
      };
      
      userMessageId = userMessage.id;
      
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      
      // Update status to sent
      setTimeout(() => {
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { id: userMessage.id, status: 'sent' as MessageStatus }
        });
      }, 100);

      // Get conversation context
      const context = contextManager.getContext(userId, sessionId);
      
      // Update context with user message
      contextManager.updateContext(userId, sessionId, userMessage);

      setTyping(true);
      setLoading(true);
      setResearchStatus('🤖 Processing your message...');
      await new Promise(resolve => setTimeout(resolve, 800));

      try {
        setResearchStatus('🧠 Understanding your request...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Process message with AI service (now includes Deep Research)
        const aiResponse: LLMResponse = await aiService.processMessage(text, context);
        
        setResearchStatus('');
        setTyping(false);

        // Handle different intent types
        if (aiResponse.intent.action === 'search_products') {
          await handleProductSearch(aiResponse, text, context);
        } else {
          // Add AI response message
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: aiResponse.content,
            isUser: false,
            timestamp: new Date(),
            type: 'text',
            status: 'delivered',
            metadata: {
              intent: aiResponse.intent.intent,
              confidence: aiResponse.intent.confidence,
              reasoning: aiResponse.reasoning,
              suggestions: aiResponse.suggestions
            }
          };

          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
          
          // Update context with assistant message
          contextManager.updateContext(userId, sessionId, assistantMessage);
        }

      } catch (aiError) {
        console.warn('AI processing failed, falling back to legacy logic:', aiError);
        setResearchStatus('');
        
        // Fallback to legacy product search logic
        const legacyIntent = detectProductSearchIntent(text);
        if (legacyIntent) {
          await searchProducts(legacyIntent);
        } else {
          // Basic response
          const responses = [
            "I understand you're looking for something! Could you be more specific about what you'd like to buy?",
            "I'm here to help you find products. Try saying something like 'find me a coffee maker' or 'show me phones under $500'.",
            "Let me know what you're shopping for and I'll help you find the best products!",
          ];
          const response = responses[Math.floor(Math.random() * responses.length)];
          
          const assistantMessage: Message = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            text: response,
            isUser: false,
            timestamp: new Date(),
            type: 'text',
            status: 'delivered',
            metadata: {
              intent: 'general_chat',
              confidence: 0.7
            }
          };

          dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
        }
      }

    } catch (error) {
      console.error('Failed to process message:', error);
      setResearchStatus('');
      setError('Failed to process your message. Please try again.');
    } finally {
      setLoading(false);
      setTyping(false);
      setSearchingProducts(false);
    }

    return userMessageId;
  }, [userId, sessionId, setTyping, setLoading, setSearchingProducts, setError, handleProductSearch, searchProducts]);

  // Enhanced shopping cart actions
  const addToCart = useCallback((product: Product) => {
    console.log('Adding to cart:', product);
    
    // Store product data in localStorage for the product details page
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    
    // Mark product as selected in search history
    contextManager.markProductSelected(userId, sessionId, product.id);
    
    // Navigate to product details page
    window.location.href = `/product/${product.id}`;
  }, [userId, sessionId]);

  // Enhanced shopping cart actions for Deep Research products
  const addToCartFromDeepResearch = useCallback((product: ProductResearchResult) => {
    console.log('Adding Deep Research product to cart:', product);
    
    // Store product data in localStorage for the product details page
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    
    // Mark product as selected in search history
    contextManager.markProductSelected(userId, sessionId, product.name);
    
    // Navigate to product details page
    window.location.href = `/product/${encodeURIComponent(product.name)}`;
  }, [userId, sessionId]);

  // Handle viewing product details
  const viewProductDetails = useCallback((product: Product) => {
    console.log('Viewing product details:', product);
    
    // Store product data in localStorage for the product details page
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    
    // Navigate to product details page
    window.location.href = `/product/${product.id}`;
  }, []);

  // Handle viewing Deep Research product details
  const viewDeepResearchProduct = useCallback((product: ProductResearchResult) => {
    console.log('Viewing Deep Research product details:', product);
    
    // Store product data in localStorage for the product details page
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    
    // Navigate to product details page
    window.location.href = `/product/${encodeURIComponent(product.name)}`;
  }, []);

  // Handle comparing Deep Research products
  const compareDeepResearchProducts = useCallback((products: ProductResearchResult[]) => {
    const comparisonText = `Here's a detailed comparison of the ${products.length} products you selected:

${products.map((product, idx) => `
**${idx + 1}. ${product.name}**
- Price: ${product.price.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
- Rating: ${product.rating}/5 stars
- Sentiment: ${(product.sentimentScore * 100).toFixed(0)}% positive
- Overall Score: ${(product.overallScore * 100).toFixed(0)}%
- Source: ${product.source}
`).join('\n')}

**Best Value:** ${products.reduce((best, current) => 
  (current.overallScore > best.overallScore) ? current : best
).name}

**Lowest Price:** ${products.reduce((cheapest, current) => 
  (current.price < cheapest.price) ? current : cheapest
).name}

**Highest Rated:** ${products.reduce((highest, current) => 
  (current.rating > highest.rating) ? current : highest
).name}

Would you like me to help you decide between these options or find more alternatives?`;

    const assistantMessage: Message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: comparisonText,
      isUser: false,
      timestamp: new Date(),
      type: 'product_comparison',
      status: 'delivered',
      metadata: {
        intent: 'product_compare',
        comparedProducts: products,
        comparisonCount: products.length
      }
    };

    dispatch({ type: 'ADD_MESSAGE', payload: assistantMessage });
    
    // Update context
    contextManager.updateContext(userId, sessionId, assistantMessage);
  }, [userId, sessionId]);

  // Get personalized recommendations
  const getPersonalizedRecommendations = useCallback(() => {
    return contextManager.getPersonalizedRecommendations(userId, sessionId);
  }, [userId, sessionId]);

  // Get conversation context for debugging/analytics
  const getConversationContext = useCallback(() => {
    return contextManager.getContext(userId, sessionId);
  }, [userId, sessionId]);

  // Computed values
  const activeConversation = state.conversations.find(conv => conv.id === state.activeConversationId);
  const messages = activeConversation?.messages || [];

  return {
    // State
    ...state,
    activeConversation,
    messages,
    researchStatus,
    
    // Actions
    addMessage,
    updateMessage,
    deleteMessage,
    newConversation,
    setActiveConversation,
    deleteConversation,
    clearAllConversations,
    setLoading,
    setTyping,
    setSearchingProducts,
    setError,
    clearError,
    clearResearchStatus,
    
    // Enhanced AI-powered actions
    processUserMessage,
    searchProducts,
    addToCart,
    viewProductDetails,
    
    // Deep Research specific actions
    addToCartFromDeepResearch,
    viewDeepResearchProduct,
    compareDeepResearchProducts,
    
    // Context and personalization
    getPersonalizedRecommendations,
    getConversationContext,
    
    // User management
    userId,
    sessionId,
  };
} 