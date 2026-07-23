import { t } from './i18n.js';

/**
 * For one-shot <img data-i18n-fallback="…"> that never gets a new `src`
 * after load (hero, gate, gallery, location map): if the file
 * 404s, swap that single <img> for a .media--placeholder div carrying the
 * same classes, so grid/aspect-ratio sizing on sibling media is untouched.
 *
 * (Elements whose src changes at runtime — e.g. the floorplan viewer — are
 * NOT tagged with data-i18n-fallback; they handle their own fallback in
 * main.js because a single { once: true } swap can't survive repeated
 * src changes.)
 */
export function initMediaFallback() {
  document.querySelectorAll('img[data-i18n-fallback]').forEach((img) => {
    const fallback = () => {
      const placeholder = document.createElement('div');
      placeholder.className = img.className;
      placeholder.classList.add('media--placeholder');
      placeholder.textContent = t(img.dataset.i18nFallback);
      img.replaceWith(placeholder);
    };

    // The browser starts requesting <img src> the moment the HTML parser
    // sees it — well before this deferred module script runs. A fast 404
    // can already have failed by now, and a failed load never fires
    // another 'error' event, so check the already-settled state first.
    if (img.complete && img.naturalWidth === 0) {
      fallback();
    } else {
      img.addEventListener('error', fallback, { once: true });
    }
  });
}
