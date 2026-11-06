"use client";

import React, { useState } from "react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ email, senha }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Não foi possível entrar.");
      window.location.href = "/admin/dashboard";
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível entrar.");
      setEnviando(false);
    }
  };

  const campo =
    "w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:border-primary/60";

  return (
    <main className="min-h-[100svh] bg-dark flex items-center justify-center px-4">
      <form
        onSubmit={entrar}
        className="w-full max-w-sm bg-surface-1 border border-border rounded-[2rem] p-8 flex flex-col gap-5"
      >
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/logo.webp"
            alt="PULSO ELEITORAL MS"
            width={180}
            height={54}
            className="h-auto w-44"
            priority
          />
          <p className="text-[10px] text-[#d97757] uppercase font-bold tracking-widest">
            Painel Administrativo
          </p>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            E-mail
          </span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={campo}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase font-bold tracking-widest text-text-muted">
            Senha
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className={campo}
          />
        </label>

        {erro && (
          <p role="alert" className="text-xs text-negative">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="mt-2 px-4 py-3 rounded-full bg-primary text-dark text-xs font-bold uppercase tracking-widest disabled:opacity-50"
        >
          {enviando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
