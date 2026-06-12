'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface DemographicRadarChartProps {
  data: { label: string; value: number }[];
}

export const DemographicRadarChart: React.FC<DemographicRadarChartProps> = ({ data }) => {
  if (!data || data.length === 0) return (
    <div className="w-full h-[300px] flex items-center justify-center text-[10px] text-text-muted uppercase">
      Sem dados suficientes
    </div>
  );

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke="#ffffff10" />
          <PolarAngleAxis 
            dataKey="label" 
            tick={{ fill: '#7a6e64', fontSize: 8, fontWeight: 500 }}
          />
          <Radar
            name="Volume"
            dataKey="value"
            stroke="#A8C47A"
            fill="#A8C47A"
            fillOpacity={0.3}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
            itemStyle={{ color: '#f5f0e8', fontSize: '12px' }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
