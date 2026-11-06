'use client';

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from 'recharts';

interface PolarizationScatterChartProps {
  data: { x: number; y: number; z: number; nome: string }[];
}

export const PolarizationScatterChart: React.FC<PolarizationScatterChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis 
            type="number" 
            dataKey="x" 
            name="Visibilidade" 
            unit=" votos" 
            axisLine={false}
            tick={{ fill: '#7a6e64', fontSize: 10 }}
            label={{ value: 'VISIBILIDADE (VOLUME)', position: 'insideBottom', offset: -10, fill: '#7a6e64', fontSize: 10 }}
          />
          <YAxis 
            type="number" 
            dataKey="y" 
            name="Intensidade" 
            axisLine={false}
            tick={{ fill: '#7a6e64', fontSize: 10 }}
            label={{ value: 'INTENSIDADE DE SENTIMENTO', angle: -90, position: 'insideLeft', fill: '#7a6e64', fontSize: 10 }}
          />
          <ZAxis type="number" dataKey="z" range={[100, 1000]} name="Volume" />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
          />
          <Scatter name="Candidatos" data={data} fill="#C8933A" fillOpacity={0.6}>
            <LabelList dataKey="nome" position="top" style={{ fill: '#f5f0e8', fontSize: 9, fontWeight: 'bold' }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
