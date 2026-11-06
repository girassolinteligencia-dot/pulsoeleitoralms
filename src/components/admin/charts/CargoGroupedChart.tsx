'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface CargoGroupedChartProps {
  data: { cargo: string; apoio: number; neutro: number; rejeicao: number }[];
}

export const CargoGroupedChart: React.FC<CargoGroupedChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="cargo" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7a6e64', fontSize: 10 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7a6e64', fontSize: 10 }}
            unit="%"
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
          />
          <Legend 
            verticalAlign="top" 
            align="right" 
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingBottom: '20px' }}
          />
          <Bar name="Apoio" dataKey="apoio" fill="#A8C47A" radius={[4, 4, 0, 0]} />
          <Bar name="Neutro" dataKey="neutro" fill="#C8933A" radius={[4, 4, 0, 0]} />
          <Bar name="Rejeição" dataKey="rejeicao" fill="#D97757" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
