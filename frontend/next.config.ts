import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Use webpack instead of Turbopack to avoid issues with test files
  // Add empty turbopack config to explicitly use webpack
  turbopack: {},
  // Exclude problematic packages from being processed
  serverExternalPackages: ['thread-stream'],
  // Configure webpack to ignore test files
  webpack: (config, { isServer }) => {
    // Ignore test files and other non-essential files in node_modules
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Add rule to ignore test files
    config.module.rules.push({
      test: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
      exclude: /node_modules/,
      use: 'ignore-loader',
    });
    
    return config;
  },
};

export default nextConfig;
