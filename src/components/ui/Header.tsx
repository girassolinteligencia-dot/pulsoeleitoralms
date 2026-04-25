'use client';

import React from 'react';
import Image from 'next/image';

/**
 * Header oficial com logoPulse e identificação da plataforma.
 */
export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-[#141413]/40 border-b border-[#3d3128]/30">
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <Image
            src="/gi/logo-64.png"
            alt="PulsoEleitoral"
            width={40}
            height={40}
            className="animate-logoPulse"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-sm font-bold font-display uppercase tracking-widest text-[#f5f0e8]">
            Pulso<span className="text-[#d97757]">Eleitoral</span>
          </h1>
          <span className="text-[7px] font-bold text-[#7a6e64] uppercase tracking-[0.4em]">Mato Grosso do Sul 2026</span>
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-1.5 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20">
        <div className="w-1.5 h-1.5 rounded-full bg-[#c8933a] animate-pulse" />
        <span className="text-[#c8933a] text-[8px] font-bold uppercase tracking-widest">Live</span>
      </div>
    </header>
  );
};
