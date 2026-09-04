import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const origin = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(
      /\/$/,
      "",
    );
    return [{ source: "/api/v1/hospital/:path*", destination: `${origin}/api/v1/hospital/:path*` }];
  },
  transpilePackages: ["@beaulab/ui-admin", "@beaulab/api-client", "@beaulab/types"],
  experimental: {
    optimizePackageImports: ["@beaulab/ui-admin"],
  },
  async redirects() {
    return [
      {
        source: "/error-419",
        destination: "/error/419",
        permanent: false,
      },
      {
        source: "/error-429",
        destination: "/error/429",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
