// AI and LLM type definitions

export interface LLMConfig {
  provider: 'openai' | 'anthropic' | 'local' | 'gemini';
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}

export interface ConversationContext {
  userId: string;
  sessionId: string;
  messages: ContextMessage[];
  userPreferences: UserPreferences;
  searchHistory: SearchHistoryItem[];
  currentIntent?: IntentResult;
  lastProductSearch?: string;
  cartSummary?: CartSummary;
}

export interface ContextMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    confidence?: number;
    products?: string[];
    action?: string;
  };
}

export interface UserPreferences {
  preferredCategories: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  brands: string[];
  pricePreference: 'budget' | 'value' | 'premium';
  deliveryPreference: 'standard' | 'fast' | 'pickup';
}

export interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultsCount: number;
  selectedProducts: string[];
}

export interface CartSummary {
  itemCount: number;
  totalValue: number;
  categories: string[];
}

export interface IntentResult {
  intent: IntentType;
  confidence: number;
  entities: Entity[];
  action: ActionType;
  parameters: Record<string, string | number | boolean>;
}

export type IntentType = 
  | 'product_search'
  | 'product_compare'
  | 'product_info'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'view_cart'
  | 'checkout'
  | 'greeting'
  | 'help'
  | 'complaint'
  | 'general_question';

export type ActionType =
  | 'search_products'
  | 'show_product_details'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'update_cart'
  | 'show_cart'
  | 'proceed_checkout'
  | 'provide_info'
  | 'show_help'
  | 'escalate_human';

export interface Entity {
  type: EntityType;
  value: string;
  confidence: number;
  position: {
    start: number;
    end: number;
  };
}

export type EntityType =
  | 'product_name'
  | 'category'
  | 'brand'
  | 'price'
  | 'color'
  | 'size'
  | 'quantity'
  | 'feature'
  | 'location'
  | 'time';

export interface LLMResponse {
  content: string;
  intent: IntentResult;
  suggestions: string[];
  productRecommendations?: ProductRecommendation[];
  followUpQuestions?: string[];
  confidence: number;
  reasoning?: string;
}

export interface ProductRecommendation {
  productId: string;
  reason: string;
  confidence: number;
  category: string;
  priceRange: {
    min: number;
    max: number;
  };
}

export interface AIPrompt {
  system: string;
  context: string;
  userMessage: string;
  examples?: PromptExample[];
}

export interface PromptExample {
  user: string;
  assistant: string;
  intent: string;
}

export interface StreamingResponse {
  content: string;
  isComplete: boolean;
  tokens: number;
  error?: string;
}

export interface AIServiceConfig {
  llm: LLMConfig;
  contextWindow: number;
  maxConversationHistory: number;
  enableStreaming: boolean;
  fallbackEnabled: boolean;
  rateLimiting: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
} 