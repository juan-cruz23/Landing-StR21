/**
 * Day/night mood switch for the hero — purely a visual cross-fade between
 * two pairs of pre-rendered images (day/night facade + day/night cutout),
 * toggled by adding/removing .is-night on .hero. The actual fade is plain
 * CSS opacity transitions (sections.css) — this just flips the class.
 */
export function initHeroModeToggle() {
  const hero = document.getElementById('hero');
  const btn = document.getElementById('heroModeToggle');
  if (!hero || !btn) return;

  btn.addEventListener('click', () => {
    const isNight = hero.classList.toggle('is-night');
    btn.setAttribute('aria-pressed', String(isNight));
  });
}
