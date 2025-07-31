'use client';

import { CubeIcon, TruckIcon, SparklesIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import Header from '@/components/ui/Header';
import { useApiStatus } from '@/hooks/useApiStatus';
import Link from 'next/link';
import { ApiStatus } from '@/types/api';

// Force dynamic rendering to prevent pre-rendering issues with localStorage
export const dynamic = 'force-dynamic';

export default function Home() {
  const { apiStatus: apiStatusObj, loading } = useApiStatus();
  
  // Convert the object status to the string status expected by Header
  const apiStatus: ApiStatus = apiStatusObj?.status === 'error' ? 'disconnected' :
                              apiStatusObj?.status === 'healthy' ? 'connected' :
                              apiStatusObj ? 'connecting' : 'unknown';

  return (
    <div className="min-h-screen bg-white">
      <Header apiStatus={apiStatus} />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Shop with Your Voice
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-blue-100">
            Just say &quot;buy me a coffee&quot; and our AI will find the perfect products for you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/chat">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
                <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
                Start Shopping Now
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-6 text-blue-200">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span>Voice Enabled</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span>AI Powered</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded-full mr-2"></div>
              <span>Instant Checkout</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Shopping has never been this easy. Just talk to our AI assistant.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">1. Say What You Want</h4>
              <p className="text-gray-600">&quot;Buy me a coffee&quot; or &quot;Find headphones under $100&quot; - just speak naturally</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">2. AI Finds Best Options</h4>
              <p className="text-gray-600">Our AI searches for products based on ratings, reviews, and your preferences</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">3. Quick Checkout</h4>
              <p className="text-gray-600">Confirm your choice and we&apos;ll handle the rest - payment and delivery</p>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <Link href="/chat">
              <Button variant="primary" size="lg">
                Try It Now - It&apos;s Free!
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our AI Shopping Assistant?
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the future of retail with our cutting-edge conversational AI
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <TruckIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Fast Delivery</h4>
              <p className="text-gray-600">Get your items delivered quickly with our advanced logistics network</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CubeIcon className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Smart Recommendations</h4>
              <p className="text-gray-600">AI analyzes reviews, ratings, and your history to find perfect matches</p>
            </div>
            
            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SparklesIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Natural Conversation</h4>
              <p className="text-gray-600">Talk to our AI just like you would to a friend - no complex commands</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-blue-200">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1B+</div>
              <div className="text-blue-200">Products</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-200">AI Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-blue-200">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h5 className="text-lg font-semibold mb-4">Walmart 2025</h5>
              <p className="text-gray-400">Your AI-powered shopping companion for the future.</p>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">Quick Links</h5>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/chat" className="hover:text-white">Start Shopping</Link></li>
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Returns</a></li>
                <li><a href="#" className="hover:text-white">Shipping</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-lg font-semibold mb-4">API Status</h5>
              <div className="text-gray-400">
                <p>Backend: {loading ? 'Checking...' : apiStatusObj?.status || 'Unknown'}</p>
                <p className="text-sm mt-1">{loading ? 'Loading...' : apiStatusObj?.message || 'No status available'}</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Walmart. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
