import { t } from './i18n.js';

/**
 * Phase 1 scaffold: validates client-side and reports status, but does not
 * submit anywhere yet. Swap the TODO block below for a real endpoint
 * (e.g. Web3Forms or Formspree) in a later phase.
 */
export function initContactForm() {
  const form = document.getElementById('contactForm');
  const status = document.getElementById('contactFormStatus');
  if (!form || !status) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    status.textContent = t('contact.formSending');
    status.className = 'contact-form__status';

    // TODO: replace with a real submission, e.g.
    // await fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) });
    await new Promise((resolve) => setTimeout(resolve, 500));

    status.textContent = t('contact.formError');
    status.classList.add('is-error');
  });

  document.addEventListener('app:langchange', () => {
    if (status.classList.contains('is-error')) {
      status.textContent = t('contact.formError');
    } else if (status.classList.contains('is-success')) {
      status.textContent = t('contact.formSuccess');
    }
  });
}
