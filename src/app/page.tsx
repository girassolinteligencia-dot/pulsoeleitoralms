'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { TOKENS } from '@/lib/tokens';

interface Fragment {
  id: number;
  x: number[];
  y: number[];
  left: string;
  top: string;
  duration: number;
}

interface LandingTextos {
  landing_titulo_linha1: string;
  landing_titulo_linha2: string;
  landing_subtitulo: string;
  landing_cta_principal: string;
  landing_cta_secundario: string;
  landing_passo_1: string;
  landing_passo_2: string;
  landing_passo_3: string;
  landing_reforco: string;
}

const DEFAULTS: LandingTextos = {
  landing_titulo_linha1: 'Não é uma pesquisa.',
  landing_titulo_linha2: 'É o futuro de MS.',
  landing_subtitulo: 'PULSO ELEITORAL MS é a plataforma de inteligência e percepção pública do Mato Grosso do Sul. Um espaço seguro, projetado para que sua visão modele as Eleições de 2026.',
  landing_cta_principal: 'Expressar Minha Visão',
  landing_cta_secundario: 'Acesso Restrito',
  landing_passo_1: 'Informe sua região',
  landing_passo_2: 'Escolha um político',
  landing_passo_3: 'Dê sua opinião',
  landing_reforco: 'Leva menos de 2 minutos. Sem cadastro, sem identificação.',
};

export default function LandingPage() {
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [textos, setTextos] = useState<LandingTextos>(DEFAULTS);

  useEffect(() => {
    fetch('/api/configuracoes/public')
      .then(r => r.json())
      .then((data: Record<string, string>) => {
        setTextos({
          landing_titulo_linha1: data.landing_titulo_linha1 || DEFAULTS.landing_titulo_linha1,
          landing_titulo_linha2: data.landing_titulo_linha2 || DEFAULTS.landing_titulo_linha2,
          landing_subtitulo: data.landing_subtitulo || DEFAULTS.landing_subtitulo,
          landing_cta_principal: data.landing_cta_principal || DEFAULTS.landing_cta_principal,
          landing_cta_secundario: data.landing_cta_secundario || DEFAULTS.landing_cta_secundario,
          landing_passo_1: data.landing_passo_1 || DEFAULTS.landing_passo_1,
          landing_passo_2: data.landing_passo_2 || DEFAULTS.landing_passo_2,
          landing_passo_3: data.landing_passo_3 || DEFAULTS.landing_passo_3,
          landing_reforco: data.landing_reforco || DEFAULTS.landing_reforco,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newFragments = [...Array(6)].map((_, i) => ({
        id: i,
        x: [Math.random() * 800 - 400, Math.random() * 800 - 400],
        y: [Math.random() * 800 - 400, Math.random() * 800 - 400],
        left: `${10 + Math.random() * 80}%`,
        top: `${10 + Math.random() * 80}%`,
        duration: Math.random() * 10 + 15,
      }));
      setFragments(newFragments);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="relative h-[100svh] w-full bg-[#141413] flex flex-col items-center justify-center overflow-hidden selection:bg-[#d97757]/30 px-safe">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      {/* Floating Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d97757] rounded-full blur-[120px] opacity-[0.05]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c8933a] rounded-full blur-[120px] opacity-[0.03]" />

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center gap-6 sm:gap-8"
        >
          {/* Logo Principal */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative mb-2"
          >
            <Image
              src="/logo.webp"
              alt="PULSO ELEITORAL MS"
              width={480}
              height={160}
              className="w-[280px] sm:w-[380px] md:w-[480px] h-auto object-contain drop-shadow-[0_0_40px_rgba(217,119,87,0.25)] mix-blend-screen"
              priority
            />
          </motion.div>

          {/* Heading */}
          <div className="space-y-4">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[#f5f0e8] leading-[1.1]"
              style={{ fontFamily: TOKENS.FONTS.DISPLAY }}
            >
              {textos.landing_titulo_linha1} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97757] via-[#c8933a] to-[#d97757]">
                {textos.landing_titulo_linha2}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-sm sm:text-lg md:text-xl text-[#b0aea5] max-w-lg mx-auto leading-relaxed px-4"
              style={{ fontFamily: TOKENS.FONTS.BODY }}
            >
              {textos.landing_subtitulo}
            </motion.p>
          </div>

          {/* Como funciona */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            className="w-full max-w-xl flex flex-col items-center gap-4"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-0 w-full">
              {[
                { icone: '📍', texto: textos.landing_passo_1 },
                { icone: '👤', texto: textos.landing_passo_2 },
                { icone: '✅', texto: textos.landing_passo_3 },
              ].map((passo, i) => (
                <React.Fragment key={i}>
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#d97757]/10 border border-[#d97757]/20 flex items-center justify-center text-lg">
                      {passo.icone}
                    </div>
                    <span
                      className="text-[10px] sm:text-[11px] text-[#b0aea5] uppercase tracking-[0.18em] font-bold text-center leading-relaxed"
                      style={{ fontFamily: TOKENS.FONTS.DISPLAY }}
                    >
                      {passo.texto}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className="hidden sm:block w-8 shrink-0 text-center text-[#3d3128] text-lg font-bold">→</div>
                  )}
                  {i < 2 && (
                    <div className="sm:hidden w-px h-4 bg-[#3d3128]" />
                  )}
                </React.Fragment>
              ))}
            </div>
            <p
              className="text-[10px] sm:text-[11px] text-[#7a6e64] tracking-[0.15em] text-center"
              style={{ fontFamily: TOKENS.FONTS.BODY }}
            >
              {textos.landing_reforco}
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 w-full"
          >
            <Link href="/avaliar">
              <button type="button" className="px-8 py-4 rounded-full bg-[#d97757] text-[#f5f0e8] font-bold text-xs sm:text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#c4633d] hover:scale-105 active:scale-95 shadow-xl whitespace-nowrap">
                {textos.landing_cta_principal}
              </button>
            </Link>

            <Link href="/admin/dashboard">
              <button type="button" className="px-8 py-4 rounded-full bg-[#1c1814]/50 backdrop-blur-md border border-[#3d3128] text-[#f5f0e8] font-bold text-xs sm:text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#3d3128] whitespace-nowrap">
                {textos.landing_cta_secundario}
              </button>
            </Link>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-[#7a6e64] text-[8px] sm:text-[10px] uppercase tracking-widest font-bold"
          >
            <span className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#d97757]" />
              Anônimo
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#c8933a]" />
              Criptografado
            </span>
            <span className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-[#a8c47a]" />
              MS-2026
            </span>
            <Link href="/privacidade" className="hover:text-[#d97757] transition-colors">Privacidade</Link>
            <Link href="/termos" className="hover:text-[#d97757] transition-colors">Termos</Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Decorative Fragments */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {fragments.map((frag) => (
          <motion.div
            key={frag.id}
            className="absolute w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-[#d97757]/10"
            animate={{ x: frag.x, y: frag.y, opacity: [0.1, 0.3, 0.1] }}
            transition={{ duration: frag.duration, repeat: Infinity, ease: 'linear' }}
            style={{ left: frag.left, top: frag.top }}
          />
        ))}
      </div>
    </main>
  );
}
