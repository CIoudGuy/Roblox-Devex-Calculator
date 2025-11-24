import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Use root base for custom domain https://devex-calculator.dev/
  base: "/",
});
