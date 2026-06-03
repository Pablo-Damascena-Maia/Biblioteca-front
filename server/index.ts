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

  // ─── Proxies e Rotas ──────────────────────────────────────────────────────
  // Configuramos tudo em um Router para poder montar tanto no BASE_PATH (local)
  // quanto na raiz (caso o proxy reverso do Senac/IIS remova o prefixo).

  const appRouter = express.Router();

  const makeProxy = (prefix: string, target: string) =>
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: { [`^.*/api/${prefix}`]: "" }, // Aceita com ou sem BASE_PATH
    });

  appRouter.use(`/api/usuario`, makeProxy("usuario", SVC.usuario));
  appRouter.use(`/api/catalogo`, makeProxy("catalogo", SVC.catalogo));
  appRouter.use(`/api/reserva`, makeProxy("reserva", SVC.reserva));
  appRouter.use(`/api/relatorio`, makeProxy("relatorio", SVC.relatorio));
  appRouter.use(`/api/emprestimo`, makeProxy("emprestimo", SVC.emprestimo));

  // ─── Arquivos estáticos do React ─────────────────────────────────────────
  const staticPath = path.resolve(__dirname, "public");
  appRouter.use(express.static(staticPath));

  // SPA fallback — qualquer rota devolve index.html
  appRouter.get(`*`, (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  // Monta o router em ambos os caminhos
  app.use(BASE_PATH, appRouter);
  app.use("/", appRouter);

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