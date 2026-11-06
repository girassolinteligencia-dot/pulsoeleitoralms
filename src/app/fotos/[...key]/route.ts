import { bindings } from "@/server/cf";

// Somente imagens raster: SVG/HTML servidos no mesmo domínio poderiam executar script (XSS).
// O content-type vem SEMPRE da extensão (nunca do metadata gravado no upload).
const TIPOS_PERMITIDOS: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  ico: "image/x-icon",
};

// Serve fotos do bucket R2 com cache de borda longo.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.map(decodeURIComponent).join("/");
  const ext = objectKey.split(".").pop()?.toLowerCase() ?? "";
  const contentType = TIPOS_PERMITIDOS[ext];
  if (!objectKey || objectKey.includes("..") || !contentType) {
    return new Response("Not found", { status: 404 });
  }

  const obj = await bindings().FOTOS.get(objectKey);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers({
    "content-type": contentType,
    "cache-control": "public, max-age=86400, s-maxage=2592000, immutable",
    etag: obj.httpEtag,
    "x-content-type-options": "nosniff",
    "content-security-policy": "default-src 'none'; sandbox",
    "cross-origin-resource-policy": "same-site",
  });
  return new Response(obj.body as unknown as ReadableStream, { headers });
}
