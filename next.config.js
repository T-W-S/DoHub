/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  serverExternalPackages: ['better-sqlite3', 'bcryptjs'],
};

module.exports = nextConfig;
