'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/admin/dashboard`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Link de acesso enviado para seu e-mail!' });
    }
    setLoading(false);
  };

  return (
    <main className="w-full h-[100svh] bg-background flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[400px] bg-surface-1 border border-border rounded-[2.5rem] p-10 flex flex-col gap-8 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display uppercase tracking-widest text-primary">Admin Pulso</h1>
          <p className="text-[10px] text-text-muted uppercase mt-2 tracking-widest">Acesso restrito ao painel de gestão</p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-[9px] uppercase font-bold text-primary tracking-widest ml-2">E-mail Administrativo</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded-2xl px-5 py-4 text-sm focus:outline-none focus:border-primary transition-all"
              placeholder="admin@pulsoeleitoral.com.br"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-center ${
              message.type === 'success' ? 'bg-positive/10 text-positive' : 'bg-negative/10 text-negative'
            }`}>
              {message.text}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-full font-bold text-[10px] uppercase tracking-[0.3em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Entrar com Magic Link'}
          </button>
        </form>

        <p className="text-center text-[9px] text-text-muted uppercase tracking-widest">
          Não tem acesso? Entre em contato com o suporte.
        </p>
      </motion.div>
    </main>
  );
}
