const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 14.2 still keys this under `experimental` (it became top-level in v15). At the top
  // level it is silently ignored, so Next auto-detects the tracing root as apps/web and never
  // traces the monorepo's hoisted node_modules into the standalone output (server.js then fails
  // with "Cannot find module 'next'"). Pointing it at the repo root makes the standalone nest
  // under apps/web with a complete node_modules.
  experimental: {
    outputFileTracingRoot: path.join(__dirname, "../../"),
  },
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
