/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable reactStrictMode for development but disable for production if needed
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: ['images.unsplash.com', 'avatars.githubusercontent.com'],
  },
  
  // Enable webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Reduce bundle size in development
    if (dev) {
      config.optimization.minimize = false;
    }
    
    return config;
  },
  
  // Enable experimental features for better performance
  experimental: {
    // Optimize server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;