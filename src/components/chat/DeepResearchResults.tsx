'use client';

import React, { useState } from 'react';
import { 
  MagnifyingGlassIcon,
  ClockIcon,
  StarIcon,
  LinkIcon,
  ChartBarIcon,
  ArrowTopRightOnSquareIcon,
  ShoppingCartIcon,
  EyeIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { ProductResearchResult, DeepResearchResponse } from '@/services/deepResearchService';
import Button from '@/components/ui/Button';

interface DeepResearchResultsProps {
  results: DeepResearchResponse;
  onAddToCart?: (product: ProductResearchResult) => void;
  onViewProduct?: (product: ProductResearchResult) => void;
  onCompareProducts?: (products: ProductResearchResult[]) => void;
}

const DeepResearchResults: React.FC<DeepResearchResultsProps> = ({
  results,
  onAddToCart,
  onViewProduct,
  onCompareProducts
}) => {
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showMethodology, setShowMethodology] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  const formatPrice = (price: number) => {
    if (price >= 1000000) {
      return `$${(price / 1000000).toFixed(1)}M`;
    } else if (price >= 1000) {
      return `$${(price / 1000).toFixed(1)}K`;
    } else {
      return `$${price.toFixed(0)}`;
    }
  };

  const formatProcessingTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(<StarIconSolid key={i} className="w-4 h-4 text-yellow-400" />);
    }
    
    if (hasHalfStar) {
      stars.push(<StarIcon key="half" className="w-4 h-4 text-yellow-400" />);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />);
    }
    
    return stars;
  };

  const getSentimentColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getSentimentLabel = (score: number) => {
    if (score >= 0.7) return 'Positive';
    if (score >= 0.5) return 'Neutral';
    return 'Negative';
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const toggleProductSelection = (productName: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productName)) {
      newSelected.delete(productName);
    } else {
      newSelected.add(productName);
    }
    setSelectedProducts(newSelected);
  };

  const handleCompareSelected = () => {
    const productsToCompare = results.products.filter(p => 
      selectedProducts.has(p.name)
    );
    onCompareProducts?.(productsToCompare);
  };

  const displayedProducts = showAllProducts ? results.products : results.products.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-3">
          <MagnifyingGlassIcon className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Deep Research Results</h3>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <ClockIcon className="w-4 h-4 mr-1" />
                {formatProcessingTime(results.totalProcessingTime)}
              </span>
              <span className="flex items-center">
                <ChartBarIcon className="w-4 h-4 mr-1" />
                {results.products.length} products analyzed
              </span>
              <span className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-1 text-green-500" />
                Live web data
              </span>
            </div>
          </div>
        </div>
        
        {selectedProducts.size > 1 && (
          <Button
            onClick={handleCompareSelected}
            variant="primary"
            size="sm"
            className="flex items-center"
          >
            <ChartBarIcon className="w-4 h-4 mr-2" />
            Compare Selected ({selectedProducts.size})
          </Button>
        )}
      </div>

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayedProducts.map((product, index) => (
          <div key={`${product.name}-${index}`} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
            {/* Product Header with Image */}
            <div className="flex items-start space-x-3 mb-3">
              {/* Product Image */}
              <div className="w-16 h-16 flex-shrink-0">
                <div className="w-full h-full bg-gray-100 rounded-lg overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gray-200 flex items-center justify-center text-xs text-gray-400 ${product.imageUrl ? 'hidden' : ''}`}>
                    No Image
                  </div>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm leading-tight mb-1">
                      {product.name}
                    </h4>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span className="flex items-center">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
                        #{index + 1}
                      </span>
                      <span>•</span>
                      <span>{product.source}</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedProducts.has(product.name)}
                    onChange={() => toggleProductSelection(product.name)}
                    className="ml-2 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Price and Rating */}
            <div className="flex items-center justify-between mb-3">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(product.price)}
              </div>
              <div className="flex items-center space-x-1">
                {renderStars(product.rating)}
                <span className="text-sm text-gray-600 ml-1">
                  {product.rating.toFixed(1)}
                </span>
              </div>
            </div>

            {/* Sentiment and Score */}
            <div className="flex items-center justify-between mb-3">
              <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSentimentColor(product.sentimentScore)}`}>
                {getSentimentLabel(product.sentimentScore)} ({(product.sentimentScore * 100).toFixed(0)}%)
              </div>
              <div className={`text-sm font-medium ${getScoreColor(product.overallScore)}`}>
                Score: {(product.overallScore * 100).toFixed(0)}%
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-3 line-clamp-3">
              {product.description}
            </p>

            {/* Actions */}
            <div className="flex items-center space-x-2 mb-3">
              <Button
                onClick={() => onViewProduct?.(product)}
                variant="ghost"
                size="sm"
                className="flex-1 text-xs"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                View Details
              </Button>
              <Button
                onClick={() => onAddToCart?.(product)}
                variant="primary"
                size="sm"
                className="flex-1 text-xs"
              >
                <ShoppingCartIcon className="w-4 h-4 mr-1" />
                Add to Cart
              </Button>
            </div>

            {/* Source Link */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <a
                href={product.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-xs text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="w-3 h-3 mr-1" />
                View on {product.source}
              </a>
              <div className="text-xs text-gray-500">
                {product.reviews.length} reviews
              </div>
            </div>

            {/* Expandable Reviews */}
            {product.reviews.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setExpandedProduct(
                    expandedProduct === `${product.name}-${index}` ? null : `${product.name}-${index}`
                  )}
                  className="flex items-center text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  {expandedProduct === `${product.name}-${index}` ? (
                    <ChevronUpIcon className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4 mr-1" />
                  )}
                  View Reviews
                </button>
                
                {expandedProduct === `${product.name}-${index}` && (
                  <div className="mt-2 space-y-2">
                    {product.reviews.map((review, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                          </div>
                          <span className={`px-1 py-0.5 rounded text-xs border ${getSentimentColor(review.confidence)}`}>
                            {review.sentiment}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {results.products.length > 6 && (
        <div className="text-center">
          <Button
            onClick={() => setShowAllProducts(!showAllProducts)}
            variant="ghost"
            size="sm"
            className="flex items-center mx-auto"
          >
            {showAllProducts ? (
              <>
                <ChevronUpIcon className="w-4 h-4 mr-2" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDownIcon className="w-4 h-4 mr-2" />
                Show All {results.products.length} Products
              </>
            )}
          </Button>
        </div>
      )}

      {/* Methodology */}
      <div className="bg-gray-50 rounded-lg border border-gray-200">
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-2">
            <ChartBarIcon className="w-5 h-5 text-gray-600" />
            <span className="font-medium text-gray-900">Research Methodology</span>
          </div>
          {showMethodology ? (
            <ChevronUpIcon className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDownIcon className="w-5 h-5 text-gray-600" />
          )}
        </button>
        
        {showMethodology && (
          <div className="px-4 pb-4 border-t border-gray-200">
            <div className="pt-4 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Process:</strong> {results.methodology}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong className="text-gray-900">Ranking Algorithm:</strong>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    <li>• Product rating (40%)</li>
                    <li>• Sentiment analysis (30%)</li>
                    <li>• Price competitiveness (30%)</li>
                  </ul>
                </div>
                
                <div>
                  <strong className="text-gray-900">Data Sources:</strong>
                  <ul className="mt-1 space-y-1 text-gray-600">
                    {Array.from(new Set(results.products.map(p => p.source))).slice(0, 6).map(source => (
                      <li key={source}>• {source}</li>
                    ))}
                    {Array.from(new Set(results.products.map(p => p.source))).length > 6 && (
                      <li>• And {Array.from(new Set(results.products.map(p => p.source))).length - 6} more sources</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200">
                <strong className="text-gray-900">Real-time Research:</strong>
                <p className="text-gray-600 text-sm mt-1">
                  This analysis was conducted in real-time using live web data from SerpAPI. 
                  Results include current pricing, ratings, and reviews from across the web.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Citations */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <div className="flex items-center mb-3">
          <LinkIcon className="w-5 h-5 text-blue-600 mr-2" />
          <h4 className="font-medium text-blue-900">Sources & Citations</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {results.citations.slice(0, 8).map((citation, index) => (
            <a
              key={index}
              href={citation}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center text-sm text-blue-700 hover:text-blue-900 hover:underline"
            >
              <span className="w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium text-blue-800 mr-2">
                {index + 1}
              </span>
              <span className="truncate">{new URL(citation).hostname}</span>
              <ArrowTopRightOnSquareIcon className="w-3 h-3 ml-1 flex-shrink-0" />
            </a>
          ))}
        </div>
        
        {results.citations.length > 8 && (
          <div className="mt-2 text-sm text-blue-600">
            +{results.citations.length - 8} more sources
          </div>
        )}
      </div>
    </div>
  );
};

export default DeepResearchResults; 