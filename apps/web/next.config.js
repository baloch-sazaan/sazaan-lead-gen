/** @type {import('next').NextConfig} */
const nextConfig = {
  // serverExternalPackages replaces the deprecated serverComponentsExternalPackages
  serverExternalPackages: [],
  images: {
    remotePatterns: [],
  },
};

module.exports = nextConfig;
