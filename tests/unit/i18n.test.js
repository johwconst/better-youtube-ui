import { test } from "node:test";
import assert from "node:assert/strict";
import { loadScripts, read } from "./helpers.js";

const load = (uiLanguage) => loadScripts(["src/i18n.js"], { uiLanguage });

test("inglês e português têm exatamente as mesmas chaves", () => {
  const { en, pt } = load().VITRO_I18N;
  assert.deepEqual(Object.keys(pt).sort(), Object.keys(en).sort());
});

test("nenhuma tradução vazia", () => {
  const { en, pt } = load().VITRO_I18N;
  for (const [lang, dict] of Object.entries({ en, pt })) {
    for (const [k, v] of Object.entries(dict)) assert.ok(typeof v === "string" && v.trim(), `${lang}.${k} vazio`);
  }
});

test("idioma automático segue o navegador", () => {
  for (const [ui, expected] of [["pt-BR", "pt"], ["pt-PT", "pt"], ["pt", "pt"], ["en-US", "en"], ["es", "en"], ["ja", "en"]]) {
    assert.equal(load(ui).vitroLang("auto"), expected, ui);
  }
});

test("escolha manual vence o navegador", () => {
  const g = load("pt-BR");
  assert.equal(g.vitroLang("en"), "en");
  assert.equal(g.vitroLang("pt"), "pt");
  assert.equal(g.vitroLang("xx"), "pt"); // valor inválido → automático
});

test("vitroT troca de idioma e cai para inglês/chave", () => {
  const g = load("en-US");
  g.vitroSetLang("pt");
  assert.equal(g.vitroT("greet.morning"), "Bom dia,");
  assert.equal(g.vitroLocale(), "pt-BR");
  g.vitroSetLang("en");
  assert.equal(g.vitroT("greet.morning"), "Good morning,");
  assert.equal(g.vitroLocale(), "en-US");
  assert.equal(g.vitroT("chave.inexistente"), "chave.inexistente");
});

test("toda chave usada no código existe no dicionário", () => {
  const { en } = load().VITRO_I18N;
  const content = read("src/content.js");
  const popup = read("popup/popup.html");
  const used = new Set([
    ...[...content.matchAll(/\bt\("([a-z][\w.-]*\.[\w.-]+)"\)/g)].map((m) => m[1]),
    ...[...popup.matchAll(/data-i18n(?:-aria)?="([\w.-]+)"/g)].map((m) => m[1]),
  ]);
  // títulos dos painéis vêm de t("panel." + id)
  const panels = [...content.matchAll(/^ {6}(\w+): \{/gm)].map((m) => m[1]);
  panels.forEach((id) => used.add("panel." + id));
  assert.ok(panels.length >= 5, "não achou os painéis do editor");
  const missing = [...used].filter((k) => !(k in en));
  assert.deepEqual(missing, []);
});

test("content.js não tem textos visíveis fixos com acento (devem vir do i18n)", () => {
  const lines = read("src/content.js")
    .split("\n")
    .filter((l) => !/^\s*\/\//.test(l)) // ignora comentários de linha
    .filter((l) => /"[^"]*[À-ÿ][^"]*"/.test(l));
  assert.deepEqual(lines, []);
});
