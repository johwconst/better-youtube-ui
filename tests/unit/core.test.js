import { test } from "node:test";
import assert from "node:assert/strict";
import { loadScripts, plain } from "./helpers.js";

const g = loadScripts(["src/settings.js", "src/core.js"]);
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

test("pageOf identifica home, vídeo e o resto", () => {
  assert.equal(C.pageOf("/"), "home");
  assert.equal(C.pageOf("/feed/home"), "home");
  assert.equal(C.pageOf("/watch"), "watch");
  assert.equal(C.pageOf("/results"), "other");
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
