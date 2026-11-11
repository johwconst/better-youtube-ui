import { test } from "node:test";
import assert from "node:assert/strict";
import { loadScripts, plain } from "./helpers.js";

const g = loadScripts(["src/settings.js", "src/core.js"]);
const at = (h, day = 10) => new Date(2026, 0, day, h, 30);
const C = g.VitroCore;
const D = g.VITRO_DEFAULTS;

test("shortsTarget converte /shorts/ID em /watch?v=ID", () => {
  assert.equal(C.shortsTarget("/shorts/abcDEF_123-x"), "/watch?v=abcDEF_123-x");
  assert.equal(C.shortsTarget("/shorts/abcDEF_123-x/extra"), "/watch?v=abcDEF_123-x");
});

test("shortsTarget ignora o que não é Shorts", () => {
  for (const p of ["/", "/watch", "/shorts", "/shorts/", "/shorts/abc", "/@canal/shorts", "", undefined]) {
    assert.equal(C.shortsTarget(p), null, String(p));
  }
});

test("pageOf identifica home, vídeo, busca e o resto", () => {
  assert.equal(C.pageOf("/"), "home");
  assert.equal(C.pageOf("/feed/home"), "home");
  assert.equal(C.pageOf("/watch"), "watch");
  assert.equal(C.pageOf("/results"), "results");
  assert.equal(C.pageOf("/feed/subscriptions"), "other");
});

test("greetingKey cobre as 24 horas com a chave certa", () => {
  const expected = (h) => (h < 5 ? "greet.night" : h < 12 ? "greet.morning" : h < 18 ? "greet.afternoon" : "greet.evening");
  for (let h = 0; h < 24; h++) assert.equal(C.greetingKey(h), expected(h), `hora ${h}`);
});

test("heroHeight fica entre 300 e 460px", () => {
  assert.equal(C.heroHeight(400), 300);
  assert.equal(C.heroHeight(900), 396);
  assert.equal(C.heroHeight(4000), 460);
});

test("glassParams para cada estilo", () => {
  const base = { glassAlpha: 48, glassBlur: 14 };
  assert.deepEqual(plain(C.glassParams({ ...base, glassStyle: "glass" })), { alpha: 0.48, blur: 14 });
  assert.deepEqual(plain(C.glassParams({ ...base, glassStyle: "frost" })), { alpha: 0.73, blur: 25 });
  assert.deepEqual(plain(C.glassParams({ ...base, glassStyle: "solid" })), { alpha: 0.96, blur: 0 });
  assert.deepEqual(plain(C.glassParams({ ...base, glassStyle: "???" })), { alpha: 0.48, blur: 14 });
  // fosco nunca passa de 85% de opacidade
  assert.equal(C.glassParams({ glassStyle: "frost", glassAlpha: 90, glassBlur: 10 }).alpha, 0.85);
});

test("htmlClasses: com a extensão desligada nada visual fica ativo", () => {
  const cls = C.htmlClasses({ ...D, enabled: false });
  for (const k of ["vt-on", "vt-no-shorts", "vt-no-ads", "vt-cards", "vt-hero", "vt-light", "vt-room", "vt-sidebar-glass"]) {
    assert.equal(!!cls[k], false, k);
  }
});

test("htmlClasses: padrões ligam o tema e a limpeza", () => {
  const cls = C.htmlClasses(D);
  for (const k of ["vt-on", "vt-no-shorts", "vt-no-ads", "vt-cards", "vt-hero", "vt-sidebar-glass", "vt-light", "vt-room"]) {
    assert.equal(!!cls[k], true, k);
  }
  assert.equal(!!cls["vt-no-related"], false);
  assert.equal(!!cls["vt-snow-on"], false);
});

test("htmlClasses: esconder vídeos só para membros é opcional e respeita o liga/desliga", () => {
  assert.equal(D.hideMembers, false);
  assert.equal(!!C.htmlClasses(D)["vt-no-members"], false);
  assert.equal(C.htmlClasses({ ...D, hideMembers: true })["vt-no-members"], true);
  assert.equal(!!C.htmlClasses({ ...D, hideMembers: true, enabled: false })["vt-no-members"], false);
});

test("htmlClasses: esconder filmes à venda é opcional e respeita o liga/desliga", () => {
  assert.equal(D.hidePaid, false);
  assert.equal(!!C.htmlClasses(D)["vt-no-paid"], false);
  assert.equal(C.htmlClasses({ ...D, hidePaid: true })["vt-no-paid"], true);
  assert.equal(!!C.htmlClasses({ ...D, hidePaid: true, enabled: false })["vt-no-paid"], false);
});

test("htmlClasses: esconder a Sala de Jogos é opcional e respeita o liga/desliga", () => {
  assert.equal(D.hideGames, false);
  assert.equal(!!C.htmlClasses(D)["vt-no-games"], false);
  assert.equal(C.htmlClasses({ ...D, hideGames: true })["vt-no-games"], true);
  assert.equal(!!C.htmlClasses({ ...D, hideGames: true, enabled: false })["vt-no-games"], false);
});

test("htmlClasses: neve depende do destaque", () => {
  assert.equal(!!C.htmlClasses({ ...D, snow: true, hero: false })["vt-snow-on"], false);
  assert.equal(!!C.htmlClasses({ ...D, snow: true, hero: true })["vt-snow-on"], true);
});

test("htmlClasses: disposição dos cartões é exclusiva", () => {
  const air = C.htmlClasses({ ...D, cardLayout: "air" });
  assert.equal(air["vt-layout-air"], true);
  assert.equal(air["vt-layout-dense"], false);
  const def = C.htmlClasses({ ...D, cardLayout: "default" });
  assert.equal(def["vt-layout-air"] || def["vt-layout-dense"], false);
});

test("cssVars converte porcentagens e pixels", () => {
  const v = C.cssVars({ ...D, bgDim: 45, bgBlur: 12, cardText: 110, lightDark: 20, glassStyle: "glass", glassAlpha: 50, glassBlur: 10 });
  assert.equal(v["--vt-bg-dim"], "0.45");
  assert.equal(v["--vt-bg-blur"], "12px");
  assert.equal(v["--vt-card-text"], "1.1");
  assert.equal(v["--vt-light-dark"], "0.2");
  assert.equal(v["--vt-glass-alpha"], "0.5");
  assert.equal(v["--vt-blur"], "10px");
  assert.equal(v["--vt-accent"], D.accent);
});

test("wallpaperCss escolhe imagem própria, id ou padrão", () => {
  const walls = [{ id: "a", css: "A" }, { id: "b", css: "B" }];
  assert.equal(C.wallpaperCss(walls, "b", null, "a"), "B");
  assert.equal(C.wallpaperCss(walls, "sumiu", null, "a"), "A");
  assert.equal(C.wallpaperCss(walls, "custom", "data:x", "a"), 'url("data:x")');
  // "custom" sem imagem salva cai no padrão
  assert.equal(C.wallpaperCss(walls, "custom", null, "b"), "B");
  // padrão inexistente cai no primeiro
  assert.equal(C.wallpaperCss(walls, "x", null, "y"), "A");
});

test("wantsDark: força com Vitro ligado e forceDark, senão respeita o original", () => {
  assert.equal(C.wantsDark({ ...D, enabled: true, forceDark: true }, false), true);
  assert.equal(C.wantsDark({ ...D, enabled: true, forceDark: false }, false), false);
  assert.equal(C.wantsDark({ ...D, enabled: false, forceDark: true }, false), false);
  // quem já usa tema escuro continua no escuro mesmo desligando
  assert.equal(C.wantsDark({ ...D, enabled: false, forceDark: false }, true), true);
  assert.equal(C.wantsDark({ ...D, enabled: true, forceDark: false }, true), true);
});

test("activeWallpaperId: modo fixo usa o escolhido", () => {
  assert.equal(C.activeWallpaperId({ ...D, wallMode: "fixed", wallpaper: "rubi" }, ["rubi", "anil"], at(23), 0.5), "rubi");
});

test("activeWallpaperId: dia e noite troca às 18h e às 6h", () => {
  const S = { ...D, wallMode: "schedule", wallpaper: "amanhecer", wallpaperNight: "noite" };
  const ids = ["amanhecer", "noite"];
  assert.equal(C.activeWallpaperId(S, ids, at(5), 0), "noite");
  assert.equal(C.activeWallpaperId(S, ids, new Date(2026, 0, 10, 6, 0), 0), "amanhecer");
  assert.equal(C.activeWallpaperId(S, ids, at(17), 0), "amanhecer");
  assert.equal(C.activeWallpaperId(S, ids, new Date(2026, 0, 10, 18, 0), 0), "noite");
});

test("activeWallpaperId: um por dia muda à meia-noite e percorre todos", () => {
  const S = { ...D, wallMode: "daily" };
  const ids = ["a", "b", "c", "custom"];
  const seen = new Set();
  for (let d = 1; d <= 6; d++) {
    // mesmo dia, horas diferentes → mesmo papel de parede
    assert.equal(C.activeWallpaperId(S, ids, at(1, d), 0), C.activeWallpaperId(S, ids, at(23, d), 0));
    seen.add(C.activeWallpaperId(S, ids, at(12, d), 0));
  }
  assert.deepEqual([...seen].sort(), ["a", "b", "c"]); // nunca "custom"
  assert.notEqual(C.activeWallpaperId(S, ids, at(12, 1), 0), C.activeWallpaperId(S, ids, at(12, 2), 0));
});

test("activeWallpaperId: um por aba usa a semente da aba", () => {
  const S = { ...D, wallMode: "tab" };
  const ids = ["a", "b", "c"];
  assert.equal(C.activeWallpaperId(S, ids, at(12), 0), "a");
  assert.equal(C.activeWallpaperId(S, ids, at(12), 0.5), "b");
  assert.equal(C.activeWallpaperId(S, ids, at(12), 0.9999), "c");
});

test("fontes: classe só para fontes reais e com a extensão ligada", () => {
  const yt = C.htmlClasses({ ...D, font: "youtube" });
  assert.equal(yt["vt-has-font"], false);
  const inter = C.htmlClasses({ ...D, font: "inter" });
  assert.equal(inter["vt-has-font"], true);
  assert.equal(inter["vt-font-inter"], true);
  assert.equal(inter["vt-font-manrope"], false);
  assert.equal(C.htmlClasses({ ...D, font: "inter", enabled: false })["vt-has-font"], false);
});

test("escala da página vira variável CSS", () => {
  assert.equal(C.cssVars({ ...D, uiScale: 110 })["--vt-ui-scale"], "1.1");
});

test("isShortsChip reconhece só o rótulo exato do filtro", () => {
  assert.equal(C.isShortsChip(" Shorts\n"), true);
  assert.equal(C.isShortsChip("shorts"), true);
  assert.equal(C.isShortsChip("Shorts engraçados"), false);
  assert.equal(C.isShortsChip("Vídeos"), false);
  assert.equal(C.isShortsChip(""), false);
});

test("htmlClasses: alinhamento da saudação é exclusivo e esquerda é o padrão", () => {
  assert.equal(D.greetAlign, "left");
  const def = C.htmlClasses(D);
  assert.equal(def["vt-greet-center"] || def["vt-greet-right"], false);
  const c = C.htmlClasses({ ...D, greetAlign: "center" });
  assert.equal(c["vt-greet-center"], true);
  assert.equal(c["vt-greet-right"], false);
  assert.equal(C.htmlClasses({ ...D, greetAlign: "right" })["vt-greet-right"], true);
});
