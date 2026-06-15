import { useEffect, useState } from 'react';
import { Loader2, Clock, Server } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { emprestimos, reservas, usuarios, livros, checkServicos } from '@/services/api';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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
  const [chartData, setChartData] = useState<{ name: string; emprestimos: number }[]>([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const status = await checkServicos();
        setStatusServicos(status);

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

        // Build chart data from actual loans
        if (emprestimosData.status === 'fulfilled') {
          const monthCounts: Record<string, number> = {};
          const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          emprestimosData.value.forEach((e) => {
            if (e.emprestimo_data_emprestimo) {
              const d = new Date(e.emprestimo_data_emprestimo);
              const key = meses[d.getMonth()];
              monthCounts[key] = (monthCounts[key] || 0) + 1;
            }
          });
          const cd = meses
            .filter((m) => monthCounts[m])
            .map((m) => ({ name: m, emprestimos: monthCounts[m] }));
          setChartData(cd.length > 0 ? cd : [
            { name: 'Jan', emprestimos: 0 },
            { name: 'Fev', emprestimos: 0 },
            { name: 'Mar', emprestimos: 0 },
          ]);

          // Recent activity
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

  const servicos = [
    { nome: 'Catálogo (9502)', online: statusServicos.catalogo },
    { nome: 'Usuário (9501)', online: statusServicos.usuario },
    { nome: 'Empréstimo (9500)', online: statusServicos.emprestimo },
    { nome: 'Reserva (9503)', online: statusServicos.reserva },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 border-l-4 border-slate-700 dark:border-slate-500">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Livros</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                  {kpis.totalLivros.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-primary dark:border-rose-500">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empréstimos Ativos</p>
                <p className="text-3xl font-bold text-primary dark:text-rose-400 mt-2">
                  {kpis.emprestimosAtivos.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-emerald-600 dark:border-emerald-400">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuários Ativos</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {kpis.usuariosAtivos.toLocaleString('pt-BR')}
                </p>
              </div>

              <div className="glass-card p-6 border-l-4 border-secondary dark:border-amber-400">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reservas Pendentes</p>
                <p className="text-3xl font-bold text-secondary dark:text-amber-400 mt-2">
                  {kpis.reservasPendentes.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Charts + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Empréstimos por Mês</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '8px',
                          border: 'none',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="emprestimos"
                        name="Empréstimos"
                        stroke="#881337"
                        strokeWidth={3}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Activity + Services */}
              <div className="space-y-6">
                {/* Recent activity */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5 text-indigo-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Atividade Recente
                    </h3>
                  </div>

                  {atividades.length === 0 ? (
                    <div className="text-center py-10">
                      <Clock className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                      <p className="text-slate-500 dark:text-slate-400">
                        Nenhuma atividade recente.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {atividades.map((a, index) => (
                        <div
                          key={a.id || index}
                          className="group relative flex items-start gap-4 p-4 rounded-xl
                                     bg-slate-50/70 dark:bg-slate-800/30
                                     border border-slate-200/50 dark:border-slate-700/50
                                     hover:border-indigo-500/40
                                     hover:bg-slate-100/70 dark:hover:bg-slate-800/50
                                     transition-all duration-300"
                        >
                          {/* Indicador */}
                          <div className="flex-shrink-0">
                            <div className="w-3 h-3 mt-2 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20" />
                          </div>

                          {/* Conteúdo */}
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800 dark:text-slate-100">
                              {a.descricao}
                            </p>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              Empréstimo registrado
                            </p>
                          </div>

                          {/* Hora */}
                          <span
                            className="px-3 py-1 text-xs font-medium rounded-full
                                       bg-indigo-100 text-indigo-700
                                       dark:bg-indigo-900/30 dark:text-indigo-300"
                          >
                            {a.hora}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Microservices status */}
                <div className="glass-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <Server className="w-5 h-5 text-cyan-500" />
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                      Status dos Microsserviços
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {servicos.map((s) => (
                      <div
                        key={s.nome}
                        className="flex items-center justify-between p-3 rounded-xl
                                   bg-slate-50/70 dark:bg-slate-800/30
                                   border border-slate-200/50 dark:border-slate-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              s.online
                                ? 'bg-emerald-500 animate-pulse'
                                : 'bg-rose-500'
                            }`}
                          />

                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {s.nome}
                          </span>
                        </div>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            s.online
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                          }`}
                        >
                          {s.online ? '🟢 Online' : '🔴 Offline'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
