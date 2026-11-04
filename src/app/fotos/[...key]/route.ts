import { bindings } from "@/server/cf";

// Serve fotos do bucket R2 com cache de borda longo (as chaves são imutáveis por versão).
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key } = await params;
  const objectKey = key.map(decodeURIComponent).join("/");
  if (!objectKey || objectKey.includes(".."))
    return new Response("Not found", { status: 404 });

  const obj = await bindings().FOTOS.get(objectKey);
  if (!obj) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  headers.set(
    "content-type",
    obj.httpMetadata?.contentType || guessType(objectKey),
  );
  headers.set(
    "cache-control",
    "public, max-age=86400, s-maxage=2592000, immutable",
  );
  headers.set("etag", obj.httpEtag);
  headers.set("x-content-type-options", "nosniff");
  return new Response(obj.body as unknown as ReadableStream, { headers });
}

function guessType(k: string) {
  const ext = k.split(".").pop()?.toLowerCase();
  return (
    {
      webp: "image/webp",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      svg: "image/svg+xml",
      ico: "image/x-icon",
    }[ext ?? ""] || "application/octet-stream"
  );
}
