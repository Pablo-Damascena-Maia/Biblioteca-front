import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  base: "/20261prj5/biblioteca/",

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

    // Dev: proxy /api/{servico}/* → backend local na porta correspondente
    // Remove o prefixo /api/{servico} antes de repassar, igual ao server/index.ts de produção.
    // Ex: /api/usuario/auth/login → http://localhost:9501/auth/login  ✓
    proxy: {
      "/api/usuario": {
        target: process.env.VITE_URL_USUARIO || "http://localhost:9501",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/usuario/, ""),
      },
      "/api/catalogo": {
        target: process.env.VITE_URL_CATALOGO || "http://localhost:9502",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/catalogo/, ""),
      },
      "/api/reserva": {
        target: process.env.VITE_URL_RESERVA || "http://localhost:9503",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/reserva/, ""),
      },
      "/api/relatorio": {
        target: process.env.VITE_URL_RELATORIO || "http://localhost:9504",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/relatorio/, ""),
      },
      "/api/emprestimo": {
        target: process.env.VITE_URL_EMPRESTIMO || "http://localhost:9500",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/emprestimo/, ""),
      },
    },
  },
});