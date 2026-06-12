'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Sonar/radar pulse — ponto central emite ondas radiais em laranja
// Remete a "sinal sendo captado/emitido" = Pulso Eleitoral
export const PulsoEfeito: React.FC = () => {
  return (
    <div className="relative flex items-center justify-center w-44 h-44 sm:w-52 sm:h-52">

      {/* Ondas sonar — 4 anéis com delay escalonado */}
      {[0, 1, 2, 3].map((i) => (
        <motion.span
          key={i}
          className="absolute rounded-full border border-[#d97757]"
          initial={{ width: 16, height: 16, opacity: 0 }}
          animate={{
            width: ['16px', '140px', '180px'],
            height: ['16px', '140px', '180px'],
            opacity: [0, 0.5, 0],
            borderWidth: ['2px', '1px', '0px'],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            delay: i * 0.6,
            ease: [0.2, 0.8, 0.4, 1],
          }}
        />
      ))}

      {/* Anel interno sólido pulsante */}
      <motion.span
        className="absolute rounded-full border-2 border-[#d97757]/40"
        animate={{
          width: ['32px', '48px', '32px'],
          height: ['32px', '48px', '32px'],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Ponto central */}
      <motion.span
        className="relative z-10 w-4 h-4 rounded-full bg-[#d97757]"
        animate={{
          scale: [1, 1.4, 1],
          boxShadow: [
            '0 0 0px 0px rgba(217,119,87,0)',
            '0 0 16px 6px rgba(217,119,87,0.6)',
            '0 0 0px 0px rgba(217,119,87,0)',
          ],
        }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};
