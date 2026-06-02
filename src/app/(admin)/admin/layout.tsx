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
    <div className="w-full h-screen bg-dark flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 [padding-bottom:env(safe-area-inset-bottom)] bg-dark-mid/95 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-2 z-50 md:hidden">
        {navItems.slice(0, 5).map(item => (
          <button
            type="button"
            key={item.id}
            onClick={() => router.push(item.path)}
            className={`flex flex-col items-center gap-1 px-2 py-1 transition-all ${pathname === item.path ? 'text-primary' : 'text-text-muted opacity-60'}`}
          >
            <span className="text-lg leading-none">{item.icon}</span>
            <span className="text-[7px] uppercase font-bold tracking-wider leading-none">{item.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-2 py-1 text-negative opacity-60"
        >
          <span className="text-lg leading-none">🚪</span>
          <span className="text-[7px] uppercase font-bold tracking-wider leading-none">Sair</span>
        </button>
      </nav>

      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex w-60 flex-col shrink-0 border-r border-border bg-surface-1 overflow-hidden">
        {/* Logo area */}
        <div className="flex flex-col gap-2 px-6 pt-6 pb-4 shrink-0">
          <Image src="/logo.webp" alt="PULSO ELEITORAL MS" width={180} height={54} className="w-full h-auto object-contain" />
          <p className="text-[7px] text-text-muted uppercase font-bold tracking-widest opacity-40">Painel Administrativo</p>
        </div>

        {/* Nav scrollable */}
        <nav className="flex-1 overflow-y-auto px-6 py-2 flex flex-col gap-1 min-h-0">
          {navItems.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-xl text-[10px] uppercase font-bold transition-all tracking-[0.15em] w-full ${pathname === item.path ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
            >
              <span className={`text-base shrink-0 transition-opacity ${pathname === item.path ? 'opacity-100' : 'opacity-40'}`}>{item.icon}</span>
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-white/5 flex flex-col gap-3">
          <p className="text-[7px] text-text-muted uppercase tracking-widest truncate opacity-40">{session?.user?.email}</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 text-left text-[9px] uppercase font-bold text-negative tracking-[0.2em] hover:opacity-70 transition-opacity"
          >
            <span>🚪</span> Sair
          </button>
          <div className="flex items-center gap-2 pt-1">
            <Image src="/gi-logo.png" alt="Girassol Inteligência" width={14} height={14} className="rounded-full opacity-50" />
            <span className="text-[6px] text-text-muted uppercase tracking-[0.15em] opacity-40">Girassol Inteligência 2026</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 overflow-y-auto min-w-0 bg-gradient-to-br from-dark via-dark to-primary/5 pb-16 md:pb-0">
        <div className="p-5 md:p-8 lg:p-10">
          {pathname !== '/admin/dashboard' && (
            <button
              type="button"
              onClick={() => router.push('/admin/dashboard')}
              className="mb-6 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest text-text-muted hover:text-primary transition-colors group"
            >
              <span className="text-lg group-hover:-translate-x-1 transition-transform">←</span> Voltar ao Painel
            </button>
          )}
          {children}
        </div>
      </section>
    </div>
  );
}
