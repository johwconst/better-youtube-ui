// Configurações compartilhadas entre content script e popup.
globalThis.VITRO_DEFAULTS = {
  enabled: true,
  language: "auto", // auto | en | pt

  // Limpeza
  hideShorts: true,
  blockAds: true,
  hideRelated: false,
  hideEndscreens: true,
  hideMerch: true,

  // Fundo
  wallpaper: "brasa", // id de VITRO_WALLPAPERS ou "custom"
  bgDim: 45, // %
  bgBlur: 0, // px

  // Destaque (hero da home)
  hero: true,
  snow: false,
  accent: "#ff7373",

  // Saudação
  greet: true,
  name: "",

  // Menu lateral
  sidebarGlass: true,

  // Cartões
  cards: true,
  cardTitle: "below", // below | over
  cardText: 100, // %
  cardLayout: "default", // default | air | dense
  feedWidth: 100, // %
  cardBorders: true,

  // Luz
  light: true,
  lightColor: "#ffb366",
  lightDark: 20, // %

  // Vidro
  glassStyle: "glass", // glass | frost | solid
  glassBlur: 14, // px
  glassAlpha: 48, // %

  // Página de vídeo
  room: true,
};

// Junta o que está salvo com os padrões, descartando chaves desconhecidas
// (de versões antigas) e valores com tipo errado (storage corrompido).
globalThis.vitroMerge = function (saved) {
  const D = globalThis.VITRO_DEFAULTS;
  const out = { ...D };
  if (saved && typeof saved === "object") {
    for (const k of Object.keys(D)) {
      const v = saved[k];
      if (typeof v === typeof D[k] && (typeof v !== "number" || Number.isFinite(v))) out[k] = v;
    }
  }
  return out;
};

globalThis.vitroLoad = async function () {
  const sync = await chrome.storage.sync.get("settings");
  return globalThis.vitroMerge(sync.settings);
};

globalThis.vitroSave = function (settings) {
  return chrome.storage.sync.set({ settings });
};
