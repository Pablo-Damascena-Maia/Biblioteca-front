import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Calendar, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { emprestimos as api, Emprestimo } from '@/services/api';
import { toast } from 'sonner';

function statusColor(s: string) {
  if (s === 'Ativo') return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s === 'Atrasado') return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-green-50 text-green-700 border-green-200';
}

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export default function Emprestimos() {
  const [data, setData] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);

  const carregar = () => {
    setLoading(true);
    api.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar empréstimos'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const handleDevolver = async (e: Emprestimo) => {
    try {
      await api.devolver(e.emprestimo_id);
      setData((prev) => prev.map((x) => x.emprestimo_id === e.emprestimo_id ? { ...x, emprestimo_status: 'Devolvido' } : x));
      toast.success('Devolução registrada!');
    } catch {
      toast.error('Erro ao registrar devolução');
    }
  };

  const ativos   = data.filter((e) => e.emprestimo_status === 'Ativo');
  const atrasados = data.filter((e) => e.emprestimo_status === 'Atrasado');
  const multaTotal = atrasados.reduce((acc, e) => acc + (e.emprestimo_multa_valor ?? 0), 0);

  const TabelaEmprestimos = ({ lista }: { lista: Emprestimo[] }) => (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-3 px-4 font-semibold text-foreground">Usuário</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Livro</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Empréstimo</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Devolução</th>
            <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
            <th className="text-right py-3 px-4 font-semibold text-foreground">Ações</th>
          </tr>
        </thead>
        <tbody>
          {lista.length === 0 ? (
            <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum registro encontrado.</td></tr>
          ) : lista.map((e) => (
            <tr key={e.emprestimo_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
              <td className="py-4 px-4 text-foreground font-medium">{e.usuario?.usuario_nome ?? `ID ${e.usuario_id}`}</td>
              <td className="py-4 px-4 text-muted-foreground">{e.livro?.livro_titulo ?? `Livro ${e.livro_id}`}</td>
              <td className="py-4 px-4 text-muted-foreground">
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" />{fmt(e.emprestimo_data_emprestimo)}</span>
              </td>
              <td className="py-4 px-4 text-muted-foreground">{fmt(e.emprestimo_data_devolucao_prevista)}</td>
              <td className="py-4 px-4">
                <Badge variant="outline" className={statusColor(e.emprestimo_status)}>
                  {e.emprestimo_status === 'Atrasado' && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {e.emprestimo_status}
                </Badge>
              </td>
              <td className="py-4 px-4 text-right">
                {e.emprestimo_status !== 'Devolvido' && (
                  <Button variant="outline" size="sm" onClick={() => handleDevolver(e)}>
                    <RotateCcw className="w-3 h-3 mr-1" /> Devolver
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Empréstimos</h1>
            <p className="text-muted-foreground">Gerenciar empréstimos e devoluções</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Novo Empréstimo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Empréstimos Ativos', value: loading ? '—' : ativos.length, color: '' },
            { label: 'Atrasados', value: loading ? '—' : atrasados.length, color: 'text-red-600' },
            { label: 'Multas Pendentes', value: loading ? '—' : `R$ ${multaTotal.toFixed(2).replace('.', ',')}`, color: 'text-orange-600' },
          ].map((s) => (
            <Card key={s.label} className="border border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle></CardHeader>
              <CardContent><div className={`text-3xl font-bold ${s.color || 'text-foreground'}`}>{s.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border">
          <CardHeader><CardTitle>Histórico de Empréstimos</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <Tabs defaultValue="todos" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="todos">Todos ({data.length})</TabsTrigger>
                  <TabsTrigger value="ativos">Ativos ({ativos.length})</TabsTrigger>
                  <TabsTrigger value="atrasados">Atrasados ({atrasados.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="todos" className="mt-6"><TabelaEmprestimos lista={data} /></TabsContent>
                <TabsContent value="ativos" className="mt-6"><TabelaEmprestimos lista={ativos} /></TabsContent>
                <TabsContent value="atrasados" className="mt-6"><TabelaEmprestimos lista={atrasados} /></TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
