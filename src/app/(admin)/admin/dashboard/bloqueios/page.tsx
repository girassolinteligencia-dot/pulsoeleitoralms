'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/adminClient';

interface Bloqueio {
  id: string;
  hash: string;
  motivo: string;
  criado_em: string;
}

export default function ManageBloqueios() {
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/bloqueios')
      .then(res => res.json())
      .then(data => {
        setBloqueios(data);
        setLoading(false);
      });
  }, []);

  const handleUnblock = async (id: string) => {
    const res = await adminFetch('/api/admin/bloqueios', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setBloqueios(bloqueios.filter(b => b.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">Segurança e Bloqueios</h2>
        <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">Controle de hashes bloqueados por comportamento suspeito</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-surface-1 border border-border rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-2/30">
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Hash (IP/Fingerprint)</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Motivo</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest">Criado em</th>
              <th className="px-8 py-6 text-[10px] uppercase font-bold text-text-muted tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {bloqueios.map(b => (
              <tr key={b.id} className="border-b border-border/30 hover:bg-white/[0.01] transition-colors group">
                <td className="px-8 py-6 text-[10px] font-mono text-primary truncate max-w-[200px]">{b.hash}</td>
                <td className="px-8 py-6 text-[10px] uppercase font-medium text-text-muted">{b.motivo || 'Suspicious Activity'}</td>
                <td className="px-8 py-6 text-[10px] uppercase font-medium text-text-muted">{new Date(b.criado_em).toLocaleString()}</td>
                <td className="px-8 py-6 text-right">
                   <button 
                    onClick={() => handleUnblock(b.id)}
                    className="text-[9px] uppercase font-bold text-negative hover:brightness-125 transition-all"
                   >
                     Desbloquear
                   </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bloqueios.length === 0 && !loading && (
          <div className="p-20 text-center text-text-muted text-[10px] uppercase tracking-widest opacity-40 italic">Nenhum bloqueio ativo no momento</div>
        )}
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden flex flex-col gap-4">
        {bloqueios.map(b => (
          <div key={b.id} className="bg-surface-1 border border-border rounded-3xl p-6 flex flex-col gap-4">
             <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                   <p className="text-[10px] font-mono text-primary truncate">{b.hash}</p>
                   <p className="text-[8px] text-text-muted uppercase tracking-widest mt-1">{new Date(b.criado_em).toLocaleString()}</p>
                </div>
                <span className="bg-negative/10 text-negative text-[7px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Bloqueado</span>
             </div>
             <div className="flex justify-between items-center pt-4 border-t border-border/50">
                <span className="text-[9px] text-text-muted uppercase font-medium tracking-widest truncate max-w-[60%]">{b.motivo || 'Atividade Suspeita'}</span>
                <button 
                  onClick={() => handleUnblock(b.id)}
                  className="text-[9px] uppercase font-bold text-negative underline underline-offset-4"
                >
                  Desbloquear
                </button>
             </div>
          </div>
        ))}
        {bloqueios.length === 0 && !loading && (
           <div className="py-20 text-center text-text-muted uppercase tracking-widest text-[9px] opacity-40">Zero ameaças detectadas</div>
        )}
        {loading && <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">Escaneando base...</div>}
      </div>
    </div>
  );
}
