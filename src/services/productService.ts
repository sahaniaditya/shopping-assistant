import { Product, ProductSearchQuery, ProductSearchResult, ProductCategory } from '@/types/product';

// Mock product data for testing
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod_1',
    title: 'Keurig K-Classic Coffee Maker',
    description: 'Brews a perfect cup of coffee, tea, cocoa, or iced beverage in under one minute. Compatible with all K-Cup pods.',
    price: 89.99,
    originalPrice: 129.99,
    discount: 31,
    rating: 4.4,
    reviewCount: 15420,
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
    images: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400'
    ],
    category: 'Kitchen & Dining',
    subcategory: 'Coffee Makers',
    brand: 'Keurig',
    inStock: true,
    stockCount: 145,
    features: [
      'Brews K-Cup pods in under one minute',
      '6, 8, and 10 oz. brew sizes',
      'Large 48 oz. water reservoir',
      'Auto-off feature saves energy'
    ],
    specifications: {
      'Dimensions': '9.8" W x 13.3" D x 13.0" H',
      'Weight': '8.7 lbs',
      'Brew Sizes': '6, 8, 10 oz',
      'Water Reservoir': '48 oz'
    },
    tags: ['coffee', 'keurig', 'kitchen appliance', 'single serve'],
    seller: {
      id: 'seller_1',
      name: 'Walmart',
      rating: 4.8,
      reviewCount: 125000,
      verified: true
    },
    shipping: {
      free: true,
      estimatedDays: 2,
      fastDelivery: true
    },
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20')
  },
  {
    id: 'prod_2',
    title: 'Sony WH-1000XM4 Wireless Headphones',
    description: 'Industry-leading noise canceling with Dual Noise Sensor technology. Up to 30-hour battery life with quick charge.',
    price: 248.00,
    originalPrice: 349.99,
    discount: 29,
    rating: 4.6,
    reviewCount: 8934,
    imageUrl: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
    images: [
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'
    ],
    category: 'Electronics',
    subcategory: 'Headphones',
    brand: 'Sony',
    inStock: true,
    stockCount: 67,
    features: [
      'Industry-leading noise canceling',
      '30-hour battery life',
      'Touch sensor controls',
      'Speak-to-chat technology'
    ],
    specifications: {
      'Driver Unit': '40mm dome type',
      'Frequency Response': '4 Hz-40,000 Hz',
      'Battery Life': '30 hours',
      'Weight': '254g'
    },
    tags: ['headphones', 'wireless', 'noise canceling', 'sony'],
    seller: {
      id: 'seller_2',
      name: 'Best Electronics',
      rating: 4.7,
      reviewCount: 5420,
      verified: true
    },
    shipping: {
      free: true,
      estimatedDays: 1,
      fastDelivery: true
    },
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-18')
  },
  {
    id: 'prod_3',
    title: 'iPhone 15 Pro Max',
    description: 'iPhone 15 Pro Max. Forged in titanium and featuring the groundbreaking A17 Pro chip, a customizable Action Button, and a more versatile Pro camera system.',
    price: 1199.00,
    rating: 4.8,
    reviewCount: 2841,
    imageUrl: 'https://images.unsplash.com/photo-1592910147589-9e0e9fa6634e?w=400',
    images: [
      'https://images.unsplash.com/photo-1592910147589-9e0e9fa6634e?w=400',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    ],
    category: 'Electronics',
    subcategory: 'Smartphones',
    brand: 'Apple',
    inStock: true,
    stockCount: 23,
    features: [
      'A17 Pro chip with 6-core GPU',
      'Pro camera system',
      'Action Button',
      'Titanium design'
    ],
    specifications: {
      'Display': '6.7-inch Super Retina XDR',
      'Chip': 'A17 Pro',
      'Storage': '256GB',
      'Camera': 'Pro camera system'
    },
    tags: ['iphone', 'smartphone', 'apple', 'pro max'],
    seller: {
      id: 'seller_1',
      name: 'Walmart',
      rating: 4.8,
      reviewCount: 125000,
      verified: true
    },
    shipping: {
      free: true,
      estimatedDays: 2,
      fastDelivery: true
    },
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'prod_4',
    title: 'Ninja Foodi Personal Blender',
    description: 'Crush ice and pulverize frozen ingredients with Ninja Total Crushing Blades. Perfect for smoothies and protein shakes.',
    price: 49.99,
    originalPrice: 79.99,
    discount: 38,
    rating: 4.5,
    reviewCount: 12567,
    imageUrl: 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400',
    images: [
      'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=400'
    ],
    category: 'Kitchen & Dining',
    subcategory: 'Blenders',
    brand: 'Ninja',
    inStock: true,
    stockCount: 89,
    features: [
      'Total Crushing Blades',
      'To-Go cups included',
      'Easy twist extractor blades',
      'Dishwasher safe parts'
    ],
    specifications: {
      'Cup Capacity': '18 oz',
      'Motor': '700-peak-watts',
      'Dimensions': '5.5" W x 5.5" D x 15.5" H',
      'Weight': '3.8 lbs'
    },
    tags: ['blender', 'ninja', 'smoothies', 'personal'],
    seller: {
      id: 'seller_3',
      name: 'Kitchen Pro',
      rating: 4.6,
      reviewCount: 8900,
      verified: true
    },
    shipping: {
      free: false,
      cost: 5.99,
      estimatedDays: 3
    },
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-16')
  },
  {
    id: 'prod_5',
    title: 'Starbucks Pike Place Roast Coffee',
    description: 'Medium roast whole bean coffee with smooth and balanced flavor. Perfect for everyday drinking.',
    price: 12.99,
    rating: 4.3,
    reviewCount: 5643,
    imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400',
    images: [
      'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400'
    ],
    category: 'Food & Beverages',
    subcategory: 'Coffee',
    brand: 'Starbucks',
    inStock: true,
    stockCount: 234,
    features: [
      'Medium roast',
      'Whole bean',
      'Smooth and balanced',
      '12 oz bag'
    ],
    specifications: {
      'Roast Level': 'Medium',
      'Bean Type': 'Whole Bean',
      'Weight': '12 oz',
      'Origin': 'Latin America'
    },
    tags: ['coffee', 'starbucks', 'medium roast', 'whole bean'],
    seller: {
      id: 'seller_1',
      name: 'Walmart',
      rating: 4.8,
      reviewCount: 125000,
      verified: true
    },
    shipping: {
      free: true,
      estimatedDays: 2
    },
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-14')
  }
];

const MOCK_CATEGORIES: ProductCategory[] = [
  {
    id: 'cat_1',
    name: 'Electronics',
    slug: 'electronics',
    description: 'Latest technology and electronic devices',
    productCount: 15420,
    children: [
      { id: 'cat_1_1', name: 'Smartphones', slug: 'smartphones', productCount: 1240, parentId: 'cat_1' },
      { id: 'cat_1_2', name: 'Headphones', slug: 'headphones', productCount: 890, parentId: 'cat_1' },
      { id: 'cat_1_3', name: 'Laptops', slug: 'laptops', productCount: 2100, parentId: 'cat_1' }
    ]
  },
  {
    id: 'cat_2',
    name: 'Kitchen & Dining',
    slug: 'kitchen-dining',
    description: 'Everything for your kitchen and dining needs',
    productCount: 8930,
    children: [
      { id: 'cat_2_1', name: 'Coffee Makers', slug: 'coffee-makers', productCount: 567, parentId: 'cat_2' },
      { id: 'cat_2_2', name: 'Blenders', slug: 'blenders', productCount: 234, parentId: 'cat_2' },
      { id: 'cat_2_3', name: 'Cookware', slug: 'cookware', productCount: 1890, parentId: 'cat_2' }
    ]
  },
  {
    id: 'cat_3',
    name: 'Food & Beverages',
    slug: 'food-beverages',
    description: 'Fresh food and beverages',
    productCount: 12340,
    children: [
      { id: 'cat_3_1', name: 'Coffee', slug: 'coffee', productCount: 890, parentId: 'cat_3' },
      { id: 'cat_3_2', name: 'Snacks', slug: 'snacks', productCount: 2340, parentId: 'cat_3' }
    ]
  }
];

class ProductService {
  // Simulate API delay
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Search products with filters
  async searchProducts(query: ProductSearchQuery): Promise<ProductSearchResult> {
    await this.delay(800); // Simulate API call

    let filteredProducts = [...MOCK_PRODUCTS];

    // Text search
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      filteredProducts = filteredProducts.filter(product =>
        product.title.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    // Category filter
    if (query.category) {
      filteredProducts = filteredProducts.filter(product =>
        product.category.toLowerCase().includes(query.category!.toLowerCase())
      );
    }

    // Price filters
    if (query.minPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price >= query.minPrice!);
    }
    if (query.maxPrice !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.price <= query.maxPrice!);
    }

    // Rating filter
    if (query.minRating !== undefined) {
      filteredProducts = filteredProducts.filter(product => product.rating >= query.minRating!);
    }

    // Brand filter
    if (query.brand) {
      filteredProducts = filteredProducts.filter(product =>
        product.brand.toLowerCase() === query.brand!.toLowerCase()
      );
    }

    // In stock filter
    if (query.inStockOnly) {
      filteredProducts = filteredProducts.filter(product => product.inStock);
    }

    // Sorting
    switch (query.sortBy) {
      case 'price_low_high':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_high_low':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case 'reviews':
        filteredProducts.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case 'newest':
        filteredProducts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
      default: // relevance
        // Keep original order for relevance
        break;
    }

    // Pagination
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);

    // Generate filters
    const filters = this.generateFilters(filteredProducts);

    // Generate suggestions
    const suggestions = this.generateSuggestions(query.query);

    return {
      products: paginatedProducts,
      total: filteredProducts.length,
      query,
      suggestions,
      filters
    };
  }

  // Get product by ID
  async getProduct(id: string): Promise<Product | null> {
    await this.delay(300);
    return MOCK_PRODUCTS.find(p => p.id === id) || null;
  }

  // Get categories
  async getCategories(): Promise<ProductCategory[]> {
    await this.delay(200);
    return MOCK_CATEGORIES;
  }

  // Generate search filters based on current results
  private generateFilters(products: Product[]) {
    const categories = new Map<string, number>();
    const brands = new Map<string, number>();
    const ratings = new Map<string, number>();

    products.forEach(product => {
      // Categories
      const count = categories.get(product.category) || 0;
      categories.set(product.category, count + 1);

      // Brands
      const brandCount = brands.get(product.brand) || 0;
      brands.set(product.brand, brandCount + 1);

      // Ratings (grouped)
      const ratingGroup = Math.floor(product.rating).toString();
      const ratingCount = ratings.get(ratingGroup) || 0;
      ratings.set(ratingGroup, ratingCount + 1);
    });

    return {
      categories: Array.from(categories.entries()).map(([value, count]) => ({
        value,
        label: value,
        count
      })),
      brands: Array.from(brands.entries()).map(([value, count]) => ({
        value,
        label: value,
        count
      })),
      priceRanges: [
        { min: 0, max: 25, label: 'Under $25', count: products.filter(p => p.price < 25).length },
        { min: 25, max: 50, label: '$25 - $50', count: products.filter(p => p.price >= 25 && p.price < 50).length },
        { min: 50, max: 100, label: '$50 - $100', count: products.filter(p => p.price >= 50 && p.price < 100).length },
        { min: 100, max: 500, label: '$100 - $500', count: products.filter(p => p.price >= 100 && p.price < 500).length },
        { min: 500, max: Infinity, label: '$500+', count: products.filter(p => p.price >= 500).length }
      ],
      ratings: Array.from(ratings.entries()).map(([value, count]) => ({
        value,
        label: `${value}+ stars`,
        count
      })).sort((a, b) => b.value.localeCompare(a.value))
    };
  }

  // Generate search suggestions
  private generateSuggestions(query?: string): string[] {
    if (!query || query.length < 2) return [];

    const suggestions = [
      'coffee maker',
      'headphones wireless',
      'iphone case',
      'kitchen appliances',
      'bluetooth speaker',
      'laptop bag',
      'coffee beans',
      'phone charger'
    ];

    return suggestions.filter(s => 
      s.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }
}

export const productService = new ProductService(); 