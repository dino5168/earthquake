import { defineConfig } from "vite";

// Served as a sub-site of the Leptos app: Trunk copies dist/ to /viz/eq-3d/.
export default defineConfig({
  base: "/viz/eq-3d/",
  build: {
    // three.js alone is ~600 kB minified (~147 kB gzip); loaded only on /history.
    chunkSizeWarningLimit: 700,
  },
});
