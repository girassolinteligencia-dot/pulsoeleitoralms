"use client";

// Com o Cloudflare Access, a sessão do admin é o cookie CF_Authorization (mesma origem),
// enviado automaticamente pelo navegador. Não há token a anexar.

export async function getAdminHeaders(init?: HeadersInit) {
  return new Headers(init);
}

export async function adminFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(input, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  // Sessão do Access expirada: recarrega para o Access pedir login de novo.
  if (res.status === 401 && typeof window !== "undefined")
    window.location.reload();
  return res;
}

export async function downloadAdminFile(url: string, filename: string) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Falha ao baixar arquivo administrativo");

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export async function downloadAdminCsv(url: string, filename: string) {
  return downloadAdminFile(url, filename);
}

/** Logout do Cloudflare Access. */
export function adminLogout() {
  window.location.href = "/cdn-cgi/access/logout";
}
