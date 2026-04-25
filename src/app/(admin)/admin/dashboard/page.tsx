'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

interface RecentEvaluation {
  id: string;
  candidato: { nome: string };
  atributo: { nome: string };
  valor: number;
  criado_em: string;
}

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);
  const router = useRouter();

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/recent-evaluations');
      const data = await res.json();
      setRecentEvaluations(data);
    } catch (error) {
      console.error('Error fetching recent evaluations:', error);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!currentSession) {
        router.push('/admin/login');
      } else {
        setSession(currentSession);
        fetchRecent();
      }
      setLoading(false);
    });

    // Real-time subscription
    const channel = supabase
      .channel('avaliacoes_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avaliacoes' }, () => {
        fetchRecent();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router, fetchRecent]);

  if (loading) return (
    <div className="w-full h-[100svh] bg-background flex items-center justify-center text-primary font-display uppercase tracking-widest animate-pulse">
      Sincronizando Painel...
    </div>
  );

  return (
    <main className="w-full h-[100svh] bg-background flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-surface-1 p-10 flex flex-col gap-12">
        <div className="flex flex-col gap-2">
           <h1 className="text-2xl font-bold font-display uppercase tracking-widest text-primary">Admin</h1>
           <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest opacity-50">Pulso Eleitoral v1.0</p>
        </div>
        
        <nav className="flex flex-col gap-6">
          {[
            { id: 'home', label: 'Visão Geral', icon: '📊' },
            { id: 'candidatos', label: 'Candidatos', icon: '👥' },
            { id: 'bloqueios', label: 'Bloqueios', icon: '🛡️' },
            { id: 'campanhas', label: 'Campanhas', icon: '📢' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => router.push(item.id === 'home' ? '/admin/dashboard' : `/admin/dashboard/${item.id}`)}
              className="flex items-center gap-4 text-left text-[11px] uppercase font-bold text-text-muted hover:text-primary transition-all tracking-[0.2em]"
            >
              <span className="text-lg opacity-50">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-4">
           <p className="text-[8px] text-text-muted uppercase tracking-widest px-4">Logado como: {session?.user?.email}</p>
           <button 
            onClick={() => supabase.auth.signOut().then(() => router.push('/admin/login'))}
            className="flex items-center gap-4 text-left text-[10px] uppercase font-bold text-negative tracking-[0.3em] hover:opacity-70 transition-opacity"
          >
            <span>🚪</span> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 p-12 overflow-y-auto no-scrollbar bg-gradient-to-br from-background via-background to-primary/5">
        <header className="flex justify-between items-start mb-16">
          <div>
            <h2 className="text-3xl font-bold font-display uppercase tracking-widest">Atividade</h2>
            <p className="text-[10px] text-text-muted uppercase mt-3 tracking-[0.2em]">Monitoramento em tempo real da plataforma</p>
          </div>
          <div className="flex gap-4">
            <a 
              href="/api/admin/export"
              download
              className="bg-primary/10 border border-primary/20 rounded-2xl px-8 py-5 text-center hover:bg-primary/20 transition-all group"
            >
              <p className="text-[10px] text-primary uppercase font-bold tracking-widest">Baixar Auditoria CSV</p>
            </a>
            <div className="bg-surface-1 border border-border rounded-2xl px-8 py-5 text-center min-w-[140px]">
              <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest">Total Pulsos</p>
              <p className="text-2xl font-bold text-primary mt-2">1.248</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-8">
           <div className="col-span-2 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-sm font-bold uppercase tracking-widest">Pulsos Recentes</h3>
                <span className="px-3 py-1 bg-positive/10 text-positive text-[8px] font-bold uppercase rounded-full animate-pulse">Live</span>
              </div>
              
              <div className="flex flex-col gap-4">
                {recentEvaluations.map(ev => (
                  <div key={ev.id} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-white/10 transition-all">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {ev.valor > 0 ? '+' : ''}
                       </div>
                       <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest">{ev.candidato.nome}</p>
                          <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1">{ev.atributo.nome}</p>
                       </div>
                    </div>
                    <p className="text-[10px] text-text-muted font-mono">{new Date(ev.criado_em).toLocaleTimeString()}</p>
                  </div>
                ))}
                {recentEvaluations.length === 0 && (
                   <p className="text-center py-20 text-text-muted text-[10px] uppercase tracking-widest opacity-40">Aguardando novos pulsos...</p>
                )}
              </div>
           </div>

           <div className="flex flex-col gap-8">
              <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-10">
                <h3 className="text-sm font-bold uppercase tracking-widest mb-8">Status do Nó</h3>
                <div className="flex flex-col gap-6">
                  {[
                    { label: 'Supabase DB', status: 'Online', color: 'bg-positive' },
                    { label: 'Edge Network', status: 'Active', color: 'bg-positive' },
                    { label: 'Realtime WebSocket', status: 'Connected', color: 'bg-positive' }
                  ].map(sys => (
                    <div key={sys.label} className="flex justify-between items-center">
                      <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest">{sys.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[8px] uppercase font-bold text-text-muted opacity-50">{sys.status}</span>
                        <span className={`w-2 h-2 rounded-full ${sys.color} shadow-[0_0_10px_rgba(34,197,94,0.5)]`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-10">
                 <h3 className="text-sm font-bold uppercase tracking-widest mb-4">Dica de Segurança</h3>
                 <p className="text-[11px] text-text-muted leading-relaxed">
                   Monitore picos de atividade de um mesmo hash IP na aba de <strong>Bloqueios</strong> para evitar ataques de coordenação.
                 </p>
              </div>
           </div>
        </div>
      </section>
    </main>
  );
}
