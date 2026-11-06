'use client';

import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';

interface BairroTreeMapProps {
  data: { name: string; value: number }[];
}

const CustomizedContent = (props: any) => {
  const { depth, x, y, width, height, name } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: '#1c1814',
          stroke: '#3d3128',
          strokeWidth: 2 / (depth + 1),
          strokeOpacity: 1,
        }}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#f5f0e8"
          fontSize={10}
          className="uppercase font-bold tracking-tighter"
        >
          {name}
        </text>
      )}
    </g>
  );
};

export const BairroTreeMap: React.FC<BairroTreeMapProps> = ({ data }) => {
  if (!data || data.length === 0) return (
    <div className="w-full h-[300px] flex items-center justify-center text-[10px] text-text-muted uppercase">
      Sem dados geográficos
    </div>
  );

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="value"
          aspectRatio={4 / 3}
          stroke="#3d3128"
          fill="#1c1814"
          content={<CustomizedContent />}
        >
          <Tooltip
            contentStyle={{ backgroundColor: '#1c1814', border: '1px solid #3d3128', borderRadius: '12px' }}
            itemStyle={{ color: '#f5f0e8', fontSize: '12px' }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
};
