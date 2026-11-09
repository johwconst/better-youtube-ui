// Configurações compartilhadas entre content script e popup.
globalThis.VITRO_DEFAULTS = {
  enabled: true,
  language: "auto", // auto | en | pt
  forceDark: true, // tema escuro do YouTube mesmo se a conta estiver no claro

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
  wallMode: "fixed", // fixed | schedule (dia e noite) | daily (um por dia) | tab (um por aba)
  wallpaperNight: "noite", // usado no modo "schedule", das 18h às 6h
  wallPreview: true, // prévia ao passar o mouse nas miniaturas

  // Destaque (hero da home)
  hero: true,
  snow: false,
  accent: "#ff7373",

  // Saudação
  greet: true,
  name: "",
  greetAlign: "left", // left | center | right

  // Menu lateral
  sidebarGlass: true,
  guideHide: [], // ids de VITRO_GUIDE_ITEMS escondidos do menu lateral

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

  // Interface
  font: "youtube", // youtube | system | inter | manrope | outfit
  uiScale: 100, // % (zoom da página)
  sounds: false, // sons sutis no editor

  // Página de vídeo
  room: true,
};

// Junta o que está salvo com os padrões, descartando chaves desconhecidas
// (de versões antigas) e valores com tipo errado (storage corrompido).
globalThis.vitroMerge = function (saved) {
  const D = globalThis.VITRO_DEFAULTS;
  const out = { ...D, guideHide: [...D.guideHide] };
  if (saved && typeof saved === "object") {
    for (const k of Object.keys(D)) {
      const v = saved[k];
      if (Array.isArray(D[k])) {
        if (Array.isArray(v)) out[k] = [...new Set(v.filter((x) => typeof x === "string"))];
      } else if (typeof v === typeof D[k] && (typeof v !== "number" || Number.isFinite(v))) out[k] = v;
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

// Itens do menu lateral que podem ser escondidos (id → seletor do YouTube)
globalThis.VITRO_GUIDE_ITEMS = [
  ["subscriptions", 'ytd-guide-section-renderer:has(a[href="/feed/subscriptions"])'],
  ["history", 'ytd-guide-entry-renderer:has(a[href="/feed/history"])'],
  ["playlists", 'ytd-guide-entry-renderer:has(a[href="/feed/playlists"])'],
  ["watchLater", 'ytd-guide-entry-renderer:has(a[href="/playlist?list=WL"])'],
  ["liked", 'ytd-guide-entry-renderer:has(a[href="/playlist?list=LL"])'],
  ["yourVideos", 'ytd-guide-entry-renderer:has(a[href^="https://studio.youtube.com"])'],
  ["downloads", 'ytd-guide-entry-renderer:has(a[href="/feed/downloads"])'],
  ["more", 'ytd-guide-section-renderer:has(a[href="/premium"])'],
  ["explore", 'ytd-guide-section-renderer:has(a[href^="/feed/storefront"])'],
  ["settings", 'ytd-guide-section-renderer:has(a[href="/reporthistory"])'],
  ["footer", "tp-yt-app-drawer#guide #footer"],
];
