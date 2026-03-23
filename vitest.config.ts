import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/**/*.test.ts",
      "packages/backend/**/*.test.ts",
    ],
    exclude: [
      "node_modules/**",
      "**/node_modules/**",
      "packages/transactional/.react-email/**",
      "apps/native/**",
    ],
  },
});
