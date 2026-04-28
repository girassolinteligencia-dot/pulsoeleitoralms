'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';
import { Session } from '@supabase/supabase-js';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('admin_bypass');
    supabase.auth.signOut().then(() => router.push('/admin/login'));
  };

  useEffect(() => {
    // Definimos os e-mails permitidos
    const ALLOWED_EMAILS = [
      'paulo@vozpublica.com.br',
      'contato@vozpublica.com.br',
      'girassolinteligencia@gmail.com'
    ];

    const checkSession = async () => {
      // Bypass de Emergência
      if (localStorage.getItem('admin_bypass') === 'true') {
        setLoading(false);
        return;
      }

      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const userEmail = currentSession?.user?.email?.toLowerCase().trim() || '';

      if (!currentSession || !ALLOWED_EMAILS.includes(userEmail)) {
        if (currentSession) await supabase.auth.signOut();
        router.push('/admin/login');
      } else {
        setSession(currentSession);
        setLoading(false);
      }
    };

    // Escuta mudanças de estado
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      const hasBypass = typeof window !== 'undefined' && localStorage.getItem('admin_bypass') === 'true';
      
      if (event === 'SIGNED_IN') {
        const userEmail = currentSession?.user?.email?.toLowerCase().trim() || '';
        if (ALLOWED_EMAILS.includes(userEmail)) {
          setSession(currentSession);
          setLoading(false);
        } else {
          supabase.auth.signOut().then(() => {
            if (!hasBypass) router.push('/admin/login');
          });
        }
      } else if (event === 'SIGNED_OUT') {
        if (!hasBypass) router.push('/admin/login');
      }
    });

    checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (loading) return (
    <div className="w-full h-[100svh] bg-dark flex items-center justify-center text-primary font-display uppercase tracking-widest animate-pulse">
      Autenticando...
    </div>
  );

  const navItems = [
    { id: 'home', label: 'Início', icon: '📊', path: '/admin/dashboard' },
    { id: 'candidatos', label: 'Candidatos', icon: '👥', path: '/admin/dashboard/candidatos' },
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
        <div className="flex flex-col gap-2">
           <h1 className="text-2xl font-bold font-display uppercase tracking-widest text-[#f5f0e8]">
             VOZ<span className="text-[#d97757]">PÚBLICA</span> <span className="opacity-30 ml-2 text-xs">ADMIN</span>
           </h1>
           <p className="text-[9px] text-text-muted uppercase font-bold tracking-widest opacity-50">Voz Pública v1.0</p>
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
          <button 
            onClick={() => router.push('/admin/dashboard/campanhas')}
            className="flex items-center gap-4 text-left text-[11px] uppercase font-bold text-text-muted hover:text-white transition-all tracking-[0.2em]"
          >
            <span className="text-lg opacity-40">📢</span>
            Campanhas
          </button>
        </nav>

        <div className="mt-auto flex flex-col gap-4">
           <p className="text-[8px] text-text-muted uppercase tracking-widest px-4 truncate opacity-40">User: {session?.user?.email}</p>
           <button 
            onClick={handleLogout}
            className="flex items-center gap-4 text-left text-[10px] uppercase font-bold text-negative tracking-[0.3em] hover:opacity-70 transition-opacity"
          >
            <span>🚪</span> Sair do Sistema
          </button>
        </div>
      </aside>

      {/* Main Content Scroll Area */}
      <section className="flex-1 overflow-y-auto no-scrollbar bg-gradient-to-br from-dark via-dark to-primary/5">
        <div className="p-6 md:p-12 min-h-full">
          {children}
        </div>
      </section>
    </main>
  );
}
