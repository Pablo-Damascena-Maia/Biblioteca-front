import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { createProxyMiddleware } from "http-proxy-middleware";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Servidor público Senac ───────────────────────────────────────────────────
// Todos os microsserviços estão atrás de um único reverse proxy:
// http://academico3.rj.senac.br/20261prj5/biblioteca/{servico}/{rota}
const ACADEMICO_BASE = "http://academico3.rj.senac.br";
const ACADEMICO_PREFIX = "/20261prj5";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // ─── Proxy único: /biblioteca/* → academico3.rj.senac.br/20261prj5/biblioteca/* ──
  app.use(
    "/biblioteca",
    createProxyMiddleware({
      target: ACADEMICO_BASE,
      changeOrigin: true,
      pathRewrite: (path) => ACADEMICO_PREFIX + "/biblioteca" + path,
    })
  );

  // ─── Arquivos estáticos do React ─────────────────────────────────────────────
  const staticPath = path.resolve(__dirname, "public");
  app.use(express.static(staticPath));

  // SPA fallback — todas as rotas do React servem o index.html
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = Number(process.env.PORT || 3000);
  server.listen(port, "0.0.0.0", () => {
    console.log(`\n🚀 Frontend rodando em http://0.0.0.0:${port}`);
    console.log(`   Proxy: /biblioteca/* → ${ACADEMICO_BASE}${ACADEMICO_PREFIX}/biblioteca/*\n`);
  });
}

startServer().catch(console.error);
