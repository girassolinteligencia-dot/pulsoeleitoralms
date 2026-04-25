'use client';

import React from 'react';

interface FragmentoSateliteProps {
  id: string;
}

/**
 * Camada 4: Satélites
 * Micro-pontos orbitando o fragmento em trajetórias únicas.
 */
export const FragmentoSatelite: React.FC<FragmentoSateliteProps> = ({ id }) => {
  // Gerar valores estáveis baseados no ID (pseudo-random estável)
  const seed = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const satellites = Array.from({ length: (seed % 3) + 3 }).map((_, i) => {
    const sSeed = seed + i * 137;
    return {
      radius: (sSeed % 10) + 28, // 28 a 38px
      duration: (sSeed % 4000) + 3000, // 3 a 7s
      delay: (sSeed % 2000),
      direction: sSeed % 2 === 0 ? 'normal' : 'reverse',
      size: 3,
    };
  });

  return (
    <>
      {satellites.map((s, i) => {
        const orbitId = `orbit_${id}_${i}`;
        return (
          <React.Fragment key={i}>
            <style>
              {`
                @keyframes ${orbitId} {
                  from { transform: rotate(0deg) translateX(${s.radius}px) rotate(0deg); }
                  to   { transform: rotate(360deg) translateX(${s.radius}px) rotate(-360deg); }
                }
              `}
            </style>
            <div
              style={{
                position: 'absolute',
                width: s.size,
                height: s.size,
                top: '50%',
                left: '50%',
                marginTop: -(s.size / 2),
                marginLeft: -(s.size / 2),
                borderRadius: '50%',
                background: 'currentColor',
                boxShadow: '0 0 5px currentColor',
                animation: `${orbitId} ${s.duration}ms linear infinite`,
                animationDelay: `${s.delay}ms`,
                animationDirection: s.direction,
                pointerEvents: 'none',
              }}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
