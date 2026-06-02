'use client';

import React from 'react';
import Image from 'next/image';

export const Header: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 py-3 flex items-center justify-between backdrop-blur-md bg-[#141413]/55 border-b border-[#3d3128]/30">
      <div className="flex-1" />

      <Image
        src="/logo.webp"
        alt="PULSO ELEITORAL MS"
        width={160}
        height={54}
        className="h-8 w-auto object-contain mix-blend-screen"
        priority
      />

      <div className="flex-1 flex justify-end">
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c8933a] animate-pulse" />
          <span className="text-[#c8933a] text-[8px] font-bold uppercase tracking-widest">Ao Vivo</span>
        </div>
      </div>
    </header>
  );
};
