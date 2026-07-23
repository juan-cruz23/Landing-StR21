import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion-preference.js';

gsap.registerPlugin(ScrollTrigger);

const PIN_HEIGHT_VH = 220;

// Pixel-level check (ffmpeg overlay of the two source files at native
// scale) confirmed facade-main and facade-cutout already register exactly —
// same 16:9 frame, same content position. No baseline fudge factor needed;
// object-fit: cover on matching-aspect-ratio boxes keeps them aligned.
const BUILDING_BASE_SCALE = 1;
const BUILDING_GROWTH = 1.08;

/**
 * Likova.space-style intro: a tall section pins its viewport-height frame
 * while three layers (background photo, headline text, building cutout)
 * scrub past each other at different rates, giving the cutout the sense of
 * floating in front of the text as you scroll.
 *
 * Skipped entirely under prefers-reduced-motion — .hero then stays the
 * plain 100vh section defined in CSS, no pin, no extra scroll distance.
 */
export function initHeroPin() {
  const hero = document.getElementById('hero');
  const pin = hero?.querySelector('.hero__pin');
  if (!hero || !pin || prefersReducedMotion()) return;

  const background = pin.querySelector('[data-parallax-layer="background"]');
  const building = pin.querySelector('[data-parallax-layer="building"]');

  hero.style.height = `${PIN_HEIGHT_VH}vh`;

  ScrollTrigger.create({
    trigger: hero,
    start: 'top top',
    end: 'bottom bottom',
    pin,
    pinSpacing: false,
  });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: hero,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });

  // Background and building start at yPercent 0 — same render, same
  // position, so they must coincide exactly before any scrolling happens,
  // then separate as the user scrolls. Text stays completely still (no
  // transform of its own) — since .hero__pin itself is what's pinned, "not
  // animated" already reads as "fixed on screen". As the building layer
  // (z-index 3, in front of the text's z-index 2) grows and shifts, it
  // naturally covers the fixed text — the text "disappears behind the
  // house" through occlusion, not opacity.
  if (background) tl.fromTo(background, { yPercent: 0 }, { yPercent: 10, ease: 'none' }, 0);
  if (building) {
    tl.fromTo(
      building,
      { yPercent: 0, scale: BUILDING_BASE_SCALE },
      { yPercent: -14, scale: BUILDING_BASE_SCALE * BUILDING_GROWTH, ease: 'none' },
      0
    );
  }
}
