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
    if (pathname === "/results") return "results";
    return "other";
  }

  // O filtro "Shorts" da busca não tem atributo próprio: só o texto o identifica
  const isShortsChip = (text) => /^shorts$/i.test((text || "").trim());

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
      "vt-no-members": on && S.hideMembers,
      "vt-no-paid": on && S.hidePaid,
      "vt-no-games": on && S.hideGames,
      "vt-sidebar-glass": on && S.sidebarGlass,
      "vt-cards": on && S.cards,
      "vt-card-over": S.cardTitle === "over",
      "vt-card-borders": S.cardBorders,
      "vt-layout-air": S.cardLayout === "air",
      "vt-layout-dense": S.cardLayout === "dense",
      "vt-hero": on && S.hero,
      "vt-greet": S.greet,
      "vt-greet-center": S.greetAlign === "center",
      "vt-greet-right": S.greetAlign === "right",
      "vt-light": on && S.light,
      "vt-snow-on": on && S.hero && S.snow,
      "vt-room": on && S.room,
      ...fontClasses(S, on),
      ...guideClasses(S, on),
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
      "--vt-ui-scale": String(S.uiScale / 100),
    };
  }

  const FONTS = ["system", "inter", "manrope", "outfit"]; // "youtube" = não mexe
  function fontClasses(S, on) {
    const out = { "vt-has-font": on && FONTS.includes(S.font) };
    for (const f of FONTS) out["vt-font-" + f] = on && S.font === f;
    return out;
  }

  // vt-gh-<id> esconde o item do menu lateral (regras geradas no content.js)
  function guideClasses(S, on) {
    const ids = (globalThis.VITRO_GUIDE_ITEMS || []).map(([id]) => id);
    const hidden = new Set(Array.isArray(S.guideHide) ? S.guideHide : []);
    return Object.fromEntries(ids.map((id) => ["vt-gh-" + id, on && hidden.has(id)]));
  }

  // Noite das 18h às 6h (mesma virada da saudação "Boa noite")
  const isNight = (hour) => hour >= 18 || hour < 6;

  // Dia local corrido desde 1970 (muda à meia-noite do fuso do usuário)
  const localDay = (d) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000);

  // Qual papel de parede mostrar agora, conforme o modo.
  // `tabSeed` (0–1) é sorteado uma vez por aba para o modo "tab".
  function activeWallpaperId(S, ids, now, tabSeed) {
    const pool = ids.filter((id) => id !== "custom");
    switch (S.wallMode) {
      case "schedule":
        return isNight(now.getHours()) ? S.wallpaperNight : S.wallpaper;
      case "daily":
        return pool.length ? pool[((localDay(now) % pool.length) + pool.length) % pool.length] : S.wallpaper;
      case "tab":
        return pool.length ? pool[Math.min(pool.length - 1, Math.floor(tabSeed * pool.length))] : S.wallpaper;
      default:
        return S.wallpaper;
    }
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

  globalThis.VitroCore = { activeWallpaperId, isNight, localDay, wantsDark, shortsTarget, pageOf, isShortsChip, greetingKey, heroHeight, glassParams, htmlClasses, cssVars, wallpaperCss };
})();
