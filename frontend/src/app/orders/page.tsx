'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CheckCircleIcon,
  TruckIcon,
  ClockIcon,
  StarIcon,
  ChevronLeftIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import Button from '@/components/ui/Button';

interface Order {
  id: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
  totalAmount: number;
  status: 'ordered' | 'processing' | 'shipped' | 'delivered';
  estimatedDelivery: Date;
  orderDate: Date;
  trackingNumber?: string;
}

// Mock orders data
const mockOrders: Order[] = [
  {
    id: 'WMT-123456',
    productName: 'Samsung Galaxy S23 Ultra',
    productImage: '/placeholder-product.jpg',
    quantity: 1,
    price: 1199.99,
    totalAmount: 1295.99,
    status: 'delivered',
    estimatedDelivery: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    trackingNumber: 'TRK123456789'
  },
  {
    id: 'WMT-123457',
    productName: 'Apple MacBook Pro 14-inch',
    productImage: '/placeholder-product.jpg',
    quantity: 1,
    price: 1999.99,
    totalAmount: 2159.99,
    status: 'shipped',
    estimatedDelivery: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
    orderDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    trackingNumber: 'TRK123456790'
  }
];

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [newOrder, setNewOrder] = useState<Order | null>(null);

  useEffect(() => {
    // Check if this is a successful order completion
    const success = searchParams.get('success');
    if (success === 'true') {
      setShowSuccessMessage(true);
      
      // Create a new order from the recent product
      const recentProduct = localStorage.getItem('selectedProduct');
      if (recentProduct) {
        const product = JSON.parse(recentProduct);
        const order: Order = {
          id: `WMT-${Date.now().toString().slice(-6)}`,
          productName: product.title || product.name,
          productImage: product.imageUrl || '/placeholder-product.jpg',
          quantity: 1,
          price: product.price,
          totalAmount: product.price * 1.08, // Including tax
          status: 'ordered',
          estimatedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          orderDate: new Date(),
          trackingNumber: `TRK${Date.now().toString().slice(-9)}`
        };
        setNewOrder(order);
        
        // Add to orders list
        setOrders([order, ...mockOrders]);
      }
    } else {
      setOrders(mockOrders);
    }
  }, [searchParams]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ordered':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'shipped':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ordered':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5" />;
      case 'shipped':
        return <TruckIcon className="w-5 h-5" />;
      case 'delivered':
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <ClockIcon className="w-5 h-5" />;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {showSuccessMessage && newOrder && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-800">
                  Order Placed Successfully!
                </h3>
                <p className="text-green-600 mt-1">
                  Your order for <strong>{newOrder.productName}</strong> has been confirmed.
                </p>
                <div className="mt-4 flex items-center space-x-4">
                  <div className="text-sm text-green-700">
                    <strong>Order ID:</strong> {newOrder.id}
                  </div>
                  <div className="text-sm text-green-700">
                    <strong>Estimated Delivery:</strong> {formatDate(newOrder.estimatedDelivery)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
              <p className="text-gray-600 mb-6">You haven't placed any orders yet.</p>
              <Button
                onClick={() => router.push('/')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Shopping
              </Button>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">Order {order.id}</h3>
                        <p className="text-sm text-gray-600">
                          Placed on {formatDate(order.orderDate)}
                        </p>
                      </div>
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      <p className="text-sm text-gray-600">Total</p>
                    </div>
                  </div>
                </div>

                {/* Order Content */}
                <div className="p-6">
                  <div className="flex items-center space-x-4">
                    <img
                      src={order.productImage}
                      alt={order.productName}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{order.productName}</h4>
                      <p className="text-sm text-gray-600">Quantity: {order.quantity}</p>
                      <p className="text-sm text-gray-600">Price: {formatPrice(order.price)}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <TruckIcon className="w-4 h-4 mr-1" />
                        Estimated delivery: {formatDate(order.estimatedDelivery)}
                      </div>
                      {order.trackingNumber && (
                        <div className="flex items-center text-sm text-gray-600">
                          <ShieldCheckIcon className="w-4 h-4 mr-1" />
                          Tracking: {order.trackingNumber}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="mt-6 flex items-center justify-between">
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        Track Order
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          <StarIcon className="w-4 h-4 mr-1" />
                          Rate Product
                        </Button>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                      {order.status === 'delivered' && (
                        <Button variant="outline" size="sm">
                          Buy Again
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Delivery Progress */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          ['ordered', 'processing', 'shipped', 'delivered'].includes(order.status)
                            ? 'bg-blue-600'
                            : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">Ordered</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          ['processing', 'shipped', 'delivered'].includes(order.status)
                            ? 'bg-yellow-600'
                            : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">Processing</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          ['shipped', 'delivered'].includes(order.status)
                            ? 'bg-purple-600'
                            : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">Shipped</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          order.status === 'delivered'
                            ? 'bg-green-600'
                            : 'bg-gray-300'
                        }`} />
                        <span className="text-sm font-medium text-gray-900">Delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        {orders.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {orders.length}
                </div>
                <div className="text-sm text-gray-600">Total Orders</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(orders.reduce((sum, order) => sum + order.totalAmount, 0))}
                </div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {orders.filter(order => order.status === 'delivered').length}
                </div>
                <div className="text-sm text-gray-600">Delivered</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
} 