'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { adminFetch, adminLogout } from '@/lib/adminClient';

type AdminProfile = {
  email: string;
  nome?: string | null;
  role: 'admin' | 'editor' | 'viewer';
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';
  const [loading, setLoading] = useState(!isLoginPage);

  const handleLogout = () => adminLogout();

  useEffect(() => {
    if (isLoginPage) return;
    let cancel = false;
    adminFetch('/api/admin/me')
      .then(async (res) => {
        if (cancel) return;
        if (res.status === 401) return; // adminFetch já redireciona para /admin/login
        if (!res.ok) {
          setAccessDenied(true);
          setLoading(false);
          return;
        }
        setAdminProfile(await res.json());
        setLoading(false);
      })
      .catch(() => !cancel && (setAccessDenied(true), setLoading(false)));
    return () => {
      cancel = true;
    };
  }, [router, isLoginPage]);

  if (isLoginPage) return <>{children}</>;

  if (loading) return (
    <div className="w-full h-[100svh] bg-dark flex items-center justify-center text-primary font-display uppercase tracking-widest animate-pulse">
      Autenticando...
    </div>
  );

  if (accessDenied) return (
    <div className="w-full h-[100svh] bg-dark flex flex-col items-center justify-center gap-4 text-center px-4">
      <p className="text-primary font-display uppercase tracking-widest">Acesso administrativo negado</p>
      <p className="text-text-muted text-sm max-w-sm">Não foi possível validar seu acesso. Entre novamente.</p>
      <button onClick={handleLogout} className="px-4 py-2 border border-primary/40 text-primary text-xs uppercase tracking-widest">Sair</button>
    </div>
  );

  const navItems = [
    { id: 'home', label: 'Início', icon: '🏠', path: '/admin/dashboard' },
    { id: 'campanhas', label: 'Ciclos', icon: '🔄', path: '/admin/dashboard/campanhas' },
    { id: 'candidatos', label: 'Políticos', icon: '👥', path: '/admin/dashboard/candidatos' },
    { id: 'orgaos', label: 'Órgãos Públicos', icon: '🏛️', path: '/admin/orgaos' },
    { id: 'servicos', label: 'Serviços Públicos', icon: '🔧', path: '/admin/servicos' },
    { id: 'moderacao', label: 'Moderação', icon: '⚖️', path: '/admin/moderacao' },
    { id: 'metodologia', label: 'Metodologia', icon: '🧭', path: '/admin/metodologia' },
    { id: 'territorio', label: 'Território', icon: '🗺️', path: '/admin/territorio' },
    { id: 'relatorios', label: 'Relatórios', icon: '📊', path: '/admin/relatorios' },
    { id: 'landing', label: 'Landing Page', icon: '🖥️', path: '/admin/landing' },
    ...(adminProfile?.role === 'admin'
      ? [{ id: 'usuarios', label: 'Usuários', icon: '👤', path: '/admin/usuarios' }]
      : []),
    { id: 'sistema', label: 'Sistema', icon: '🔧', path: '/admin/sistema' },
  ];

  return (
    <div className="w-full h-screen bg-dark flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Bottom Nav */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 bg-dark-mid/95 backdrop-blur-xl [padding-bottom:env(safe-area-inset-bottom)] md:hidden"
        aria-label="Navegação administrativa"
      >
        <div className="flex h-20 items-stretch gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [-ms-overflow-style:none]">
          {navItems.map(item => (
            <button
              type="button"
              key={item.id}
              onClick={() => router.push(item.path)}
              aria-current={pathname === item.path ? 'page' : undefined}
              className={`flex min-w-[76px] flex-none flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center transition-all ${pathname === item.path ? 'bg-primary/10 text-primary' : 'text-text-muted opacity-65'}`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="max-w-full truncate text-[8px] uppercase font-bold tracking-wider leading-none">{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-[76px] flex-none flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-negative opacity-70 transition-all"
          >
            <span className="text-lg leading-none">🚪</span>
            <span className="text-[8px] uppercase font-bold tracking-wider leading-none">Sair</span>
          </button>
        </div>
      </nav>

      {/* Sidebar - Desktop only */}
      <aside className="hidden md:flex w-60 flex-col shrink-0 border-r border-border bg-surface-1 overflow-hidden">
        {/* Logo area */}
        <div className="flex flex-col items-center gap-1 px-6 pt-6 pb-4 shrink-0">
          <Image src="/logo.webp" alt="PULSO ELEITORAL MS" width={180} height={54} className="w-full h-auto object-contain" />
          <p className="text-[8px] text-[#d97757] uppercase font-bold tracking-widest text-center">Painel Administrativo</p>
          <p className="text-[8px] text-text-muted uppercase font-bold tracking-widest text-center truncate w-full opacity-60">{adminProfile?.email}</p>
          {adminProfile && (
            <p className="text-[8px] text-primary uppercase font-bold tracking-widest text-center">
              {adminProfile.role}
            </p>
          )}
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
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 text-left text-[9px] uppercase font-bold text-negative tracking-[0.2em] hover:opacity-70 transition-opacity"
          >
            <span>🚪</span> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="flex-1 overflow-y-auto min-w-0 bg-gradient-to-br from-dark via-dark to-primary/5 pb-24 md:pb-0">
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
