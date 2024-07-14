import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json" assert { type: "json" };

export default {
  plugins: [crx({ manifest })],
  resolve: {
    alias: {
      "options.js": new URL("./options.js", import.meta.url).pathname,
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        content: "src/content-script.ts",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
};
