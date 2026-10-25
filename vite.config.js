import { cpSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite bundles assets referenced by <img>, <video>, <link> and CSS, but not plain
// <a href> links such as the resume PDF, or paths that only appear in data (project
// images stored in Supabase as assets/projects/...), so copy the folder as-is.
let outDir = "dist";
const copyAssets = {
  name: "copy-assets",
  apply: "build",
  configResolved(config) {
    outDir = resolve(config.root, config.build.outDir);
  },
  closeBundle() {
    cpSync("assets", resolve(outDir, "assets"), { recursive: true });
  },
};

export default defineConfig({
  plugins: [react(), copyAssets],
  publicDir: false,
});
