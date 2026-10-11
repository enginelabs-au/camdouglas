import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [],
  agentRules: false,
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
