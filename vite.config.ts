import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    port: 3000,
    strictPort: false,
    host: true,
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api/emprestimo": {
        target: "http://localhost:9500",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/emprestimo/, ""),
      },
      "/api/usuario": {
        target: "http://localhost:9501",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/usuario/, ""),
      },
      "/api/catalogo": {
        target: "http://localhost:9502",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/catalogo/, ""),
      },
      "/api/reserva": {
        target: "http://localhost:9503",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/reserva/, ""),
      },
      "/api/relatorio": {
        target: "http://localhost:9504",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/relatorio/, ""),
      },
    },
  },
});
