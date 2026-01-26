/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly use the app directory at root level
  experimental: {
    // Ensure we use the root app directory
  },
  // Ignore the src directory for pages routing
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Increase body size limit for document uploads (Framework B)
  serverRuntimeConfig: {
    maxBodySize: '50mb',
  },
};

module.exports = nextConfig;
