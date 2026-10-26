import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// base "./" : le site marche dans n'importe quel dossier (GitHub Pages, Vercel, etc.)
export default defineConfig({ base: "./", plugins: [react()] });
