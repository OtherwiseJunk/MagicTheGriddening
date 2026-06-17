/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@griddening/shared"],
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cards.scryfall.io",
      },
    ],
  },
  output: "standalone",
};

module.exports = nextConfig;
