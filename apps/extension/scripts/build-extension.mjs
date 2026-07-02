import { build as buildWithEsbuild } from "esbuild";
import { build as buildWithVite } from "vite";
import { copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

await buildWithVite({
  configFile: fileURLToPath(new URL("../vite.config.ts", import.meta.url))
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

const mediaPipeWasmFiles = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm"
];
const mediaPipeWasmSource = new URL(
  "../../../node_modules/@mediapipe/tasks-vision/wasm/",
  import.meta.url
);
const mediaPipeWasmDestination = new URL("../dist/wasm/", import.meta.url);

await mkdir(mediaPipeWasmDestination, { recursive: true });
await Promise.all(
  mediaPipeWasmFiles.map((fileName) =>
    copyFile(new URL(fileName, mediaPipeWasmSource), new URL(fileName, mediaPipeWasmDestination))
  )
);
