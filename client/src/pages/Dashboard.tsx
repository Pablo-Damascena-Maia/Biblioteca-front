import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, BarChart3, AlertCircle, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { cn } from '@/lib/utils';
import { emprestimos, reservas, usuarios, livros, checkServicos } from '@/services/api';
import { toast } from 'sonner';

interface KpiData {
  totalLivros: number;
  usuariosAtivos: number;
  emprestimosAtivos: number;
  reservasPendentes: number;
}

interface AtividadeRecente {
  id: number;
  descricao: string;
  hora: string;
}

export default function Dashboard() {
  const [kpis, setKpis] = useState<KpiData>({ totalLivros: 0, usuariosAtivos: 0, emprestimosAtivos: 0, reservasPendentes: 0 });
  const [atividades, setAtividades] = useState<AtividadeRecente[]>([]);
  const [statusServicos, setStatusServicos] = useState({ catalogo: false, usuario: false, emprestimo: false, reserva: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        // 1. Healthcheck dedicado — não depende de dados reais, apenas testa se o serviço responde
        const status = await checkServicos();
        setStatusServicos(status);

        // 2. Carrega KPIs em paralelo, sem travar se um serviço falhar
        const [livrosData, usuariosData, emprestimosData, pendentes] = await Promise.allSettled([
          livros.listar(),
          usuarios.listar(),
          emprestimos.listar(),
          reservas.contarPendentes(),
        ]);

        setKpis({
          totalLivros: livrosData.status === 'fulfilled' ? livrosData.value.length : 0,
          usuariosAtivos: usuariosData.status === 'fulfilled'
            ? usuariosData.value.filter((u) => u.usuario_status === 'Ativo').length
            : 0,
          emprestimosAtivos: emprestimosData.status === 'fulfilled'
            ? emprestimosData.value.filter((e) => e.emprestimo_status === 'Ativo').length
            : 0,
          reservasPendentes: pendentes.status === 'fulfilled' ? pendentes.value : 0,
        });

        // 3. Feed de atividades recentes
        if (emprestimosData.status === 'fulfilled') {
          const recentes = emprestimosData.value.slice(0, 5).map((e, i) => ({
            id: e.emprestimo_id,
            descricao: `Empréstimo #${e.emprestimo_id} — ${e.usuario?.usuario_nome || `Usuário ${e.usuario_id}`}`,
            hora: `há ${i + 1}h`,
          }));
          setAtividades(recentes);
        }
      } catch {
        toast.error('Erro ao carregar dados do dashboard');
      } finally {
        setLoading(false);
      }
    }
    carregarDados();
  }, []);

  const stats = [
    { title: 'Total de Livros',      value: kpis.totalLivros,       icon: <BookOpen  className="w-5 h-5" />, color: 'stat-blue',   bg: 'bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Usuários Ativos',      value: kpis.usuariosAtivos,    icon: <Users     className="w-5 h-5" />, color: 'stat-green',  bg: 'bg-green-100 dark:bg-green-900/30' },
    { title: 'Empréstimos Ativos',   value: kpis.emprestimosAtivos, icon: <BarChart3 className="w-5 h-5" />, color: 'stat-purple', bg: 'bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Reservas Pendentes',   value: kpis.reservasPendentes, icon: <AlertCircle className="w-5 h-5" />, color: 'stat-orange', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  const servicos = [
    { nome: 'Catálogo (9502)',   online: statusServicos.catalogo   },
    { nome: 'Usuário (9501)',    online: statusServicos.usuario    },
    { nome: 'Empréstimo (9500)', online: statusServicos.emprestimo },
    { nome: 'Reserva (9503)',    online: statusServicos.reserva    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 page-enter">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Bem-vindo ao sistema de gerenciamento da biblioteca</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => (
                <Card key={stat.title} className="card-premium">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bg, stat.color)}>{stat.icon}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value.toLocaleString('pt-BR')}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 card-premium">
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  {atividades.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
                  ) : (
                    <div className="space-y-4">
                      {atividades.map((a) => (
                        <div key={a.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium text-foreground">{a.descricao}</p>
                            <p className="text-sm text-muted-foreground">Empréstimo registrado</p>
                          </div>
                          <span className="text-xs text-muted-foreground">{a.hora}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-premium">
                <CardHeader>
                  <CardTitle>Status dos Microsserviços</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {servicos.map((s) => (
                    <div key={s.nome} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{s.nome}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        s.online ? 'badge-green' : 'badge-red'
                      }`}>
                        {s.online ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
