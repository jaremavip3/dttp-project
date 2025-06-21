#!/usr/bin/env node

/**
 * Test caching performance for AI search
 */

// Simulate a search request to test caching
async function testSearchCaching() {
  const testQuery = "red shirt";
  const testModel = "clip";
  const testTopK = 5;

  console.log("🧪 Testing AI Search Caching Performance\n");
  console.log(`Query: "${testQuery}"`);
  console.log(`Model: ${testModel.toUpperCase()}`);
  console.log(`Top K: ${testTopK}\n`);

  const times = [];
  const numTests = 3;

  for (let i = 1; i <= numTests; i++) {
    console.log(`📡 Test ${i}/${numTests}:`);
    
    const startTime = Date.now();
    
    try {
      const response = await fetch("http://localhost:8000/search-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: testQuery,
          model: testModel,
          top_k: testTopK,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      times.push(duration);
      
      console.log(`   ⏱️  Response time: ${duration}ms`);
      console.log(`   📦 Results: ${data.products?.length || 0} products`);
      console.log(`   🎯 Model: ${data.model || 'unknown'}`);
      
      if (i < numTests) {
        console.log("   ⏳ Waiting 1 second...\n");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }

  console.log("\n📊 Performance Summary:");
  console.log(`   First request: ${times[0]}ms`);
  console.log(`   Subsequent requests: ${times.slice(1).join('ms, ')}ms`);
  
  const avgSubsequent = times.slice(1).reduce((a, b) => a + b, 0) / (times.length - 1);
  const improvement = ((times[0] - avgSubsequent) / times[0] * 100).toFixed(1);
  
  console.log(`   Average improvement: ${improvement}% faster`);
  
  if (avgSubsequent < times[0] * 0.8) {
    console.log("   ✅ Caching appears to be working (20%+ improvement)");
  } else {
    console.log("   ⚠️  No significant caching improvement detected");
  }
}

// Check if we're in Node.js environment
if (typeof fetch === 'undefined') {
  // Use node-fetch if available, or show alternative
  try {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
    testSearchCaching();
  } catch (error) {
    console.log("🔧 Run this test using: curl or browser console");
    console.log("\nBrowser Console Test:");
    console.log(`
// Test search caching in browser console:
async function testCaching() {
  const query = "red shirt";
  const times = [];
  
  for (let i = 0; i < 3; i++) {
    const start = Date.now();
    const response = await fetch('/api/search-products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, model: 'clip', top_k: 5 })
    });
    const data = await response.json();
    const duration = Date.now() - start;
    times.push(duration);
    console.log(\`Test \${i+1}: \${duration}ms\`);
  }
  
  console.log('Times:', times);
  return times;
}

testCaching();
    `);
  }
} else {
  testSearchCaching();
}
