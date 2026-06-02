import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  BookOpen,
  Users,
  BarChart3,
  Calendar,
  LogOut,
  Home,
  BookMarked,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { logout, usuario, isAdmin } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Leitores não veem Usuários nem Relatórios
  const allNavItems = [
    { href: '/', label: 'Dashboard', icon: Home, adminOnly: false },
    { href: '/catalogo', label: 'Catálogo', icon: BookOpen, adminOnly: false },
    { href: '/emprestimos', label: 'Empréstimos', icon: Calendar, adminOnly: false },
    { href: '/reservas', label: 'Reservas', icon: BookMarked, adminOnly: false },
    { href: '/usuarios', label: 'Usuários', icon: Users, adminOnly: true },
    { href: '/relatorios', label: 'Relatórios', icon: BarChart3, adminOnly: true },
  ];

  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  const initials = usuario?.usuario_nome
    ? usuario.usuario_nome.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  const NavLinks = () => (
    <nav className="flex-1 px-3 py-4 space-y-0.5">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={cn(
              'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-none">Biblioteca</p>
              <p className="text-xs text-white/50 mt-0.5">Sistema Digital</p>
            </div>
          </div>
        </div>

        <NavLinks />

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-white/10 space-y-1">
          {usuario && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white truncate">{usuario.usuario_nome}</p>
                <p className="text-xs text-white/50 truncate">{usuario.usuario_tipo}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all duration-150"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-sidebar text-white px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          <span className="font-bold text-sm">Biblioteca</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} className="p-1">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 pt-14">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-60 h-full bg-sidebar flex flex-col">
            <NavLinks />
            <div className="px-3 py-4 border-t border-white/10">
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-white/70 hover:bg-white/10 hover:text-white transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Sair</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-auto md:pt-0 pt-14">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
