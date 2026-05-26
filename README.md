# 📚 Biblioteca Digital — Frontend

Interface web do sistema de gerenciamento de biblioteca, construída em React + TypeScript e integrada com todos os microsserviços do backend.

---

## 🏗️ Tecnologias

- **React 19** + **TypeScript**
- **Vite** — build e dev server
- **Tailwind CSS v4** — estilização
- **shadcn/ui** + **Radix UI** — componentes
- **Wouter** — roteamento
- **Axios** — comunicação com os microsserviços
- **Sonner** — notificações toast
- **Lucide React** — ícones

---

## 🔌 Microsserviços integrados

| Serviço       | Porta padrão | Variável de ambiente      |
|---------------|:------------:|---------------------------|
| Usuário       | `9501`       | `VITE_URL_USUARIO`        |
| Catálogo      | `9502`       | `VITE_URL_CATALOGO`       |
| Reserva       | `9503`       | `VITE_URL_RESERVA`        |
| Relatório     | `9504`       | `VITE_URL_RELATORIO`      |
| Empréstimo    | `9500`       | `VITE_URL_EMPRESTIMO`     |

---

## ⚙️ Configuração

### 1. Variáveis de ambiente

Copie o arquivo de exemplo e ajuste as URLs conforme o ambiente:

```bash
cp .env.example .env
```

Conteúdo do `.env`:

```env
VITE_URL_USUARIO=http://localhost:9501
VITE_URL_CATALOGO=http://localhost:9502
VITE_URL_RESERVA=http://localhost:9503
VITE_URL_RELATORIO=http://localhost:9504
VITE_URL_EMPRESTIMO=http://localhost:9500
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Rodar em desenvolvimento

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`.

### 4. Build para produção

```bash
pnpm build
pnpm start
```

---

## 🔐 Autenticação

O login é feito via `POST /auth/login` no microsserviço de Usuário. O token JWT retornado é salvo no `localStorage` e injetado automaticamente em todas as requisições subsequentes via interceptor do Axios.

- Usuários do tipo **`Bibliotecario`** têm acesso de administrador
- Usuários do tipo **`Leitor`** têm acesso padrão
- Todas as rotas são protegidas — sem token válido o usuário é redirecionado para `/login`

Para criar o primeiro usuário administrador (com o microsserviço rodando):

```bash
curl -X POST http://localhost:9501/usuarios \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_nome": "Admin",
    "usuario_email": "admin@biblioteca.com",
    "usuario_senha": "senha123",
    "usuario_tipo": "Bibliotecario",
    "usuario_status": "Ativo",
    "usuario_data_cadastro": "2026-01-01",
    "endereco_id": 1,
    "telefone_id": 1
  }'
```

---

## 📁 Estrutura do projeto

```
client/
├── src/
│   ├── components/
│   │   ├── DashboardLayout.tsx   # Layout com sidebar e navegação
│   │   └── ui/                   # Componentes shadcn/ui
│   ├── contexts/
│   │   ├── AuthContext.tsx        # Estado global de autenticação
│   │   └── ThemeContext.tsx       # Tema claro/escuro
│   ├── pages/
│   │   ├── Login.tsx             # Tela de login
│   │   ├── Dashboard.tsx         # KPIs e status dos serviços
│   │   ├── Catalogo.tsx          # Livros (Catálogo)
│   │   ├── Emprestimos.tsx       # Empréstimos e devoluções
│   │   ├── Reservas.tsx          # Reservas de livros
│   │   ├── Usuarios.tsx          # Gestão de usuários
│   │   └── Relatorios.tsx        # Relatórios e exportação CSV
│   ├── services/
│   │   └── api.ts                # Camada de comunicação com os microsserviços
│   └── App.tsx                   # Roteamento e guard de autenticação
├── index.html
.env.example
```

---

## 📄 Páginas

| Rota           | Página        | Microsserviço(s)              |
|----------------|---------------|-------------------------------|
| `/`            | Dashboard     | Todos (status + KPIs)         |
| `/catalogo`    | Catálogo      | Catálogo (9502)               |
| `/emprestimos` | Empréstimos   | Empréstimo (9500)             |
| `/reservas`    | Reservas      | Reserva (9503)                |
| `/usuarios`    | Usuários      | Usuário (9501)                |
| `/relatorios`  | Relatórios    | Relatório (9504)              |
| `/login`       | Login         | Usuário (9501) — `/auth/login`|

---

## 🔄 Funcionalidades por página

**Dashboard**
- KPIs em tempo real: total de livros, usuários ativos, empréstimos ativos, reservas pendentes
- Feed de atividades recentes
- Status Online/Offline de cada microsserviço

**Catálogo**
- Listagem e busca de livros por título/autor
- Ativar/desativar livros (`PATCH /livros/:id/status`)

**Empréstimos**
- Tabs: Todos / Ativos / Atrasados
- Contagem de multas pendentes
- Botão "Devolver" (`PATCH /biblioteca/emprestimos/:id/devolver`)

**Reservas**
- Listagem de reservas ativas com posição na fila
- Cancelamento de reservas

**Usuários**
- Busca por nome, email ou CPF
- Ativar/desativar e remover usuários
- Badge de tipo: `Bibliotecario` ou `Leitor`

**Relatórios**
- KPIs consolidados do microsserviço de relatório
- Top livros mais lidos
- Usuários inadimplentes
- Exportação em CSV

---

## 🛠️ Scripts disponíveis

| Comando        | Descrição                          |
|----------------|------------------------------------|
| `pnpm dev`     | Inicia o servidor de desenvolvimento |
| `pnpm build`   | Gera o build de produção           |
| `pnpm start`   | Inicia o servidor de produção      |
| `pnpm check`   | Verifica erros de TypeScript       |
| `pnpm format`  | Formata o código com Prettier      |
