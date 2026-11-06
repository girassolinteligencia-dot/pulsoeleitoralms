import "server-only";

/** IP real do cliente na Cloudflare (cf-connecting-ip), com fallback para dev. */
export function clientIp(headers: Headers): string {
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "127.0.0.1"
  );
}
