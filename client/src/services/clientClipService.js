/**
 * Client-side CLIP Service using Transformers.js
 * Provides true cross-modal semantic search (text-to-image) with image encoding
 * Uses larger CLIP model for improved accuracy and real image embeddings
 */

import { pipeline, env } from '@huggingface/transformers';
import { CacheManager, CACHE_TYPES } from "@/utils/cache";

// Configure transformers environment for better caching
env.allowLocalModels = false;
env.useBrowserCache = true; // Enable browser caching
env.allowRemoteModels = true; // Allow remote model loading

class ClientClipService {
  constructor() {
    this.isLoading = false;
    this.isLoaded = false;
    this.textExtractor = null;
    this.imageExtractor = null;
    this.modelError = null;
    
    // Image embeddings cache
    this.imageEmbeddingsCache = new Map();
    this.embeddingsLoaded = false;
    
    // Model configuration - medium-sized model with fallback option
    this.modelName = 'Xenova/clip-vit-base-patch16';
    this.fallbackModelName = 'Xenova/clip-vit-base-patch32'; // Smaller fallback
    this.modelSize = '300MB'; // Medium-sized model (FP16) for balanced accuracy/performance
    this.fallbackModelSize = '87MB'; // Smaller fallback
    this.embeddingDim = 512; // Embedding dimension for the base model
    this.usingFallback = false;
    
    // Timeout and retry configuration
    this.loadTimeout = 90000; // 1.5 minutes timeout (reduced for smaller model)
    this.maxRetries = 2;
  }

  /**
   * Initialize the CLIP model with separate text and image extractors
   * @returns {Promise<boolean>} Success status
   */
  async initializeModel() {
    if (this.isLoaded) return true;
    if (this.isLoading) {
      // Wait for current loading to complete
      return new Promise((resolve) => {
        const checkLoaded = () => {
          if (!this.isLoading) {
            resolve(this.isLoaded);
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    this.isLoading = true;
    this.modelError = null;

    let retryCount = 0;
    
    while (retryCount <= this.maxRetries) {
      try {
        console.log(`🤖 Loading client-side CLIP model: ${this.modelName} (${this.modelSize})...`);
        if (retryCount > 0) {
          console.log(`🔄 Retry attempt ${retryCount}/${this.maxRetries}`);
        }
        
        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Model loading timeout')), this.loadTimeout);
        });
        
        // Load models with timeout
        const loadPromise = this.loadModelsWithProgress();
        
        await Promise.race([loadPromise, timeoutPromise]);
        
        this.isLoaded = true;
        console.log('✅ Client-side CLIP model loaded successfully!');
        console.log('🔍 Ready for true cross-modal search (text-to-image)');
        
        return true;
        
      } catch (error) {
        retryCount++;
        console.error(`❌ Attempt ${retryCount} failed:`, error);
        
        if (retryCount <= this.maxRetries) {
          console.log(`🔄 Retrying in 3 seconds... (${retryCount}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          console.error('❌ All retry attempts failed');
          console.log('🔄 Trying fallback model...');
          
          // Try fallback model
          try {
            this.usingFallback = true;
            this.embeddingDim = 512; // Base model uses 512D
            await this.loadModelsWithProgress();
            
            this.isLoaded = true;
            console.log('✅ Fallback CLIP model loaded successfully!');
            console.log('🔍 Ready for cross-modal search (using fallback model)');
            
            this.isLoading = false;
            return true;
          } catch (fallbackError) {
            console.error('❌ Fallback model also failed:', fallbackError);
            this.modelError = `Primary model failed: ${error.message}. Fallback failed: ${fallbackError.message}`;
            this.isLoaded = false;
          }
          break;
        }
      }
    }
    
    this.isLoading = false;
    return this.isLoaded;
  }

  /**
   * Load models with better progress tracking and error handling
   * @returns {Promise<void>}
   */
  async loadModelsWithProgress() {
    let textProgress = 0;
    let imageProgress = 0;
    
    const currentModelName = this.usingFallback ? this.fallbackModelName : this.modelName;
    const currentModelSize = this.usingFallback ? this.fallbackModelSize : this.modelSize;
    
    console.log(`📥 Using model: ${currentModelName} (${currentModelSize})`);
    
    // Load text extractor
    console.log('📥 Loading CLIP text feature extractor...');
    this.textExtractor = await pipeline(
      'feature-extraction',
      currentModelName,
      {
        quantized: true,
        cache_dir: './.cache', // Use cache directory
        local_files_only: false, // Allow remote downloads
        progress_callback: (data) => {
          if (data.status === 'progress' && data.file) {
            textProgress = Math.round(data.progress || 0);
            console.log(`📥 Text model: ${data.file} (${textProgress}%)`);
          }
          if (data.status === 'done') {
            console.log(`✅ Text model file completed: ${data.file}`);
          }
          if (data.status === 'initiate') {
            console.log(`🔄 Loading from cache or downloading: ${data.file}`);
          }
        }
      }
    );
    
    console.log('✅ Text extractor loaded successfully');
    
    // Small delay between model loads
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Load image extractor
    console.log('🖼️ Loading CLIP image feature extractor...');
    this.imageExtractor = await pipeline(
      'image-feature-extraction',
      currentModelName,
      {
        quantized: true,
        cache_dir: './.cache', // Use cache directory
        local_files_only: false, // Allow remote downloads
        progress_callback: (data) => {
          if (data.status === 'progress' && data.file) {
            imageProgress = Math.round(data.progress || 0);
            console.log(`📥 Image model: ${data.file} (${imageProgress}%)`);
          }
          if (data.status === 'done') {
            console.log(`✅ Image model file completed: ${data.file}`);
          }
          if (data.status === 'initiate') {
            console.log(`🔄 Loading from cache or downloading: ${data.file}`);
          }
        }
      }
    );
    
    console.log('✅ Image extractor loaded successfully');
  }

  /**
   * Initialize for true cross-modal search by pre-computing image embeddings
   * @param {Array} products - Array of products to encode
   * @returns {Promise<boolean>} Success status
   */
  async loadImageEmbeddings(products = []) {
    if (!this.isLoaded) {
      const initialized = await this.initializeModel();
      if (!initialized) return false;
    }

    if (this.embeddingsLoaded && this.imageEmbeddingsCache.size > 0) {
      console.log(`✅ Image embeddings already loaded (${this.imageEmbeddingsCache.size} images)`);
      return true;
    }

    try {
      console.log('🖼️ Starting image embedding computation...');
      console.log(`📦 Processing ${products.length} product images`);
      
      if (products.length === 0) {
        console.log('⚠️ No products provided, marking as ready but with empty cache');
        this.embeddingsLoaded = true;
        return true;
      }
      
      // Process images in batches to avoid overwhelming the browser
      const batchSize = 3; // Smaller batch size for large model
      let processed = 0;
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (product) => {
          try {
            if (this.imageEmbeddingsCache.has(product.id)) {
              return; // Already cached
            }
            
            // Get image URL - handle both API format (image_url) and fallback format (image)
            const imageUrl = product.image_url || product.image;
            if (!imageUrl) {
              console.warn(`⚠️ No image URL found for product ${product.id}:`, product);
              return;
            }
            
            const embedding = await this.encodeImage(imageUrl);
            if (embedding) {
              this.imageEmbeddingsCache.set(product.id, embedding);
            }
          } catch (error) {
            console.warn(`⚠️ Failed to encode image for product ${product.id}:`, error);
          }
        });
        
        await Promise.all(batchPromises);
        processed += batch.length;
        
        console.log(`🔄 Processed ${processed}/${products.length} images (${Math.round(processed/products.length*100)}%)`);
        
        // Small delay between batches to prevent UI blocking
        if (i + batchSize < products.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      this.embeddingsLoaded = true;
      console.log(`✅ Image embeddings ready! Cached ${this.imageEmbeddingsCache.size} images`);
      console.log('🔍 Client-side CLIP ready for true cross-modal search');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to load image embeddings:', error);
      return false;
    }
  }

  /**
   * Encode text query to embedding using CLIP text encoder
   * @param {string} text - Text to encode
   * @returns {Promise<Float32Array|null>} Text embedding
   */
  async encodeText(text) {
    if (!this.isLoaded) {
      const initialized = await this.initializeModel();
      if (!initialized) return null;
    }

    try {
      console.log(`🔤 Encoding text: "${text}"`);
      
      // Use the text feature extractor with proper pooling and normalization
      const result = await this.textExtractor(text, {
        pooling: 'mean',
        normalize: true
      });
      
      // Extract the tensor data
      const embedding = new Float32Array(result.data);
      console.log(`✅ Text encoded to ${embedding.length}D embedding`);
      
      return embedding;
    } catch (error) {
      console.error('❌ Failed to encode text:', error);
      return null;
    }
  }

  /**
   * Encode image to embedding using CLIP image encoder
   * @param {string} imageUrl - Image URL to encode
   * @returns {Promise<Float32Array|null>} Image embedding
   */
  async encodeImage(imageUrl) {
    if (!this.isLoaded) {
      const initialized = await this.initializeModel();
      if (!initialized) return null;
    }

    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error(`❌ Invalid image URL provided: ${imageUrl}`);
      return null;
    }

    try {
      console.log(`🖼️ Encoding image: ${imageUrl}`);
      
      // Use the image feature extractor
      const result = await this.imageExtractor(imageUrl);
      
      // Extract the tensor data
      const embedding = new Float32Array(result.data);
      console.log(`✅ Image encoded to ${embedding.length}D embedding`);
      
      return embedding;
    } catch (error) {
      console.error(`❌ Failed to encode image ${imageUrl}:`, error);
      return null;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {Float32Array} a - First vector
   * @param {Float32Array} b - Second vector
   * @returns {number} Similarity score (-1 to 1)
   */
  cosineSimilarity(a, b) {
    if (a.length !== b.length) {
      console.warn(`⚠️ Vector dimension mismatch: ${a.length} vs ${b.length}`);
      return 0;
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (normA * normB);
  }

  /**
   * Search products using client-side cross-modal semantic similarity
   * Compares text query embedding to actual image embeddings
   * @param {string} query - Search query text
   * @param {Array} products - Available products
   * @param {number} topK - Number of results to return
   * @returns {Promise<Object>} Search results
   */
  async searchProducts(query, products = [], topK = 10) {
    if (!this.isLoaded) {
      const initialized = await this.initializeModel();
      if (!initialized) {
        throw new Error('Client-side CLIP model not available');
      }
    }

    // Ensure embeddings are loaded
    if (!this.embeddingsLoaded) {
      console.log('🔄 Image embeddings not ready, computing them now...');
      await this.loadImageEmbeddings(products);
    }

    try {
      console.log(`🔍 Client-side cross-modal search for: "${query}"`);
      console.log(`📦 Searching ${products.length} products with ${this.imageEmbeddingsCache.size} cached embeddings`);

      // Encode the query text
      const queryEmbedding = await this.encodeText(query);
      if (!queryEmbedding) {
        throw new Error('Failed to encode query text');
      }

      // Calculate similarities with cached image embeddings
      const similarities = [];
      
      for (const product of products) {
        try {
          const imageEmbedding = this.imageEmbeddingsCache.get(product.id);
          
          if (!imageEmbedding) {
            // Try to encode the image on-demand if not cached
            console.log(`🔄 Encoding missing image for product ${product.id}`);
            
            // Get image URL - handle both API format (image_url) and fallback format (image)
            const imageUrl = product.image_url || product.image;
            if (!imageUrl) {
              console.warn(`⚠️ No image URL found for product ${product.id}:`, product);
              continue;
            }
            
            const embedding = await this.encodeImage(imageUrl);
            if (embedding) {
              this.imageEmbeddingsCache.set(product.id, embedding);
              const similarity = this.cosineSimilarity(queryEmbedding, embedding);
              
              if (similarity > 0.1) { // Threshold for relevance
                similarities.push({
                  ...product,
                  similarity: similarity
                });
              }
            }
            continue;
          }
          
          // Calculate cross-modal similarity (text query vs image)
          const similarity = this.cosineSimilarity(queryEmbedding, imageEmbedding);
          
          if (similarity > 0.1) { // Threshold for relevance
            similarities.push({
              ...product,
              similarity: similarity
            });
          }
        } catch (error) {
          console.warn(`⚠️ Error processing product ${product.id}:`, error);
        }
      }

      // Sort by similarity (highest first) and take top K
      similarities.sort((a, b) => b.similarity - a.similarity);
      const results = similarities.slice(0, topK);

      console.log(`✅ Found ${results.length} matches (from ${products.length} products)`);
      console.log(`🎯 Top match: ${results[0]?.name} (similarity: ${results[0]?.similarity?.toFixed(3)})`);

      return {
        query: query,
        products: results,
        totalImages: products.length,
        model: 'Client-CLIP-Large',
        modelInfo: `${this.modelName} (cross-modal: text-to-image)`,
        fromCache: true,
        cacheType: 'client-side-images',
        embeddingDim: this.embeddingDim,
        cachedImages: this.imageEmbeddingsCache.size,
        processingTime: Date.now(), // Will be calculated by caller
      };
      
    } catch (error) {
      console.error('❌ Client-side cross-modal search failed:', error);
      throw error;
    }
  }

  /**
   * Get model status and information
   * @returns {Object} Model status
   */
  getStatus() {
    const currentModelName = this.usingFallback ? this.fallbackModelName : this.modelName;
    const currentModelSize = this.usingFallback ? this.fallbackModelSize : this.modelSize;
    
    return {
      isLoaded: this.isLoaded,
      isLoading: this.isLoading,
      modelError: this.modelError,
      modelName: currentModelName,
      modelSize: currentModelSize,
      embeddingDim: this.embeddingDim,
      embeddingsCount: this.imageEmbeddingsCache.size,
      embeddingsLoaded: this.embeddingsLoaded,
      canRunLocally: true,
      searchMode: 'cross-modal (text-to-image)',
      hasTextExtractor: !!this.textExtractor,
      hasImageExtractor: !!this.imageExtractor,
      usingFallback: this.usingFallback
    };
  }

  /**
   * Check if client-side CLIP is available
   * @returns {boolean} Availability status
   */
  isAvailable() {
    return this.isLoaded && !!this.textExtractor && !!this.imageExtractor;
  }

  /**
   * Preload the model (useful for initialization)
   * @returns {Promise<boolean>} Success status
   */
  async preload() {
    return await this.initializeModel();
  }

  /**
   * Clear cached data to free memory
   */
  clearCache() {
    this.imageEmbeddingsCache.clear();
    this.embeddingsLoaded = false;
    console.log('🗑️ Client-side CLIP image cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache info
   */
  getCacheInfo() {
    return {
      imageEmbeddingsCount: this.imageEmbeddingsCache.size,
      embeddingsLoaded: this.embeddingsLoaded,
      memoryUsageEstimate: `~${Math.round(this.imageEmbeddingsCache.size * this.embeddingDim * 4 / 1024)}KB`
    };
  }
}

// Create singleton instance with improved persistence
let clientClipServiceInstance = null;

function getClientClipService() {
  if (!clientClipServiceInstance) {
    clientClipServiceInstance = new ClientClipService();
    
    // Store reference globally for persistence across route changes
    if (typeof window !== 'undefined') {
      window._clientClipService = clientClipServiceInstance;
    }
  }
  return clientClipServiceInstance;
}

// Check if we already have a global instance
if (typeof window !== 'undefined' && window._clientClipService) {
  clientClipServiceInstance = window._clientClipService;
  console.log('♻️ Reusing existing CLIENT-CLIP service instance');
}

const clientClipService = getClientClipService();

export default clientClipService;
