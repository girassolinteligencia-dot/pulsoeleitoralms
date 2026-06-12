'use client';

import React, { useId } from 'react';
import styles from '@/styles/fragmento.module.css';

interface FragmentoNucleoProps {
  type: 'positivo' | 'negativo' | 'perfil';
}

/**
 * Layer 1: Nucleus - Animated SVG plasma with feTurbulence and radial gradients.
 */
export const FragmentoNucleo: React.FC<FragmentoNucleoProps> = ({ type }) => {
  const filterId = useId();
  
  const gradients = {
    positivo: ['#c8e6a0', '#a8c47a', '#5a7a35'],
    negativo: ['#f0a080', '#d97757', '#8a3820'],
    perfil: ['#e8c070', '#c8933a', '#7a5a18'],
  };

  const colors = gradients[type] || gradients.positivo;

  return (
    <div className={styles.nucleus}>
      <svg className={styles.plasmaFilter} viewBox="0 0 100 100">
        <defs>
          <radialGradient id={`grad-${filterId}`} cx="30%" cy="30%" r="70%">
            <stop offset="0%" stopColor={colors[0]} />
            <stop offset="50%" stopColor={colors[1]} />
            <stop offset="100%" stopColor={colors[2]} />
          </radialGradient>
          <filter id={filterId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3">
              <animate 
                attributeName="baseFrequency" 
                values="0.3;0.8;0.3" 
                dur="6s" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" scale="12" />
          </filter>
        </defs>
        <circle cx="50" cy="50" r="35" fill={`url(#grad-${filterId})`} filter={`url(#${filterId})`} />
      </svg>
    </div>
  );
};
