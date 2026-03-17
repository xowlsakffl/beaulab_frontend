import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: [
        "@beaulab/ui-admin",
        "@beaulab/auth",
        "@beaulab/api-client",
        "@beaulab/types",
    ],
};

export default nextConfig;
