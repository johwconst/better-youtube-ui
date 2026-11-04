(async () => {
  const t = (k) => globalThis.vitroT(k);
  let S = await globalThis.vitroLoad();

  const switches = document.querySelectorAll(".switch[data-key]");
  const langSelect = document.getElementById("language");
  const edit = document.getElementById("edit");

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const onYouTube = !tab?.url || /^https:\/\/www\.youtube\.com\//.test(tab.url);

  function translate() {
    document.documentElement.lang = globalThis.vitroSetLang(S.language) === "pt" ? "pt-BR" : "en";
    document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    if (!onYouTube) edit.textContent = t("popup.openYouTube");
  }

  function render() {
    switches.forEach((b) => b.setAttribute("aria-checked", String(!!S[b.dataset.key])));
    langSelect.value = S.language;
    translate();
  }

  document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;
  edit.disabled = !onYouTube;
  render();

  switches.forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      S[b.dataset.key] = !S[b.dataset.key];
      render();
      globalThis.vitroSave(S);
    })
  );

  langSelect.addEventListener("change", () => {
    S.language = langSelect.value;
    render();
    globalThis.vitroSave(S);
  });

  edit.addEventListener("click", async () => {
    await chrome.tabs.sendMessage(tab.id, { type: "vt-open-editor" }).catch(() => {});
    window.close();
  });

  document.getElementById("reset").addEventListener("click", async () => {
    S = { ...globalThis.VITRO_DEFAULTS };
    await globalThis.vitroSave(S);
    render();
  });
})();
