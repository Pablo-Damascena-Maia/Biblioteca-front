import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/20261prj5/biblioteca/',
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 9505,
    strictPort: false,
    host: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      // O servidor remoto do usuário está fora do ar (Erro 502 Bad Gateway).
      // Redirecionamos a rota de usuário localmente para a porta 9501, que está rodando.
      "/biblioteca/usuario": {
        target: "http://localhost:9501",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/biblioteca\/usuario/, ''),
      },
      // Demais serviços continuam indo para o servidor remoto
      "/biblioteca": {
        target: process.env.VITE_API_BASE_URL || "http://academico3.rj.senac.br",
        changeOrigin: true,
        rewrite: (path) => (process.env.VITE_API_PREFIX ?? "/20261prj5") + path,
      },
    },
  },
});
