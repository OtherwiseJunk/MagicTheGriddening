import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";

// Tests that need a real Postgres (DATABASE_URL). Run with `npm run test:integration`.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    include: ["tests/integration/**/*.integration.test.ts"],
    fileParallelism: false,
  },
});
