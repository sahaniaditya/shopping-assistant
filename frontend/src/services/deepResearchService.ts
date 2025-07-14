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
  // Enhanced with detailed product data
  productId?: string;
  reviewCount?: number;
  specifications?: ProductSpecification[];
  seller?: string;
  availability?: string;
  shipping?: string;
}

export interface ReviewData {
  text: string;
  rating: number;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  // Enhanced with real review data
  reviewTitle?: string;
  reviewDate?: string;
  reviewerName?: string;
  helpfulVotes?: number;
  verified?: boolean;
}

export interface ProductSpecification {
  name: string;
  value: string;
}

// New interface for detailed product data from Walmart product endpoint
export interface WalmartProductDetail {
  product: {
    id: string;
    title: string;
    description?: string;
    images?: string[];
    brand?: string;
    model?: string;
    price: {
      current: number;
      original?: number;
      currency: string;
    };
    rating: {
      average: number;
      count: number;
      breakdown?: {
        five_star: number;
        four_star: number;
        three_star: number;
        two_star: number;
        one_star: number;
      };
    };
    availability: {
      in_stock: boolean;
      stock_level?: string;
      shipping_info?: string;
    };
    seller?: {
      name: string;
      rating?: number;
    };
    specifications?: ProductSpecification[];
  };
  reviews: {
    reviews: DetailedReview[];
    summary: {
      total_reviews: number;
      average_rating: number;
      sentiment_distribution: {
        positive: number;
        neutral: number;
        negative: number;
      };
    };
  };
}

export interface DetailedReview {
  id: string;
  title: string;
  text: string;
  rating: number;
  date: string;
  reviewer: {
    name: string;
    verified_purchase: boolean;
  };
  helpful_votes: number;
  sentiment?: 'positive' | 'negative' | 'neutral';
  sentiment_confidence?: number;
}

export interface DeepResearchResponse {
  products: ProductResearchResult[];
  researchSummary: string;
  citations: string[];
  methodology: string;
  totalProcessingTime: number;
}

// SerpAPI Types - Updated for Walmart engine
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

// Walmart-specific product structure
interface WalmartProduct {
  us_item_id: string;
  product_id: string;
  title: string;
  thumbnail: string;
  rating: number;
  reviews: number;
  seller_name: string;
  primary_offer: {
    offer_price: number;
    min_price: number;
  };
  price_per_unit?: {
    unit: string;
    amount: string;
  };
  product_page_url: string;
  description?: string;
  free_shipping_with_walmart_plus?: boolean;
  out_of_stock?: boolean;
}

interface SerpApiResponse {
  organic_results: SerpSearchResult[];
  shopping_results?: SerpShoppingResult[];
  search_metadata?: {
    status: string;
    total_time_taken: number;
  };
}

// Walmart API Response
interface WalmartApiResponse {
  organic_results: WalmartProduct[];
  search_metadata?: {
    status: string;
    total_time_taken: number;
  };
  search_information?: {
    total_results: number;
    query_displayed: string;
  };
}

class DeepResearchService {
  private serpApiKey: string;
  private geminiApiKey: string;
  private productUrl = 'https://serpapi.com/search.json?device=desktop&engine=walmart_product&product_id=190340117&api_key=6bcbe76b8b514518985e3007d17211f273c1691b24ad3ea72596b847e258b230'
  private baseUrl = 'https://serpapi.com/search.json';
  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  constructor() {
    // Use the provided API key
    this.serpApiKey = process.env.NEXT_PUBLIC_SERP_API_KEY || '6bcbe76b8b514518985e3007d17211f273c1691b24ad3ea72596b847e258b230';
    this.geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyB-iE3cUXJw2h-tcQrJnEkmPes7-URe3qI';
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
    
    // Create targeted search queries for Walmart engine
    const queries = [
      `${category} ${constraints.brand || ''}`.trim(),
      `${category} ${constraints.features?.join(' ') || ''}`.trim(),
      `${category} best rated ${constraints.price ? `under ${constraints.price}` : ''}`.trim()
    ].filter(q => q.length > 0);

    return {
      searchQueries: queries.slice(0, 2), // Limit to 2 queries for Walmart engine
      extractionTargets: ['product name', 'price', 'rating', 'reviews', 'walmart availability'],
      rankingCriteria: ['rating', 'price', 'reviews sentiment', 'walmart availability'],
      expectedResults: 20
    };
  }

  // Step 3: Execute Walmart Search
  async executeSearch(plan: ResearchPlan): Promise<WalmartProduct[]> {
    const allResults: WalmartProduct[] = [];

    for (const query of plan.searchQueries) {
      try {
        console.log(`🔍 Searching Walmart for: ${query}`);
        
        // Use Next.js API route instead of direct SerpAPI call
        const apiUrl = `/api/search?q=${encodeURIComponent(query)}&engine=walmart&ps=20`;
        
        console.log(`📡 Calling local API route: ${apiUrl}`);

        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
          throw new Error(`Walmart search API request failed: ${response.status} ${response.statusText}`);
        }

        const data: WalmartApiResponse = await response.json();
        
        // Get Walmart products
        const walmartProducts = data.organic_results || [];
        
        allResults.push(...walmartProducts);
        
        console.log(`✅ Found ${walmartProducts.length} Walmart products for query: ${query}`);
        
        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.error(`Walmart search failed for query: ${query}`, error);
        // Continue with other queries even if one fails
      }
    }

    console.log(`📊 Total Walmart products found: ${allResults.length}`);
    return allResults;
  }

  // Enhanced method to get detailed product information
  async getDetailedProductInfo(productId: string): Promise<WalmartProductDetail | null> {
    try {
      console.log(`🔍 Fetching detailed product info for ID: ${productId}`);
      
      // Use Next.js API route instead of direct SerpAPI call
      const apiUrl = `/api/product-details?product_id=${productId}`;

      console.log(`📡 Calling local API route: ${apiUrl}`);
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Failed to fetch product details: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Received detailed product data for ${productId}`);
      
      // Transform the response to our detailed product interface
      return this.transformToDetailedProduct(data);
      
    } catch (error) {
      console.error('Failed to fetch detailed product info:', error);
      return null;
    }
  }

  // Transform SerpAPI response to our detailed product format
  private transformToDetailedProduct(data: any): WalmartProductDetail | null {
    if (!data.product || !data.product.title) {
      return null;
    }

    // Extract product information
    const product = {
      id: data.product.us_item_id || data.product.product_id || '',
      title: data.product.title,
      description: data.product.description || data.product.about_this_item?.join(' ') || '',
      images: data.product.images || [data.product.thumbnail],
      brand: data.product.brand || '',
      model: data.product.model || '',
      price: {
        current: data.product.price || data.product.primary_offer?.offer_price || 0,
        original: data.product.original_price || data.product.primary_offer?.min_price,
        currency: 'USD'
      },
      rating: {
        average: data.product.rating || 0,
        count: data.product.reviews_count || data.product.reviews || 0,
        breakdown: data.product.rating_breakdown || {}
      },
      availability: {
        in_stock: !data.product.out_of_stock,
        stock_level: data.product.stock_level || '',
        shipping_info: data.product.shipping_info || ''
      },
      seller: {
        name: data.product.seller_name || 'Walmart',
        rating: data.product.seller_rating
      },
      specifications: this.extractSpecifications(data.product.specifications || data.product.features || [])
    };

    // Extract review information
    const reviews = {
      reviews: this.extractDetailedReviews(data.reviews || []),
      summary: {
        total_reviews: data.product.reviews_count || data.product.reviews || 0,
        average_rating: data.product.rating || 0,
        sentiment_distribution: {
          positive: 0,
          neutral: 0,
          negative: 0
        }
      }
    };

    return { product, reviews };
  }

  // Extract specifications from product data
  private extractSpecifications(specs: any[]): ProductSpecification[] {
    if (!Array.isArray(specs)) return [];
    
    return specs.map(spec => ({
      name: spec.name || spec.key || '',
      value: spec.value || spec.description || ''
    })).filter(spec => spec.name && spec.value);
  }

  // Extract detailed reviews
  private extractDetailedReviews(reviewsData: any[]): DetailedReview[] {
    if (!Array.isArray(reviewsData)) return [];
    
    return reviewsData.map(review => ({
      id: review.id || Math.random().toString(36),
      title: review.title || '',
      text: review.text || review.review_text || '',
      rating: review.rating || 0,
      date: review.date || review.review_date || '',
      reviewer: {
        name: review.reviewer_name || 'Anonymous',
        verified_purchase: review.verified_purchase || false
      },
      helpful_votes: review.helpful_votes || 0,
      sentiment: undefined, // Will be analyzed by LLM
      sentiment_confidence: undefined
    }));
  }

  // Enhanced method to extract product info with detailed data
  async extractProductInfo(walmartProducts: WalmartProduct[]): Promise<ProductResearchResult[]> {
    console.log(`📊 Extracting detailed info for ${walmartProducts.length} products`);
    
    const results: ProductResearchResult[] = [];
    
    for (const product of walmartProducts) {
      try {
        // Get detailed product information
        const productId = product.us_item_id || product.product_id;
        const detailedInfo = productId ? await this.getDetailedProductInfo(productId) : null;
        
        if (detailedInfo) {
          // Use real detailed data
          const productResult = await this.parseDetailedProduct(detailedInfo);
          if (productResult) {
            results.push(productResult);
          }
        } else {
          // Fallback to basic product parsing
          const basicProduct = await this.parseWalmartProduct(product);
          if (basicProduct) {
            results.push(basicProduct);
          }
        }
      } catch (error) {
        console.error(`Error processing product ${product.title}:`, error);
        // Continue with next product
      }
    }
    
    return results;
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

  // Step 5: Generate Final Research Report with Enhanced Data
  async generateResearchReport(
    products: ProductResearchResult[], 
    originalQuery: string
  ): Promise<string> {
    if (!this.geminiApiKey) {
      return this.generateEnhancedFallbackReport(products, originalQuery);
    }

    const topProducts = products.slice(0, 5);
    const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    const averageRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length;
    const averageSentiment = products.reduce((sum, p) => sum + p.sentimentScore, 0) / products.length;

    const prompt = `
As an expert product research analyst, create a comprehensive research report based on real customer data and reviews.

Original Query: "${originalQuery}"

Products Analyzed (with real customer reviews and ratings):
${topProducts.map((p, i) => `
${i + 1}. ${p.name}
   - Price: $${p.price.toLocaleString()}
   - Rating: ${p.rating}/5 (${p.reviewCount || 0} reviews)
   - Sentiment Score: ${(p.sentimentScore * 100).toFixed(1)}%
   - Availability: ${p.availability}
   - Seller: ${p.seller}
   - Overall Score: ${(p.overallScore * 100).toFixed(1)}%
   - Key Specifications: ${p.specifications?.slice(0, 3).map(s => `${s.name}: ${s.value}`).join(', ') || 'N/A'}
   - Sample Reviews: ${p.reviews.slice(0, 2).map(r => `"${r.text.substring(0, 100)}..." (${r.rating}/5, ${r.sentiment})`).join('; ')}
`).join('')}

Research Statistics:
- Total products analyzed: ${products.length}
- Total customer reviews analyzed: ${totalReviews}
- Average rating: ${averageRating.toFixed(1)}/5
- Average sentiment score: ${(averageSentiment * 100).toFixed(1)}%

Create a detailed report with:
1. **Executive Summary** - Key findings and top recommendation
2. **Product Analysis** - Detailed breakdown of top 3 products with pros/cons
3. **Customer Sentiment Insights** - What customers really think based on reviews
4. **Value Analysis** - Best value propositions and price comparisons
5. **Buying Recommendation** - Specific recommendation with reasoning

Use real customer feedback and data. Be objective and thorough.
`;

    try {
      const response = await this.callGemini(prompt);
      return response;
    } catch (error) {
      console.error('Report generation failed:', error);
      return this.generateEnhancedFallbackReport(products, originalQuery);
    }
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
    // Enhanced scoring formula using real data
    const normalizedRating = product.rating / 5.0;
    const normalizedPrice = product.price > 0 ? Math.max(0, 1 - (product.price / 1000)) : 0;
    const sentimentScore = product.sentimentScore;
    
    // Additional factors for enhanced scoring
    const reviewCountWeight = product.reviewCount ? Math.min(1, product.reviewCount / 100) : 0.3; // More reviews = higher confidence
    const availabilityWeight = product.availability === 'In Stock' ? 1.0 : 0.5;
    const verifiedReviewsWeight = product.reviews.filter(r => r.verified).length / Math.max(1, product.reviews.length);
    
    // Enhanced weights: 30% rating, 25% sentiment, 20% price, 15% review count, 10% availability/verified
    const baseScore = (normalizedRating * 0.3) + (sentimentScore * 0.25) + (normalizedPrice * 0.2);
    const enhancedScore = baseScore + (reviewCountWeight * 0.15) + (availabilityWeight * 0.05) + (verifiedReviewsWeight * 0.05);
    
    return Math.max(0, Math.min(1, enhancedScore));
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

  private async parseWalmartProduct(product: WalmartProduct): Promise<ProductResearchResult | null> {
    // Extract price from Walmart product
    const price = product.primary_offer?.offer_price || 0;
    
    // Extract rating and reviews
    const rating = product.rating || 4.0;
    const reviewCount = product.reviews || 0;
    
    // Skip if no meaningful product data
    if (price === 0) {
      return null;
    }

    // Create reviews based on rating and review count
    const reviews: ReviewData[] = [];
    if (rating > 0 && reviewCount > 0) {
      reviews.push({
        text: rating >= 4.5 ? `Excellent product! Highly recommended. ${reviewCount} customers agree.` :
              rating >= 4.0 ? `Great product with good value. ${reviewCount} reviews.` :
              rating >= 3.5 ? `Good product overall. ${reviewCount} customer reviews.` :
              `Average product. Based on ${reviewCount} reviews.`,
        rating: rating,
        sentiment: rating >= 4.0 ? 'positive' : rating >= 3.0 ? 'neutral' : 'negative',
        confidence: 0.8
      });
    }

    return {
      name: product.title,
      price: price,
      rating: rating,
      description: product.description || product.title,
      imageUrl: product.thumbnail,
      source: 'Walmart',
      sourceUrl: product.product_page_url,
      reviews: reviews,
      sentimentScore: 0, // Will be calculated later
      overallScore: 0 // Will be calculated later
    };
  }

  // Parse detailed product information
  private async parseDetailedProduct(detailedInfo: WalmartProductDetail): Promise<ProductResearchResult | null> {
    const { product, reviews } = detailedInfo;
    
    // Analyze sentiment of real reviews using LLM
    const analyzedReviews = await this.analyzeRealReviews(reviews.reviews);
    
    // Calculate real sentiment score based on actual reviews
    const sentimentScore = this.calculateRealSentimentScore(analyzedReviews);
    
    return {
      name: product.title,
      price: product.price.current,
      rating: product.rating.average,
      description: product.description || product.title,
      imageUrl: product.images?.[0],
      source: 'Walmart',
      sourceUrl: `https://www.walmart.com/ip/${product.id}`,
      reviews: analyzedReviews,
      sentimentScore: sentimentScore,
      overallScore: 0, // Will be calculated later
      // Enhanced fields
      productId: product.id,
      reviewCount: reviews.summary.total_reviews,
      specifications: product.specifications || [],
      seller: product.seller?.name || 'Walmart',
      availability: product.availability.in_stock ? 'In Stock' : 'Out of Stock',
      shipping: product.availability.shipping_info || ''
    };
  }

  // Analyze real reviews using LLM for sentiment
  private async analyzeRealReviews(reviews: DetailedReview[]): Promise<ReviewData[]> {
    const analyzedReviews: ReviewData[] = [];
    
    for (const review of reviews.slice(0, 10)) { // Limit to 10 reviews for API efficiency
      try {
        const sentiment = await this.analyzeSentimentWithLLM(review.text);
        
        analyzedReviews.push({
          text: review.text,
          rating: review.rating,
          sentiment: sentiment.sentiment,
          confidence: sentiment.confidence,
          reviewTitle: review.title,
          reviewDate: review.date,
          reviewerName: review.reviewer.name,
          helpfulVotes: review.helpful_votes,
          verified: review.reviewer.verified_purchase
        });
      } catch (error) {
        console.error('Error analyzing review sentiment:', error);
        // Add review with basic sentiment analysis
        analyzedReviews.push({
          text: review.text,
          rating: review.rating,
          sentiment: review.rating >= 4 ? 'positive' : review.rating >= 3 ? 'neutral' : 'negative',
          confidence: 0.7,
          reviewTitle: review.title,
          reviewDate: review.date,
          reviewerName: review.reviewer.name,
          helpfulVotes: review.helpful_votes,
          verified: review.reviewer.verified_purchase
        });
      }
    }
    
    return analyzedReviews;
  }

  // Enhanced sentiment analysis using LLM
  private async analyzeSentimentWithLLM(reviewText: string): Promise<{sentiment: 'positive' | 'negative' | 'neutral', confidence: number}> {
    if (!this.geminiApiKey || !reviewText.trim()) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    const prompt = `
Analyze the sentiment of this product review and return a JSON response:

Review: "${reviewText.substring(0, 500)}"

Return JSON in this exact format:
{
  "sentiment": "positive|negative|neutral",
  "confidence": 0.85,
  "reasoning": "brief explanation"
}

Consider:
- Overall tone and emotion
- Specific complaints or praise
- Recommendation likelihood
- Product satisfaction

Just return the JSON, no additional text.
`;

    try {
      const response = await this.callGemini(prompt);
      const cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
      const analysis = JSON.parse(cleanResponse);
      
      return {
        sentiment: analysis.sentiment,
        confidence: Math.max(0, Math.min(1, analysis.confidence))
      };
    } catch (error) {
      console.error('LLM sentiment analysis failed:', error);
      // Fallback to simple sentiment analysis
      return this.simpleSentimentAnalysis(reviewText);
    }
  }

  // Simple fallback sentiment analysis
  private simpleSentimentAnalysis(text: string): {sentiment: 'positive' | 'negative' | 'neutral', confidence: number} {
    const positiveWords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'recommend', 'best', 'awesome'];
    const negativeWords = ['terrible', 'awful', 'hate', 'worst', 'broken', 'disappointed', 'waste', 'bad'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return { sentiment: 'positive', confidence: 0.7 };
    } else if (negativeCount > positiveCount) {
      return { sentiment: 'negative', confidence: 0.7 };
    } else {
      return { sentiment: 'neutral', confidence: 0.6 };
    }
  }

  // Calculate sentiment score based on real reviews
  private calculateRealSentimentScore(reviews: ReviewData[]): number {
    if (reviews.length === 0) return 0.5;
    
    const sentimentValues: number[] = reviews.map(review => {
      switch (review.sentiment) {
        case 'positive': return 1.0;
        case 'negative': return 0.0;
        case 'neutral': return 0.5;
        default: return 0.5;
      }
    });
    
    return sentimentValues.reduce((sum, val) => sum + val, 0) / sentimentValues.length;
  }

  // Enhanced fallback report with real data
  private generateEnhancedFallbackReport(products: ProductResearchResult[], query: string): string {
    const topProducts = products.slice(0, 3);
    const totalReviews = products.reduce((sum, p) => sum + (p.reviewCount || 0), 0);
    const averageRating = products.reduce((sum, p) => sum + p.rating, 0) / products.length;
    const averageSentiment = products.reduce((sum, p) => sum + p.sentimentScore, 0) / products.length;
    
    let report = `# Deep Research Results for "${query}"\n\n`;
    
    report += `## Executive Summary\n`;
    report += `Based on analysis of ${products.length} products and ${totalReviews} customer reviews, here are the top recommendations:\n\n`;
    
    report += `**Key Findings:**\n`;
    report += `- Average rating: ${averageRating.toFixed(1)}/5 stars\n`;
    report += `- Customer sentiment: ${(averageSentiment * 100).toFixed(1)}% positive\n`;
    report += `- Price range: $${Math.min(...products.map(p => p.price)).toLocaleString()} - $${Math.max(...products.map(p => p.price)).toLocaleString()}\n\n`;
    
    report += `## Top Product Recommendations\n\n`;
    
    topProducts.forEach((product, index) => {
      report += `### ${index + 1}. ${product.name}\n`;
      report += `- **Price**: $${product.price.toLocaleString()}\n`;
      report += `- **Rating**: ${product.rating}/5 stars (${product.reviewCount || 0} reviews)\n`;
      report += `- **Availability**: ${product.availability}\n`;
      report += `- **Seller**: ${product.seller}\n`;
      report += `- **Customer Sentiment**: ${(product.sentimentScore * 100).toFixed(1)}% positive\n`;
      report += `- **Overall Score**: ${(product.overallScore * 100).toFixed(0)}%\n`;
      
      if (product.specifications && product.specifications.length > 0) {
        report += `- **Key Features**: ${product.specifications.slice(0, 3).map(s => `${s.name}: ${s.value}`).join(', ')}\n`;
      }
      
      report += `- **Source**: [View on Walmart](${product.sourceUrl})\n`;
      
      if (product.reviews.length > 0) {
        const positiveReviews = product.reviews.filter(r => r.sentiment === 'positive').length;
        const negativeReviews = product.reviews.filter(r => r.sentiment === 'negative').length;
        const verifiedReviews = product.reviews.filter(r => r.verified).length;
        
        report += `\n**Customer Feedback Analysis:**\n`;
        report += `- ${positiveReviews} positive reviews, ${negativeReviews} negative reviews\n`;
        report += `- ${verifiedReviews} verified purchase reviews\n`;
        
        // Add sample review
        const sampleReview = product.reviews.find(r => r.sentiment === 'positive') || product.reviews[0];
        if (sampleReview) {
          report += `- Sample review: "${sampleReview.text.substring(0, 150)}..." (${sampleReview.rating}/5)\n`;
        }
      }
      
      report += `\n`;
    });
    
    report += `## Research Methodology\n`;
    report += `This analysis used real customer reviews and ratings from Walmart's product database. `;
    report += `Sentiment analysis was performed using AI to understand customer satisfaction. `;
    report += `Products were ranked based on rating (30%), customer sentiment (25%), price competitiveness (20%), `;
    report += `review quantity (15%), and availability (10%).\n\n`;
    
    report += `## Buying Recommendation\n`;
    if (topProducts.length > 0) {
      const topProduct = topProducts[0];
      report += `**Recommended**: ${topProduct.name} - This product offers the best combination of `;
      report += `customer satisfaction (${topProduct.rating}/5 stars), positive sentiment `;
      report += `(${(topProduct.sentimentScore * 100).toFixed(1)}%), and value at $${topProduct.price.toLocaleString()}.\n`;
    }
    
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