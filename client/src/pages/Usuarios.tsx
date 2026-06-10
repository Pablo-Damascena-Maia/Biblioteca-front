import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Plus, Edit2, Trash2, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { usuarios as api, Usuario } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EMPTY_FORM = {
  usuario_nome: '',
  usuario_email: '',
  usuario_senha: '',
  usuario_tipo: 'Leitor' as 'Leitor' | 'Bibliotecario',
  usuario_status: 'Ativo' as 'Ativo' | 'Inativo' | 'Bloqueado',
};

export default function Usuarios() {
  const { isAdmin } = useAuth();
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Usuario | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  const openCriar = () => {
    setEditTarget(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEditar = (u: Usuario) => {
    setEditTarget(u);
    setForm({
      usuario_nome: u.usuario_nome,
      usuario_email: u.usuario_email,
      usuario_senha: '',
      usuario_tipo: u.usuario_tipo,
      usuario_status: u.usuario_status,
    });
    setModalOpen(true);
  };

  const handleSalvar = async () => {
    if (!form.usuario_nome || !form.usuario_email) {
      toast.error('Nome e email são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const payload: Partial<Usuario> = {
          usuario_nome: form.usuario_nome,
          usuario_email: form.usuario_email,
          usuario_tipo: form.usuario_tipo,
          usuario_status: form.usuario_status,
        };
        const updated = await api.atualizar(editTarget.usuario_id, payload);
        setData((prev) =>
          prev.map((x) => (x.usuario_id === editTarget.usuario_id ? { ...x, ...updated } : x))
        );
        toast.success('Usuário atualizado');
      } else {
        if (!form.usuario_senha) {
          toast.error('Senha obrigatória');
          setSaving(false);
          return;
        }
        const novo = await api.criar({ ...form });
        setData((prev) => [...prev, novo]);
        toast.success('Usuário criado com sucesso');
      }
      setModalOpen(false);
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Erro ao salvar usuário';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAlterarStatus = async (u: Usuario) => {
    const novoStatus = u.usuario_status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await api.alterarStatus(u.usuario_id, novoStatus);
      setData((prev) =>
        prev.map((x) =>
          x.usuario_id === u.usuario_id ? { ...x, usuario_status: novoStatus as any } : x
        )
      );
      toast.success(`Usuário ${novoStatus === 'Ativo' ? 'ativado' : 'desativado'}`);
    } catch {
      toast.error('Erro ao alterar status');
    }
  };

  const handleRemover = async (u: Usuario) => {
    if (!confirm(`Remover ${u.usuario_nome}?`)) return;
    try {
      await api.remover(u.usuario_id);
      setData((prev) => prev.filter((x) => x.usuario_id !== u.usuario_id));
      toast.success('Usuário removido');
    } catch {
      toast.error('Erro ao remover usuário');
    }
  };

  const filtered = data.filter(
    (u) =>
      u.usuario_nome.toLowerCase().includes(search.toLowerCase()) ||
      u.usuario_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Gestão de Usuários</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Administração de perfis e privilégios.</p>
          </div>
          {isAdmin && (
            <button onClick={openCriar} className="sgb-btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Usuário
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className="sgb-input pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase">
              <tr>
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Nível de Acesso</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Cadastro</th>
                {isAdmin && <th className="px-6 py-4 text-right">Ações de Gestão</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400">Nenhum usuário encontrado.</td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.usuario_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{u.usuario_nome}</p>
                      <p className="text-slate-500 dark:text-slate-400">{u.usuario_email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.usuario_tipo === 'Bibliotecario'
                            ? 'bg-primary text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {u.usuario_tipo === 'Bibliotecario' ? 'BIBLIOTECÁRIO' : 'LEITOR'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          u.usuario_status === 'Ativo'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : u.usuario_status === 'Bloqueado'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}
                      >
                        {u.usuario_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                      {u.usuario_data_cadastro
                        ? new Date(u.usuario_data_cadastro).toLocaleDateString('pt-BR')
                        : '—'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditar(u)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            onClick={() => handleRemover(u)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                            title="Remover"
                          >
                            <Trash2 className="w-4 h-4 text-rose-500" />
                          </button>
                          <button
                            onClick={() => handleAlterarStatus(u)}
                            className="sgb-btn-secondary text-xs py-1.5 px-2.5 whitespace-nowrap"
                          >
                            {u.usuario_status === 'Ativo' ? 'Desativar' : 'Ativar'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar / Editar */}
      {isAdmin && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editTarget ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="sgb-label">Nome completo</label>
                <Input
                  placeholder="Nome do usuário"
                  value={form.usuario_nome}
                  onChange={(e) => setForm((f) => ({ ...f, usuario_nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="sgb-label">Email</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.usuario_email}
                  onChange={(e) => setForm((f) => ({ ...f, usuario_email: e.target.value }))}
                />
              </div>
              {!editTarget && (
                <div className="space-y-1">
                  <label className="sgb-label">Senha</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={form.usuario_senha}
                    onChange={(e) => setForm((f) => ({ ...f, usuario_senha: e.target.value }))}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="sgb-label">Tipo</label>
                  <select
                    className="sgb-input"
                    value={form.usuario_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, usuario_tipo: e.target.value as any }))}
                  >
                    <option value="Leitor">Leitor</option>
                    <option value="Bibliotecario">Bibliotecário</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="sgb-label">Status</label>
                  <select
                    className="sgb-input"
                    value={form.usuario_status}
                    onChange={(e) => setForm((f) => ({ ...f, usuario_status: e.target.value as any }))}
                  >
                    <option value="Ativo">Ativo</option>
                    <option value="Inativo">Inativo</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={handleSalvar} disabled={saving} className="gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editTarget ? 'Salvar alterações' : 'Criar usuário'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}
