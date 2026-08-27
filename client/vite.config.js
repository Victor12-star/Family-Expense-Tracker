// =====================================================================
// Vite config
// In development, proxies /api to the local backend (localhost:5000).
// In production, the API URL comes from VITE_API_URL (Render backend).
// =====================================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Split large third-party libraries from application code. This improves
    // repeat-visit caching and prevents one oversized JavaScript bundle.
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
  server: {
    port: 5173,
    // During development, forward /api to the local backend
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
