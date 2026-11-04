// Fixture do Playwright: Chromium com o Vitro carregado + YouTube falso.
import { test as base, chromium, expect } from "@playwright/test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homePage, watchPage } from "./fake-youtube.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const CHROMIUM = process.env.CHROMIUM_PATH || "/usr/bin/chromium";

export const test = base.extend({
  // idioma da interface do navegador (o "Automático" do Vitro segue isso)
  uiLang: ["en-US", { option: true }],

  context: async ({ uiLang }, use) => {
    const userDataDir = mkdtempSync(join(tmpdir(), "vitro-e2e-"));
    const context = await chromium.launchPersistentContext(userDataDir, {
      executablePath: CHROMIUM,
      headless: !process.env.HEADED,
      locale: uiLang,
      viewport: { width: 1440, height: 900 },
      args: [`--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`, `--lang=${uiLang}`],
    });

    await context.route("https://www.youtube.com/**", (route) => {
      const url = new URL(route.request().url());
      if (route.request().resourceType() !== "document") return route.fulfill({ status: 204 });
      const ad = url.searchParams.has("ad");
      const light = url.searchParams.has("light");
      const body = url.pathname === "/watch" ? watchPage({ ad }) : homePage({ light });
      return route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body });
    });

    await use(context);
    await context.close();
    rmSync(userDataDir, { recursive: true, force: true });
  },

  extensionId: async ({ context }, use) => {
    const page = await context.newPage();
    await page.goto("chrome://extensions");
    const id = await page.evaluate(async () => {
      const all = await chrome.developerPrivate.getExtensionsInfo();
      return all.find((e) => e.name.startsWith("Vitro"))?.id;
    });
    await page.close();
    if (!id) throw new Error("Vitro não carregou no Chromium");
    await use(id);
  },

  // abre o popup da extensão numa aba
  popup: async ({ context, extensionId }, use) => {
    await use(async () => {
      const p = await context.newPage();
      await p.goto(`chrome-extension://${extensionId}/popup/popup.html`);
      await p.locator("#version").filter({ hasText: /^v\d/ }).waitFor();
      return p;
    });
  },

  // página do YouTube falso já com o Vitro aplicado
  yt: async ({ context }, use) => {
    const page = context.pages()[0] || (await context.newPage());
    await use(async (path = "/") => {
      await page.goto("https://www.youtube.com" + path);
      await expect(page.locator("html")).toHaveClass(/vt-on/);
      return page;
    });
  },
});

export { expect };
