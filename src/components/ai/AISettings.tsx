'use client';

import React, { useState, useEffect } from 'react';
import { 
  CogIcon, 
  KeyIcon, 
  CloudIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { aiService } from '@/services/aiService';
import { AIServiceConfig, LLMConfig } from '@/types/ai';
import Button from '@/components/ui/Button';

interface AISettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExtendedAIConfig extends AIServiceConfig {
  serpApiKey?: string;
  geminiApiKey?: string;
}

const AISettings: React.FC<AISettingsProps> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<ExtendedAIConfig>(aiService.getConfig());
  const [tempConfig, setTempConfig] = useState<ExtendedAIConfig>(config);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testingDeepResearch, setTestingDeepResearch] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [deepResearchStatus, setDeepResearchStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [showApiKeys, setShowApiKeys] = useState({
    llm: false,
    serp: false,
    gemini: false
  });

  useEffect(() => {
    if (isOpen) {
      const currentConfig = aiService.getConfig();
      const savedKeys = {
        serpApiKey: localStorage.getItem('walmart_serp_api_key') || '',
        geminiApiKey: localStorage.getItem('walmart_gemini_api_key') || ''
      };
      const extendedConfig = { ...currentConfig, ...savedKeys };
      setConfig(extendedConfig);
      setTempConfig(extendedConfig);
    }
  }, [isOpen]);

  const handleConfigChange = (field: keyof ExtendedAIConfig, value: string | number | boolean) => {
    setTempConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLLMConfigChange = (field: keyof LLMConfig, value: string | number | boolean) => {
    setTempConfig(prev => ({
      ...prev,
      llm: {
        ...prev.llm,
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    try {
      // Save AI config
      aiService.updateConfig(tempConfig);
      
      // Save Deep Research API keys
      if (tempConfig.serpApiKey) {
        localStorage.setItem('walmart_serp_api_key', tempConfig.serpApiKey);
      }
      if (tempConfig.geminiApiKey) {
        localStorage.setItem('walmart_gemini_api_key', tempConfig.geminiApiKey);
      }
      
      // Save to localStorage for persistence
      localStorage.setItem('walmart_ai_config', JSON.stringify(tempConfig));
      
      setConfig(tempConfig);
      setConnectionStatus('success');
      setTimeout(() => {
        setConnectionStatus('idle');
        onClose();
      }, 1000);
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save configuration');
    }
  };

  const handleReset = () => {
    setTempConfig(config);
    setConnectionStatus('idle');
    setDeepResearchStatus('idle');
    setErrorMessage('');
  };

  const testConnection = async () => {
    if (!tempConfig.llm.apiKey) {
      setConnectionStatus('error');
      setErrorMessage('Please enter an API key');
      return;
    }

    setTestingConnection(true);
    setConnectionStatus('idle');
    setErrorMessage('');

    try {
      // Create temporary AI service with test config
      const testService = new (await import('@/services/aiService')).AIService(tempConfig);
      
      // Test with a simple message
      const testContext = {
        userId: 'test',
        sessionId: 'test',
        messages: [],
        userPreferences: {
          preferredCategories: [],
          budgetRange: { min: 0, max: 1000 },
          brands: [],
          pricePreference: 'value' as const,
          deliveryPreference: 'standard' as const
        },
        searchHistory: [],
        cartSummary: {
          itemCount: 0,
          totalValue: 0,
          categories: []
        }
      };

      await testService.processMessage('Hello', testContext);
      
      setConnectionStatus('success');
      setErrorMessage('');
    } catch (error) {
      setConnectionStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Connection test failed');
    } finally {
      setTestingConnection(false);
    }
  };

  const testDeepResearch = async () => {
    if (!tempConfig.serpApiKey || !tempConfig.geminiApiKey) {
      setDeepResearchStatus('error');
      setErrorMessage('Please enter both SerpAPI and Gemini API keys');
      return;
    }

    setTestingDeepResearch(true);
    setDeepResearchStatus('idle');
    setErrorMessage('');

    try {
      // Import and test Deep Research service
      const { deepResearchService } = await import('@/services/deepResearchService');
      deepResearchService.setApiKeys(tempConfig.serpApiKey, tempConfig.geminiApiKey);
      
      // Test with a simple search
      await deepResearchService.conductDeepResearch('best coffee under 500');
      
      setDeepResearchStatus('success');
      setErrorMessage('');
    } catch (error) {
      setDeepResearchStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Deep Research test failed');
    } finally {
      setTestingDeepResearch(false);
    }
  };

  const getStatusIcon = (status: 'idle' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <CloudIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const toggleApiKeyVisibility = (key: keyof typeof showApiKeys) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CogIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">AI Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* LLM Configuration Section */}
          <div className="space-y-6">
            <div className="flex items-center mb-4">
              <SparklesIcon className="w-5 h-5 text-purple-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">LLM Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LLM Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <select
                  value={tempConfig.llm.provider}
                  onChange={(e) => handleLLMConfigChange('provider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="local">Local Model</option>
                </select>
              </div>

              {/* Model Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Model
                </label>
                <select
                  value={tempConfig.llm.model}
                  onChange={(e) => handleLLMConfigChange('model', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {tempConfig.llm.provider === 'openai' && (
                    <>
                      <option value="gpt-4o">GPT-4 Omni</option>
                      <option value="gpt-4o-mini">GPT-4 Omni Mini</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </>
                  )}
                  {tempConfig.llm.provider === 'anthropic' && (
                    <>
                      <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                      <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                    </>
                  )}
                  {tempConfig.llm.provider === 'local' && (
                    <>
                      <option value="llama2">Llama 2</option>
                      <option value="codellama">Code Llama</option>
                      <option value="mistral">Mistral</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <KeyIcon className="w-4 h-4 inline mr-1" />
                API Key
              </label>
              <div className="relative">
                <input
                  type={showApiKeys.llm ? 'text' : 'password'}
                  value={tempConfig.llm.apiKey}
                  onChange={(e) => handleLLMConfigChange('apiKey', e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggleApiKeyVisibility('llm')}
                  className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showApiKeys.llm ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                {getStatusIcon(connectionStatus)}
                <span className="ml-2 text-sm text-gray-700">
                  {connectionStatus === 'idle' && 'Ready to test'}
                  {connectionStatus === 'success' && 'LLM connection successful'}
                  {connectionStatus === 'error' && 'LLM connection failed'}
                </span>
              </div>
              <Button
                onClick={testConnection}
                disabled={testingConnection}
                loading={testingConnection}
                variant="ghost"
                size="sm"
              >
                Test LLM
              </Button>
            </div>
          </div>

          {/* Deep Research Configuration Section */}
          <div className="space-y-6 border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <MagnifyingGlassIcon className="w-5 h-5 text-green-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Deep Research Configuration</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* SerpAPI Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyIcon className="w-4 h-4 inline mr-1" />
                  SerpAPI Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.serp ? 'text' : 'password'}
                    value={tempConfig.serpApiKey || ''}
                    onChange={(e) => handleConfigChange('serpApiKey', e.target.value)}
                    placeholder="Enter your SerpAPI key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('serp')}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKeys.serp ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://serpapi.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">serpapi.com</a>
                </p>
              </div>

              {/* Gemini API Key */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <KeyIcon className="w-4 h-4 inline mr-1" />
                  Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.gemini ? 'text' : 'password'}
                    value={tempConfig.geminiApiKey || ''}
                    onChange={(e) => handleConfigChange('geminiApiKey', e.target.value)}
                    placeholder="Enter your Gemini API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('gemini')}
                    className="absolute right-2 top-2 p-1 text-gray-500 hover:text-gray-700"
                  >
                    {showApiKeys.gemini ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google AI Studio</a>
                </p>
              </div>
            </div>

            {/* Deep Research Status */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center">
                {getStatusIcon(deepResearchStatus)}
                <span className="ml-2 text-sm text-gray-700">
                  {deepResearchStatus === 'idle' && 'Ready to test Deep Research'}
                  {deepResearchStatus === 'success' && 'Deep Research working perfectly'}
                  {deepResearchStatus === 'error' && 'Deep Research test failed'}
                </span>
              </div>
              <Button
                onClick={testDeepResearch}
                disabled={testingDeepResearch}
                loading={testingDeepResearch}
                variant="ghost"
                size="sm"
              >
                Test Deep Research
              </Button>
            </div>
          </div>

          {/* Advanced Settings */}
          <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={tempConfig.llm.temperature}
                onChange={(e) => handleLLMConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1 text-center">
                {tempConfig.llm.temperature} (Lower = More Focused)
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="4000"
                value={tempConfig.llm.maxTokens}
                onChange={(e) => handleLLMConfigChange('maxTokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3 border-t border-gray-200 pt-6">
            <h3 className="text-sm font-medium text-gray-700">Features</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Enable Streaming</label>
                <input
                  type="checkbox"
                  checked={tempConfig.llm.streaming}
                  onChange={(e) => handleLLMConfigChange('streaming', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">Enable Fallback</label>
                <input
                  type="checkbox"
                  checked={tempConfig.fallbackEnabled}
                  onChange={(e) => handleConfigChange('fallbackEnabled', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-sm text-red-700">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-2">🚀 Deep Research Features</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Autonomous web search using SerpAPI</li>
              <li>• AI-powered sentiment analysis with Gemini</li>
              <li>• Real-time product research and comparison</li>
              <li>• Citation-rich responses with source links</li>
              <li>• Advanced ranking based on reviews and ratings</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <Button
              onClick={handleReset}
              variant="ghost"
              size="sm"
            >
              Reset
            </Button>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              variant="primary"
              size="sm"
            >
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISettings; 