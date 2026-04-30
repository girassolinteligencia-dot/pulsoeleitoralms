'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface RecentEvaluation {
  id: string;
  candidato: { nome: string };
  atributo: { nome: string };
  valor: number;
  criado_em: string;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);
  const [stats, setStats] = useState({ totalEvaluations: 0 });
  const router = useRouter();

  const fetchRecent = useCallback(async () => {
    try {
      const [resRecent, resStats] = await Promise.all([
        fetch('/api/admin/recent-evaluations'),
        fetch('/api/admin/stats')
      ]);
      
      const [dataRecent, dataStats] = await Promise.all([
        resRecent.json(),
        resStats.json()
      ]);

      setRecentEvaluations(dataRecent);
      setStats(dataStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      // Verifica Bypass de Emergência primeiro
      const hasBypass = typeof window !== 'undefined' && localStorage.getItem('admin_bypass') === 'true';
      
      if (hasBypass) {
        fetchRecent();
        setLoading(false);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        router.push('/admin/login');
      } else {
        fetchRecent();
        
        // Ativa Real-time apenas com sessão real para evitar erros de JWT
        const channel = supabase
          .channel('avaliacoes_realtime')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'avaliacoes' }, () => {
            fetchRecent();
          })
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      }
      setLoading(false);
    };

    checkAuth();
  }, [router, fetchRecent]);

  if (loading) return (
    <div className="w-full h-[100svh] bg-background flex items-center justify-center text-primary font-display uppercase tracking-widest animate-pulse">
      Sincronizando Painel...
    </div>
  );

  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <header className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Visão Geral</h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-[0.2em]">Monitoramento de pulso em tempo real</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <a 
            href="/api/admin/export"
            download
            className="bg-primary/10 border border-primary/20 rounded-2xl px-6 py-4 md:px-8 md:py-5 text-center hover:bg-primary/20 transition-all group flex-1 md:flex-none"
          >
            <p className="text-[9px] md:text-[10px] text-primary uppercase font-bold tracking-widest">Baixar Auditoria</p>
          </a>
          <div className="bg-surface-1 border border-border rounded-2xl px-6 py-4 md:px-8 md:py-5 text-center min-w-[140px] flex-1 md:flex-none">
            <p className="text-[8px] md:text-[9px] text-text-muted uppercase font-bold tracking-widest">Total Avaliações</p>
            <p className="text-xl md:text-2xl font-bold text-primary mt-1 md:mt-2">{stats.totalEvaluations.toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 md:p-10">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest">Últimas Interações</h3>
              <span className="px-3 py-1 bg-positive/10 text-positive text-[8px] font-bold uppercase rounded-full animate-pulse tracking-widest">Atividade Live</span>
            </div>
            
            <div className="flex flex-col gap-4">
              {recentEvaluations.map(ev => (
                <div key={ev.id} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs group-hover:scale-110 transition-transform">
                        {ev.valor > 0 ? '+' : ''}
                     </div>
                     <div>
                        <p className="text-[11px] font-bold uppercase tracking-widest">{ev.candidato.nome}</p>
                        <p className="text-[9px] text-text-muted uppercase tracking-widest mt-1 opacity-60">{ev.atributo.nome}</p>
                     </div>
                  </div>
                  <p className="text-[10px] text-text-muted font-mono opacity-40">{new Date(ev.criado_em).toLocaleTimeString()}</p>
                </div>
              ))}
              {recentEvaluations.length === 0 && (
                 <div className="py-24 text-center">
                    <p className="text-text-muted text-[10px] uppercase tracking-widest opacity-30 italic">Aguardando sinal das urnas digitais...</p>
                 </div>
              )}
            </div>
         </div>

         <div className="flex flex-col gap-8">
            <div className="bg-white/[0.02] backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-6 md:p-10">
              <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest mb-8">Status da Infraestrutura</h3>
              <div className="flex flex-col gap-8">
                {[
                  { label: 'Supabase DB', status: 'Sincronizado', color: 'bg-positive' },
                  { label: 'Edge Nodes', status: 'Global', color: 'bg-positive' },
                  { label: 'WebSocket', status: 'Ativo', color: 'bg-positive' }
                ].map(sys => (
                  <div key={sys.label} className="flex justify-between items-center border-b border-white/5 pb-4 last:border-0 last:pb-0">
                    <span className="text-[10px] uppercase font-bold text-text-muted tracking-widest opacity-60">{sys.label}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[8px] uppercase font-bold text-text-muted opacity-40 tracking-widest">{sys.status}</span>
                      <span className={`w-2 h-2 rounded-full ${sys.color} shadow-[0_0_12px_rgba(34,197,94,0.6)] animate-pulse`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] group-hover:bg-primary/20 transition-all" />
               <h3 className="text-xs font-bold uppercase tracking-widest mb-4 relative z-10">Inteligência de Segurança</h3>
               <p className="text-[11px] text-text-muted leading-relaxed opacity-80 relative z-10">
                 Hashes com mais de 10 avaliações por minuto são automaticamente sinalizados para revisão manual na aba de segurança.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
