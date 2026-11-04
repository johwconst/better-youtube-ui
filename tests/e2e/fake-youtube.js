// Páginas que imitam o DOM do YouTube (só a estrutura que o Vitro usa).
// São servidas no lugar de https://www.youtube.com/ por interceptação de rede,
// então o content script injeta como no site real, sem depender da rede.

const lockup = (title, href = "/watch?v=abc123def45") => `
  <ytd-rich-item-renderer class="vt-test-video">
    <yt-lockup-view-model>
      <div class="ytLockupViewModelHost ytLockupViewModelVertical">
        <a class="ytLockupViewModelContentImage" href="${href}">
          <yt-thumbnail-view-model class="ytThumbnailViewModelHost">
            <div class="ytThumbnailViewModelImage" style="aspect-ratio:16/9;background:#345"></div>
          </yt-thumbnail-view-model>
        </a>
        <div class="ytLockupViewModelMetadata"><h3>${title}</h3></div>
      </div>
    </yt-lockup-view-model>
  </ytd-rich-item-renderer>`;

const shell = (page, { light = false } = {}) => `<!doctype html>
<html${light ? "" : " dark"} lang="en">
<head><meta charset="utf-8"><title>YouTube</title>
<style>
  /* paleta como a do YouTube: depende de html[dark] */
  html { --yt-sys-color-baseline--text-primary: #0f0f0f; }
  html[dark] { --yt-sys-color-baseline--text-primary: #f1f1f1; }
  body { margin: 0; font-family: sans-serif; color: var(--yt-sys-color-baseline--text-primary); }
  ytd-rich-grid-renderer { display: flex; flex-direction: column; } /* como no YouTube real */
  ytd-app, ytd-page-manager, ytd-browse, ytd-masthead,
  ytd-rich-item-renderer, ytd-rich-section-renderer, ytd-watch-flexy,
  ytd-search, ytd-section-list-renderer, ytd-item-section-renderer, ytd-video-renderer,
  grid-shelf-view-model { display: block; }
  #masthead-container { position: fixed; top: 0; left: 0; right: 0; height: 56px; z-index: 2020; }
  #container.ytd-masthead { display: flex; justify-content: space-between; align-items: center; height: 56px; }
  #page-manager { display: block; margin-left: 240px; }
  #contents.ytd-rich-grid-renderer { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
</style></head>
<body>
<ytd-app>
  <div id="masthead-container" class="ytd-app">
    <ytd-masthead>
      <div id="container" class="ytd-masthead">
        <div id="start">YouTube</div>
        <div id="center">search</div>
        <div id="end"><div id="buttons">buttons</div></div>
      </div>
    </ytd-masthead>
  </div>
  <tp-yt-app-drawer id="guide" style="position:fixed;top:56px;left:0;bottom:0;width:240px">
    <div id="contentContainer" style="position:absolute;top:0;bottom:0;left:0;width:240px">
      <div id="guide-content"><div id="guide-inner-content"><div id="sections">
        <ytd-guide-section-renderer>
          <ytd-guide-entry-renderer class="vt-test-guide-home" active><a title="Home" href="/">Home</a></ytd-guide-entry-renderer>
          <ytd-guide-entry-renderer class="vt-test-guide-shorts"><a title="Shorts" href="/shorts/">Shorts</a></ytd-guide-entry-renderer>
        </ytd-guide-section-renderer>
        <ytd-guide-section-renderer class="vt-test-guide-subs"><a href="/feed/subscriptions">Subscriptions</a></ytd-guide-section-renderer>
        <ytd-guide-section-renderer>
          <ytd-guide-entry-renderer class="vt-test-guide-history"><a href="/feed/history">History</a></ytd-guide-entry-renderer>
          <ytd-guide-entry-renderer class="vt-test-guide-wl"><a href="/playlist?list=WL">Watch later</a></ytd-guide-entry-renderer>
        </ytd-guide-section-renderer>
        <ytd-guide-section-renderer class="vt-test-guide-more"><a href="/premium">Premium</a></ytd-guide-section-renderer>
        <ytd-guide-section-renderer class="vt-test-guide-explore"><a href="/feed/storefront?bp=x">Movies</a></ytd-guide-section-renderer>
        <ytd-guide-section-renderer class="vt-test-guide-settings"><a href="/reporthistory">Report history</a></ytd-guide-section-renderer>
      </div><div id="footer" class="vt-test-guide-footer">About · Press</div></div></div>
    </div>
  </tp-yt-app-drawer>
  <ytd-page-manager id="page-manager" class="ytd-app">${page}</ytd-page-manager>
</ytd-app>
</body></html>`;

// Na busca, ytd-item-section-renderer é o contêiner dos resultados: a prateleira
// de Shorts vem misturada com os vídeos dentro da mesma seção.
export const searchPage = () =>
  shell(`
  <ytd-search>
    <ytd-section-list-renderer>
      <div id="contents" class="ytd-section-list-renderer">
        <ytd-item-section-renderer class="vt-test-section">
          <div id="contents" class="ytd-item-section-renderer">
            <ytd-video-renderer class="vt-test-result"><a href="/watch?v=abc123def45">Result 1</a></ytd-video-renderer>
            <grid-shelf-view-model class="vt-test-grid-shelf"><a href="/shorts/xyz987654">A short</a></grid-shelf-view-model>
            <ytd-video-renderer class="vt-test-result"><a href="/watch?v=abc123def46">Result 2</a></ytd-video-renderer>
          </div>
        </ytd-item-section-renderer>
        <ytd-continuation-item-renderer>Loading</ytd-continuation-item-renderer>
      </div>
    </ytd-section-list-renderer>
  </ytd-search>`);

export const homePage = ({ light = false } = {}) =>
  shell(`
  <ytd-browse page-subtype="home">
    <ytd-rich-grid-renderer>
      <div id="header" class="ytd-rich-grid-renderer">
        <ytd-feed-filter-chip-bar-renderer><div id="chips-wrapper" class="ytd-feed-filter-chip-bar-renderer">
          <yt-chip-cloud-chip-renderer><div class="ytChipShapeChip ytChipShapeActive">All</div></yt-chip-cloud-chip-renderer>
          <yt-chip-cloud-chip-renderer><div class="ytChipShapeChip">Music</div></yt-chip-cloud-chip-renderer>
        </div></ytd-feed-filter-chip-bar-renderer>
      </div>
      <div id="contents" class="ytd-rich-grid-renderer">
        ${lockup("Normal video 1")}
        ${lockup("Normal video 2")}
        <ytd-rich-item-renderer class="vt-test-ad"><ytd-ad-slot-renderer>Ad</ytd-ad-slot-renderer></ytd-rich-item-renderer>
        <ytd-rich-section-renderer class="vt-test-shorts-shelf">
          <ytd-rich-shelf-renderer is-shorts>Shorts shelf</ytd-rich-shelf-renderer>
        </ytd-rich-section-renderer>
        <ytd-rich-item-renderer class="vt-test-short-item"><a href="/shorts/xyz987654">A short</a></ytd-rich-item-renderer>
        ${lockup("Normal video 3")}
      </div>
    </ytd-rich-grid-renderer>
  </ytd-browse>`, { light });

export const watchPage = ({ ad = false } = {}) =>
  shell(`
  <ytd-watch-flexy>
    <div id="columns">
      <div id="primary">
        <div id="movie_player" class="html5-video-player${ad ? " ad-showing" : ""}">
          <video width="640" height="360"></video>
          ${ad ? `<button class="ytp-skip-ad-button" onclick="window.__skipped = (window.__skipped||0)+1">Skip</button>` : ""}
        </div>
        <ytd-watch-metadata><div id="description" class="ytd-watch-metadata">Description</div></ytd-watch-metadata>
        <ytd-comments id="comments">Comments</ytd-comments>
      </div>
      <div id="secondary">
        <div id="related">${lockup("Related video")}</div>
      </div>
    </div>
    <div class="ytp-ce-element vt-test-endscreen">End screen</div>
    <ytd-merch-shelf-renderer class="vt-test-merch">Merch</ytd-merch-shelf-renderer>
  </ytd-watch-flexy>`);
