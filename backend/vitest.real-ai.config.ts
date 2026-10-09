import { defineConfig } from "vitest/config";

/** Real-provider integration tests: `REAL_AI=1 npm run test:real-ai`. Never part of `npm test`. */
export default defineConfig({
  test: {
    include: ["tests-real/**/*.test.ts"],
    setupFiles: ["tests-real/setup-env.ts"],
    fileParallelism: false,
    testTimeout: 240_000,
    hookTimeout: 60_000,
  },
});
