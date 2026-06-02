'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface SplashProps {
  onComplete: () => void;
}

export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 3200);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="fixed inset-0 z-[100] bg-[#141413] flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Neon glow — camada traseira profunda */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#d97757] blur-[160px] opacity-[0.18]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[#c8933a] blur-[80px] opacity-[0.22]" />
        </motion.div>

        {/* Anel neon pulsante */}
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] rounded-full border border-[#d97757]/20 pointer-events-none"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.85, 1.08, 0.95, 1.0], opacity: [0, 0.5, 0.3, 0.4] }}
          transition={{ duration: 2.8, ease: 'easeOut' }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-[#d97757]/10 pointer-events-none"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: [0.8, 1.05, 0.98, 1.02], opacity: [0, 0.3, 0.2, 0.25] }}
          transition={{ duration: 3.0, ease: 'easeOut', delay: 0.15 }}
        />

        {/* Logo */}
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        >
          {/* Halo neon direto atrás da logo */}
          <div className="absolute inset-0 -z-10 rounded-full blur-[60px] bg-[#d97757] opacity-30 scale-125" />

          <Image
            src="/logo.webp"
            alt="PULSO ELEITORAL MS"
            width={420}
            height={140}
            className="w-[260px] sm:w-[360px] md:w-[420px] h-auto object-contain drop-shadow-[0_0_60px_rgba(217,119,87,0.5)]"
            priority
          />
        </motion.div>

        {/* Linha decorativa fade-in */}
        <motion.div
          className="relative z-10 mt-8 w-24 h-px bg-gradient-to-r from-transparent via-[#d97757] to-transparent"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 0.9 }}
        />

        {/* Tagline */}
        <motion.p
          className="relative z-10 mt-4 text-[9px] sm:text-[10px] uppercase tracking-[0.35em] text-[#7a6e64] font-bold"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, ease: 'easeOut', delay: 1.1 }}
        >
          Inteligência Eleitoral · MS 2026
        </motion.p>

        {/* Fade-out overlay — começa a cobrir antes do onComplete */}
        <motion.div
          className="absolute inset-0 z-20 bg-[#141413] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.0, ease: 'easeIn', delay: 2.2 }}
        />
      </motion.div>
    </AnimatePresence>
  );
};
