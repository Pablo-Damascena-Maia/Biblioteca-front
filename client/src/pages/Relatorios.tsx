import { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { relatorios } from '@/services/api';
import { toast } from 'sonner';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

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

  // Chart data from top livros
  const chartData = topLivros.slice(0, 5).map((l: any) => ({
    name: (l.titulo || l.livro_titulo || `Livro ${l.livro_id}`).slice(0, 20),
    Empréstimos: l.total ?? l.count ?? 0,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Relatórios</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Visão consolidada do sistema</p>
          </div>
          <button
            onClick={handleExportarCSV}
            disabled={exportando}
            className="sgb-btn-secondary flex items-center gap-2 disabled:opacity-50"
          >
            {exportando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar CSV
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="glass-card p-6 border-l-4 border-slate-700 dark:border-slate-500">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total de Livros</p>
                <p className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-2">
                  {kpis.totalLivros ?? '—'}
                </p>
              </div>
              <div className="glass-card p-6 border-l-4 border-emerald-600 dark:border-emerald-400">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Usuários Ativos</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">
                  {kpis.usuariosAtivos ?? '—'}
                </p>
              </div>
              <div className="glass-card p-6 border-l-4 border-primary dark:border-rose-500">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Empréstimos Ativos</p>
                <p className="text-3xl font-bold text-primary dark:text-rose-400 mt-2">
                  {kpis.emprestimosAtivos ?? '—'}
                </p>
              </div>
              <div className="glass-card p-6 border-l-4 border-rose-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-rose-800 dark:text-rose-400 uppercase tracking-wider">Total de Multas</p>
                    <p className="text-3xl font-bold text-rose-600 dark:text-rose-300 mt-2">
                      {kpis.multasTotal != null ? `R$ ${Number(kpis.multasTotal).toFixed(2).replace('.', ',')}` : '—'}
                    </p>
                  </div>
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-lg">
                    <svg className="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* BarChart - Top Livros */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Top Livros Mais Emprestados</h3>
                {chartData.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sem dados disponíveis.</p>
                ) : (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                          cursor={{ fill: 'rgba(219,39,119,0.05)' }}
                          contentStyle={{
                            borderRadius: '8px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="Empréstimos" fill="#db2777" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Inadimplentes */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6">Usuários Inadimplentes</h3>
                {inadimplentes.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum usuário inadimplente.</p>
                ) : (
                  <div className="space-y-3">
                    {inadimplentes.slice(0, 8).map((u: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center text-xs font-bold text-rose-600 dark:text-rose-400">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {u.nome || u.usuario_nome || `Usuário ${u.usuario_id}`}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">
                          {u.multa != null ? `R$ ${Number(u.multa).toFixed(2).replace('.', ',')}` : 'Pendente'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
