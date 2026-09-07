(() => {
  'use strict';

  const videos = Array.from(document.querySelectorAll('video[data-preview]'));
  const previewVideos = videos.filter(v => v.dataset.preview !== 'hero');
  const watch = document.getElementById('watch-previews');
  let activeVideo = null;
  let hoverVideo = null;
  let raf = 0;
  let soundUnlocked = false;

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
    videos.forEach(v => {
      if (v !== except) {
        v.pause();
        v.classList.remove('is-autoplaying');
      }
    });
  }

  function start(video, audible = false) {
    if (!video) return;
    prepare(video);
    pauseAll(video);
    activeVideo = video;
    video.classList.add('is-autoplaying');

    const wantsAudio = audible || soundUnlocked;
    video.muted = !wantsAudio;
    video.defaultMuted = !wantsAudio;
    video.volume = 1;
    if (wantsAudio) video.removeAttribute('muted');
    else video.setAttribute('muted', '');

    const p = video.play();
    if (p && p.catch) {
      p.catch(() => {
        video.muted = true;
        video.defaultMuted = true;
        video.setAttribute('muted', '');
        video.play()?.catch?.(() => {});
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

  function chooseVisible() {
    if (document.hidden || hoverVideo) return;
    let best = null;
    let bestRatio = 0;

    previewVideos.forEach(video => {
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

  previewVideos.forEach(video => {
    ['loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough'].forEach(event => {
      video.addEventListener(event, () => {
        if (!document.hidden && !hoverVideo && visibleRatio(video) >= 0.65 && (activeVideo !== video || video.paused)) {
          start(video);
        }
      });
    });

    video.addEventListener('mouseenter', () => {
      hoverVideo = video;
      start(video, soundUnlocked);
    });

    video.addEventListener('mouseleave', () => {
      if (hoverVideo === video) hoverVideo = null;
      queueChoose();
    });

    video.addEventListener('click', () => {
      soundUnlocked = true;
      start(video, true);
    });
  });

  const unlockAudio = () => {
    soundUnlocked = true;
    if (activeVideo) start(activeVideo, true);
  };

  document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });
  document.addEventListener('touchstart', unlockAudio, { once: true, passive: true });
  document.addEventListener('keydown', unlockAudio, { once: true });

  window.addEventListener('scroll', queueChoose, { passive: true });
  window.addEventListener('resize', queueChoose, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(queueChoose, 100), { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(() => queueChoose(), {
      threshold: [0, 0.25, 0.5, 0.65, 0.8, 1]
    });
    previewVideos.forEach(video => observer.observe(video));
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      activeVideo = null;
      setTimeout(queueChoose, 100);
    }
  });

  window.addEventListener('pageshow', () => setTimeout(queueChoose, 100));
  window.addEventListener('load', () => {
    [100, 500, 1500, 3000].forEach(ms => setTimeout(queueChoose, ms));
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

  // Preview 01 MUST remain the original Preview 04 asset.
  const source01 = document.querySelector('video[data-preview="01"] source');
  if (source01) {
    source01.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-04.mp4.mp4';
    source01.parentElement.load();
  }

  const source04 = document.querySelector('video[data-preview="04"] source');
  if (source04) {
    source04.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    source04.parentElement.load();
  }

  const countdownTargets = [
    document.getElementById('countdown'),
    document.getElementById('finalCountdown'),
    document.getElementById('stickyCountdown')
  ].filter(Boolean);

  if (countdownTargets.length) {
    const deadline = new Date('2026-09-08T19:30:00+05:30').getTime();
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        countdownTargets.forEach(el => { el.textContent = 'PRICE NOW ₹299'; });
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const text = `${d}d ${String(h).padStart(2, '0')}h ${String(m).padStart(2, '0')}m ${String(s).padStart(2, '0')}s LEFT`;
      countdownTargets.forEach(el => { el.textContent = text; });
    };
    tick();
    setInterval(tick, 1000);
  }

  document.querySelectorAll('.buy').forEach(a => a.addEventListener('click', () => {
    try { fbq('track', 'InitiateCheckout'); } catch (_) {}
  }));
})();
