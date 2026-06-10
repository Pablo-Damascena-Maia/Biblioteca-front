import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { reservas as api, Reserva } from '@/services/api';
import { toast } from 'sonner';

function statusBadge(s: string) {
  if (s === 'Ativa') return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s === 'Cancelada') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  if (s === 'Concluida') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s === 'Expirada') return 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400';
  return 'bg-slate-100 text-slate-600';
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

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Fila de Espera & Reservas</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Gerenciar reservas de livros</p>
          </div>
          <button className="sgb-btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nova Reserva
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">Nenhuma reserva encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((r) => (
              <div key={r.reserva_id} className="glass-card relative overflow-hidden">
                {/* Position badge */}
                {r.reserva_posicao_fila != null && (
                  <div className="absolute top-0 right-0 p-4">
                    <div className="w-12 h-12 rounded-full border-4 border-secondary bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center shadow-md">
                      <span className="text-secondary font-black text-lg">{r.reserva_posicao_fila}º</span>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  {/* Status badge */}
                  <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full mb-4 ${statusBadge(r.reserva_status)}`}>
                    {r.reserva_status.toUpperCase()}
                  </span>

                  {/* Info */}
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg pr-12 leading-tight mb-3">
                    Livro #{r.livro_id}
                  </h3>
                  <div className="space-y-1.5">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      <span className="font-semibold">Usuário:</span> #{r.usuario_id}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <span className="font-semibold">Solicitado em:</span>{' '}
                      {r.reserva_data_reserva ? new Date(r.reserva_data_reserva).toLocaleDateString('pt-BR') : '—'}
                    </p>
                    {r.reserva_data_expiracao && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        <span className="font-semibold">Expira em:</span>{' '}
                        {new Date(r.reserva_data_expiracao).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/30 px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-between">
                  {r.reserva_status === 'Ativa' ? (
                    <button
                      onClick={() => handleCancelar(r)}
                      className="text-slate-500 hover:text-rose-600 text-sm font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                  ) : (
                    <span />
                  )}
                  <span className="text-xs text-slate-400">#{r.reserva_id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
