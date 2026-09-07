(() => {
  const videos = Array.from(document.querySelectorAll('video[data-preview]'));
  const watch = document.getElementById('watch-previews');
  let active = null;

  function prime(video) {
    if (!video) return;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.autoplay = true;
    video.preload = 'auto';
  }

  function stopOthers(current) {
    videos.forEach((video) => {
      if (video !== current) {
        video.pause();
        video.classList.remove('is-autoplaying');
      }
    });
  }

  function autoplay(video) {
    if (!video) return;
    prime(video);
    stopOthers(video);
    active = video;
    video.classList.add('is-autoplaying');
    const promise = video.play();
    if (promise && promise.catch) promise.catch(() => {});
  }

  // IMPORTANT: autoplay with sound is blocked by browsers. Silent hover/scroll autoplay is reliable.
  videos.forEach(prime);

  // Desktop hover autoplay.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    videos.forEach((video) => {
      video.addEventListener('mouseenter', () => autoplay(video));
      video.addEventListener('mouseleave', () => {
        if (active === video) video.pause();
      });
    });
  }

  // Mobile + desktop scroll autoplay. Pick the most visible video, not the first observer callback.
  let observer;
  if ('IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      let best = null;
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) continue;
        if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
      }
      if (best) autoplay(best.target);
    }, {
      threshold: [0.15, 0.25, 0.35, 0.5, 0.7, 0.85],
      rootMargin: '120px 0px 120px 0px'
    });
    videos.forEach((video) => observer.observe(video));
  }

  // Fallback for browsers without IntersectionObserver.
  let ticking = false;
  function scanViewport() {
    ticking = false;
    let best = null;
    let bestRatio = 0;
    videos.forEach((video) => {
      const rect = video.getBoundingClientRect();
      const visible = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
      const ratio = rect.height ? visible / rect.height : 0;
      if (ratio > bestRatio) {
        bestRatio = ratio;
        best = video;
      }
    });
    if (best && bestRatio >= 0.35) autoplay(best);
  }
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(scanViewport);
    }
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
  scanViewport();

  // A direct tap/click is a user gesture. Restart playback and allow audio.
  videos.forEach((video) => {
    video.addEventListener('click', () => {
      stopOthers(video);
      active = video;
      video.muted = false;
      video.defaultMuted = false;
      video.removeAttribute('muted');
      video.volume = 1;
      const promise = video.play();
      if (promise && promise.catch) promise.catch(() => {});
    });
  });

  if (watch) {
    watch.addEventListener('click', () => {
      const section = document.getElementById('previews');
      const first = document.querySelector('video[data-preview="01"]');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => autoplay(first), 450);
    });
  }

  // Keep preview 04 pointing to preview 08.
  const preview04 = document.querySelector('video[data-preview="04"] source');
  if (preview04) {
    preview04.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    preview04.parentElement.load();
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