import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2 } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { livros, Livro } from '@/services/api';
import { toast } from 'sonner';
import FormNovoLivro from '@/components/ui/FormNovoLivro';

export default function Catalogo() {
  const [data, setData] = useState<Livro[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogAberto, setDialogAberto] = useState(false);

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
    // Backend espera status numérico: 1 = Ativo, 0 = Inativo
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

    // Como autores é um array (N:N), pegamos o nome do primeiro autor para a pesquisa
    const nomeAutor = l.autores && l.autores.length > 0 && l.autores[0].autor
      ? (l.autores[0].autor.nome || '').toLowerCase()
      : '';

    return tituloLivro.includes(termoBusca) || nomeAutor.includes(termoBusca);
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Catálogo de Livros</h1>
            <p className="text-muted-foreground">Gerenciar livros e exemplares da biblioteca</p>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setDialogAberto(true)}
          >
            <Plus className="w-4 h-4 mr-2" /> Novo Livro
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input placeholder="Buscar por título ou autor..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <Card className="border border-border">
          <CardHeader>
            <CardTitle>Livros Cadastrados {!loading && <span className="text-sm font-normal text-muted-foreground ml-2">({filtered.length})</span>}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhum livro encontrado.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Título</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Autor</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Gênero</th>
                      <th className="text-center py-3 px-4 font-semibold text-foreground">Exemplares</th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">Status</th>
                      <th className="text-right py-3 px-4 font-semibold text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((livro) => (
                      <tr key={livro.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="py-4 px-4 text-foreground font-medium">{livro.titulo}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {livro.autores && livro.autores.length > 0
                            ? livro.autores.map((a) => a.autor.nome).join(', ')
                            : '—'}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {livro.generos && livro.generos.length > 0
                            ? livro.generos.map((g) => g.genero.nome).join(', ')
                            : '—'}
                        </td>
                        <td className="py-4 px-4 text-center text-foreground">
                          {livro.exemplares?.length ?? '—'}
                        </td>

                        <td className="py-4 px-4">
                          <Badge variant="outline" className={livro.status === 1 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'}>
                            {livro.status === 1 ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            className="text-xs border border-border rounded px-3 py-1.5 hover:bg-secondary transition-colors text-muted-foreground"
                            onClick={() => handleAlterarStatus(livro)}
                            title="Alternar status"
                          >
                            {livro.status === 1 ? 'Desativar' : 'Ativar'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Novo Livro */}
      <FormNovoLivro
        open={dialogAberto}
        onOpenChange={setDialogAberto}
        onSucesso={carregarLivros}
      />
    </DashboardLayout>
  );
}
