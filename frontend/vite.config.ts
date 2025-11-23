import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";

const versionFilePath = path.resolve(__dirname, "../VERSION");
let versionFromFile = "0.0.0";

try {
  const raw = fs.readFileSync(versionFilePath, "utf8").trim();
  if (raw) {
    versionFromFile = raw;
  }
} catch (error) {
  console.warn("Unable to read VERSION file:", error);
}

if (
  !process.env.VITE_APP_VERSION ||
  process.env.VITE_APP_VERSION.trim().length === 0
) {
  process.env.VITE_APP_VERSION = versionFromFile;
  if (!process.env.VITE_APP_BUILD_LABEL) {
    process.env.VITE_APP_BUILD_LABEL = "local development build";
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
