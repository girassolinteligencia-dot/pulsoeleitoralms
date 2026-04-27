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
  return (
    <div className="w-full h-[300px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadar cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke={TOKENS.COLORS.BORDER} opacity={0.2} />
          <PolarAngleAxis 
            dataKey="atributo" 
            tick={{ fill: TOKENS.COLORS.TEXT_MUTED, fontSize: 10, fontWeight: 500 }}
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 'auto']} 
            tick={false} 
            axisLine={false} 
          />
          <Radar
            name="Avaliação"
            dataKey="valor"
            stroke={TOKENS.COLORS.ORANGE}
            fill={TOKENS.COLORS.ORANGE}
            fillOpacity={0.5}
            dot={{ r: 3, fill: TOKENS.COLORS.ORANGE, fillOpacity: 1 }}
            animationDuration={1500}
            filter="drop-shadow(0 0 8px rgba(217, 119, 87, 0.6))"
          />
        </RechartsRadar>
      </ResponsiveContainer>
    </div>
  );
};
