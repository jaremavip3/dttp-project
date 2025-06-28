"use client";

import { useEffect, useState } from "react";
import ClipService from "@/services/clipService";
import ProductService from "@/services/productService";

/**
 * Component to initialize client-side CLIP model on app startup
 * Shows loading progress and handles errors gracefully
 * Also preloads image embeddings for better search performance
 */
export default function ClientClipInitializer() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [showInitializer, setShowInitializer] = useState(false);
  const [initStage, setInitStage] = useState('checking'); // checking, model, images, complete

  useEffect(() => {
    // Always try to initialize client-side CLIP with image embeddings
    const initializeIfNeeded = async () => {
      const isAvailable = ClipService.isClientClipAvailable();
      console.log('🔍 CLIENT-CLIP availability check:', isAvailable);
      
      if (!isAvailable) {
        setShowInitializer(true);
        setIsInitializing(true);
        
        try {
          console.log('🚀 Starting client-side CLIP initialization...');
          setInitStage('model');
          
          const success = await ClipService.initializeClientClip();
          console.log('📝 CLIENT-CLIP initialization result:', success);
          
          if (success) {
            console.log('✅ Client-side CLIP model loaded successfully');
            
            // Now load some products to pre-compute image embeddings
            setInitStage('images');
            console.log('🖼️ Loading products for image embedding pre-computation...');
            
            try {
              // Load a small batch of products for embedding
              const { products } = await ProductService.fetchProducts({ 
                page: 1, 
                per_page: 20, // Start with a small batch
                useClientCache: false 
              });
              
              if (products && products.length > 0) {
                console.log(`📦 Pre-computing embeddings for ${products.length} products...`);
                const clientClipService = await import('@/services/clientClipService');
                await clientClipService.default.loadImageEmbeddings(products);
                console.log('✅ Image embeddings preloaded successfully');
              }
            } catch (embeddingError) {
              console.warn('⚠️ Failed to preload image embeddings:', embeddingError);
              // Don't fail the whole initialization for this
            }
            
            setInitStage('complete');
            console.log('✅ Client-side CLIP fully initialized with image embeddings');
            
            // Hide the initializer after showing success
            setTimeout(() => setShowInitializer(false), 3000);
          } else {
            setInitializationError('Failed to initialize client-side CLIP model');
          }
        } catch (error) {
          console.error('❌ Client-side CLIP initialization failed:', error);
          setInitializationError(error.message);
        } finally {
          setIsInitializing(false);
        }
      } else {
        console.log('✅ CLIENT-CLIP already available');
        // Even if available, try to load some embeddings if not already done
        try {
          const clientClipService = await import('@/services/clientClipService');
          const status = clientClipService.default.getStatus();
          
          if (status.embeddingsCount === 0) {
            console.log('🖼️ Loading image embeddings for available CLIP model...');
            const { products } = await ProductService.fetchProducts({ 
              page: 1, 
              per_page: 20,
              useClientCache: false 
            });
            
            if (products && products.length > 0) {
              await clientClipService.default.loadImageEmbeddings(products);
              console.log('✅ Image embeddings loaded for existing model');
            }
          }
        } catch (error) {
          console.warn('⚠️ Failed to load embeddings for existing model:', error);
        }
      }
    };

    // Start initialization after a short delay to not block initial render
    const timer = setTimeout(initializeIfNeeded, 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!showInitializer) return null;

  const getStageText = () => {
    switch (initStage) {
      case 'checking':
        return { title: '🔍 Checking AI Model', description: 'Verifying CLIP availability...' };
      case 'model':
        return { title: '🤖 Loading AI Model', description: 'Downloading CLIP-Base model (~300MB)' };
      case 'images':
        return { title: '🖼️ Processing Images', description: 'Computing image embeddings for search...' };
      case 'complete':
        return { title: '✅ AI Model Ready', description: 'Cross-modal search fully initialized' };
      default:
        return { title: '🤖 Loading AI Model', description: 'Initializing...' };
    }
  };

  const stageText = getStageText();

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
        {isInitializing ? (
          <div className="flex items-start space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
            <div>
              <h4 className="font-medium text-gray-900 text-sm">
                {stageText.title}
              </h4>
              <p className="text-gray-600 text-xs mt-1">
                {stageText.description}
              </p>
              <p className="text-blue-600 text-xs mt-1">
                This enables semantic image search with larger model
              </p>
              {initStage === 'images' && (
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : initializationError ? (
          <div className="flex items-start space-x-3">
            <div className="text-red-500 text-lg">⚠️</div>
            <div>
              <h4 className="font-medium text-red-900 text-sm">
                AI Model Error
              </h4>
              <p className="text-red-700 text-xs mt-1">
                {initializationError}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                Server-side search is still available
              </p>
              <button
                onClick={() => setShowInitializer(false)}
                className="text-xs text-red-600 hover:text-red-800 mt-1 underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start space-x-3">
            <div className="text-green-500 text-lg">✅</div>
            <div>
              <h4 className="font-medium text-green-900 text-sm">
                AI Model Ready
              </h4>
              <p className="text-green-700 text-xs mt-1">
                CLIP-Large loaded with image embeddings
              </p>
              <p className="text-gray-600 text-xs mt-1">
                True cross-modal search is now available
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
