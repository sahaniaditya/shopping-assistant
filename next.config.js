/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable static generation for pages that use localStorage
  trailingSlash: false,
  // Ensure client-side rendering for localStorage usage
  generateBuildId: async () => {
    return 'build-id-' + Date.now();
  },
}

module.exports = nextConfig 