import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion-preference.js';

gsap.registerPlugin(ScrollTrigger);

// Every section here sits on the same black background as the one right
// after it in the DOM, so pinning + fading the whole section reads as its
// text/image dissolving in place while the next section (already scrolled
// into position underneath) is revealed — no visible seam between them.
//
// Deliberately excludes the horizontal-scroll galleries (#gallery,
// #interior) — gallery-scroll.js already pins .gallery__pin inside them for
// its own track-scrubbing timeline, and a second ScrollTrigger pinning the
// whole section on top of that fights the first one for scroll control.
const SECTION_IDS = ['specs', 'floorplans', 'location', 'amenities', 'cinematic'];

// Fraction of the pinned scroll distance spent fully visible (reading time)
// before any fade starts — without this, a single large wheel/trackpad
// scroll delta (which can easily cover a big chunk of the pin distance in
// one jump) lands past most of the fade immediately, reading as "the text
// vanished on one scroll" no matter how long the total pin distance is.
const HOLD_FRACTION = 0.45;

const PIN_VH_MULTIPLIER = 3.4; // matches the standard '+=340%' pin distance

// Distribución's own natural height grew substantially (the enlarged plan
// viewer) — with the default
// pin:true (pinSpacing:true) every other section here uses, GSAP reserves
// that FULL natural height as extra scroll AFTER the pin/fade already
// finished, so the plan fades to black and the page just keeps scrolling
// through empty black for another ~1000px before the next section appears.
// Pinning with pinSpacing:false and manually setting the section's height
// to exactly the intended pin distance (no natural-height component added
// on top) removes that dead zone entirely, and the hold gets more time too
// since none of the pin distance is spent on unrelated overflow.
const FLOORPLANS_HOLD_FRACTION = 0.6;

/**
 * Pins each section for a long extra scroll distance: it holds fully
 * visible for the first HOLD_FRACTION of that distance (real reading time),
 * then fades + recedes linearly over the rest, one "fixed screen" hand-off
 * after another instead of a normal scroll past each section boundary.
 *
 * Skipped under prefers-reduced-motion: no pin, no extra scroll distance,
 * sections just scroll away normally like any other page.
 */
export function initSectionTransitions() {
  if (prefersReducedMotion()) return;

  SECTION_IDS.forEach((id) => {
    const section = document.getElementById(id);
    if (!section) return;

    if (id === 'floorplans') {
      const pinDistance = window.innerHeight * PIN_VH_MULTIPLIER;
      section.style.height = `${window.innerHeight + pinDistance}px`;

      gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          pin: true,
          pinSpacing: false,
          scrub: 0.5,
        },
      }).to(
        section,
        { autoAlpha: 0, scale: 0.94, ease: 'none', duration: 1 - FLOORPLANS_HOLD_FRACTION },
        FLOORPLANS_HOLD_FRACTION
      );
      return;
    }

    if (id === 'amenities') {
      // The icon grid used to cascade in as part of the SAME pin/scrub
      // timeline that holds and fades the section — meaning the pin engaged
      // (section already locked in place, fixed on screen) before a single
      // card had appeared, so the first thing the pin held on was an empty
      // grid, and the reveal only started once the user kept scrolling
      // through the pin's own distance. Splitting the cascade into its own
      // ScrollTrigger over the section's NATURAL pre-pin scroll-in ('top
      // bottom' → 'top top', i.e. while it's still scrolling normally, before
      // 'top top' is what triggers the pin below) finishes the reveal
      // exactly as the section locks into place — so the pin now holds on a
      // grid that's already fully visible, not an empty one.
      const cards = gsap.utils.toArray('.amenities__card');
      const getCardTargets = (card) =>
        [card.querySelector('.amenities__index'), card.querySelector('.amenities__icon'), card.querySelector('.amenities__name')].filter(
          Boolean
        );
      cards.forEach((card) => gsap.set(getCardTargets(card), { opacity: 0, y: 18 }));

      const cascadeTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top bottom',
          end: 'top top',
          scrub: 0.5,
        },
      });

      const step = 1 / cards.length;
      cards.forEach((card, i) => {
        cascadeTl.to(
          getCardTargets(card),
          { opacity: 1, y: 0, duration: step * 0.7, ease: 'power2.out', stagger: step * 0.15 },
          i * step
        );
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=340%',
          pin: true,
          scrub: 0.5,
        },
      });

      tl.to(section, { autoAlpha: 0, scale: 0.94, ease: 'none', duration: 1 - HOLD_FRACTION }, HOLD_FRACTION);
      return;
    }

    gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=340%',
        pin: true,
        scrub: 0.5,
      },
    }).to(
      section,
      { autoAlpha: 0, scale: 0.94, ease: 'none', duration: 1 - HOLD_FRACTION },
      HOLD_FRACTION
    );
  });
}
