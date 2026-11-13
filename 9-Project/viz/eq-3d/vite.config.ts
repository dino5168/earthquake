import { resolve } from "node:path";
import { defineConfig } from "vite";

// Served as a sub-site of the Leptos app: Trunk copies dist/ to /viz/eq-3d/.
// Two pages share one build so the globe reuses the point layer, classes and legend:
//   /viz/eq-3d/       Taiwan (CWA catalog)
//   /viz/eq-3d/usgs/  World (USGS, queried live)
export default defineConfig({
  base: "/viz/eq-3d/",
  build: {
    // three.js alone is ~600 kB minified (~147 kB gzip); loaded only on /history.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      input: {
        taiwan: resolve(import.meta.dirname, "index.html"),
        usgs: resolve(import.meta.dirname, "usgs/index.html"),
      },
    },
  },
});
