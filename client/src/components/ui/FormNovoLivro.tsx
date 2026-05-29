import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { livros, autores as autoresApi, generos as generosApi, Autor, Genero, CriarLivroPayload } from '@/services/api';
import { toast } from 'sonner';

interface FormNovoLivroProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSucesso: () => void;
}

const camposIniciais: CriarLivroPayload = {
    titulo: '',
    isbn: '',
    editora: '',
    anoPublicacao: undefined,
    sinopse: '',
    numeroPaginas: undefined,
    idioma: '',
    autores: [],
    generos: [],
};

export default function FormNovoLivro({ open, onOpenChange, onSucesso }: FormNovoLivroProps) {
    const [form, setForm] = useState<CriarLivroPayload>({ ...camposIniciais });
    const [salvando, setSalvando] = useState(false);
    const [listaAutores, setListaAutores] = useState<Autor[]>([]);
    const [listaGeneros, setListaGeneros] = useState<Genero[]>([]);
    const [carregandoListas, setCarregandoListas] = useState(false);

    // Carregar autores e gêneros ao abrir o dialog
    useEffect(() => {
        if (!open) return;
        setCarregandoListas(true);
        Promise.all([
            autoresApi.listar().catch(() => [] as Autor[]),
            generosApi.listar().catch(() => [] as Genero[]),
        ])
            .then(([a, g]) => {
                setListaAutores(a);
                setListaGeneros(g);
            })
            .finally(() => setCarregandoListas(false));
    }, [open]);

    // Resetar formulário ao fechar
    useEffect(() => {
        if (!open) {
            setForm({ ...camposIniciais });
        }
    }, [open]);

    const handleChange = (campo: keyof CriarLivroPayload, valor: string | number | undefined) => {
        setForm((prev) => ({ ...prev, [campo]: valor }));
    };

    const toggleAutor = (id: number) => {
        setForm((prev) => {
            const atual = prev.autores || [];
            return {
                ...prev,
                autores: atual.includes(id) ? atual.filter((a) => a !== id) : [...atual, id],
            };
        });
    };

    const toggleGenero = (id: number) => {
        setForm((prev) => {
            const atual = prev.generos || [];
            return {
                ...prev,
                generos: atual.includes(id) ? atual.filter((g) => g !== id) : [...atual, id],
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.titulo.trim()) {
            toast.error('O título é obrigatório');
            return;
        }

        if (!form.isbn.trim()) {
            toast.error('O ISBN é obrigatório');
            return;
        }

        setSalvando(true);
        try {
            const payload: CriarLivroPayload = {
                ...form,
                anoPublicacao: form.anoPublicacao ? Number(form.anoPublicacao) : undefined,
                numeroPaginas: form.numeroPaginas ? Number(form.numeroPaginas) : undefined,
            };
            await livros.criar(payload);
            toast.success('Livro cadastrado com sucesso!');
            onOpenChange(false);
            onSucesso();
        } catch {
            toast.error('Erro ao cadastrar livro');
        } finally {
            setSalvando(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Cadastrar Novo Livro</DialogTitle>
                    <DialogDescription>
                        Preencha os dados do livro. Campos com * são obrigatórios.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* Título */}
                    <div className="space-y-2">
                        <Label htmlFor="titulo">Título *</Label>
                        <Input
                            id="titulo"
                            placeholder="Ex: Dom Casmurro"
                            value={form.titulo}
                            onChange={(e) => handleChange('titulo', e.target.value)}
                            required
                        />
                    </div>

                    {/* ISBN + Editora */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="isbn">ISBN *</Label>
                            <Input
                                id="isbn"
                                placeholder="Ex: 9788535902778"
                                value={form.isbn}
                                onChange={(e) => handleChange('isbn', e.target.value)}
                                required
                                maxLength={13}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="editora">Editora</Label>
                            <Input
                                id="editora"
                                placeholder="Ex: Companhia das Letras"
                                value={form.editora || ''}
                                onChange={(e) => handleChange('editora', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Ano + Páginas + Idioma */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="anoPublicacao">Ano de Publicação</Label>
                            <Input
                                id="anoPublicacao"
                                type="number"
                                placeholder="Ex: 1899"
                                value={form.anoPublicacao ?? ''}
                                onChange={(e) => handleChange('anoPublicacao', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="numeroPaginas">Nº de Páginas</Label>
                            <Input
                                id="numeroPaginas"
                                type="number"
                                placeholder="Ex: 256"
                                value={form.numeroPaginas ?? ''}
                                onChange={(e) => handleChange('numeroPaginas', e.target.value ? Number(e.target.value) : undefined)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="idioma">Idioma</Label>
                            <Input
                                id="idioma"
                                placeholder="Ex: Português"
                                value={form.idioma || ''}
                                onChange={(e) => handleChange('idioma', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Sinopse */}
                    <div className="space-y-2">
                        <Label htmlFor="sinopse">Sinopse</Label>
                        <Textarea
                            id="sinopse"
                            placeholder="Breve descrição do livro..."
                            value={form.sinopse || ''}
                            onChange={(e) => handleChange('sinopse', e.target.value)}
                            className="min-h-[80px]"
                        />
                    </div>

                    {/* Autores */}
                    <div className="space-y-2">
                        <Label>Autores</Label>
                        {carregandoListas ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                            </div>
                        ) : listaAutores.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-1">Nenhum autor cadastrado no sistema.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto border border-border rounded-md p-3">
                                {listaAutores.map((autor) => {
                                    const selecionado = (form.autores || []).includes(autor.id);
                                    return (
                                        <button
                                            key={autor.id}
                                            type="button"
                                            onClick={() => toggleAutor(autor.id)}
                                            className={`
                        text-sm px-3 py-1.5 rounded-full border transition-all duration-200
                        ${selecionado
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-secondary/50 text-foreground border-border hover:bg-secondary hover:border-foreground/20'
                                                }
                      `}
                                        >
                                            {autor.nome}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Gêneros */}
                    <div className="space-y-2">
                        <Label>Gêneros</Label>
                        {carregandoListas ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
                            </div>
                        ) : listaGeneros.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-1">Nenhum gênero cadastrado no sistema.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto border border-border rounded-md p-3">
                                {listaGeneros.map((genero) => {
                                    const selecionado = (form.generos || []).includes(genero.id);
                                    return (
                                        <button
                                            key={genero.id}
                                            type="button"
                                            onClick={() => toggleGenero(genero.id)}
                                            className={`
                        text-sm px-3 py-1.5 rounded-full border transition-all duration-200
                        ${selecionado
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-secondary/50 text-foreground border-border hover:bg-secondary hover:border-foreground/20'
                                                }
                      `}
                                        >
                                            {genero.nome}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={salvando}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={salvando}>
                            {salvando ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
                                </>
                            ) : (
                                'Cadastrar Livro'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
