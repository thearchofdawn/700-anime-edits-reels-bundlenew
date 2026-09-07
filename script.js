(() => {
  const videos = [...document.querySelectorAll('video[data-preview]')];
  const hero = document.querySelector('video[data-preview="hero"]');
  const watch = document.getElementById('watch-previews');
  const finePointer = () => window.matchMedia('(pointer:fine)').matches;
  let userInteracted = false;
  let activeVideo = null;

  const prepareAutoplay = (v) => {
    if (!v) return;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.muted = !userInteracted;
    v.defaultMuted = !userInteracted;
    if (userInteracted) v.volume = 1;
  };

  const pauseOthers = (current) => {
    videos.forEach((v) => {
      if (v !== current && !v.paused) v.pause();
    });
  };

  const playPreview = (v, userInitiated = false) => {
    if (!v) return;
    if (userInitiated) userInteracted = true;
    activeVideo = v;
    pauseOthers(v);
    prepareAutoplay(v);
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  const playWithAudio = (v) => {
    if (!v) return;
    userInteracted = true;
    activeVideo = v;
    pauseOthers(v);
    v.muted = false;
    v.defaultMuted = false;
    v.volume = 1;
    const p = v.play();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  };

  const preview04 = document.querySelector('video[data-preview="04"] source');
  if (preview04) {
    preview04.src = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    preview04.parentElement.load();
  }

  videos.forEach((v) => {
    prepareAutoplay(v);
    v.addEventListener('loadedmetadata', () => prepareAutoplay(v));
    v.addEventListener('mouseenter', () => { if (finePointer()) playPreview(v); });
    v.addEventListener('mouseleave', () => { if (finePointer() && v !== hero) v.pause(); });
    v.addEventListener('pointerdown', () => { userInteracted = true; }, { passive: true });
    v.addEventListener('click', () => playWithAudio(v));
    v.addEventListener('play', () => { activeVideo = v; pauseOthers(v); });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      let best = null;
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.3) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
      }
      if (best) playPreview(best.target);
      entries.forEach((entry) => {
        if (!entry.isIntersecting && entry.target !== activeVideo) entry.target.pause();
      });
    }, { threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9], rootMargin: '100px 0px 100px 0px' });
    videos.forEach((v) => observer.observe(v));
  }

  if (watch) {
    watch.addEventListener('click', () => {
      const first = document.querySelector('video[data-preview="01"]');
      const section = document.getElementById('previews');
      userInteracted = true;
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => playWithAudio(first), 600);
    });
  }

  const countdown = document.getElementById('countdown');
  if (countdown) {
    const deadline = new Date('2026-09-08T18:00:00+05:30').getTime();
    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) { countdown.textContent = 'PRICE NOW ₹299'; return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      countdown.textContent = `${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s LEFT`;
    };
    tick();
    setInterval(tick, 1000);
  }

  document.querySelectorAll('.buy').forEach((a) => {
    a.addEventListener('click', () => { try { fbq('track', 'InitiateCheckout'); } catch (_) {} });
  });
})();