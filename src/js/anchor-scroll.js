// Lenis only smooths wheel/touch-driven scrolling — clicking an <a href="#id">
// still triggers the browser's native instant jump unless we intercept it
// and hand the scroll to Lenis ourselves.
const HEADER_OFFSET = -90;

export function initAnchorScroll(lenis) {
  if (!lenis) return; // reduced motion: native instant jump is the right call anyway

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const hash = link.getAttribute('href');
      if (!hash || hash.length < 2) return;

      const target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      lenis.scrollTo(target, { offset: HEADER_OFFSET, duration: 1.4 });
      history.pushState(null, '', hash);
    });
  });
}
