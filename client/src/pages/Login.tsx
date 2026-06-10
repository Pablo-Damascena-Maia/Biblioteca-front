import { useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Login() {
  const { login } = useAuth();
  const [, navigate] = useLocation();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, senha);
      navigate('/');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0f0f1a] p-4 transition-colors duration-300">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700 page-enter">
        {/* Header theme */}
        <div className="bg-primary p-8 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Biblioteca</h1>
          <p className="text-primary-foreground/80 text-sm">Sistema de Gerenciamento</p>
        </div>

        {/* Form */}
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="sgb-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="seu@email.com"
                className="sgb-input"
              />
            </div>

            <div>
              <label className="sgb-label">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                placeholder="••••••••"
                className="sgb-input"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="sgb-btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar no Sistema'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
