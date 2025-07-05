'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';

interface ApiStatus {
  status: string;
  message: string;
}

interface UseApiStatusReturn {
  apiStatus: ApiStatus | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useApiStatus = (): UseApiStatusReturn => {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkApiStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.healthCheck();
      // Type assertion for the response data
      const statusData = response.data as ApiStatus;
      setApiStatus(statusData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to backend';
      setError(errorMessage);
      setApiStatus({ status: 'error', message: 'Backend not connected' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
    
    // Set up interval to check API status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    apiStatus,
    loading,
    error,
    refetch: checkApiStatus,
  };
}; 