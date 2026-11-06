'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface RankingBarChartProps {
  data: { nome: string; liquidScore: number }[];
}

export const RankingBarChart: React.FC<RankingBarChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#ffffff10" />
          <XAxis type="number" domain={[-100, 100]} hide />
          <YAxis 
            dataKey="nome" 
            type="category" 
            axisLine={false} 
            tickLine={false}
            tick={{ fill: '#7a6e64', fontSize: 10, fontWeight: 500 }}
            width={100}
          />
          <Tooltip 
            cursor={{ fill: '#ffffff05' }}
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
            itemStyle={{ color: '#f5f0e8', fontSize: '12px' }}
          />
          <ReferenceLine x={0} stroke="#3d3128" />
          <Bar dataKey="liquidScore" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.liquidScore >= 0 ? '#A8C47A' : '#D97757'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
