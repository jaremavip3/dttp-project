import { useEffect } from 'react';

export function usePreloadCriticalResources() {
  useEffect(() => {
    // Preload critical images
    const criticalImages = [
      '/hero-background.jpg',
      '/logo.png',
    ];

    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });

    // Preload critical API endpoints
    const criticalEndpoints = [
      `${process.env.NEXT_PUBLIC_API_URL}/api/products?per_page=8`,
      `${process.env.NEXT_PUBLIC_API_URL}/api/categories`,
    ];

    criticalEndpoints.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = url;
      document.head.appendChild(link);
    });

    // Preload critical fonts if not using next/font
    const fontUrls = [
      'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    ];

    fontUrls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'style';
      link.href = url;
      link.onload = function() {
        this.rel = 'stylesheet';
      };
      document.head.appendChild(link);
    });
  }, []);
}

export function useCriticalResourceHints() {
  useEffect(() => {
    // Add resource hints for better performance
    const hints = [
      { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
      { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },
      { rel: 'preconnect', href: process.env.NEXT_PUBLIC_API_URL },
      { rel: 'preconnect', href: 'https://owtqoapmmmupfmhyhsuz.supabase.co' },
    ];

    hints.forEach(({ rel, href }) => {
      if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = href;
        if (rel === 'preconnect') {
          link.crossOrigin = 'anonymous';
        }
        document.head.appendChild(link);
      }
    });
  }, []);
}
