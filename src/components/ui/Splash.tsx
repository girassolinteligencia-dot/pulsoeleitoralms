'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface SplashProps {
  onComplete: () => void;
}

/**
 * Tela Splash obrigatória com animação logoPulse.
 */
export const Splash: React.FC<SplashProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-container"
          className="fixed inset-0 z-[100] bg-[#141413] flex flex-col items-center justify-center overflow-hidden"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Background Decorativo: Aura de Dados */}
          <div className="absolute inset-0 z-0 opacity-30 flex items-center justify-center pointer-events-none">
            <div className="w-[150%] h-[150%] bg-[radial-gradient(circle_at_50%_50%,#d9775733,transparent_70%)] blur-3xl animate-pulse" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Central com logoPulse */}
          <div className="relative w-64 h-64 mb-8">
            <Image
              src="/gi/logo-256.png"
              alt="VOZ PÚBLICA"
              width={256}
              height={256}
              className="animate-logoPulse"
              priority
            />
          </div>

          {/* Títulos */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-bold font-display tracking-tighter">
              <span className="text-[#f5f0e8]">VOZ</span>
              <span className="text-[#d97757]">PÚBLICA</span>
            </h1>
            
            {/* Divisor Gradiente */}
            <div className="w-10 h-1 bg-gradient-to-r from-transparent via-[#d97757] to-transparent mx-auto" />

            <p className="font-body italic text-[#b0aea5] text-lg">
              A voz do cidadão no Mato Grosso do Sul
            </p>
          </div>

          {/* Badge Girassol */}
          <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-[#c8933a]/10 rounded-full border border-[#c8933a]/20">
            <Image src="/gi/girassol-logo.png" alt="GI" width={24} height={24} className="rounded-full" />
            <span className="text-[#c8933a] text-[10px] font-bold uppercase tracking-widest">
              Girassol Inteligência
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setIsVisible(false); onComplete(); }}
            className="mt-16 bg-[#d97757] text-[#f5f0e8] px-12 py-5 rounded-full font-bold text-xs uppercase tracking-[0.3em] shadow-xl shadow-[#d97757]/20"
          >
            Começar avaliação →
          </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
