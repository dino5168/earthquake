// Copy derived data into public/data so Vite can serve it.
// terrain.bin/json are produced directly there by ../build_terrain.py.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "public/data");
const csv = resolve(root, "../EQHistory.CSV");

mkdirSync(outDir, { recursive: true });
if (!existsSync(csv)) {
  console.error(`missing ${csv}; run: uv run --no-project ../csv_to_point_cloud.py`);
  process.exit(1);
}
copyFileSync(csv, resolve(outDir, "EQHistory.csv"));
for (const f of ["terrain.bin", "terrain.json"]) {
  if (!existsSync(resolve(outDir, f))) {
    console.error(`missing public/data/${f}; run: uv run --no-project --with numpy --with pillow ../build_terrain.py`);
    process.exit(1);
  }
}
console.log("data ready in public/data");
