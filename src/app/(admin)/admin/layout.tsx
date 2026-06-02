'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Session } from '@supabase/supabase-js';
import Image from 'next/image';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';
  const [loading, setLoading] = useState(!isLoginPage);

  const handleLogout = () => {
    supabase.auth.signOut().then(() => router.push('/admin/login'));
  };

  useEffect(() => {
    if (isLoginPage) return;

    const checkSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (!currentSession) {
        router.push('/admin/login');
      } else {
        setSession(currentSession);
        setLoading(false);
      }
    };

    // Escuta mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      if (event === 'SIGNED_IN') {
        if (currentSession) {
          setSession(currentSession);
          setLoading(false);
        } else {
          supabase.auth.signOut().then(() => {
            router.push('/admin/login');
          });
        }
      } else if (event === 'SIGNED_OUT') {
        router.push('/admin/login');
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (loading) return (
    <div className="w-full h-[100svh] bg-dark flex items-center justify-center text-primary font-display uppercase tracking-widest animate-pulse">
      Autenticando...
    </div>
  );

  const navItems = [
    { id: 'home', label: 'Início', icon: '🏠', path: '/admin/dashboard' },
    { id: 'campanhas', label: 'Campanhas', icon: '📢', path: '/admin/dashboard/campanhas' },
    { id: 'candidatos', label: 'Candidatos', icon: '👥', path: '/admin/dashboard/candidatos' },
    { id: 'atributos', label: 'Atributos', icon: '🏷️', path: '/admin/atributos' },
    { id: 'moderacao', label: 'Moderação', icon: '⚖️', path: '/admin/moderacao' },
    { id: 'metodologia', label: 'Metodologia', icon: '🧭', path: '/admin/metodologia' },
    { id: 'territorio', label: 'Território', icon: '🗺️', path: '/admin/territorio' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊', path: '/admin/relatorios' },
    { id: 'auditoria', label: 'Auditoria', icon: '🧾', path: '/admin/auditoria' },
    { id: 'landing', label: 'Landing Page', icon: '🖥️', path: '/admin/landing' },
    { id: 'configuracoes', label: 'Configurações', icon: '⚙️', path: '/admin/dashboard/configuracoes' },
    { id: 'bloqueios', label: 'Segurança', icon: '🛡️', path: '/admin/dashboard/bloqueios' },
  ];

  return (
    <main className="w-full h-[100svh] bg-dark flex flex-col md:flex-row overflow-hidden relative">
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-dark-mid/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6 z-50 md:hidden pb-safe">
        {navItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 transition-all ${pathname === item.path ? 'text-primary scale-110' : 'text-text-muted opacity-60'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-[8px] uppercase font-bold tracking-widest">{item.label}</span>
          </button>
        ))}
        <button 
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 text-negative opacity-60"
        >
          <span className="text-xl">🚪</span>
          <span className="text-[8px] uppercase font-bold tracking-widest">Sair</span>
        </button>
      </nav>

      {/* Sidebar - Hidden on Mobile */}
      <aside className="hidden md:flex w-72 border-r border-border bg-surface-1 p-10 flex-col gap-12 shrink-0">
        <div className="flex flex-col gap-3">
          <Image src="/logo.webp" alt="PULSO ELEITORAL MS" width={200} height={60} className="w-full h-auto object-contain" />
          <p className="text-[8px] text-text-muted uppercase font-bold tracking-widest opacity-40">Painel Administrativo</p>
        </div>
        
        <nav className="flex flex-col gap-6">
          {navItems.map(item => (
            <button 
              key={item.id} 
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-4 text-left text-[11px] uppercase font-bold transition-all tracking-[0.2em] ${pathname === item.path ? 'text-primary' : 'text-text-muted hover:text-white'}`}
            >
              <span className={`text-lg transition-opacity ${pathname === item.path ? 'opacity-100' : 'opacity-40'}`}>{item.icon}</span>
              {item.label}
            </button>
          ))}

        </nav>

        <div className="mt-auto flex flex-col gap-4">
           <p className="text-[8px] text-text-muted uppercase tracking-widest px-4 truncate opacity-40">User: {session?.user?.email}</p>
           <button
            onClick={handleLogout}
            className="flex items-center gap-4 text-left text-[10px] uppercase font-bold text-negative tracking-[0.3em] hover:opacity-70 transition-opacity"
          >
            <span>🚪</span> Sair do Sistema
          </button>
          <div className="flex items-center gap-2 pt-2 border-t border-white/5">
            <Image src="/gi-logo.png" alt="Girassol Inteligência" width={16} height={16} className="rounded-full opacity-50" />
            <span className="text-[7px] text-text-muted uppercase tracking-[0.18em] opacity-40">Girassol Inteligência 2026</span>
          </div>
        </div>
      </aside>

      {/* Main Content Scroll Area */}
      <section className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-br from-dark via-dark to-primary/5">
        <div className="p-6 md:p-12 min-h-full">
          {/* Botão Voltar para sub-páginas */}
          {pathname !== '/admin/dashboard' && (
            <button 
              onClick={() => router.push('/admin/dashboard')} 
              className="mb-8 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-text-muted hover:text-primary transition-colors group"
            >
              <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Painel
            </button>
          )}
          {children}
        </div>
      </section>
    </main>
  );
}
