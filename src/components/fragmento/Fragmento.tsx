'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FragmentoNucleo } from './FragmentoNucleo';
import { FragmentoCampo } from './FragmentoCampo';
import { FragmentoMembrana } from './FragmentoMembrana';
import { FragmentoSatelite } from './FragmentoSatelite';
import { useFragmentoFisica } from '@/hooks/useFragmentoFisica';
import styles from '@/styles/fragmento.module.css';
import { TOKENS } from '@/lib/tokens';

interface FragmentoProps {
  id: string;
  label: string;
  type: 'positivo' | 'negativo' | 'perfil';
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * VOZ PÚBLICA - Fragmento de Plasma (Core Component)
 * Implementation of all 5 visual layers and physics.
 */
export const Fragmento: React.FC<FragmentoProps> = ({ id, label, type, onClick, style }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  useFragmentoFisica(containerRef as React.RefObject<HTMLDivElement>);

  const color = type === 'positivo' 
    ? TOKENS.COLORS.POSITIVE 
    : type === 'negativo' 
    ? TOKENS.COLORS.NEGATIVE 
    : TOKENS.COLORS.VOTER;

  return (
    <motion.div
      ref={containerRef}
      className={styles.fragmentContainer}
      layoutId={id}
      style={{ 
        width: TOKENS.SIZES.FRAGMENT_MOBILE, 
        height: TOKENS.SIZES.FRAGMENT_MOBILE,
        color,
        ...style 
      }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
    >
      {/* Camada 3: Campo (Halo) */}
      <FragmentoCampo color={color} />

      {/* Camada 1: Núcleo */}
      <FragmentoNucleo type={type} />

      {/* Camada 2: Membrana */}
      <FragmentoMembrana color={color} />

      {/* Camada 4: Satélites */}
      <FragmentoSatelite id={id} />

      {/* Rótulo */}
      <motion.span 
        className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.3em] text-[var(--mid-gray)] font-display"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 0.6, y: 0 }}
        whileHover={{ opacity: 1, color: '#f5f0e8' }}
      >
        {label}
      </motion.span>

      {/* Camada 5: Trilha (Implementada via motion trail) */}
      <motion.div
        className="absolute inset-0 bg-current rounded-full blur-2xl pointer-events-none"
        animate={{ opacity: [0.3, 0] }}
        transition={{ duration: 0.4 }}
      />
    </motion.div>
  );
};
