const ZOOM_SCALE = 2.5;

export function initLightbox(lenis) {
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const closeBtn = document.getElementById('lightboxClose');
  const items = document.querySelectorAll('.gallery__item');
  const floorplanExpand = document.getElementById('floorplanExpand');
  if (!lightbox || !lightboxImage) return;

  function resetZoom() {
    lightboxImage.classList.remove('is-zoomed');
    lightboxImage.style.transform = 'scale(1)';
    lightboxImage.style.transformOrigin = '50% 50%';
  }

  function open(src, alt) {
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    resetZoom();
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
    lenis?.stop();
    closeBtn?.focus();
  }

  function close() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    lenis?.start();
  }

  // Click zooms in centered on the click point (transform-origin does the
  // anchoring, no manual pan math needed); clicking again zooms back out.
  lightboxImage.addEventListener('click', (event) => {
    event.stopPropagation();
    const isZoomed = lightboxImage.classList.contains('is-zoomed');
    if (isZoomed) {
      resetZoom();
      return;
    }
    const rect = lightboxImage.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    lightboxImage.style.transformOrigin = `${xPercent}% ${yPercent}%`;
    lightboxImage.style.transform = `scale(${ZOOM_SCALE})`;
    lightboxImage.classList.add('is-zoomed');
  });

  items.forEach((item) => {
    item.addEventListener('click', () => {
      const img = item.querySelector('img');
      // Only skip if there is no img element at all or if it has no src
      // (i.e. media-fallback.js already replaced it with a div placeholder).
      // Do NOT gate on naturalWidth === 0 — that value is 0 while the image
      // is still in-flight, which would silently block valid clicks.
      if (!img || !img.src) return;
      open(img.currentSrc || img.src, img.alt);
    });
  });

  // The expand button opens a separate, cleaner "just the house" image
  // (PLANTA 1/2.png) rather than whatever's shown inline (piso-1/2.png) —
  // the active level rail button carries its own data-plan-expand path.
  floorplanExpand?.addEventListener('click', (e) => {
    e.stopPropagation();
    const activeLevel = document.querySelector('.floorplans__level.is-active, .floorplans__tab.is-active');
    const expandSrc = activeLevel?.dataset.planExpand || activeLevel?.getAttribute('data-plan-expand') || '/images/floorplans/PLANTA 1.webp';
    const label = activeLevel?.getAttribute('aria-label') || 'Plano de distribución';
    open(expandSrc, label);
  });

  closeBtn?.addEventListener('click', close);

  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && lightbox.classList.contains('is-open')) close();
  });
}
