// Vitro — content script
(() => {
  const html = document.documentElement;
  const WALLS = globalThis.VITRO_WALLPAPERS;
  let S = { ...globalThis.VITRO_DEFAULTS };
  let customImage = null;
  const t = (k) => globalThis.vitroT(k);
  const C = globalThis.VitroCore;
  let currentLang = null;

  // ---------------------------------------------------------------------
  // Shorts → vídeo normal (antes de qualquer render)
  // ---------------------------------------------------------------------
  function redirectShorts() {
    if (!S.enabled || !S.hideShorts) return;
    const target = C.shortsTarget(location.pathname);
    if (target) location.replace(target);
  }

  // ---------------------------------------------------------------------
  // Aplicar configurações → classes e variáveis no <html>
  // ---------------------------------------------------------------------
  function setClass(name, on) {
    html.classList.toggle(name, !!on);
  }

  function applySettings() {
    const on = S.enabled;
    const lang = globalThis.vitroSetLang(S.language);
    if (currentLang && lang !== currentLang) onLanguageChange();
    currentLang = lang;
    applyDark();
    for (const [name, value] of Object.entries(C.htmlClasses(S))) setClass(name, value);
    for (const [name, value] of Object.entries(C.cssVars(S))) html.style.setProperty(name, value);

    updateWallpaper();
    updateHero();
    snow.toggle(on && S.hero && S.snow);
  }

  // ---------------------------------------------------------------------
  // Tema escuro forçado
  // O texto do YouTube usa a paleta de html[dark]; no tema claro ele fica
  // escuro sobre o papel de parede. Mantemos o atributo enquanto for preciso
  // e, ao desligar, devolvemos o estado original da página.
  // ---------------------------------------------------------------------
  const originalDark = html.hasAttribute("dark"); // document_start: vem do HTML do servidor
  const darkGuard = new MutationObserver(() => {
    if (C.wantsDark(S, originalDark) && !html.hasAttribute("dark")) html.setAttribute("dark", "");
  });

  function applyDark() {
    const want = C.wantsDark(S, originalDark);
    if (want && !html.hasAttribute("dark")) html.setAttribute("dark", "");
    if (!want && html.hasAttribute("dark")) html.removeAttribute("dark");
    if (S.enabled && S.forceDark) darkGuard.observe(html, { attributes: true, attributeFilter: ["dark"] });
    else darkGuard.disconnect();
  }

  // ---------------------------------------------------------------------
  // Camadas fixas: papel de parede, luz, sala (vídeo), neve
  // ---------------------------------------------------------------------
  const layers = {};
  function ensureLayers() {
    if (!document.body) return false;
    if (layers.wall?.isConnected) return true;
    for (const [key, id, tag] of [
      ["wall", "vt-wallpaper", "div"],
      ["light", "vt-light", "div"],
      ["room", "vt-room", "canvas"],
      ["snow", "vt-snow", "canvas"],
    ]) {
      const el = document.getElementById(id) || document.createElement(tag);
      el.id = id;
      el.setAttribute("aria-hidden", "true");
      document.body.prepend(el);
      layers[key] = el;
    }
    layers.room.width = 64;
    layers.room.height = 36;
    return true;
  }

  const tabSeed = Math.random(); // modo "um por aba": sorteado uma vez por aba

  function currentWallpaperCss() {
    const ids = WALLS.map((w) => w.id);
    const id = C.activeWallpaperId(S, ids, new Date(), tabSeed);
    return C.wallpaperCss(WALLS, id, customImage, globalThis.VITRO_DEFAULTS.wallpaper);
  }

  function updateWallpaper() {
    if (!layers.wall || previewing) return;
    const css = currentWallpaperCss();
    if (layers.wall.dataset.bg !== css) {
      layers.wall.style.backgroundImage = css;
      layers.wall.dataset.bg = css;
    }
  }

  // Prévia ao passar o mouse numa miniatura do editor
  let previewing = false;
  function previewWallpaper(css) {
    if (!layers.wall) return;
    if (css) {
      previewing = true;
      layers.wall.style.backgroundImage = css;
    } else {
      previewing = false;
      layers.wall.dataset.bg = "";
      updateWallpaper();
    }
  }

  // Dia/noite e "um por dia" viram sozinhos: confere a cada minuto
  setInterval(() => {
    if (S.enabled && (S.wallMode === "schedule" || S.wallMode === "daily")) updateWallpaper();
  }, 60000);

  // Regras para esconder itens do menu lateral, geradas da lista em settings.js
  (() => {
    const style = document.createElement("style");
    style.id = "vt-guide-rules";
    style.textContent = globalThis.VITRO_GUIDE_ITEMS.map(([id, sel]) => `html.vt-gh-${id} ${sel}{display:none!important}`).join("\n");
    (document.head || html).append(style);
  })();

  // Sons sutis (sintetizados, sem arquivos). Só tocam após um clique do usuário.
  const sound = (() => {
    let ctx;
    const NOTES = { tick: [880, 0.03], on: [1180, 0.05], off: [620, 0.05], open: [520, 0.09], close: [420, 0.08] };
    return (kind) => {
      if (!S.sounds) return;
      try {
        ctx ||= new AudioContext();
        const [freq, dur] = NOTES[kind] || NOTES.tick;
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, t0);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, t0 + dur);
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.exponentialRampToValueAtTime(0.05, t0 + 0.006);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t0);
        osc.stop(t0 + dur + 0.02);
      } catch {
        /* áudio indisponível */
      }
    };
  })();

  // Luz que segue o cursor (rAF para não pesar)
  let mx = 0, my = 0, lightRaf = 0;
  addEventListener(
    "pointermove",
    (e) => {
      if (!S.enabled || !S.light) return;
      mx = e.clientX;
      my = e.clientY;
      if (!lightRaf)
        lightRaf = requestAnimationFrame(() => {
          lightRaf = 0;
          html.style.setProperty("--vt-mx", mx + "px");
          html.style.setProperty("--vt-my", my + "px");
        });
    },
    { passive: true }
  );

  // Neve
  const snow = (() => {
    let raf = 0, flakes = [], ctx, w, h;
    function resize() {
      const c = layers.snow;
      if (!c) return;
      w = c.width = innerWidth;
      h = c.height = innerHeight;
    }
    function frame() {
      raf = requestAnimationFrame(frame);
      if (document.hidden || !html.classList.contains("vt-home")) {
        ctx?.clearRect(0, 0, w, h);
        return;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "rgba(255,255,255,.85)";
      for (const f of flakes) {
        f.y += f.s;
        f.x += Math.sin((f.y + f.o) / 40) * 0.4;
        if (f.y > h) (f.y = -5), (f.x = Math.random() * w);
        ctx.globalAlpha = f.a;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, 6.283);
        ctx.fill();
      }
    }
    return {
      toggle(on) {
        if (!layers.snow) return;
        if (on && !raf) {
          ctx = layers.snow.getContext("2d");
          resize();
          flakes = Array.from({ length: 140 }, () => ({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 2 + 0.6,
            s: Math.random() * 0.8 + 0.3,
            a: Math.random() * 0.6 + 0.3,
            o: Math.random() * 1000,
          }));
          addEventListener("resize", resize);
          frame();
        } else if (!on && raf) {
          cancelAnimationFrame(raf);
          raf = 0;
          ctx?.clearRect(0, 0, w, h);
          removeEventListener("resize", resize);
        }
      },
    };
  })();

  // Sala: o próprio vídeo desfocado vira o fundo da página
  const room = (() => {
    let timer = 0;
    function draw() {
      const v = document.querySelector("#movie_player video");
      const c = layers.room;
      if (!v || !c || v.readyState < 2 || document.hidden) return;
      try {
        c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
        c.classList.add("vt-ready");
      } catch {
        /* frame indisponível */
      }
    }
    return {
      start() {
        if (!timer) timer = setInterval(draw, 300);
      },
      stop() {
        clearInterval(timer);
        timer = 0;
        layers.room?.classList.remove("vt-ready");
      },
    };
  })();

  // ---------------------------------------------------------------------
  // Destaque / saudação na home
  // ---------------------------------------------------------------------
  let hero;
  function greeting() {
    return t(C.greetingKey(new Date().getHours()));
  }

  function heroHeight() {
    return C.heroHeight(innerHeight);
  }

  function updateHero() {
    if (!document.body) return;
    if (!hero) {
      hero = document.createElement("section");
      hero.id = "vt-hero";
      const el = (tag, cls, ...kids) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        e.append(...kids);
        return e;
      };
      hero.append(
        el("div", "vt-greet", el("div", "vt-date"), el("p", "vt-title", el("b", "vt-hello"), el("span", ""))),
        el("h2", "vt-section")
      );
    }
    placeHero();
    hero.querySelector(".vt-date").textContent = new Date().toLocaleDateString(globalThis.vitroLocale(), {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    hero.querySelector(".vt-hello").textContent = greeting();
    hero.querySelector(".vt-title span").textContent = S.name.trim() || t("hero.fallbackName");
    hero.querySelector(".vt-section").textContent = t("hero.section");
    html.style.setProperty("--vt-hero-h", heroHeight() + "px");
  }

  // A saudação entra no fluxo da página, dentro da grade da home e antes
  // dos chips. Assim ela empurra o feed naturalmente e acompanha a largura
  // da grade, sem posicionamento absoluto nem temporizadores.
  const HOME_GRID = 'ytd-browse[page-subtype="home"] ytd-rich-grid-renderer';
  let gridWait = null;

  function placeHero() {
    if (!hero) return;
    const grid = document.querySelector(HOME_GRID);
    if (!grid) {
      // grade ainda não montada: espera ela aparecer (uma vez, com limite)
      if (!gridWait && html.classList.contains("vt-home")) {
        gridWait = new MutationObserver(() => document.querySelector(HOME_GRID) && stopGridWait() && placeHero());
        gridWait.observe(document.documentElement, { childList: true, subtree: true });
        setTimeout(stopGridWait, 15000);
      }
      return;
    }
    if (hero.parentElement !== grid) {
      const header = grid.querySelector(":scope > #header");
      grid.insertBefore(hero, header || grid.firstChild);
      heroAlign.disconnect();
      const contents = grid.querySelector(":scope > #contents");
      heroAlign.observe(grid);
      if (contents) heroAlign.observe(contents);
    }
    alignHero();
  }

  function stopGridWait() {
    gridWait?.disconnect();
    gridWait = null;
    return true;
  }

  // Alinha a saudação com a borda dos cartões (o YouTube centraliza #contents
  // e dá margem aos itens; isso muda com a largura da janela e o menu lateral).
  function alignHero() {
    const grid = hero?.parentElement;
    const contents = grid?.querySelector(":scope > #contents");
    if (!contents) return;
    const g = grid.getBoundingClientRect();
    const c = contents.getBoundingClientRect();
    if (!c.width) return;
    const item = contents.querySelector("ytd-rich-item-renderer");
    const m = item ? parseFloat(getComputedStyle(item).marginLeft) || 0 : 8;
    // medidas vêm em px da tela; as margens são aplicadas dentro do zoom da página
    const z = S.uiScale / 100 || 1;
    hero.style.marginLeft = Math.max(0, (c.left - g.left) / z + m) + "px";
    hero.style.marginRight = Math.max(0, (g.right - c.right) / z + m) + "px";
  }
  const heroAlign = new ResizeObserver(() => alignHero());

  addEventListener("resize", () => html.style.setProperty("--vt-hero-h", heroHeight() + "px"));

  // ---------------------------------------------------------------------
  // Rotas do SPA do YouTube
  // ---------------------------------------------------------------------
  // Filtro "Shorts" da busca: CSS não enxerga texto, então marcamos o botão com
  // uma classe (quem esconde é html.vt-no-shorts no CSS). O YouTube reaproveita
  // os botões entre buscas trocando só o texto, por isso a marcação é refeita a
  // cada mudança, no máximo uma vez por quadro e só enquanto estiver na busca.
  const searchChips = (() => {
    let root = null, raf = 0;
    const mark = () => {
      raf = 0;
      for (const chip of root?.querySelectorAll("yt-chip-cloud-chip-renderer") || [])
        chip.classList.toggle("vt-shorts-chip", C.isShortsChip(chip.textContent));
    };
    const mo = new MutationObserver(() => (raf ||= requestAnimationFrame(mark)));
    return {
      sync(active) {
        const next = active ? document.querySelector("ytd-search") : null;
        if (next === root) return mark();
        mo.disconnect();
        root = next;
        if (root) mo.observe(root, { childList: true, subtree: true, characterData: true });
        mark();
      },
    };
  })();

  function route() {
    redirectShorts();
    const page = C.pageOf(location.pathname);
    const isHome = page === "home";
    const isWatch = page === "watch";
    setClass("vt-home", isHome);
    setClass("vt-watch", isWatch);
    if (isWatch && S.enabled && S.room) room.start();
    else room.stop();
    if (isHome) updateHero();
    searchChips.sync(page === "results");
  }

  document.addEventListener("yt-navigate-start", redirectShorts);
  document.addEventListener("yt-navigate-finish", route);
  document.addEventListener("yt-page-data-updated", route);

  // ---------------------------------------------------------------------
  // Anúncios em vídeo: pula / acelera
  // ---------------------------------------------------------------------
  function adTick() {
    if (!S.enabled || !S.blockAds) return;
    const player = document.querySelector("#movie_player");
    if (!player) return;
    const skip = player.querySelector(
      ".ytp-skip-ad-button, .ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-ad-skip-button-slot button"
    );
    if (skip) skip.click();
    if (player.classList.contains("ad-showing")) {
      const v = player.querySelector("video");
      if (v && isFinite(v.duration) && v.duration > 0) {
        v.muted = true;
        v.currentTime = Math.max(v.duration - 0.1, 0);
      }
    }
  }
  setInterval(adTick, 400);

  // ---------------------------------------------------------------------
  // Botão do editor na barra superior
  // ---------------------------------------------------------------------
  function boltIcon() {
    const NS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(NS, "svg");
    for (const [k, v] of Object.entries({ width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linejoin": "round", "stroke-linecap": "round" }))
      svg.setAttribute(k, v);
    const path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M13 2 4.5 13.5H11L10 22l8.5-11.5H12z");
    svg.append(path);
    return svg;
  }

  function ensureEditButton() {
    if (document.getElementById("vt-edit-btn")) return;
    const end = document.querySelector("ytd-masthead #end");
    if (!end) return;
    const b = document.createElement("button");
    b.id = "vt-edit-btn";
    b.title = t("button.title");
    b.setAttribute("aria-label", t("button.aria"));
    b.append(boltIcon());
    b.addEventListener("click", () => editor.toggle());
    end.prepend(b);
  }

  // ---------------------------------------------------------------------
  // Editor visual
  // ---------------------------------------------------------------------
  const editor = (() => {
    let bar, panel, current = null;
    let saveTimer = 0;

    function set(key, value) {
      sound(typeof value === "boolean" ? (value ? "on" : "off") : "tick");
      S[key] = value;
      applySettings();
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => globalThis.vitroSave(S), 250);
      if (current) renderPanel(current); // reflete dependências
    }

    // --- controles ---
    const h = (tag, attrs = {}, ...kids) => {
      const el = document.createElement(tag);
      for (const [k, v] of Object.entries(attrs)) {
        if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
        else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
      }
      el.append(...kids.flat(Infinity).filter((k) => k != null && k !== false));
      return el;
    };
    const toggle = (label, key) =>
      h("div", { class: "vt-row" }, h("span", {}, label),
        h("button", { class: "vt-switch", role: "switch", "aria-checked": String(!!S[key]), "aria-label": label, onclick: () => set(key, !S[key]) }));
    const slider = (label, key, min, max, unit) => {
      const out = h("small", {}, S[key] + unit);
      return h("div", { class: "vt-col" },
        h("div", { class: "vt-lbl" }, h("span", {}, label), out),
        h("input", {
          type: "range", min, max, value: S[key], "aria-label": label,
          oninput: (e) => {
            out.textContent = e.target.value + unit;
            S[key] = +e.target.value;
            applySettings();
            clearTimeout(saveTimer);
            saveTimer = setTimeout(() => globalThis.vitroSave(S), 250);
          },
        }));
    };
    const seg = (label, key, opts) =>
      h("div", { class: "vt-col" }, label && h("div", { class: "vt-lbl" }, h("span", {}, label)),
        h("div", { class: "vt-seg" }, opts.map(([v, t]) =>
          h("button", { "aria-pressed": String(S[key] === v), onclick: () => set(key, v) }, t))));
    const color = (label, key) =>
      h("div", { class: "vt-row" }, h("span", {}, label),
        h("input", { type: "color", value: S[key], "aria-label": label, oninput: (e) => set(key, e.target.value) }));
    const text = (label, key, placeholder) =>
      h("div", { class: "vt-col" }, h("div", { class: "vt-lbl" }, h("span", {}, label)),
        h("input", { type: "text", value: S[key], placeholder, maxlength: 40, oninput: (e) => {
          S[key] = e.target.value;
          updateHero();
          clearTimeout(saveTimer);
          saveTimer = setTimeout(() => globalThis.vitroSave(S), 400);
        } }));

    // Grade de miniaturas ligada a uma configuração ("wallpaper" ou "wallpaperNight")
    function wallGrid(key) {
      const hover = (css) => S.wallPreview && { onmouseenter: () => previewWallpaper(css), onmouseleave: () => previewWallpaper(null) };
      const pick = (id) => () => {
        previewWallpaper(null);
        set(key, id);
      };
      const items = WALLS.map((w) =>
        h("button", { class: "vt-wall", "data-wall": w.id, "aria-pressed": String(S[key] === w.id), onclick: pick(w.id), ...hover(w.css) },
          h("i", { style: `background-image:${w.thumb || w.css}` }), t("wall." + w.id)));
      if (customImage) {
        const css = `url("${customImage}")`;
        items.push(h("button", { class: "vt-wall", "data-wall": "custom", "aria-pressed": String(S[key] === "custom"), onclick: pick("custom"), ...hover(css) },
          h("i", { style: `background-image:${css}` }), t("wall.custom")));
      }
      return h("div", { class: "vt-walls", "data-key": key, onmouseleave: () => previewWallpaper(null) }, items);
    }

    function wallpapers() {
      const file = h("input", { type: "file", accept: "image/*", style: "display:none", onchange: (e) => loadImage(e.target.files[0]) });
      const mode = S.wallMode;
      const rotating = mode === "daily" || mode === "tab";
      return [
        seg(t("opt.wallMode"), "wallMode", [["fixed", t("opt.wallMode.fixed")], ["schedule", t("opt.wallMode.schedule")], ["daily", t("opt.wallMode.daily")], ["tab", t("opt.wallMode.tab")]]),
        rotating && h("p", { class: "vt-hint" }, t("hint.wallRotate")),
        mode === "schedule" && h("div", { class: "vt-sub" }, "☀ " + t("opt.wallDay")),
        !rotating && wallGrid("wallpaper"),
        mode === "schedule" && h("div", { class: "vt-sub" }, "☾ " + t("opt.wallNight")),
        mode === "schedule" && wallGrid("wallpaperNight"),
        !rotating && h("div", { class: "vt-row" },
          h("button", { class: "vt-btn", onclick: () => file.click() }, t("wall.upload")),
          customImage && h("button", { class: "vt-btn", onclick: removeImage }, t("wall.remove")), file),
        toggle(t("opt.wallPreview"), "wallPreview"),
      ];
    }

    // Interruptor de um item do menu lateral (ligado = aparece)
    const guideToggle = (id) => {
      const shown = !S.guideHide.includes(id);
      const label = t("guide." + id);
      return h("div", { class: "vt-row" }, h("span", {}, label),
        h("button", { class: "vt-switch", role: "switch", "aria-checked": String(shown), "aria-label": label,
          onclick: () => set("guideHide", shown ? [...S.guideHide, id] : S.guideHide.filter((x) => x !== id)) }));
    };

    const FONT_OPTS = [["youtube", null], ["system", "system-ui"], ["inter", '"Vitro Inter"'], ["manrope", '"Vitro Manrope"'], ["outfit", '"Vitro Outfit"']];
    const fontPicker = () =>
      h("div", { class: "vt-col" }, h("div", { class: "vt-lbl" }, h("span", {}, t("opt.font"))),
        h("div", { class: "vt-fonts" }, FONT_OPTS.map(([id, family]) =>
          h("button", { class: "vt-font", "data-font": id, "aria-pressed": String(S.font === id), onclick: () => set("font", id), style: family ? `font-family:${family}, sans-serif !important` : "" },
            h("b", {}, "Aa"), h("span", {}, id === "youtube" || id === "system" ? t("opt.font." + id) : id[0].toUpperCase() + id.slice(1))))));

    async function loadImage(f) {
      if (!f) return;
      const img = await createImageBitmap(f);
      const scale = Math.min(1, 2560 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      customImage = c.toDataURL("image/jpeg", 0.88);
      await chrome.storage.local.set({ vtImage: customImage });
      set("wallpaper", "custom");
    }
    async function removeImage() {
      customImage = null;
      await chrome.storage.local.remove("vtImage");
      set("wallpaper", S.wallpaper === "custom" ? globalThis.VITRO_DEFAULTS.wallpaper : S.wallpaper);
    }

    const PANELS = {
      fundo: { body: () => [wallpapers(), slider(t("opt.dim"), "bgDim", 0, 90, "%"), slider(t("opt.blur"), "bgBlur", 0, 40, "px")] },
      destaque: {
        flash: "hero", master: "hero",
        body: () => [color(t("opt.accent"), "accent"), toggle(t("opt.snow"), "snow")],
      },
      saudacao: {
        flash: "hero", master: "greet",
        body: () => [
          text(t("opt.name"), "name", t("opt.namePlaceholder")),
          h("p", { class: "vt-hint" }, t("hint.name")),
          seg(t("opt.greetAlign"), "greetAlign", [["left", t("opt.align.left")], ["center", t("opt.align.center")], ["right", t("opt.align.right")]]),
        ],
      },
      menu: {
        flash: "guide", master: "sidebarGlass",
        body: () => [
          h("p", { class: "vt-hint" }, t("hint.sidebar")),
          h("div", { class: "vt-sub" }, t("opt.guideShow")),
          globalThis.VITRO_GUIDE_ITEMS.map(([id]) => guideToggle(id)),
        ],
      },
      cartoes: {
        master: "cards",
        body: () => [
          seg(t("opt.cardTitle"), "cardTitle", [["below", t("opt.cardTitle.below")], ["over", t("opt.cardTitle.over")]]),
          slider(t("opt.cardText"), "cardText", 80, 130, "%"),
          seg(t("opt.cardLayout"), "cardLayout", [["default", t("opt.cardLayout.default")], ["air", t("opt.cardLayout.air")], ["dense", t("opt.cardLayout.dense")]]),
          slider(t("opt.feedWidth"), "feedWidth", 60, 100, "%"),
          toggle(t("opt.borders"), "cardBorders"),
        ],
      },
      luz: { master: "light", body: () => [color(t("opt.color"), "lightColor"), slider(t("opt.lightDark"), "lightDark", 0, 70, "%")] },
      vidro: {
        flash: "masthead",
        body: () => [
          seg(t("opt.glassStyle"), "glassStyle", [["glass", t("opt.glassStyle.glass")], ["frost", t("opt.glassStyle.frost")], ["solid", t("opt.glassStyle.solid")]]),
          slider(t("opt.blur"), "glassBlur", 0, 40, "px"),
          slider(t("opt.transparency"), "glassAlpha", 10, 90, "%"),
          toggle(t("opt.forceDark"), "forceDark"),
          h("p", { class: "vt-hint" }, t("hint.forceDark")),
        ],
      },
      interface: {
        body: () => [
          fontPicker(),
          slider(t("opt.uiScale"), "uiScale", 85, 120, "%"),
          toggle(t("opt.sounds"), "sounds"),
          h("p", { class: "vt-hint" }, t("hint.sounds")),
        ],
      },
      video: { master: "room", body: () => [h("p", { class: "vt-hint" }, t("hint.room")), toggle(t("opt.hideRelated"), "hideRelated")] },
      limpeza: {
        body: () => [toggle(t("opt.hideShorts"), "hideShorts"), toggle(t("opt.blockAds"), "blockAds"), toggle(t("opt.hideEndscreens"), "hideEndscreens"), toggle(t("opt.hideMerch"), "hideMerch"), toggle(t("opt.hideMembers"), "hideMembers"), toggle(t("opt.hidePaid"), "hidePaid")],
      },
    };

    const title = (id) => t("panel." + id);

    // Ícones das seções (traços 24×24, mesmo estilo do raio)
    const ICONS = {
      fundo: "M4 5h16v14H4z M4 16l4.5-4.5 3.5 3.5 2.5-2.5L20 17 M15.5 9.5h.01",
      destaque: "M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z",
      saudacao: "M4 6h16v10H8l-4 4z M8 10h8 M8 13h5",
      menu: "M4 4h6v16H4z M13 6h7 M13 10h7 M13 14h5",
      cartoes: "M4 4h7v7H4z M13 4h7v7h-7z M4 13h7v7H4z M13 13h7v7h-7z",
      luz: "M9 18h6 M10 21h4 M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z",
      vidro: "M5 4h14v16H5z M5 9l6-5 M9 20L19 10",
      video: "M3 6h18v12H3z M10 9.5v5l4.5-2.5z",
      limpeza: "M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6",
      interface: "M3 19 8 5l5 14 M5 14h6 M15 19v-5.5a2.5 2.5 0 0 1 5 0V19 M15 16h5",
    };
    function icon(d) {
      const NS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(NS, "svg");
      for (const [k, v] of Object.entries({ viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "stroke-width": 1.7, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" }))
        svg.setAttribute(k, v);
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      svg.append(path);
      return svg;
    }

    function build() {
      if (bar?.isConnected) return;
      panel = h("div", { id: "vt-panel", role: "tabpanel" });
      const nav = h("nav", { class: "vt-nav", role: "tablist", "aria-orientation": "vertical" },
        Object.keys(PANELS).map((id) =>
          h("button", { class: "vt-tab", role: "tab", "data-id": id, "aria-pressed": "false", "aria-selected": "false", onclick: () => openPanel(id) },
            icon(ICONS[id]), h("span", {}, title(id)))));
      const head = h("header", { class: "vt-ed-head" },
        h("div", { class: "vt-ed-brand" },
          h("span", { class: "vt-ed-logo" }, boltIcon()),
          h("div", { style: "min-width:0" }, h("strong", {}, "Vitro"), h("span", { class: "vt-ed-label" }, t("editor.hint")))),
        h("button", { class: "vt-done", onclick: () => close() }, t("editor.done")));
      head.addEventListener("pointerdown", startDrag);
      bar = h("div", { id: "vt-editor", role: "dialog", "aria-label": t("editor.aria") }, head, h("div", { class: "vt-ed-body" }, nav, panel));
      bar.style.setProperty("--vt-ed-x", drag.x + "px");
      bar.style.setProperty("--vt-ed-y", drag.y + "px");
      nav.addEventListener("keydown", navKeys);
      document.body.append(bar);
    }

    // Arrastar o card pelo cabeçalho (posição lembrada enquanto a aba estiver aberta)
    const drag = { x: 0, y: 0 };
    function startDrag(e) {
      if (e.button !== 0 || e.target.closest("button")) return;
      const sx = e.clientX - drag.x, sy = e.clientY - drag.y;
      const r = bar.getBoundingClientRect();
      // limites: o card não sai da tela
      const maxX = (innerWidth - r.width) / 2, maxY = (innerHeight - r.height) / 2;
      const clamp = (v, m) => Math.max(-m, Math.min(m, v));
      bar.classList.add("vt-dragging");
      const move = (ev) => {
        drag.x = clamp(ev.clientX - sx, maxX);
        drag.y = clamp(ev.clientY - sy, maxY);
        bar.style.setProperty("--vt-ed-x", drag.x + "px");
        bar.style.setProperty("--vt-ed-y", drag.y + "px");
      };
      const up = () => {
        bar.classList.remove("vt-dragging");
        removeEventListener("pointermove", move);
        removeEventListener("pointerup", up);
      };
      addEventListener("pointermove", move);
      addEventListener("pointerup", up);
    }

    // Setas ↑/↓ (←/→ no celular) navegam entre as seções
    function navKeys(e) {
      const ids = Object.keys(PANELS);
      const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const next = ids[(ids.indexOf(current) + step + ids.length) % ids.length];
      openPanel(next);
      bar.querySelector(`.vt-tab[data-id="${next}"]`).focus();
    }

    function renderPanel(id) {
      const p = PANELS[id];
      const head = h("div", { class: "vt-head" }, h("h3", {}, title(id)),
        p.master && h("button", { class: "vt-switch", role: "switch", "aria-checked": String(!!S[p.master]), "aria-label": t("editor.enable") + " " + title(id), onclick: () => set(p.master, !S[p.master]) }));
      // preserva o foco em campos de texto ao re-renderizar
      const active = document.activeElement;
      if (panel.contains(active) && active.type === "text") return;
      const scroll = panel.scrollTop;
      panel.replaceChildren(head, ...p.body().flat(Infinity).filter((k) => k != null && k !== false));
      panel.scrollTop = scroll;
    }

    function openPanel(id) {
      if (!PANELS[id]) return;
      const changed = id !== current;
      if (changed && current) sound("tick");
      current = id;
      renderPanel(id);
      if (changed) panel.scrollTop = 0;
      bar.querySelectorAll(".vt-tab").forEach((tab) => {
        const on = tab.dataset.id === current;
        tab.setAttribute("aria-pressed", String(on));
        tab.setAttribute("aria-selected", String(on));
        tab.tabIndex = on ? 0 : -1;
        // no celular a navegação vira uma faixa horizontal: mantém a seção visível
        if (on && changed) tab.scrollIntoView({ block: "nearest", inline: "nearest" });
      });
      flash(PANELS[id].flash);
    }

    function flash(target) {
      for (const f of ["masthead", "guide", "hero"]) setClass("vt-flash-" + f, target === f);
    }

    function open() {
      build();
      if (!html.classList.contains("vt-editing")) sound("open");
      setClass("vt-editing", true);
      openPanel(current || Object.keys(PANELS)[0]);
      bar.querySelector('.vt-tab[aria-pressed="true"]')?.focus({ preventScroll: true });
    }
    function close() {
      if (html.classList.contains("vt-editing")) sound("close");
      previewWallpaper(null);
      flash(null);
      setClass("vt-editing", false);
      if (bar?.contains(document.activeElement)) document.getElementById("vt-edit-btn")?.focus();
    }
    // Troca de idioma: recria o card mantendo a seção atual
    function relabel() {
      if (!bar) return;
      const wasOpen = html.classList.contains("vt-editing");
      bar.remove();
      bar = null;
      if (wasOpen) open();
    }
    return {
      relabel,
      toggle: () => (html.classList.contains("vt-editing") ? close() : open()),
      open,
      close,
    };
  })();

  function onLanguageChange() {
    editor.relabel();
    const b = document.getElementById("vt-edit-btn");
    if (b) {
      b.title = t("button.title");
      b.setAttribute("aria-label", t("button.aria"));
    }
    // updateHero() roda logo depois, dentro de applySettings()
  }

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && html.classList.contains("vt-editing")) editor.close();
  });

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  async function boot() {
    S = await globalThis.vitroLoad();
    customImage = (await chrome.storage.local.get("vtImage")).vtImage || null;
    redirectShorts();
    applySettings();

    const onBody = () => {
      ensureLayers();
      applySettings();
      route();
      ensureEditButton(); // não esperar mutação/intervalo se a masthead já existe
    };
    if (document.body) onBody();
    else document.addEventListener("DOMContentLoaded", onBody, { once: true });

    // A masthead e a grade são montadas sob demanda pelo YouTube
    const mo = new MutationObserver(() => {
      if (!document.body) return;
      if (!layers.wall?.isConnected) ensureLayers() && applySettings();
      ensureEditButton();
    });
    mo.observe(html, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 20000); // depois disso, só as rotas
    setInterval(ensureEditButton, 3000);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings) {
      S = globalThis.vitroMerge(changes.settings.newValue);
      applySettings();
      route();
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "vt-open-editor") editor.open();
  });

  boot();
})();
