import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion-preference.js';

gsap.registerPlugin(ScrollTrigger);

/**
 * Native scroll stays fully in charge when reduced motion is requested —
 * Lenis is only wired up (and ticked via GSAP's rAF) otherwise.
 */
export function initSmoothScroll() {
  if (prefersReducedMotion()) {
    return null;
  }

  const lenis = new Lenis({
    duration: 1.1,
    smoothWheel: true,
  });

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Keeps ScrollTrigger's pin/scrub math reading Lenis's interpolated
  // position every frame instead of only on native scroll events.
  lenis.on('scroll', ScrollTrigger.update);

  document.documentElement.classList.add('has-lenis');

  return lenis;
}
