// Integridade do pacote: manifest, arquivos, locales, wallpapers, CSS e changelog.
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, read, readJSON, loadScripts } from "./helpers.js";

const manifest = readJSON("manifest.json");
const exists = (p) => existsSync(join(ROOT, p));

test("manifest: MV3, versão SemVer e locale padrão", () => {
  assert.equal(manifest.manifest_version, 3);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.default_locale, "en");
});

test("manifest: todos os arquivos referenciados existem", () => {
  const cs = manifest.content_scripts[0];
  const files = [
    ...cs.js,
    ...cs.css,
    manifest.action.default_popup,
    ...Object.values(manifest.icons),
    ...Object.values(manifest.action.default_icon),
  ];
  for (const f of files) assert.ok(exists(f), `faltando: ${f}`);
});

test("manifest: ordem dos scripts respeita as dependências", () => {
  const js = manifest.content_scripts[0].js;
  const at = (f) => js.indexOf(f);
  assert.ok(at("src/settings.js") < at("src/content.js"));
  assert.ok(at("src/core.js") < at("src/content.js"));
  assert.ok(at("src/i18n.js") < at("src/content.js"));
  assert.ok(at("src/wallpapers.js") < at("src/content.js"));
  assert.equal(js.at(-1), "src/content.js");
});

test("manifest: mensagens __MSG_ existem em todos os locales", () => {
  const keys = [...JSON.stringify(manifest).matchAll(/__MSG_(\w+)__/g)].map((m) => m[1]);
  assert.ok(keys.length > 0);
  for (const loc of ["en", "pt_BR"]) {
    const msgs = readJSON(`_locales/${loc}/messages.json`);
    for (const k of keys) assert.ok(msgs[k]?.message, `${loc} sem ${k}`);
  }
});

test("popup carrega settings e i18n antes do popup.js", () => {
  const html = read("popup/popup.html");
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  assert.deepEqual(scripts, ["../src/settings.js", "../src/i18n.js", "popup.js"]);
});

test("wallpapers: ids únicos, arquivos presentes e nomes traduzidos", () => {
  const g = loadScripts(["src/settings.js", "src/i18n.js", "src/wallpapers.js"]);
  const walls = g.VITRO_WALLPAPERS;
  const ids = walls.map((w) => w.id);
  assert.equal(new Set(ids).size, ids.length, "ids repetidos");
  assert.ok(ids.includes(g.VITRO_DEFAULTS.wallpaper), "wallpaper padrão não existe");
  const { en, pt } = g.VITRO_I18N;
  for (const w of walls) {
    assert.ok(en["wall." + w.id] && pt["wall." + w.id], `sem tradução: ${w.id}`);
    if (w.thumb) {
      assert.ok(exists(`assets/wallpapers/${w.id}.jpg`), `sem imagem: ${w.id}`);
      assert.ok(exists(`assets/thumbs/${w.id}.jpg`), `sem miniatura: ${w.id}`);
      assert.match(w.css, /chrome-extension:\/\/test\/assets\/wallpapers\//);
    } else {
      const svg = decodeURIComponent(/charset=utf-8,(.*)"\)$/.exec(w.css)[1]);
      assert.match(svg, /^<svg [^>]*viewBox="0 0 1600 900"/);
      assert.match(svg, /<\/svg>$/);
    }
  }
});

test("wallpapers: assets estão liberados em web_accessible_resources", () => {
  const res = manifest.web_accessible_resources.flatMap((r) => r.resources);
  assert.ok(res.includes("assets/wallpapers/*"));
  assert.ok(res.includes("assets/thumbs/*"));
});

test("CSS: toda classe e variável escrita pelo core é usada no vitro.css", () => {
  const g = loadScripts(["src/settings.js", "src/core.js"]);
  const css = read("src/vitro.css");
  for (const cls of Object.keys(g.VitroCore.htmlClasses(g.VITRO_DEFAULTS))) {
    if (cls.startsWith("vt-gh-")) continue; // regras geradas no content.js (teste abaixo)
    assert.ok(css.includes("." + cls), `classe sem CSS: ${cls}`);
  }
  for (const v of Object.keys(g.VitroCore.cssVars(g.VITRO_DEFAULTS))) {
    assert.ok(css.includes(`var(${v}`), `variável sem uso: ${v}`);
  }
});

test("CSS: variáveis --vt-* não são redefinidas no ytd-app (bug da v1.1.0)", () => {
  const css = read("src/vitro.css");
  // blocos cujo seletor menciona ytd-app e que declaram --vt-*
  const blocks = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  const bad = blocks.filter(([, sel, body]) => /(^|[\s,])html\.vt-on ytd-app\s*(,|$)/m.test(sel) && /--vt-[\w-]+\s*:/.test(body));
  assert.deepEqual(bad.map((b) => b[1].trim()), []);
});

test("CHANGELOG: tem seção Não lançado e a versão do manifest", () => {
  const log = read("CHANGELOG.md");
  assert.match(log, /^## \[Não lançado\]$/m);
  assert.match(log, new RegExp(`^## \\[${manifest.version.replace(/\./g, "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}$`, "m"));
});

test("menu lateral: todo item escondível tem classe no core, regra gerada e tradução", () => {
  const g = loadScripts(["src/settings.js", "src/core.js", "src/i18n.js"]);
  const ids = g.VITRO_GUIDE_ITEMS.map(([id]) => id);
  assert.equal(new Set(ids).size, ids.length);
  const cls = g.VitroCore.htmlClasses({ ...g.VITRO_DEFAULTS, guideHide: ids });
  for (const [id, sel] of g.VITRO_GUIDE_ITEMS) {
    assert.equal(cls["vt-gh-" + id], true, id);
    assert.ok(sel.trim(), id);
    assert.ok(g.VITRO_I18N.en["guide." + id] && g.VITRO_I18N.pt["guide." + id], `sem tradução: ${id}`);
  }
  assert.match(read("src/content.js"), /VITRO_GUIDE_ITEMS\.map\(\(\[id, sel\]\) => `html\.vt-gh-\$\{id\} \$\{sel\}/);
});

test("fontes: arquivos, licenças, @font-face e web_accessible_resources", () => {
  const css = read("src/vitro.css");
  const res = manifest.web_accessible_resources.flatMap((r) => r.resources);
  assert.ok(res.includes("assets/fonts/*.woff2"));
  for (const f of ["inter", "manrope", "outfit"]) {
    assert.ok(exists(`assets/fonts/${f}.woff2`), f);
    assert.ok(exists(`assets/fonts/LICENSE-${f}.txt`), `licença ${f}`);
    assert.ok(css.includes(`chrome-extension://__MSG_@@extension_id__/assets/fonts/${f}.woff2`), `@font-face ${f}`);
    assert.ok(css.includes(`html.vt-font-${f}`), `classe ${f}`);
  }
});
