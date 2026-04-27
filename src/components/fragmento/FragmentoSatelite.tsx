'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FragmentoSateliteProps {
  id: string;
}

/**
 * Camada 4: Satélites
 * Micro-pontos orbitando o fragmento usando framer-motion.
 */
export const FragmentoSatelite: React.FC<FragmentoSateliteProps> = ({ id }) => {
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const satellites = Array.from({ length: (seed % 3) + 3 }).map((_, i) => {
    const sSeed = seed + i * 137;
    return {
      radius: (sSeed % 10) + 30, // 30 a 40px
      duration: (sSeed % 3000) + 4000, // 4 a 7s
      delay: (sSeed % 2000) / 1000,
      direction: sSeed % 2 === 0 ? 1 : -1,
      size: (sSeed % 2) + 2,
    };
  });

  return (
    <>
      {satellites.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-current pointer-events-none"
          style={{
            width: s.size,
            height: s.size,
            top: '50%',
            left: '50%',
            marginTop: -(s.size / 2),
            marginLeft: -(s.size / 2),
            boxShadow: '0 0 5px currentColor',
          }}
          animate={{
            rotate: 360 * s.direction,
          }}
          transition={{
            duration: s.duration / 1000,
            ease: 'linear',
            repeat: Infinity,
            delay: s.delay,
          }}
        >
          <div 
            style={{ 
              transform: `translateX(${s.radius}px)`,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: 'inherit',
              boxShadow: 'inherit'
            }} 
          />
        </motion.div>
      ))}
    </>
  );
};
