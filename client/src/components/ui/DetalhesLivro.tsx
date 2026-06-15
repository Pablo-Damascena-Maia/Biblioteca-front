import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    BookOpen,
    User,
    Tag,
    Hash,
    Building2,
    Calendar,
    FileText,
    Globe,
    Layers,
    Loader2,
    Plus,
} from 'lucide-react';
import { livros, exemplares as exemplaresApi, Livro, Exemplar } from '@/services/api';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import FormNovoExemplar from '@/components/ui/FormNovoExemplar';

interface DetalhesLivroProps {
    livro: Livro | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DetalhesLivro({ livro, open, onOpenChange }: DetalhesLivroProps) {
    const { isAdmin } = useAuth();
    const [listaExemplares, setListaExemplares] = useState<Exemplar[]>([]);
    const [carregandoExemplares, setCarregandoExemplares] = useState(false);
    const [dialogExemplar, setDialogExemplar] = useState(false);

    const carregarExemplares = useCallback(() => {
        if (!livro || !isAdmin) return;
        setCarregandoExemplares(true);
        exemplaresApi
            .listarPorLivro(livro.id)
            .then(setListaExemplares)
            .catch(() => setListaExemplares([]))
            .finally(() => setCarregandoExemplares(false));
    }, [livro, isAdmin]);

    useEffect(() => {
        if (!open || !livro) {
            setListaExemplares([]);
            return;
        }
        carregarExemplares();
    }, [open, livro, carregarExemplares]);

    if (!livro) return null;

    const autorNome =
        livro.autores && livro.autores.length > 0
            ? livro.autores.map((a) => a.autor.nome).join(', ')
            : 'Não informado';

    const generoNome =
        livro.generos && livro.generos.length > 0
            ? livro.generos.map((g) => g.genero.nome).join(', ')
            : 'Não informado';

    const capaUrl = livro.imagemNome ? livros.getCapaUrl(livro.id) : null;

    const disponibilidadeCor: Record<string, string> = {
        Disponivel: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        Emprestado: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        Manutencao: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        Perdido: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    const condicaoCor: Record<string, string> = {
        Novo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        Bom: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        Regular: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        Desgastado: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto scrollbar-hide p-0">
        {/* Hero section with cover */}
                <div className="relative overflow-hidden rounded-t-lg">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent dark:from-primary/30 dark:via-primary/15 dark:to-transparent" />
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

                    <div className="relative flex flex-col sm:flex-row gap-6 p-6 pt-8">
                        {/* Book cover */}
                        <div className="flex-shrink-0 mx-auto sm:mx-0">
                            {capaUrl ? (
                                <div className="relative group">
                                    <div className="absolute -inset-1 bg-gradient-to-br from-primary/40 to-accent/40 rounded-xl blur-sm opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
                                    <img
                                        src={capaUrl}
                                        alt={`Capa de ${livro.titulo}`}
                                        className="relative w-36 h-52 object-cover rounded-xl shadow-lg border-2 border-white/50 dark:border-slate-700/50"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            ) : (
                                <div className="w-36 h-52 rounded-xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center shadow-lg border-2 border-white/50 dark:border-slate-600/50">
                                    <BookOpen className="w-10 h-10 text-slate-400 dark:text-slate-500 mb-2" />
                                    <span className="text-xs text-slate-400 dark:text-slate-500">Sem capa</span>
                                </div>
                            )}
                        </div>

                        {/* Title + Meta */}
                        <div className="flex-1 min-w-0 text-center sm:text-left">
                            <DialogHeader className="mb-3">
                                <DialogTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
                                    {livro.titulo}
                                </DialogTitle>
                                <DialogDescription className="text-base text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-1">
                                    <User className="w-4 h-4 flex-shrink-0" />
                                    {autorNome}
                                </DialogDescription>
                            </DialogHeader>

                            {/* Status badge */}
                            <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mt-2">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${livro.status === 1
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                        }`}
                                >
                                    {livro.status === 1 ? '● Ativo' : '● Inativo'}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                                    <Tag className="w-3 h-3 inline mr-1" />
                                    {generoNome}
                                </span>
                            </div>

                            {/* Quick stats */}
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Exemplares</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                        {livro._count?.exemplares ?? livro.exemplares?.length ?? listaExemplares.length ?? 0}
                                    </p>
                                </div>
                                <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/50 dark:border-slate-700/50">
                                    <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">Páginas</p>
                                    <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                        {livro.numeroPaginas ?? '—'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Details section */}
                <div className="px-6 pb-6 space-y-5">
                    {/* Synopsis */}
                    {livro.sinopse && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                Sinopse
                            </h3>
                            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-100 dark:border-slate-700/50">
                                {livro.sinopse}
                            </p>
                        </div>
                    )}

                    {/* Info grid */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Informações
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <InfoItem icon={Hash} label="ISBN" value={livro.isbn || 'Não informado'} />
                            <InfoItem icon={Building2} label="Editora" value={livro.editora || 'Não informada'} />
                            <InfoItem icon={Calendar} label="Ano de Publicação" value={livro.anoPublicacao ? String(livro.anoPublicacao) : 'Não informado'} />
                            <InfoItem icon={Globe} label="Idioma" value={livro.idioma || 'Não informado'} />
                        </div>
                    </div>

                    {/* Exemplars — visível apenas para Bibliotecários */}
                    {isAdmin && (
                        <div className="flex flex-col max-h-[250px] overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700/50">
                            {/* Header fixo */}
                            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700/50 flex-shrink-0">
                                <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Layers className="w-4 h-4" />
                                    Exemplares
                                </h3>
                                <button
                                    onClick={() => setDialogExemplar(true)}
                                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Adicionar Exemplar
                                </button>
                            </div>
                            {/* Conteúdo rolável */}
                            <div className={`overflow-y-auto scrollbar-hide flex-1 ${listaExemplares.length > 3 ? 'max-h-[180px]' : ''}`}>
                                {carregandoExemplares ? (
                                    <div className="flex items-center justify-center py-6">
                                        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                        <span className="ml-2 text-sm text-slate-400">Carregando exemplares...</span>
                                    </div>
                                ) : listaExemplares.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Layers className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                        <p className="text-sm text-slate-400">Nenhum exemplar cadastrado</p>
                                    </div>
                                ) : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="sticky top-0 z-20 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Código de Barras</th>
                                                <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Condição</th>
                                                <th className="px-4 py-2.5 font-semibold text-xs uppercase tracking-wider">Disponibilidade</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                                            {listaExemplares.map((ex) => (
                                                <tr key={ex.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                                                        {ex.codigoBarras}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${condicaoCor[ex.condicao ?? ''] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                            {ex.condicao ?? '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${disponibilidadeCor[ex.disponibilidade ?? ''] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                            {ex.disponibilidade === 'Disponivel' ? 'Disponível' : ex.disponibilidade === 'Manutencao' ? 'Manutenção' : ex.disponibilidade ?? '—'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>

            {/* Modal de adicionar exemplar */}
            {livro && (
                <FormNovoExemplar
                    livroId={livro.id}
                    livroTitulo={livro.titulo}
                    open={dialogExemplar}
                    onOpenChange={setDialogExemplar}
                    onSucesso={carregarExemplares}
                />
            )}
        </Dialog>
    );
}

/** Small reusable info row */
function InfoItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-700/50">
            <div className="mt-0.5 p-1.5 rounded-md bg-primary/10 dark:bg-primary/20">
                <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">{label}</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{value}</p>
            </div>
        </div>
    );
}
