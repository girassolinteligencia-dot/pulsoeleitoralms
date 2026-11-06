'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FragmentoCampoProps {
  color: string;
}

/**
 * Camada 3: Campo (Halo)
 * Brilho externo pulsante em volta do fragmento.
 */
export const FragmentoCampo: React.FC<FragmentoCampoProps> = ({ color }) => {
  return (
    <motion.div
      variants={{
        initial: { opacity: 0.15, scale: 0.95 },
        hover: { opacity: 0.4, scale: 1.2 },
      }}
      initial="initial"
      whileHover="hover"
      style={{
        position: 'absolute',
        top: '-20%',
        left: '-20%',
        width: '140%',
        height: '140%',
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        borderRadius: '50%',
        filter: 'blur(15px)',
        zIndex: -1,
        pointerEvents: 'none',
      }}
      animate={{
        opacity: [0.15, 0.28, 0.15],
        scale: [0.95, 1.05, 0.95],
      }}
      transition={{
        duration: 3.5,
        ease: 'easeInOut',
        repeat: Infinity,
      }}
    />
  );
};
