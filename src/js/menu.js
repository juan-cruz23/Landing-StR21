import { t } from './i18n.js';

export function initMenu(lenis) {
  const toggle = document.getElementById('menuToggle');
  const drawer = document.getElementById('drawer');
  const label = toggle?.querySelector('.menu-toggle__label');
  if (!toggle || !drawer) return;

  const links = drawer.querySelectorAll('a');

  if (label) label.textContent = t('header.menuOpen');

  function setOpen(isOpen) {
    document.body.classList.toggle('menu-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    drawer.setAttribute('aria-hidden', String(!isOpen));
    if (label) label.textContent = t(isOpen ? 'header.menuClose' : 'header.menuOpen');

    if (isOpen) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
  }

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('menu-open'));
  });

  const background = document.getElementById('drawerBackground');
  if (background) {
    background.addEventListener('click', () => setOpen(false));
  }

  links.forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('menu-open')) {
      setOpen(false);
    }
  });

  document.addEventListener('app:langchange', () => {
    if (label && !document.body.classList.contains('menu-open')) {
      label.textContent = t('header.menuOpen');
    }
  });
}
