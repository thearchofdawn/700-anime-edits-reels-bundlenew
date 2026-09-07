(() => {
  'use strict';

  const videos = Array.from(document.querySelectorAll('video[data-preview]'));
  const watch = document.getElementById('watch-previews');
  let activeVideo = null;
  let userGesture = false;
  let hoverVideo = null;
  let raf = 0;

  // CORE AUTOPLAY SETUP: explicitly enable the browser's native autoplay flags.
  // Audible autoplay is attempted when allowed; browsers that require a gesture
  // will fall back to muted autoplay. A tap/click unlocks audio.
  function enableNativeAutoplay(video) {
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

  videos.forEach(enableNativeAutoplay);

  function stopOthers(current) {
    videos.forEach((v) => {
      if (v !== current) {
        v.pause();
        v.classList.remove('is-autoplaying');
      }
    });
  }

  function playPreview(video, audible = false) {
    if (!video) return;
    enableNativeAutoplay(video);
    stopOthers(video);
    activeVideo = video;
    video.classList.add('is-autoplaying');

    const wantsAudio = audible || userGesture;
    if (wantsAudio) {
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute('muted');
      video.volume = 1;
    } else {
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
    }

    const p = video.play();
    if (p && p.catch) {
      p.catch(() => {
        // Browser rejected the audible request: force the standards-compliant
        // silent autoplay path rather than leaving the preview stopped.
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        const retry = video.play();
        if (retry && retry.catch) retry.catch(() => {});
      });
    }
  }

  function visibility(video) {
    const r = video.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return 0;
    const vw = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const vh = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    return (vw * vh) / (r.width * r.height);
  }

  function selectPreview() {
    if (document.hidden || hoverVideo) return;
    let best = null;
    let bestVisibility = 0;

    videos.forEach((video) => {
      if (getComputedStyle(video).display === 'none') return;
      const ratio = visibility(video);
      if (ratio > bestVisibility) {
        bestVisibility = ratio;
        best = video;
      }
    });

    // Requested behavior: use the preview that is approximately 65% visible.
    // If several are visible, the most visible one wins. 35% is a safety floor
    // so playback does not stop in the small gap between cards.
    if (best && bestVisibility >= 0.65) {
      if (activeVideo !== best || best.paused) playPreview(best);
    } else if (best && bestVisibility >= 0.35) {
      if (activeVideo !== best || best.paused) playPreview(best);
    } else if (activeVideo) {
      activeVideo.pause();
      activeVideo.classList.remove('is-autoplaying');
      activeVideo = null;
    }
  }

  function queueSelect() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      selectPreview();
    });
  }

  videos.forEach((video) => {
    // Retry as soon as each video has enough media buffered to start.
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach((event) => {
      video.addEventListener(event, () => {
        if (!document.hidden && !hoverVideo && visibility(video) >= 0.65) {
          playPreview(video);
        }
      });
    });

    // Desktop: hover starts playback immediately.
    video.addEventListener('mouseenter', () => {
      hoverVideo = video;
      playPreview(video);
    });

    video.addEventListener('mouseleave', () => {
      if (hoverVideo === video) hoverVideo = null;
      if (!hoverVideo) queueSelect();
    });

    // Direct touch/click is a genuine user gesture and can unlock audio.
    video.addEventListener('pointerdown', () => {
      userGesture = true;
    }, { passive: true });

    video.addEventListener('click', () => {
      userGesture = true;
      playPreview(video, true);
    });
  });

  // Scroll + resize: continuously choose the dominant preview by actual area.
  window.addEventListener('scroll', queueSelect, { passive: true });
  window.addEventListener('resize', queueSelect, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(queueSelect, 100), { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(() => queueSelect(), {
      threshold: [0, 0.25, 0.35, 0.5, 0.65, 0.8, 1],
      rootMargin: '0px'
    });
    videos.forEach((video) => observer.observe(video));
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      activeVideo = null;
      setTimeout(queueSelect, 80);
    }
  });
  window.addEventListener('pageshow', () => setTimeout(queueSelect, 100));
  window.addEventListener('load', () => {
    // Give CSS/layout and video sources time to settle before the first decision.
    setTimeout(queueSelect, 50);
    setTimeout(queueSelect, 300);
    setTimeout(queueSelect, 1000);
  });

  if (watch) {
    watch.addEventListener('click', () => {
      userGesture = true;
      const section = document.getElementById('previews');
      const first = document.querySelector('video[data-preview="01"]');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => playPreview(first, true), 600);
    });
  }

  // Keep preview 04 mapped to preview 08 as in the existing page.
  const preview04 = document.querySelector('video[data-preview="04"] source');
  if (preview04) {
    preview04.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    preview04.parentElement.load();
  }

  // Countdown remains independent from video autoplay.
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