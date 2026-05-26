/**
 * services/api.ts
 * Camada central de comunicação com todos os microsserviços.
 *
 * Portas:
 *   Usuário    → 9501  /usuarios  /auth
 *   Catálogo   → 9502  /livros  /exemplares  /autores  /generos
 *   Reserva    → 9503  /reservas
 *   Relatório  → 9504  /reservas (relatórios)
 *   Empréstimo → 9500  /biblioteca/emprestimos
 */

import axios from 'axios';

// ─── Base URLs (lidas de variáveis de ambiente ou fallback local) ─────────────
const BASE = {
  usuario:   import.meta.env.VITE_URL_USUARIO   || 'http://localhost:9501',
  catalogo:  import.meta.env.VITE_URL_CATALOGO  || 'http://localhost:9502',
  reserva:   import.meta.env.VITE_URL_RESERVA   || 'http://localhost:9503',
  relatorio: import.meta.env.VITE_URL_RELATORIO || 'http://localhost:9504',
  emprestimo:import.meta.env.VITE_URL_EMPRESTIMO|| 'http://localhost:9500',
};

// ─── Instâncias Axios por serviço ─────────────────────────────────────────────
const makeClient = (baseURL: string) =>
  axios.create({ baseURL, timeout: 10_000 });

const clientUsuario    = makeClient(BASE.usuario);
const clientCatalogo   = makeClient(BASE.catalogo);
const clientReserva    = makeClient(BASE.reserva);
const clientRelatorio  = makeClient(BASE.relatorio);
const clientEmprestimo = makeClient(BASE.emprestimo);

// Interceptor: injeta token JWT em todas as requisições
[clientUsuario, clientCatalogo, clientReserva, clientRelatorio, clientEmprestimo].forEach((c) => {
  c.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
});

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface Usuario {
  usuario_id: number;
  usuario_nome: string;
  usuario_email: string;
  usuario_cpf: string;
  usuario_tipo: 'Leitor' | 'Bibliotecario';
  usuario_status: 'Ativo' | 'Inativo' | 'Bloqueado';
  usuario_data_cadastro: string;
  telefone?: { telefone_numero: string };
}

export interface Livro {
  livro_id: number;
  livro_titulo: string;
  livro_sinopse?: string;
  livro_status: 'Ativo' | 'Inativo';
  autor?: { autor_nome: string };
  genero?: { genero_nome: string };
  exemplares?: Exemplar[];
}

export interface Exemplar {
  exemplar_id: number;
  exemplar_codigo_barras: string;
  exemplar_status: 'Disponivel' | 'Emprestado' | 'Reservado' | 'Danificado';
}

export interface Emprestimo {
  emprestimo_id: number;
  usuario_id: number;
  livro_id: number;
  exemplar_id: number;
  emprestimo_data_emprestimo: string;
  emprestimo_data_devolucao_prevista: string;
  emprestimo_data_devolucao_real?: string;
  emprestimo_status: 'Ativo' | 'Devolvido' | 'Atrasado';
  emprestimo_multa_valor?: number;
  usuario?: { usuario_nome: string };
  livro?: { livro_titulo: string };
}

export interface Reserva {
  reserva_id: number;
  usuario_id: number;
  livro_id: number;
  reserva_data_reserva: string;
  reserva_data_expiracao?: string;
  reserva_status: 'Ativa' | 'Cancelada' | 'Concluida' | 'Expirada';
  reserva_posicao_fila?: number;
}

export interface DashboardKpis {
  totalLivros?: number;
  usuariosAtivos?: number;
  emprestimosAtivos?: number;
  reservasPendentes?: number;
  multasTotal?: number;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

export const auth = {
  login: async (email: string, senha: string) => {
    const { data } = await clientUsuario.post('/auth/login', { email, senha });
    return data; // { success, data: { token, usuario } }
  },
  refresh: async (token: string) => {
    const { data } = await clientUsuario.post('/auth/refresh', { token });
    return data;
  },
};

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────

export const usuarios = {
  listar: async (): Promise<Usuario[]> => {
    const { data } = await clientUsuario.get('/usuarios');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Usuario> => {
    const { data } = await clientUsuario.get(`/usuarios/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: Partial<Usuario> & { usuario_senha: string }) => {
    const { data } = await clientUsuario.post('/usuarios', payload);
    return data.data ?? data;
  },
  atualizar: async (id: number, payload: Partial<Usuario>) => {
    const { data } = await clientUsuario.put(`/usuarios/${id}`, payload);
    return data.data ?? data;
  },
  alterarStatus: async (id: number, status: string) => {
    const { data } = await clientUsuario.patch(`/usuarios/${id}/status`, { status });
    return data.data ?? data;
  },
  remover: async (id: number) => {
    const { data } = await clientUsuario.delete(`/usuarios/${id}`);
    return data;
  },
  listarInativos: async (): Promise<Usuario[]> => {
    const { data } = await clientUsuario.get('/usuarios/filtro/inativos');
    return data.data ?? data;
  },
  atualizarCargo: async (id: number, tipo: string) => {
    const { data } = await clientUsuario.patch(`/usuarios/${id}/cargo`, { tipo });
    return data.data ?? data;
  },
};

// ─── CATÁLOGO — LIVROS ────────────────────────────────────────────────────────

export const livros = {
  listar: async (): Promise<Livro[]> => {
    const { data } = await clientCatalogo.get('/livros');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Livro> => {
    const { data } = await clientCatalogo.get(`/livros/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: Partial<Livro>) => {
    const { data } = await clientCatalogo.post('/livros', payload);
    return data.data ?? data;
  },
  alterarStatus: async (id: number, status: string) => {
    const { data } = await clientCatalogo.patch(`/livros/${id}/status`, { status });
    return data.data ?? data;
  },
};

// ─── CATÁLOGO — EXEMPLARES ────────────────────────────────────────────────────

export const exemplares = {
  listarPorLivro: async (livroId: number): Promise<Exemplar[]> => {
    const { data } = await clientCatalogo.get(`/exemplares?livro_id=${livroId}`);
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Exemplar> => {
    const { data } = await clientCatalogo.get(`/exemplares/${id}`);
    return data.data ?? data;
  },
};

// ─── EMPRÉSTIMOS ──────────────────────────────────────────────────────────────

export const emprestimos = {
  listar: async (): Promise<Emprestimo[]> => {
    const { data } = await clientEmprestimo.get('/biblioteca/emprestimos');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Emprestimo> => {
    const { data } = await clientEmprestimo.get(`/biblioteca/emprestimos/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: { usuario_id: number; livro_id: number; exemplar_id: number }) => {
    const { data } = await clientEmprestimo.post('/biblioteca/emprestimos', payload);
    return data.data ?? data;
  },
  devolver: async (id: number) => {
    const { data } = await clientEmprestimo.patch(`/biblioteca/emprestimos/${id}/devolver`);
    return data.data ?? data;
  },
  listarAtrasados: async (): Promise<Emprestimo[]> => {
    const { data } = await clientEmprestimo.get('/biblioteca/emprestimos/atrasados');
    return data.data ?? data;
  },
};

// ─── RESERVAS ─────────────────────────────────────────────────────────────────

export const reservas = {
  listarAtivas: async (): Promise<Reserva[]> => {
    const { data } = await clientReserva.get('/reservas/listar-ativas');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Reserva> => {
    const { data } = await clientReserva.get(`/reservas/listar/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: { usuario_id: number; livro_id: number }) => {
    const { data } = await clientReserva.post('/reservas/criar', payload);
    return data.data ?? data;
  },
  cancelar: async (id: number) => {
    const { data } = await clientReserva.patch(`/reservas/atualizar-status/${id}`, {
      reserva_status: 'Cancelada',
    });
    return data.data ?? data;
  },
  buscarPorUsuario: async (usuarioId: number): Promise<Reserva[]> => {
    const { data } = await clientReserva.get(`/reservas/usuario/listar/${usuarioId}`);
    return data.data ?? data;
  },
  filaDoLivro: async (livroId: number): Promise<Reserva[]> => {
    const { data } = await clientReserva.get(`/reservas/livro/listar-fila/${livroId}`);
    return data.data ?? data;
  },
  contarPendentes: async (): Promise<number> => {
    const { data } = await clientReserva.get('/reservas/metricas/pendentes');
    return data.data?.total ?? data.total ?? 0;
  },
};

// ─── RELATÓRIOS / DASHBOARD ───────────────────────────────────────────────────

export const relatorios = {
  dashboardKpis: async (): Promise<DashboardKpis> => {
    const { data } = await clientRelatorio.get('/reservas/dashboard/kpis');
    return data.data ?? data;
  },
  totalMultas: async () => {
    const { data } = await clientRelatorio.get('/reservas/financeiro/multas-total');
    return data.data ?? data;
  },
  topLivros: async () => {
    const { data } = await clientRelatorio.get('/reservas/livros/top');
    return data.data ?? data;
  },
  usuariosInadimplentes: async () => {
    const { data } = await clientRelatorio.get('/reservas/usuarios/inadimplentes');
    return data.data ?? data;
  },
  exportarCSV: async () => {
    const response = await clientRelatorio.get('/reservas/exportar/csv', {
      responseType: 'blob',
    });
    return response.data;
  },
};
