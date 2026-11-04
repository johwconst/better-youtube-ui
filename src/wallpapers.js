// Papéis de parede próprios, gerados em SVG (sem imagens externas).
(() => {
  // PRNG determinístico para estrelas/árvores ficarem sempre iguais.
  const rng = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const svg = (body, defs = "") =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><defs>${defs}</defs>${body}</svg>`;

  const stars = (n, seed, maxY) => {
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < n; i++) {
      s += `<circle cx="${(r() * 1600).toFixed(1)}" cy="${(r() * maxY).toFixed(1)}" r="${(r() * 1.4 + 0.3).toFixed(2)}" fill="#fff" opacity="${(r() * 0.7 + 0.2).toFixed(2)}"/>`;
    }
    return s;
  };

  const pines = (n, seed, baseY, minH, maxH, fill) => {
    const r = rng(seed);
    let s = "";
    for (let i = 0; i < n; i++) {
      const x = r() * 1640 - 20;
      const h = minH + r() * (maxH - minH);
      const w = h * 0.36;
      const y = baseY + r() * 30;
      s += `<path d="M${x} ${y - h} L${x + w / 2} ${y} L${x - w / 2} ${y}Z" fill="${fill}"/>`;
    }
    return s;
  };

  const ridge = (seed, baseY, amp, fill, steps = 14) => {
    const r = rng(seed);
    let d = `M0 900 L0 ${baseY}`;
    for (let i = 1; i <= steps; i++) {
      const x = (1600 / steps) * i;
      const y = baseY - r() * amp + amp / 2;
      d += ` L${x.toFixed(0)} ${y.toFixed(0)}`;
    }
    return `<path d="${d} L1600 900Z" fill="${fill}"/>`;
  };

  const crepusculo = svg(
    `<rect width="1600" height="900" fill="url(#s)"/>
     <circle cx="1050" cy="430" r="260" fill="url(#g)"/>
     <circle cx="1050" cy="430" r="70" fill="#ffd9a8" opacity=".9"/>
     ${ridge(7, 520, 160, "#8a3f4a", 9)}
     ${ridge(11, 600, 130, "#5e2a3d", 12)}
     ${ridge(23, 690, 90, "#3a1a2c", 16)}
     ${pines(40, 5, 800, 90, 200, "#24101c")}
     <rect y="800" width="1600" height="100" fill="#24101c"/>`,
    `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#2a1838"/><stop offset=".45" stop-color="#9a4256"/><stop offset=".8" stop-color="#f09a64"/></linearGradient>
     <radialGradient id="g"><stop offset="0" stop-color="#ffc68a" stop-opacity=".55"/><stop offset="1" stop-color="#ffc68a" stop-opacity="0"/></radialGradient>`
  );

  const noite = (() => {
    const r = rng(42);
    let city = "";
    for (let x = 0; x < 1600; ) {
      const w = 30 + r() * 60;
      const h = 60 + r() * (x > 900 && x < 1350 ? 260 : 120);
      city += `<rect x="${x.toFixed(0)}" y="${(560 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}" fill="#1a1230"/>`;
      for (let k = 0; k < h / 18; k++) {
        if (r() > 0.75) city += `<rect x="${(x + 6 + r() * (w - 12)).toFixed(0)}" y="${(560 - h + 8 + k * 18).toFixed(0)}" width="3" height="5" fill="#ffcf8a" opacity=".7"/>`;
      }
      x += w + 2;
    }
    return svg(
      `<rect width="1600" height="900" fill="url(#s)"/>
       ${stars(160, 3, 450)}
       <circle cx="330" cy="170" r="46" fill="#f4e9d8"/>
       <circle cx="350" cy="160" r="44" fill="#1d1638" opacity=".25"/>
       ${city}
       <rect y="560" width="1600" height="340" fill="url(#w)"/>
       <g opacity=".25" transform="translate(0 1120) scale(1 -1)">${city}</g>
       <rect y="560" width="1600" height="340" fill="url(#w)" opacity=".7"/>`,
      `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#090c22"/><stop offset=".6" stop-color="#2d1c48"/><stop offset="1" stop-color="#5b2c52"/></linearGradient>
       <linearGradient id="w" x1="0" y1="0" x2="0" y2="1">
         <stop offset="0" stop-color="#3a2050"/><stop offset="1" stop-color="#0d0a1c"/></linearGradient>`
    );
  })();

  const ondas = svg(
    `<rect width="1600" height="900" fill="#0d0b1e"/>
     <path d="M0 300 C300 200 500 420 800 330 S1300 180 1600 300 L1600 900 L0 900Z" fill="#2b1b5e" opacity=".9"/>
     <path d="M0 430 C350 330 600 560 900 450 S1350 340 1600 440 L1600 900 L0 900Z" fill="#4a2a8a" opacity=".85"/>
     <path d="M0 560 C300 480 650 680 950 580 S1400 480 1600 580 L1600 900 L0 900Z" fill="#d0567a" opacity=".85"/>
     <path d="M0 690 C380 620 620 800 980 700 S1420 640 1600 710 L1600 900 L0 900Z" fill="#f59a5c" opacity=".9"/>
     <path d="M0 800 C400 760 700 880 1050 800 S1450 770 1600 810 L1600 900 L0 900Z" fill="#ffd27a"/>`
  );

  const inverno = svg(
    `<rect width="1600" height="900" fill="url(#s)"/>
     ${stars(60, 9, 300)}
     ${ridge(17, 470, 180, "#9fb4cf", 8)}
     ${ridge(19, 560, 120, "#c9d6e6", 11)}
     ${pines(30, 13, 640, 120, 230, "#2f4560")}
     ${ridge(29, 700, 60, "#e8eef6", 10)}
     ${pines(22, 31, 820, 160, 300, "#1c2c40")}
     <rect y="820" width="1600" height="80" fill="#f2f6fb"/>`,
    `<linearGradient id="s" x1="0" y1="0" x2="0" y2="1">
       <stop offset="0" stop-color="#1b2a44"/><stop offset=".7" stop-color="#58739a"/><stop offset="1" stop-color="#9db3cf"/></linearGradient>`
  );

  const aurora = svg(
    `<rect width="1600" height="900" fill="#040912"/>
     ${stars(220, 77, 600)}
     <g filter="url(#b)" opacity=".85">
       <ellipse cx="500" cy="300" rx="520" ry="70" fill="#2fe6a6" transform="rotate(-12 500 300)"/>
       <ellipse cx="1050" cy="250" rx="480" ry="60" fill="#3fb4ff" transform="rotate(8 1050 250)"/>
       <ellipse cx="800" cy="380" rx="420" ry="40" fill="#a35cff" transform="rotate(-4 800 380)"/>
     </g>
     ${ridge(51, 640, 200, "#0b1a24", 10)}
     ${ridge(53, 730, 100, "#06111a", 14)}
     ${pines(36, 57, 860, 80, 180, "#030a10")}
     <rect y="860" width="1600" height="40" fill="#030a10"/>`,
    `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60"/></filter>`
  );

  const cor = svg(
    `<rect width="1600" height="900" fill="#0e0c14"/>
     <g filter="url(#b)">
       <circle cx="300" cy="200" r="380" fill="#7a1430" opacity=".8"/>
       <circle cx="1300" cy="750" r="420" fill="#2a1460" opacity=".8"/>
     </g>`,
    `<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="120"/></filter>`
  );

  const toUrl = (s) => `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(s)}")`;

  // Imagens empacotadas em assets/ (fonte original em wallpapers/)
  const IMAGES = [
    ["brasa", "Brasa"],
    ["rubi", "Rubi"],
    ["lampejo", "Lampejo"],
    ["anil", "Anil"],
    ["neon-azul", "Neon azul"],
    ["oceano", "Oceano"],
    ["prisma", "Prisma"],
    ["fluxo", "Fluxo"],
    ["amanhecer", "Amanhecer"],
    ["lua-nascente", "Lua nascente"],
    ["eclipse", "Eclipse"],
  ];
  const asset = (path) => (globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL(path) : path);
  const images = IMAGES.map(([id, name]) => ({
    id,
    name,
    css: `url("${asset(`assets/wallpapers/${id}.jpg`)}")`,
    thumb: `url("${asset(`assets/thumbs/${id}.jpg`)}")`,
  }));

  globalThis.VITRO_WALLPAPERS = [
    ...images,
    { id: "cor", name: "Cor", css: toUrl(cor) },
    { id: "ondas", name: "Ondas", css: toUrl(ondas) },
    { id: "crepusculo", name: "Crepúsculo", css: toUrl(crepusculo) },
    { id: "noite", name: "Noite", css: toUrl(noite) },
    { id: "inverno", name: "Inverno", css: toUrl(inverno) },
    { id: "aurora", name: "Aurora", css: toUrl(aurora) },
  ];
})();
