import type { NextConfig } from "next";

const apiOrigin = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  transpilePackages: ["@beaulab/auth", "@beaulab/api-client", "@beaulab/types"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
      {
        source: "/broadcasting/auth",
        destination: `${apiOrigin}/broadcasting/auth`,
      },
    ];
  },
};

export default nextConfig;
