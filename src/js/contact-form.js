import { t } from './i18n.js';

// Web3Forms: free, no backend, no account/password — an "access key" is a
// public token tied to a destination inbox, obtained instantly by entering
// that email at https://web3forms.com/ (no signup). Swap this placeholder
// for the real key once you have it; the form won't actually deliver
// anywhere until then.
const WEB3FORMS_ACCESS_KEY = 'REPLACE_WITH_WEB3FORMS_ACCESS_KEY';
const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

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

    const formData = new FormData(form);
    formData.append('access_key', WEB3FORMS_ACCESS_KEY);
    formData.append('subject', 'Lake House Nº21 — nuevo contacto desde la landing');

    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();

      if (result.success) {
        status.textContent = t('contact.formSuccess');
        status.classList.add('is-success');
        form.reset();
      } else {
        status.textContent = t('contact.formError');
        status.classList.add('is-error');
      }
    } catch {
      status.textContent = t('contact.formError');
      status.classList.add('is-error');
    }
  });

  document.addEventListener('app:langchange', () => {
    if (status.classList.contains('is-error')) {
      status.textContent = t('contact.formError');
    } else if (status.classList.contains('is-success')) {
      status.textContent = t('contact.formSuccess');
    }
  });
}
