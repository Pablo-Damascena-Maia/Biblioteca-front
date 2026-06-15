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
  const [data, setData] = useState<Emprestimo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'novo' | 'ativos'>('novo');

  // ─── Modal state ──────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
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

  const carregar = () => {
    setLoading(true);
    api.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar empréstimos'))
      .finally(() => setLoading(false));
  };

  useEffect(carregar, []);

  const abrirModal = async () => {
    setModalOpen(true);
    setLoadingModal(true);
    setSelectedUsuario('');
    setSelectedLivro('');
    setSelectedDataDevolucao('');
    setExemplaresList([]);
    setSemExemplar(false);
    try {
      const [u, l] = await Promise.all([apiUsuarios.listar(), apiLivros.listar()]);
      setUsuariosList(Array.isArray(u) ? u.filter((x) => x.usuario_status === 'Ativo') : []);
      setLivrosList(Array.isArray(l) ? l.filter((x) => x.status == 1) : []);
    } catch {
      toast.error('Erro ao carregar dados para o formulário');
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
      const disponiveis = Array.isArray(ex) ? ex.filter((e) => {
        const disp = (e.disponibilidade || (e as any).statusDisponibilidade || '').toString().toLowerCase();
        const matchesLivro = Number(e.livroId || (e as any).livro_id) === Number(livroId);
        return disp === 'disponivel' && matchesLivro;
      }) : [];
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
      setModalOpen(false);
      toast.success('Empréstimo criado com sucesso!');
    } catch (err: any) {
      const errData = err?.response?.data;
      const msg =
        (typeof errData?.error === 'string' ? errData.error : errData?.error?.message) ||
        errData?.message ||
        'Erro ao criar empréstimo';
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
      await api.devolver(devolverTarget.emprestimo_id);
      setData((prev) =>
        prev.map((x) =>
          x.emprestimo_id === devolverTarget.emprestimo_id
            ? { ...x, emprestimo_status: 'Devolvido' }
            : x,
        ),
      );
      toast.success('Devolução registrada!');
      setDevolverDialog(false);
    } catch (err: any) {
      const errData = err?.response?.data;
      const msg =
        (typeof errData?.error === 'string' ? errData.error : errData?.error?.message) ||
        errData?.message ||
        'Erro ao registrar devolução';
      toast.error(msg);
    } finally {
      setDevolvendo(false);
    }
  };

  const ativos = data.filter((e) => e.emprestimo_status === 'Ativo');
  const atrasados = data.filter((e) => e.emprestimo_status === 'Atrasado');

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 border-b border-slate-200 dark:border-slate-700 pb-4">
          Gestão de Empréstimos e Devoluções
        </h1>

        {/* Tabs */}
        <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('novo')}
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

        {/* Tab: Nova Retirada */}
        {activeTab === 'novo' && (
          <div className="glass-card p-6 max-w-2xl">
            <div className="space-y-6">
              <div>
                <label className="sgb-label">Buscar Usuário</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Clique em 'Novo Empréstimo' para buscar..." className="sgb-input" disabled />
                  <button onClick={abrirModal} className="sgb-btn-primary whitespace-nowrap flex items-center gap-2 shrink-0">
                    <Plus className="w-4 h-4" />
                    Novo Empréstimo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Devoluções */}
        {activeTab === 'ativos' && (
          <div className="glass-card overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-4">Livro</th>
                    <th className="px-6 py-4">Leitor</th>
                    <th className="px-6 py-4">Prazo</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Multa</th>
                    <th className="px-6 py-4">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {[...ativos, ...atrasados].length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400">Nenhum empréstimo ativo.</td>
                    </tr>
                  ) : (
                    [...ativos, ...atrasados].map((e) => (
                      <tr key={e.emprestimo_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">
                          {e.livro?.livro_titulo ?? (e.itens?.length ? `Exemplar ${e.itens.map(i => i.exemplar_id).join(', ')}` : '—')}
                        </td>
                        <td className="px-6 py-4 dark:text-slate-300">
                          {e.usuario?.usuario_nome ?? `ID ${e.usuario_id}`}
                        </td>
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
                        <td className="px-6 py-4">
                          <button
                            onClick={() => pedirDevolucao(e)}
                            className="text-primary hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 font-bold flex items-center gap-1 text-sm"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Processar
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* ─── Modal: Novo Empréstimo ─────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
            <DialogDescription>
              Selecione o usuário e livro para registrar um novo empréstimo. Um exemplar disponível será selecionado automaticamente.
            </DialogDescription>
          </DialogHeader>

          {loadingModal ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
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
                    <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      Nenhum exemplar disponível para este livro
                    </span>
                  ) : (
                    <span className="text-green-600 dark:text-green-400">
                      ✓ {exemplaresList.length} exemplar(es) disponível(is) — um será selecionado automaticamente
                    </span>
                  )}
                </div>
              )}
              {loadingExemplares && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
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
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriar}
              disabled={submitting || !selectedUsuario || !selectedLivro || !selectedDataDevolucao || semExemplar || exemplaresList.length === 0}
            >
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Empréstimo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Modal: Confirmar Devolução ─────────────────────────────────── */}
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
    </DashboardLayout>
  );
}
