import ClipService from "./services/clipService.js";

// Test the ClipService search functionality
async function testSearch() {
  try {
    console.log("Testing ClipService.searchProductsV2...");

    const result = await ClipService.searchProductsV2("blue shirt", "CLIP", 3);
    console.log("✅ Search successful:", result);

    return result;
  } catch (error) {
    console.error("❌ Search failed:", error);
    throw error;
  }
}

// Run the test
testSearch();
