import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Base path — mesmo valor de vite.config.ts (base) ──────────────────────
const BASE_PATH = "/20261prj5/biblioteca";

// Endereços dos microsserviços (mesmos do .env.example)
// Em produção no Senac, os backends rodam localmente nas portas abaixo.
const SVC = {
  usuario: process.env.VITE_URL_USUARIO || "http://localhost:9501",
  catalogo: process.env.VITE_URL_CATALOGO || "http://localhost:9502",
  reserva: process.env.VITE_URL_RESERVA || "http://localhost:9503",
  relatorio: process.env.VITE_URL_RELATORIO || "http://localhost:9504",
  emprestimo: process.env.VITE_URL_EMPRESTIMO || "http://localhost:9500",
};

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Proxies por microsserviço ────────────────────────────────────────────
  // O front chama /api/usuario/auth/login  → proxy remove /api/usuario → backend recebe /auth/login
  // O front chama /api/usuarios/...        → proxy remove /api/usuario → backend recebe /usuarios/...
  // O front chama /api/catalogo/livros     → proxy remove /api/catalogo → backend recebe /livros
  // etc.
  //
  // Em produção no Senac, se VITE_URL_* estiver definido, o front chama direto
  // o backend (CORS) e NÃO passa pelo proxy Express. Mas mantemos o proxy como
  // fallback para ambientes sem as variáveis.

  const makeProxy = (prefix: string, target: string) =>
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^${BASE_PATH}/api/${prefix}`]: "" },
    });

  app.use(`${BASE_PATH}/api/usuario`, makeProxy("usuario", SVC.usuario));
  app.use(`${BASE_PATH}/api/catalogo`, makeProxy("catalogo", SVC.catalogo));
  app.use(`${BASE_PATH}/api/reserva`, makeProxy("reserva", SVC.reserva));
  app.use(`${BASE_PATH}/api/relatorio`, makeProxy("relatorio", SVC.relatorio));
  app.use(`${BASE_PATH}/api/emprestimo`, makeProxy("emprestimo", SVC.emprestimo));

  // ─── Arquivos estáticos do React ─────────────────────────────────────────
  const staticPath = path.resolve(__dirname, "public");
  app.use(BASE_PATH, express.static(staticPath));

  // SPA fallback — qualquer rota dentro do base path devolve index.html
  app.get(`${BASE_PATH}/*`, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Redirect raiz → base path (conveniência)
  app.get("/", (_req, res) => {
    res.redirect(`${BASE_PATH}/`);
  });

  const port = Number(process.env.PORT || 9505);
  server.listen(port, "0.0.0.0", () => {
    console.log(`\n🚀 Frontend rodando em http://0.0.0.0:${port}${BASE_PATH}/`);
    console.log(`   Proxy ${BASE_PATH}/api/usuario    → ${SVC.usuario}`);
    console.log(`   Proxy ${BASE_PATH}/api/catalogo   → ${SVC.catalogo}`);
    console.log(`   Proxy ${BASE_PATH}/api/reserva    → ${SVC.reserva}`);
    console.log(`   Proxy ${BASE_PATH}/api/relatorio  → ${SVC.relatorio}`);
    console.log(`   Proxy ${BASE_PATH}/api/emprestimo → ${SVC.emprestimo}\n`);
  });
}

startServer().catch(console.error);