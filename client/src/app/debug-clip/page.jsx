"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function DebugClipPage() {
  const [status, setStatus] = useState(null);
  const [allStatuses, setAllStatuses] = useState(null);

  const checkStatus = async () => {
    try {
      // Import the services dynamically
      const [clientClipService, ClipService] = await Promise.all([
        import('@/services/clientClipService'),
        import('@/services/clipService')
      ]);

      // Get current status
      const currentStatus = clientClipService.default.getStatus();
      const allModelStatuses = await ClipService.default.getAllModelStatuses();
      
      setStatus(currentStatus);
      setAllStatuses(allModelStatuses);
      
      console.log('📊 Client CLIP Status:', currentStatus);
      console.log('📊 All Model Statuses:', allModelStatuses);
      
    } catch (error) {
      console.error('❌ Error checking status:', error);
    }
  };

  const initializeModel = async () => {
    try {
      const clientClipService = (await import('@/services/clientClipService')).default;
      console.log('🚀 Initializing model...');
      
      const success = await clientClipService.initializeModel();
      console.log('📝 Initialization result:', success);
      
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('❌ Error initializing:', error);
    }
  };

  const loadEmbeddings = async () => {
    try {
      const [clientClipService, ProductService] = await Promise.all([
        import('@/services/clientClipService'),
        import('@/services/productService')
      ]);
      
      console.log('🖼️ Loading embeddings...');
      
      // Get some products
      const { products } = await ProductService.default.fetchProducts({ 
        page: 1, 
        per_page: 10,
        useClientCache: false 
      });
      
      console.log(`📦 Got ${products?.length || 0} products`);
      
      if (products && products.length > 0) {
        const success = await clientClipService.default.loadImageEmbeddings(products);
        console.log('📝 Embedding loading result:', success);
      }
      
      // Refresh status
      await checkStatus();
    } catch (error) {
      console.error('❌ Error loading embeddings:', error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">CLIP Debug Page</h1>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={checkStatus}>Refresh Status</Button>
          <Button onClick={initializeModel}>Initialize Model</Button>
          <Button onClick={loadEmbeddings}>Load Embeddings</Button>
        </div>
        
        {status && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Client CLIP Status:</h3>
            <pre className="text-sm text-blue-700 whitespace-pre-wrap">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        )}
        
        {allStatuses && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">All Model Statuses:</h3>
            <pre className="text-sm text-green-700 whitespace-pre-wrap">
              {JSON.stringify(allStatuses, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
