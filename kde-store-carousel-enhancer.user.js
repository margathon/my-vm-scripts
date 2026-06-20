// ==UserScript==
// @name         KDE Store — Preview Thumbnails & Vim Keys
// @namespace    https://github.com/margathon/my-vm-scripts
// @version      1.1.2
// @description  Thumbnail preview strip, vim-style navigation, and fixed full-viewport cinema mode for KDE Store previews
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
  const SHELL_ID = 'product-media-slider-container';
  const VIEWPORT_LOCK_CLASS = 'kde-viewport-lock';

  const css = `
    #${SHELL_ID}.kde-viewport-shell,
    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
    }

    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS},
    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} .swiper-container,
    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} .swiper-wrapper,
    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} .swiper-slide,
    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} .image-viewer {
      height: var(--kde-preview-height) !important;
      min-height: var(--kde-preview-height) !important;
      max-height: var(--kde-preview-height) !important;
      width: 100% !important;
    }

    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} .image-viewer {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      overflow: hidden !important;
      background:
        radial-gradient(1200px 500px at 50% 0%, rgba(61, 174, 233, 0.08), transparent 60%),
        #0b0d10 !important;
    }

    ${MEDIA_ROOT}.${VIEWPORT_LOCK_CLASS} .image-viewer img {
      width: 100% !important;
      height: 100% !important;
      max-width: 100% !important;
      max-height: 100% !important;
      object-fit: contain !important;
      object-position: center center !important;
    }

    ${MEDIA_ROOT} {
      position: relative !important;
    }

    ${MEDIA_ROOT} .swiper-pagination {
      display: none !important;
    }

    ${MEDIA_ROOT} .carousel-control {
      height: calc(100% - 96px) !important;
      transition: height 220ms ease;
    }

    ${MEDIA_ROOT} .kde-thumbs-bar {
      position: absolute;
      left: 14px;
      right: 14px;
      bottom: 12px;
      z-index: 30;
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
      animation: kde-thumbs-in 260ms cubic-bezier(0.22, 1, 0.36, 1);
      pointer-events: auto;
    }

    @keyframes kde-thumbs-in {
      from { opacity: 0; transform: translateY(10px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    ${MEDIA_ROOT} .kde-thumbs-track-wrap {
      overflow: hidden;
      mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent);
      -webkit-mask-image: linear-gradient(90deg, transparent, #000 18px, #000 calc(100% - 18px), transparent);
    }

    ${MEDIA_ROOT} .kde-thumbs-track {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scroll-behavior: smooth;
      padding: 2px 2px 6px;
      scrollbar-width: thin;
      scrollbar-color: rgba(61, 174, 233, 0.45) transparent;
    }

    ${MEDIA_ROOT} .kde-thumbs-track::-webkit-scrollbar {
      height: 5px;
    }

    ${MEDIA_ROOT} .kde-thumbs-track::-webkit-scrollbar-thumb {
      background: rgba(61, 174, 233, 0.45);
      border-radius: 999px;
    }

    ${MEDIA_ROOT} .kde-thumb {
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

    ${MEDIA_ROOT} .kde-thumb:hover {
      opacity: 1;
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.32);
    }

    ${MEDIA_ROOT} .kde-thumb.is-active {
      opacity: 1;
      border-color: #3daee9;
      box-shadow:
        0 0 0 1px rgba(61, 174, 233, 0.35),
        0 6px 18px rgba(61, 174, 233, 0.28);
      transform: translateY(-2px) scale(1.04);
    }

    ${MEDIA_ROOT} .kde-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      pointer-events: none;
    }

    ${MEDIA_ROOT} .kde-thumbs-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      font: 500 11px/1.2 "Noto Sans", "Segoe UI", system-ui, sans-serif;
      color: rgba(255, 255, 255, 0.58);
    }

    ${MEDIA_ROOT} .kde-counter {
      color: rgba(255, 255, 255, 0.92);
      font-weight: 650;
      font-variant-numeric: tabular-nums;
    }

    ${MEDIA_ROOT} .kde-counter strong {
      color: #7fd3ff;
      font-size: 12px;
    }

    ${MEDIA_ROOT} .kde-keys-hint {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
    }

    ${MEDIA_ROOT} .kde-key {
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

    @media (max-width: 720px) {
      ${MEDIA_ROOT} .kde-thumbs-bar {
        left: 8px;
        right: 8px;
        bottom: 8px;
        padding: 8px 8px 6px;
      }

      ${MEDIA_ROOT} .kde-thumb {
        width: 56px;
        height: 38px;
      }

      ${MEDIA_ROOT} .kde-keys-hint span:not(.kde-key) {
        display: none;
      }
    }
  `;

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

  function viewportHeight() {
    const header = document.getElementById('site-header-container');
    const headerHeight = header?.getBoundingClientRect().height ?? 140;
    return Math.max(420, window.innerHeight - headerHeight);
  }

  function setViewportCssVar(height) {
    document.documentElement.style.setProperty('--kde-preview-height', `${height}px`);
  }

  const lockState = new WeakMap();

  function setLockedStyle(el, prop, value) {
    const cache = lockState.get(el) || {};
    if (cache[prop] === value) return;
    cache[prop] = value;
    lockState.set(el, cache);
    el.style.setProperty(prop, value, 'important');
  }

  function applyViewportLock(mediaRoot) {
    const shell = document.getElementById(SHELL_ID);
    const height = viewportHeight();
    const heightPx = `${height}px`;

    setViewportCssVar(height);
    mediaRoot.classList.add(VIEWPORT_LOCK_CLASS);
    shell?.classList.add('kde-viewport-shell');

    for (const el of [shell, mediaRoot]) {
      if (!el) continue;
      setLockedStyle(el, 'height', heightPx);
      setLockedStyle(el, 'min-height', heightPx);
      setLockedStyle(el, 'max-height', heightPx);
      setLockedStyle(el, 'width', '100%');
    }

    mediaRoot.querySelectorAll('.swiper-container, .swiper-wrapper, .swiper-slide, .image-viewer').forEach((el) => {
      setLockedStyle(el, 'height', heightPx);
      setLockedStyle(el, 'width', '100%');
    });

    mediaRoot.querySelectorAll('.image-viewer img').forEach((img) => {
      setLockedStyle(img, 'width', '100%');
      setLockedStyle(img, 'height', '100%');
      setLockedStyle(img, 'object-fit', 'contain');
      setLockedStyle(img, 'max-width', '100%');
      setLockedStyle(img, 'max-height', '100%');
    });
  }

  function finishCinemaLock(mediaRoot) {
    applyViewportLock(mediaRoot);
    mediaRoot.querySelector('.swiper-container')?.swiper?.update();
  }

  function enableCinemaMode(mediaRoot) {
    const shell = document.getElementById(SHELL_ID);
    const inCinema = mediaRoot.classList.contains('cinema-mode')
      && shell?.classList.contains('imgfull');

    if (inCinema) {
      finishCinemaLock(mediaRoot);
      return;
    }

    const img = mediaRoot.querySelector('.swiper-slide-active .image-viewer img')
      || mediaRoot.querySelector('.image-viewer img')
      || mediaRoot.querySelector('img[id^="slide-img-"]');

    if (!img) return;

    img.click();

    let attempts = 0;
    const waitForCinema = () => {
      const ready = mediaRoot.classList.contains('cinema-mode')
        && document.getElementById(SHELL_ID)?.classList.contains('imgfull');

      if (ready || attempts >= 40) {
        finishCinemaLock(mediaRoot);
        return;
      }

      attempts += 1;
      setTimeout(waitForCinema, 50);
    };

    waitForCinema();
  }

  function bindViewportLock(mediaRoot, swiper) {
    let lockRaf = 0;
    let lockTimer = 0;
    let lastHeight = 0;

    const scheduleLock = () => {
      if (lockRaf) return;
      lockRaf = requestAnimationFrame(() => {
        lockRaf = 0;
        const height = viewportHeight();
        if (height !== lastHeight) {
          lastHeight = height;
          applyViewportLock(mediaRoot);
        }
      });
    };

    const scheduleLockAfterTransition = () => {
      clearTimeout(lockTimer);
      lockTimer = setTimeout(() => {
        lastHeight = 0;
        applyViewportLock(mediaRoot);
      }, 150);
    };

    window.addEventListener('resize', scheduleLock, { passive: true });

    mediaRoot.addEventListener('click', (event) => {
      const img = event.target.closest('.image-viewer img');
      if (!img) return;

      if (!mediaRoot.classList.contains('cinema-mode')) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      lastHeight = 0;
      applyViewportLock(mediaRoot);
    }, true);

    if (swiper) {
      swiper.on('slideChangeTransitionEnd', scheduleLockAfterTransition);
      swiper.on('resize', scheduleLock);
    }
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

  function buildThumbnailBar(mediaRoot, swiper, slides) {
    mediaRoot.querySelector('.kde-thumbs-bar')?.remove();
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
        if (swiper) swiper.slideTo(i);
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
    hint.innerHTML = `
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

    meta.append(counter, hint);
    bar.append(trackWrap, meta);
    mediaRoot.appendChild(bar);

    return { bar, track, counter, thumbButtons };
  }

  function bindKeyboard(state) {
    if (state.keyboardBound) return;
    state.keyboardBound = true;

    document.addEventListener('keydown', (event) => {
      if (!state.active) return;
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(document.activeElement)) return;

      const key = event.key;
      let direction = null;

      if (key === 'ArrowRight' || key === 'l' || key === 'L' || key === 'k' || key === 'K') direction = 'next';
      if (key === 'ArrowLeft' || key === 'h' || key === 'H' || key === 'j' || key === 'J') direction = 'prev';
      if (!direction) return;

      event.preventDefault();
      event.stopPropagation();
      navigate(state.swiper, state.mediaRoot, direction);
    }, true);
  }

  function setActiveThumb(state, index) {
    state.thumbButtons.forEach((btn, i) => {
      btn.classList.toggle('is-active', i === index);
    });

    const realIndex = state.swiper?.realIndex ?? state.swiper?.activeIndex ?? index;
    state.counterEl.innerHTML = `<strong>${realIndex + 1}</strong> / ${state.slides.length}`;
    scrollThumbIntoView(state.trackEl, state.thumbButtons[realIndex]);
  }

  function enhanceMediaSlider(mediaRoot) {
    const container = mediaRoot.querySelector('.swiper-container');
    if (!container || ENHANCED.has(container)) return;
    if (!container.classList.contains('swiper-initialized')) return;

    const slides = collectSlides(container);
    if (!slides.length) return;

    ENHANCED.add(container);

    const swiper = container.swiper || container.__swiper__;
    bindViewportLock(mediaRoot, swiper);
    enableCinemaMode(mediaRoot);
    const ui = buildThumbnailBar(mediaRoot, swiper, slides);

    const state = {
      mediaRoot,
      container,
      swiper,
      slides,
      active: false,
      keyboardBound: false,
      trackEl: ui?.track ?? null,
      counterEl: ui?.counter ?? null,
      thumbButtons: ui?.thumbButtons ?? [],
    };

    bindKeyboard(state);

    const sync = () => {
      const idx = swiper?.realIndex ?? swiper?.activeIndex ?? 0;
      if (ui) setActiveThumb(state, idx);
    };

    sync();

    if (swiper) {
      swiper.on('slideChange', sync);
      swiper.on('slideChangeTransitionEnd', sync);
    }

    const setActive = (active) => {
      state.active = active;
      mediaRoot.classList.toggle('kde-thumbs-active', active);
    };

    const visibilityObserver = new IntersectionObserver((entries) => {
      setActive(entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.35));
    }, { threshold: [0, 0.35, 0.6] });

    visibilityObserver.observe(mediaRoot);

    mediaRoot.addEventListener('mouseenter', () => setActive(true));
    mediaRoot.addEventListener('mouseleave', () => {
      const rect = mediaRoot.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      setActive(inView && rect.top < window.innerHeight * 0.75);
    });

    mediaRoot.setAttribute('tabindex', '0');
    mediaRoot.addEventListener('focusin', () => setActive(true));
  }

  function scan(root = document) {
    root.querySelectorAll(MEDIA_ROOT).forEach(enhanceMediaSlider);
  }

  function boot() {
    injectStyles();
    scan();

    let scanTimer = 0;
    const scheduleScan = (root) => {
      clearTimeout(scanTimer);
      scanTimer = setTimeout(() => scan(root), 100);
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
      if (needsScan) scheduleScan(document);
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
