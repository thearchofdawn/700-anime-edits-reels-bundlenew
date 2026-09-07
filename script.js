(() => {
  'use strict';

  const videos = Array.from(document.querySelectorAll('video[data-preview]'));
  const watch = document.getElementById('watch-previews');
  let activeVideo = null;
  let hoverVideo = null;
  let raf = 0;
  let soundUnlocked = false;

  // Browser-safe autoplay: silent autoplay is allowed much more broadly.
  // Audio is enabled after a real user interaction (tap/click/keyboard).
  function prepare(video) {
    if (!video) return;
    video.autoplay = true;
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('preload', 'auto');
  }

  videos.forEach(prepare);

  function pauseAll(except) {
    videos.forEach((v) => {
      if (v !== except) {
        v.pause();
        v.classList.remove('is-autoplaying');
      }
    });
  }

  function start(video, allowSound = false) {
    if (!video) return;
    prepare(video);
    pauseAll(video);
    activeVideo = video;
    video.classList.add('is-autoplaying');

    const audible = allowSound || soundUnlocked;
    video.muted = !audible;
    video.defaultMuted = !audible;
    if (audible) {
      video.removeAttribute('muted');
      video.volume = 1;
    } else {
      video.setAttribute('muted', '');
    }

    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') {
      attempt.catch(() => {
        // Guaranteed fallback path: restart muted when the browser blocks audio.
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        const retry = video.play();
        if (retry && typeof retry.catch === 'function') retry.catch(() => {});
      });
    }
  }

  function visibleRatio(video) {
    const r = video.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return 0;
    const left = Math.max(0, r.left);
    const right = Math.min(innerWidth, r.right);
    const top = Math.max(0, r.top);
    const bottom = Math.min(innerHeight, r.bottom);
    const w = Math.max(0, right - left);
    const h = Math.max(0, bottom - top);
    return (w * h) / (r.width * r.height);
  }

  // Play the one preview with the largest visible area once it reaches ~65%.
  function chooseVisible() {
    if (document.hidden || hoverVideo) return;

    let best = null;
    let bestRatio = 0;

    videos.forEach((video) => {
      if (getComputedStyle(video).display === 'none') return;
      const ratio = visibleRatio(video);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = video;
      }
    });

    if (best && bestRatio >= 0.65) {
      if (activeVideo !== best || best.paused) start(best);
      return;
    }

    // Stop playback when no preview is near the requested visibility threshold.
    if (activeVideo) {
      activeVideo.pause();
      activeVideo.classList.remove('is-autoplaying');
      activeVideo = null;
    }
  }

  function queueChoose() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      chooseVisible();
    });
  }

  videos.forEach((video) => {
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach((event) => {
      video.addEventListener(event, () => {
        if (!document.hidden && !hoverVideo && visibleRatio(video) >= 0.65 && (activeVideo !== video || video.paused)) {
          start(video);
        }
      });
    });

    // Desktop hover behavior.
    video.addEventListener('mouseenter', () => {
      hoverVideo = video;
      start(video, soundUnlocked);
    });

    video.addEventListener('mouseleave', () => {
      if (hoverVideo === video) hoverVideo = null;
      queueChoose();
    });

    // Touch/click unlocks sound for subsequent previews.
    video.addEventListener('pointerdown', () => {
      soundUnlocked = true;
    }, { passive: true });

    video.addEventListener('click', () => {
      soundUnlocked = true;
      start(video, true);
    });
  });

  // Any user gesture on the page unlocks audio for subsequent autoplay previews.
  const unlockAudio = () => {
    soundUnlocked = true;
    if (activeVideo) {
      activeVideo.muted = false;
      activeVideo.defaultMuted = false;
      activeVideo.removeAttribute('muted');
      activeVideo.volume = 1;
      const p = activeVideo.play();
      if (p && p.catch) p.catch(() => {});
    }
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach((event) => {
    document.addEventListener(event, unlockAudio, { once: true, passive: event !== 'keydown' });
  });

  window.addEventListener('scroll', queueChoose, { passive: true });
  window.addEventListener('resize', queueChoose, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(queueChoose, 100), { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(() => queueChoose(), {
      threshold: [0, 0.25, 0.5, 0.65, 0.8, 1],
      rootMargin: '0px'
    });
    videos.forEach((video) => observer.observe(video));
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      activeVideo = null;
      setTimeout(queueChoose, 100);
    }
  });

  window.addEventListener('pageshow', () => setTimeout(queueChoose, 100));
  window.addEventListener('load', () => {
    // Try repeatedly because remote GitHub media can finish loading after layout.
    setTimeout(queueChoose, 100);
    setTimeout(queueChoose, 500);
    setTimeout(queueChoose, 1500);
    setTimeout(queueChoose, 3000);
  });

  if (watch) {
    watch.addEventListener('click', () => {
      soundUnlocked = true;
      document.getElementById('previews')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const first = document.querySelector('video[data-preview="01"]');
        if (first) start(first, true);
      }, 700);
    });
  }

  // Ensure preview 01 and 04 point at known-good raw files.
  const source01 = document.querySelector('video[data-preview="01"] source');
  if (source01) {
    source01.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-01.mp4.mp4';
    source01.parentElement.load();
  }
  const source04 = document.querySelector('video[data-preview="04"] source');
  if (source04) {
    source04.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    source04.parentElement.load();
  }

  // Countdown.
  const countdown = document.getElementById('countdown');
  if (countdown) {
    const deadline = new Date('2026-09-08T18:00:00+05:30').getTime();
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        countdown.textContent = 'PRICE NOW ₹299';
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdown.textContent = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s LEFT`;
    };
    tick();
    setInterval(tick, 1000);
  }

  document.querySelectorAll('.buy').forEach((a) => {
    a.addEventListener('click', () => {
      try { fbq('track', 'InitiateCheckout'); } catch (_) {}
    });
  });
})();
