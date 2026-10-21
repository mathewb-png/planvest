import { defineConfig } from "vite";

export default defineConfig({
  root: "web",
  base: process.env.GITHUB_ACTIONS ? "/planvest/" : "/",
  build: {
    outDir: "../dist-web",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
