'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Header oficial com logoPulse e identificação da plataforma.
 */
export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 backdrop-blur-md bg-[#141413]/55 border-b border-[#3d3128]/30">
      <div className="flex items-center gap-3 min-w-0">
        <Image
          src="/favicon.webp"
          alt="PULSO ELEITORAL MS"
          width={36}
          height={36}
          className="shrink-0 rounded-xl animate-logoPulse"
        />
        <Image
          src="/logo.webp"
          alt="PULSO ELEITORAL MS"
          width={120}
          height={40}
          className="h-7 w-auto object-contain"
        />
      </div>

      <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-[#c8933a] animate-pulse" />
        <span className="text-[#c8933a] text-[8px] font-bold uppercase tracking-widest">Live</span>
      </div>
    </header>
  );
};
