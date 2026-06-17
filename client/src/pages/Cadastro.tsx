import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usuarios as api } from '@/services/api';
import CompletarPerfil from '@/components/CompletarPerfil';

const TOTAL_LIVROS = 350;

const PALETA_CORES_VELHAS = [
  'bg-[#3e2723]', 'bg-[#2c3e50]', 'bg-[#2d3e2d]', 'bg-[#800020]', 
  'bg-[#5d4037]', 'bg-[#1a1a1a]', 'bg-[#795548]', 'bg-[#37474f]',
];

const ALTURAS = ['h-24', 'h-28', 'h-32', 'h-36', 'h-40', 'h-44'];
const LARGURAS = [
  'min-w-[20px] max-w-[26px]', 'min-w-[26px] max-w-[36px]', 
  'min-w-[36px] max-w-[50px]', 'min-w-[50px] max-w-[66px]', 
  'min-w-[66px] max-w-[80px]',
];

export default function Cadastro() {
  const [, navigate] = useLocation();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  // estado pós-cadastro
  const [novoUsuarioId, setNovoUsuarioId] = useState<number | null>(null);

  // Geração de dados idêntica ao Login
  const paredeDeLivrosData = useMemo(() => {
    return Array.from({ length: TOTAL_LIVROS }, (_, i) => ({
      id: i,
      cor: PALETA_CORES_VELHAS[Math.floor(Math.random() * PALETA_CORES_VELHAS.length)],
      altura: ALTURAS[Math.floor(Math.random() * ALTURAS.length)],
      largura: LARGURAS[Math.floor(Math.random() * LARGURAS.length)],
      estilo: Math.floor(Math.random() * 5),
      desgaste: Math.random() > 0.5,
    }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const resultado = await api.criar({ nome, email, senha, tipo: 'Leitor', status: 'Ativo' } as any);
      toast.success('Conta criada com sucesso!');
      // pega o ID do usuario criado para usar no formulario de completar perfil
      const id = resultado?.usuario_id || resultado?.id;
      if (id) {
        setNovoUsuarioId(id);
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-[#1a0f0a]">
      {/* ─── PAREDE DE LIVROS (IGUAL AO LOGIN) ─── */}
      <div className="absolute inset-0 z-0 flex flex-wrap content-start items-end bg-[#251610] opacity-90">
        {paredeDeLivrosData.map((livro) => (
          <div
            key={livro.id}
            className={`relative flex-grow ${livro.largura} ${livro.altura} group cursor-pointer border-b-[16px] border-[#1a0f0a] shadow-inner`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(#4a3b32_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />

            <div
              className={`absolute bottom-0 w-full h-full ${livro.cor} rounded-t-[3px] origin-bottom flex flex-col justify-evenly items-center
                border-l border-black/40 border-r border-black/20
                shadow-[inset_6px_0_8px_rgba(0,0,0,0.6),inset_-3px_0_5px_rgba(0,0,0,0.4),3px_0_6px_rgba(0,0,0,0.7)]
                transition-transform duration-300 ease-out will-change-transform
                group-hover:-translate-y-6 group-hover:scale-[1.08] group-hover:z-50
                z-10
              `}
            >
              <div className={`absolute inset-0 bg-black/10 rounded-t-[3px] ${livro.desgaste ? 'opacity-30' : 'opacity-10'}`} style={{backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noiseFilter)"/%3E%3C/svg%3E")'}}></div>

              {/* Detalhes mantidos (0 a 4) */}
              {livro.estilo === 0 && (
                <>
                  <div className="w-full h-[2px] bg-amber-950/60 shadow-sm z-20" />
                  <div className="w-1/2 h-4 bg-amber-950/30 rounded-sm border border-amber-950/50 z-20" />
                  <div className="w-full h-[2px] bg-amber-950/60 shadow-sm z-20" />
                </>
              )}
              {livro.estilo === 1 && (
                <>
                  <div className="w-full h-[1px] bg-amber-900/40 z-20" />
                  <div className="w-2/3 h-[1px] bg-amber-900/40 z-20" />
                  <div className="w-1/3 h-[1px] bg-amber-900/40 z-20" />
                  <div className="w-full h-[1px] bg-amber-900/40 z-20" />
                </>
              )}
              {livro.estilo === 2 && (
                <>
                  <div className="w-4 h-4 border-2 border-amber-950/40 rounded-full opacity-60 flex items-center justify-center z-20">
                    <div className="w-1 h-1 bg-amber-950/60 rounded-full"></div>
                  </div>
                </>
              )}
              {livro.estilo === 3 && (
                <>
                  <div className="w-full h-3 border-y border-amber-950/50 bg-amber-950/20 z-20" />
                </>
              )}
              {livro.estilo === 4 && (
                <>
                  <div className="w-2/3 h-5 bg-[#f4ecd8]/80 rounded-[1px] shadow-inner border border-black/20 flex flex-col justify-center items-center gap-0.5 z-20 opacity-90">
                    <div className="w-3/4 h-[1px] bg-black/30"></div>
                    <div className="w-1/2 h-[1px] bg-black/20"></div>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
        <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,transparent_10%,rgba(15,8,5,0.9)_100%)] pointer-events-none"></div>
      </div>

      {/* ─── FORMULÁRIO ─── */}
      <div className="relative z-30 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.7)] overflow-hidden border border-white/30">
        <div className="bg-primary p-8 text-center border-b border-black/5">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md shadow-inner ring-2 ring-white/40">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {novoUsuarioId ? 'Complete seu perfil' : 'Cadastro'}
          </h1>
          {novoUsuarioId && (
            <p className="text-white/70 text-sm">Preencha seus dados para começar</p>
          )}
        </div>
        <div className="p-8">
          {novoUsuarioId ? (
            /* ─── Formulário de completar perfil (pós-cadastro) ─── */
            <CompletarPerfil usuarioId={novoUsuarioId} />
          ) : (
            /* ─── Formulário de cadastro (original) ─── */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold">Nome</label>
                <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} required className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200" />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200" />
              </div>
              <div>
                <label className="text-slate-700 dark:text-slate-300 font-bold">Senha</label>
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200" />
              </div>
              <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary text-white rounded-lg font-bold hover:shadow-lg transition-all">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Criar Conta'}
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => navigate('/login')} className="text-sm font-bold text-slate-500 hover:text-primary">
                  Já tem uma conta? <span className="text-primary">Faça login</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}