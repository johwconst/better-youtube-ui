// Configurações compartilhadas entre content script e popup.
globalThis.VITRO_DEFAULTS = {
  enabled: true,

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

globalThis.vitroLoad = async function () {
  const sync = await chrome.storage.sync.get("settings");
  return { ...globalThis.VITRO_DEFAULTS, ...(sync.settings || {}) };
};

globalThis.vitroSave = function (settings) {
  return chrome.storage.sync.set({ settings });
};
