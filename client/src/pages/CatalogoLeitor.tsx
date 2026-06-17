import { useState, useEffect } from 'react';
import { Search, Loader2, BookOpen } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { livros, Livro } from '@/services/api';
import { toast } from 'sonner';
import DetalhesLivro from '@/components/ui/DetalhesLivro';

export default function CatalogoLeitor() {
  const [data, setData] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [livroSelecionado, setLivroSelecionado] = useState<Livro | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);

  const abrirDetalhes = (livro: Livro) => {
    setLivroSelecionado(livro);
    setDetalhesAberto(true);
  };

  useEffect(() => {
    livros.listar()
      .then(setData)
      .catch(() => toast.error('Erro ao carregar catálogo'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = data.filter((l) => {
    const termoBusca = (search || '').toLowerCase();
    const tituloLivro = (l.titulo || '').toLowerCase();
    const nomeAutor = l.autores && l.autores.length > 0 && l.autores[0].autor
      ? (l.autores[0].autor.nome || '').toLowerCase()
      : '';
    const nomeGenero = l.generos && l.generos.length > 0 && l.generos[0].genero
      ? (l.generos[0].genero.nome || '').toLowerCase()
      : '';
    return tituloLivro.includes(termoBusca) || nomeAutor.includes(termoBusca) || nomeGenero.includes(termoBusca);
  });

  return (
    <DashboardLayout>
      <div className="space-y-8 page-enter">
        {/* Header */}
        <div className="catalogo-header">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              Catálogo de Livros
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Explore nosso acervo e encontre sua próxima leitura
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, autor ou gênero..."
              className="catalogo-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Grid de Cards */}
        {loading ? (
          /* Skeleton Loading */
          <div className="catalogo-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="catalogo-card catalogo-skeleton">
                <div className="catalogo-card-image-wrapper">
                  <div className="catalogo-skeleton-image" />
                </div>
                <div className="catalogo-card-info">
                  <div className="catalogo-skeleton-badge" />
                  <div className="catalogo-skeleton-title" />
                  <div className="catalogo-skeleton-author" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          /* Estado vazio */
          <div className="catalogo-empty">
            <div className="catalogo-empty-icon">
              <BookOpen className="w-12 h-12" />
            </div>
            <h3>Nenhum livro encontrado</h3>
            <p>Tente ajustar sua busca ou explore outras categorias</p>
          </div>
        ) : (
          <div className="catalogo-grid">
            {filtered.map((livro, index) => {
              const autorNome = livro.autores && livro.autores.length > 0
                ? livro.autores.map((a) => a.autor.nome).join(', ')
                : 'Autor desconhecido';
              const generoNome = livro.generos && livro.generos.length > 0
                ? livro.generos[0].genero.nome
                : null;
              const capaUrl = livro.imagemNome ? livros.getCapaUrl(livro.id) : null;

              return (
                <div
                  key={livro.id}
                  className="catalogo-card"
                  style={{ animationDelay: `${index * 60}ms` }}
                  onClick={() => abrirDetalhes(livro)}
                >
                  {/* Imagem da capa */}
                  <div className="catalogo-card-image-wrapper">
                    {capaUrl ? (
                      <img
                        src={capaUrl}
                        alt={`Capa de ${livro.titulo}`}
                        className="catalogo-card-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.parentElement!.classList.add('catalogo-card-no-image');
                        }}
                      />
                    ) : (
                      <div className="catalogo-card-no-image">
                        <BookOpen className="w-12 h-12" />
                        <span>{livro.titulo?.substring(0, 2).toUpperCase()}</span>
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="catalogo-card-info">
                    {generoNome && (
                      <span className="catalogo-badge">
                        <BookOpen className="w-3.5 h-3.5" />
                        {generoNome}
                      </span>
                    )}
                    <h3 className="catalogo-card-title" title={livro.titulo}>
                      {livro.titulo}
                    </h3>
                    <p className="catalogo-card-author">{autorNome}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Contagem de resultados */}
        {!loading && filtered.length > 0 && (
          <div className="catalogo-results-count">
            Exibindo <strong>{filtered.length}</strong> {filtered.length === 1 ? 'livro' : 'livros'}
            {search && <> para "<em>{search}</em>"</>}
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <DetalhesLivro
        livro={livroSelecionado}
        open={detalhesAberto}
        onOpenChange={setDetalhesAberto}
      />
    </DashboardLayout>
  );
}
