# Caching Strategy Documentation

## Overview

This application implements a **hybrid caching strategy** that combines Next.js native server-side caching with client-side localStorage caching for optimal performance across different scenarios.

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Cache  │ -> │  Next.js Cache  │ -> │   API Server    │
│  (localStorage) │    │  (Server-side)  │    │   (Supabase)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
      Fast access         SSR/Static Gen        Database calls
      5-60 min TTL        5 min - 1 hr TTL      Real-time data
```

## Caching Layers

### 1. Client-Side Cache (localStorage)

**Purpose:** Instant access for repeated user interactions within the same session.

**Implementation:** `src/utils/cache.js` - `CacheManager` class

**TTL Settings:**

- Products: 15 minutes
- Search Results: 10 minutes
- Best Sellers: 30 minutes
- New Arrivals: 30 minutes
- Categories: 1 hour

**Benefits:**

- Zero network latency for cached data
- Persists across page reloads
- Reduces server load for repeated requests

### 2. Next.js Server-Side Cache

**Purpose:** Optimize server rendering and reduce database queries across user sessions.

**Implementation:** `fetch()` with `next.revalidate` and `next.tags`

**Cache Settings:**

```javascript
// Products
fetch(url, {
  next: {
    revalidate: 900, // 15 minutes
    tags: ["products", "products-page-1"],
  },
});

// Search Results
fetch(url, {
  next: {
    revalidate: 300, // 5 minutes
    tags: ["ai-search", "search-clip"],
  },
});

// Categories
fetch(url, {
  next: {
    revalidate: 3600, // 1 hour
    tags: ["categories"],
  },
});
```

**Benefits:**

- Shared across all users
- Survives client-side navigation
- Automatic revalidation
- Tag-based selective invalidation

## Cache Tags Strategy

### Product-Related Tags

- `products` - All product data
- `products-page-{n}` - Specific pagination pages
- `products-category-{name}` - Category-specific products
- `best-sellers` - Featured best selling products
- `new-arrivals` - New arrival products
- `categories` - Available categories list

### Search-Related Tags

- `ai-search` - All AI search functionality
- `search-{model}` - Model-specific searches (clip, eva02, dfn5b)
- `product-search` - Product search results

### Server Health Tags

- `health-all` - Overall server health
- `health-{model}` - Model-specific health status
- `server-status` - Server status information

## Cache Invalidation

### Automatic Revalidation (Time-based)

```javascript
// Example: Revalidate every 15 minutes
fetch(url, { next: { revalidate: 900 } });
```

### Manual Revalidation (Tag-based)

```javascript
// Server Actions for manual cache clearing
import { revalidateTag } from "next/cache";

// Revalidate all product caches
revalidateTag("products");

// Revalidate specific search model
revalidateTag("search-clip");
```

### On-Demand Revalidation

Use the `/dev/cache` page or `CacheManagement` component to manually trigger cache invalidation.

## Performance Optimizations

### Request Memoization

Next.js automatically memoizes identical `fetch()` calls within the same render pass:

```javascript
// These will only make one network request
const products1 = await fetch("/api/products");
const products2 = await fetch("/api/products"); // Memoized
```

### Smart Cache Fallbacks

```javascript
// 1. Try client cache first (fastest)
const cached = CacheManager.get("products", key);
if (cached) return cached;

// 2. Fetch with Next.js cache (server-optimized)
const response = await fetch(url, { next: { revalidate: 900 } });

// 3. Cache result on client for future requests
CacheManager.set("products", result, key);
```

### Strategic TTL Selection

| Data Type      | Change Frequency | Client TTL | Server TTL | Reasoning                                   |
| -------------- | ---------------- | ---------- | ---------- | ------------------------------------------- |
| Products       | Medium           | 15 min     | 15 min     | Product catalog updates moderately          |
| Categories     | Low              | 1 hour     | 1 hour     | Category structure rarely changes           |
| Search Results | High             | 10 min     | 5 min      | Search results may change with new products |
| Best Sellers   | Low              | 30 min     | 1 hour     | Featured products change infrequently       |
| Health Status  | High             | N/A        | 1-2 min    | Server status needs frequent updates        |

## Usage Examples

### Basic Product Fetching

```javascript
import { ProductService } from "@/services/productService";

// Automatically uses hybrid caching
const products = await ProductService.fetchProducts({
  page: 1,
  category: "shirts",
});
```

### AI Search with Caching

```javascript
import { ClipService } from "@/services/clipService";

// Uses both client and server caching
const results = await ClipService.searchProducts("red dress", "CLIP", 10);
```

### Manual Cache Management

```javascript
import { CacheManager } from "@/utils/cache";
import { revalidateProductCaches } from "@/app/actions/cacheActions";

// Clear client cache
CacheManager.clearAll();

// Revalidate server cache (Server Action)
await revalidateProductCaches();
```

## Cache Monitoring

### Development Tools

- **Cache Management Page:** `/dev/cache`
- **Cache Status Indicator:** Add `<CacheStatusIndicator />` to any component
- **Console Analysis:** `CacheMonitor.logAnalysis()`

### Performance Metrics

```javascript
import CacheMonitor from "@/utils/cacheMonitor";

const metrics = CacheMonitor.getPerformanceMetrics();
console.log(`Cache hit rate: ${metrics.hitRate}`);
```

### Cache Inspection

```javascript
// Inspect specific cache type
const entries = CacheMonitor.inspectCacheType("products");
console.log("Product cache entries:", entries);
```

## Best Practices

### 1. Cache Key Generation

```javascript
// Use consistent, predictable keys
const key = `page_${page}_category_${category}_filter_${filter}`;
```

### 2. Error Handling

```javascript
try {
  const cached = CacheManager.get("products", key);
  if (cached) return cached;

  const fresh = await fetchFromAPI();
  CacheManager.set("products", fresh, key);
  return fresh;
} catch (error) {
  // Gracefully degrade without cache
  return await fetchFromAPI();
}
```

### 3. Cache Warming

```javascript
// Pre-load common data
useEffect(() => {
  ProductService.fetchCategories(); // Warm categories cache
  ProductService.fetchBestSellers(); // Warm best sellers
}, []);
```

### 4. Selective Revalidation

```javascript
// Instead of clearing all caches
CacheManager.clearAll(); // ❌ Too broad

// Revalidate specific data
revalidateTag("products-category-shirts"); // ✅ Targeted
```

## Troubleshooting

### Common Issues

1. **Stale Data**

   - Check TTL settings
   - Verify revalidation is working
   - Use emergency cache clear

2. **High Memory Usage**

   - Monitor cache size in development
   - Implement cache size limits
   - Use shorter TTLs for large datasets

3. **Cache Misses**
   - Check cache key consistency
   - Verify localStorage availability
   - Check network conditions

### Debug Commands

```javascript
// Log complete cache analysis
CacheMonitor.logAnalysis();

// Check cache availability
console.log("Cache available:", CacheManager.isAvailable());

// Get storage usage
console.log("Storage:", CacheManager.getStorageInfo());
```

## Future Enhancements

### Potential Improvements

1. **LRU Eviction:** Implement least-recently-used cache eviction
2. **Cache Compression:** Compress large cached objects
3. **Background Refresh:** Refresh cache before expiration
4. **Analytics:** Track cache performance metrics
5. **Service Worker:** Add offline caching capabilities

### Configuration Options

```javascript
// Future: Configurable cache settings
const config = {
  enableClientCache: true,
  defaultTTL: 300000,
  maxCacheSize: 50 * 1024 * 1024, // 50MB
  compressionEnabled: true,
};
```

---

This hybrid caching strategy provides excellent performance while maintaining data freshness. The combination of client-side speed and server-side efficiency creates an optimal user experience with minimal server load.
