import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ensureLocalIconImagesInPagesJson } from "./ensureLocalIconImages.js";

async function copyLinkIconsToOut(outDir) {
  const src = path.join(process.cwd(), "public", "link-icons");
  const dest = path.join(outDir, "link-icons");
  try {
    await fs.access(src);
  } catch {
    return;
  }
  await fs.cp(src, dest, { recursive: true });
}

/**
 * Download icons into `public/link-icons/` before Astro copies `public/` → `out/`,
 * then copy again after the build so files written during page render are not dropped.
 */
export function linkIconsIntegration() {
  return {
    name: "link-icons",
    hooks: {
      "astro:build:start": async () => {
        await ensureLocalIconImagesInPagesJson();
      },
      "astro:build:done": async ({ dir }) => {
        await copyLinkIconsToOut(fileURLToPath(dir));
      },
      "astro:server:start": async () => {
        await ensureLocalIconImagesInPagesJson();
      },
    },
  };
}
