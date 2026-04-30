'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/ui/Header';

interface Atributo {
  id: string;
  nome: string;
  descricao: string | null;
  polaridade: number;
  visivel: boolean;
}

export default function AtributosAdmin() {
  const [atributos, setAtributos] = useState<Atributo[]>([]);
  const [editingAtributo, setEditingAtributo] = useState<Partial<Atributo> | null>(null);
  const [filterPolaridade, setFilterPolaridade] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const loadAtributos = async () => {
      try {
        const res = await fetch('/api/admin/atributos');
        const data = await res.json();
        setAtributos(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadAtributos();
  }, []);

  const fetchAtributos = async () => {
    const res = await fetch('/api/admin/atributos');
    const data = await res.json();
    setAtributos(data);
  };

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

  const handleToggleVisivel = async (atributo: Atributo) => {
    setTogglingId(atributo.id);
    try {
      const res = await fetch('/api/admin/atributos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: atributo.id, 
          nome: atributo.nome,
          descricao: atributo.descricao,
          polaridade: atributo.polaridade,
          visivel: !atributo.visivel 
        })
      });
      if (res.ok) {
        setAtributos(prev => prev.map(a => 
          a.id === atributo.id ? { ...a, visivel: !a.visivel } : a
        ));
      }
    } catch (error) {
      console.error(error);
    } finally {
      setTogglingId(null);
    }
  };

  const positivos = atributos.filter(a => a.polaridade === 1);
  const negativos = atributos.filter(a => a.polaridade === -1);
  const visiveis = atributos.filter(a => a.visivel).length;

  const filteredAtributos = filterPolaridade !== null 
    ? atributos.filter(a => a.polaridade === filterPolaridade)
    : atributos;

  return (
    <main className="min-h-screen bg-[#141413] text-[#f5f0e8] pt-24 px-8 pb-12 font-body">
      <Header />
      
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold font-display uppercase tracking-tight text-[#f5f0e8]">Gestão de Atributos</h1>
            <p className="text-[10px] text-[#7a6e64] uppercase tracking-[0.4em] mt-2 font-bold">Configuração da Matriz de Avaliação</p>
          </div>
          
          <button 
            onClick={() => setEditingAtributo({ nome: '', polaridade: 1, visivel: true })}
            className="px-6 py-3 bg-[#d97757] text-[#f5f0e8] rounded-full text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#d97757]/20"
          >
            + Novo Atributo
          </button>
        </div>

        {/* Stats Panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1c1814] border border-[#3d3128] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold font-display text-[#d97757]">{atributos.length}</p>
            <p className="text-[8px] uppercase tracking-widest font-bold text-[#7a6e64] mt-1">Total</p>
          </div>
          <div className="bg-[#1c1814] border border-[#3d3128] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold font-display text-green-500">{positivos.length}</p>
            <p className="text-[8px] uppercase tracking-widest font-bold text-[#7a6e64] mt-1">Virtudes</p>
          </div>
          <div className="bg-[#1c1814] border border-[#3d3128] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold font-display text-red-500">{negativos.length}</p>
            <p className="text-[8px] uppercase tracking-widest font-bold text-[#7a6e64] mt-1">Negativos</p>
          </div>
          <div className="bg-[#1c1814] border border-[#3d3128] rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold font-display text-[#c8933a]">{visiveis}</p>
            <p className="text-[8px] uppercase tracking-widest font-bold text-[#7a6e64] mt-1">Visíveis</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setFilterPolaridade(null)}
            className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
              filterPolaridade === null
                ? 'bg-[#d97757] text-[#f5f0e8] shadow-lg shadow-[#d97757]/20'
                : 'bg-[#1c1814] text-[#7a6e64] border border-[#3d3128] hover:border-[#d97757]'
            }`}
          >
            Todos ({atributos.length})
          </button>
          <button
            onClick={() => setFilterPolaridade(1)}
            className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
              filterPolaridade === 1
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
                : 'bg-[#1c1814] text-[#7a6e64] border border-[#3d3128] hover:border-green-500'
            }`}
          >
            Virtudes ({positivos.length})
          </button>
          <button
            onClick={() => setFilterPolaridade(-1)}
            className={`px-5 py-2.5 rounded-full text-[9px] font-bold uppercase tracking-widest transition-all ${
              filterPolaridade === -1
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                : 'bg-[#1c1814] text-[#7a6e64] border border-[#3d3128] hover:border-red-500'
            }`}
          >
            Negativos ({negativos.length})
          </button>
        </div>

        {/* Attributes Table */}
        <div className="bg-[#1c1814] border border-[#3d3128] rounded-3xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-[1fr_140px_100px_100px_80px] gap-4 px-6 py-4 border-b border-[#3d3128] bg-[#141413]">
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#7a6e64]">Nome do Adjetivo</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#7a6e64]">Descrição</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#7a6e64] text-center">Polaridade</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#7a6e64] text-center">Visibilidade</span>
            <span className="text-[9px] uppercase tracking-widest font-bold text-[#7a6e64] text-center">Ações</span>
          </div>

          {/* Table Rows */}
          <AnimatePresence mode="popLayout">
            {filteredAtributos.map((at, index) => (
              <motion.div 
                key={at.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.02 }}
                className={`grid grid-cols-[1fr_140px_100px_100px_80px] gap-4 px-6 py-4 items-center border-b border-[#3d3128]/50 hover:bg-[#141413]/50 transition-colors group ${
                  !at.visivel ? 'opacity-50' : ''
                }`}
              >
                {/* Name */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${at.polaridade === 1 ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="text-sm font-bold font-display uppercase tracking-wider text-[#f5f0e8] truncate">
                    {at.nome}
                  </span>
                </div>

                {/* Description */}
                <span className="text-[10px] text-[#7a6e64] truncate">
                  {at.descricao || '—'}
                </span>

                {/* Polarity Badge */}
                <div className="flex justify-center">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest ${
                    at.polaridade === 1 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {at.polaridade === 1 ? 'Virtude' : 'Negativo'}
                  </span>
                </div>

                {/* Visibility Toggle */}
                <div className="flex justify-center">
                  <button
                    onClick={() => handleToggleVisivel(at)}
                    disabled={togglingId === at.id}
                    className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                      at.visivel 
                        ? 'bg-[#d97757] shadow-[0_0_12px_rgba(217,119,87,0.3)]' 
                        : 'bg-[#3d3128]'
                    } ${togglingId === at.id ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                    title={at.visivel ? 'Clique para ocultar' : 'Clique para mostrar'}
                  >
                    <motion.div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-[#f5f0e8] shadow-md"
                      animate={{ left: at.visivel ? '26px' : '2px' }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex justify-center">
                  <button 
                    onClick={() => setEditingAtributo(at)} 
                    className="text-[9px] uppercase font-bold tracking-widest text-[#7a6e64] hover:text-[#d97757] transition-colors opacity-0 group-hover:opacity-100"
                  >
                    Editar
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredAtributos.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#7a6e64]">Nenhum atributo encontrado</p>
            </div>
          )}
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
                      Virtude
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
