'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export const Header: React.FC = () => {
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/configuracoes/public')
      .then(r => r.json())
      .then(d => { if (typeof d._total_pulsos === 'number') setTotal(d._total_pulsos + 1); })
      .catch(() => {});
  }, []);

  return (
    <header className="fixed top-0 left-0 w-full z-50 px-3 sm:px-6 py-3 flex items-center justify-center gap-3 sm:gap-6 backdrop-blur-md bg-[#141413]/55 border-b border-[#3d3128]/30">
      <Image
        src="/logo.webp"
        alt="PULSO ELEITORAL MS"
        width={160}
        height={54}
        className="h-7 w-auto object-contain mix-blend-screen sm:h-8"
        priority
      />

      <div className="flex-none">
        <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-[#c8933a]/20 bg-[#c8933a]/10 px-2.5 py-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c8933a] animate-pulse shrink-0" />
          {total === null ? (
            <span className="text-[#c8933a] text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] sm:tracking-widest animate-pulse">
              Ao Vivo
            </span>
          ) : (
            <span className="text-[#c8933a] text-[7px] sm:text-[8px] font-bold uppercase tracking-[0.18em] sm:tracking-widest">
              Você é o pulso nº {total.toLocaleString('pt-BR')}
            </span>
          )}
        </div>
      </div>
    </header>
  );
};
