/**
 * Next.js Configuration File
 * This configuration is optimized for Cloudflare Pages deployment
 */

// Try to import user-specific configuration if it exists
let userConfig = undefined
try {
  userConfig = await import('./v0-user-next.config')
} catch (e) {
  // Silently ignore if user config doesn't exist
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable ESLint during builds for performance
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript error checking during builds
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable image optimization for Cloudflare compatibility
  images: {
    unoptimized: true,
  },
  
  // Enable static exports for Cloudflare Pages
  output: 'export',
  
  // Ensure consistent URL trailing slashes
  trailingSlash: true,
  
  // Enable experimental features
  experimental: {
    appDir: true,
  },

  // Configure CORS headers for API routes
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" }, // Note: Configure this for production
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, apikey" },
        ]
      }
    ]
  }
}

/**
 * Merges user configuration with default configuration
 * @param {Object} nextConfig - Default Next.js configuration
 * @param {Object} userConfig - User-provided configuration overrides
 */
function mergeConfig(nextConfig, userConfig) {
  if (!userConfig) {
    return
  }

  for (const key in userConfig) {
    if (
      typeof nextConfig[key] === 'object' &&
      !Array.isArray(nextConfig[key])
    ) {
      // Deep merge for object properties
      nextConfig[key] = {
        ...nextConfig[key],
        ...userConfig[key],
      }
    } else {
      // Direct assignment for primitive values
      nextConfig[key] = userConfig[key]
    }
  }
}

// Apply user configuration overrides
mergeConfig(nextConfig, userConfig)

export default nextConfig
