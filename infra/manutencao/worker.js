const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pulso Eleitoral MS</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;background:#0b1020;color:#e8ecf5;text-align:center;padding:16px}h1{font-size:1.8rem;margin:0 0 .5rem}p{opacity:.8;max-width:32rem}</style></head><body><main><h1>Pulso Eleitoral MS</h1><p>Estamos migrando a plataforma para uma nova infraestrutura. Voltamos em breve.</p></main></body></html>`;
export default {
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/health") return Response.json({ status: "maintenance" }, { status: 503 });
    return new Response(html, { status: 503, headers: { "content-type": "text/html; charset=utf-8", "retry-after": "3600", "cache-control": "no-store" } });
  },
};
