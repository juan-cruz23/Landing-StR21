import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion, onMotionPreferenceChange } from './motion-preference.js';

gsap.registerPlugin(ScrollTrigger);

export function initScrollAnimations() {
  const reduced = prefersReducedMotion();
  document.documentElement.classList.toggle('reduced-motion', reduced);

  initHeaderCollapse();
  initLineReveals(reduced);
  initReveals(reduced);
  if (!reduced) {
    initParallax();
  }
  initCounters(reduced);

  onMotionPreferenceChange((nowReduced) => {
    document.documentElement.classList.toggle('reduced-motion', nowReduced);
  });
}

function initHeaderCollapse() {
  const header = document.getElementById('header');
  if (!header) return;

  ScrollTrigger.create({
    start: 'top -1',
    end: 'max',
    onUpdate: (self) => {
      header.classList.toggle('is-collapsed', self.scroll() > 40);
    },
  });
}

function initLineReveals(reduced) {
  const textSelector =
    '[data-reveal-lines], .overview-statement__title, .overview-statement__text, .section__title, .section__text, .hero__subtitle';
  const textElements = gsap.utils.toArray(textSelector);

  if (reduced) {
    textElements.forEach((el) => {
      gsap.set(el, { opacity: 1, y: 0 });
    });
    return;
  }

  const triggersMap = new Map();

  function processElement(el) {
    if (el.hasAttribute('data-reveal')) {
      gsap.set(el, { opacity: 1, y: 0, transform: 'none' });
    }

    if (triggersMap.has(el)) {
      triggersMap.get(el).kill();
      triggersMap.delete(el);
    }

    const rawHTML = el.dataset.rawHtml || el.innerHTML;
    el.dataset.rawHtml = rawHTML;

    let lineChildNodes = [];

    if (/<br\s*\/?>/i.test(rawHTML)) {
      const parts = rawHTML.split(/<br\s*\/?>/i);
      el.innerHTML = parts
        .map((part) => `<span class="line-mask"><span class="line-child">${part.trim()}</span></span>`)
        .join('');
      lineChildNodes = Array.from(el.querySelectorAll('.line-child'));
    } else {
      const textContent = el.textContent.trim();
      if (!textContent) return;

      const words = rawHTML.split(/(\s+)/);
      el.innerHTML = words
        .map((w) => (w.trim() ? `<span class="word-temp">${w}</span>` : w))
        .join('');

      const wordSpans = Array.from(el.querySelectorAll('.word-temp'));
      if (!wordSpans.length) return;

      const lines = [];
      let currentTop = null;
      let currentLine = [];

      wordSpans.forEach((w) => {
        const top = w.offsetTop;
        if (currentTop === null || Math.abs(top - currentTop) > 4) {
          if (currentLine.length) lines.push(currentLine);
          currentLine = [w.innerHTML];
          currentTop = top;
        } else {
          currentLine.push(w.innerHTML);
        }
      });
      if (currentLine.length) lines.push(currentLine);

      el.innerHTML = lines
        .map((lineWords) => `<span class="line-mask"><span class="line-child">${lineWords.join(' ')}</span></span>`)
        .join('');

      lineChildNodes = Array.from(el.querySelectorAll('.line-child'));
    }

    if (!lineChildNodes.length) return;

    const anim = gsap.fromTo(
      lineChildNodes,
      {
        yPercent: 115,
        opacity: 0,
        rotateX: 6,
      },
      {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1.1,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reset',
        },
      }
    );

    if (anim.scrollTrigger) {
      triggersMap.set(el, anim.scrollTrigger);
    }
  }

  textElements.forEach(processElement);

  document.addEventListener('app:langchange', () => {
    if (prefersReducedMotion()) return;
    textElements.forEach((el) => {
      delete el.dataset.rawHtml;
      processElement(el);
    });
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    if (prefersReducedMotion()) return;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      textElements.forEach((el) => {
        if (!/<br\s*\/?>/i.test(el.dataset.rawHtml || '')) {
          el.innerHTML = el.dataset.rawHtml || el.innerHTML;
          processElement(el);
        }
      });
    }, 250);
  });
}

function initReveals(reduced) {
  const items = gsap.utils.toArray('[data-reveal]');

  items.forEach((el) => {
    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return;
    }

    if (
      el.matches(
        '.overview-statement__title, .overview-statement__text, .section__title, .section__text, .hero__subtitle, [data-reveal-lines]'
      )
    ) {
      gsap.set(el, { opacity: 1, y: 0, transform: 'none' });
      return;
    }

    gsap.fromTo(
      el,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reset',
        },
      }
    );
  });
}

/**
 * Only applied to media wrappers that are deliberately oversized + clipped
 * in CSS (hero, cinematic) so the shifted layer never reveals its edges —
 * unlike likova.space, where the parallax plugin threw continuous console
 * errors and never resolved its group configuration.
 */
function initParallax() {
  const items = gsap.utils.toArray('[data-parallax]');

  items.forEach((el) => {
    const speed = parseFloat(el.dataset.parallaxSpeed || '0.2');
    const media = el.querySelector('.media') || el;
    const travel = gsap.utils.clamp(2, 10, speed * 30);

    gsap.fromTo(
      media,
      { yPercent: -travel },
      {
        yPercent: travel,
        ease: 'none',
        scrollTrigger: {
          trigger: el,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

function formatCounter(value) {
  const locale = document.documentElement.lang === 'en' ? 'en-US' : 'es-CO';
  return Math.round(value).toLocaleString(locale);
}

function initCounters(reduced) {
  const items = gsap.utils.toArray('[data-counter]');
  const settled = new WeakSet();

  items.forEach((el) => {
    const target = parseFloat(el.dataset.counter);
    if (Number.isNaN(target)) return;

    if (reduced) {
      el.textContent = formatCounter(target);
      settled.add(el);
      return;
    }

    const counter = { value: 0 };
    el.textContent = formatCounter(0);

    gsap.to(counter, {
      value: target,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 85%',
        once: true,
      },
      onUpdate: () => {
        el.textContent = formatCounter(counter.value);
      },
      onComplete: () => settled.add(el),
    });
  });

  // Only re-render counters that have already finished animating — a
  // still-hidden stat should keep showing 0 until it's actually scrolled
  // into view, not jump straight to its target just because the language
  // toggle was clicked.
  document.addEventListener('app:langchange', () => {
    items.forEach((el) => {
      if (!settled.has(el)) return;
      const target = parseFloat(el.dataset.counter);
      if (!Number.isNaN(target)) el.textContent = formatCounter(target);
    });
  });
}

// The amenities icon cascade now lives in section-transitions.js, driven
// off the same pin/fade timeline that section is already part of — it used
// to have its own independent ScrollTrigger here, but that trigger's
// 'top center' → 'bottom center' math collapsed to a sliver of real scroll
// once the section started getting pinned by section-transitions.js,
// which is why every card used to finish revealing within ~15% of the
// scroll instead of spreading out over it.
