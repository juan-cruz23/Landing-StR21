import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion-preference.js';

gsap.registerPlugin(ScrollTrigger);

// Cycles every 3 items — matches the aspect-ratio variants in sections.css
// (.gallery.is-horizontal .gallery__item / :nth-child(3n+2) / :nth-child(3n)).
const HEIGHT_FACTORS = [0.88, 0.56, 0.96];

function initSingleGallery(section) {
  const pin = section?.querySelector('.gallery__pin');
  const track = section?.querySelector('.gallery__track');
  if (!section || !pin || !track || prefersReducedMotion()) return;

  const items = gsap.utils.toArray('.gallery__item', track);
  let trigger;

  track.style.flexWrap = 'nowrap';

  function build() {
    trigger?.kill();
    gsap.set(track, { x: 0 });
    gsap.set(items, { clearProps: 'opacity,transform' });

    section.classList.add('is-horizontal');
    // dvh, not vh: see hero-pin.js for why — plain vh sizes against mobile's
    // largest-possible viewport (address bar hidden), not what's actually
    // visible, so the pinned frame can render taller than the real screen.
    pin.style.height = '100dvh';

    items.forEach((item, i) => {
      if (item.classList.contains('gallery__item--specs')) return;
      item.style.height = `${Math.round(pin.clientHeight * HEIGHT_FACTORS[i % HEIGHT_FACTORS.length])}px`;
    });

    const distance = Math.max(0, track.scrollWidth - pin.clientWidth);
    if (distance === 0) {
      section.classList.remove('is-horizontal');
      section.style.height = '';
      pin.style.height = '';
      items.forEach((item) => {
        item.style.height = '';
      });
      return;
    }

    section.style.height = `${window.innerHeight + distance}px`;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        pin,
        pinSpacing: false,
        scrub: 0.4,
      },
    });

    tl.to(track, { x: -distance, ease: 'none' }, 0);

    trigger = tl.scrollTrigger;
  }

  build();

  // build() runs before every image necessarily finishes loading — with
  // several very large, slow-to-decode photos (as in #interior), the
  // distance measured that early can go stale relative to the final page
  // height. A same-tick rebuild on window's 'load' event fights Lenis
  // mid-update and leaves the trigger stuck (confirmed by hand), so this
  // goes through the same debounced path as the resize handler below
  // instead of calling build() synchronously.
  let rebuildTimer;
  function scheduleRebuild() {
    clearTimeout(rebuildTimer);
    rebuildTimer = setTimeout(build, 200);
  }

  window.addEventListener('load', scheduleRebuild);
  window.addEventListener('resize', scheduleRebuild);
}

export function initGalleryScroll() {
  const gallerySections = document.querySelectorAll('.gallery');
  gallerySections.forEach((section) => {
    initSingleGallery(section);
  });
}
