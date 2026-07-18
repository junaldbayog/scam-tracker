import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    // API tests hit a live server; keep them sequential so cookie state and
    // rate-limit budgets behave predictably.
    fileParallelism: false,
    testTimeout: 15000,
  },
});
