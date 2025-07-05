'use client';

import React, { useState } from 'react';
import { 
  ShoppingBagIcon, 
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Product, ProductSearchResult } from '@/types/product';
import ProductGrid from '@/components/product/ProductGrid';
import Button from '@/components/ui/Button';

interface ProductMessageProps {
  searchResult: ProductSearchResult;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  onViewMore?: () => void;
}

const ProductMessage: React.FC<ProductMessageProps> = ({
  searchResult,
  onAddToCart,
  onViewDetails,
  onViewMore
}) => {
  const [showAll, setShowAll] = useState(false);
  const { products, total, query } = searchResult;
  
  const displayProducts = showAll ? products : products.slice(0, 3);
  const hasMore = products.length > 3;

  if (products.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <ShoppingBagIcon className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-sm font-medium text-gray-700">Product Search Results</span>
        </div>
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <ShoppingBagIcon className="mx-auto h-8 w-8" />
          </div>
          <p className="text-sm text-gray-600">
            No products found for &quot;{query.query}&quot;
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Try different keywords or check the spelling
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShoppingBagIcon className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900">
                Product Search Results
              </h3>
              <p className="text-xs text-blue-700">
                Found {total.toLocaleString()} products for &quot;{query.query}&quot;
              </p>
            </div>
          </div>
          
          {/* Filters indicator */}
          {(query.category || query.minPrice || query.maxPrice || query.brand) && (
            <div className="flex items-center text-xs text-blue-600">
              <AdjustmentsHorizontalIcon className="w-4 h-4 mr-1" />
              <span>Filtered</span>
            </div>
          )}
        </div>

        {/* Active filters */}
        {(query.category || query.minPrice || query.maxPrice || query.brand) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {query.category && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {query.category}
              </span>
            )}
            {query.brand && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {query.brand}
              </span>
            )}
            {(query.minPrice || query.maxPrice) && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                {query.minPrice && query.maxPrice 
                  ? `$${query.minPrice} - $${query.maxPrice}`
                  : query.minPrice 
                  ? `$${query.minPrice}+`
                  : `Under $${query.maxPrice}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Products */}
      <div className="p-4">
        <ProductGrid
          products={displayProducts}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
          compact={true}
        />

        {/* Show more/less button */}
        {hasMore && (
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-blue-600 hover:bg-blue-50"
            >
              {showAll ? (
                <>
                  <ChevronUpIcon className="w-4 h-4 mr-1" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4 mr-1" />
                  Show {products.length - 3} More Products
                </>
              )}
            </Button>
          </div>
        )}

        {/* View all results button */}
        {total > products.length && onViewMore && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="primary"
              size="sm"
              onClick={onViewMore}
              className="w-full"
            >
              View All {total.toLocaleString()} Results
            </Button>
          </div>
        )}
      </div>

      {/* Footer with search summary */}
      <div className="bg-gray-50 border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>
            Showing {displayProducts.length} of {products.length} products
          </span>
          {query.sortBy && query.sortBy !== 'relevance' && (
            <span className="capitalize">
              Sorted by {query.sortBy.replace('_', ' ')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductMessage; 