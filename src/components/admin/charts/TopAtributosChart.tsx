'use client';

import React from 'react';

interface Atributo {
  nome: string;
  count: number;
}

interface TopAtributosChartProps {
  data: {
    virtudes: Atributo[];
    defeitos: Atributo[];
  };
}

export const TopAtributosChart: React.FC<TopAtributosChartProps> = ({ data }) => {
  const maxCount = Math.max(
    ...data.virtudes.map(v => v.count),
    ...data.defeitos.map(d => d.count),
    1
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
      {/* Virtudes */}
      <div className="flex flex-col gap-6">
        <h4 className="text-[10px] font-bold text-[#A8C47A] uppercase tracking-[0.2em] mb-2">Principais Virtudes</h4>
        {data.virtudes.map((v, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-medium text-white uppercase">{v.nome}</span>
              <span className="text-[10px] text-text-muted">{v.count} citações</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#A8C47A] rounded-full transition-all duration-1000" 
                style={{ width: `${(v.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Defeitos */}
      <div className="flex flex-col gap-6">
        <h4 className="text-[10px] font-bold text-[#D97757] uppercase tracking-[0.2em] mb-2">Principais Defeitos</h4>
        {data.defeitos.map((d, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="text-[11px] font-medium text-white uppercase">{d.nome}</span>
              <span className="text-[10px] text-text-muted">{d.count} citações</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#D97757] rounded-full transition-all duration-1000" 
                style={{ width: `${(d.count / maxCount) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
