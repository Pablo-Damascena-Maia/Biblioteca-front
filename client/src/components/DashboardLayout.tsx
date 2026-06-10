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
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const { logout, usuario, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allNavItems = [
    { href: '/', label: 'Dashboard', icon: Home, adminOnly: true },
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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f0f1a] transition-colors duration-300">
      {/* ─── Top Navbar ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#161623]/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-sm">
                <BookOpen className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-bold text-base text-slate-800 dark:text-slate-100 hidden sm:block">
                Biblioteca
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'text-primary dark:text-primary bg-primary/5 dark:bg-primary/10'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-[13px] left-3 right-3 h-[2px] bg-primary dark:bg-rose-400 rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right section */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>

              {/* User info (desktop) */}
              {usuario && (
                <div className="hidden md:flex items-center gap-2.5 pl-3 ml-1 border-l border-slate-200 dark:border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-none">
                      {usuario.usuario_nome}
                    </p>
                    <p className="text-[10px] text-accent font-medium mt-0.5">
                      {usuario.usuario_tipo}
                    </p>
                  </div>
                </div>
              )}

              {/* Logout (desktop) */}
              <button
                onClick={logout}
                className="hidden md:flex items-center p-2 rounded-lg text-slate-400 hover:text-destructive dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Mobile Drawer ──────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Dropdown panel */}
          <div className="md:hidden fixed top-16 left-0 right-0 z-40 bg-white dark:bg-[#161623] border-b border-slate-200 dark:border-slate-800 shadow-xl animate-slideIn">
            <nav className="px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary dark:bg-primary/10 dark:text-primary'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile user + logout */}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              {usuario && (
                <div className="flex items-center gap-3 mb-3 px-4">
                  <div className="w-9 h-9 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {usuario.usuario_nome}
                    </p>
                    <p className="text-xs text-accent font-medium">{usuario.usuario_tipo}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Main Content ───────────────────────────────────────────────── */}
      <main className="pt-16">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
