'use client';

import React, { useEffect, useState } from 'react';
import { prisma } from '@/lib/prisma'; // Note: Client side fetching usually uses fetch() but I'll use the API

export default function ManageCandidatos() {
  const [candidatos, setCandidatos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newCand, setNewCand] = useState({
    nome: '',
    cargo: 'Governador',
    cidade: 'Campo Grande',
    campanha_id: 'camp-1' // Mock for now
  });

  useEffect(() => {
    fetch('/api/admin/candidatos')
      .then(res => res.json())
      .then(data => {
        setCandidatos(data);
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/admin/candidatos', {
      method: 'POST',
      body: JSON.stringify(newCand)
    });
    if (res.ok) {
      const data = await res.json();
      setCandidatos([...candidatos, data]);
      setShowModal(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-display uppercase tracking-widest text-text">Gestão de Candidatos</h2>
          <p className="text-[10px] text-text-muted uppercase mt-2 tracking-widest">Adicione e edite candidatos das campanhas ativas</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          + Novo Candidato
        </button>
      </div>

      <div className="bg-surface-1 border border-border rounded-[2rem] overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-surface-2/50">
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Nome</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cargo</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Cidade</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Campanha</th>
              <th className="px-8 py-5 text-[10px] uppercase font-bold text-text-muted tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody>
            {candidatos.map(cand => (
              <tr key={cand.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5 text-xs font-bold text-text">{cand.nome}</td>
                <td className="px-8 py-5 text-[10px] uppercase font-medium text-text-muted">{cand.cargo}</td>
                <td className="px-8 py-5 text-[10px] uppercase font-medium text-text-muted">{cand.cidade}</td>
                <td className="px-8 py-5 text-[10px] uppercase font-medium text-primary">{cand.campanha?.nome}</td>
                <td className="px-8 py-5">
                   <button className="text-[9px] uppercase font-bold text-primary mr-4">Editar</button>
                   <button className="text-[9px] uppercase font-bold text-negative">Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="p-20 text-center text-text-muted animate-pulse">Carregando dados...</div>}
      </div>

      {/* Basic Modal (Placeholder for refinement) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-6">
          <form onSubmit={handleCreate} className="w-full max-w-[400px] bg-surface-1 border border-border rounded-[2.5rem] p-10 flex flex-col gap-6 shadow-2xl">
            <h3 className="text-sm font-bold uppercase tracking-widest text-primary">Novo Candidato</h3>
            <input 
              className="bg-surface-2 border border-border rounded-xl px-5 py-4 text-xs" 
              placeholder="Nome do Candidato"
              value={newCand.nome}
              onChange={e => setNewCand({...newCand, nome: e.target.value})}
            />
            <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-primary text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-widest">Salvar</button>
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-surface-2 text-text py-4 rounded-full font-bold text-[10px] uppercase tracking-widest">Cancelar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
