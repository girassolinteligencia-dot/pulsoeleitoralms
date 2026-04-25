'use client';

import { useState, useEffect } from 'react';

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
    fetch('/api/admin/bloqueios')
      .then(res => res.json())
      .then(data => {
        setBloqueios(data);
        setLoading(false);
      });
  }, []);

  const handleUnblock = async (id: string) => {
    const res = await fetch('/api/admin/bloqueios', {
      method: 'DELETE',
      body: JSON.stringify({ id })
    });
    if (res.ok) {
      setBloqueios(bloqueios.filter(b => b.id !== id));
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-text">Segurança e Bloqueios</h2>
          <p className="text-[10px] text-text-muted uppercase mt-2 tracking-widest">Controle de hashes bloqueados por comportamento suspeito</p>
        </div>
      </div>

      <div className="bg-surface-1 border border-border rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-2/50">
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Hash (IP/Fingerprint)</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Motivo</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Criado em</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody>
            {bloqueios.map(b => (
              <tr key={b.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5 text-[10px] font-mono text-primary truncate max-w-[200px]">{b.hash}</td>
                <td className="px-8 py-5 text-[10px] uppercase font-medium text-text-muted">{b.motivo || 'N/A'}</td>
                <td className="px-8 py-5 text-[10px] uppercase font-medium text-text-muted">{new Date(b.criado_em).toLocaleString()}</td>
                <td className="px-8 py-5">
                   <button onClick={() => handleUnblock(b.id)} className="text-[9px] uppercase font-bold text-negative">Desbloquear</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bloqueios.length === 0 && !loading && (
          <div className="p-20 text-center text-text-muted text-[10px] uppercase tracking-widest">Nenhum bloqueio ativo</div>
        )}
      </div>
    </div>
  );
}
