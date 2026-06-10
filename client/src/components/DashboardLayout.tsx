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

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Top Navbar ─────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-sm text-foreground hidden sm:block">Biblioteca</span>
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
                      'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {/* Active indicator */}
                    {isActive && (
                      <span className="absolute -bottom-[13px] left-3 right-3 h-[2px] bg-primary rounded-full" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right section: theme toggle + user + logout */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User info (desktop) */}
              {usuario && (
                <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border/60">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {initials}
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-medium text-foreground leading-none">{usuario.usuario_nome}</p>
                    <p className="text-[10px] text-muted-foreground">{usuario.usuario_tipo}</p>
                  </div>
                </div>
              )}

              {/* Logout (desktop) */}
              <button
                onClick={logout}
                className="hidden md:flex items-center gap-1.5 p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
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
            className="md:hidden fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer panel */}
          <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-background border-b border-border shadow-lg animate-in slide-in-from-top-2 duration-200">
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
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile user + logout */}
            <div className="px-4 py-3 border-t border-border/60">
              {usuario && (
                <div className="flex items-center gap-3 mb-3 px-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{usuario.usuario_nome}</p>
                    <p className="text-xs text-muted-foreground">{usuario.usuario_tipo}</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </>
      )}

      {/* ─── Main Content ───────────────────────────────────────────────── */}
      <main className="pt-14">
        <div className="p-6 md:p-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
