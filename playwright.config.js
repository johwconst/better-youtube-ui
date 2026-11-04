import { defineConfig } from "@playwright/test";

// Os testes carregam a extensão no Chromium do sistema (CHROMIUM_PATH,
// padrão /usr/bin/chromium). Não precisa de `npx playwright install`.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  workers: 1,
  reporter: [["list"]],
  use: { trace: "retain-on-failure" },
});
