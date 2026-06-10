import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth, Usuario } from '@/services/api';

interface AuthState {
  token: string | null;
  usuario: Usuario | null;
}

interface AuthContextValue extends AuthState {
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ token: null, usuario: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const raw = localStorage.getItem('usuario');
    if (token && raw) {
      try {
        setState({ token, usuario: JSON.parse(raw) });
      } catch {
        localStorage.clear();
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    const res = await auth.login(email, senha);
    // auth.login já retorna data (corpo da resposta). O backend envolve em { success, data: { token, usuario } }
    const { token, usuario } = res.data ?? res;
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usuario));
    setState({ token, usuario });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setState({ token: null, usuario: null });
  };

  const isAdmin = state.usuario?.usuario_tipo === 'Bibliotecario';

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
