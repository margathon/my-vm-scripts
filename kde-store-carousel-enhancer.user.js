// ==UserScript==
// @name         KDE Store — Preview Thumbnails & Vim Keys
// @namespace    https://github.com/margathon/my-vm-scripts
// @version      1.3.1
// @description  Thumbnail preview strip, vim-style navigation, and a fullscreen cinema overlay for KDE Store previews
// @author       margathon
// @match        https://store.kde.org/*
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/margathon/my-vm-scripts/main/kde-store-carousel-enhancer.user.js
// @downloadURL  https://raw.githubusercontent.com/margathon/my-vm-scripts/main/kde-store-carousel-enhancer.user.js
// ==/UserScript==

(() => {
  'use strict';

  const ENHANCED = new WeakSet();
  const BROWSE_ENHANCED = new WeakSet();
  const STYLE_ID = 'kde-store-carousel-enhancer-styles';
  const MEDIA_ROOT = '#media-slider';
  const BROWSE_ROOT = '#product-browse';
  const OVERLAY_ID = 'kde-cinema-overlay';
  const THUMB_HIDE_MS = 1000;

  const css = `
    ${MEDIA_ROOT} {
      position: relative !important;
    }

    ${MEDIA_ROOT} .swiper-pagination {
      display: none !important;
    }

    ${MEDIA_ROOT} .kde-thumbs-bar,
    .kde-cinema-overlay .kde-thumbs-bar {
      position: absolute;
      left: 50%;
      right: auto;
      bottom: 12px;
      z-index: 30;
      width: max-content;
      max-width: calc(100% - 28px);
      padding: 10px 12px 8px;
      border-radius: 16px;
      background: linear-gradient(
        180deg,
        rgba(18, 22, 28, 0.55) 0%,
        rgba(10, 12, 16, 0.82) 100%
      );
      border: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow:
        0 14px 40px rgba(0, 0, 0, 0.35),
        inset 0 1px 0 rgba(255, 255, 255, 0.08);
      backdrop-filter: blur(16px) saturate(130%);
      -webkit-backdrop-filter: blur(16px) saturate(130%);
      pointer-events: auto;
      opacity: 1;
      transform: translateX(-50%) translateY(0);
      transition:
        opacity 280ms ease,
        transform 280ms ease;
    }

    ${MEDIA_ROOT} .kde-thumbs-bar {
      animation: kde-thumbs-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .kde-thumbs-bar.kde-thumbs-hidden {
      opacity: 0;
      transform: translateX(-50%) translateY(10px);
      pointer-events: none;
    }

    @keyframes kde-thumbs-in {
      from { opacity: 0; transform: translateX(-50%) translateY(10px); }
      to   { opacity: 1; transform: translateX(-50%) translateY(0); }
    }

    ${MEDIA_ROOT} .kde-thumbs-track-wrap,
    .kde-cinema-overlay .kde-thumbs-track-wrap {
      width: max-content;
      max-width: 100%;
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent);
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent);
    }

    ${MEDIA_ROOT} .kde-thumbs-track,
    .kde-cinema-overlay .kde-thumbs-track {
      display: flex;
      gap: 8px;
      width: max-content;
      max-width: 100%;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 2px 2px 6px;
      scrollbar-width: thin;
      scrollbar-color: rgba(61, 174, 233, 0.45) transparent;
    }

    ${MEDIA_ROOT} .kde-thumbs-track::-webkit-scrollbar,
    .kde-cinema-overlay .kde-thumbs-track::-webkit-scrollbar {
      height: 5px;
    }

    ${MEDIA_ROOT} .kde-thumbs-track::-webkit-scrollbar-thumb,
    .kde-cinema-overlay .kde-thumbs-track::-webkit-scrollbar-thumb {
      background: rgba(61, 174, 233, 0.45);
      border-radius: 999px;
    }

    ${MEDIA_ROOT} .kde-thumb,
    .kde-cinema-overlay .kde-thumb {
      flex: 0 0 auto;
      position: relative;
      width: 68px;
      height: 44px;
      padding: 0;
      border: 2px solid rgba(255, 255, 255, 0.14);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.05);
      overflow: hidden;
      cursor: pointer;
      transition:
        transform 160ms ease,
        border-color 160ms ease,
        box-shadow 160ms ease,
        opacity 160ms ease;
      opacity: 0.7;
    }

    ${MEDIA_ROOT} .kde-thumb:hover,
    .kde-cinema-overlay .kde-thumb:hover {
      opacity: 1;
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.32);
    }

    ${MEDIA_ROOT} .kde-thumb.is-active,
    .kde-cinema-overlay .kde-thumb.is-active {
      opacity: 1;
      border-color: #3daee9;
      box-shadow:
        0 0 0 1px rgba(61, 174, 233, 0.35),
        0 6px 18px rgba(61, 174, 233, 0.28);
      transform: translateY(-2px) scale(1.04);
    }

    ${MEDIA_ROOT} .kde-thumb img,
    .kde-cinema-overlay .kde-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      pointer-events: none;
    }

    ${MEDIA_ROOT} .kde-thumbs-meta,
    .kde-cinema-overlay .kde-thumbs-meta {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font: 500 11px/1.2 "Noto Sans", "Segoe UI", system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.58);
    }

    ${MEDIA_ROOT} .kde-counter,
    .kde-cinema-overlay .kde-counter {
      color: rgba(255, 255, 255, 0.92);
      font-weight: 650;
      font-variant-numeric: tabular-nums;
    }

    ${MEDIA_ROOT} .kde-counter strong,
    .kde-cinema-overlay .kde-counter strong {
      color: #7fd3ff;
      font-size: 12px;
    }

    ${MEDIA_ROOT} .kde-keys-hint,
    .kde-cinema-overlay .kde-keys-hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    ${MEDIA_ROOT} .kde-key,
    .kde-cinema-overlay .kde-key {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 5px;
      border-radius: 5px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background: rgba(255, 255, 255, 0.07);
      color: rgba(255, 255, 255, 0.86);
      font: 600 10px/1 ui-monospace, "JetBrains Mono", Menlo, monospace;
      box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.22);
    }

    .kde-cinema-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: none;
      flex-direction: column;
      background:
        radial-gradient(1200px 600px at 50% 0%, rgba(61, 174, 233, 0.1), transparent 55%),
        rgba(6, 8, 12, 0.96);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .kde-cinema-overlay.is-open {
      display: flex;
    }

    body.kde-cinema-open {
      overflow: hidden !important;
    }

    .kde-cinema-title {
      position: absolute;
      top: 16px;
      left: 18px;
      right: 140px;
      z-index: 2;
      font: 600 15px/1.3 "Noto Sans", "Segoe UI", system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.88);
      pointer-events: none;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .kde-cinema-hint {
      position: absolute;
      top: 16px;
      right: 18px;
      z-index: 2;
      font: 500 11px/1.2 "Noto Sans", "Segoe UI", system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.45);
      pointer-events: none;
      text-align: right;
    }

    .kde-cinema-stage {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      width: 100%;
      padding: 48px 24px 108px;
      box-sizing: border-box;
    }

    .kde-cinema-image-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
    }

    .kde-cinema-image {
      display: block;
      width: 100%;
      height: auto;
      max-height: 100%;
      object-fit: contain;
      object-position: center center;
      user-select: none;
      -webkit-user-drag: none;
      transition: opacity 180ms ease;
    }

    .kde-cinema-image.kde-image-loading {
      opacity: 0.35;
    }

    .product-browse-item-picture.kde-browse-active {
      outline: 2px solid rgba(61, 174, 233, 0.75);
      outline-offset: 2px;
      border-radius: 8px;
    }

    @media (max-width: 720px) {
      ${MEDIA_ROOT} .kde-thumbs-bar,
      .kde-cinema-overlay .kde-thumbs-bar {
        max-width: calc(100% - 16px);
        bottom: 8px;
        padding: 8px 8px 6px;
      }

      ${MEDIA_ROOT} .kde-thumb,
      .kde-cinema-overlay .kde-thumb {
        width: 56px;
        height: 38px;
      }

      ${MEDIA_ROOT} .kde-keys-hint span:not(.kde-key),
      .kde-cinema-overlay .kde-keys-hint span:not(.kde-key) {
        display: none;
      }

      .kde-cinema-stage {
        padding: 40px 12px 96px;
      }
    }
  `;

  let cinemaState = null;
  let overlayEl = null;
  const galleryCache = new Map();
  let pendingImageLoad = 0;

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    if (typeof GM_addStyle === 'function') {
      GM_addStyle(css);
      return;
    }
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = css;
    document.documentElement.appendChild(style);
  }

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }

  function upscaleImageUrl(url) {
    if (!url || !url.includes('/cache/')) return url;
    return url.replace(/\/cache\/\d+x\d+\/img\//, '/img/');
  }

  function preloadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(src);
      img.onerror = () => reject(new Error(`Failed to load ${src}`));
      img.src = src;
    });
  }

  function preloadSlides(slides) {
    slides.forEach(({ src }) => {
      preloadImage(src).catch(() => {});
    });
  }

  async function loadGallery(productId) {
    const cached = galleryCache.get(productId);
    if (cached) {
      return cached instanceof Promise ? cached : Promise.resolve(cached);
    }

    const promise = fetchProductGallery(productId)
      .then((result) => {
        const entry = result || { title: '', slides: null };
        galleryCache.set(productId, entry);
        if (entry.slides?.length) preloadSlides(entry.slides);
        return entry;
      })
      .catch(() => {
        galleryCache.delete(productId);
        return null;
      });

    galleryCache.set(productId, promise);
    return promise;
  }

  function prefetchBrowseGalleries(state) {
    if (state.kind !== 'browse') return;
    for (const offset of [1, -1, 2, -2]) {
      const item = state.browseItems[state.browseIndex + offset];
      if (item) loadGallery(item.id);
    }
  }

  function mediaFromSlide(slide) {
    const img = slide.querySelector('.image-viewer img, img');
    if (!img?.src) return null;
    return { src: upscaleImageUrl(img.currentSrc || img.src) };
  }

  function collectSlides(container) {
    return [...container.querySelectorAll('.swiper-slide:not(.swiper-slide-duplicate)')]
      .map((slide, index) => {
        const media = mediaFromSlide(slide);
        if (!media) return null;
        return { index, slide, ...media };
      })
      .filter(Boolean);
  }

  function collectBrowseItems() {
    return [...document.querySelectorAll('.product-browse-item-picture')]
      .map((element, index) => {
        const link = element.querySelector('a[href*="/p/"]');
        const img = element.querySelector('img');
        const id = link?.href.match(/\/p\/(\d+)/)?.[1];
        if (!id || !img?.src) return null;
        return {
          index,
          id,
          href: link.href,
          title: element.querySelector('h2')?.textContent?.trim() || `Product ${id}`,
          previewSrc: img.currentSrc || img.src,
          element,
        };
      })
      .filter(Boolean);
  }

  async function fetchProductGallery(productId) {
    const res = await fetch(`/p/${productId}`, { credentials: 'same-origin' });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/productViewDataEncoded\s*=\s*["']([^"']+)["']/);
    if (!match) return null;
    const data = JSON.parse(atob(match[1]));
    const slides = (data.pics || []).map((src) => ({ src: upscaleImageUrl(src) }));
    return {
      title: data.product?.title || '',
      slides: slides.length ? slides : null,
    };
  }

  function scrollThumbIntoView(track, button) {
    if (!track || !button) return;
    const trackRect = track.getBoundingClientRect();
    const btnRect = button.getBoundingClientRect();
    if (btnRect.left < trackRect.left) {
      track.scrollLeft -= trackRect.left - btnRect.left + 12;
    } else if (btnRect.right > trackRect.right) {
      track.scrollLeft += btnRect.right - trackRect.right + 12;
    }
  }

  function currentSlideIndex(state) {
    if (state.swiper) {
      return state.swiper.realIndex ?? state.swiper.activeIndex ?? state.slideIndex ?? 0;
    }
    return state.slideIndex ?? 0;
  }

  function keysHintHtml(browseMode) {
    if (browseMode) {
      return `
        <span class="kde-key">f</span>
        <span>close</span>
        <span style="opacity:.35">·</span>
        <span class="kde-key">h</span>
        <span class="kde-key">l</span>
        <span>image</span>
        <span style="opacity:.35">·</span>
        <span class="kde-key">j</span>
        <span class="kde-key">k</span>
        <span>theme</span>
      `;
    }
    return `
      <span class="kde-key">f</span>
      <span>fullscreen</span>
      <span style="opacity:.35">·</span>
      <span class="kde-key">h</span>
      <span class="kde-key">l</span>
      <span>prev/next</span>
    `;
  }

  function bindThumbAutohide(bar, hoverRoot) {
    let hideTimer = 0;

    const show = () => {
      bar.classList.remove('kde-thumbs-hidden');
      clearTimeout(hideTimer);
      hideTimer = setTimeout(() => {
        bar.classList.add('kde-thumbs-hidden');
      }, THUMB_HIDE_MS);
    };

    hoverRoot.addEventListener('mousemove', show, { passive: true });
    hoverRoot.addEventListener('mouseenter', show, { passive: true });
    show();

    return { show };
  }

  function buildThumbnailBar(parent, slides, onSelect, options = {}) {
    parent.querySelector(':scope > .kde-thumbs-bar')?.remove();
    if (slides.length <= 1) return null;

    const bar = document.createElement('div');
    bar.className = 'kde-thumbs-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Preview thumbnails');

    const trackWrap = document.createElement('div');
    trackWrap.className = 'kde-thumbs-track-wrap';

    const track = document.createElement('div');
    track.className = 'kde-thumbs-track';

    const thumbButtons = slides.map((item, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'kde-thumb';
      btn.setAttribute('aria-label', `Preview image ${i + 1}`);
      btn.dataset.index = String(i);

      const img = document.createElement('img');
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = item.src;
      btn.appendChild(img);

      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect(i);
      });

      track.appendChild(btn);
      return btn;
    });

    trackWrap.appendChild(track);

    const meta = document.createElement('div');
    meta.className = 'kde-thumbs-meta';

    const counter = document.createElement('span');
    counter.className = 'kde-counter';

    const hint = document.createElement('span');
    hint.className = 'kde-keys-hint';
    hint.innerHTML = keysHintHtml(options.browseMode);

    meta.append(counter, hint);
    bar.append(trackWrap, meta);
    parent.appendChild(bar);

    return { bar, track, counter, thumbButtons };
  }

  function setActiveThumb(ui, state, index) {
    if (!ui) return;
    const idx = index ?? currentSlideIndex(state);
    ui.thumbButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === idx);
    });
    ui.counter.innerHTML = `<strong>${idx + 1}</strong> / ${state.slides.length}`;
    scrollThumbIntoView(ui.track, ui.thumbButtons[idx]);
  }

  function revealThumbs(state) {
    state.ui?.autohide?.show();
    state.cinemaUi?.autohide?.show();
  }

  function getOrCreateOverlay() {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.id = OVERLAY_ID;
    overlayEl.className = 'kde-cinema-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Fullscreen preview');

    const title = document.createElement('div');
    title.className = 'kde-cinema-title';

    const hint = document.createElement('div');
    hint.className = 'kde-cinema-hint';
    hint.textContent = 'Esc or f to close';

    const stage = document.createElement('div');
    stage.className = 'kde-cinema-stage';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'kde-cinema-image-wrap';

    const image = document.createElement('img');
    image.className = 'kde-cinema-image';
    image.alt = '';

    imageWrap.appendChild(image);
    stage.appendChild(imageWrap);
    overlayEl.append(title, hint, stage);
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener('click', (event) => {
      if (event.target.closest('.kde-thumbs-bar, .kde-cinema-image')) return;
      if (event.target === overlayEl || event.target.closest('.kde-cinema-stage, .kde-cinema-image-wrap')) {
        closeCinema();
      }
    });

    return overlayEl;
  }

  function rebuildCinemaThumbs(state) {
    const overlay = getOrCreateOverlay();
    state.cinemaUi = buildThumbnailBar(overlay, state.slides, (index) => {
      goToSlide(state, index);
      refreshViewer();
      revealThumbs(state);
    }, { browseMode: state.kind === 'browse' });

    if (state.cinemaUi) {
      state.cinemaUi.autohide = bindThumbAutohide(state.cinemaUi.bar, overlay);
    }
  }

  function updateBrowseHighlight(state) {
    if (state.kind !== 'browse') return;
    state.browseItems.forEach((item, i) => {
      item.element.classList.toggle('kde-browse-active', i === state.browseIndex);
    });
    state.browseItems[state.browseIndex]?.element.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function setCinemaImageSrc(src) {
    const image = overlayEl?.querySelector('.kde-cinema-image');
    if (!image || !src) return;

    if (image.dataset.loadedSrc === src) return;

    const loadId = ++pendingImageLoad;
    image.classList.add('kde-image-loading');

    preloadImage(src)
      .then((okSrc) => {
        if (loadId !== pendingImageLoad || cinemaState == null) return;
        image.src = okSrc;
        image.dataset.loadedSrc = okSrc;
        image.classList.remove('kde-image-loading');
      })
      .catch(() => {
        if (loadId !== pendingImageLoad) return;
        image.classList.remove('kde-image-loading');
      });
  }

  function refreshViewer() {
    if (!cinemaState || !overlayEl) return;
    const state = cinemaState;
    const idx = currentSlideIndex(state);
    const slide = state.slides[idx];
    const title = overlayEl.querySelector('.kde-cinema-title');

    if (slide) setCinemaImageSrc(slide.src);
    if (title) {
      if (state.kind === 'browse') {
        title.textContent = `${state.title || ''} (${state.browseIndex + 1}/${state.browseItems.length})`;
      } else {
        title.textContent = state.title || '';
      }
    }

    setActiveThumb(state.cinemaUi, state, idx);
    setActiveThumb(state.ui, state, idx);
  }

  async function loadBrowseItem(state) {
    const item = state.browseItems[state.browseIndex];
    if (!item) return;

    state.title = item.title;
    state.slideIndex = 0;
    updateBrowseHighlight(state);

    const cached = galleryCache.get(item.id);
    if (cached && !(cached instanceof Promise) && cached.slides?.length) {
      state.slides = cached.slides;
      if (cached.title) state.title = cached.title;
      rebuildCinemaThumbs(state);
      refreshViewer();
      prefetchBrowseGalleries(state);
      return;
    }

    state.slides = [{ src: item.previewSrc }];
    rebuildCinemaThumbs(state);
    refreshViewer();

    const gallery = await loadGallery(item.id);
    if (cinemaState !== state) return;
    if (gallery?.slides?.length) {
      state.slides = gallery.slides;
      if (gallery.title) state.title = gallery.title;
      rebuildCinemaThumbs(state);
      refreshViewer();
    }
    prefetchBrowseGalleries(state);
  }

  function goToSlide(state, index) {
    state.slideIndex = index;
    if (state.swiper) state.swiper.slideTo(index);
  }

  function navigateHorizontal(state, direction) {
    const delta = direction === 'next' ? 1 : -1;
    const count = state.slides.length;
    if (count <= 1) return false;

    let idx = currentSlideIndex(state) + delta;
    if (idx < 0) idx = count - 1;
    if (idx >= count) idx = 0;

    goToSlide(state, idx);
    return true;
  }

  function navigateBrowseItem(state, direction) {
    const delta = direction === 'next' ? 1 : -1;
    const next = state.browseIndex + delta;
    if (next < 0 || next >= state.browseItems.length) return false;
    state.browseIndex = next;
    loadBrowseItem(state);
    return true;
  }

  function openCinema(state) {
    cinemaState = state;
    const overlay = getOrCreateOverlay();

    if (!state.cinemaUi) rebuildCinemaThumbs(state);

    if (state.kind === 'browse') {
      loadBrowseItem(state);
    } else {
      refreshViewer();
    }

    prefetchBrowseGalleries(state);

    overlay.classList.add('is-open');
    document.body.classList.add('kde-cinema-open');
    revealThumbs(state);
  }

  function closeCinema() {
    if (cinemaState?.kind === 'browse') {
      cinemaState.browseItems.forEach((item) => {
        item.element.classList.remove('kde-browse-active');
      });
    }
    overlayEl?.classList.remove('is-open');
    document.body.classList.remove('kde-cinema-open');
    cinemaState = null;
  }

  function toggleCinema(state) {
    if (cinemaState === state) closeCinema();
    else openCinema(state);
  }

  function horizontalFromKey(key) {
    if (key === 'ArrowRight' || key === 'l' || key === 'L') return 'next';
    if (key === 'ArrowLeft' || key === 'h' || key === 'H') return 'prev';
    return null;
  }

  function verticalFromKey(key) {
    if (key === 'ArrowDown' || key === 'j' || key === 'J') return 'next';
    if (key === 'ArrowUp' || key === 'k' || key === 'K') return 'prev';
    return null;
  }

  function activeViewerState() {
    return cinemaState || window.__kdeCarouselActiveState || window.__kdeBrowseActiveState || null;
  }

  function bindGlobalKeyboard() {
    if (bindGlobalKeyboard.bound) return;
    bindGlobalKeyboard.bound = true;

    document.addEventListener('keydown', (event) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;

      if (event.key === 'Escape' && cinemaState) {
        event.preventDefault();
        event.stopPropagation();
        closeCinema();
        return;
      }

      const active = activeViewerState();
      if (!active) return;

      if (event.key === 'f' || event.key === 'F') {
        event.preventDefault();
        event.stopPropagation();
        toggleCinema(active);
        return;
      }

      const horizontal = horizontalFromKey(event.key);
      const vertical = verticalFromKey(event.key);

      if (!horizontal && !vertical) return;

      let handled = false;

      if (horizontal) {
        handled = navigateHorizontal(active, horizontal);
      }

      if (vertical && active.kind === 'browse' && cinemaState === active) {
        handled = navigateBrowseItem(active, vertical) || handled;
      }

      if (!handled) return;

      event.preventDefault();
      event.stopPropagation();
      refreshViewer();
      revealThumbs(active);
    }, true);
  }

  function bindCinemaOpen(state, selector) {
    const root = state.mediaRoot || state.browseRoot;
    root.addEventListener('click', (event) => {
      const img = event.target.closest(selector);
      if (!img) return;

      if (state.kind === 'browse') {
        const itemEl = event.target.closest('.product-browse-item-picture');
        const idx = state.browseItems.findIndex((item) => item.element === itemEl);
        if (idx >= 0) state.browseIndex = idx;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      openCinema(state);
    }, true);
  }

  function enhanceMediaSlider(mediaRoot) {
    const container = mediaRoot.querySelector('.swiper-container');
    if (!container || ENHANCED.has(container)) return;
    if (!container.classList.contains('swiper-initialized')) return;

    const slides = collectSlides(container);
    if (!slides.length) return;

    ENHANCED.add(container);

    const swiper = container.swiper || container.__swiper__;
    const state = {
      kind: 'product',
      mediaRoot,
      container,
      swiper,
      slides,
      slideIndex: 0,
      ui: null,
      cinemaUi: null,
    };

    state.ui = buildThumbnailBar(mediaRoot, state.slides, (index) => {
      goToSlide(state, index);
      refreshViewer();
      revealThumbs(state);
    });

    if (state.ui) {
      state.ui.autohide = bindThumbAutohide(state.ui.bar, mediaRoot);
    }

    bindGlobalKeyboard();
    bindCinemaOpen(state, '.image-viewer img');

    const sync = () => {
      state.slideIndex = currentSlideIndex(state);
      setActiveThumb(state.ui, state, state.slideIndex);
      if (cinemaState === state) refreshViewer();
    };

    sync();

    if (swiper) {
      swiper.on('slideChange', sync);
      swiper.on('slideChangeTransitionEnd', sync);
    }

    const setCarouselActive = (active) => {
      if (active) window.__kdeCarouselActiveState = state;
    };

    const visibilityObserver = new IntersectionObserver((entries) => {
      setCarouselActive(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35));
    }, { threshold: [0, 0.35, 0.6] });

    visibilityObserver.observe(mediaRoot);

    mediaRoot.addEventListener('mouseenter', () => setCarouselActive(true));
    mediaRoot.addEventListener('mouseleave', () => {
      const rect = mediaRoot.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      setCarouselActive(inView && rect.top < window.innerHeight * 0.75);
    });

    mediaRoot.setAttribute('tabindex', '0');
    mediaRoot.addEventListener('focusin', () => setCarouselActive(true));
  }

  function enhanceBrowsePage(browseRoot) {
    if (!browseRoot || BROWSE_ENHANCED.has(browseRoot)) return;

    const browseItems = collectBrowseItems();
    if (!browseItems.length) return;

    BROWSE_ENHANCED.add(browseRoot);

    const state = {
      kind: 'browse',
      browseRoot,
      browseItems,
      browseIndex: 0,
      slides: [],
      slideIndex: 0,
      ui: null,
      cinemaUi: null,
    };

    bindGlobalKeyboard();
    bindCinemaOpen(state, '.product-browse-item-picture img, .item-picture-cover img');

    window.__kdeBrowseActiveState = state;
    browseItems.slice(0, 4).forEach((item) => loadGallery(item.id));

    browseRoot.addEventListener('mouseover', (event) => {
      const itemEl = event.target.closest('.product-browse-item-picture');
      if (!itemEl) return;
      const idx = state.browseItems.findIndex((item) => item.element === itemEl);
      if (idx >= 0) {
        state.browseIndex = idx;
        window.__kdeBrowseActiveState = state;
      }
    }, { passive: true });
  }

  function scan(root = document) {
    root.querySelectorAll(MEDIA_ROOT).forEach(enhanceMediaSlider);
    const browse = root.querySelector(BROWSE_ROOT) || (root.matches?.(BROWSE_ROOT) ? root : null);
    if (browse) enhanceBrowsePage(browse);
  }

  function boot() {
    injectStyles();
    scan();

    let scanTimer = 0;
    const scheduleScan = () => {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => scan(document), 100);
    };

    const observer = new MutationObserver((mutations) => {
      let needsScan = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof Element)) continue;
          if (
            node.matches?.(MEDIA_ROOT)
            || node.querySelector?.(MEDIA_ROOT)
            || node.matches?.(BROWSE_ROOT)
            || node.querySelector?.(BROWSE_ROOT)
            || node.matches?.('.product-browse-item-picture')
          ) {
            needsScan = true;
            break;
          }
        }
        if (needsScan) break;
      }
      if (needsScan) scheduleScan();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
