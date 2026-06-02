import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Search, Plus, Edit2, Trash2, Mail, Loader2, UserCheck, UserX, Shield, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { usuarios as api, Usuario } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const EMPTY_FORM = {
  usuario_nome: '',
  usuario_email: '',
  usuario_cpf: '',
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
      usuario_cpf: u.usuario_cpf,
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
          usuario_cpf: form.usuario_cpf,
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
      u.usuario_email.toLowerCase().includes(search.toLowerCase()) ||
      u.usuario_cpf.includes(search)
  );

  const ativos = data.filter((u) => u.usuario_status === 'Ativo').length;
  const inativos = data.filter((u) => u.usuario_status !== 'Ativo').length;
  const bibliotecarios = data.filter((u) => u.usuario_tipo === 'Bibliotecario').length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-1">Usuários</h1>
            <p className="text-muted-foreground">Gestão de usuários do sistema</p>
          </div>
          {isAdmin && (
            <Button
              onClick={openCriar}
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
            >
              <Plus className="w-4 h-4" /> Novo Usuário
            </Button>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: data.length, icon: <Mail className="w-5 h-5" />, color: 'text-foreground' },
            { label: 'Ativos', value: ativos, icon: <UserCheck className="w-5 h-5" />, color: 'text-green-600' },
            { label: 'Inativos', value: inativos, icon: <UserX className="w-5 h-5" />, color: 'text-orange-500' },
            { label: 'Bibliotecários', value: bibliotecarios, icon: <Shield className="w-5 h-5" />, color: 'text-purple-600' },
          ].map((s) => (
            <Card key={s.label} className="border border-border">
              <CardContent className="pt-5 flex items-center gap-4">
                <div className={`${s.color} opacity-80`}>{s.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className={`text-2xl font-bold ${s.color}`}>{loading ? '—' : s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou CPF..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Table */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
                <BookOpen className="w-10 h-10 opacity-30" />
                <p>Nenhum usuário encontrado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      {['Nome', 'Email', 'Tipo', 'Status', 'Cadastro'].map((h) => (
                        <th
                          key={h}
                          className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide text-xs"
                        >
                          {h}
                        </th>
                      ))}
                      {isAdmin && (
                        <th className="text-right py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wide text-xs">
                          Ações
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr
                        key={u.usuario_id}
                        className="border-b border-border hover:bg-secondary/40 transition-colors"
                      >
                        <td className="py-4 px-4 font-medium text-foreground">{u.usuario_nome}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 shrink-0" />
                            {u.usuario_email}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className={
                              u.usuario_tipo === 'Bibliotecario'
                                ? 'bg-purple-50 text-purple-700 border-purple-200 gap-1'
                                : 'bg-blue-50 text-blue-700 border-blue-200 gap-1'
                            }
                          >
                            {u.usuario_tipo === 'Bibliotecario' ? (
                              <><Shield className="w-3 h-3" /> Bibliotecário</>
                            ) : (
                              <><BookOpen className="w-3 h-3" /> Leitor</>
                            )}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            variant="outline"
                            className={
                              u.usuario_status === 'Ativo'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : u.usuario_status === 'Bloqueado'
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-orange-50 text-orange-700 border-orange-200'
                            }
                          >
                            {u.usuario_status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-xs">
                          {u.usuario_data_cadastro
                            ? new Date(u.usuario_data_cadastro).toLocaleDateString('pt-BR')
                            : '—'}
                        </td>
                        {isAdmin && (
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                                title="Editar"
                                onClick={() => openEditar(u)}
                              >
                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-secondary rounded-md transition-colors"
                                title="Remover"
                                onClick={() => handleRemover(u)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </button>
                              <button
                                className="text-xs border border-border rounded px-2.5 py-1.5 hover:bg-secondary transition-colors text-muted-foreground whitespace-nowrap"
                                onClick={() => handleAlterarStatus(u)}
                              >
                                {u.usuario_status === 'Ativo' ? 'Desativar' : 'Ativar'}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal Criar / Editar — apenas para Bibliotecários */}
      {isAdmin && (
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editTarget ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Nome completo</label>
                <Input
                  placeholder="Nome do usuário"
                  value={form.usuario_nome}
                  onChange={(e) => setForm((f) => ({ ...f, usuario_nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.usuario_email}
                  onChange={(e) => setForm((f) => ({ ...f, usuario_email: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">CPF</label>
                <Input
                  placeholder="000.000.000-00"
                  value={form.usuario_cpf}
                  onChange={(e) => setForm((f) => ({ ...f, usuario_cpf: e.target.value }))}
                />
              </div>
              {!editTarget && (
                <div className="space-y-1">
                  <label className="text-sm font-medium">Senha</label>
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
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
                    value={form.usuario_tipo}
                    onChange={(e) => setForm((f) => ({ ...f, usuario_tipo: e.target.value as any }))}
                  >
                    <option value="Leitor">Leitor</option>
                    <option value="Bibliotecario">Bibliotecário</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    className="w-full border border-input bg-background rounded-md px-3 py-2 text-sm"
                    value={form.usuario_status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, usuario_status: e.target.value as any }))
                    }
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
