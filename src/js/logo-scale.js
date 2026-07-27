import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion-preference.js';

gsap.registerPlugin(ScrollTrigger);

// How much of the bar's own height the grown logo should fill — leaves
// breathing room above/below rather than touching the bar's edges.
const FIT_RATIO = 0.68;

/**
 * iOS "large title" style effect: as the black .section-divider bar scrolls
 * up and passes behind the fixed header, the header logo grows — sized and
 * vertically centered to fit the bar's own height, anchored at its normal
 * left position — finishing exactly as the bar's top reaches the viewport
 * top. At that point the bar sticks there (CSS position: sticky) and the
 * logo just holds, full size, for the rest of the page.
 *
 * The bar's height is fluid (clamp()/vw in CSS), so the fit rebuilds on
 * resize instead of being computed once — otherwise resizing (or rotating
 * a phone) would leave the scale/position tuned for whatever viewport the
 * page happened to load at.
 */
export function initLogoScale() {
  const divider = document.getElementById('sectionDivider');
  const logo = document.querySelector('.header__logo');
  // .section-divider is hidden on touch (sections.css) — this whole effect
  // is built around growing the logo to fit that bar, so there's nothing
  // to drive it against there; skip rather than animate against a
  // zero-height, invisible element.
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!divider || !logo || prefersReducedMotion() || isTouch) return;

  let tween;

  function build() {
    tween?.scrollTrigger?.kill();
    tween?.kill();
    gsap.set(logo, { clearProps: 'transform' });

    // The header is already in its scrolled/collapsed state (72% of
    // --header-height) by the time the page has scrolled this far down.
    const baseHeaderHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height'));
    const collapsedHeaderHeight = baseHeaderHeight * 0.72;

    // Measured fresh (post reset, above) so these are always based on the
    // logo's true natural height for the current viewport.
    const naturalHeight = logo.getBoundingClientRect().height;
    const dividerHeight = divider.getBoundingClientRect().height;
    const targetScale = (dividerHeight * FIT_RATIO) / naturalHeight;

    // The logo's vertical center normally sits at collapsedHeaderHeight / 2
    // (the short fixed header, centered via flexbox). The much taller bar's
    // center sits lower, at dividerHeight / 2 — without this offset the
    // grown logo stays anchored to the short header's center and reads as
    // "stuck near the top" of the bar instead of centered in it.
    const targetY = dividerHeight / 2 - collapsedHeaderHeight / 2;

    gsap.set(logo, { transformOrigin: '0% 50%' });

    tween = gsap.to(logo, {
      scale: targetScale,
      y: targetY,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: divider,
        start: () => `top top+=${collapsedHeaderHeight}`,
        end: 'top top',
        scrub: 0.5,
      },
    });
  }

  build();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 200);
  });

  // The bar itself sticks via plain CSS (position: sticky in sections.css),
  // not a GSAP pin — a GSAP pin held "for the rest of the page" reserves a
  // spacer equal to that whole distance and nearly doubles the page's real
  // scroll length. Sticky achieves the same stuck-at-top look natively, with
  // zero added height, using the space the bar already occupies in flow.
}
