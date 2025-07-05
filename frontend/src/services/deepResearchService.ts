// Deep Research Types
export interface ResearchIntent {
  intent: 'product_research';
  category: string;
  constraints: {
    price?: string;
    rating?: string;
    brand?: string;
    features?: string[];
  };
  originalQuery: string;
}

export interface ResearchPlan {
  searchQueries: string[];
  extractionTargets: string[];
  rankingCriteria: string[];
  expectedResults: number;
}

export interface ProductResearchResult {
  name: string;
  price: number;
  rating: number;
  description: string;
  imageUrl?: string;
  source: string;
  sourceUrl: string;
  reviews: ReviewData[];
  sentimentScore: number;
  overallScore: number;
}

export interface ReviewData {
  text: string;
  rating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
}

export interface DeepResearchResponse {
  products: ProductResearchResult[];
  researchSummary: string;
  citations: string[];
  methodology: string;
  totalProcessingTime: number;
}

// SerpAPI Types
interface SerpSearchResult {
  title: string;
  link: string;
  snippet: string;
  price?: string;
  rating?: string;
  source?: string;
  position?: number;
}

interface SerpShoppingResult {
  title: string;
  link: string;
  price: string;
  rating?: number;
  reviews?: number;
  source: string;
  thumbnail?: string;
}

interface SerpApiResponse {
  organic_results: SerpSearchResult[];
  shopping_results?: SerpShoppingResult[];
  search_metadata?: {
    status: string;
    total_time_taken: number;
  };
}

class DeepResearchService {
  private serpApiKey: string;
  private geminiApiKey: string;
  private baseUrl = 'https://serpapi.com/search.json';
  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  constructor() {
    // Use the provided API key
    this.serpApiKey = process.env.NEXT_PUBLIC_SERP_API_KEY || '6bcbe76b8b514518985e3007d17211f273c1691b24ad3ea72596b847e258b230';
    this.geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }

  // Step 1: Extract Intent & Category from User Query
  async extractIntent(userQuery: string): Promise<ResearchIntent> {
    if (this.geminiApiKey) {
      const prompt = `
Extract structured intent from this shopping query: "${userQuery}"

Return JSON in this exact format:
{
  "intent": "product_research",
  "category": "main product category",
  "constraints": {
    "price": "price constraint if any (e.g., '<=500', '>1000')",
    "rating": "rating constraint if any (e.g., 'high', '>4')", 
    "brand": "specific brand if mentioned",
    "features": ["list of specific features mentioned"]
  },
  "originalQuery": "${userQuery}"
}

Examples:
- "Buy me a high-rated coffee under ₹500" → category: "coffee", price: "<=500", rating: "high"
- "Best gaming laptop under $1000" → category: "gaming laptop", price: "<=1000"
- "Samsung phone with good camera" → category: "smartphone", brand: "Samsung", features: ["camera"]
`;

      try {
        const response = await this.callGemini(prompt);
        const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
        return JSON.parse(cleanResponse);
      } catch (error) {
        console.error('Intent extraction failed:', error);
      }
    }
    
    // Fallback to rule-based extraction
    return this.extractIntentFallback(userQuery);
  }

  // Step 2: Plan the Research Task
  async createResearchPlan(intent: ResearchIntent): Promise<ResearchPlan> {
    const category = intent.category;
    const constraints = intent.constraints;
    
    // Create targeted search queries
    const queries = [
      `best ${category} ${constraints.price ? `under ${constraints.price}` : ''} ${constraints.brand || ''} buy online`,
      `${category} reviews ${constraints.rating ? 'high rated' : ''} ${constraints.brand || ''} 2024`,
      `${category} price comparison ${constraints.brand || ''} shopping`,
      `top ${category} ${constraints.features?.join(' ') || ''} recommendations`
    ].filter(q => q.trim().length > 0);

    return {
      searchQueries: queries.slice(0, 3), // Limit to 3 queries to manage API usage
      extractionTargets: ['product name', 'price', 'rating', 'reviews', 'specifications'],
      rankingCriteria: ['rating', 'price', 'reviews sentiment', 'source credibility'],
      expectedResults: 8
    };
  }

  // Step 3: Execute SERP Search
  async executeSearch(plan: ResearchPlan): Promise<(SerpSearchResult | SerpShoppingResult)[]> {
    const allResults: (SerpSearchResult | SerpShoppingResult)[] = [];

    for (const query of plan.searchQueries) {
      try {
        console.log(`🔍 Searching for: ${query}`);
        
        const params = new URLSearchParams({
          q: query,
          engine: 'google',
          num: '8',
          gl: 'us',
          hl: 'en'
        });

        // Use the Next.js API route instead of calling SerpAPI directly
        const response = await fetch(`/api/search?${params}`);
        
        if (!response.ok) {
          throw new Error(`Search API request failed: ${response.status} ${response.statusText}`);
        }

        const data: SerpApiResponse = await response.json();
        
        // Combine organic and shopping results
        const organicResults = data.organic_results || [];
        const shoppingResults = data.shopping_results || [];
        
        // Convert shopping results to match our interface
        const convertedShoppingResults = shoppingResults.map(result => ({
          title: result.title,
          link: result.link,
          snippet: `${result.source} - ${result.price}${result.rating ? ` - ${result.rating}/5 stars` : ''}${result.reviews ? ` - ${result.reviews} reviews` : ''}`,
          price: result.price,
          rating: result.rating?.toString(),
          source: result.source,
          position: 0
        }));

        allResults.push(...organicResults, ...convertedShoppingResults);
        
        console.log(`✅ Found ${organicResults.length} organic + ${shoppingResults.length} shopping results`);
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Search failed for query: ${query}`, error);
        // Continue with other queries even if one fails
      }
    }

    console.log(`📊 Total search results: ${allResults.length}`);
    return allResults;
  }

  // Step 4: Extract Product Information
  async extractProductInfo(searchResults: (SerpSearchResult | SerpShoppingResult)[]): Promise<ProductResearchResult[]> {
    const products: ProductResearchResult[] = [];

    for (const result of searchResults.slice(0, 12)) { // Limit to top 12 results
      try {
        const productInfo = await this.parseProductFromResult(result);
        if (productInfo) {
          products.push(productInfo);
        }
      } catch (error) {
        console.error('Product extraction failed:', error);
      }
    }

    console.log(`📦 Extracted ${products.length} products`);
    return products;
  }

  // Step 5: Sentiment Analysis & Ranking
  async analyzeSentimentAndRank(products: ProductResearchResult[]): Promise<ProductResearchResult[]> {
    console.log('🧠 Analyzing sentiment and ranking products...');
    
    for (const product of products) {
      // Analyze sentiment of description and reviews
      const textToAnalyze = product.description + ' ' + product.reviews.map(r => r.text).join(' ');
      product.sentimentScore = await this.analyzeSentiment(textToAnalyze);
      
      // Calculate overall score
      product.overallScore = this.calculateOverallScore(product);
    }

    // Sort by overall score descending
    const rankedProducts = products.sort((a, b) => b.overallScore - a.overallScore);
    
    console.log('📊 Products ranked by overall score');
    return rankedProducts;
  }

  // Step 6: Generate Answer with Citations
  async generateResearchReport(
    products: ProductResearchResult[], 
    originalQuery: string
  ): Promise<string> {
    const topProducts = products.slice(0, 5);
    const context = topProducts.map((p, i) => 
      `${i + 1}. **${p.name}** - $${p.price} - Rating: ${p.rating}/5
         Source: ${p.source} (${p.sourceUrl})
         Sentiment Score: ${p.sentimentScore.toFixed(2)}
         Description: ${p.description.substring(0, 200)}...`
    ).join('\n\n');

    if (this.geminiApiKey) {
      const prompt = `
Based on the user query: "${originalQuery}"

Here are the top researched products:
${context}

Write a comprehensive markdown report that:
1. Recommends the top 3 products with clear justification
2. Includes pricing and rating information
3. Explains why these products are recommended
4. Provides a brief comparison
5. Mentions key features and benefits

Format as markdown with proper headers and bullet points.
Make it conversational and helpful.
`;

      try {
        const response = await this.callGemini(prompt);
        return response;
      } catch (error) {
        console.error('Report generation failed:', error);
      }
    }
    
    return this.generateFallbackReport(topProducts, originalQuery);
  }

  // Main Deep Research Method
  async conductDeepResearch(userQuery: string): Promise<DeepResearchResponse> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 Starting Deep Research for:', userQuery);
      
      // Step 1: Extract Intent
      console.log('📊 Extracting intent...');
      const intent = await this.extractIntent(userQuery);
      console.log('✅ Intent extracted:', intent);
      
      // Step 2: Create Research Plan
      console.log('📋 Creating research plan...');
      const plan = await this.createResearchPlan(intent);
      console.log('✅ Research plan created:', plan);
      
      // Step 3: Execute Search
      console.log('🔍 Executing web search...');
      const searchResults = await this.executeSearch(plan);
      console.log(`✅ Search completed, found ${searchResults.length} results`);
      
      // Step 4: Extract Product Information
      console.log('📦 Extracting product information...');
      const products = await this.extractProductInfo(searchResults);
      console.log(`✅ Extracted ${products.length} products`);
      
      // Step 5: Sentiment Analysis & Ranking
      console.log('🧠 Analyzing sentiment and ranking...');
      const rankedProducts = await this.analyzeSentimentAndRank(products);
      console.log('✅ Products analyzed and ranked');
      
      // Step 6: Generate Report
      console.log('📝 Generating research report...');
      const researchSummary = await this.generateResearchReport(rankedProducts, userQuery);
      console.log('✅ Research report generated');
      
      const endTime = Date.now();
      const processingTime = endTime - startTime;
      
      console.log(`🎉 Deep Research completed in ${processingTime}ms`);
      
      return {
        products: rankedProducts,
        researchSummary,
        citations: rankedProducts.map(p => p.sourceUrl),
        methodology: 'Deep Research: Web search via SerpAPI → Content extraction → Sentiment analysis → Ranking → Report generation',
        totalProcessingTime: processingTime
      };
    } catch (error) {
      console.error('Deep Research failed:', error);
      throw new Error('Deep Research process failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Helper Methods
  private async callGemini(prompt: string): Promise<string> {
    if (!this.geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const response = await fetch(`${this.geminiUrl}?key=${this.geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  }

  private async parseProductFromResult(result: SerpSearchResult | SerpShoppingResult): Promise<ProductResearchResult | null> {
    // Extract price
    let price = 0;
    if ('price' in result && result.price) {
      const priceMatch = result.price.match(/[\d,]+\.?\d*/);
      if (priceMatch) {
        price = parseFloat(priceMatch[0].replace(/,/g, ''));
      }
    } else {
      // Try to extract from snippet
      const snippetPriceMatch = 'snippet' in result ? result.snippet.match(/\$?([\d,]+\.?\d*)/) : null;
      if (snippetPriceMatch) {
        price = parseFloat(snippetPriceMatch[1].replace(/,/g, ''));
      }
    }

    // Extract rating
    let rating = 0;
    if ('rating' in result && result.rating) {
      rating = typeof result.rating === 'string' ? parseFloat(result.rating) : result.rating;
    } else {
      // Try to extract from snippet
      const ratingMatch = 'snippet' in result ? result.snippet.match(/(\d+\.?\d*)\s*(?:\/\s*5|\s*stars?|\s*out of 5)/i) : null;
      if (ratingMatch) {
        rating = parseFloat(ratingMatch[1]);
      }
    }

    // Skip if no meaningful product data
    if (price === 0 && rating === 0) {
      return null;
    }

    // Extract domain/source
    const source = this.extractDomain(result.link);
    
    // Create mock reviews based on rating
    const reviews: ReviewData[] = [];
    if (rating > 0) {
      reviews.push({
        text: rating >= 4 ? "Great product, highly recommended!" : rating >= 3 ? "Good value for money." : "Average product.",
        rating: rating,
        sentiment: rating >= 4 ? 'positive' : rating >= 3 ? 'neutral' : 'negative',
        confidence: 0.8
      });
    }

    return {
      name: result.title,
      price: price || 999999, // High price if not found
      rating: rating || 3.0, // Default rating
      description: 'snippet' in result ? result.snippet : result.title,
      imageUrl: 'thumbnail' in result ? result.thumbnail : undefined,
      source: source,
      sourceUrl: result.link,
      reviews: reviews,
      sentimentScore: 0, // Will be calculated later
      overallScore: 0 // Will be calculated later
    };
  }

  private async analyzeSentiment(text: string): Promise<number> {
    if (!this.geminiApiKey || !text.trim()) {
      return 0.5; // Default neutral sentiment
    }

    const prompt = `
Analyze the sentiment of this product-related text and return a score from 0 to 1:
"${text.substring(0, 500)}"

Return only a number between 0 and 1 where:
- 0 = Very negative
- 0.5 = Neutral  
- 1 = Very positive

Just return the number, no explanation.
`;

    try {
      const response = await this.callGemini(prompt);
      const score = parseFloat(response.trim());
      return isNaN(score) ? 0.5 : Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return 0.5; // Default neutral sentiment
    }
  }

  private calculateOverallScore(product: ProductResearchResult): number {
    // Weighted scoring formula
    const normalizedRating = product.rating / 5.0;
    const normalizedPrice = product.price > 0 ? Math.max(0, 1 - (product.price / 1000)) : 0;
    const sentimentScore = product.sentimentScore;
    
    // Weights: 40% rating, 30% sentiment, 30% price
    return (normalizedRating * 0.4) + (sentimentScore * 0.3) + (normalizedPrice * 0.3);
  }

  private extractDomain(url: string): string {
    try {
      const domain = new URL(url).hostname;
      return domain.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  private extractIntentFallback(query: string): ResearchIntent {
    const lowerQuery = query.toLowerCase();
    
    // Extract category (simple keyword matching)
    const categories = [
      'coffee', 'laptop', 'phone', 'smartphone', 'headphones', 'headphone',
      'watch', 'camera', 'tablet', 'speaker', 'mouse', 'keyboard', 'monitor',
      'chair', 'desk', 'backpack', 'shoes', 'clothing', 'book', 'game'
    ];
    const category = categories.find(cat => lowerQuery.includes(cat)) || 'product';
    
    // Extract price constraints
    const priceMatch = lowerQuery.match(/(?:under|below|less than|maximum|max)\s*[\$₹]?([\d,]+)|[\$₹]?([\d,]+)\s*(?:or less|max|maximum)/);
    const price = priceMatch ? `<=${priceMatch[1] || priceMatch[2]}` : undefined;
    
    // Extract brand
    const brands = ['apple', 'samsung', 'sony', 'lg', 'dell', 'hp', 'lenovo', 'nike', 'adidas', 'microsoft', 'google'];
    const brand = brands.find(b => lowerQuery.includes(b));
    
    // Extract rating constraints
    const rating = lowerQuery.includes('high-rated') || lowerQuery.includes('best rated') || lowerQuery.includes('top rated') ? 'high' : undefined;
    
    return {
      intent: 'product_research',
      category,
      constraints: { price, rating, brand },
      originalQuery: query
    };
  }

  private generateFallbackReport(products: ProductResearchResult[], query: string): string {
    const topProducts = products.slice(0, 3);
    
    let report = `# Deep Research Results for "${query}"\n\n`;
    report += `Based on my web research, here are the top product recommendations:\n\n`;
    
    topProducts.forEach((product, index) => {
      report += `## ${index + 1}. ${product.name}\n`;
      report += `- **Price**: $${product.price.toLocaleString()}\n`;
      report += `- **Rating**: ${product.rating}/5 stars\n`;
      report += `- **Source**: [${product.source}](${product.sourceUrl})\n`;
      report += `- **Overall Score**: ${(product.overallScore * 100).toFixed(0)}%\n\n`;
      report += `${product.description}\n\n`;
    });
    
    report += `## Research Summary\n`;
    report += `I analyzed ${products.length} products from various sources to find the best matches for your query. `;
    report += `The ranking is based on a combination of user ratings, price competitiveness, and review sentiment.\n\n`;
    
    return report;
  }

  // Configuration methods
  setApiKeys(serpApiKey: string, geminiApiKey: string) {
    this.serpApiKey = serpApiKey;
    this.geminiApiKey = geminiApiKey;
  }

  hasApiKeys(): boolean {
    return !!(this.serpApiKey && this.serpApiKey !== '');
  }

  getSerpApiKey(): string {
    return this.serpApiKey;
  }
}

// Export singleton instance
export const deepResearchService = new DeepResearchService();
export { DeepResearchService }; 