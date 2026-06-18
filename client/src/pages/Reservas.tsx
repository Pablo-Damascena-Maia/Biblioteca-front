import { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { reservas as api, Reserva } from '@/services/api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function statusBadge(s: string | number) {
  if (s === 'Ativa' || s === 1) return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  if (s === 'Cancelada' || s === 0) return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
  if (s === 'Concluida') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
  if (s === 'Expirada') return 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400';
  return 'bg-slate-100 text-slate-600';
}

function getStatusLabel(s: string | number) {
  if (s === 1) return 'ATIVA';
  if (s === 0) return 'CANCELADA';
  if (typeof s === 'string') return s.toUpperCase();
  return String(s);
}

export default function Reservas() {
  const { usuario, isAdmin } = useAuth();
  const [data, setData] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalAberto, setModalAberto] = useState(false);
  const [livroId, setLivroId] = useState('');
  const [usuarioId, setUsuarioId] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregarReservas = () => {
    setLoading(true);
    api.listarAtivas()
      .then(setData)
      .catch((err: any) => {
        toast.error(err?.response?.data?.message || err?.message || 'Erro ao carregar reservas');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarReservas();
  }, []);

  const handleCancelar = async (r: Reserva) => {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await api.cancelar(r.reserva_id);

      setData((prev) =>
        prev.map((x) =>
          x.reserva_id === r.reserva_id
            ? { ...x, reserva_status: 0 as any }
            : x
        )
      );

      toast.success('Reserva cancelada');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        'Erro ao cancelar reserva'
      );
    }
  };

  const handleCriarReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!livroId) return toast.error('Informe o ID do livro');
    
    const targetUsuarioId = isAdmin ? usuarioId : usuario?.usuario_id;
    if (!targetUsuarioId) return toast.error('ID do usuário não disponível');

    try {
      setSalvando(true);
      await api.criar({
        livro_id: Number(livroId),
        usuario_id: Number(targetUsuarioId)
      });
      toast.success('Reserva criada com sucesso!');
      setModalAberto(false);
      setLivroId('');
      setUsuarioId('');
      carregarReservas();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Erro ao criar reserva');
    } finally {
      setSalvando(false);
    }
  };

  // Filtragem Mágica do BabyShark:
  const reservasVisiveis = isAdmin
    ? data
    : data.filter((r) => r.usuario_id === usuario?.usuario_id);

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isAdmin ? 'Fila de Espera & Reservas' : 'Minhas Reservas'}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin ? 'Gerenciar reservas de livros' : 'Acompanhe seus livros reservados'}
            </p>
          </div>
          <button 
            className="sgb-btn-primary flex items-center gap-2"
            onClick={() => setModalAberto(true)}
          >
            <Plus className="w-4 h-4" />
            Nova Reserva
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : reservasVisiveis.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">Nenhuma reserva encontrada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reservasVisiveis.map((r) => (
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
                    {getStatusLabel(r.reserva_status)}
                  </span>

                  {/* Info */}
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg pr-12 leading-tight mb-3">
                    Livro #{r.livro_id}
                  </h3>
                  <div className="space-y-1.5">
                    {/* Oculta a visualização do ID do Usuário se não for Admin (desnecessário para o Leitor) */}
                    {isAdmin && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-semibold">Usuário:</span> #{r.usuario_id}
                      </p>
                    )}
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
                  {(r.reserva_status === 'Ativa' || r.reserva_status === 1) ? (
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

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>
              Preencha os dados abaixo para reservar um livro na fila de espera.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCriarReserva} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ID do Livro</label>
              <input
                type="number"
                required
                className="sgb-input w-full"
                placeholder="Ex: 12"
                value={livroId}
                onChange={e => setLivroId(e.target.value)}
              />
            </div>

            {isAdmin && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ID do Usuário</label>
                <input
                  type="number"
                  required
                  className="sgb-input w-full"
                  placeholder="Ex: 5"
                  value={usuarioId}
                  onChange={e => setUsuarioId(e.target.value)}
                />
              </div>
            )}

            <DialogFooter>
              <button
                type="button"
                className="sgb-btn-secondary"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="sgb-btn-primary flex items-center gap-2"
                disabled={salvando}
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}