/**
 * Fast static build: skips per-URL HTTP fetches (LINK_GRID_SKIP_FETCH in lib/resolveIcon.js).
 * Usage: npm run build:fast
 */
import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.env.LINK_GRID_SKIP_FETCH = "1";

const astroCli = path.join(root, "node_modules", "astro", "astro.js");
if (!existsSync(astroCli)) {
  console.error("Astro CLI not found. Run: npm install");
  process.exit(1);
}

const r = spawnSync(process.execPath, [astroCli, "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(r.status ?? 1);
