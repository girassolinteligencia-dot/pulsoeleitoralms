import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bbqgskzvguqqejmotbpz.supabase.co",
        pathname: "/storage/v1/object/public/candidatos/**",
      },
    ],
  },
};

export default nextConfig;
