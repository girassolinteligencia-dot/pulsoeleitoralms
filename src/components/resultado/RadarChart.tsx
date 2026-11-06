'use client';

import React from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import { TOKENS } from '@/lib/tokens';

interface RadarData {
  atributo: string;
  valor: number;
}

interface RadarChartProps {
  data: RadarData[];
}

export const RadarChart: React.FC<RadarChartProps> = ({ data }) => {
  // Se não houver dados, mostrar um estado vazio ou placeholder
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-[#7a6e64] text-[10px] uppercase tracking-widest font-bold">
        Aguardando Dados...
      </div>
    );
  }

  // Verificar se todos os valores são zero
  const allZeros = data.every(d => d.valor === 0);

  return (
    <div className="w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="62%" data={data}>
          <PolarGrid 
            stroke={TOKENS.COLORS.BORDER} 
            opacity={0.3} 
            gridType="polygon"
          />
          <PolarAngleAxis 
            dataKey="atributo" 
            tick={(props: any) => {
              const { x, y, payload, textAnchor } = props;
              const valY = typeof y === 'number' ? y : parseFloat(y);
              // Ajuste fino para evitar cortes nos nomes
              const dy = valY > 150 ? 15 : (valY < 50 ? -10 : 5);
              return (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={0}
                    y={dy}
                    textAnchor={textAnchor as 'start' | 'middle' | 'end'}
                    fill={TOKENS.COLORS.TEXT_MUTED}
                    fontSize={8}
                    fontWeight={400}
                    style={{ letterSpacing: '0.02em' }}
                  >
                    {payload.value.toUpperCase()}
                  </text>
                </g>
              );
            }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, allZeros ? 5 : 'auto']} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Percepção"
            dataKey="valor"
            stroke={TOKENS.COLORS.ORANGE}
            strokeWidth={3}
            fill={TOKENS.COLORS.ORANGE}
            fillOpacity={0.4}
            isAnimationActive={false}
            dot={{ r: 4, fill: TOKENS.COLORS.ORANGE, fillOpacity: 1, strokeWidth: 1, stroke: TOKENS.COLORS.CREAM }}
            filter="drop-shadow(0 0 12px rgba(217, 119, 87, 0.8))"
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};

