import { 
  ConversationContext, 
  ContextMessage, 
  UserPreferences, 
  SearchHistoryItem
} from '@/types/ai';
import { Message } from '@/types/chat';
import { Product } from '@/types/product';

// Default user preferences
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  preferredCategories: [],
  budgetRange: {
    min: 0,
    max: 1000
  },
  brands: [],
  pricePreference: 'value',
  deliveryPreference: 'standard'
};

class ContextManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private readonly maxContextAge = 24 * 60 * 60 * 1000; // 24 hours
  private readonly maxSearchHistory = 50;
  private readonly maxContextMessages = 20;

  // Get conversation context
  getContext(userId: string, sessionId: string): ConversationContext {
    const contextKey = `${userId}_${sessionId}`;
    let context = this.contexts.get(contextKey);
    
    if (!context) {
      // Try to load from localStorage
      context = this.loadContext(userId, sessionId);
      
      if (!context) {
        // Create new context
        context = this.createNewContext(userId, sessionId);
      }
      
      this.contexts.set(contextKey, context);
      
      // Save context
      this.saveContext(userId, sessionId, context);
    }
    
    return context;
  }

  // Create new conversation context
  private createNewContext(userId: string, sessionId: string): ConversationContext {
    const userPreferences = this.loadUserPreferences(userId) || {
      preferredCategories: [],
      budgetRange: { min: 0, max: 10000 },
      brands: [],
      pricePreference: 'value' as const,
      deliveryPreference: 'standard' as const
    };

    const searchHistory = this.loadSearchHistory(userId) || [];

    const context: ConversationContext = {
      userId,
      sessionId,
      messages: [],
      userPreferences,
      searchHistory,
      currentIntent: undefined,
      lastProductSearch: undefined,
      cartSummary: {
        itemCount: 0,
        totalValue: 0,
        categories: []
      }
    };

    this.contexts.set(`${userId}_${sessionId}`, context);

    // Save context
    this.saveContext(userId, sessionId, context);

    return context;
  }

  // Update context with new message
  updateContext(
    userId: string, 
    sessionId: string, 
    message: Message,
    products?: Product[]
  ): ConversationContext {
    const context = this.getContext(userId, sessionId);
    
    // Convert chat message to context message
    const contextMessage: ContextMessage = {
      role: message.isUser ? 'user' : 'assistant',
      content: message.text,
      timestamp: message.timestamp,
      metadata: {
        intent: message.metadata?.intent,
        confidence: message.metadata?.confidence,
        products: products?.map(p => p.id),
        action: message.type
      }
    };

    // Add message to context
    context.messages.push(contextMessage);
    
    // Keep only recent messages to manage context window
    if (context.messages.length > this.maxContextMessages) {
      context.messages = context.messages.slice(-this.maxContextMessages);
    }

    // Update search history if this was a product search
    if (message.metadata?.productQuery && products) {
      this.addToSearchHistory(context, message.metadata.productQuery, products);
    }

    // Update user preferences based on interaction
    this.updateUserPreferences(context, message, products);

    // Save context
    this.saveContext(userId, sessionId, context);
    
    return context;
  }

  // Add to search history
  private addToSearchHistory(
    context: ConversationContext, 
    query: string, 
    products: Product[]
  ): void {
    const searchItem: SearchHistoryItem = {
      query,
      timestamp: new Date(),
      resultsCount: products.length,
      selectedProducts: [] // Will be updated when user interacts with products
    };

    context.searchHistory.unshift(searchItem);
    
    // Keep only recent searches
    if (context.searchHistory.length > this.maxSearchHistory) {
      context.searchHistory = context.searchHistory.slice(0, this.maxSearchHistory);
    }
  }

  // Update user preferences based on interactions
  private updateUserPreferences(
    context: ConversationContext,
    message: Message,
    products?: Product[]
  ): void {
    if (!products || products.length === 0) return;

    const preferences = context.userPreferences;
    
    // Update preferred categories
    const categories = [...new Set(products.map(p => p.category))];
    categories.forEach(category => {
      if (!preferences.preferredCategories.includes(category)) {
        preferences.preferredCategories.push(category);
      }
    });

    // Update preferred brands
    const brands = [...new Set(products.map(p => p.brand))];
    brands.forEach(brand => {
      if (!preferences.brands.includes(brand)) {
        preferences.brands.push(brand);
      }
    });

    // Update budget range based on viewed products
    const prices = products.map(p => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    // Gradually adjust budget range
    if (minPrice < preferences.budgetRange.min) {
      preferences.budgetRange.min = Math.floor(minPrice * 0.8);
    }
    if (maxPrice > preferences.budgetRange.max) {
      preferences.budgetRange.max = Math.ceil(maxPrice * 1.2);
    }

    // Infer price preference from viewed products
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    if (avgPrice < 50) {
      preferences.pricePreference = 'budget';
    } else if (avgPrice > 200) {
      preferences.pricePreference = 'premium';
    } else {
      preferences.pricePreference = 'value';
    }

    // Keep only recent categories and brands (limit to prevent unbounded growth)
    preferences.preferredCategories = preferences.preferredCategories.slice(-10);
    preferences.brands = preferences.brands.slice(-15);
  }

  // Update cart summary
  updateCartSummary(
    userId: string,
    sessionId: string,
    cartItems: Product[]
  ): ConversationContext {
    const context = this.getContext(userId, sessionId);
    
    context.cartSummary = {
      itemCount: cartItems.length,
      totalValue: cartItems.reduce((sum, item) => sum + item.price, 0),
      categories: [...new Set(cartItems.map(item => item.category))]
    };

    this.saveContext(userId, sessionId, context);
    return context;
  }

  // Mark products as selected in search history
  markProductSelected(
    userId: string,
    sessionId: string,
    productId: string
  ): void {
    const context = this.getContext(userId, sessionId);
    
    // Find the most recent search and add the selected product
    const recentSearch = context.searchHistory[0];
    if (recentSearch && !recentSearch.selectedProducts.includes(productId)) {
      recentSearch.selectedProducts.push(productId);
      this.saveContext(userId, sessionId, context);
    }
  }

  // Get personalized recommendations based on context
  getPersonalizedRecommendations(
    userId: string,
    sessionId: string
  ): {
    suggestedCategories: string[];
    suggestedBrands: string[];
    priceRange: { min: number; max: number };
    recentSearches: string[];
  } {
    const context = this.getContext(userId, sessionId);
    
    return {
      suggestedCategories: context.userPreferences.preferredCategories.slice(-5),
      suggestedBrands: context.userPreferences.brands.slice(-5),
      priceRange: context.userPreferences.budgetRange,
      recentSearches: context.searchHistory.slice(0, 5).map(h => h.query)
    };
  }

  // Get conversation summary for AI context
  getConversationSummary(
    userId: string,
    sessionId: string
  ): string {
    const context = this.getContext(userId, sessionId);
    
    const recentMessages = context.messages.slice(-5);
    const searchQueries = context.searchHistory.slice(0, 3).map(h => h.query);
    const preferences = context.userPreferences;
    
    let summary = "User Context:\n";
    
    if (searchQueries.length > 0) {
      summary += `Recent searches: ${searchQueries.join(', ')}\n`;
    }
    
    if (preferences.preferredCategories.length > 0) {
      summary += `Preferred categories: ${preferences.preferredCategories.slice(-3).join(', ')}\n`;
    }
    
    if (preferences.brands.length > 0) {
      summary += `Preferred brands: ${preferences.brands.slice(-3).join(', ')}\n`;
    }
    
    summary += `Budget range: $${preferences.budgetRange.min} - $${preferences.budgetRange.max}\n`;
    summary += `Price preference: ${preferences.pricePreference}\n`;
    
    if (context.cartSummary && context.cartSummary.itemCount > 0) {
      summary += `Cart: ${context.cartSummary.itemCount} items, $${context.cartSummary.totalValue.toFixed(2)}\n`;
    }
    
    if (recentMessages.length > 0) {
      summary += "\nRecent conversation:\n";
      recentMessages.forEach(msg => {
        summary += `${msg.role}: ${msg.content.slice(0, 100)}...\n`;
      });
    }
    
    return summary;
  }

  // Save context to localStorage for persistence
  private saveContext(userId: string, sessionId: string, context: ConversationContext): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `walmart_session_${userId}_${sessionId}`;
        localStorage.setItem(key, JSON.stringify(context));
      }
    } catch (error) {
      console.warn('Failed to save context to localStorage:', error);
    }
  }

  // Load context from localStorage
  private loadContext(userId: string, sessionId: string): ConversationContext | undefined {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = `walmart_session_${userId}_${sessionId}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (error) {
      console.warn('Failed to load context from localStorage:', error);
    }
    return undefined;
  }

  // Load search history from localStorage
  private loadSearchHistory(userId: string): SearchHistoryItem[] | undefined {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(`walmart_search_history_${userId}`);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (error) {
      console.warn('Failed to load search history:', error);
    }
    return undefined;
  }

  // Clean up old contexts to prevent memory leaks
  private cleanupOldContexts(): void {
    const now = Date.now();
    
    const contextsToDelete: string[] = [];
    
    this.contexts.forEach((context, contextKey) => {
      const lastMessage = context.messages[context.messages.length - 1];
      const lastActivity = lastMessage ? lastMessage.timestamp.getTime() : 0;
      
      if (now - lastActivity > this.maxContextAge) {
        contextsToDelete.push(contextKey);
      }
    });
    
    contextsToDelete.forEach(contextKey => {
      this.contexts.delete(contextKey);
    });
  }

  // Reset user preferences
  resetUserPreferences(userId: string): void {
    localStorage.removeItem(`walmart_user_preferences_${userId}`);
    localStorage.removeItem(`walmart_search_history_${userId}`);
    
    // Update active contexts
    for (const [contextKey, context] of this.contexts.entries()) {
      if (context.userId === userId) {
        context.userPreferences = { ...DEFAULT_USER_PREFERENCES };
        context.searchHistory = [];
      }
    }
  }

  // Get analytics data
  getAnalytics(userId: string): {
    totalSearches: number;
    topCategories: string[];
    topBrands: string[];
    averageSessionLength: number;
    pricePreference: string;
  } {
    const searchHistory = this.loadSearchHistory(userId) || [];
    const preferences = this.loadUserPreferences(userId) || DEFAULT_USER_PREFERENCES;
    
    // Calculate top categories and brands
    const categoryCount = new Map<string, number>();
    const brandCount = new Map<string, number>();
    
    preferences.preferredCategories.forEach(cat => {
      categoryCount.set(cat, (categoryCount.get(cat) || 0) + 1);
    });
    
    preferences.brands.forEach(brand => {
      brandCount.set(brand, (brandCount.get(brand) || 0) + 1);
    });
    
    const topCategories = Array.from(categoryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat]) => cat);
      
    const topBrands = Array.from(brandCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([brand]) => brand);

    return {
      totalSearches: searchHistory.length,
      topCategories,
      topBrands,
      averageSessionLength: 0, // Would be calculated from session data
      pricePreference: preferences.pricePreference
    };
  }

  // Clear all user data (for privacy/logout)
  clearAllUserData(userId: string): void {
    // Remove from memory
    this.contexts.delete(userId);
    
    // Remove from localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      // Remove all sessions for this user
      for (const storageKey of Array.from(localStorage.keys()) as string[]) {
        if (storageKey.startsWith('walmart_session_') || storageKey.includes(userId)) {
          localStorage.removeItem(storageKey);
        }
      }
    }
  }

  // Load user preferences from localStorage
  private loadUserPreferences(userId: string): UserPreferences | undefined {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem(`walmart_user_preferences_${userId}`);
        if (saved) {
          return JSON.parse(saved);
        }
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
    return undefined;
  }
}

// Export singleton instance
export const contextManager = new ContextManager();
export { ContextManager }; 