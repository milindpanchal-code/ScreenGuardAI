import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

function fromRoot(path: string) {
  return new URL(path, import.meta.url).pathname;
}

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: fromRoot("popup.html"),
        options: fromRoot("options.html"),
        "preview-frame": fromRoot("preview-frame.html"),
        background: fromRoot("src/background/service-worker.ts")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  }
});
