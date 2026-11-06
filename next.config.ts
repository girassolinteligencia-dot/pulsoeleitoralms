import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Disponibiliza os bindings (D1, R2, KV) via getCloudflareContext() no `next dev`.
initOpenNextCloudflareForDev();

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "frame-src https://challenges.cloudflare.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
  "connect-src 'self' https://pulsoms.ia.br https://www.pulsoms.ia.br https://challenges.cloudflare.com",
  "manifest-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), payment=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const adminNoStoreHeaders = [
  { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
  { key: "CDN-Cache-Control", value: "no-store" },
];

const nextConfig: NextConfig = {
  // Fotos já são servidas otimizadas (WebP em tamanhos fixos) a partir do R2 em /fotos.
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: adminNoStoreHeaders,
      },
      {
        source: "/api/admin/:path*",
        headers: adminNoStoreHeaders,
      },
    ];
  },
};

export default nextConfig;
