import { build as buildWithEsbuild } from "esbuild";
import { build as buildWithVite } from "vite";

const root = new URL("../", import.meta.url).pathname;

await buildWithVite({
  configFile: new URL("../vite.config.ts", import.meta.url).pathname
});

await buildWithEsbuild({
  absWorkingDir: root,
  bundle: true,
  entryPoints: ["src/content/floating-preview.ts"],
  format: "iife",
  minify: true,
  outfile: "dist/assets/floating-preview.js",
  platform: "browser",
  target: "es2022"
});
