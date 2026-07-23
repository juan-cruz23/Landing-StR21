// Floorplan hotspots — a pulsing point marker over each named space, shown
// on the plan image. Each key matches getActiveTabKey() output ('tab1' =
// primer piso, 'tab2' = segundo piso). Coordinates are percentages (0-100)
// of the image's own width/height, read off the actual artwork — adjust
// x/y here if a point needs nudging.
const spacesData = {
  tab1: [
    { name: 'Zona Social', x: 16.7, y: 34 },
    { name: 'Cocina', x: 23, y: 57.6 },
    { name: 'Área de servicio', x: 31.9, y: 62.8 },
    { name: 'Deck exterior', x: 33.4, y: 31.6 },
    { name: 'Escaleras', x: 39.2, y: 54.8 },
    { name: 'Habitación', x: 63, y: 51.6 },
    { name: 'Linos', x: 47.5, y: 46.8 },
    { name: 'Parqueadero', x: 7.2, y: 66.8 },
    { name: 'Lago', x: 91.2, y: 56 },
    { name: 'Vestier', x: 54.5, y: 46.8 },
    { name: 'Baño', x: 55.7, y: 56.4 },
    { name: 'Alacena', x: 15.5, y: 58.4 },
  ],
  tab2: [
    { name: 'Habitación', x: 12.4, y: 59.6 },
    { name: 'Habitación', x: 24.5, y: 59.6 },
    { name: 'Estudio', x: 33.4, y: 58.8 },
    { name: 'Terraza', x: 31.5, y: 29.1 },
    { name: 'Escaleras', x: 38.7, y: 57.6 },
    { name: 'Habitación', x: 63, y: 48.4 },
    { name: 'Vestier', x: 52.8, y: 46.4 },
    { name: 'Baño', x: 54.8, y: 56.8 },
    { name: 'Vestier', x: 19.1, y: 60.4 },
    { name: 'Baño', x: 18.4, y: 71.7 },
    { name: 'Vestier', x: 13.8, y: 72.9 },
    { name: 'Baño', x: 8.1, y: 72.5 },
    { name: 'Balcón', x: 72.2, y: 50 },
    { name: 'Lago', x: 91.5, y: 47.2 },
    { name: 'Balcón', x: 5, y: 62 },
  ],
  tab3: [],
};

const SVG_NS = 'http://www.w3.org/2000/svg';

// Keeps the overlay's own box (position/size/rotation) glued to the plan
// <img> exactly, and its viewBox matched 1:1 to the image's rendered pixel
// size — that way hotspot radii stay circular (not stretched into ellipses)
// regardless of how wide/narrow the plan artwork is, since there's no
// non-uniform viewBox scaling happening.
export function syncSvgWithImage() {
  const img = document.getElementById('floorplanImage');
  const svg = document.getElementById('floorplanSvg');
  if (!img || !svg) return;

  const width = img.offsetWidth;
  const height = img.offsetHeight;
  const left = img.offsetLeft;
  const top = img.offsetTop;

  if (width > 0 && height > 0) {
    svg.style.position = 'absolute';
    svg.style.width = `${width}px`;
    svg.style.height = `${height}px`;
    svg.style.left = `${left}px`;
    svg.style.top = `${top}px`;
    svg.style.transform = img.style.transform || 'none';
    svg.style.transformOrigin = 'center center';
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }
}

export function initFloorplanSpaces() {
  const container = document.getElementById('floorplansWrap');
  const svg = document.getElementById('floorplanSvg');
  const img = document.getElementById('floorplanImage');
  const tooltip = document.getElementById('floorplanTooltip');
  const tabs = document.querySelectorAll('.floorplans__level, .floorplans__tab');
  if (!container || !svg || !img || !tooltip) return;

  function getActiveTabKey() {
    const activeTab = document.querySelector('.floorplans__level.is-active, .floorplans__tab.is-active');
    if (!activeTab) return 'tab1';
    const src = activeTab.dataset.planSrc || activeTab.getAttribute('data-plan-src') || '';
    if (src.includes('piso-2') || src.includes('segundo')) return 'tab2';
    if (src.includes('sotano') || src.includes('garaje') || src.includes('piso-3')) return 'tab3';
    return 'tab1';
  }

  let activeTabKey = getActiveTabKey();

  function renderHotspots() {
    syncSvgWithImage();
    svg.querySelectorAll('.floorplan-hotspot').forEach((el) => el.remove());

    const width = img.offsetWidth;
    const height = img.offsetHeight;
    if (width === 0 || height === 0) return;

    const spaces = spacesData[activeTabKey] || [];

    spaces.forEach((space, i) => {
      const cx = (space.x / 100) * width;
      const cy = (space.y / 100) * height;

      const g = document.createElementNS(SVG_NS, 'g');
      g.setAttribute('class', 'floorplan-hotspot');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', space.name);
      g.setAttribute('data-name', space.name);

      const ring = document.createElementNS(SVG_NS, 'circle');
      ring.setAttribute('class', 'floorplan-hotspot__ring');
      ring.setAttribute('cx', cx);
      ring.setAttribute('cy', cy);
      ring.setAttribute('r', 10);
      // Slightly stagger each pulse so a cluster of hotspots doesn't all
      // breathe in perfect unison.
      ring.style.animationDelay = `${(i % 5) * 0.35}s`;

      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('class', 'floorplan-hotspot__dot');
      dot.setAttribute('cx', cx);
      dot.setAttribute('cy', cy);
      dot.setAttribute('r', 8);

      g.appendChild(ring);
      g.appendChild(dot);

      g.addEventListener('mouseenter', (e) => showTooltip(e, space.name));
      g.addEventListener('mousemove', (e) => moveTooltip(e));
      g.addEventListener('mouseleave', hideTooltip);
      g.addEventListener('focus', (e) => showTooltip(e, space.name));
      g.addEventListener('blur', hideTooltip);

      g.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        showTooltip(touch, space.name);
      });
      g.addEventListener('touchend', () => {
        setTimeout(hideTooltip, 1800);
      });

      svg.appendChild(g);
    });
  }

  function showTooltip(e, name) {
    tooltip.textContent = name;
    tooltip.classList.add('is-visible');
    moveTooltip(e);
  }

  function moveTooltip(e) {
    if (!tooltip.classList.contains('is-visible')) return;
    const rect = container.getBoundingClientRect();
    let x;
    let y;
    if (e.clientX !== undefined) {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    } else {
      // Focus events (keyboard) don't carry a pointer position — center
      // the tooltip above the hotspot that triggered it instead.
      const target = e.target.closest ? e.target.closest('.floorplan-hotspot') : null;
      const circle = target ? target.querySelector('.floorplan-hotspot__dot') : null;
      x = circle ? Number(circle.getAttribute('cx')) : rect.width / 2;
      y = circle ? Number(circle.getAttribute('cy')) : rect.height / 2;
    }
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y - 14}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove('is-visible');
  }

  renderHotspots();

  img.addEventListener('load', () => {
    syncSvgWithImage();
    renderHotspots();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderHotspots, 200);
  });

  // Re-render when level tabs are switched, and once more after the
  // rotate-orientation transform finishes (main.js animates that over
  // 0.5s), so hotspots land on the settled geometry, not mid-transition.
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      setTimeout(() => {
        activeTabKey = getActiveTabKey();
        renderHotspots();
      }, 50);
    });
  });

  document.getElementById('floorplanRotateLeft')?.addEventListener('click', () => {
    setTimeout(renderHotspots, 520);
  });
  document.getElementById('floorplanRotateRight')?.addEventListener('click', () => {
    setTimeout(renderHotspots, 520);
  });
}
