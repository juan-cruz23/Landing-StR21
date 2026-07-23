import es from '../content/es.json';
import en from '../content/en.json';

const dictionaries = { es, en };
const STORAGE_KEY = 'villa-lang';

function detectInitialLang() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && dictionaries[stored]) return stored;
  return navigator.language && navigator.language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

let currentLang = detectInitialLang();

function resolve(dict, path) {
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
}

function applyTranslations(lang) {
  const dict = dictionaries[lang] || dictionaries.es;

  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = resolve(dict, key);
    if (value === undefined) return;

    if (typeof value === 'string' && value.includes('<')) {
      el.innerHTML = value;
    } else {
      el.textContent = value;
    }
  });

  document.querySelectorAll('.lang-switch__btn').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.lang === lang);
  });

  document.documentElement.lang = lang;
  currentLang = lang;
  localStorage.setItem(STORAGE_KEY, lang);

  document.dispatchEvent(new CustomEvent('app:langchange', { detail: { lang } }));
}

export function t(key) {
  const dict = dictionaries[currentLang] || dictionaries.es;
  const value = resolve(dict, key);
  return value === undefined ? key : value;
}

export function getLang() {
  return currentLang;
}

export function initI18n() {
  applyTranslations(currentLang);

  document.querySelectorAll('.lang-switch__btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      if (lang && dictionaries[lang] && lang !== currentLang) {
        applyTranslations(lang);
      }
    });
  });
}
