"use client";

// Cloudflare Turnstile invisível: o token é gerado no momento do envio
// (vale 5 minutos e é de uso único). Sem site key configurada, devolve null.

type Turnstile = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  execute: (widgetId: string) => void;
  reset: (widgetId: string) => void;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<Turnstile> | null = null;

function loadScript(): Promise<Turnstile> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () =>
        window.turnstile
          ? resolve(window.turnstile)
          : reject(new Error("Turnstile indisponível"));
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("Falha ao carregar o Turnstile"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/** Pré-carrega o script (chamar ao abrir o fluxo de avaliação). */
export function preloadTurnstile() {
  if (SITE_KEY && typeof window !== "undefined")
    loadScript().catch(() => undefined);
}

/** Gera um token novo. Resolve null se não houver site key; rejeita se o desafio falhar. */
export async function getTurnstileToken(
  timeoutMs = 20_000,
): Promise<string | null> {
  if (!SITE_KEY) return null;
  const ts = await loadScript();
  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.bottom = "16px";
  host.style.right = "16px";
  host.style.zIndex = "9999";
  document.body.appendChild(host);

  return new Promise<string>((resolve, reject) => {
    let widgetId = "";
    const cleanup = () => {
      clearTimeout(timer);
      try {
        if (widgetId) ts.remove(widgetId);
      } catch {}
      host.remove();
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Tempo esgotado na verificação anti-robô"));
    }, timeoutMs);

    widgetId = ts.render(host, {
      sitekey: SITE_KEY,
      action: "avaliar",
      appearance: "interaction-only", // só aparece se a Cloudflare pedir interação
      execution: "execute",
      callback: (token: string) => {
        cleanup();
        resolve(token);
      },
      "error-callback": () => {
        cleanup();
        reject(new Error("Verificação anti-robô falhou"));
      },
    });
    ts.execute(widgetId);
  });
}
