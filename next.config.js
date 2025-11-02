/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow production builds to succeed even if there are type errors.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during Vercel builds.
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
