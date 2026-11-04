import { test, expect } from "./fixtures.js";

const cssOf = (loc, prop) => loc.evaluate((el, p) => getComputedStyle(el)[p], prop);

test.describe("home", () => {
  test("aplica o tema e as camadas de fundo", async ({ yt }) => {
    const page = await yt("/");
    const html = page.locator("html");
    for (const cls of ["vt-on", "vt-home", "vt-cards", "vt-hero", "vt-sidebar-glass", "vt-no-shorts", "vt-no-ads"]) {
      await expect(html).toHaveClass(new RegExp(`\\b${cls}\\b`));
    }
    // papel de parede padrão (Brasa) vindo de dentro da extensão
    const bg = await cssOf(page.locator("#vt-wallpaper"), "backgroundImage");
    expect(bg).toMatch(/chrome-extension:\/\/[a-p]{32}\/assets\/wallpapers\/brasa\.jpg/);
    // e o arquivo carrega de verdade (web_accessible_resources)
    const ok = await page.evaluate(async (u) => (await fetch(u)).ok, bg.match(/url\("(.*)"\)/)[1]);
    expect(ok).toBe(true);
  });

  test("barra superior e menu lateral viram vidro", async ({ yt }) => {
    const page = await yt("/");
    const mast = page.locator("#masthead-container");
    expect(await cssOf(mast, "position")).toBe("fixed");
    expect(await cssOf(mast, "borderRadius")).toBe("999px");
    expect(await cssOf(mast, "backdropFilter")).toContain("blur(14px)");
    expect(await cssOf(page.locator("#guide #contentContainer"), "borderRadius")).toBe("32px");
  });

  test("botão do editor aparece logo no carregamento (sem esperar o intervalo de 3s)", async ({ yt }) => {
    const page = await yt("/");
    await expect(page.locator("#vt-edit-btn")).toBeVisible({ timeout: 1000 });
  });

  test("cartões ficam translúcidos e arredondados", async ({ yt }) => {
    const page = await yt("/");
    const card = page.locator(".ytLockupViewModelHost").first();
    expect(await cssOf(card, "borderRadius")).toBe("18px");
    expect(await cssOf(card, "backgroundColor")).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("esconde Shorts e anúncios, mantém vídeos normais", async ({ yt }) => {
    const page = await yt("/");
    await expect(page.locator(".vt-test-shorts-shelf")).toBeHidden();
    await expect(page.locator(".vt-test-short-item")).toBeHidden();
    await expect(page.locator(".vt-test-guide-shorts")).toBeHidden();
    await expect(page.locator(".vt-test-ad")).toBeHidden();
    await expect(page.locator(".vt-test-video")).toHaveCount(3);
    for (const v of await page.locator(".vt-test-video").all()) await expect(v).toBeVisible();
    await expect(page.locator(".vt-test-guide-home")).toBeVisible();
  });

  test("saudação fica no fluxo, antes dos chips, alinhada aos cartões", async ({ yt }) => {
    const page = await yt("/");
    const hero = page.locator("#vt-hero");
    await expect(hero).toBeVisible();
    await expect(hero.locator(".vt-hello")).toHaveText(/^Good (morning|afternoon|evening),$/);
    await expect(hero.locator(".vt-title span")).toHaveText("good to see you");
    await expect(hero.locator(".vt-section")).toHaveText("Recommended");

    // dentro da grade da home, logo antes do #header (chips)
    const placement = await hero.evaluate((el) => ({
      parent: el.parentElement.tagName.toLowerCase(),
      next: el.nextElementSibling?.id,
    }));
    expect(placement).toEqual({ parent: "ytd-rich-grid-renderer", next: "header" });

    // nada é sobreposto: chips e cartões começam depois da saudação
    const heroBox = await hero.boundingBox();
    expect(heroBox.height).toBeGreaterThanOrEqual(300);
    for (const sel of ["#header.ytd-rich-grid-renderer", "#contents.ytd-rich-grid-renderer"]) {
      const box = await page.locator(sel).boundingBox();
      expect(box.y).toBeGreaterThanOrEqual(heroBox.y + heroBox.height - 1);
    }
    // borda esquerda alinhada à do primeiro cartão
    const card = await page.locator(".ytLockupViewModelHost").first().boundingBox();
    expect(Math.abs(heroBox.x - card.x)).toBeLessThanOrEqual(1);
  });

  test("saudação continua alinhada ao mudar a largura da janela", async ({ yt }) => {
    const page = await yt("/");
    await page.setViewportSize({ width: 1000, height: 800 });
    await expect
      .poll(async () => {
        const h = await page.locator("#vt-hero").boundingBox();
        const c = await page.locator(".ytLockupViewModelHost").first().boundingBox();
        return Math.round(Math.abs(h.x - c.x));
      })
      .toBeLessThanOrEqual(1);
  });

  test("saudação espera a grade quando ela é montada depois", async ({ yt }) => {
    const page = await yt("/");
    // simula o YouTube recriando a grade (ex.: navegação SPA)
    await page.evaluate(() => {
      const grid = document.querySelector("ytd-rich-grid-renderer");
      const clone = grid.cloneNode(true);
      clone.querySelector("#vt-hero")?.remove();
      const parent = grid.parentElement;
      grid.remove();
      setTimeout(() => {
        parent.append(clone);
        document.dispatchEvent(new Event("yt-page-data-updated"));
      }, 200);
    });
    await expect(page.locator("ytd-rich-grid-renderer > #vt-hero")).toBeVisible();
  });
});

test.describe("tema escuro", () => {
  test("força o tema escuro quando o YouTube está no claro", async ({ yt }) => {
    const page = await yt("/?light=1");
    await expect(page.locator("html")).toHaveAttribute("dark", "");
    expect(await cssOf(page.locator("body"), "color")).toBe("rgb(241, 241, 241)");
    // o YouTube tentando voltar ao claro é revertido
    await page.evaluate(() => document.documentElement.removeAttribute("dark"));
    await expect(page.locator("html")).toHaveAttribute("dark", "");
  });

  test("desligar devolve o tema claro original", async ({ yt }) => {
    const page = await yt("/?light=1");
    await page.locator("#vt-edit-btn").click();
    await page.locator('#vt-editor .vt-tab[data-id="vidro"]').click();
    await page.locator("#vt-panel .vt-row", { hasText: "Force dark theme" }).locator(".vt-switch").click();
    await expect(page.locator("html")).not.toHaveAttribute("dark");
    expect(await cssOf(page.locator("body"), "color")).toBe("rgb(15, 15, 15)");
  });

  test("desligar não tira o escuro de quem já usa tema escuro", async ({ yt, popup }) => {
    const page = await yt("/");
    const p = await popup();
    await p.locator('.switch[data-key="forceDark"]').click();
    await page.waitForTimeout(300);
    await expect(page.locator("html")).toHaveAttribute("dark", "");
  });
});

test.describe("editor", () => {
  test("raio abre o editor, troca o wallpaper e a escolha persiste", async ({ yt }) => {
    let page = await yt("/");
    const btn = page.locator("#vt-edit-btn");
    await expect(btn).toHaveAttribute("aria-label", "Customize appearance");
    await btn.click();
    await expect(page.locator("html")).toHaveClass(/vt-editing/);
    await expect(page.locator("#vt-editor")).toBeVisible();

    await page.locator('#vt-editor .vt-tab[data-id="fundo"]').click();
    const panel = page.locator("#vt-panel");
    await expect(panel).toBeVisible();
    await expect(panel.locator("h3")).toHaveText("Background");
    await expect(panel.locator(".vt-wall")).toHaveCount(17);

    await panel.locator(".vt-wall", { hasText: "Ruby" }).click();
    await expect(panel.locator(".vt-wall", { hasText: "Ruby" })).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => cssOf(page.locator("#vt-wallpaper"), "backgroundImage")).toContain("rubi.jpg");

    // Esc fecha
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).not.toHaveClass(/vt-editing/);

    // recarregar mantém (chrome.storage.sync); espera o debounce do save
    await page.waitForTimeout(600);
    page = await yt("/");
    await expect.poll(() => cssOf(page.locator("#vt-wallpaper"), "backgroundImage")).toContain("rubi.jpg");
  });

  test("slider de transparência muda a variável do vidro ao vivo", async ({ yt }) => {
    const page = await yt("/");
    await page.locator("#vt-edit-btn").click();
    await page.locator('#vt-editor .vt-tab[data-id="vidro"]').click();
    const slider = page.locator("#vt-panel input[type=range]").nth(1);
    await slider.fill("80");
    await expect.poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue("--vt-glass-alpha"))).toBe("0.8");
  });

  test("interruptor do painel desliga a saudação", async ({ yt }) => {
    const page = await yt("/");
    await page.locator("#vt-edit-btn").click();
    await page.locator('#vt-editor .vt-tab[data-id="destaque"]').click();
    await page.locator("#vt-panel .vt-head .vt-switch").click();
    await expect(page.locator("#vt-hero")).toBeHidden();
    // sem a saudação, os chips voltam para o topo do feed
    const header = await page.locator("#header.ytd-rich-grid-renderer").boundingBox();
    expect(header.y).toBeLessThan(150);
  });
});

test.describe("popup", () => {
  test("mostra a versão do manifest e desliga tudo pelo interruptor principal", async ({ popup, yt }) => {
    const page = await yt("/");
    const p = await popup();
    const { version } = await p.evaluate(() => chrome.runtime.getManifest());
    await expect(p.locator("#version")).toHaveText("v" + version);
    await p.locator('.switch[data-key="enabled"]').click();
    await expect(page.locator("html")).not.toHaveClass(/vt-on/);
    await expect(page.locator("html")).not.toHaveClass(/vt-no-shorts/);
    await expect(page.locator(".vt-test-shorts-shelf")).toBeVisible();
  });

  test("trocar o idioma para português traduz a página e o editor na hora", async ({ popup, yt }) => {
    const page = await yt("/");
    const p = await popup();
    await expect(p.locator('[data-i18n="popup.cleanup"]')).toHaveText("Cleanup");
    await p.locator("#language").selectOption("pt");
    await expect(p.locator('[data-i18n="popup.cleanup"]')).toHaveText("Limpeza");

    await expect(page.locator("#vt-hero .vt-hello")).toHaveText(/^(Bom dia|Boa tarde|Boa noite),$/);
    await expect(page.locator("#vt-hero .vt-section")).toHaveText("Recomendados");
    await expect(page.locator("#vt-edit-btn")).toHaveAttribute("aria-label", "Personalizar aparência");
    await page.locator("#vt-edit-btn").click();
    await expect(page.locator("#vt-editor .vt-done")).toHaveText("Pronto");
    await expect(page.locator('#vt-editor .vt-tab[data-id="fundo"]')).toHaveText("Fundo");

    // e volta para inglês com o editor aberto
    await p.locator("#language").selectOption("en");
    await expect(page.locator("#vt-editor .vt-done")).toHaveText("Done");
    await expect(page.locator("html")).toHaveClass(/vt-editing/);
  });
});

test.describe("navegador em português", () => {
  test.use({ uiLang: "pt-BR" });

  test("modo automático usa português", async ({ yt }) => {
    const page = await yt("/");
    await expect(page.locator("#vt-hero .vt-section")).toHaveText("Recomendados");
    await expect(page.locator("#vt-hero .vt-title span")).toHaveText("que bom te ver");
  });
});

test.describe("vídeo", () => {
  test("/shorts/ID redireciona para /watch?v=ID", async ({ yt }) => {
    const page = await yt("/shorts/abcdefghijk");
    await expect(page).toHaveURL(/\/watch\?v=abcdefghijk$/);
    await expect(page.locator("html")).toHaveClass(/vt-watch/);
  });

  test("página de vídeo: sala de cinema, sem telas finais e sem merch", async ({ yt }) => {
    const page = await yt("/watch?v=abc123def45");
    await expect(page.locator("html")).toHaveClass(/vt-watch/);
    await expect(page.locator("html")).toHaveClass(/vt-room/);
    await expect(page.locator("#vt-room")).toBeAttached();
    await expect(page.locator(".vt-test-endscreen")).toBeHidden();
    await expect(page.locator(".vt-test-merch")).toBeHidden();
    await expect(page.locator("#related")).toBeVisible(); // recomendados ficam por padrão
    await expect(page.locator("#vt-hero")).toBeHidden();
  });

  test("esconder recomendados pelo editor", async ({ yt }) => {
    const page = await yt("/watch?v=abc123def45");
    await page.locator("#vt-edit-btn").click();
    await page.locator('#vt-editor .vt-tab[data-id="video"]').click();
    await page.locator("#vt-panel .vt-row", { hasText: "Hide recommendations" }).locator(".vt-switch").click();
    await expect(page.locator("#related")).toBeHidden();
  });

  test("clica em pular anúncio", async ({ yt }) => {
    const page = await yt("/watch?v=abc123def45&ad=1");
    await expect.poll(() => page.evaluate(() => window.__skipped || 0), { timeout: 3000 }).toBeGreaterThan(0);
  });
});
