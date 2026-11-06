"use client";

// A sessão do admin é o cookie HttpOnly "pulso_admin" (mesma origem), enviado
// automaticamente pelo navegador. Não há token a anexar.

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
  // Sessão expirada: volta para a tela de login.
  if (
    res.status === 401 &&
    typeof window !== "undefined" &&
    window.location.pathname !== "/admin/login"
  )
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa proposital (cookie de sessão)
    window.location.href = "/admin/login";
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

export async function adminLogout() {
  await fetch("/api/admin/auth/logout", { method: "POST", credentials: "same-origin" }).catch(() => {});
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- recarga completa proposital (cookie de sessão)
  window.location.href = "/admin/login";
}
