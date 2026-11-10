// Refresh committed viewer data from the 4-資料處理 pipeline outputs.
// Run after regenerating EQHistory.CSV / terrain, then commit public/data.
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pipeline = resolve(root, "../../../4-資料處理");
const outDir = resolve(root, "public/data");
const csv = resolve(pipeline, "EQHistory.CSV");

mkdirSync(outDir, { recursive: true });
if (!existsSync(csv)) {
  console.error(`missing ${csv}\n  run (in 4-資料處理): uv run --no-project csv_to_point_cloud.py`);
  process.exit(1);
}
copyFileSync(csv, resolve(outDir, "EQHistory.csv"));
for (const f of ["terrain.bin", "terrain.json"]) {
  if (!existsSync(resolve(outDir, f))) {
    console.error(
      `missing public/data/${f}\n  run (in 4-資料處理): uv run --no-project --with numpy --with pillow build_terrain.py`,
    );
    process.exit(1);
  }
}
console.log("public/data updated — remember to commit it (CI deploys the committed copy).");
