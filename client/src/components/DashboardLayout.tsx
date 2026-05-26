import { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { BookOpen, Users, BarChart3, Calendar, LogOut, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { logout, usuario } = useAuth();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/catalogo', label: 'Catálogo', icon: BookOpen },
    { href: '/emprestimos', label: 'Empréstimos', icon: Calendar },
    { href: '/reservas', label: 'Reservas', icon: Calendar },
    { href: '/usuarios', label: 'Usuários', icon: Users },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3 },
  ];

  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            <h1 className="text-xl font-bold">Biblioteca</h1>
          </div>
          {usuario && (
            <p className="text-xs text-sidebar-foreground/60 mt-2 truncate">
              {usuario.usuario_nome} · {usuario.usuario_tipo}
            </p>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-md transition-colors duration-150',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-md text-sidebar-foreground hover:bg-sidebar-accent transition-colors duration-150"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
