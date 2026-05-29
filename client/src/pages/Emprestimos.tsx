import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  // ─── Estado do modal "Novo Empréstimo" ────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [usuariosList, setUsuariosList] = useState<Usuario[]>([]);
  const [livrosList, setLivrosList] = useState<Livro[]>([]);
  const [exemplaresList, setExemplaresList] = useState<Exemplar[]>([]);
  const [loadingModal, setLoadingModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [selectedUsuario, setSelectedUsuario] = useState('');
  const [selectedLivro, setSelectedLivro] = useState('');
  const [selectedExemplar, setSelectedExemplar] = useState('');
  const [loadingExemplares, setLoadingExemplares] = useState(false);

  // ─── Estado do modal de confirmação de devolução ──────────────────────
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

  // ─── Abrir modal e carregar usuários + livros ─────────────────────────
  const abrirModal = async () => {
    setModalOpen(true);
    setLoadingModal(true);
    setSelectedUsuario('');
    setSelectedLivro('');
    setSelectedExemplar('');
    setExemplaresList([]);

    try {
      const [u, l] = await Promise.all([apiUsuarios.listar(), apiLivros.listar()]);
      setUsuariosList(Array.isArray(u) ? u.filter((x) => x.usuario_status === 'Ativo') : []);
      setLivrosList(Array.isArray(l) ? l.filter((x) => x.status === 1) : []);
    } catch {
      toast.error('Erro ao carregar dados para o formulário');
    } finally {
      setLoadingModal(false);
    }
  };

  // ─── Ao selecionar um livro, carregar seus exemplares disponíveis ─────
  const handleLivroChange = async (livroId: string) => {
    setSelectedLivro(livroId);
    setSelectedExemplar('');
    setExemplaresList([]);

    if (!livroId) return;

    setLoadingExemplares(true);
    try {
      const ex = await apiExemplares.listarPorLivro(Number(livroId));
      setExemplaresList(
        Array.isArray(ex) ? ex.filter((e) => e.disponibilidade === 'Disponivel') : [],
      );
    } catch {
      toast.error('Erro ao carregar exemplares');
    } finally {
      setLoadingExemplares(false);
    }
  };

  // ─── Criar empréstimo ─────────────────────────────────────────────────
  const handleCriar = async () => {
    if (!selectedUsuario || !selectedLivro || !selectedExemplar) {
      toast.error('Preencha todos os campos');
      return;
    }

    setSubmitting(true);
    try {
      const novo = await api.criar({
        usuario_id: Number(selectedUsuario),
        livro_id: Number(selectedLivro),
        exemplar_id: Number(selectedExemplar),
      });
      // Adiciona o novo empréstimo ao estado local
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
    } catch {
      toast.error('Erro ao criar empréstimo');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Confirmação de devolução ─────────────────────────────────────────
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
    } catch {
      toast.error('Erro ao registrar devolução');
    } finally {
      setDevolvendo(false);
    }
  };

  const ativos = data.filter((e) => e.emprestimo_status === 'Ativo');
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
                  <Button variant="outline" size="sm" onClick={() => pedirDevolucao(e)}>
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
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={abrirModal}
          >
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

      {/* ─── Modal: Novo Empréstimo ─────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Empréstimo</DialogTitle>
            <DialogDescription>
              Selecione o usuário, livro e exemplar para registrar um novo empréstimo.
            </DialogDescription>
          </DialogHeader>

          {loadingModal ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {/* Usuário */}
              <div className="space-y-2">
                <Label htmlFor="select-usuario">Usuário</Label>
                <Select value={selectedUsuario} onValueChange={setSelectedUsuario}>
                  <SelectTrigger id="select-usuario" className="w-full">
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {usuariosList.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Nenhum usuário ativo encontrado
                      </SelectItem>
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

              {/* Livro */}
              <div className="space-y-2">
                <Label htmlFor="select-livro">Livro</Label>
                <Select value={selectedLivro} onValueChange={handleLivroChange}>
                  <SelectTrigger id="select-livro" className="w-full">
                    <SelectValue placeholder="Selecione um livro" />
                  </SelectTrigger>
                  <SelectContent>
                    {livrosList.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Nenhum livro ativo encontrado
                      </SelectItem>
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

              {/* Exemplar */}
              <div className="space-y-2">
                <Label htmlFor="select-exemplar">Exemplar</Label>
                <Select
                  value={selectedExemplar}
                  onValueChange={setSelectedExemplar}
                  disabled={!selectedLivro || loadingExemplares}
                >
                  <SelectTrigger id="select-exemplar" className="w-full">
                    <SelectValue
                      placeholder={
                        loadingExemplares
                          ? 'Carregando exemplares...'
                          : !selectedLivro
                            ? 'Selecione um livro primeiro'
                            : 'Selecione um exemplar'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {exemplaresList.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Nenhum exemplar disponível
                      </SelectItem>
                    ) : (
                      exemplaresList.map((ex) => (
                        <SelectItem key={ex.id} value={String(ex.id)}>
                          Cód. {ex.codigoBarras} (#{ex.id})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleCriar}
              disabled={submitting || !selectedUsuario || !selectedLivro || !selectedExemplar}
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
