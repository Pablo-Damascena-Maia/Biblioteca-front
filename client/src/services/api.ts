/**
 * services/api.ts
 *
 * O front nunca chama os backends diretamente — sempre passa pelo proxy local:
 *   Dev  (Vite):    /api/{servico}/*  →  proxy Vite  →  localhost:{porta}/*
 *   Prod (Express): /api/{servico}/*  →  proxy Express (server/index.ts)  →  localhost:{porta}/*
 *
 * Dessa forma o backend sempre recebe a rota limpa, ex: /auth/login, /usuarios/:id
 *
 * Rotas do microsserviço de usuários (app.js):
 *   prefix /auth     → POST /auth/login  /auth/refresh  /auth/validate
 *   prefix /usuarios → GET|POST /usuarios   GET|PUT|DELETE /usuarios/:id
 *                      PATCH /usuarios/:id/status  /cargo  /senha
 *                      GET /usuarios/:id/logs  /exportar  /enderecos  /telefones
 *                      GET /usuarios/busca/email   /filtro/inativos
 */

import axios from 'axios';

// ─── Base URLs ────────────────────────────────────────────────────────────────
// Em dev (Vite), /api/{servico}/* é interceptado pelo proxy do vite.config.ts.
// Em prod, se VITE_URL_* estiver definido (ex: URL pública do Senac), usa diretamente.
// Se não estiver definido, cai no proxy do Express (server/index.ts) via /api/{servico}.
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:9505';
const basePath = import.meta.env.BASE_URL || '/'; // Vite injects base path here (e.g. "/20261prj5/biblioteca/")
const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;

const BASE = {
  usuario: import.meta.env.VITE_URL_USUARIO || `${origin}${cleanBasePath}/api/usuario`,
  catalogo: import.meta.env.VITE_URL_CATALOGO || `${origin}${cleanBasePath}/api/catalogo`,
  reserva: import.meta.env.VITE_URL_RESERVA || `${origin}${cleanBasePath}/api/reserva`,
  relatorio: import.meta.env.VITE_URL_RELATORIO || `${origin}${cleanBasePath}/api/relatorio`,
  emprestimo: import.meta.env.VITE_URL_EMPRESTIMO || `${origin}${cleanBasePath}/api/emprestimo`,
};

// ─── Instâncias Axios por serviço ─────────────────────────────────────────────
const makeClient = (baseURL: string) =>
  axios.create({ baseURL, timeout: 10_000 });

const clientUsuario = makeClient(BASE.usuario);
const clientCatalogo = makeClient(BASE.catalogo);
const clientReserva = makeClient(BASE.reserva);
const clientRelatorio = makeClient(BASE.relatorio);
const clientEmprestimo = makeClient(BASE.emprestimo);

// Interceptor: injeta token JWT (exceto /health)
[clientUsuario, clientCatalogo, clientReserva, clientRelatorio, clientEmprestimo].forEach((c) => {
  c.interceptors.request.use((config) => {
    if (config.url?.endsWith('/health')) return config;
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
  usuario_tipo: 'Leitor' | 'Bibliotecario';
  usuario_status: 'Ativo' | 'Inativo' | 'Bloqueado';
  usuario_data_cadastro: string;
  telefone?: { telefone_numero: string };
}

export interface Autor { id: number; nome: string; }
export interface Genero { id: number; nome: string; }

export interface Livro {
  id: number;
  titulo: string;
  isbn: string;
  editora?: string;
  anoPublicacao?: number;
  sinopse?: string;
  numeroPaginas?: number;
  idioma?: string;
  status?: number;
  imagem?: Buffer | null;
  extensao?: string | null;
  imagemNome?: string | null;
  autores?: { autor: Autor }[];
  generos?: { genero: Genero }[];
  exemplares?: Exemplar[];
  _count?: { exemplares: number };
}

export interface CriarLivroPayload {
  titulo: string;
  isbn: string;
  editora?: string;
  anoPublicacao?: number;
  sinopse?: string;
  numeroPaginas?: number;
  idioma?: string;
  autores?: number[];
  generos?: number[];
}

export interface Exemplar {
  id: number;
  codigoBarras: string;
  condicao?: 'Novo' | 'Bom' | 'Regular' | 'Desgastado';
  disponibilidade?: 'Disponivel' | 'Emprestado' | 'Manutencao' | 'Perdido';
  dataAquisicao?: string;
  livroId: number;
}

export interface ItemEmprestimo {
  item_emprestimo_id: number;
  emprestimo_id: number;
  exemplar_id: number;
  item_emprestimo_quantidade: number;
}

export interface Emprestimo {
  emprestimo_id: number;
  usuario_id: number;
  emprestimo_data_emprestimo: string;
  emprestimo_data_prevista_devolucao: string;
  emprestimo_status: 'Ativo' | 'Devolvido' | 'Atrasado';
  itens: ItemEmprestimo[];
  devolucao?: unknown;
  usuario?: { usuario_nome: string };
  livro?: { livro_titulo: string };
  livro_id?: number;
  exemplar_id?: number;
  emprestimo_multa_valor?: number;
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
// front → /api/usuario/auth/login → proxy strip /api/usuario → backend recebe /auth/login  ✓

export const auth = {
  login: async (email: string, senha: string) => {
    const { data } = await clientUsuario.post('/auth/login', { email, senha });
    return data;
  },
  refresh: async (token: string) => {
    const { data } = await clientUsuario.post('/auth/refresh', { token });
    return data;
  },
  validarToken: async (token: string) => {
    const { data } = await clientUsuario.post('/auth/validate', { token });
    return data;
  },
};

// ─── USUÁRIOS ─────────────────────────────────────────────────────────────────
// front → /api/usuario/usuarios → proxy → backend recebe /usuarios  ✓

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
  buscarPorEmail: async (email: string): Promise<Usuario> => {
    const { data } = await clientUsuario.get('/usuarios/busca/email', { params: { email } });
    return data.data ?? data;
  },
  listarInativos: async (): Promise<Usuario[]> => {
    const { data } = await clientUsuario.get('/usuarios/filtro/inativos');
    return data.data ?? data;
  },
  atualizarCargo: async (id: number, tipo: string) => {
    const { data } = await clientUsuario.patch(`/usuarios/${id}/cargo`, { tipo });
    return data.data ?? data;
  },
  obterLogs: async (id: number) => {
    const { data } = await clientUsuario.get(`/usuarios/${id}/logs`);
    return data.data ?? data;
  },
  exportarDados: async (id: number) => {
    const response = await clientUsuario.get(`/usuarios/${id}/exportar`, { responseType: 'blob' });
    return response.data;
  },
  listarEnderecos: async (id: number) => {
    const { data } = await clientUsuario.get(`/usuarios/${id}/enderecos`);
    return data.data ?? data;
  },
  atualizarEndereco: async (id: number, payload: object) => {
    const { data } = await clientUsuario.put(`/usuarios/${id}/endereco`, payload);
    return data.data ?? data;
  },
  limparEndereco: async (id: number) => {
    const { data } = await clientUsuario.delete(`/usuarios/${id}/endereco`);
    return data;
  },
  listarTelefones: async (id: number) => {
    const { data } = await clientUsuario.get(`/usuarios/${id}/telefones`);
    return data.data ?? data;
  },
  atualizarTelefone: async (id: number, payload: object) => {
    const { data } = await clientUsuario.put(`/usuarios/${id}/telefone`, payload);
    return data.data ?? data;
  },
  limparTelefone: async (id: number) => {
    const { data } = await clientUsuario.delete(`/usuarios/${id}/telefone`);
    return data;
  },
  alterarSenha: async (id: number, payload: { senha_atual: string; nova_senha: string }) => {
    const { data } = await clientUsuario.patch(`/usuarios/${id}/senha`, payload);
    return data.data ?? data;
  },
  uploadFoto: async (id: number, arquivo: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', arquivo);
    await clientUsuario.post(`/usuarios/${id}/foto`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getFotoUrl: (id: number): string => {
    return `${BASE.usuario}/usuarios/${id}/foto`;
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
  criar: async (payload: CriarLivroPayload) => {
    const { data } = await clientCatalogo.post('/livros', payload);
    return data.data ?? data;
  },
  alterarStatus: async (id: number, status: number) => {
    const { data } = await clientCatalogo.patch(`/livros/${id}/status`, { status });
    return data.data ?? data;
  },
  editar: async (id: number, payload: CriarLivroPayload) => {
    const { data } = await clientCatalogo.put(`/livros/${id}`, payload);
    return data.data ?? data;
  },
  // Retorna a URL pública da capa para uso em <img src="...">
  getCapaUrl: (id: number): string => {
    return `${BASE.catalogo}/livros/${id}/capa`;
  },
  uploadCapa: async (id: number, arquivo: File): Promise<void> => {
    const formData = new FormData();
    formData.append('file', arquivo);
    await clientCatalogo.post(`/livros/${id}/capa`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deletarCapa: async (id: number): Promise<void> => {
    await clientCatalogo.delete(`/livros/${id}/capa`);
  },
};

// ─── CATÁLOGO — AUTORES ───────────────────────────────────────────────────────

export const autores = {
  listar: async (): Promise<Autor[]> => {
    const { data } = await clientCatalogo.get('/autores');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Autor> => {
    const { data } = await clientCatalogo.get(`/autores/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: { nome: string; dataNascimento?: string; nacionalidade?: string; biografia?: string }) => {
    const { data } = await clientCatalogo.post('/autores', payload);
    return data.data ?? data;
  },
  alterarStatus: async (id: number, status: number) => {
    const { data } = await clientCatalogo.patch(`/autores/${id}/status`, { status });
    return data.data ?? data;
  },
};

// ─── CATÁLOGO — GÊNEROS ───────────────────────────────────────────────────────

export const generos = {
  listar: async (): Promise<Genero[]> => {
    const { data } = await clientCatalogo.get('/generos');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Genero> => {
    const { data } = await clientCatalogo.get(`/generos/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: { nome: string; descricao?: string }) => {
    const { data } = await clientCatalogo.post('/generos', payload);
    return data.data ?? data;
  },
  alterarStatus: async (id: number, status: number) => {
    const { data } = await clientCatalogo.patch(`/generos/${id}/status`, { status });
    return data.data ?? data;
  },
};

// ─── CATÁLOGO — EXEMPLARES ────────────────────────────────────────────────────

export const exemplares = {
  listarPorLivro: async (livroId: number): Promise<Exemplar[]> => {
    const { data } = await clientCatalogo.get(`/exemplares?livro_id=${livroId}`);
    return data.data ?? data;
  },
  listar: async (filtros?: { disponibilidade?: string }): Promise<Exemplar[]> => {
    const { data } = await clientCatalogo.get('/exemplares', { params: filtros });
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Exemplar> => {
    const { data } = await clientCatalogo.get(`/exemplares/${id}`);
    return data.data ?? data;
  },
  // POST /livros/:livroId/exemplares  — o backend vincula o exemplar ao livro pelo path param
  adicionar: async (livroId: number, payload: {
    codigoBarras: string;
    condicao?: 'Novo' | 'Bom' | 'Regular' | 'Desgastado';
    statusDisponibilidade?: 'Disponivel' | 'Emprestado' | 'Manutencao' | 'Perdido';
    dataAquisicao: string;
  }) => {
    const { data } = await clientCatalogo.post(`/exemplares/livro/${livroId}`, payload);
    return data.data ?? data;
  },
  // PATCH /exemplares/:id/status
  alterarStatus: async (id: number, payload: {
    condicao?: 'Novo' | 'Bom' | 'Regular' | 'Desgastado';
    disponibilidade?: 'Disponivel' | 'Emprestado' | 'Manutencao' | 'Perdido';
  }) => {
    const { data } = await clientCatalogo.patch(`/exemplares/${id}/status`, payload);
    return data.data ?? data;
  },
};

// ─── EMPRÉSTIMOS ──────────────────────────────────────────────────────────────

export const emprestimos = {
  listar: async (): Promise<Emprestimo[]> => {
    const { data } = await clientEmprestimo.get('/emprestimos');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Emprestimo> => {
    const { data } = await clientEmprestimo.get(`/emprestimos/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: { usuarioId: number; livroId: number; exemplarId: number; diasPrazo?: number }) => {
    const { data } = await clientEmprestimo.post('/emprestimos', payload);
    return data.data ?? data;
  },
  devolver: async (emprestimoId: number) => {
    const { data } = await clientEmprestimo.post('/devolucoes', { emprestimoId });
    return data.data ?? data;
  },
  listarAtrasados: async (): Promise<Emprestimo[]> => {
    const { data } = await clientEmprestimo.get('/emprestimos/atrasados');
    return data.data ?? data;
  },
};

// ─── RESERVAS ─────────────────────────────────────────────────────────────────

export const reservas = {
  listarAtivas: async (): Promise<Reserva[]> => {
    const { data } = await clientReserva.get('/reserva/listar-ativas');
    return data.data ?? data;
  },
  obterPorId: async (id: number): Promise<Reserva> => {
    const { data } = await clientReserva.get(`/reserva/listar/${id}`);
    return data.data ?? data;
  },
  criar: async (payload: { usuario_id: number; livro_id: number }) => {
    const { data } = await clientReserva.post('/reserva/criar', payload);
    return data.data ?? data;
  },
  cancelar: async (id: number) => {
    const { data } = await clientReserva.patch(`/reserva/atualizar-status/${id}`, { reserva_status: 0 });
    return data.data ?? data;
  },
  buscarPorUsuario: async (usuarioId: number): Promise<Reserva[]> => {
    const { data } = await clientReserva.get(`/reserva/usuario/listar/${usuarioId}`);
    return data.data ?? data;
  },
  filaDoLivro: async (livroId: number): Promise<Reserva[]> => {
    const { data } = await clientReserva.get(`/reserva/livro/listar-fila/${livroId}`);
    return data.data ?? data;
  },
  contarPendentes: async (): Promise<number> => {
    const { data } = await clientReserva.get('/reserva/metricas/pendentes');
    return data.data?.total_pendentes ?? data.total_pendentes ?? 0;
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
    const response = await clientRelatorio.get('/reservas/exportar/csv', { responseType: 'blob' });
    return response.data;
  },
};

// ─── HEALTHCHECK ─────────────────────────────────────────────────────────────

async function ping(client: ReturnType<typeof makeClient>, path = '/health'): Promise<boolean> {
  try {
    await client.get(path, { timeout: 3_000 });
    return true;
  } catch {
    return false;
  }
}

export async function checkServicos() {
  const [catalogo, usuario, emprestimo, reserva] = await Promise.all([
    ping(clientCatalogo),
    ping(clientUsuario),
    ping(clientEmprestimo),
    ping(clientReserva, '/reserva/listar-ativas'),
  ]);
  return { catalogo, usuario, emprestimo, reserva };
}