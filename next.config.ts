import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["chartjs-node-canvas", "canvas", "puppeteer"],
};

export default nextConfig;
