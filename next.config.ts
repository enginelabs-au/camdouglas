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
  async headers() {
    return [
      {
        source: "/products.tsv",
        headers: [
          { key: "Content-Type", value: "text/tab-separated-values; charset=utf-8" },
          { key: "Cache-Control", value: "public, max-age=300" },
        ],
      },
    ];
  },
};

export default nextConfig;
