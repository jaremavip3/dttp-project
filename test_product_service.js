// Quick test script to verify ProductService methods work correctly
const fetch = require("node-fetch");
global.fetch = fetch;

// Mock environment
process.env.NEXT_PUBLIC_API_URL = "http://localhost:8000";

// Simple cache mock for testing
global.localStorage = {
  data: {},
  getItem: function (key) {
    return this.data[key] || null;
  },
  setItem: function (key, value) {
    this.data[key] = value;
  },
  removeItem: function (key) {
    delete this.data[key];
  },
  clear: function () {
    this.data = {};
  },
};

// Import the ProductService
const ProductService = require("./client/src/services/productService.js").default;

async function testProductService() {
  console.log("Testing ProductService methods...\n");

  try {
    // Test fetchProducts
    console.log("1. Testing fetchProducts...");
    const products = await ProductService.fetchProducts({ per_page: 3 });
    console.log(`✓ fetchProducts: Found ${products.products.length} products`);
    console.log(`  First product: ${products.products[0]?.name || "None"}\n`);

    // Test fetchAllProducts
    console.log("2. Testing fetchAllProducts...");
    const allProducts = await ProductService.fetchAllProducts({ maxItems: 10 });
    console.log(`✓ fetchAllProducts: Found ${allProducts.length} products`);
    console.log(`  First product: ${allProducts[0]?.name || "None"}\n`);

    // Test fetchBestSellers
    console.log("3. Testing fetchBestSellers...");
    const bestSellers = await ProductService.fetchBestSellers(3);
    console.log(`✓ fetchBestSellers: Found ${bestSellers.length} products`);
    console.log(`  First best seller: ${bestSellers[0]?.name || "None"}\n`);

    // Test fetchNewArrivals
    console.log("4. Testing fetchNewArrivals...");
    const newArrivals = await ProductService.fetchNewArrivals(3);
    console.log(`✓ fetchNewArrivals: Found ${newArrivals.length} products`);
    console.log(`  First new arrival: ${newArrivals[0]?.name || "None"}\n`);

    console.log("✅ All ProductService methods working correctly!");
  } catch (error) {
    console.error("❌ Error testing ProductService:", error.message);
    console.error("Stack:", error.stack);
  }
}

testProductService();
