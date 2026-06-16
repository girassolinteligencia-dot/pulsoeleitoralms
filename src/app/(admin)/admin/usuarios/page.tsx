'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { adminFetch } from '@/lib/adminClient';

type AdminRole = 'admin' | 'editor' | 'viewer';

type AdminUser = {
  id: string;
  email: string;
  nome: string | null;
  role: AdminRole;
  ativo: boolean;
  ultimo_login_em: string | null;
  criado_em: string;
  atualizado_em: string;
};

const ROLE_LABELS: Record<AdminRole, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  viewer: 'Leitor',
};

const ROLE_HELP: Record<AdminRole, string> = {
  admin: 'Controle total, usuários e operações destrutivas.',
  editor: 'Edição operacional sem gestão de usuários.',
  viewer: 'Acesso de leitura e acompanhamento.',
};

function formatDate(value: string | null) {
  if (!value) return 'Nunca';
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({ nome: '', email: '', role: 'viewer' as AdminRole });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await adminFetch('/api/admin/users');
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao carregar usuários');
      setUsers(payload.data || []);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao carregar usuários');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (event: React.FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setMessage(null);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao criar usuário');
      setNewUser({ nome: '', email: '', role: 'viewer' });
      await fetchUsers();
      setMessage('Usuário administrativo criado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao criar usuário');
    } finally {
      setCreating(false);
    }
  };

  const updateUser = async (id: string, patch: Partial<Pick<AdminUser, 'nome' | 'role' | 'ativo'>>) => {
    setSavingId(id);
    setMessage(null);
    try {
      const res = await adminFetch('/api/admin/users', {
        method: 'PATCH',
        body: JSON.stringify({ id, ...patch }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Falha ao atualizar usuário');
      setUsers((current) => current.map((user) => user.id === id ? payload : user));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Falha ao atualizar usuário');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold font-display uppercase tracking-widest text-text">
            Usuários Administrativos
          </h2>
          <p className="text-[10px] text-text-muted uppercase mt-3 tracking-widest leading-relaxed">
            {users.length} usuário{users.length === 1 ? '' : 's'} cadastrado{users.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      <form
        onSubmit={createUser}
        className="border border-border rounded-[2rem] bg-surface-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_220px_auto] gap-4 items-end"
      >
        <label className="flex flex-col gap-2">
          <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted">Nome</span>
          <input
            value={newUser.nome}
            onChange={(event) => setNewUser((current) => ({ ...current, nome: event.target.value }))}
            className="bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-4 text-xs text-white transition-all placeholder:text-white/20"
            placeholder="Nome opcional"
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted">E-mail</span>
          <input
            type="email"
            value={newUser.email}
            onChange={(event) => setNewUser((current) => ({ ...current, email: event.target.value }))}
            className="bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-4 text-xs text-white transition-all placeholder:text-white/20"
            placeholder="usuario@dominio.com"
            required
          />
        </label>
        <label className="flex flex-col gap-2">
          <span className="text-[9px] uppercase font-bold tracking-widest text-text-muted">Permissão</span>
          <select
            value={newUser.role}
            onChange={(event) => setNewUser((current) => ({ ...current, role: event.target.value as AdminRole }))}
            className="bg-white/5 border border-white/10 focus:border-primary/50 outline-none rounded-2xl px-5 py-4 text-xs text-white transition-all"
          >
            {Object.entries(ROLE_LABELS).map(([role, label]) => (
              <option key={role} value={role}>{label}</option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={creating}
          className="bg-primary text-white px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {creating ? 'Criando...' : 'Criar'}
        </button>
      </form>

      {message && (
        <div className="border border-primary/20 bg-primary/5 text-primary rounded-2xl px-5 py-4 text-[11px] font-bold uppercase tracking-widest">
          {message}
        </div>
      )}

      <div className="hidden md:block bg-surface-1 border border-border rounded-[2.5rem] overflow-hidden">
        <table className="w-full text-left table-fixed">
          <colgroup>
            <col className="w-[28%]" />
            <col className="w-[24%]" />
            <col className="w-[17%]" />
            <col className="w-[13%]" />
            <col className="w-[18%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-border bg-surface-2/30">
              <th className="px-5 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Usuário</th>
              <th className="px-4 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Permissão</th>
              <th className="px-4 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Status</th>
              <th className="px-4 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Último acesso</th>
              <th className="px-4 py-4 text-[10px] uppercase font-bold text-text-muted tracking-widest">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-border/30 hover:bg-white/[0.01] transition-colors">
                <td className="px-5 py-5 min-w-0">
                  <p className="text-xs font-bold text-text truncate">{user.nome || 'Sem nome'}</p>
                  <p className="text-[10px] font-mono text-text-muted truncate mt-1">{user.email}</p>
                </td>
                <td className="px-4 py-5">
                  <select
                    value={user.role}
                    onChange={(event) => updateUser(user.id, { role: event.target.value as AdminRole })}
                    disabled={savingId === user.id}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none disabled:opacity-40"
                    title={ROLE_HELP[user.role]}
                  >
                    {Object.entries(ROLE_LABELS).map(([role, label]) => (
                      <option key={role} value={role}>{label}</option>
                    ))}
                  </select>
                  <p className="text-[8px] text-text-muted mt-2 leading-relaxed">{ROLE_HELP[user.role]}</p>
                </td>
                <td className="px-4 py-5">
                  <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${user.ativo ? 'text-positive bg-positive/10' : 'text-negative bg-negative/10'}`}>
                    {user.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-5 text-[10px] text-text-muted font-mono">
                  {formatDate(user.ultimo_login_em)}
                </td>
                <td className="px-4 py-5">
                  <button
                    type="button"
                    onClick={() => updateUser(user.id, { ativo: !user.ativo })}
                    disabled={savingId === user.id}
                    className={`px-4 py-2 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 ${user.ativo ? 'text-negative border-negative/30 bg-negative/5' : 'text-positive border-positive/30 bg-positive/5'}`}
                  >
                    {savingId === user.id ? 'Salvando...' : user.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && (
          <div className="p-16 text-center text-text-muted animate-pulse font-display uppercase tracking-widest text-[10px]">
            Carregando usuários...
          </div>
        )}
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {users.map((user) => (
          <div key={user.id} className="bg-surface-1 border border-border rounded-3xl p-6 flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest truncate">{user.nome || 'Sem nome'}</p>
              <p className="text-[10px] text-text-muted font-mono truncate mt-1">{user.email}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div className="bg-white/[0.02] rounded-2xl p-3">
                <p className="text-text-muted uppercase tracking-widest text-[8px]">Permissão</p>
                <p className="font-bold mt-1">{ROLE_LABELS[user.role]}</p>
              </div>
              <div className="bg-white/[0.02] rounded-2xl p-3">
                <p className="text-text-muted uppercase tracking-widest text-[8px]">Status</p>
                <p className={`font-bold mt-1 ${user.ativo ? 'text-positive' : 'text-negative'}`}>
                  {user.ativo ? 'Ativo' : 'Inativo'}
                </p>
              </div>
            </div>
            <select
              value={user.role}
              onChange={(event) => updateUser(user.id, { role: event.target.value as AdminRole })}
              disabled={savingId === user.id}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white outline-none disabled:opacity-40"
            >
              {Object.entries(ROLE_LABELS).map(([role, label]) => (
                <option key={role} value={role}>{label}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => updateUser(user.id, { ativo: !user.ativo })}
              disabled={savingId === user.id}
              className={`px-4 py-3 rounded-full border text-[9px] font-bold uppercase tracking-widest transition-all disabled:opacity-40 ${user.ativo ? 'text-negative border-negative/30 bg-negative/5' : 'text-positive border-positive/30 bg-positive/5'}`}
            >
              {savingId === user.id ? 'Salvando...' : user.ativo ? 'Desativar' : 'Ativar'}
            </button>
          </div>
        ))}
        {loading && (
          <div className="py-12 text-center text-text-muted animate-pulse uppercase tracking-widest text-[8px]">
            Carregando...
          </div>
        )}
      </div>
    </div>
  );
}
