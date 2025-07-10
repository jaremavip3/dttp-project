'use client';

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, rating, id }) {
  // In production, send to your analytics service
  if (process.env.NODE_ENV === 'development') {
    console.log(`${name}: ${value} (${rating})`);
  }
  
  // Send to analytics service in production
  // Example: gtag('event', name, { value, metric_rating: rating, metric_id: id });
}

export function reportWebVitals() {
  try {
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onINP(sendToAnalytics); // INP replaced FID in web-vitals v3
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
  } catch (err) {
    console.error('Web Vitals reporting error:', err);
  }
}
