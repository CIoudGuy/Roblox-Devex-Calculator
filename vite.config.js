import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Set base for GitHub Pages (updates asset paths). Change if repo name differs.
  base: "/Roblox-Devex-Calculator/",
});
