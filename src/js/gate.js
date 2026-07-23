import gsap from 'gsap';

/**
 * Aerial "Saint Regis" editorial splash screen.
 *
 * Flow:
 * 1. ENTRAR click → fade out the poster content (.gate__content + .gate__scrim)
 * 2. Crossfade in the transition video (.gate__video) and play it
 * 3. Video ends → fade out the entire .gate overlay → reveal the landing page
 *
 * Fallback: if the video fails to load / play (e.g. file missing, codec),
 * the gate fades out immediately so the user is never stuck.
 */
export function initGate(lenis) {
  const gate = document.getElementById('gate');
  const enterBtn = document.getElementById('gateEnter');
  const video = document.getElementById('gateVideo');
  const content = document.getElementById('gateContent');

  // Gate disabled: unlock scroll and bail out
  if (!gate || gate.style.display === 'none' || getComputedStyle(gate).display === 'none') {
    document.body.classList.remove('no-scroll');
    lenis?.start();
    return;
  }

  // Lock scroll while gate is visible
  document.body.classList.add('no-scroll');
  lenis?.stop();

  let opened = false;

  /** Step 3 — fade the entire gate overlay out once the video has ended */
  function closeGate() {
    gsap.to(gate, {
      opacity: 0,
      duration: 0.75,
      ease: 'power2.inOut',
      onComplete: () => {
        gate.remove();
        document.body.classList.remove('no-scroll');
        lenis?.start();
        document.dispatchEvent(new CustomEvent('gate:opened'));
      },
    });
  }

  /** Step 2 — crossfade to video and play it; close when it ends */
  function playVideo() {
    if (!video) {
      closeGate();
      return;
    }

    // Fade out poster elements while video fades in
    gsap.to([content], { opacity: 0, duration: 0.4, ease: 'power2.out' });
    video.classList.add('is-visible');

    const doPlay = video.play();

    // video.play() returns a Promise in modern browsers
    if (doPlay !== undefined) {
      doPlay
        .then(() => {
          video.addEventListener('ended', closeGate, { once: true });
        })
        .catch(() => {
          // Autoplay blocked or file missing — skip straight to close
          closeGate();
        });
    } else {
      // Old browser fallback
      video.addEventListener('ended', closeGate, { once: true });
    }
  }

  /** Step 1 — triggered by ENTRAR click (or click anywhere on gate) */
  function openGate() {
    if (opened) return;
    opened = true;
    playVideo();
  }

  if (enterBtn) {
    enterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openGate();
    });
  }

  // Click anywhere on the gate background as intuitive fallback
  gate.addEventListener('click', () => {
    openGate();
  });

  // Keyboard: Enter or Space
  window.addEventListener('keydown', (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && !opened) {
      openGate();
    }
  });
}
