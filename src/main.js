import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/sections.css';
import './styles/gate.css';
import './styles/lightbox.css';

import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initMobileScale } from './js/mobile-scale.js';
import { initI18n } from './js/i18n.js';
import { initSmoothScroll } from './js/lenis-setup.js';
import { initScrollAnimations } from './js/scroll-animations.js';
import { initHeroPin } from './js/hero-pin.js';
import { initLogoScale } from './js/logo-scale.js';
import { initGalleryScroll } from './js/gallery-scroll.js';
import { initSectionTransitions } from './js/section-transitions.js';
import { initLightbox } from './js/lightbox.js';
import { initMenu } from './js/menu.js';
import { initAnchorScroll } from './js/anchor-scroll.js';
import { initContactForm } from './js/contact-form.js';
import { initGate } from './js/gate.js';
import { initMediaFallback } from './js/media-fallback.js';
import { initFloorplanSpaces, syncSvgWithImage } from './js/floorplan-editor.js';
import { t } from './js/i18n.js';

function initFloorplanTabs() {
  const tabs = [...document.querySelectorAll('.floorplans__level')];
  const planImage = document.getElementById('floorplanImage');
  const planFallback = document.getElementById('floorplanFallback');
  const planCaption = document.getElementById('floorplanCaption');
  const stage = document.querySelector('.floorplans__stage');
  const rotateLeftBtn = document.getElementById('floorplanRotateLeft');
  const rotateRightBtn = document.getElementById('floorplanRotateRight');
  const compass = document.getElementById('floorplanCompass');
  if (!planImage || !planFallback) return;

  // Points N toward the site's actual orientation relative to the plan
  // artwork (measured against the reference the plan was drawn to).
  const COMPASS_BASE_ANGLE = -18;

  planFallback.dataset.i18nFallback = 'floorplans.tab1';

  function showFallback() {
    planImage.classList.add('media--hidden');
    planFallback.classList.remove('media--hidden');
    planFallback.textContent = t(planFallback.dataset.i18nFallback);
  }

  // planImage and planFallback are siblings, not a replace-on-error swap —
  // the image's src changes on every level click, so it has to be able to
  // recover (go back to showing a real image) if the other floor's file
  // exists.
  planImage.addEventListener('error', showFallback);

  // Same fast-404 race as media-fallback.js: the default src can already
  // have failed by the time this deferred script runs.
  if (planImage.complete && planImage.naturalWidth === 0) {
    showFallback();
  }

  function activate(tab) {
    tabs.forEach((el) => el.classList.remove('is-active'));
    tab.classList.add('is-active');

    planFallback.classList.add('media--hidden');
    planFallback.dataset.i18nFallback = tab.dataset.planFallback;
    planImage.classList.remove('media--hidden');
    planImage.alt = tab.getAttribute('aria-label');
    planImage.src = tab.dataset.planSrc;
    if (planCaption) {
      planCaption.dataset.i18n = tab.dataset.planName;
      planCaption.textContent = t(tab.dataset.planName);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => activate(tab));
  });

  // Orientation toggle: only two locked states, horizontal (0°) and
  // vertical (90°) — no 180°/270°, those aren't useful for a floor plan.
  // Left sets horizontal, right sets vertical, regardless of the current
  // state. Swaps the image's max-width/max-height budget when vertical
  // (measured live from the stage) since a CSS transform rotates in place
  // without changing the element's own layout box.
  let isVertical = false;

  function applyRotation() {
    const planAngle = isVertical ? 90 : 0;
    planImage.style.transform = `rotate(${planAngle}deg)`;

    // The compass indicates north relative to the plan's own geography, so
    // it has to turn along with the plan to stay accurate once vertical.
    if (compass) {
      compass.style.transform = `rotate(${COMPASS_BASE_ANGLE + planAngle}deg)`;
    }
    if (!stage) return;

    const stageRect = stage.getBoundingClientRect();
    const widthBudget = stageRect.width;
    const heightBudget = window.innerHeight * 0.76;

    if (isVertical) {
      // Rotated on its side: what fits in the available height now bounds
      // the image's width, and vice versa.
      planImage.style.maxWidth = `${heightBudget}px`;
      planImage.style.maxHeight = `${widthBudget}px`;
    } else {
      planImage.style.maxWidth = '100%';
      planImage.style.maxHeight = `${heightBudget}px`;
    }

    setTimeout(syncSvgWithImage, 50);
  }

  applyRotation();

  rotateLeftBtn?.addEventListener('click', () => {
    isVertical = false;
    applyRotation();
  });

  rotateRightBtn?.addEventListener('click', () => {
    isVertical = true;
    applyRotation();
  });

  window.addEventListener('resize', () => {
    if (isVertical) applyRotation();
  });

  document.addEventListener('app:langchange', () => {
    if (!planFallback.classList.contains('media--hidden')) {
      planFallback.textContent = t(planFallback.dataset.i18nFallback);
    }
  });
}

function initCinematicVideo() {
  const section = document.getElementById('cinematic');
  const video = document.getElementById('cinematicVideo');
  const fallback = document.getElementById('cinematicFallback');
  const playBtn = document.getElementById('cinematicPlayBtn');
  const label = document.getElementById('cinematicPlayLabel');
  if (!section || !video || !fallback || !playBtn || !label) return;

  function showFallback() {
    video.classList.add('media--hidden');
    fallback.classList.remove('media--hidden');
    playBtn.disabled = true;
  }

  video.addEventListener('error', showFallback);
  // Same fast-404 race as media-fallback.js: the file can already have
  // failed by the time this deferred script runs.
  if (video.error) {
    showFallback();
  }

  playBtn.addEventListener('click', () => {
    if (video.paused) {
      video.muted = false;
      video.play();
    } else {
      video.pause();
    }
  });

  video.addEventListener('play', () => {
    section.classList.add('is-playing');
    playBtn.classList.add('is-playing');
    label.textContent = t('cinematic.pauseLabel');
  });

  video.addEventListener('pause', () => {
    section.classList.remove('is-playing');
    playBtn.classList.remove('is-playing');
    label.textContent = t('cinematic.playLabel');
  });

  document.addEventListener('app:langchange', () => {
    label.textContent = t(video.paused ? 'cinematic.playLabel' : 'cinematic.pauseLabel');
  });
}

function hidePreloader() {
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  preloader.classList.add('is-hidden');
  window.setTimeout(() => {
    if (preloader && preloader.parentNode) {
      preloader.remove();
    }
  }, 1000);
}

// The preloader used to drop as soon as init() finished running — which
// happens near-instantly, well before the Google Fonts request has actually
// resolved. On a slow connection that revealed the page mid font-swap: full
// layout/colors already applied, but text still in the browser's fallback
// serif, reading as "unstyled". Now it waits for BOTH init() *and*
// document.fonts.ready (resolves once every font actually used on the page
// has loaded) before dropping, so the swap always happens behind the
// preloader instead of in front of the visitor.
let appReady = false;
let fontsReady = false;

function maybeHidePreloader() {
  if (appReady && fontsReady) hidePreloader();
}

function markFontsReady() {
  if (fontsReady) return;
  fontsReady = true;
  maybeHidePreloader();
}

function init() {
  try {
    initI18n();
    const lenis = initSmoothScroll();
    // Hero's height changes (100vh → 220vh) before anything below it gets
    // measured, so the reveal/counter triggers created next don't end up
    // anchored to stale positions.
    initHeroPin();
    initGalleryScroll();
    initSectionTransitions();
    initScrollAnimations();
    initLogoScale();
    initMenu(lenis);
    initAnchorScroll(lenis);
    initContactForm();
    initFloorplanTabs();
    initFloorplanSpaces();
    initCinematicVideo();
    initMediaFallback();
    initLightbox(lenis);
    initGate(lenis);

    // initHeroPin() grows .hero (100vh → 220vh) after Lenis already measured
    // the document at its shorter, pre-pin height — without this, Lenis caps
    // scrolling well short of the real bottom of the page.
    lenis?.resize();
    ScrollTrigger.refresh();
  } catch (err) {
    console.error('Error during init:', err);
  } finally {
    appReady = true;
    maybeHidePreloader();
  }
}

// Runs immediately (not gated on DOMContentLoaded) so touch-only CSS sizes
// have the right --mobile-scale before first paint.
initMobileScale();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(markFontsReady).catch(markFontsReady);
} else {
  // Font Loading API unsupported (very old browser) — nothing to wait for.
  markFontsReady();
}

// Safety fallback: never let a stalled font/network request hold the
// preloader up forever — 4s is well past normal load time but still a hard
// ceiling, unlike the old unconditional 1s hide this replaces.
window.setTimeout(hidePreloader, 4000);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
