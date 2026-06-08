'use client';

import { supabase } from '@/lib/supabase';

export async function getAdminHeaders(init?: HeadersInit) {
  const headers = new Headers(init);
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  return headers;
}

export async function adminFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const headers = await getAdminHeaders(init.headers);

  if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

export async function downloadAdminFile(url: string, filename: string) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error('Falha ao baixar arquivo administrativo');

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
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
