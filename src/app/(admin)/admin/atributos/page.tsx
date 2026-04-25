'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/ui/Header';

interface Atributo {
  id: string;
  nome: string;
  descricao: string | null;
  polaridade: number;
}

export default function AtributosAdmin() {
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAtributo, setEditingAtributo] = useState<Partial<Atributo> | null>(null);

  async function fetchAtributos() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/atributos');
      const data = await res.json();
      setAtributos(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAtributos();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAtributo?.nome) return;

    try {
      const res = await fetch('/api/admin/atributos', {
        method: editingAtributo.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingAtributo)
      });

      if (res.ok) {
        setEditingAtributo(null);
        fetchAtributos();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] pt-24 px-8 pb-12 font-body">
      <Header />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Gestão de Atributos</h1>
            <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-2 font-bold">Configuração da Matriz de Avaliação</p>
          </div>
          
          <button 
            onClick={() => setEditingAtributo({ nome: '', polaridade: 1 })}
            className="px-6 py-3 bg-[#d97757] text-[#f5f0e8] rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#d97757]/20"
          >
            + Novo Atributo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {atributos.map((at) => (
              <motion.div 
                key={at.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#1c1814] border border-[#3d3128] rounded-3xl p-6 hover:border-[#d97757]/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${at.polaridade === 1 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                    {at.polaridade === 1 ? 'Positivo' : 'Negativo'}
                  </div>
                  <button onClick={() => setEditingAtributo(at)} className="text-[#7a6e64] hover:text-[#f5f0e8] transition-colors">
                    Editar
                  </button>
                </div>
                
                <h3 className="text-lg font-bold font-display uppercase tracking-wider mb-2">{at.nome}</h3>
                <p className="text-xs text-[#7a6e64] leading-relaxed mb-4">{at.descricao || 'Sem descrição definida.'}</p>
                
                <div className="h-1 w-full bg-[#141413] rounded-full overflow-hidden">
                  <div className={`h-full ${at.polaridade === 1 ? 'bg-green-500' : 'bg-red-500'} opacity-30`} style={{ width: '100%' }} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Modal de Edição */}
      <AnimatePresence>
        {editingAtributo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAtributo(null)}
              className="absolute inset-0 bg-[#141413]/80 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-[#1c1814] border border-[#3d3128] rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h2 className="text-xl font-bold font-display uppercase tracking-widest mb-8 text-[#f5f0e8]">
                {editingAtributo.id ? 'Editar Atributo' : 'Novo Atributo'}
              </h2>
              
              <form onSubmit={handleSave} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">Nome do Atributo</label>
                  <input 
                    type="text" 
                    value={editingAtributo.nome}
                    onChange={(e) => setEditingAtributo({...editingAtributo, nome: e.target.value})}
                    className="w-full bg-[#141413] border border-[#3d3128] rounded-2xl px-5 py-4 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#d97757]"
                    placeholder="Ex: Honestidade"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">Descrição</label>
                  <textarea 
                    value={editingAtributo.descricao || ''}
                    onChange={(e) => setEditingAtributo({...editingAtributo, descricao: e.target.value})}
                    className="w-full bg-[#141413] border border-[#3d3128] rounded-2xl px-5 py-4 text-sm text-[#f5f0e8] focus:outline-none focus:border-[#d97757] h-24 resize-none"
                    placeholder="Descreva o significado deste atributo..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase font-bold text-[#d97757] tracking-widest ml-1">Polaridade</label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <button 
                      type="button"
                      onClick={() => setEditingAtributo({...editingAtributo, polaridade: 1})}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${editingAtributo.polaridade === 1 ? 'bg-green-500 text-white' : 'bg-[#141413] text-[#7a6e64] border border-[#3d3128]'}`}
                    >
                      Positivo
                    </button>
                    <button 
                      type="button"
                      onClick={() => setEditingAtributo({...editingAtributo, polaridade: -1})}
                      className={`py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${editingAtributo.polaridade === -1 ? 'bg-red-500 text-white' : 'bg-[#141413] text-[#7a6e64] border border-[#3d3128]'}`}
                    >
                      Negativo
                    </button>
                  </div>
                </div>

                <div className="flex gap-4 mt-4">
                  <button 
                    type="submit"
                    className="flex-1 py-4 bg-[#d97757] text-[#f5f0e8] rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-[#d97757]/20"
                  >
                    Salvar Alterações
                  </button>
                  <button 
                    type="button"
                    onClick={() => setEditingAtributo(null)}
                    className="px-8 py-4 bg-[#141413] text-[#7a6e64] border border-[#3d3128] rounded-full text-[10px] font-bold uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
