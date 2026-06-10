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
}

export default function LandingClient({ textos }: { textos: LandingTextos }) {
  const [fragments, setFragments] = useState<Fragment[]>([]);

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
    <main className="relative min-h-[100svh] w-full bg-[#141413] flex flex-col items-center selection:bg-[#d97757]/30 overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#d97757] rounded-full blur-[120px] opacity-[0.05]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#c8933a] rounded-full blur-[120px] opacity-[0.03]" />

      <div className="relative z-10 w-full max-w-4xl px-6 text-center flex flex-col items-center justify-center flex-1 py-12 sm:py-16">
        <div className="flex flex-col items-center gap-5 sm:gap-7 w-full">

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <Image
              src="/logo.webp"
              alt="PULSO ELEITORAL MS"
              width={480}
              height={160}
              className="w-[300px] sm:w-[480px] md:w-[630px] h-auto object-contain drop-shadow-[0_0_40px_rgba(217,119,87,0.25)] mix-blend-screen"
              priority
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-5 sm:gap-7 w-full"
          >
            <div className="space-y-3">
              <h1
                className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-[#f5f0e8] leading-[1.1]"
                style={{ fontFamily: TOKENS.FONTS.DISPLAY }}
              >
                {textos.landing_titulo_linha1} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d97757] via-[#c8933a] to-[#d97757]">
                  {textos.landing_titulo_linha2}
                </span>
              </h1>

              <p
                className="text-xs sm:text-base md:text-lg text-[#b0aea5] max-w-lg mx-auto leading-relaxed px-2"
                style={{ fontFamily: TOKENS.FONTS.BODY }}
              >
                {textos.landing_subtitulo}
              </p>
            </div>

            <Link href="/avaliar">
              <button type="button" className="px-10 py-4 rounded-full bg-[#d97757] text-[#f5f0e8] font-bold text-xs sm:text-sm uppercase tracking-[0.2em] transition-all hover:bg-[#c4633d] hover:scale-105 active:scale-95 shadow-xl whitespace-nowrap">
                {textos.landing_cta_principal}
              </button>
            </Link>

            <div className="flex items-center justify-center gap-5 text-[#7a6e64] text-[8px] sm:text-[10px] uppercase tracking-widest font-bold">
              {[
                { href: '/privacidade', label: 'Privacidade' },
                { href: '/termos', label: 'Termos' },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-1.5 hover:text-[#d97757] transition-colors">
                  <motion.div
                    className="w-1 h-1 rounded-full bg-[#d97757] shrink-0"
                    animate={{ opacity: [1, 0.15, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {item.label}
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

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
