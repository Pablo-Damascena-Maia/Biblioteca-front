import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import {
  emprestimos as api,
  usuarios as apiUsuarios,
  livros as apiLivros,
  exemplares as apiExemplares,
  Emprestimo,
  Usuario,
  Livro,
  Exemplar,
} from '@/services/api';
import { toast } from 'sonner';

function fmt(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export default function Emprestimos() {
  const { usuario, isAdmin } = useAuth();
  const [data, setData] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  // O Leitor já inicia na aba de ativos, pois não pode criar empréstimos novos livremente
  const [activeTab, setActiveTab] = useState<'novo' | 'ativos'>(isAdmin ? 'novo' : 'ativos');

  // ─── Creation state ──────────────────────────────────────────────────
  const [isCreating, setIsCreating] = useState(false);
  const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);
  const [livrosList, setLivrosList] = useState<Livro[]>([]);
  const [exemplaresList, setExemplaresList] = useState<Exemplar[]>([]);
  const [semExemplar, setSemExemplar] = useState(false);
  const [loadingModal, setLoadingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedLivro, setSelectedLivro] = useState('');
  const [selectedDataDevolucao, setSelectedDataDevolucao] = useState('');
  const [loadingExemplares, setLoadingExemplares] = useState(false);

  // ─── Devolução state ──────────────────────────────────────────────
  const [devolverDialog, setDevolverDialog] = useState(false);
  const [devolverTarget, setDevolverTarget] = useState<Emprestimo | null>(null);
  const [devolvendo, setDevolvendo] = useState(false);

  useEffect(() => {
    if (!isAdmin) setActiveTab('ativos');
  }, [isAdmin]);

  const carregar = () => {
    setLoading(true);
    api.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar empréstimos'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const iniciarCriacao = async () => {
    setIsCreating(true);
    setLoadingModal(true);
    setSelectedUsuario('');
    setSelectedLivro('');
    setSelectedDataDevolucao('');
    setExemplaresList([]);
    setSemExemplar(false);
    try {
      const [u, l] = await Promise.all([apiUsuarios.listar(), apiLivros.listar()]);
      setUsuariosList(Array.isArray(u) ? u.filter((x) => x.usuario_status === 'Ativo') : []);
      setLivrosList(Array.isArray(l) ? l.filter((x) => x.status === 1) : []);
    } catch (error) {
      console.error('[iniciarCriacao] Erro ao carregar:', error);
      toast.error('Falha ao carregar dados. Verifique se os microsserviços de Usuário e Catálogo estão rodando.');
    } finally {
      setLoadingModal(false);
    }
  };

  const handleLivroChange = async (livroId: string) => {
    setSelectedLivro(livroId);
    setExemplaresList([]);
    setSemExemplar(false);
    if (!livroId) return;
    setLoadingExemplares(true);
    try {
      const ex = await apiExemplares.listarPorLivro(Number(livroId));
      const disponiveis = Array.isArray(ex) ? ex.filter((e) => e.disponibilidade === 'Disponivel') : [];
      setExemplaresList(disponiveis);
      if (disponiveis.length === 0) setSemExemplar(true);
    } catch {
      toast.error('Erro ao carregar exemplares');
    } finally {
      setLoadingExemplares(false);
    }
  };

  const handleCriar = async () => {
    if (!selectedUsuario || !selectedLivro || !selectedDataDevolucao) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (exemplaresList.length === 0) {
      toast.error('Nenhum exemplar disponível para este livro');
      return;
    }
    const exemplarAuto = exemplaresList[0];
    setSubmitting(true);
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const dataDev = new Date(selectedDataDevolucao + 'T00:00:00');
      const diasPrazo = Math.max(1, Math.round((dataDev.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)));
      const novo = await api.criar({
        usuarioId: Number(selectedUsuario),
        livroId: Number(selectedLivro),
        exemplarId: exemplarAuto.id,
        diasPrazo,
      });
      const usuarioSel = usuariosList.find((u) => u.usuario_id === Number(selectedUsuario));
      const livroSel = livrosList.find((l) => l.id === Number(selectedLivro));
      const emprestimoCriado: Emprestimo = {
        ...novo,
        emprestimo_status: novo.emprestimo_status ?? 'Ativo',
        usuario: usuarioSel ? { usuario_nome: usuarioSel.usuario_nome } : undefined,
        livro: livroSel ? { livro_titulo: livroSel.titulo } : undefined,
      };
      setData((prev) => [emprestimoCriado, ...prev]);
      setIsCreating(false);
      toast.success('Empréstimo criado com sucesso!');
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Erro ao criar empréstimo';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const pedirDevolucao = (e: Emprestimo) => {
    setDevolverTarget(e);
    setDevolverDialog(true);
  };

  const confirmarDevolucao = async () => {
    if (!devolverTarget) return;
    setDevolvendo(true);
    try {
      const result = await api.devolver(devolverTarget.emprestimo_id);
      const isAtrasado = Boolean(result.devolucao_possui_multa) || result.houve_atraso;
      const novoStatus = isAtrasado ? 'Atrasado' : 'Devolvido';
      const valorMulta = result.multa?.multa_valor || result.valorMulta;

      setData((prev) =>
        prev.map((x) =>
          x.emprestimo_id === devolverTarget.emprestimo_id
            ? { ...x, emprestimo_status: novoStatus, emprestimo_multa_valor: valorMulta }
            : x,
        ),
      );

      if (isAtrasado) {
        toast.error(`Devolução com atraso! Multa gerada: R$ ${Number(valorMulta).toFixed(2).replace('.', ',')}`, {
          duration: 6000,
        });
      } else {
        toast.success('Devolução registrada com sucesso no prazo!');
      }
      setDevolverDialog(false);
    } catch {
      toast.error('Erro ao registrar devolução');
    } finally {
      setDevolvendo(false);
    }
  };

  // Filtragem Mágica do BabyShark: Se não for admin, vê apenas os PRÓPRIOS empréstimos
  const emprestimosVisiveis = isAdmin 
    ? data 
    : data.filter((e) => e.usuario_id === usuario?.usuario_id);

  const ativos = emprestimosVisiveis.filter((e) => e.emprestimo_status === 'Ativo');
  const atrasados = emprestimosVisiveis.filter((e) => e.emprestimo_status === 'Atrasado');

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {isAdmin ? 'Gestão de Empréstimos e Devoluções' : 'Meus Empréstimos'}
          </h1>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-bottom-2 duration-500">
          <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-emerald-500">
            <div className="p-3 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-lg shadow-sm">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">No Prazo</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{ativos.length}</h3>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-rose-500">
            <div className="p-3 bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 rounded-lg shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Atrasados</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{atrasados.length}</h3>
            </div>
          </div>
          <div className="glass-card p-5 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="p-3 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg shadow-sm">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Histórico</p>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{emprestimosVisiveis.length}</h3>
            </div>
          </div>
        </div>

        {/* Tabs - Escondidas para o Leitor */}
        {isAdmin && (
          <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => { setActiveTab('novo'); setIsCreating(false); }}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'novo'
                  ? 'border-primary text-primary dark:text-rose-400 dark:border-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Registrar Nova Retirada
            </button>
            <button
              onClick={() => setActiveTab('ativos')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'ativos'
                  ? 'border-primary text-primary dark:text-rose-400 dark:border-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Processar Devolução ({ativos.length + atrasados.length})
            </button>
          </div>
        )}

        {/* Tab: Nova Retirada (Apenas Admin) */}
        {activeTab === 'novo' && isAdmin && (
          <div className="glass-card p-8 w-full animate-in zoom-in-95 duration-300">
            {!isCreating ? (
              <div className="flex flex-col items-center text-center space-y-6 py-12">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-primary/20 to-primary/5 flex items-center justify-center text-primary shadow-inner mb-2 ring-1 ring-primary/20">
                  <Plus className="w-12 h-12" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    Registrar Novo Empréstimo
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-lg">
                    Inicie o processo de retirada selecionando um leitor e um livro disponível no catálogo.
                  </p>
                </div>
                <button 
                  onClick={iniciarCriacao} 
                  className="sgb-btn-primary mt-4 px-8 py-4 text-lg font-semibold flex items-center gap-3 shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-1 rounded-xl"
                >
                  <Plus className="w-6 h-6" />
                  Iniciar Empréstimo
                </button>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto py-4 animate-in slide-in-from-bottom-4 duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Novo Empréstimo</h2>
                  <p className="text-slate-500 dark:text-slate-400">
                    Selecione o usuário e livro para registrar um novo empréstimo. Um exemplar disponível será selecionado automaticamente.
                  </p>
                </div>

                {loadingModal ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="select-usuario">Usuário</Label>
                      <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
                        <SelectTrigger id="select-usuario" className="w-full">
                          <SelectValue placeholder="Selecione um usuário" />
                        </SelectTrigger>
                        <SelectContent>
                          {usuariosList.length === 0 ? (
                            <SelectItem value="_empty" disabled>Nenhum usuário ativo encontrado</SelectItem>
                          ) : (
                            usuariosList.map((u) => (
                              <SelectItem key={u.usuario_id} value={String(u.usuario_id)}>
                                {u.usuario_nome} — {u.usuario_email}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="select-livro">Livro</Label>
                      <Select value={selectedLivro} onValueChange={handleLivroChange}>
                        <SelectTrigger id="select-livro" className="w-full">
                          <SelectValue placeholder="Selecione um livro" />
                        </SelectTrigger>
                        <SelectContent>
                          {livrosList.length === 0 ? (
                            <SelectItem value="_empty" disabled>Nenhum livro ativo encontrado</SelectItem>
                          ) : (
                            livrosList.map((l) => (
                              <SelectItem key={l.id} value={String(l.id)}>
                                {l.titulo}
                                {l.autores && l.autores.length > 0 ? ` — ${l.autores.map(a => a.autor.nome).join(', ')}` : ''}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedLivro && !loadingExemplares && (
                      <div className="text-sm px-1">
                        {semExemplar ? (
                          <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            Nenhum exemplar disponível para este livro
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            ✓ {exemplaresList.length} exemplar(es) disponível(is) — um será selecionado automaticamente
                          </span>
                        )}
                      </div>
                    )}
                    {loadingExemplares && (
                      <div className="flex items-center gap-2 text-sm text-slate-500 px-1 font-medium">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verificando exemplares disponíveis...
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="input-data-devolucao">Data de Devolução Prevista</Label>
                      <Input
                        id="input-data-devolucao"
                        type="date"
                        value={selectedDataDevolucao}
                        onChange={(e) => setSelectedDataDevolucao(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200 dark:border-slate-700 mt-8">
                      <Button variant="outline" onClick={() => setIsCreating(false)} disabled={submitting}>
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCriar}
                        disabled={submitting || !selectedUsuario || !selectedLivro || !selectedDataDevolucao || semExemplar || exemplaresList.length === 0}
                      >
                        {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Registrar Empréstimo
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab: Devoluções / Lista de Empréstimos */}
        {activeTab === 'ativos' && (
          <div className="glass-card overflow-hidden animate-in slide-in-from-right-4 duration-300">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-5 font-semibold">Livro</th>
                    {isAdmin && <th className="px-6 py-5 font-semibold">Leitor</th>}
                    <th className="px-6 py-5 font-semibold">Prazo</th>
                    <th className="px-6 py-5 font-semibold">Status</th>
                    <th className="px-6 py-5 font-semibold">Multa</th>
                    {isAdmin && <th className="px-6 py-5 font-semibold text-right">Ações</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {[...ativos, ...atrasados].length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 6 : 4} className="text-center py-8 text-slate-400">Nenhum empréstimo ativo.</td>
                    </tr>
                  ) : (
                    [...ativos, ...atrasados].map((e) => (
                      <tr key={e.emprestimo_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                          {e.livro?.livro_titulo ?? (e.itens?.length ? `Exemplar ${e.itens.map(i => i.exemplar_id).join(', ')}` : '—')}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 dark:text-slate-300">
                            {e.usuario?.usuario_nome ?? `ID ${e.usuario_id}`}
                          </td>
                        )}
                        <td className="px-6 py-4 dark:text-slate-300 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {fmt(e.emprestimo_data_prevista_devolucao)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                              e.emprestimo_status === 'Ativo'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'
                            }`}
                          >
                            {e.emprestimo_status === 'Atrasado' && <AlertTriangle className="w-3 h-3" />}
                            {e.emprestimo_status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {e.emprestimo_status === 'Atrasado' && e.emprestimo_multa_valor != null ? (
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900 rounded-lg shadow-sm">
                              <span className="text-rose-500 dark:text-rose-400 font-medium text-[10px] uppercase tracking-wider">Multa</span>
                              <span className="font-bold text-rose-700 dark:text-rose-300">
                                R$ {Number(e.emprestimo_multa_valor).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => pedirDevolucao(e)}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-rose-100 text-slate-700 hover:text-rose-700 dark:bg-slate-800 dark:hover:bg-rose-900/40 dark:text-slate-300 dark:hover:text-rose-400 font-medium rounded-lg transition-all"
                            >
                              <RotateCcw className="w-4 h-4" />
                              Processar
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Modais (Ocultos no bloco se não for admin, mas renderizados condicionalmente abaixo) ─────────────────────────────────────── */}

      {isAdmin && (
        <Dialog open={devolverDialog} onOpenChange={setDevolverDialog}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Confirmar Devolução</DialogTitle>
              <DialogDescription>
                Deseja registrar a devolução do livro{' '}
                <strong>{devolverTarget?.livro?.livro_titulo ?? `#${devolverTarget?.livro_id}`}</strong>{' '}
                emprestado para{' '}
                <strong>{devolverTarget?.usuario?.usuario_nome ?? `ID ${devolverTarget?.usuario_id}`}</strong>?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDevolverDialog(false)} disabled={devolvendo}>
                Cancelar
              </Button>
              <Button onClick={confirmarDevolucao} disabled={devolvendo}>
                {devolvendo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirmar Devolução
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  );
}