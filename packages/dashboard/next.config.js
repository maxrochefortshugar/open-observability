/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  transpilePackages: ['@open-observability/sdk'],
  images: { unoptimized: true },
};

module.exports = nextConfig;
