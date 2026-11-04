// Vitro — content script
(() => {
  const html = document.documentElement;
  const WALLS = globalThis.VITRO_WALLPAPERS;
  let S = { ...globalThis.VITRO_DEFAULTS };
  let customImage = null;

  // ---------------------------------------------------------------------
  // Shorts → vídeo normal (antes de qualquer render)
  // ---------------------------------------------------------------------
  function redirectShorts() {
    if (!S.enabled || !S.hideShorts) return;
    const m = location.pathname.match(/^\/shorts\/([\w-]{6,})/);
    if (m) location.replace(`/watch?v=${m[1]}`);
  }

  // ---------------------------------------------------------------------
  // Aplicar configurações → classes e variáveis no <html>
  // ---------------------------------------------------------------------
  function setClass(name, on) {
    html.classList.toggle(name, !!on);
  }

  function applySettings() {
    const on = S.enabled;
    setClass("vt-on", on);
    setClass("vt-no-shorts", on && S.hideShorts);
    setClass("vt-no-ads", on && S.blockAds);
    setClass("vt-no-related", on && S.hideRelated);
    setClass("vt-no-endscreens", on && S.hideEndscreens);
    setClass("vt-no-merch", on && S.hideMerch);
    setClass("vt-sidebar-glass", on && S.sidebarGlass);
    setClass("vt-cards", on && S.cards);
    setClass("vt-card-over", S.cardTitle === "over");
    setClass("vt-card-borders", S.cardBorders);
    setClass("vt-layout-air", S.cardLayout === "air");
    setClass("vt-layout-dense", S.cardLayout === "dense");
    setClass("vt-hero", on && S.hero);
    setClass("vt-greet", S.greet);
    setClass("vt-light", on && S.light);
    setClass("vt-snow-on", on && S.hero && S.snow);
    setClass("vt-room", on && S.room);

    const st = html.style;
    const glass = {
      glass: { alpha: S.glassAlpha / 100, blur: S.glassBlur },
      frost: { alpha: Math.min(0.85, S.glassAlpha / 100 + 0.25), blur: Math.round(S.glassBlur * 1.8) },
      solid: { alpha: 0.96, blur: 0 },
    }[S.glassStyle] || { alpha: 0.48, blur: 14 };
    st.setProperty("--vt-glass-alpha", glass.alpha);
    st.setProperty("--vt-blur", glass.blur + "px");
    st.setProperty("--vt-accent", S.accent);
    st.setProperty("--vt-card-text", S.cardText / 100);
    st.setProperty("--vt-feed-w", S.feedWidth);
    st.setProperty("--vt-bg-dim", S.bgDim / 100);
    st.setProperty("--vt-bg-blur", S.bgBlur + "px");
    st.setProperty("--vt-light-color", S.lightColor);
    st.setProperty("--vt-light-dark", S.lightDark / 100);

    updateWallpaper();
    updateHero();
    snow.toggle(on && S.hero && S.snow);
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

  function updateWallpaper() {
    if (!layers.wall) return;
    let css;
    if (S.wallpaper === "custom" && customImage) css = `url("${customImage}")`;
    else css = (WALLS.find((w) => w.id === S.wallpaper) || WALLS.find((w) => w.id === globalThis.VITRO_DEFAULTS.wallpaper)).css;
    if (layers.wall.dataset.bg !== css) {
      layers.wall.style.backgroundImage = css;
      layers.wall.dataset.bg = css;
    }
  }

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
    const h = new Date().getHours();
    if (h < 5) return "Boa noite,";
    if (h < 12) return "Bom dia,";
    if (h < 18) return "Boa tarde,";
    return "Boa noite,";
  }

  function heroHeight() {
    return Math.round(Math.min(Math.max(innerHeight * 0.44, 300), 460));
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
        el("h2", "vt-section", "Recomendados")
      );
    }
    if (!hero.isConnected) document.body.appendChild(hero);
    hero.querySelector(".vt-date").textContent = new Date().toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    hero.querySelector(".vt-hello").textContent = greeting();
    hero.querySelector(".vt-title span").textContent = S.name.trim() || "que bom te ver";
    html.style.setProperty("--vt-hero-h", heroHeight() + "px");
    positionHero();
  }

  function positionHero() {
    if (!hero || !html.classList.contains("vt-home")) return;
    const grid = document.querySelector('ytd-browse[page-subtype="home"] ytd-rich-grid-renderer #contents');
    const ref = grid?.getBoundingClientRect();
    const left = ref && ref.width ? ref.left + 8 : 260;
    hero.style.left = left + scrollX + "px";
    hero.style.width = (ref && ref.width ? ref.width - 16 : innerWidth - left - 40) + "px";
  }
  addEventListener("resize", () => {
    html.style.setProperty("--vt-hero-h", heroHeight() + "px");
    positionHero();
  });

  // ---------------------------------------------------------------------
  // Rotas do SPA do YouTube
  // ---------------------------------------------------------------------
  function route() {
    redirectShorts();
    const p = location.pathname;
    const isHome = p === "/" || p === "/feed/home" || p === "";
    const isWatch = p === "/watch";
    setClass("vt-home", isHome);
    setClass("vt-watch", isWatch);
    if (isWatch && S.enabled && S.room) room.start();
    else room.stop();
    if (isHome) {
      updateHero();
      // a grade pode demorar a montar
      setTimeout(positionHero, 300);
      setTimeout(positionHero, 1200);
    }
  }

  document.addEventListener("yt-navigate-start", redirectShorts);
  document.addEventListener("yt-navigate-finish", route);
  document.addEventListener("yt-page-data-updated", route);

  // Abrir/fechar o menu lateral muda a largura da grade
  const ro = new ResizeObserver(() => positionHero());

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
    b.title = "Personalizar (Vitro)";
    b.setAttribute("aria-label", "Personalizar aparência");
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
      el.append(...kids.flat().filter((k) => k != null));
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

    function wallpapers() {
      const items = WALLS.map((w) =>
        h("button", { class: "vt-wall", "aria-pressed": String(S.wallpaper === w.id), onclick: () => set("wallpaper", w.id) },
          h("i", { style: `background-image:${w.thumb || w.css}` }), w.name));
      if (customImage)
        items.push(h("button", { class: "vt-wall", "aria-pressed": String(S.wallpaper === "custom"), onclick: () => set("wallpaper", "custom") },
          h("i", { style: `background-image:url("${customImage}")` }), "Sua imagem"));
      const file = h("input", { type: "file", accept: "image/*", style: "display:none", onchange: (e) => loadImage(e.target.files[0]) });
      return [
        h("div", { class: "vt-walls" }, items),
        h("div", { class: "vt-row" },
          h("button", { class: "vt-btn", onclick: () => file.click() }, "Sua própria imagem…"),
          customImage && h("button", { class: "vt-btn", onclick: removeImage }, "Remover"), file),
      ];
    }

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
      fundo: { title: "Fundo", body: () => [wallpapers(), slider("Escurecer", "bgDim", 0, 90, "%"), slider("Desfoque", "bgBlur", 0, 40, "px")] },
      destaque: {
        title: "Destaque", flash: "hero", master: "hero",
        body: () => [color("Cor de destaque", "accent"), toggle("Neve", "snow")],
      },
      saudacao: {
        title: "Saudação", flash: "hero", master: "greet",
        body: () => [text("Nome", "name", "Como devo te chamar?"), h("p", { class: "vt-hint" }, "Vazio mostra “que bom te ver”.")],
      },
      menu: {
        title: "Menu lateral", flash: "guide", master: "sidebarGlass",
        body: () => [h("p", { class: "vt-hint" }, "Painel de vidro flutuante para o menu lateral e o mini-menu.")],
      },
      cartoes: {
        title: "Cartões", master: "cards",
        body: () => [
          seg("Título", "cardTitle", [["below", "Sob a imagem"], ["over", "Sobre a imagem"]]),
          slider("Tamanho do texto", "cardText", 80, 130, "%"),
          seg("Disposição", "cardLayout", [["default", "Padrão"], ["air", "Ar"], ["dense", "Denso"]]),
          slider("Largura do feed", "feedWidth", 60, 100, "%"),
          toggle("Bordas", "cardBorders"),
        ],
      },
      luz: { title: "Luz", master: "light", body: () => [color("Cor", "lightColor"), slider("Escuridão em volta", "lightDark", 0, 70, "%")] },
      vidro: {
        title: "Vidro", flash: "masthead",
        body: () => [
          seg("Barras e painéis", "glassStyle", [["glass", "Vidro"], ["frost", "Fosco"], ["solid", "Sólido"]]),
          slider("Desfoque", "glassBlur", 0, 40, "px"),
          slider("Transparência", "glassAlpha", 10, 90, "%"),
        ],
      },
      video: { title: "Página de vídeo", master: "room", body: () => [h("p", { class: "vt-hint" }, "O fundo vira o próprio vídeo, desfocado — como uma sala de cinema."), toggle("Esconder recomendados", "hideRelated")] },
      limpeza: {
        title: "Limpeza",
        body: () => [toggle("Esconder Shorts", "hideShorts"), toggle("Bloquear anúncios", "blockAds"), toggle("Esconder telas finais", "hideEndscreens"), toggle("Esconder produtos/merch", "hideMerch")],
      },
    };

    function build() {
      if (bar?.isConnected) return;
      bar = h("div", { id: "vt-editor", role: "toolbar", "aria-label": "Editor do Vitro" },
        h("span", { class: "vt-ed-label" }, "Clique no que quer mudar"),
        Object.entries(PANELS).map(([id, p]) =>
          h("button", { class: "vt-tab", "data-id": id, "aria-pressed": "false", onclick: () => openPanel(id) }, p.title)),
        h("button", { class: "vt-done", onclick: () => close() }, "Pronto"));
      panel = h("div", { id: "vt-panel", role: "dialog" });
      document.body.append(bar, panel);
    }

    function renderPanel(id) {
      const p = PANELS[id];
      const head = h("div", { class: "vt-head" }, h("h3", {}, p.title),
        p.master && h("button", { class: "vt-switch", role: "switch", "aria-checked": String(!!S[p.master]), "aria-label": "Ativar " + p.title, onclick: () => set(p.master, !S[p.master]) }),
        h("button", { class: "vt-x", "aria-label": "Fechar", onclick: () => openPanel(null) }, "✕"));
      // preserva o foco em campos de texto ao re-renderizar
      const active = document.activeElement;
      if (panel.contains(active) && active.type === "text") return;
      panel.replaceChildren(head, ...p.body().flat());
    }

    function openPanel(id) {
      if (id === current || !id) {
        current = null;
        panel.classList.remove("vt-open");
      } else {
        current = id;
        renderPanel(id);
        panel.classList.add("vt-open");
        const tab = bar.querySelector(`[data-id="${id}"]`).getBoundingClientRect();
        const left = Math.min(Math.max(tab.left + tab.width / 2 - 150, 12), innerWidth - 312);
        panel.style.left = left + "px";
      }
      bar.querySelectorAll(".vt-tab").forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.id === current)));
      for (const f of ["masthead", "guide", "hero"]) setClass("vt-flash-" + f, current && PANELS[current].flash === f);
    }

    function open() {
      build();
      setClass("vt-editing", true);
    }
    function close() {
      openPanel(null);
      setClass("vt-editing", false);
    }
    return {
      toggle: () => (html.classList.contains("vt-editing") ? close() : open()),
      open,
      close,
    };
  })();

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
    };
    if (document.body) onBody();
    else document.addEventListener("DOMContentLoaded", onBody, { once: true });

    // A masthead e a grade são montadas sob demanda pelo YouTube
    const mo = new MutationObserver(() => {
      if (!document.body) return;
      if (!layers.wall?.isConnected) ensureLayers() && applySettings();
      ensureEditButton();
      const pm = document.querySelector("ytd-page-manager");
      if (pm && !pm.dataset.vtObserved) {
        pm.dataset.vtObserved = "1";
        ro.observe(pm);
      }
    });
    mo.observe(html, { childList: true, subtree: true });
    setTimeout(() => mo.disconnect(), 20000); // depois disso, só as rotas
    setInterval(ensureEditButton, 3000);
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.settings) {
      S = { ...globalThis.VITRO_DEFAULTS, ...changes.settings.newValue };
      applySettings();
      route();
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "vt-open-editor") editor.open();
  });

  boot();
})();
