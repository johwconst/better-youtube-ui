// Lógica pura do Vitro (sem DOM): usada pelo content.js e testada em tests/unit.
(() => {
  // /shorts/ID → /watch?v=ID (ou null se não for Shorts)
  function shortsTarget(pathname) {
    const m = /^\/shorts\/([\w-]{6,})/.exec(pathname || "");
    return m ? `/watch?v=${m[1]}` : null;
  }

  function pageOf(pathname) {
    if (pathname === "/" || pathname === "" || pathname === "/feed/home") return "home";
    if (pathname === "/watch") return "watch";
    return "other";
  }

  // Chave do dicionário para a saudação conforme a hora (0–23)
  function greetingKey(hour) {
    if (hour < 5) return "greet.night";
    if (hour < 12) return "greet.morning";
    if (hour < 18) return "greet.afternoon";
    return "greet.evening";
  }

  // Altura da área de saudação: 44% da janela, entre 300 e 460px
  function heroHeight(viewportHeight) {
    return Math.round(Math.min(Math.max(viewportHeight * 0.44, 300), 460));
  }

  function glassParams(S) {
    switch (S.glassStyle) {
      case "glass":
        return { alpha: S.glassAlpha / 100, blur: S.glassBlur };
      case "frost":
        return { alpha: Math.min(0.85, S.glassAlpha / 100 + 0.25), blur: Math.round(S.glassBlur * 1.8) };
      case "solid":
        return { alpha: 0.96, blur: 0 };
      default:
        return { alpha: 0.48, blur: 14 };
    }
  }

  // Classes "vt-*" do <html> → ligada/desligada
  function htmlClasses(S) {
    const on = !!S.enabled;
    return {
      "vt-on": on,
      "vt-no-shorts": on && S.hideShorts,
      "vt-no-ads": on && S.blockAds,
      "vt-no-related": on && S.hideRelated,
      "vt-no-endscreens": on && S.hideEndscreens,
      "vt-no-merch": on && S.hideMerch,
      "vt-sidebar-glass": on && S.sidebarGlass,
      "vt-cards": on && S.cards,
      "vt-card-over": S.cardTitle === "over",
      "vt-card-borders": S.cardBorders,
      "vt-layout-air": S.cardLayout === "air",
      "vt-layout-dense": S.cardLayout === "dense",
      "vt-hero": on && S.hero,
      "vt-greet": S.greet,
      "vt-light": on && S.light,
      "vt-snow-on": on && S.hero && S.snow,
      "vt-room": on && S.room,
    };
  }

  // Variáveis CSS escritas no <html>
  function cssVars(S) {
    const g = glassParams(S);
    return {
      "--vt-glass-alpha": String(g.alpha),
      "--vt-blur": g.blur + "px",
      "--vt-accent": S.accent,
      "--vt-card-text": String(S.cardText / 100),
      "--vt-feed-w": String(S.feedWidth),
      "--vt-bg-dim": String(S.bgDim / 100),
      "--vt-bg-blur": S.bgBlur + "px",
      "--vt-light-color": S.lightColor,
      "--vt-light-dark": String(S.lightDark / 100),
    };
  }

  // Valor CSS do background-image do papel de parede escolhido
  function wallpaperCss(walls, id, customImage, defaultId) {
    if (id === "custom" && customImage) return `url("${customImage}")`;
    const w = walls.find((x) => x.id === id) || walls.find((x) => x.id === defaultId) || walls[0];
    return w.css;
  }

  // O <html> deve ter o atributo "dark"? Com o Vitro ligado e forceDark, sim.
  // Senão, devolve ao que o YouTube tinha (originalDark) para não estragar o tema claro.
  function wantsDark(S, originalDark) {
    return (S.enabled && S.forceDark) || !!originalDark;
  }

  globalThis.VitroCore = { wantsDark, shortsTarget, pageOf, greetingKey, heroHeight, glassParams, htmlClasses, cssVars, wallpaperCss };
})();
