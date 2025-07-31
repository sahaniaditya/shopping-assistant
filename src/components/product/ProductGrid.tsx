'use client';

import React from 'react';
import { Product } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  compact?: boolean;
  maxItems?: number;
}

const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  loading = false,
  onAddToCart,
  onViewDetails,
  compact = false,
  maxItems
}) => {
  const displayProducts = maxItems ? products.slice(0, maxItems) : products;

  if (loading) {
    return (
      <div className={compact ? 'space-y-3' : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'}>
        {Array.from({ length: compact ? 3 : 8 }).map((_, index) => (
          <ProductSkeleton key={index} compact={compact} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
        <p className="text-gray-500">Try adjusting your search or filters to find what you&apos;re looking for.</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {displayProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
            compact={true}
          />
        ))}
        {maxItems && products.length > maxItems && (
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Showing {maxItems} of {products.length} products
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {displayProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onViewDetails={onViewDetails}
          compact={false}
        />
      ))}
      {maxItems && products.length > maxItems && (
        <div className="col-span-full text-center pt-4">
          <p className="text-sm text-gray-500">
            Showing {maxItems} of {products.length} products
          </p>
        </div>
      )}
    </div>
  );
};

// Skeleton loading component
const ProductSkeleton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="flex bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
        <div className="w-16 h-16 bg-gray-200 rounded-lg mr-3"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="flex justify-between items-center">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-6 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
      <div className="aspect-square bg-gray-200 rounded-t-lg"></div>
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded mb-2"></div>
        <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded mb-3 w-1/2"></div>
        <div className="h-6 bg-gray-200 rounded mb-3 w-1/3"></div>
        <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
        <div className="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
};

export default ProductGrid; 