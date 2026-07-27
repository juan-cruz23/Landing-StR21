// Order matters — this is scroll order, not DOM nesting. "location" isn't
// its own section (the map lives inside #contact), so it's not listed here.
const SECTION_IDS = [
  'hero',
  'overview',
  'gallery',
  'specs',
  'floorplans',
  'interior',
  'amenities',
  'cinematic',
  'contact',
];

/**
 * Fixed "next section" button, touch-only (see layout.css — hidden by
 * default, shown under the same hover:none/pointer:coarse query as the
 * rest of the mobile-specific chrome).
 *
 * Deliberately scroll-position-driven rather than "current section index"
 * tracking: several sections here are GSAP-pinned with extra scroll
 * distance (hero, specs, floorplans, amenities, cinematic), so a section's
 * own DOM top position already accounts for exactly how much pinned scroll
 * distance came before it — "first section whose top is below where we are
 * now" is correct regardless of how far into a pinned section's scrub the
 * user currently is.
 */
export function initMobileNextNav(lenis) {
  const btn = document.getElementById('mobileNextNav');
  if (!btn) return;

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouch) return;

  const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
  if (!sections.length) return;

  function topOf(el) {
    return el.getBoundingClientRect().top + window.scrollY;
  }

  function findNext() {
    const threshold = window.scrollY + 10; // past "exactly at" the current section's own top
    return sections.find((el) => topOf(el) > threshold);
  }

  function goToNext() {
    const next = findNext();
    if (!next) return;
    if (lenis) {
      lenis.scrollTo(next, { offset: 0, duration: 1.2 });
    } else {
      next.scrollIntoView({ behavior: 'smooth' });
    }
  }

  function updateVisibility() {
    btn.classList.toggle('is-hidden', !findNext());
  }

  btn.addEventListener('click', goToNext);

  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });
  window.addEventListener('resize', updateVisibility);
}
