import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    // Default run = unit tests only. Integration tests need the app running:
    //   npm run test:api
    include: ["tests/unit/**/*.test.ts"],
  },
});
