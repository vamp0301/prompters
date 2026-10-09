import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Real-provider tests run only via `npm run test:real-ai`.
    exclude: [...configDefaults.exclude, "tests-real/**"],
    globalSetup: ["tests/global-setup.ts"],
    setupFiles: ["tests/setup-env.ts"],
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 60000,
  },
});
