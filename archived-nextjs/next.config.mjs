/** @type {import('next').NextConfig} */

// Frozen snapshot: the live site now uses `/fs-links` (see repo-root lib/siteBasePath.js).
const basePath = "/q-ext-link-grid";

const nextConfig = {
  output: "export",
  ...(basePath ? { basePath } : {}),

  // Skip type-checking during `next build` (JS-only repo; avoids the full TS validation pass).
  typescript: {
    ignoreBuildErrors: true,
  },

  poweredByHeader: false,
};

export default nextConfig;
