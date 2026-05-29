'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface AprovacaoChartProps {
  data: {
    sim: number;
    nao: number;
    total: number;
  };
}

export const AprovacaoChart: React.FC<AprovacaoChartProps> = ({ data }) => {
  const chartData = [
    { name: 'Aprova', value: data.sim, color: '#A8C47A' },
    { name: 'Desaprova', value: data.nao, color: '#D97757' },
    { name: 'Não Declarado', value: data.total - (data.sim + data.nao), color: '#3d3128' },
  ];

  return (
    <div className="w-full h-[300px] flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
            itemStyle={{ color: '#f5f0e8', fontSize: '12px' }}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-[10px] uppercase tracking-widest text-text-muted font-bold ml-2">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold text-white">
          {data.total > 0 ? Math.round((data.sim / data.total) * 100) : 0}%
        </span>
        <span className="text-[8px] text-text-muted uppercase tracking-tighter">Aprovação</span>
      </div>
    </div>
  );
};
