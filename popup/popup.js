(async () => {
  document.getElementById("version").textContent = "v" + chrome.runtime.getManifest().version;
  let S = await globalThis.vitroLoad();
  const switches = document.querySelectorAll(".switch[data-key]");

  const render = () =>
    switches.forEach((b) => b.setAttribute("aria-checked", String(!!S[b.dataset.key])));
  render();

  switches.forEach((b) =>
    b.addEventListener("click", (e) => {
      e.preventDefault();
      S[b.dataset.key] = !S[b.dataset.key];
      render();
      globalThis.vitroSave(S);
    })
  );

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const edit = document.getElementById("edit");
  const onYouTube = !tab?.url || /^https:\/\/www\.youtube\.com\//.test(tab.url);
  if (!onYouTube) {
    edit.disabled = true;
    edit.textContent = "Abra o YouTube para personalizar";
  }
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
