'use client';

import React, { useState } from 'react';
import { 
  StarIcon, 
  HeartIcon, 
  ShoppingCartIcon,
  TruckIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Product } from '@/types/product';
import Button from '@/components/ui/Button';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  compact?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onAddToCart, 
  onViewDetails,
  compact = false 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToCart?.(product);
  };

  const handleViewDetails = () => {
    onViewDetails?.(product);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-4 h-4">
            <StarIcon className="w-4 h-4 text-gray-300 absolute" />
            <div className="overflow-hidden w-2">
              <StarIconSolid className="w-4 h-4 text-yellow-400 absolute" />
            </div>
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="w-4 h-4 text-gray-300" />
        );
      }
    }
    return stars;
  };

  if (compact) {
    return (
      <div className="flex bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-3 cursor-pointer"
           onClick={handleViewDetails}>
        {/* Image */}
        <div className="w-16 h-16 flex-shrink-0 mr-3">
          <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
            {!imageError ? (
              <img
                src={product.imageUrl}
                alt={product.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400 text-xs">No image</span>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {product.title}
          </h3>
          <div className="flex items-center mt-1">
            <div className="flex items-center">
              {renderStars(product.rating)}
            </div>
            <span className="ml-2 text-xs text-gray-500">
              ({product.reviewCount.toLocaleString()})
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-blue-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              className="text-xs px-2 py-1"
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 group cursor-pointer"
         onClick={handleViewDetails}>
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden rounded-t-lg">
        {!imageError ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <span className="text-gray-400">No image available</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {product.discount && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              -{product.discount}%
            </span>
          )}
          {product.shipping.free && (
            <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
              Free Shipping
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
          <HeartIcon className="w-4 h-4 text-gray-600 hover:text-red-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Brand */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blue-600 font-medium">
            {product.brand}
          </span>
          {product.seller.verified && (
            <CheckBadgeIcon className="w-4 h-4 text-blue-500" />
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2 leading-tight">
          {product.title}
        </h3>

        {/* Rating and Reviews */}
        <div className="flex items-center mb-3">
          <div className="flex items-center">
            {renderStars(product.rating)}
          </div>
          <span className="ml-2 text-sm text-gray-600">
            {product.rating}
          </span>
          <span className="ml-1 text-sm text-gray-400">
            ({product.reviewCount.toLocaleString()})
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>

        {/* Shipping Info */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <TruckIcon className="w-4 h-4 mr-1" />
          <span>
            {product.shipping.free 
              ? 'Free shipping' 
              : `$${product.shipping.cost} shipping`}
            {product.shipping.fastDelivery && ' • Fast delivery'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleAddToCart}
            className="flex-1 text-sm"
            disabled={!product.inStock}
          >
            <ShoppingCartIcon className="w-4 h-4 mr-1" />
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </Button>
        </div>

        {/* Stock Status */}
        {product.inStock && product.stockCount < 10 && (
          <p className="text-xs text-orange-600 mt-2">
            Only {product.stockCount} left in stock
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard; 