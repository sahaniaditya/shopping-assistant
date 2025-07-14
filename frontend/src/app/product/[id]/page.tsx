'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  StarIcon,
  ShoppingCartIcon,
  TruckIcon,
  ShieldCheckIcon,
  ChevronLeftIcon,
  HeartIcon,
  ShareIcon,
  CheckCircleIcon,
  MapPinIcon,
  CreditCardIcon,
  XMarkIcon,
  ChevronRightIcon,
  LockClosedIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';
import { ProductResearchResult } from '@/services/deepResearchService';
import { Product } from '@/types/product';

interface CheckoutStep {
  id: string;
  title: string;
  status: 'pending' | 'current' | 'completed';
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethod: {
    type: 'upi' | 'card';
    upiId?: string;
    cardNumber?: string;
    cardHolderName?: string;
    expiryDate?: string;
  };
}

// Mock user data (as requested by user)
const mockUserData: UserData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  address: {
    street: '123 Main Street, Apt 4B',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States'
  },
  paymentMethod: {
    type: 'upi',
    upiId: 'john.doe@paytm'
  }
};

// Utility functions to handle different product types safely
const getProductTitle = (product: Product | ProductResearchResult): string => {
  if ('title' in product) {
    return product.title;
  }
  return product.name;
};

const getProductShipping = (product: Product | ProductResearchResult): { free: boolean; estimatedDays: number } => {
  if ('shipping' in product && typeof product.shipping === 'object' && product.shipping !== null) {
    return {
      free: product.shipping.free,
      estimatedDays: product.shipping.estimatedDays
    };
  }
  // For ProductResearchResult, shipping is a string, so we'll parse it or use defaults
  return {
    free: true, // Default assumption
    estimatedDays: 2 // Default delivery time
  };
};

const getProductInStock = (product: Product | ProductResearchResult): boolean => {
  if ('inStock' in product) {
    return product.inStock;
  }
  // For ProductResearchResult, assume in stock if not specified
  return true;
};

const getProductStockCount = (product: Product | ProductResearchResult): number | undefined => {
  if ('stockCount' in product) {
    return product.stockCount;
  }
  return undefined;
};

const getProductOriginalPrice = (product: Product | ProductResearchResult): number | undefined => {
  if ('originalPrice' in product) {
    return product.originalPrice;
  }
  return undefined;
};

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | ProductResearchResult | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(0);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [isProgressing, setIsProgressing] = useState(false);

  const checkoutSteps: CheckoutStep[] = [
    { id: 'review', title: 'Review Order', status: 'pending' },
    { id: 'shipping', title: 'Shipping Details', status: 'pending' },
    { id: 'payment', title: 'Payment Method', status: 'pending' },
    { id: 'confirmation', title: 'Confirmation', status: 'pending' }
  ];

  // Mock product data loading
  useEffect(() => {
    const loadProduct = async () => {
      try {
        // Get product data from localStorage or URL params
        const productData = localStorage.getItem('selectedProduct');
        if (productData) {
          const parsed = JSON.parse(productData);
          setProduct(parsed);
        } else {
          // Mock product for demonstration
          const mockProduct: Product = {
            id: params.id as string,
            title: 'Sample Product',
            price: 99.99,
            description: 'This is a sample product for demonstration purposes.',
            imageUrl: '/placeholder-product.jpg',
            images: ['/placeholder-product.jpg'],
            category: 'Electronics',
            brand: 'SampleBrand',
            rating: 4.5,
            reviewCount: 1250,
            inStock: true,
            stockCount: 15,
            features: ['Feature 1', 'Feature 2', 'Feature 3'],
            specifications: {
              'Weight': '2.5 lbs',
              'Dimensions': '10" x 8" x 2"',
              'Color': 'Black'
            },
            tags: ['popular', 'new'],
            seller: {
              id: 'seller_1',
              name: 'Walmart',
              rating: 4.8,
              reviewCount: 10000,
              verified: true
            },
            shipping: {
              free: true,
              estimatedDays: 2,
              fastDelivery: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
          };
          setProduct(mockProduct);
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [params.id]);

  // Auto-progress through checkout steps
  useEffect(() => {
    if (!showCheckout || orderPlaced) return;

    const progressToNextStep = () => {
      if (checkoutStep < checkoutSteps.length - 1) {
        setIsProgressing(true);
        setTimeout(() => {
          setCheckoutStep(checkoutStep + 1);
          setIsProgressing(false);
        }, 2000); // 2 second delay between steps
      }
    };

    // Auto-progress through first 3 steps
    if (checkoutStep < 3) {
      const timer = setTimeout(progressToNextStep, 3000); // 3 seconds on each step
      return () => clearTimeout(timer);
    }
  }, [showCheckout, checkoutStep, orderPlaced]);

  const handleCheckout = () => {
    setShowCheckout(true);
    setCheckoutStep(0);
    // Reset checkout state
    setPaymentConfirmed(false);
    setOrderPlaced(false);
    setIsProgressing(false);
  };

  const handleCancelCheckout = () => {
    setShowCheckout(false);
    setCheckoutStep(0);
    setPaymentConfirmed(false);
    setOrderPlaced(false);
    setIsProgressing(false);
  };

  const handlePaymentConfirmation = () => {
    setPaymentConfirmed(true);
    setTimeout(() => {
      setOrderPlaced(true);
      // Simulate order completion
      setTimeout(() => {
        setShowCheckout(false);
        router.push('/orders?success=true');
      }, 2000);
    }, 1500);
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
        stars.push(<StarIconSolid key={i} className="w-5 h-5 text-yellow-400" />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative w-5 h-5">
            <StarIcon className="w-5 h-5 text-gray-300 absolute" />
            <div className="overflow-hidden w-2.5">
              <StarIconSolid className="w-5 h-5 text-yellow-400 absolute" />
            </div>
          </div>
        );
      } else {
        stars.push(<StarIcon key={i} className="w-5 h-5 text-gray-300" />);
      }
    }
    return stars;
  };

  const renderCheckoutStep = () => {
    const currentStepData = checkoutSteps[checkoutStep];
    
    switch (currentStepData.id) {
      case 'review':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img 
                src={product?.imageUrl || '/placeholder-product.jpg'} 
                alt={product ? getProductTitle(product) : 'Product'} 
                className="w-20 h-20 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">{product ? getProductTitle(product) : 'Product'}</h3>
                <p className="text-gray-600">Qty: {quantity}</p>
                <p className="text-xl font-bold text-blue-600">{formatPrice((product?.price || 0) * quantity)}</p>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold">{formatPrice((product?.price || 0) * quantity)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Shipping:</span>
                <span className="font-semibold text-green-600">FREE</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Tax:</span>
                <span className="font-semibold">{formatPrice((product?.price || 0) * quantity * 0.08)}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice((product?.price || 0) * quantity * 1.08)}
                  </span>
                </div>
              </div>
            </div>
            
            {isProgressing && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-blue-700">Reviewing order details...</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'shipping':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <MapPinIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="font-semibold text-lg">Shipping Address</h3>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{mockUserData.name}</p>
                <p className="text-gray-600">{mockUserData.address.street}</p>
                <p className="text-gray-600">
                  {mockUserData.address.city}, {mockUserData.address.state} {mockUserData.address.zipCode}
                </p>
                <p className="text-gray-600">{mockUserData.address.country}</p>
                <p className="text-gray-600">{mockUserData.phone}</p>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TruckIcon className="w-6 h-6 text-green-600 mr-2" />
                <div>
                  <p className="font-semibold text-green-800">Free 2-Day Delivery</p>
                  <p className="text-sm text-green-600">Estimated delivery: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
            
            {isProgressing && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-blue-700">Verifying shipping details...</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'payment':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center mb-4">
                <CreditCardIcon className="w-6 h-6 text-blue-600 mr-2" />
                <h3 className="font-semibold text-lg">Payment Method</h3>
              </div>
              
              {mockUserData.paymentMethod.type === 'upi' ? (
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">UPI Payment</p>
                      <p className="text-gray-600">{mockUserData.paymentMethod.upiId}</p>
                    </div>
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Credit Card</p>
                      <p className="text-gray-600">**** **** **** {mockUserData.paymentMethod.cardNumber?.slice(-4)}</p>
                    </div>
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <p className="font-semibold text-blue-800">Secure Payment</p>
                  <p className="text-sm text-blue-600">Your payment information is encrypted and secure</p>
                </div>
              </div>
            </div>
            
            {isProgressing && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                  <span className="text-blue-700">Validating payment method...</span>
                </div>
              </div>
            )}
          </div>
        );

      case 'confirmation':
        if (orderPlaced) {
          return (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckIcon className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-800 mb-2">Order Placed Successfully!</h3>
                <p className="text-gray-600">Your order has been confirmed and will be delivered soon.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Order ID: <span className="font-mono font-semibold">#WMT-{Date.now().toString().slice(-6)}</span></p>
                <p className="text-sm text-gray-600 mt-1">Estimated delivery: {new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>
            </div>
          );
        }
        
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Complete Your Order</h3>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-blue-800">
                  You're about to place an order for <strong>{product ? getProductTitle(product) : 'Product'}</strong> for{' '}
                  <strong>{formatPrice((product?.price || 0) * quantity * 1.08)}</strong>
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Product:</span>
                  <span>{product ? getProductTitle(product) : 'Product'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{quantity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold">{formatPrice((product?.price || 0) * quantity * 1.08)}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center">
                <ShieldCheckIcon className="w-6 h-6 text-green-600 mr-2" />
                <div>
                  <p className="font-semibold text-green-800">Ready for Payment</p>
                  <p className="text-sm text-green-600">All details verified. Click below to complete your purchase.</p>
                </div>
              </div>
            </div>
            
            {!paymentConfirmed && (
              <div className="flex space-x-4">
                <Button
                  onClick={handlePaymentConfirmation}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold"
                >
                  <LockClosedIcon className="w-5 h-5 mr-2" />
                  Confirm & Pay Now
                </Button>
                <Button
                  onClick={handleCancelCheckout}
                  variant="outline"
                  className="px-6 py-4 text-red-600 border-red-300 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            )}
            
            {paymentConfirmed && (
              <div className="text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-blue-600 font-medium">Processing your payment...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Button onClick={() => router.push('/')}>Go Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Chat
              </Button>
              
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm">
                  <ShareIcon className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm">
                  <HeartIcon className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Product Image */}
            <div className="aspect-square bg-white rounded-lg shadow-sm overflow-hidden">
              <img
                src={product.imageUrl || '/placeholder-product.jpg'}
                alt={getProductTitle(product)}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{getProductTitle(product)}</h1>
                <p className="text-gray-600 mt-2">{product.description}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <div className="flex items-center">
                  {renderStars(product.rating)}
                </div>
                <span className="text-lg font-semibold">{product.rating}</span>
                <span className="text-gray-500">({product.reviewCount?.toLocaleString() || 0} reviews)</span>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <span className="text-4xl font-bold text-blue-600">{formatPrice(product.price)}</span>
                  {getProductOriginalPrice(product) && (
                    <span className="text-xl text-gray-400 line-through">{formatPrice(getProductOriginalPrice(product)!)}</span>
                  )}
                </div>
                {getProductShipping(product).free && (
                  <div className="flex items-center text-green-600">
                    <TruckIcon className="w-5 h-5 mr-2" />
                    <span className="font-medium">FREE 2-Day Delivery</span>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-black">Quantity:</label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center font-medium text-black">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    +
                  </Button>
                </div>
              </div>

              {/* Stock Status */}
              {getProductInStock(product) && (
                <div className="flex items-center text-green-600">
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  <span className="font-medium">In Stock</span>
                  {getProductStockCount(product) && getProductStockCount(product)! < 10 && (
                    <span className="text-orange-600 ml-2">
                      (Only {getProductStockCount(product)} left)
                    </span>
                  )}
                </div>
              )}

              {/* Checkout Button */}
              <Button
                onClick={handleCheckout}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-lg font-semibold"
                disabled={!getProductInStock(product)}
              >
                <ShoppingCartIcon className="w-6 h-6 mr-2" />
                {!getProductInStock(product) ? 'Out of Stock' : 'Checkout & Pay'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Dialog */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Checkout</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelCheckout}
              >
                <XMarkIcon className="w-6 h-6" />
              </Button>
            </div>

            {/* Progress Steps */}
            <div className="px-6 py-4 border-b">
              <div className="flex items-center justify-between">
                {checkoutSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      index < checkoutStep ? 'bg-green-600 text-white' :
                      index === checkoutStep ? 'bg-blue-600 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {index < checkoutStep ? (
                        <CheckIcon className="w-4 h-4" />
                      ) : (
                        <span className="text-sm font-medium">{index + 1}</span>
                      )}
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      index <= checkoutStep ? 'text-gray-900' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    {index < checkoutSteps.length - 1 && (
                      <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-4" />
                    )}
                  </div>
                ))}
              </div>
              
              {/* Progress indicator */}
              {isProgressing && (
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-600">Processing...</span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: `${((checkoutStep + 1) / checkoutSteps.length) * 100}%` }}></div>
                  </div>
                </div>
              )}
            </div>

            {/* Step Content */}
            <div className="p-6">
              {renderCheckoutStep()}
            </div>

            {/* Cancel Button - Only show if not completed and not on final step */}
            {!orderPlaced && checkoutStep < 3 && (
              <div className="px-6 py-4 border-t bg-gray-50">
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleCancelCheckout}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Cancel Order
                  </Button>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
                    Automatically proceeding to next step...
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
} 