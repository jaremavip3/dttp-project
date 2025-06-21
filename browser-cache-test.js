/**
 * Browser Console Cache Test
 * Copy and paste this into the browser console on the catalog page
 */

// Test function to check if search results are being cached
async function testSearchCaching() {
  console.log('🧪 Testing Client-Side Search Caching');
  
  // Clear any existing cache entries for this test
  const searchKeys = Object.keys(localStorage).filter(key => key.includes('dttp_search_cache'));
  console.log(`🗑️ Clearing ${searchKeys.length} existing search cache entries`);
  searchKeys.forEach(key => localStorage.removeItem(key));
  
  const query = "red shirt";
  const model = "CLIP";
  
  console.log(`\n🔍 Testing search: "${query}" with model: ${model}`);
  
  // Check initial localStorage state
  console.log('📦 Initial localStorage entries:', 
    Object.keys(localStorage).filter(key => key.startsWith('dttp_')).length
  );
  
  // First search - should not use cache
  console.log('\n1️⃣ First search (should hit API):');
  const start1 = performance.now();
  
  try {
    // Import ClipService dynamically if available
    const response = await fetch('http://localhost:8000/search-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, model: model.toLowerCase(), top_k: 5 })
    });
    
    const data = await response.json();
    const duration1 = performance.now() - start1;
    
    console.log(`   ⏱️ Time: ${duration1.toFixed(2)}ms`);
    console.log(`   📦 Results: ${data.products?.length || 0} products`);
    console.log(`   🎯 Model: ${data.model}`);
    
    // Check if anything was cached
    const cacheAfter1 = Object.keys(localStorage).filter(key => key.startsWith('dttp_'));
    console.log(`   💾 Cache entries after search: ${cacheAfter1.length}`);
    
    // Wait a moment then do second search
    console.log('\n⏳ Waiting 1 second...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second search - should use cache if working
    console.log('\n2️⃣ Second search (should use cache if available):');
    const start2 = performance.now();
    
    const response2 = await fetch('http://localhost:8000/search-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, model: model.toLowerCase(), top_k: 5 })
    });
    
    const data2 = await response2.json();
    const duration2 = performance.now() - start2;
    
    console.log(`   ⏱️ Time: ${duration2.toFixed(2)}ms`);
    console.log(`   📦 Results: ${data2.products?.length || 0} products`);
    console.log(`   🎯 Model: ${data2.model}`);
    
    const cacheAfter2 = Object.keys(localStorage).filter(key => key.startsWith('dttp_'));
    console.log(`   💾 Cache entries after second search: ${cacheAfter2.length}`);
    
    // Analyze results
    console.log('\n📊 Cache Analysis:');
    const improvement = ((duration1 - duration2) / duration1 * 100);
    console.log(`   Time improvement: ${improvement.toFixed(1)}%`);
    
    if (Math.abs(improvement) < 10) {
      console.log('   ⚠️ No significant time improvement (cache may not be working on API level)');
    } else if (improvement > 0) {
      console.log('   ✅ Second search was faster (possible caching effect)');
    } else {
      console.log('   ❌ Second search was slower (no caching detected)');
    }
    
    // Check localStorage for cache entries
    const searchCacheKeys = Object.keys(localStorage).filter(key => key.includes('search'));
    if (searchCacheKeys.length > 0) {
      console.log(`   💾 Found ${searchCacheKeys.length} search cache entries in localStorage`);
      searchCacheKeys.forEach(key => {
        const cached = JSON.parse(localStorage.getItem(key));
        console.log(`      - ${key}: ${cached.data?.products?.length || 0} products, TTL: ${cached.ttl}ms`);
      });
    } else {
      console.log('   ❌ No search cache entries found in localStorage');
    }
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Instructions
console.log(`
🧪 Cache Testing Instructions:

1. Open browser console on the catalog page
2. Run: testSearchCaching()
3. Watch the console output for cache behavior

Or test manually:
1. Clear localStorage: localStorage.clear()
2. Perform a search on the page
3. Check localStorage: Object.keys(localStorage).filter(k => k.startsWith('dttp_'))
4. Repeat the same search and check timing

`);

// Auto-run if we detect we're in the right environment
if (typeof window !== 'undefined' && window.location.pathname.includes('catalog')) {
  console.log('🎯 Detected catalog page, ready to test caching!');
  console.log('Run testSearchCaching() to start the test');
}
