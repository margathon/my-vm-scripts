// ==UserScript==
// @name         KDE Store — Preview Thumbnails & Vim Keys
// @namespace    https://github.com/margathon/my-vm-scripts
// @version      1.2.1
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
  const STYLE_ID = 'kde-store-carousel-enhancer-styles';
  const MEDIA_ROOT = '#media-slider';
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

    .kde-cinema-stage {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 0;
      width: 100%;
      padding: 20px 24px 108px;
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
    }

    .kde-cinema-hint {
      position: absolute;
      top: 16px;
      right: 18px;
      z-index: 2;
      font: 500 11px/1.2 "Noto Sans", "Segoe UI", system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.45);
      pointer-events: none;
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
        padding: 16px 12px 96px;
      }
    }
  `;

  let cinemaState = null;
  let overlayEl = null;

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

  function mediaFromSlide(slide) {
    const img = slide.querySelector('.image-viewer img, img');
    if (!img?.src) return null;
    return { src: img.currentSrc || img.src };
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

  function navigate(swiper, mediaRoot, direction) {
    if (swiper) {
      if (direction === 'next') swiper.slideNext();
      else swiper.slidePrev();
      return;
    }

    const selector = direction === 'next'
      ? '.carousel-control-right'
      : '.carousel-control-left';

    mediaRoot.querySelector(selector)?.click();
  }

  function keysHintHtml() {
    return `
      <span class="kde-key">←</span>
      <span class="kde-key">h</span>
      <span class="kde-key">j</span>
      <span>prev</span>
      <span style="opacity:.35">·</span>
      <span class="kde-key">→</span>
      <span class="kde-key">l</span>
      <span class="kde-key">k</span>
      <span>next</span>
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
  }

  function buildThumbnailBar(parent, swiper, slides, onSelect) {
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
    hint.innerHTML = keysHintHtml();

    meta.append(counter, hint);
    bar.append(trackWrap, meta);
    parent.appendChild(bar);

    return { bar, track, counter, thumbButtons };
  }

  function setActiveThumb(ui, state, index) {
    if (!ui) return;
    ui.thumbButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });

    const realIndex = state.swiper?.realIndex ?? state.swiper?.activeIndex ?? index;
    ui.counterEl.innerHTML = `<strong>${realIndex + 1}</strong> / ${state.slides.length}`;
    scrollThumbIntoView(ui.trackEl, ui.thumbButtons[realIndex]);
  }

  function getOrCreateOverlay() {
    if (overlayEl) return overlayEl;

    overlayEl = document.createElement('div');
    overlayEl.id = OVERLAY_ID;
    overlayEl.className = 'kde-cinema-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Fullscreen preview');

    const hint = document.createElement('div');
    hint.className = 'kde-cinema-hint';
    hint.textContent = 'Esc to close';

    const stage = document.createElement('div');
    stage.className = 'kde-cinema-stage';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'kde-cinema-image-wrap';

    const image = document.createElement('img');
    image.className = 'kde-cinema-image';
    image.alt = '';

    imageWrap.appendChild(image);
    stage.appendChild(imageWrap);
    overlayEl.append(hint, stage);
    document.body.appendChild(overlayEl);

    overlayEl.addEventListener('click', (event) => {
      if (event.target.closest('.kde-thumbs-bar, .kde-cinema-image')) return;
      if (event.target === overlayEl || event.target.closest('.kde-cinema-stage, .kde-cinema-image-wrap')) {
        closeCinema();
      }
    });

    return overlayEl;
  }

  function refreshCinemaImage() {
    if (!cinemaState || !overlayEl) return;
    const idx = cinemaState.swiper?.realIndex ?? cinemaState.swiper?.activeIndex ?? 0;
    const slide = cinemaState.slides[idx];
    const image = overlayEl.querySelector('.kde-cinema-image');
    if (slide && image) image.src = slide.src;
    setActiveThumb(cinemaState.cinemaUi, cinemaState, idx);
    if (cinemaState.ui) setActiveThumb(cinemaState.ui, cinemaState, idx);
  }

  function openCinema(state) {
    cinemaState = state;
    const overlay = getOrCreateOverlay();

    if (!state.cinemaUi) {
      state.cinemaUi = buildThumbnailBar(overlay, state.swiper, state.slides, (index) => {
        state.swiper?.slideTo(index);
        refreshCinemaImage();
      });
      if (state.cinemaUi) {
        bindThumbAutohide(state.cinemaUi.bar, overlay);
      }
    }

    refreshCinemaImage();
    overlay.classList.add('is-open');
    document.body.classList.add('kde-cinema-open');
    state.cinemaUi?.bar.classList.remove('kde-thumbs-hidden');
  }

  function closeCinema() {
    overlayEl?.classList.remove('is-open');
    document.body.classList.remove('kde-cinema-open');
    cinemaState = null;
  }

  function directionFromKey(key) {
    if (key === 'ArrowRight' || key === 'l' || key === 'L' || key === 'k' || key === 'K') return 'next';
    if (key === 'ArrowLeft' || key === 'h' || key === 'H' || key === 'j' || key === 'J') return 'prev';
    return null;
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

      const direction = directionFromKey(event.key);
      if (!direction) return;

      const active = cinemaState || (window.__kdeCarouselActiveState ?? null);
      if (!active) return;

      event.preventDefault();
      event.stopPropagation();
      navigate(active.swiper, active.mediaRoot, direction);

      if (cinemaState) refreshCinemaImage();
      else if (active.ui) {
        const idx = active.swiper?.realIndex ?? active.swiper?.activeIndex ?? 0;
        setActiveThumb(active.ui, active, idx);
      }
    }, true);
  }

  function bindCarouselKeyboard(state) {
    bindGlobalKeyboard();
    window.__kdeCarouselActiveState = state;
  }

  function bindCinemaOpen(state) {
    state.mediaRoot.addEventListener('click', (event) => {
      const img = event.target.closest('.image-viewer img');
      if (!img) return;

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
    const ui = buildThumbnailBar(mediaRoot, swiper, slides, (index) => {
      swiper?.slideTo(index);
      const idx = swiper?.realIndex ?? swiper?.activeIndex ?? index;
      setActiveThumb(ui, { swiper, slides }, idx);
    });

    const state = {
      mediaRoot,
      container,
      swiper,
      slides,
      ui,
      cinemaUi: null,
    };

    bindCarouselKeyboard(state);
    bindCinemaOpen(state);

    if (ui) {
      bindThumbAutohide(ui.bar, mediaRoot);
    }

    const sync = () => {
      const idx = swiper?.realIndex ?? swiper?.activeIndex ?? 0;
      if (ui) setActiveThumb(ui, state, idx);
      if (cinemaState === state) refreshCinemaImage();
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

  function scan(root = document) {
    root.querySelectorAll(MEDIA_ROOT).forEach(enhanceMediaSlider);
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
          if (node.matches?.(MEDIA_ROOT) || node.querySelector?.(MEDIA_ROOT)) {
            needsScan = true;
            break;
          }
        }
        if (needsScan) break;
      }
      if (needsScan) scheduleScan();
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    const stopWhenReady = setInterval(() => {
      const ready = document.querySelector(`${MEDIA_ROOT} .swiper-initialized`);
      if (ready) {
        observer.disconnect();
        clearInterval(stopWhenReady);
      }
    }, 250);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
