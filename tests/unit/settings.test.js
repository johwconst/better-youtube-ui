import { test } from "node:test";
import assert from "node:assert/strict";
import { loadScripts, plain } from "./helpers.js";

const load = (stored) => loadScripts(["src/settings.js"], { stored });

test("vitroMerge sem nada salvo devolve os padrões", () => {
  const g = load();
  assert.deepEqual(plain(g.vitroMerge(undefined)), plain(g.VITRO_DEFAULTS));
  assert.deepEqual(plain(g.vitroMerge(null)), plain(g.VITRO_DEFAULTS));
  assert.deepEqual(plain(g.vitroMerge("lixo")), plain(g.VITRO_DEFAULTS));
});

test("vitroMerge mantém valores válidos", () => {
  const g = load();
  const s = g.vitroMerge({ wallpaper: "rubi", bgDim: 10, snow: true, language: "pt" });
  assert.equal(s.wallpaper, "rubi");
  assert.equal(s.bgDim, 10);
  assert.equal(s.snow, true);
  assert.equal(s.language, "pt");
});

test("vitroMerge descarta chaves desconhecidas e tipos errados", () => {
  const g = load();
  const s = g.vitroMerge({ chaveVelha: 1, bgDim: "50", snow: "sim", glassBlur: NaN, feedWidth: Infinity });
  assert.equal("chaveVelha" in s, false);
  assert.equal(s.bgDim, g.VITRO_DEFAULTS.bgDim);
  assert.equal(s.snow, g.VITRO_DEFAULTS.snow);
  assert.equal(s.glassBlur, g.VITRO_DEFAULTS.glassBlur);
  assert.equal(s.feedWidth, g.VITRO_DEFAULTS.feedWidth);
});

test("vitroMerge não altera VITRO_DEFAULTS", () => {
  const g = load();
  const before = plain(g.VITRO_DEFAULTS);
  const s = g.vitroMerge({ bgDim: 1 });
  s.wallpaper = "x";
  assert.deepEqual(plain(g.VITRO_DEFAULTS), before);
});

test("vitroLoad lê do chrome.storage.sync e vitroSave grava", async () => {
  const g = load({ bgDim: 77 });
  const s = await g.vitroLoad();
  assert.equal(s.bgDim, 77);
  s.bgDim = 12;
  await g.vitroSave(s);
  assert.equal(g.chrome.store.settings.bgDim, 12);
});

test("padrões têm valores dentro das faixas dos controles do editor", () => {
  const D = load().VITRO_DEFAULTS;
  const ranges = { uiScale: [85, 120], bgDim: [0, 90], bgBlur: [0, 40], cardText: [80, 130], feedWidth: [60, 100], lightDark: [0, 70], glassBlur: [0, 40], glassAlpha: [10, 90] };
  for (const [k, [min, max]] of Object.entries(ranges)) {
    assert.ok(D[k] >= min && D[k] <= max, `${k}=${D[k]} fora de [${min}, ${max}]`);
  }
  assert.ok(["auto", "en", "pt"].includes(D.language));
  assert.ok(["fixed", "schedule", "daily", "tab"].includes(D.wallMode));
  assert.ok(["youtube", "system", "inter", "manrope", "outfit"].includes(D.font));
  assert.deepEqual(plain(D.guideHide), []);
  assert.ok(["glass", "frost", "solid"].includes(D.glassStyle));
  assert.ok(["below", "over"].includes(D.cardTitle));
  assert.ok(["default", "air", "dense"].includes(D.cardLayout));
  assert.match(D.accent, /^#[0-9a-f]{6}$/i);
  assert.match(D.lightColor, /^#[0-9a-f]{6}$/i);
});

test("vitroMerge: listas aceitam só strings, sem repetição, e não compartilham referência", () => {
  const g = load();
  const s = g.vitroMerge({ guideHide: ["history", 3, "history", null, "footer"] });
  assert.deepEqual(plain(s.guideHide), ["history", "footer"]);
  assert.deepEqual(plain(g.vitroMerge({ guideHide: "history" }).guideHide), []);
  const a = g.vitroMerge({});
  a.guideHide.push("x");
  assert.deepEqual(plain(g.VITRO_DEFAULTS.guideHide), []);
});
