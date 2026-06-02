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
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
