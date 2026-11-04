// Dicionário do Vitro (EN / PT-BR).
// Usamos um dicionário próprio em vez de chrome.i18n porque este não permite
// trocar o idioma manualmente. _locales/ só traduz o nome/descrição da extensão.
(() => {
  const en = {
    "greet.night": "Good evening,",
    "greet.morning": "Good morning,",
    "greet.afternoon": "Good afternoon,",
    "greet.evening": "Good evening,",
    "hero.fallbackName": "good to see you",
    "hero.section": "Recommended",

    "button.title": "Customize (Vitro)",
    "button.aria": "Customize appearance",

    "editor.aria": "Vitro editor",
    "editor.hint": "Click what you want to change",
    "editor.done": "Done",
    "editor.enable": "Enable",
    "editor.close": "Close",

    "panel.fundo": "Background",
    "panel.destaque": "Highlight",
    "panel.saudacao": "Greeting",
    "panel.menu": "Sidebar",
    "panel.cartoes": "Cards",
    "panel.luz": "Light",
    "panel.vidro": "Glass",
    "panel.video": "Video page",
    "panel.limpeza": "Cleanup",

    "wall.custom": "Your image",
    "wall.upload": "Your own image…",
    "wall.remove": "Remove",
    "opt.dim": "Dim",
    "opt.blur": "Blur",
    "opt.accent": "Accent color",
    "opt.snow": "Snow",
    "opt.name": "Name",
    "opt.namePlaceholder": "What should I call you?",
    "hint.name": "Leave empty to show “good to see you”.",
    "hint.sidebar": "Floating glass panel for the sidebar and the mini sidebar.",
    "opt.cardTitle": "Title",
    "opt.cardTitle.below": "Below image",
    "opt.cardTitle.over": "Over image",
    "opt.cardText": "Text size",
    "opt.cardLayout": "Layout",
    "opt.cardLayout.default": "Default",
    "opt.cardLayout.air": "Airy",
    "opt.cardLayout.dense": "Dense",
    "opt.feedWidth": "Feed width",
    "opt.borders": "Borders",
    "opt.color": "Color",
    "opt.lightDark": "Surrounding darkness",
    "opt.glassStyle": "Bars and panels",
    "opt.glassStyle.glass": "Glass",
    "opt.glassStyle.frost": "Frosted",
    "opt.glassStyle.solid": "Solid",
    "opt.transparency": "Transparency",
    "opt.forceDark": "Force dark theme",
    "hint.forceDark": "YouTube's light theme makes text hard to read over the wallpaper.",
    "hint.room": "The background becomes the video itself, blurred — like a movie theater.",
    "opt.hideRelated": "Hide recommendations",
    "opt.hideShorts": "Hide Shorts",
    "opt.blockAds": "Block ads",
    "opt.hideEndscreens": "Hide end screens",
    "opt.hideMerch": "Hide products/merch",

    "popup.tagline": "YouTube in glass",
    "popup.toggle": "Enable Vitro",
    "popup.edit": "Customize appearance…",
    "popup.openYouTube": "Open YouTube to customize",
    "popup.cleanup": "Cleanup",
    "popup.appearance": "Appearance",
    "popup.hideRelated": "Hide recommendations on videos",
    "popup.hero": "Greeting on home",
    "popup.cards": "Glass cards",
    "popup.light": "Cursor light",
    "popup.room": "Movie theater on videos",
    "popup.language": "Language",
    "popup.lang.auto": "Automatic (browser)",
    "popup.reset": "Restore defaults",

    "wall.brasa": "Ember",
    "wall.rubi": "Ruby",
    "wall.lampejo": "Flash",
    "wall.anil": "Indigo",
    "wall.neon-azul": "Blue neon",
    "wall.oceano": "Ocean",
    "wall.prisma": "Prism",
    "wall.fluxo": "Flow",
    "wall.amanhecer": "Dawn",
    "wall.lua-nascente": "Moonrise",
    "wall.eclipse": "Eclipse",
    "wall.cor": "Color",
    "wall.ondas": "Waves",
    "wall.crepusculo": "Dusk",
    "wall.noite": "Night",
    "wall.inverno": "Winter",
    "wall.aurora": "Aurora",
  };

  const pt = {
    "greet.night": "Boa noite,",
    "greet.morning": "Bom dia,",
    "greet.afternoon": "Boa tarde,",
    "greet.evening": "Boa noite,",
    "hero.fallbackName": "que bom te ver",
    "hero.section": "Recomendados",

    "button.title": "Personalizar (Vitro)",
    "button.aria": "Personalizar aparência",

    "editor.aria": "Editor do Vitro",
    "editor.hint": "Clique no que quer mudar",
    "editor.done": "Pronto",
    "editor.enable": "Ativar",
    "editor.close": "Fechar",

    "panel.fundo": "Fundo",
    "panel.destaque": "Destaque",
    "panel.saudacao": "Saudação",
    "panel.menu": "Menu lateral",
    "panel.cartoes": "Cartões",
    "panel.luz": "Luz",
    "panel.vidro": "Vidro",
    "panel.video": "Página de vídeo",
    "panel.limpeza": "Limpeza",

    "wall.custom": "Sua imagem",
    "wall.upload": "Sua própria imagem…",
    "wall.remove": "Remover",
    "opt.dim": "Escurecer",
    "opt.blur": "Desfoque",
    "opt.accent": "Cor de destaque",
    "opt.snow": "Neve",
    "opt.name": "Nome",
    "opt.namePlaceholder": "Como devo te chamar?",
    "hint.name": "Vazio mostra “que bom te ver”.",
    "hint.sidebar": "Painel de vidro flutuante para o menu lateral e o mini-menu.",
    "opt.cardTitle": "Título",
    "opt.cardTitle.below": "Sob a imagem",
    "opt.cardTitle.over": "Sobre a imagem",
    "opt.cardText": "Tamanho do texto",
    "opt.cardLayout": "Disposição",
    "opt.cardLayout.default": "Padrão",
    "opt.cardLayout.air": "Ar",
    "opt.cardLayout.dense": "Denso",
    "opt.feedWidth": "Largura do feed",
    "opt.borders": "Bordas",
    "opt.color": "Cor",
    "opt.lightDark": "Escuridão em volta",
    "opt.glassStyle": "Barras e painéis",
    "opt.glassStyle.glass": "Vidro",
    "opt.glassStyle.frost": "Fosco",
    "opt.glassStyle.solid": "Sólido",
    "opt.transparency": "Transparência",
    "opt.forceDark": "Forçar tema escuro",
    "hint.forceDark": "No tema claro do YouTube o texto fica difícil de ler sobre o papel de parede.",
    "hint.room": "O fundo vira o próprio vídeo, desfocado — como uma sala de cinema.",
    "opt.hideRelated": "Esconder recomendados",
    "opt.hideShorts": "Esconder Shorts",
    "opt.blockAds": "Bloquear anúncios",
    "opt.hideEndscreens": "Esconder telas finais",
    "opt.hideMerch": "Esconder produtos/merch",

    "popup.tagline": "YouTube em vidro",
    "popup.toggle": "Ativar Vitro",
    "popup.edit": "Personalizar aparência…",
    "popup.openYouTube": "Abra o YouTube para personalizar",
    "popup.cleanup": "Limpeza",
    "popup.appearance": "Aparência",
    "popup.hideRelated": "Esconder recomendados no vídeo",
    "popup.hero": "Saudação na home",
    "popup.cards": "Cartões de vidro",
    "popup.light": "Luz do cursor",
    "popup.room": "Sala de cinema no vídeo",
    "popup.language": "Idioma",
    "popup.lang.auto": "Automático (navegador)",
    "popup.reset": "Restaurar padrões",

    "wall.brasa": "Brasa",
    "wall.rubi": "Rubi",
    "wall.lampejo": "Lampejo",
    "wall.anil": "Anil",
    "wall.neon-azul": "Neon azul",
    "wall.oceano": "Oceano",
    "wall.prisma": "Prisma",
    "wall.fluxo": "Fluxo",
    "wall.amanhecer": "Amanhecer",
    "wall.lua-nascente": "Lua nascente",
    "wall.eclipse": "Eclipse",
    "wall.cor": "Cor",
    "wall.ondas": "Ondas",
    "wall.crepusculo": "Crepúsculo",
    "wall.noite": "Noite",
    "wall.inverno": "Inverno",
    "wall.aurora": "Aurora",
  };

  globalThis.VITRO_I18N = { en, pt };

  let lang = "en";

  // "auto" segue o idioma do navegador; qualquer pt-* vira "pt".
  globalThis.vitroLang = function (setting) {
    if (setting === "en" || setting === "pt") return setting;
    const ui = (globalThis.chrome?.i18n?.getUILanguage?.() || navigator.language || "en").toLowerCase();
    return ui.startsWith("pt") ? "pt" : "en";
  };

  globalThis.vitroSetLang = function (setting) {
    lang = globalThis.vitroLang(setting);
    return lang;
  };

  globalThis.vitroT = function (key) {
    return globalThis.VITRO_I18N[lang]?.[key] ?? en[key] ?? key;
  };

  globalThis.vitroLocale = function () {
    return lang === "pt" ? "pt-BR" : "en-US";
  };

  globalThis.vitroSetLang("auto");
})();
