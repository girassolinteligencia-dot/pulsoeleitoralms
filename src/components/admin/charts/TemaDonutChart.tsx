'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface TemaDonutChartProps {
  data: { name: string; value: number }[];
}

const COLORS = ['#A8C47A', '#D97757', '#C8933A', '#5783d9', '#d957b9', '#57d9d1', '#d9a857', '#7a6e64'];

export const TemaDonutChart: React.FC<TemaDonutChartProps> = ({ data }) => {
  return (
    <div className="w-full h-[350px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip 
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
          />
          <Legend 
            verticalAlign="bottom" 
            align="center" 
            iconType="circle"
            wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', paddingTop: '20px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
