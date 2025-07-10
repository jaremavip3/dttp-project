"use client";

import { useState, useEffect } from 'react';
import { usePerformanceMonitor } from '@/hooks/usePerformance';

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const performanceData = usePerformanceMonitor();

  useEffect(() => {
    // Only show in development or when query param is present
    const showDashboard = process.env.NODE_ENV === 'development' || 
                         window.location.search.includes('debug=performance');
    setIsVisible(showDashboard);

    if (showDashboard) {
      // Collect performance metrics
      const collectMetrics = () => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const resources = performance.getEntriesByType('resource');

        setMetrics({
          navigation,
          paint: paint.reduce((acc, entry) => {
            acc[entry.name] = entry.startTime;
            return acc;
          }, {}),
          resources: resources.length,
          memoryUsage: performanceData.memoryUsage,
          connectionType: performanceData.connectionType,
        });
      };

      collectMetrics();
      const interval = setInterval(collectMetrics, 5000);
      return () => clearInterval(interval);
    }
  }, [performanceData]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 text-white p-4 rounded-lg text-xs max-w-xs">
      <h3 className="font-bold mb-2">Performance Monitor</h3>
      
      <div className="space-y-1">
        <div>
          <strong>Connection:</strong> {metrics.connectionType || 'unknown'}
        </div>
        
        {metrics.paint && (
          <>
            <div>
              <strong>FCP:</strong> {Math.round(metrics.paint['first-contentful-paint'] || 0)}ms
            </div>
            <div>
              <strong>LCP:</strong> {Math.round(metrics.paint['largest-contentful-paint'] || 0)}ms
            </div>
          </>
        )}
        
        {metrics.navigation && (
          <>
            <div>
              <strong>DOM Ready:</strong> {Math.round(metrics.navigation.domContentLoadedEventEnd - metrics.navigation.domContentLoadedEventStart)}ms
            </div>
            <div>
              <strong>Load:</strong> {Math.round(metrics.navigation.loadEventEnd - metrics.navigation.loadEventStart)}ms
            </div>
          </>
        )}
        
        <div>
          <strong>Resources:</strong> {metrics.resources}
        </div>
        
        {metrics.memoryUsage && (
          <div>
            <strong>Memory:</strong> {Math.round(metrics.memoryUsage.used / 1024 / 1024)}MB
          </div>
        )}
      </div>
      
      <button
        onClick={() => setIsVisible(false)}
        className="mt-2 text-xs bg-white/20 px-2 py-1 rounded"
      >
        Hide
      </button>
    </div>
  );
}
