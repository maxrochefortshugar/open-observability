/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@open-observability/sdk'],
};

module.exports = nextConfig;
