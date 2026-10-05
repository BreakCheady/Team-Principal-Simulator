import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: isProduction ? "/Team-Principal-Simulator" : "",
  assetPrefix: isProduction ? "/Team-Principal-Simulator/" : undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
