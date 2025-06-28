"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ClipService from '@/services/clipService';

export default function SimpleCLIPTest() {
  const [status, setStatus] = useState('checking');
  const [modelStatuses, setModelStatuses] = useState(null);
  const [initializeAttempted, setInitializeAttempted] = useState(false);

  const checkStatuses = async () => {
    try {
      const allStatuses = await ClipService.getAllModelStatuses();
      setModelStatuses(allStatuses);
      
      if (allStatuses['CLIENT-CLIP']) {
        setStatus(allStatuses['CLIENT-CLIP'].status);
      }
      
      console.log('📊 Model statuses:', allStatuses);
    } catch (error) {
      console.error('❌ Error checking statuses:', error);
      setStatus('error');
    }
  };

  const initializeModel = async () => {
    if (initializeAttempted) return;
    
    setInitializeAttempted(true);
    setStatus('loading');
    
    try {
      console.log('🚀 Initializing CLIENT-CLIP...');
      const success = await ClipService.initializeClientClip();
      
      if (success) {
        setStatus('healthy');
        console.log('✅ MODEL INITIALIZED SUCCESSFULLY!');
      } else {
        setStatus('error');
        console.log('❌ Model initialization failed');
      }
      
      // Refresh statuses after initialization
      await checkStatuses();
    } catch (error) {
      console.error('❌ Initialization error:', error);
      setStatus('error');
    }
  };

  useEffect(() => {
    checkStatuses();
    
    // Auto-initialize if not already done
    const timer = setTimeout(() => {
      if (status === 'error' && !initializeAttempted) {
        console.log('🔄 Auto-initializing CLIENT-CLIP...');
        initializeModel();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'loading': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'healthy': return '✅';
      case 'loading': return '⏳';
      case 'error': return '🔴';
      default: return '🔍';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Simple CLIENT-CLIP Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">CLIENT-CLIP Status:</h3>
          <div className={`text-lg ${getStatusColor()}`}>
            {getStatusIcon()} Status: {status}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={checkStatuses}>
            Refresh Status
          </Button>
          <Button 
            onClick={initializeModel} 
            disabled={status === 'loading' || status === 'healthy'}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {status === 'loading' ? 'Initializing...' : 'Initialize Model'}
          </Button>
        </div>
        
        {modelStatuses && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">All Model Statuses:</h3>
            <div className="space-y-2">
              {Object.entries(modelStatuses).map(([key, status]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="font-medium">{key}:</span>
                  <span className={`
                    ${status.status === 'healthy' ? 'text-green-600' : ''}
                    ${status.status === 'loading' ? 'text-blue-600' : ''}
                    ${status.status === 'error' ? 'text-red-600' : ''}
                  `}>
                    {status.status === 'healthy' ? '✅' : ''}
                    {status.status === 'loading' ? '⏳' : ''}
                    {status.status === 'error' ? '🔴' : ''}
                    {status.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-yellow-700">
            <li>The model should initialize automatically</li>
            <li>First load may take 1-2 minutes (downloading ~300MB)</li>
            <li>Subsequent loads should be much faster (cached)</li>
            <li>Navigate between pages to test persistence</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
