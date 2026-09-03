import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@beaulab/ui-admin", "@beaulab/auth", "@beaulab/api-client", "@beaulab/types"],
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
