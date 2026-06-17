import { useState, useEffect } from 'react';
import { Search, Plus, Loader2, Eye, UserPlus, Tags, Pencil } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { livros, Livro } from '@/services/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import FormNovoLivro from '@/components/ui/FormNovoLivro';
import DetalhesLivro from '@/components/ui/DetalhesLivro';
import FormNovoAutor from '@/components/ui/FormNovoAutor';
import FormNovoGenero from '@/components/ui/FormNovoGenero';
import FormEditarLivro from '@/components/ui/FormEditarLivro';
import CatalogoLeitor from '@/pages/CatalogoLeitor';

export default function Catalogo() {
  const [data, setData] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { isAdmin } = useAuth();
  const [dialogAberto, setDialogAberto] = useState(false);
  const [dialogAutor, setDialogAutor] = useState(false);
  const [dialogGenero, setDialogGenero] = useState(false);
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [editarAberto, setEditarAberto] = useState(false);
  const [livroParaEditar, setLivroParaEditar] = useState<Livro | null>(null);

  const abrirDetalhes = (livro: Livro) => {
    setLivroSelecionado(livro);
    setDetalhesAberto(true);
  };

  const carregarLivros = () => {
    setLoading(true);
    livros.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar catálogo'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarLivros();
  }, []);

  const handleAlterarStatus = async (livro: Livro) => {
    const novoStatus = livro.status === 1 ? 0 : 1;
    try {
      await livros.alterarStatus(livro.id, novoStatus);
      setData((prev) =>
        prev.map((l) =>
          l.id === livro.id ? { ...l, status: novoStatus } : l
        )
      );
      toast.success(`Livro marcado como ${novoStatus === 1 ? 'Ativo' : 'Inativo'}`);
    } catch {
      toast.error('Erro ao alterar status do livro');
    }
  };

  const filtered = data.filter((l) => {
    const termoBusca = (search || '').toLowerCase();
    const tituloLivro = (l.titulo || '').toLowerCase();
    const nomeAutor = l.autores && l.autores.length > 0 && l.autores[0].autor
      ? (l.autores[0].autor.nome || '').toLowerCase()
      : '';
    return tituloLivro.includes(termoBusca) || nomeAutor.includes(termoBusca);
  });

  // Leitor vê o catálogo visual com cards; Admin vê a tabela de gerenciamento
  if (!isAdmin) {
    return <CatalogoLeitor />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 page-enter">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Catálogo de Livros</h1>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar livros ou autores..."
                className="sgb-input w-64 md:w-80 pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {isAdmin && (
              <>
                <button onClick={() => setDialogAutor(true)} className="sgb-btn-secondary flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Novo Autor
                </button>
                <button onClick={() => setDialogGenero(true)} className="sgb-btn-secondary flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Novo Gênero
                </button>
              </>
            )}
            <button onClick={() => setDialogAberto(true)} className="sgb-btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Novo Livro
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700/50 uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-6 py-4 font-semibold">Título & Autor</th>
                  <th className="px-6 py-4 font-semibold">Gênero</th>
                  <th className="px-6 py-4 font-semibold text-center">Exemplares</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold text-center">Detalhes</th>
                  <th className="px-6 py-4 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">Nenhum livro encontrado.</td>
                  </tr>
                ) : (
                  filtered.map((livro) => {
                    const autorNome = livro.autores && livro.autores.length > 0
                      ? livro.autores.map((a) => a.autor.nome).join(', ')
                      : '—';
                    const generoNome = livro.generos && livro.generos.length > 0
                      ? livro.generos.map((g) => g.genero.nome).join(', ')
                      : '—';

                    // A URL aponta para GET /livros/:id/capa — o backend retorna os bytes da imagem
                    const capaUrl = livro.imagemNome ? livros.getCapaUrl(livro.id) : null;

                    return (
                      <tr key={livro.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer" onClick={() => abrirDetalhes(livro)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {capaUrl ? (
                              <img
                                src={capaUrl}
                                alt={`Capa de ${livro.titulo}`}
                                className="w-9 h-12 object-cover rounded shadow-sm flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-9 h-12 rounded bg-slate-100 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-300 dark:text-slate-600 text-xs">
                                📖
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{livro.titulo}</p>
                              <p className="text-slate-500 dark:text-slate-400">{autorNome}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{generoNome}</td>
                        <td className="px-6 py-4 text-center text-slate-700 dark:text-slate-300 font-medium">
                          {livro._count?.exemplares ?? livro.exemplares?.length ?? 0}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${livro.status === 1
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}
                          >
                            {livro.status === 1 ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={(e) => { e.stopPropagation(); abrirDetalhes(livro); }}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            title="Ver detalhes do livro"
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            {isAdmin && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setLivroParaEditar(livro); setEditarAberto(true); }}
                                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors"
                                title="Editar livro"
                              >
                                <Pencil className="w-4 h-4" />
                                Editar
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAlterarStatus(livro); }}
                              className="text-primary hover:text-rose-900 dark:text-rose-400 dark:hover:text-rose-300 font-medium text-sm transition-colors"
                            >
                              {livro.status === 1 ? 'Desativar' : 'Ativar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal de Novo Livro */}
      <FormNovoLivro
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSucesso={carregarLivros}
      />

      {/* Modal de Novo Autor */}
      <FormNovoAutor
        open={dialogAutor}
        onOpenChange={setDialogAutor}
      />

      {/* Modal de Novo Gênero */}
      <FormNovoGenero
        open={dialogGenero}
        onOpenChange={setDialogGenero}
      />

      {/* Modal de Detalhes do Livro */}
      <DetalhesLivro
        livro={livroSelecionado}
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
      />

      {/* Modal de Editar Livro */}
      {livroParaEditar && (
        <FormEditarLivro
          livro={livroParaEditar}
          open={editarAberto}
          onOpenChange={(v) => { setEditarAberto(v); if (!v) setLivroParaEditar(null); }}
          onSucesso={carregarLivros}
        />
      )}
    </DashboardLayout>
  );
}
