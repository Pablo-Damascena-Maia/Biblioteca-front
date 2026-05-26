import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Catalogo from "./pages/Catalogo";
import Emprestimos from "./pages/Emprestimos";
import Reservas from "./pages/Reservas";
import Usuarios from "./pages/Usuarios";
import Relatorios from "./pages/Relatorios";
import Login from "./pages/Login";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function ProtectedRoutes() {
  const { token, isLoading } = useAuth();
  const [location, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !token && location !== '/login') {
      navigate('/login');
    }
  }, [token, isLoading, location]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!token) return null;

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/catalogo" component={Catalogo} />
      <Route path="/emprestimos" component={Emprestimos} />
      <Route path="/reservas" component={Reservas} />
      <Route path="/usuarios" component={Usuarios} />
      <Route path="/relatorios" component={Relatorios} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route component={ProtectedRoutes} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AuthProvider>
            <Toaster />
            <Router />
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
