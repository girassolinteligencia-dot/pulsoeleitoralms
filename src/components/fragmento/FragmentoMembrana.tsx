'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface FragmentoMembranaProps {
  color: string;
}

/**
 * Camada 2: Membrana
 * Estrutura externa pontilhada com rotação e pulsação.
 */
export const FragmentoMembrana: React.FC<FragmentoMembranaProps> = ({ color }) => {
  return (
    <motion.div
      style={{
        position: 'absolute',
        inset: '5%',
        border: `1.2px dashed ${color}`,
        borderRadius: '50%',
        pointerEvents: 'none',
      }}
      animate={{
        rotate: 360,
        opacity: [0.3, 0.7, 0.3],
        scale: [1, 1.02, 1],
      }}
      transition={{
        rotate: { duration: 15, ease: 'linear', repeat: Infinity },
        opacity: { duration: 4, ease: 'easeInOut', repeat: Infinity },
        scale: { duration: 3, ease: 'easeInOut', repeat: Infinity },
      }}
    />
  );
};
