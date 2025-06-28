/** @type {import('next').NextConfig} */
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "owtqoapmmmupfmhyhsuz.supabase.co",
        pathname: "/storage/v1/object/public/product-images/**",
      },
    ],
  },
  // Enable webpack caching for better build performance
  webpack: (config, { dev, isServer }) => {
    // Improve caching for model files
    config.cache = {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.next/cache/webpack'),
    };
    
    return config;
  },
  // Add headers for better caching
  async headers() {
    return [
      {
        // Cache static assets aggressively
        source: '/(.*\\.(?:js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
