/**
 * The forced `width=1440` viewport meta (index.html) makes phones render the
 * desktop layout, then auto-zoom the whole page down to fit the real screen.
 * That zoom applies to EVERY css length equally — px, rem, even fixed touch-
 * only overrides — so bumping a font-size's raw number doesn't reliably
 * control how big it ends up looking; it's still divided by the zoom factor.
 *
 * This sets `--mobile-scale` on the root to that factor (screen width ÷ 1440)
 * so touch-only CSS can counter it explicitly: `font-size: calc(18px / var(--mobile-scale))`
 * renders at a real ~18px on screen regardless of phone width, instead of
 * guessing ever-bigger fixed numbers.
 *
 * The site is now gated to landscape on touch (gate.css's .rotate-prompt) —
 * screen.width reports the short edge in portrait and the long edge once
 * rotated, so this recomputes on resize/orientationchange to pick up the
 * landscape width the user actually ends up viewing the content at.
 */
export function initMobileScale() {
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (!isTouch) return;

  function apply() {
    const scale = Math.min(Math.max(window.screen.width / 1440, 0.18), 0.85);
    document.documentElement.style.setProperty('--mobile-scale', scale);
  }

  apply();
  window.addEventListener('resize', apply);
  window.addEventListener('orientationchange', apply);
}
