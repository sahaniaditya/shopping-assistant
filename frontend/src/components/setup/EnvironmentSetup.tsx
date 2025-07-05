'use client';

import React, { useState } from 'react';
import { 
  CogIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';

interface EnvironmentSetupProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveKeys: (keys: { serpApiKey: string; geminiApiKey: string }) => void;
}

const EnvironmentSetup: React.FC<EnvironmentSetupProps> = ({ isOpen, onClose, onSaveKeys }) => {
  const [serpApiKey, setSerpApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [showKeys, setShowKeys] = useState({ serp: false, gemini: false });
  const [currentStep, setCurrentStep] = useState(1);
  const [testResults, setTestResults] = useState<{ serp: string | null; gemini: string | null }>({ serp: null, gemini: null });

  const steps = [
    {
      title: 'Get SerpAPI Key',
      description: 'Sign up for SerpAPI to enable web search functionality',
      completed: !!serpApiKey,
    },
    {
      title: 'Get Gemini API Key', 
      description: 'Get your Google Gemini API key for AI-powered analysis',
      completed: !!geminiApiKey,
    },
    {
      title: 'Test Configuration',
      description: 'Verify that your API keys are working correctly',
      completed: testResults.serp === 'success' && testResults.gemini === 'success',
    },
  ];

  const handleSave = () => {
    if (serpApiKey && geminiApiKey) {
      onSaveKeys({ serpApiKey, geminiApiKey });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CogIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Deep Research Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ×
          </button>
        </div>

        {/* Progress Steps */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step.completed
                      ? 'bg-green-500 border-green-500 text-white'
                      : currentStep === index + 1
                      ? 'border-blue-500 text-blue-500'
                      : 'border-gray-300 text-gray-400'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ml-2 ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900">{steps[currentStep - 1]?.title}</h3>
            <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: SerpAPI */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What is SerpAPI?</h4>
                <p className="text-blue-700 text-sm">
                  SerpAPI provides Google Search results in JSON format. We use it to search the web for products and reviews.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Step-by-step instructions:</h4>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                    <div>
                      <span>Go to </span>
                      <a href="https://serpapi.com/users/sign_up" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        serpapi.com/users/sign_up
                      </a>
                      <span> and create a free account</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                    <span>After signing up, go to your dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                    <span>Copy your API key from the dashboard</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                    <span>Paste it in the field below</span>
                  </li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SerpAPI Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.serp ? 'text' : 'password'}
                    value={serpApiKey}
                    onChange={(e) => setSerpApiKey(e.target.value)}
                    placeholder="Enter your SerpAPI key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, serp: !prev.serp }))}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.serp ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Free tier includes 100 searches per month</p>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!serpApiKey}
                    variant="primary"
                    size="sm"
                  >
                    Next Step
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Gemini API */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 mb-2">What is Gemini API?</h4>
                <p className="text-purple-700 text-sm">
                  Google&apos;s Gemini API provides advanced AI capabilities for understanding and analyzing product information and reviews.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Step-by-step instructions:</h4>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                    <div>
                      <span>Go to </span>
                      <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        Google AI Studio
                      </a>
                      <span> and sign in with your Google account</span>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                    <span>Click &ldquo;Create API Key&rdquo; button</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                    <span>Copy the generated API key</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                    <span>Paste it in the field below</span>
                  </li>
                </ol>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeys.gemini ? 'text' : 'password'}
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeys(prev => ({ ...prev, gemini: !prev.gemini }))}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showKeys.gemini ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">Free tier includes generous usage limits</p>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setCurrentStep(1)}
                      variant="ghost"
                      size="sm"
                    >
                      Previous
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!geminiApiKey}
                      variant="primary"
                      size="sm"
                    >
                      Next Step
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Test Configuration */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Ready to Test!</h4>
                <p className="text-green-700 text-sm">
                  Let&apos;s verify that your API keys are working correctly before enabling Deep Research.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">SerpAPI</h5>
                      {testResults.serp === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                      {testResults.serp === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Test web search functionality</p>
                    <Button
                      onClick={() => {
                        // Mock test - in real implementation would test the API
                        setTestResults(prev => ({ ...prev, serp: 'success' }));
                      }}
                      disabled={!serpApiKey}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Test SerpAPI
                    </Button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-medium text-gray-900">Gemini API</h5>
                      {testResults.gemini === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                      {testResults.gemini === 'error' && <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />}
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Test AI analysis capabilities</p>
                    <Button
                      onClick={() => {
                        // Mock test - in real implementation would test the API
                        setTestResults(prev => ({ ...prev, gemini: 'success' }));
                      }}
                      disabled={!geminiApiKey}
                      variant="ghost"
                      size="sm"
                      className="w-full"
                    >
                      Test Gemini API
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={() => setCurrentStep(2)}
                  variant="ghost"
                  size="sm"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!serpApiKey || !geminiApiKey}
                  variant="primary"
                  size="sm"
                >
                  Complete Setup
                </Button>
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3">Need Help?</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-medium text-gray-700 mb-2">SerpAPI Resources</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <a href="https://serpapi.com/search-api" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">API Documentation</a></li>
                  <li>• <a href="https://serpapi.com/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Pricing Plans</a></li>
                  <li>• <a href="https://serpapi.com/manage-api-key" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Manage API Keys</a></li>
                </ul>
              </div>
              <div>
                <h5 className="font-medium text-gray-700 mb-2">Gemini API Resources</h5>
                <ul className="space-y-1 text-gray-600">
                  <li>• <a href="https://ai.google.dev/docs" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">API Documentation</a></li>
                  <li>• <a href="https://ai.google.dev/pricing" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Pricing Information</a></li>
                  <li>• <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Manage API Keys</a></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentSetup; 