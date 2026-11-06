'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TrendAreaChartProps {
  data: { dia: string; score: number }[];
}

export const TrendAreaChart: React.FC<TrendAreaChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C8933A" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#C8933A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
          <XAxis 
            dataKey="dia" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7a6e64', fontSize: 9 }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#7a6e64', fontSize: 9 }}
            domain={[-100, 100]}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="score" 
            stroke="#C8933A" 
            fillOpacity={1} 
            fill="url(#colorScore)" 
            strokeWidth={3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
