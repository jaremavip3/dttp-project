import { useEffect, useState } from 'react';

export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({
    isOnline: true,
    connectionType: 'unknown',
    memoryUsage: null,
    timing: null,
  });

  useEffect(() => {
    // Monitor online status
    const handleOnline = () => setMetrics(prev => ({ ...prev, isOnline: true }));
    const handleOffline = () => setMetrics(prev => ({ ...prev, isOnline: false }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get connection info
    if ('connection' in navigator) {
      const connection = navigator.connection;
      setMetrics(prev => ({
        ...prev,
        connectionType: connection.effectiveType || 'unknown',
      }));

      const handleConnectionChange = () => {
        setMetrics(prev => ({
          ...prev,
          connectionType: connection.effectiveType || 'unknown',
        }));
      };

      connection.addEventListener('change', handleConnectionChange);
    }

    // Get memory usage (if available)
    if ('memory' in performance) {
      setMetrics(prev => ({
        ...prev,
        memoryUsage: {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit,
        },
      }));
    }

    // Get page timing
    if ('timing' in performance) {
      setMetrics(prev => ({
        ...prev,
        timing: performance.timing,
      }));
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return metrics;
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return isVisible;
}

export function useIntersectionObserver(options = {}) {
  const [inView, setInView] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return [setRef, inView];
}
