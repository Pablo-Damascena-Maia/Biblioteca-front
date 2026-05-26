import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2, TrendingUp, Users, DollarSign, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { relatorios } from '@/services/api';
import { toast } from 'sonner';

interface KpiCard {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export default function Relatorios() {
  const [kpis, setKpis] = useState<Record<string, any>>({});
  const [topLivros, setTopLivros] = useState<any[]>([]);
  const [inadimplentes, setInadimplentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    async function carregar() {
      const [kpisRes, topRes, inadRes] = await Promise.allSettled([
        relatorios.dashboardKpis(),
        relatorios.topLivros(),
        relatorios.usuariosInadimplentes(),
      ]);
      if (kpisRes.status === 'fulfilled') setKpis(kpisRes.value);
      if (topRes.status === 'fulfilled') setTopLivros(Array.isArray(topRes.value) ? topRes.value : []);
      if (inadRes.status === 'fulfilled') setInadimplentes(Array.isArray(inadRes.value) ? inadRes.value : []);
      setLoading(false);
    }
    carregar();
  }, []);

  const handleExportarCSV = async () => {
    setExportando(true);
    try {
      const blob = await relatorios.exportarCSV();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-biblioteca-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('CSV exportado!');
    } catch {
      toast.error('Erro ao exportar CSV');
    } finally {
      setExportando(false);
    }
  };

  const cards: KpiCard[] = [
    { label: 'Total de Livros', value: kpis.totalLivros ?? '—', icon: BookOpen, color: 'text-blue-600' },
    { label: 'Usuários Ativos', value: kpis.usuariosAtivos ?? '—', icon: Users, color: 'text-green-600' },
    { label: 'Empréstimos Ativos', value: kpis.emprestimosAtivos ?? '—', icon: TrendingUp, color: 'text-purple-600' },
    { label: 'Total de Multas', value: kpis.multasTotal != null ? `R$ ${Number(kpis.multasTotal).toFixed(2).replace('.', ',')}` : '—', icon: DollarSign, color: 'text-orange-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Relatórios</h1>
            <p className="text-muted-foreground">Visão consolidada do sistema</p>
          </div>
          <Button onClick={handleExportarCSV} disabled={exportando} variant="outline">
            {exportando ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Exportar CSV
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {cards.map((c) => {
                const Icon = c.icon;
                return (
                  <Card key={c.label} className="border border-border">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                      <div className={c.color}><Icon className="w-5 h-5" /></div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-foreground">{c.value}</div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border border-border">
                <CardHeader><CardTitle>Top Livros Lidos</CardTitle></CardHeader>
                <CardContent>
                  {topLivros.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem dados disponíveis.</p>
                  ) : (
                    <div className="space-y-3">
                      {topLivros.slice(0, 5).map((l: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-muted-foreground w-5">{i + 1}.</span>
                            <span className="text-sm font-medium text-foreground">{l.titulo || l.livro_titulo || `Livro ${l.livro_id}`}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{l.total ?? l.count ?? ''} empréstimos</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-border">
                <CardHeader><CardTitle>Usuários Inadimplentes</CardTitle></CardHeader>
                <CardContent>
                  {inadimplentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum usuário inadimplente.</p>
                  ) : (
                    <div className="space-y-3">
                      {inadimplentes.slice(0, 5).map((u: any, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <span className="text-sm font-medium text-foreground">{u.nome || u.usuario_nome || `Usuário ${u.usuario_id}`}</span>
                          <span className="text-sm font-bold text-red-600">
                            {u.multa != null ? `R$ ${Number(u.multa).toFixed(2).replace('.', ',')}` : 'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
