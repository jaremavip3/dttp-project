"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ModelTestPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testModel = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing CLIP model loading...');
      
      // Import the model libraries
      const { CLIPTextModelWithProjection, AutoTokenizer } = await import('@huggingface/transformers');
      
      console.log('📝 Loading tokenizer...');
      const tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch16');
      
      console.log('🤖 Loading text model...');
      const textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16');
      
      console.log('📝 Testing text encoding...');
      const texts = ['a photo of a cat'];
      const textInputs = tokenizer(texts, { padding: true, truncation: true });
      const { text_embeds } = await textModel(textInputs);
      
      setResult({
        success: true,
        embeddingShape: text_embeds.dims,
        embeddingDim: text_embeds.dims[1],
        modelName: 'Xenova/clip-vit-base-patch16'
      });
      
      console.log('✅ Test completed successfully!');
      
    } catch (err) {
      console.error('❌ Test failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">CLIP Model Test</h1>
      
      <div className="space-y-4">
        <Button 
          onClick={testModel} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? 'Testing Model...' : 'Test CLIP Model'}
        </Button>
        
        {isLoading && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700">Loading CLIP model... This may take a minute.</p>
            <p className="text-sm text-blue-600 mt-2">Check browser console for detailed progress.</p>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 rounded-lg">
            <h3 className="font-semibold text-red-800">Error:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800">✅ Success!</h3>
            <div className="mt-2 space-y-1 text-sm text-green-700">
              <p><strong>Model:</strong> {result.modelName}</p>
              <p><strong>Embedding Shape:</strong> [{result.embeddingShape.join(', ')}]</p>
              <p><strong>Embedding Dimension:</strong> {result.embeddingDim}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
