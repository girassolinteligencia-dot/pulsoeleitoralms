'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Rota de Emergência
    if (accessCode === 'GI2026') {
      localStorage.setItem('admin_bypass', 'true');
      router.push('/admin/dashboard');
      return;
    }

    const getURL = () => {
      let url = window.location.origin;
      return url.endsWith('/') ? url : `${url}/`;
    };

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${getURL()}admin/dashboard`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Link de acesso enviado para o seu e-mail!' });
    }
    setLoading(false);
  };

  return (
    <main className="w-full h-[100svh] bg-dark flex items-center justify-center px-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[420px] bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-14 flex flex-col gap-10 shadow-3xl relative z-10"
      >
        <div className="text-center">
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold font-display uppercase tracking-[0.3em] text-[#f5f0e8]"
          >
            VOZ<span className="text-primary">PÚBLICA</span>
          </motion.h1>
          <div className="h-px w-12 bg-primary/40 mx-auto mt-4 mb-3" />
          <p className="text-[9px] text-text-muted uppercase font-bold tracking-[0.4em] opacity-60">Admin Intelligence</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <label className="text-[8px] uppercase font-bold text-text-muted tracking-[0.3em] ml-4">Credencial de Acesso</label>
            <div className="relative group">
              <input 
                type="email" 
                required={!accessCode}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none rounded-2xl px-6 py-5 text-sm text-white transition-all placeholder:text-white/20"
                placeholder="admin@vozpublica.gov"
              />
              <div className="absolute inset-0 rounded-2xl border border-primary/20 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[8px] uppercase font-bold text-text-muted tracking-[0.3em] ml-4">Código Master (Bypass)</label>
            <div className="relative group">
              <input 
                type="password" 
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-primary/50 outline-none rounded-2xl px-6 py-5 text-sm text-white transition-all placeholder:text-white/20"
                placeholder="••••••"
              />
              <div className="absolute inset-0 rounded-2xl border border-primary/20 opacity-0 group-focus-within:opacity-100 pointer-events-none transition-opacity" />
            </div>
          </div>

          {message && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-5 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-center border ${
                message.type === 'success' 
                ? 'bg-positive/5 border-positive/20 text-positive' 
                : 'bg-negative/5 border-negative/20 text-negative'
              }`}
            >
              {message.text}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-6 rounded-full font-bold text-[10px] uppercase tracking-[0.4em] shadow-2xl shadow-primary/30 hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 relative overflow-hidden"
          >
            <span className="relative z-10">{loading ? 'Solicitando...' : 'Entrar no Sistema'}</span>
            {loading && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
          </button>
        </form>

        <footer className="text-center flex flex-col gap-4">
          <p className="text-[8px] text-text-muted uppercase tracking-[0.2em] leading-loose opacity-40">
            Acesso restrito a pessoal autorizado.<br/>Criptografia de ponta-a-ponta ativada.
          </p>
          <div className="flex justify-center gap-6">
             <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
             <div className="w-1.5 h-1.5 rounded-full bg-primary/30" />
             <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
          </div>
        </footer>
      </motion.div>

      {/* Safe Area Padding for notch devices */}
      <div className="fixed top-0 left-0 right-0 h-safe-top pointer-events-none" />
      <div className="fixed bottom-0 left-0 right-0 h-safe-bottom pointer-events-none" />
    </main>
  );
}
