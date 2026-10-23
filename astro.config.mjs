import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";

import { linkIconsIntegration } from "./lib/linkIconsAstroIntegration.js";
import { siteBasePath } from "./lib/siteBasePath.js";

export default defineConfig({
  output: "static",
  outDir: "out",
  ...(siteBasePath ? { base: siteBasePath } : {}),
  integrations: [tailwind(), linkIconsIntegration()],
});
