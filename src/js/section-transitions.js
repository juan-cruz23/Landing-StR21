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
      // The icon grid used to reveal itself with its own independent
      // ScrollTrigger keyed to the section's natural top/bottom crossing
      // the viewport center — but this section gets pinned (frozen in
      // place) right below, which froze that trigger's position math too,
      // so all 7 cards ended up finishing their fade-in within the first
      // ~15% of the scroll instead of spreading across it. Driving the
      // cascade off this same pin timeline fixes that, since scrub here is
      // tied to the actual pin progress, not the section's on-page position.
      const cards = gsap.utils.toArray('.amenities__card');
      const getCardTargets = (card) =>
        [card.querySelector('.amenities__index'), card.querySelector('.amenities__icon'), card.querySelector('.amenities__name')].filter(
          Boolean
        );
      cards.forEach((card) => gsap.set(getCardTargets(card), { opacity: 0, y: 18 }));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=340%',
          pin: true,
          scrub: 0.5,
        },
      });

      // Cascade finishes a bit before the hold ends, so there's a moment
      // to actually read the fully-revealed grid before it starts fading.
      const cascadeEnd = HOLD_FRACTION * 0.85;
      const step = cascadeEnd / cards.length;
      cards.forEach((card, i) => {
        tl.to(
          getCardTargets(card),
          { opacity: 1, y: 0, duration: step * 0.7, ease: 'power2.out', stagger: step * 0.15 },
          i * step
        );
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
