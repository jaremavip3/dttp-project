/**
 * Test script to verify the new CLIP model loads correctly
 */

import { CLIPTextModelWithProjection, CLIPVisionModelWithProjection, AutoTokenizer, AutoProcessor } from '@xenova/transformers';

async function testModel() {
  try {
    console.log('🧪 Testing Xenova/clip-vit-base-patch16 model loading...');
    
    // Test loading the text model
    console.log('📝 Loading text model...');
    const tokenizer = await AutoTokenizer.from_pretrained('Xenova/clip-vit-base-patch16');
    const textModel = await CLIPTextModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16');
    console.log('✅ Text model loaded successfully');
    
    // Test loading the vision model
    console.log('🖼️ Loading vision model...');
    const processor = await AutoProcessor.from_pretrained('Xenova/clip-vit-base-patch16');
    const visionModel = await CLIPVisionModelWithProjection.from_pretrained('Xenova/clip-vit-base-patch16');
    console.log('✅ Vision model loaded successfully');
    
    // Test text encoding
    console.log('📝 Testing text encoding...');
    const texts = ['a photo of a cat'];
    const textInputs = tokenizer(texts, { padding: true, truncation: true });
    const { text_embeds } = await textModel(textInputs);
    console.log('📏 Text embedding shape:', text_embeds.dims);
    console.log('📊 Text embedding dimension:', text_embeds.dims[1]);
    
    console.log('✅ All tests passed! Model is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testModel();
