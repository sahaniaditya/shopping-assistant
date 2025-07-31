// Enhanced chat type definitions

import { Product, ProductSearchResult } from './product';
import { DeepResearchResponse, ProductResearchResult } from '@/services/deepResearchService';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type: MessageType;
  status: MessageStatus;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  intent?: string;
  confidence?: number;
  productQuery?: string;
  productSearchResult?: ProductSearchResult;
  deepResearchData?: DeepResearchResponse | string;
  deepResearchSource?: string;
  sentimentScore?: number;
  productData?: ProductResearchResult;
  comparedProducts?: ProductResearchResult[];
  comparisonCount?: number;
  searchSummary?: string;
  reasoning?: string;
  suggestions?: string[];
  products?: Product[];
  action?: string;
}

export type MessageType = 
  | 'text'
  | 'product_result'
  | 'deep_research_result'
  | 'product_details'
  | 'product_comparison'
  | 'system'
  | 'welcome'
  | 'error';

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  isLoading: boolean;
  isTyping: boolean;
  isSearchingProducts: boolean;
  error: string | null;
  lastMessageTime: Date | null;
}

export type ChatAction = 
  | { type: 'LOAD_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'NEW_CONVERSATION' }
  | { type: 'SET_ACTIVE_CONVERSATION'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: Partial<Message> & { id: string } }
  | { type: 'DELETE_MESSAGE'; payload: string }
  | { type: 'DELETE_CONVERSATION'; payload: string }
  | { type: 'CLEAR_ALL_CONVERSATIONS' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_SEARCHING_PRODUCTS'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' };

export interface ChatSettings {
  enableVoice: boolean;
  enableNotifications: boolean;
  autoSave: boolean;
  maxConversations: number;
  messageRetentionDays: number;
}

export interface ProductSearchIntent {
  query: string;
  category?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
  brand?: string;
  intent: 'product_search';
  confidence: number;
} 