import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, CheckCircle, Loader2, XCircle } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { reservas as api, Reserva } from '@/services/api';
import { toast } from 'sonner';

function statusColor(s: string) {
  if (s === 'Ativa') return 'bg-green-50 text-green-700 border-green-200';
  if (s === 'Cancelada') return 'bg-red-50 text-red-700 border-red-200';
  if (s === 'Expirada') return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-gray-50 text-gray-700 border-gray-200';
}

export default function Reservas() {
  const [data, setData] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listarAtivas()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar reservas'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelar = async (r: Reserva) => {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await api.cancelar(r.reserva_id);
      setData((prev) => prev.map((x) => x.reserva_id === r.reserva_id ? { ...x, reserva_status: 'Cancelada' } : x));
      toast.success('Reserva cancelada');
    } catch {
      toast.error('Erro ao cancelar reserva');
    }
  };

  const ativas    = data.filter((r) => r.reserva_status === 'Ativa').length;
  const pendentes = data.filter((r) => r.reserva_status !== 'Cancelada' && r.reserva_status !== 'Concluida').length;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Reservas</h1>
            <p className="text-muted-foreground">Gerenciar reservas de livros</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" /> Nova Reserva
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Total de Reservas', value: data.length, icon: Clock },
            { label: 'Ativas', value: ativas, icon: CheckCircle },
            { label: 'Pendentes/Expiradas', value: pendentes, icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label} className="border border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Icon className="w-4 h-4" />{label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{loading ? '—' : value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border border-border">
          <CardHeader><CardTitle>Lista de Reservas</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : data.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma reserva encontrada.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">ID</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Usuário</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Livro</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">Fila</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Data</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.reserva_id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-4 text-muted-foreground text-sm">#{r.reserva_id}</td>
                        <td className="py-4 px-4 text-foreground font-medium">Usuário {r.usuario_id}</td>
                        <td className="py-4 px-4 text-muted-foreground">Livro {r.livro_id}</td>
                        <td className="py-4 px-4 text-center">
                          {r.reserva_posicao_fila != null && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              #{r.reserva_posicao_fila}
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {r.reserva_data_reserva ? new Date(r.reserva_data_reserva).toLocaleDateString('pt-BR') : '—'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge variant="outline" className={statusColor(r.reserva_status)}>{r.reserva_status}</Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          {r.reserva_status === 'Ativa' && (
                            <Button variant="outline" size="sm" onClick={() => handleCancelar(r)}>
                              <XCircle className="w-3 h-3 mr-1" /> Cancelar
                            </Button>
                          )}
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
