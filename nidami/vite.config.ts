import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// base "./" : le site marche dans n'importe quel dossier (GitHub Pages, Vercel, etc.)
// Deux pages : index.html = appli officielle ; dev.html = version développeur (à part).
export default defineConfig({ base: "./", plugins: [react()], build: { rollupOptions: { input: { main: "index.html", dev: "dev.html" } } } });
