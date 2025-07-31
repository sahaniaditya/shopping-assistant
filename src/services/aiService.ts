import { 
  ConversationContext, 
  IntentResult, 
  LLMResponse, 
  AIPrompt, 
  StreamingResponse,
  AIServiceConfig,
  Entity,
  EntityType,
  ProductRecommendation
} from '@/types/ai';
import { deepResearchService, DeepResearchResponse } from '@/services/deepResearchService';

const NEXT_PUBLIC_GEMINI_API_KEY="<api-key>"
// Default configuration
const DEFAULT_CONFIG: AIServiceConfig = {
  llm: {
    provider: 'gemini',
    apiKey: NEXT_PUBLIC_GEMINI_API_KEY, // Hardcoded for testing - remove in production
    model: 'gemini-1.5-flash', // Updated to correct model name
    temperature: 0.7,
    maxTokens: 1000,
    streaming: true
  },
  contextWindow: 4000,
  maxConversationHistory: 10,
  enableStreaming: true,
  fallbackEnabled: true,
  rateLimiting: {
    requestsPerMinute: 60,
    tokensPerMinute: 10000
  }
};

// System prompts for different contexts
const SYSTEM_PROMPTS = {
  shopping_assistant: `You are a helpful Walmart shopping assistant. Your role is to help customers find products, compare options, and make informed purchasing decisions.

Core responsibilities:
1. Understand customer needs and preferences
2. Search for relevant products
3. Provide product recommendations with clear reasoning
4. Help with comparisons and decision-making
5. Assist with cart management and checkout

Guidelines:
- Be friendly, helpful, and professional
- Ask clarifying questions when needed
- Provide specific product recommendations
- Explain why you're recommending certain products
- Handle complaints with empathy and escalate when appropriate
- Keep responses concise but informative

Available actions:
- search_products: Find products matching criteria
- show_product_details: Display detailed product information
- add_to_cart: Add items to shopping cart
- show_cart: Display cart contents
- provide_info: Give general product or shopping information`,

  intent_classifier: `You are an expert at understanding customer intent in shopping conversations. 
  
Analyze the user's message and classify it into one of these intents:
- product_search: Looking for specific products
- product_compare: Comparing multiple products
- product_info: Asking for product details
- add_to_cart: Wanting to add items to cart
- remove_from_cart: Removing items from cart
- view_cart: Checking cart contents
- checkout: Ready to purchase
- greeting: General greetings
- help: Asking for assistance
- complaint: Expressing dissatisfaction
- general_question: Other questions

Extract entities like product names, categories, brands, prices, colors, sizes, quantities, features.

Respond in JSON format with intent, confidence, entities, action, and parameters.`
};

// Entity extraction patterns
const ENTITY_PATTERNS: Record<EntityType, RegExp[]> = {
  product_name: [
    /\b(iphone|macbook|airpods|galaxy|pixel|dell|hp|lenovo|sony|lg|samsung)\b/gi,
    /\b(coffee maker|blender|toaster|microwave|headphones|speaker|laptop|tablet|phone)\b/gi
  ],
  category: [
    /\b(electronics|kitchen|home|clothing|books|sports|toys|beauty|health|automotive)\b/gi,
    /\b(kitchen & dining|electronics|food & beverages|home & garden)\b/gi
  ],
  brand: [
    /\b(apple|samsung|sony|lg|dell|hp|nike|adidas|keurig|ninja|starbucks|walmart)\b/gi
  ],
  price: [
    /\$(\d+(?:\.\d{2})?)\s*(?:to|-)?\s*\$?(\d+(?:\.\d{2})?)?/gi,
    /\b(?:under|below|less than|maximum|max)\s*\$(\d+(?:\.\d{2})?)/gi,
    /\b(?:over|above|more than|minimum|min)\s*\$(\d+(?:\.\d{2})?)/gi
  ],
  color: [
    /\b(black|white|red|blue|green|yellow|purple|pink|orange|gray|silver|gold)\b/gi
  ],
  size: [
    /\b(small|medium|large|xl|xxl|xs|\d+(?:inch|"|')|\d+(?:oz|lb|kg|g))\b/gi
  ],
  quantity: [
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/gi
  ],
  feature: [
    /\b(wireless|bluetooth|usb|rechargeable|waterproof|portable|automatic|manual)\b/gi
  ],
  location: [
    /\b(store|online|pickup|delivery|shipping|warehouse)\b/gi
  ],
  time: [
    /\b(today|tomorrow|this week|next week|asap|urgent|by \w+day)\b/gi
  ]
};

class AIService {
  private config: AIServiceConfig;
  private rateLimitCounter: { requests: number; tokens: number; resetTime: number } = {
    requests: 0,
    tokens: 0,
    resetTime: Date.now() + 60000
  };

  constructor(config: Partial<AIServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // TEMPORARILY DISABLED: Override with environment variable
    // TODO: Re-enable this and remove hardcoded key for production
    /*
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      this.config.llm.apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    }
    */
    
    console.log('🔑 Using hardcoded API key for testing:', {
      hasApiKey: !!this.config.llm.apiKey,
      keyLength: this.config.llm.apiKey?.length || 0,
      keyPrefix: this.config.llm.apiKey?.substring(0, 10) + '...'
    });
  }

  // Main method to process user messages with Deep Research integration
  async processMessage(
    userMessage: string,
    context: ConversationContext
  ): Promise<LLMResponse> {
    try {
      // Check rate limits
      if (!this.checkRateLimit()) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // First, classify intent
      const intentResult = await this.classifyIntent(userMessage, context);
      
      // Check if this is a product research request and if Deep Research is available
      if (intentResult.intent === 'product_search' && deepResearchService.hasApiKeys()) {
        console.log('🚀 Deep Research available - triggering research');
        
        // Return a special response that indicates Deep Research should be conducted
        return {
          content: 'Conducting Deep Research to find the best products for you...',
          intent: {
            ...intentResult,
            confidence: 0.95, // High confidence for deep research
            action: 'search_products'
          },
          suggestions: [
            'Show me more details about these products',
            'Compare the top 3 products',
            'Find similar products in different price ranges',
            'Search for products in other categories'
          ],
          productRecommendations: [],
          followUpQuestions: [
            'Would you like me to find more options in this category?',
            'Do you want to see detailed comparisons?',
            'Are you interested in products from specific brands?'
          ],
          confidence: 0.95,
          reasoning: 'Deep Research: Conducting autonomous web research for product recommendations'
        };
      }
      
      // Generate response based on intent
      const response = await this.generateResponse(userMessage, intentResult, context);
      
      return response;
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Fallback to rule-based response
      if (this.config.fallbackEnabled) {
        return this.generateFallbackResponse(userMessage, context);
      }
      
      throw error;
    }
  }

  // New Deep Research method
  async conductDeepResearch(
    userMessage: string,
    intent: IntentResult,
    context: ConversationContext
  ): Promise<LLMResponse> {
    try {
      console.log('🚀 Conducting Deep Research for:', userMessage);
      
      // Conduct the deep research
      const researchResult: DeepResearchResponse = await deepResearchService.conductDeepResearch(userMessage);
      
      // Convert research results to product recommendations
      const productRecommendations: ProductRecommendation[] = researchResult.products.map(product => ({
        productId: product.name,
        reason: `Score: ${product.overallScore.toFixed(2)} (Rating: ${product.rating}/5, Sentiment: ${product.sentimentScore.toFixed(2)})`,
        confidence: product.overallScore,
        category: intent.parameters.category as string || 'general',
        priceRange: {
          min: product.price,
          max: product.price
        }
      }));

      // Create enhanced response with Deep Research data
      const response: LLMResponse = {
        content: researchResult.researchSummary,
        intent: {
          ...intent,
          confidence: 0.95, // High confidence for deep research
          action: 'search_products'
        },
        suggestions: [
          'Show me more details about these products',
          'Compare the top 3 products',
          'Find similar products in different price ranges',
          'Search for products in other categories'
        ],
        productRecommendations,
        followUpQuestions: [
          'Would you like me to find more options in this category?',
          'Do you want to see detailed comparisons?',
          'Are you interested in products from specific brands?'
        ],
        confidence: 0.95,
        reasoning: `Deep Research conducted: ${researchResult.methodology}. Processing time: ${researchResult.totalProcessingTime}ms`
      };

      return response;
    } catch (error) {
      console.error('Deep Research failed, falling back to standard search:', error);
      
      // Fallback to standard product search
      return this.generateResponse(userMessage, intent, context);
    }
  }

  // Classify user intent using LLM
  private async classifyIntent(
    userMessage: string,
    context: ConversationContext
  ): Promise<IntentResult> {
    // First try rule-based classification for common patterns
    const ruleBasedIntent = this.classifyIntentRuleBased(userMessage);
    if (ruleBasedIntent.confidence > 0.8) {
      return ruleBasedIntent;
    }

    // If no API key available, use rule-based only
    if (!this.config.llm.apiKey) {
      return ruleBasedIntent;
    }

    try {
      const promptData = this.buildIntentPrompt(userMessage, context);
      const response = await this.callLLM(promptData);
      
      // Clean and parse JSON response (remove markdown code blocks)
      const cleanResponse = response.content.replace(/```json\s*|\s*```/g, '').trim();
      const intentData = JSON.parse(cleanResponse);
      
      return {
        intent: intentData.intent,
        confidence: intentData.confidence,
        entities: intentData.entities || [],
        action: intentData.action,
        parameters: intentData.parameters || {}
      };
    } catch (error) {
      console.warn('LLM intent classification failed, using rule-based:', error);
      return ruleBasedIntent;
    }
  }

  // Rule-based intent classification as fallback
  private classifyIntentRuleBased(userMessage: string): IntentResult {
    const lowerMessage = userMessage.toLowerCase();
    
    // Greeting patterns
    if (/\b(hi|hello|hey|good morning|good afternoon|good evening)\b/.test(lowerMessage)) {
      return {
        intent: 'greeting',
        confidence: 0.9,
        entities: [],
        action: 'provide_info',
        parameters: {}
      };
    }

    // Help patterns
    if (/\b(help|assist|support|how do|what can)\b/.test(lowerMessage)) {
      return {
        intent: 'help',
        confidence: 0.8,
        entities: [],
        action: 'show_help',
        parameters: {}
      };
    }

    // Cart patterns
    if (/\b(cart|checkout|buy|purchase|order)\b/.test(lowerMessage)) {
      if (/\b(add|put|place)\b/.test(lowerMessage)) {
        return {
          intent: 'add_to_cart',
          confidence: 0.8,
          entities: this.extractEntities(userMessage),
          action: 'add_to_cart',
          parameters: {}
        };
      }
      if (/\b(remove|delete|take out)\b/.test(lowerMessage)) {
        return {
          intent: 'remove_from_cart',
          confidence: 0.8,
          entities: this.extractEntities(userMessage),
          action: 'remove_from_cart',
          parameters: {}
        };
      }
      if (/\b(show|view|check|what)\b/.test(lowerMessage)) {
        return {
          intent: 'view_cart',
          confidence: 0.8,
          entities: [],
          action: 'show_cart',
          parameters: {}
        };
      }
    }

    // Product search patterns
    if (/\b(find|search|look for|show me|get me|buy me|need|want)\b/.test(lowerMessage)) {
      return {
        intent: 'product_search',
        confidence: 0.8,
        entities: this.extractEntities(userMessage),
        action: 'search_products',
        parameters: this.extractSearchParameters(userMessage)
      };
    }

    // Product comparison
    if (/\b(compare|vs|versus|difference|better|best)\b/.test(lowerMessage)) {
      return {
        intent: 'product_compare',
        confidence: 0.7,
        entities: this.extractEntities(userMessage),
        action: 'show_product_details',
        parameters: {}
      };
    }

    // Default to general question
    return {
      intent: 'general_question',
      confidence: 0.5,
      entities: this.extractEntities(userMessage),
      action: 'provide_info',
      parameters: {}
    };
  }

  // Extract entities from text
  private extractEntities(text: string): Entity[] {
    const entities: Entity[] = [];
    
    Object.entries(ENTITY_PATTERNS).forEach(([entityType, patterns]) => {
      patterns.forEach(pattern => {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
          if (match.index !== undefined) {
            entities.push({
              type: entityType as EntityType,
              value: match[0],
              confidence: 0.8,
              position: {
                start: match.index,
                end: match.index + match[0].length
              }
            });
          }
        }
      });
    });

    return entities;
  }

  // Extract search parameters from text
  private extractSearchParameters(text: string): Record<string, string | number | boolean> {
    const params: Record<string, string | number | boolean> = {
      query: text
    };

    // Extract price range
    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*(?:to|-)?\s*\$?(\d+(?:\.\d{2})?)?/);
    if (priceMatch) {
      params.minPrice = parseFloat(priceMatch[1]);
      if (priceMatch[2]) {
        params.maxPrice = parseFloat(priceMatch[2]);
      }
    }

    const underMatch = text.match(/\b(?:under|below|less than|maximum|max)\s*\$(\d+(?:\.\d{2})?)/);
    if (underMatch) {
      params.maxPrice = parseFloat(underMatch[1]);
    }

    const overMatch = text.match(/\b(?:over|above|more than|minimum|min)\s*\$(\d+(?:\.\d{2})?)/);
    if (overMatch) {
      params.minPrice = parseFloat(overMatch[1]);
    }

    // Extract category
    const categoryMatch = text.match(/\b(electronics|kitchen|home|clothing|books|sports|toys|beauty|health|automotive)\b/i);
    if (categoryMatch) {
      params.category = categoryMatch[1];
    }

    // Extract brand
    const brandMatch = text.match(/\b(apple|samsung|sony|lg|dell|hp|nike|adidas|keurig|ninja|starbucks|walmart)\b/i);
    if (brandMatch) {
      params.brand = brandMatch[1];
    }

    return params;
  }

  // Generate response based on intent
  private async generateResponse(
    userMessage: string,
    intent: IntentResult,
    context: ConversationContext
  ): Promise<LLMResponse> {
    // If no API key, use template-based responses
    if (!this.config.llm.apiKey) {
      return this.generateTemplateResponse(userMessage, intent, context);
    }

    try {
      const promptData = this.buildResponsePrompt(userMessage, intent, context);
      const response = await this.callLLM(promptData);
      
      // Generate product recommendations if applicable
      const recommendations = this.generateProductRecommendations(intent, context);
      
      return {
        content: response.content,
        intent,
        suggestions: this.generateSuggestions(intent),
        productRecommendations: recommendations,
        followUpQuestions: this.generateFollowUpQuestions(intent),
        confidence: intent.confidence,
        reasoning: 'Generated by AI assistant'
      };
    } catch (error) {
      console.warn('LLM response generation failed, using template:', error);
      return this.generateTemplateResponse(userMessage, intent, context);
    }
  }

  // Template-based response generation
  private generateTemplateResponse(
    userMessage: string,
    intent: IntentResult,
    context: ConversationContext
  ): LLMResponse {
    const templates = {
      greeting: [
        "Hello! I'm your Walmart shopping assistant. How can I help you find what you're looking for today?",
        "Hi there! I'm here to help you discover great products. What are you shopping for?",
        "Welcome! I can help you find products, compare options, and make the best choices. What do you need?"
      ],
      help: [
        "I'm here to help! I can assist you with finding products, comparing options, managing your cart, and answering questions about items. What would you like to do?",
        "I can help you search for products, get detailed information, add items to your cart, and more. Just tell me what you're looking for!",
        "Need assistance? I can help you find the perfect products, compare different options, and guide you through your shopping journey."
      ],
      product_search: [
        "I'll help you find what you're looking for! Let me search for the best products that match your needs.",
        "Great! I'll search for products that fit your criteria. Give me a moment to find the best options.",
        "I understand you're looking for something specific. Let me find the perfect products for you."
      ],
      product_compare: [
        "I'll help you compare these products to find the best option for your needs.",
        "Let me analyze these products and show you a detailed comparison.",
        "I'll break down the differences between these products for you."
      ],
      product_info: [
        "Here's the detailed information about this product.",
        "Let me show you everything you need to know about this item.",
        "I'll provide you with comprehensive details about this product."
      ],
      add_to_cart: [
        "I'll add this item to your cart right away.",
        "Perfect! I'm adding this product to your cart.",
        "Great choice! I'll add this to your cart for you."
      ],
      remove_from_cart: [
        "I'll remove this item from your cart.",
        "No problem! I'm removing this from your cart.",
        "Done! I've removed this item from your cart."
      ],
      view_cart: [
        "Here's what's currently in your cart.",
        "Let me show you your cart contents.",
        "Here are the items you've added to your cart."
      ],
      checkout: [
        "I'll help you proceed to checkout.",
        "Let's get you ready to complete your purchase.",
        "I'll guide you through the checkout process."
      ],
      complaint: [
        "I understand your concern. Let me help resolve this issue.",
        "I'm sorry to hear about this problem. How can I assist you?",
        "I apologize for any inconvenience. Let me help make this right."
      ],
      general_question: [
        "I'm here to help with your shopping needs! Could you tell me more about what you're looking for?",
        "I'd be happy to assist you. Can you provide more details about what you need?",
        "I want to make sure I help you find exactly what you're looking for. Can you be more specific?"
      ]
    };

    const responseOptions = templates[intent.intent] || templates.general_question;
    const response = responseOptions[Math.floor(Math.random() * responseOptions.length)];

    return {
      content: response,
      intent,
      suggestions: this.generateSuggestions(intent),
      productRecommendations: this.generateProductRecommendations(intent, context),
      followUpQuestions: this.generateFollowUpQuestions(intent),
      confidence: intent.confidence,
      reasoning: 'Generated from template'
    };
  }

  // Generate contextual suggestions
  private generateSuggestions(intent: IntentResult): string[] {
    const suggestions = {
      greeting: [
        "find coffee makers under $100",
        "show me bestselling headphones",
        "search for kitchen appliances"
      ],
      help: [
        "find products by category",
        "compare similar products",
        "check my cart"
      ],
      product_search: [
        "show me more options",
        "filter by price range",
        "compare top brands"
      ],
      product_compare: [
        "show detailed comparison",
        "find similar products",
        "add to cart"
      ],
      product_info: [
        "show me more details",
        "compare with similar products",
        "add to cart"
      ],
      add_to_cart: [
        "continue shopping",
        "view cart",
        "proceed to checkout"
      ],
      remove_from_cart: [
        "continue shopping",
        "find similar products",
        "view cart"
      ],
      view_cart: [
        "continue shopping",
        "proceed to checkout",
        "update quantities"
      ],
      checkout: [
        "review order",
        "change shipping",
        "apply coupon"
      ],
      complaint: [
        "contact support",
        "return item",
        "track order"
      ],
      general_question: [
        "find specific products",
        "browse by category",
        "get product recommendations"
      ]
    };

    return suggestions[intent.intent as keyof typeof suggestions] || suggestions.general_question;
  }

  // Generate product recommendations
  private generateProductRecommendations(
    intent: IntentResult,
    context: ConversationContext
  ): ProductRecommendation[] {
    // This would be enhanced with actual recommendation logic
    const recommendations: ProductRecommendation[] = [];
    
    if (intent.intent === 'product_search') {
      // Based on search history and preferences
      if (context.searchHistory.some(h => h.query.includes('coffee'))) {
        recommendations.push({
          productId: 'prod_1',
          reason: 'Based on your coffee product interests',
          confidence: 0.8,
          category: 'Kitchen & Dining',
          priceRange: { min: 50, max: 150 }
        });
      }
    }

    return recommendations;
  }

  // Generate follow-up questions
  private generateFollowUpQuestions(intent: IntentResult): string[] {
    const questions = {
      greeting: [
        "What type of products are you interested in?",
        "Are you looking for something specific?",
        "Would you like me to show you our popular categories?"
      ],
      product_search: [
        "Any specific brand preference?",
        "What's your budget range?",
        "Any particular features you're looking for?"
      ],
      product_compare: [
        "Which aspect is most important to you?",
        "Would you like to see more options?",
        "Do you have a preference between these?"
      ],
      product_info: [
        "Would you like to see similar products?",
        "Do you need any additional information?",
        "Are you ready to add this to your cart?"
      ],
      add_to_cart: [
        "Would you like to continue shopping?",
        "Do you need anything else?",
        "Ready to proceed to checkout?"
      ],
      remove_from_cart: [
        "Would you like to find a replacement?",
        "Any specific reason for removing?",
        "Need help finding alternatives?"
      ],
      view_cart: [
        "Ready to checkout?",
        "Need to update quantities?",
        "Want to continue shopping?"
      ],
      checkout: [
        "Confirm shipping address?",
        "Choose payment method?",
        "Apply any coupons?"
      ],
      complaint: [
        "Would you like to speak to a manager?",
        "Can I help resolve this issue?",
        "Need assistance with returns?"
      ],
      help: [
        "What specific help do you need?",
        "Are you looking for products?",
        "Need assistance with your account?"
      ],
      general_question: [
        "What type of products are you interested in?",
        "Are you looking for something specific?",
        "Would you like me to show you our popular categories?"
      ]
    };

    return questions[intent.intent as keyof typeof questions] || questions.general_question;
  }

  // Build prompt for intent classification
  private buildIntentPrompt(userMessage: string, context: ConversationContext): AIPrompt {
    const recentMessages = context.messages.slice(-5);
    const contextStr = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    return {
      system: SYSTEM_PROMPTS.intent_classifier,
      context: `Recent conversation:\n${contextStr}\n\nUser preferences: ${JSON.stringify(context.userPreferences)}`,
      userMessage: userMessage,
      examples: [
        {
          user: "I need a coffee maker under $100",
          assistant: '{"intent": "product_search", "confidence": 0.9, "entities": [{"type": "product_name", "value": "coffee maker"}, {"type": "price", "value": "$100"}], "action": "search_products", "parameters": {"query": "coffee maker", "maxPrice": 100}}',
          intent: "product_search"
        }
      ]
    };
  }

  // Build prompt for response generation
  private buildResponsePrompt(
    userMessage: string,
    intent: IntentResult,
    context: ConversationContext
  ): AIPrompt {
    const recentMessages = context.messages.slice(-5);
    const contextStr = recentMessages.map(m => `${m.role}: ${m.content}`).join('\n');
    
    return {
      system: SYSTEM_PROMPTS.shopping_assistant,
      context: `Recent conversation:\n${contextStr}\n\nDetected intent: ${intent.intent}\nUser preferences: ${JSON.stringify(context.userPreferences)}\nCart summary: ${JSON.stringify(context.cartSummary)}`,
      userMessage: userMessage
    };
  }

  // Call LLM API (Real Gemini implementation)
  private async callLLM(promptData: AIPrompt): Promise<{ content: string }> {
    console.log('🚀 Making real Gemini API call...');
    
    if (!this.config.llm.apiKey) {
      throw new Error('No API key configured for Gemini');
    }

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.llm.model}:generateContent?key=${this.config.llm.apiKey}`;
      
      // Build the prompt for Gemini
      const fullPrompt = [
        promptData.system,
        promptData.context,
        `User: ${promptData.userMessage}`,
        'Assistant:'
      ].filter(Boolean).join('\n\n');

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: fullPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: this.config.llm.temperature,
          maxOutputTokens: this.config.llm.maxTokens,
          topK: 40,
          topP: 0.95,
        }
      };

      console.log('📝 Sending request to Gemini API...');
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Gemini API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('❌ Invalid Gemini response structure:', data);
        throw new Error('Invalid response from Gemini API');
      }

      const content = data.candidates[0].content.parts[0].text;
      
      console.log('✅ Gemini API response received:', {
        responseLength: content.length,
        model: this.config.llm.model
      });
      
      return { content };
      
    } catch (error) {
      console.error('❌ Gemini API call failed:', error);
      
      // Fallback to mock response if API fails
      console.log('🔄 Falling back to mock response...');
      return {
        content: `I apologize, but I'm having trouble connecting to the AI service right now. However, I can still help you with your shopping needs! What are you looking for today?`
      };
    }
  }

  // Fallback response when AI services fail
  private generateFallbackResponse(
    userMessage: string,
    context: ConversationContext
  ): LLMResponse {
    const intent = this.classifyIntentRuleBased(userMessage);
    return this.generateTemplateResponse(userMessage, intent, context);
  }

  // Rate limiting check
  private checkRateLimit(): boolean {
    const now = Date.now();
    
    // Reset counter every minute
    if (now > this.rateLimitCounter.resetTime) {
      this.rateLimitCounter = {
        requests: 0,
        tokens: 0,
        resetTime: now + 60000
      };
    }
    
    // Check limits
    if (this.rateLimitCounter.requests >= this.config.rateLimiting.requestsPerMinute) {
      return false;
    }
    
    this.rateLimitCounter.requests++;
    return true;
  }

  // Streaming response support
  async *streamResponse(
    userMessage: string,
    context: ConversationContext
  ): AsyncGenerator<StreamingResponse> {
    try {
      const intent = await this.classifyIntent(userMessage, context);
      
      // Simulate streaming response
      const response = await this.generateResponse(userMessage, intent, context);
      const words = response.content.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        yield {
          content: words.slice(0, i + 1).join(' '),
          isComplete: i === words.length - 1,
          tokens: i + 1
        };
        
        // Small delay between words
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      yield {
        content: '',
        isComplete: true,
        tokens: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Update configuration to include Deep Research API keys
  updateConfig(newConfig: Partial<AIServiceConfig> & { serpApiKey?: string; geminiApiKey?: string }) {
    this.config = { ...this.config, ...newConfig };
    
    // Update Deep Research service API keys if provided
    if (newConfig.serpApiKey && newConfig.geminiApiKey) {
      deepResearchService.setApiKeys(newConfig.serpApiKey, newConfig.geminiApiKey);
    }
  }

  // Check if Deep Research is available
  isDeepResearchAvailable(): boolean {
    return deepResearchService.hasApiKeys();
  }

  // Get Deep Research status
  getDeepResearchStatus(): { available: boolean; hasApiKeys: boolean } {
    return {
      available: true,
      hasApiKeys: deepResearchService.hasApiKeys()
    };
  }

  // Get current configuration
  getConfig(): AIServiceConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const aiService = new AIService();
export { AIService }; 