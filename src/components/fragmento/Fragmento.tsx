'use client';

import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { FragmentoNucleo } from './FragmentoNucleo';
import { FragmentoCampo } from './FragmentoCampo';
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
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
    >
      {/* Camada 3: Campo (Halo) */}
      <FragmentoCampo color={color} />

      {/* Camada 1: Núcleo */}
      <FragmentoNucleo type={type} />

      {/* Camada 2: Membrana */}
      <div 
        className={styles.membrane} 
        style={{
          position: 'absolute',
          inset: '5%',
          border: `1.5px dashed ${color}`,
          borderRadius: '50%',
          opacity: 0.6,
          animation: 'spin 10s linear infinite'
        }} 
      />

      {/* Camada 4: Satélites */}
      <FragmentoSatelite id={id} />

      {/* Rótulo */}
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-[var(--mid-gray)] font-display">
        {label}
      </span>

      {/* Camada 5: Trilha (Implementada via motion trail) */}
      <motion.div
        className="absolute inset-0 bg-current rounded-full blur-xl pointer-events-none"
        animate={{ opacity: [0.4, 0] }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};
