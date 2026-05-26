import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit2, Trash2, Mail, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { usuarios as api, Usuario } from '@/services/api';
import { toast } from 'sonner';

export default function Usuarios() {
  const [data, setData] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false));
  }, []);

  const handleAlterarStatus = async (u: Usuario) => {
    const novoStatus = u.usuario_status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      await api.alterarStatus(u.usuario_id, novoStatus);
      setData((prev) => prev.map((x) => x.usuario_id === u.usuario_id ? { ...x, usuario_status: novoStatus as any } : x));
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

  const cargoColors: Record<string, string> = {
    Bibliotecario: 'bg-purple-50 text-purple-700 border-purple-200',
    Leitor: 'bg-gray-50 text-gray-700 border-gray-200',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Usuários</h1>
            <p className="text-muted-foreground">Gerenciar usuários do sistema</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Novo Usuário
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total de Usuários', value: data.length, color: '' },
            { label: 'Usuários Ativos', value: ativos, color: 'text-green-600' },
            { label: 'Inativos', value: inativos, color: 'text-orange-600' },
          ].map((stat) => (
            <Card key={stat.label} className="border border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle></CardHeader>
              <CardContent><div className={`text-3xl font-bold ${stat.color || 'text-foreground'}`}>{loading ? '—' : stat.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou CPF..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Card className="border border-border">
          <CardHeader><CardTitle>Lista de Usuários</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Tipo</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Cadastro</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.usuario_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-4 text-foreground font-medium">{u.usuario_nome}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          <span className="flex items-center gap-2"><Mail className="w-4 h-4" />{u.usuario_email}</span>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={cargoColors[u.usuario_tipo] || 'bg-gray-50 text-gray-700 border-gray-200'}>
                            {u.usuario_tipo}
                          </Badge>
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={u.usuario_status === 'Ativo' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                            {u.usuario_status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {u.usuario_data_cadastro ? new Date(u.usuario_data_cadastro).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="p-2 hover:bg-secondary rounded-md transition-colors" title="Editar">
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button className="p-2 hover:bg-secondary rounded-md transition-colors" title="Remover" onClick={() => handleRemover(u)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </button>
                            <button
                              className="text-xs border border-border rounded px-2 py-1 hover:bg-secondary transition-colors text-muted-foreground"
                              onClick={() => handleAlterarStatus(u)}
                            >
                              {u.usuario_status === 'Ativo' ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
