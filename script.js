(() => {
  'use strict';

  const videos = Array.from(document.querySelectorAll('video[data-preview]'));
  const watch = document.getElementById('watch-previews');
  const previewSection = document.getElementById('previews');
  let activeVideo = null;
  let userActivatedAudio = false;

  const finePointer = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function prep(video) {
    if (!video) return;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.preload = 'auto';
  }

  function pauseOthers(current) {
    videos.forEach((video) => {
      if (video !== current && !video.paused) {
        video.pause();
        video.classList.remove('is-autoplaying');
      }
    });
  }

  function play(video, options = {}) {
    if (!video) return;
    const audible = options.audible === true || userActivatedAudio;

    pauseOthers(video);
    activeVideo = video;
    video.classList.add('is-autoplaying');

    if (audible) {
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute('muted');
      video.volume = 1;
    } else {
      // Required for autoplay in browsers that block autoplay with sound.
      video.muted = true;
      video.defaultMuted = true;
      video.setAttribute('muted', '');
    }

    const promise = video.play();
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // Retry silently if the browser blocks audible autoplay.
        if (!video.muted) {
          video.muted = true;
          video.defaultMuted = true;
          video.setAttribute('muted', '');
          const retry = video.play();
          if (retry && typeof retry.catch === 'function') retry.catch(() => {});
        }
      });
    }
  }

  function activateAudio(video) {
    userActivatedAudio = true;
    play(video, { audible: true });
  }

  function areaVisibility(video) {
    const r = video.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return 0;
    const visibleW = Math.max(0, Math.min(r.right, window.innerWidth) - Math.max(r.left, 0));
    const visibleH = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    return (visibleW * visibleH) / (r.width * r.height);
  }

  function choose65() {
    let best = null;
    let bestRatio = 0;

    videos.forEach((video) => {
      if (getComputedStyle(video).display === 'none') return;
      const ratio = areaVisibility(video);
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = video;
      }
    });

    if (!best) return;

    if (bestRatio >= 0.65) {
      if (activeVideo !== best || best.paused) play(best);
      return;
    }

    // Do not wait for an exact 65% crossing when a scroll leaves the viewport
    // between two cards. Keep the dominant card playing from 35% upward.
    if (bestRatio >= 0.35) {
      if (activeVideo !== best || best.paused) play(best);
    } else if (activeVideo) {
      activeVideo.pause();
      activeVideo.classList.remove('is-autoplaying');
      activeVideo = null;
    }
  }

  videos.forEach((video) => {
    prep(video);

    if (finePointer()) {
      video.addEventListener('mouseenter', () => play(video));
      video.addEventListener('mouseleave', () => {
        if (activeVideo === video) {
          video.pause();
          video.classList.remove('is-autoplaying');
          activeVideo = null;
        }
      });
    }

    // A user tap/click is allowed to unlock audio.
    video.addEventListener('pointerdown', () => {
      userActivatedAudio = true;
    }, { passive: true });

    video.addEventListener('click', () => activateAudio(video));
    video.addEventListener('play', () => {
      activeVideo = video;
      pauseOthers(video);
    });
  });

  let scanQueued = false;
  function queueScan() {
    if (scanQueued) return;
    scanQueued = true;
    requestAnimationFrame(() => {
      scanQueued = false;
      choose65();
    });
  }

  window.addEventListener('scroll', queueScan, { passive: true });
  window.addEventListener('resize', queueScan, { passive: true });
  window.addEventListener('orientationchange', () => setTimeout(queueScan, 100), { passive: true });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(queueScan, {
      threshold: [0, 0.25, 0.35, 0.5, 0.65, 0.8, 1],
      rootMargin: '0px'
    });
    videos.forEach((video) => observer.observe(video));
  }

  // Start the dominant preview after layout/media initialization.
  window.addEventListener('load', () => {
    choose65();
    setTimeout(choose65, 250);
    setTimeout(choose65, 900);
  });
  setTimeout(choose65, 100);

  if (watch) {
    watch.addEventListener('click', () => {
      userActivatedAudio = true;
      if (previewSection) previewSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        const first = document.querySelector('video[data-preview="01"]');
        if (first) activateAudio(first);
      }, 650);
    });
  }

  const preview04 = document.querySelector('video[data-preview="04"] source');
  if (preview04) {
    preview04.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    preview04.parentElement.load();
  }

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