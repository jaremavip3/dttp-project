"use server";

import { revalidateTag, revalidatePath } from "next/cache";

/**
 * Server Actions for cache management
 * These can be called from client components to trigger cache revalidation
 */

/**
 * Revalidate specific cache tags
 * @param {Array<string>} tags - Tags to revalidate
 */
export async function revalidateCacheTags(tags) {
  try {
    tags.forEach((tag) => {
      revalidateTag(tag);
    });

    return {
      success: true,
      message: `Revalidated ${tags.length} cache tags: ${tags.join(", ")}`,
    };
  } catch (error) {
    console.error("❌ Error revalidating cache tags:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Revalidate all product-related caches
 */
export async function revalidateProductCaches() {
  const productTags = ["products", "best-sellers", "new-arrivals", "categories", "featured-products", "product-search"];

  return await revalidateCacheTags(productTags);
}

/**
 * Revalidate all AI search-related caches
 */
export async function revalidateSearchCaches() {
  const searchTags = ["ai-search", "search-clip", "search-eva02", "search-dfn5b", "product-search"];

  return await revalidateCacheTags(searchTags);
}

/**
 * Revalidate server health caches
 */
export async function revalidateHealthCaches() {
  const healthTags = ["health-all", "health-clip", "health-eva02", "health-dfn5b", "server-status"];

  return await revalidateCacheTags(healthTags);
}

/**
 * Revalidate specific page paths
 * @param {Array<string>} paths - Paths to revalidate
 */
export async function revalidatePages(paths) {
  try {
    paths.forEach((path) => {
      revalidatePath(path);
    });

    return {
      success: true,
      message: `Revalidated ${paths.length} pages: ${paths.join(", ")}`,
    };
  } catch (error) {
    console.error("❌ Error revalidating pages:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Emergency cache clear - revalidates all main application caches
 */
export async function emergencyCacheClear() {
  const allTags = [
    // Products
    "products",
    "best-sellers",
    "new-arrivals",
    "categories",
    "featured-products",
    // Search
    "ai-search",
    "product-search",
    "search-clip",
    "search-eva02",
    "search-dfn5b",
    // Server
    "health-all",
    "server-status",
    // Metadata
    "products-metadata",
    "images",
    "image-list",
    "stats",
    "database-stats",
  ];

  const mainPages = ["/", "/catalog"];

  try {
    // Revalidate all tags
    allTags.forEach((tag) => revalidateTag(tag));

    // Revalidate main pages
    mainPages.forEach((path) => revalidatePath(path));

    return {
      success: true,
      message: `Emergency cache clear completed. Revalidated ${allTags.length} tags and ${mainPages.length} pages.`,
      tags: allTags,
      pages: mainPages,
    };
  } catch (error) {
    console.error("❌ Emergency cache clear failed:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
