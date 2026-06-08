import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Increase max body size for large M3U playlist chunks sent from admin panel
 // middlewareClientMaxBodySize: 50 * 1024 * 1024, // 50MB
};

export default nextConfig;
