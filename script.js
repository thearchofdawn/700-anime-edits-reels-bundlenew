(() => {
  const videos = [...document.querySelectorAll('video[data-preview]')];
  const hero = document.querySelector('video[data-preview="hero"]');
  const watch = document.getElementById('watch-previews');
  let userInteracted = false;

  const setAudio = (v) => {
    try {
      v.defaultMuted = false;
      v.muted = false;
      v.volume = 1;
    } catch (_) {}
  };

  const pauseOthers = (current) => {
    videos.forEach(v => { if (v !== current) v.pause(); });
  };

  const play = (v) => {
    if (!v) return;
    pauseOthers(v);
    setAudio(v);
    const p = v.play();
    if (p && p.catch) p.catch(() => {
      // Browsers may block autoplay with sound until the visitor interacts.
      // We do not permanently mute the preview; normal user-initiated playback stays at 100% volume.
      try { if (!userInteracted) { v.muted = true; v.play().catch(() => {}); } } catch (_) {}
    });
  };

  videos.forEach(v => {
    setAudio(v);

    v.addEventListener('play', () => {
      pauseOthers(v);
      if (v !== hero && hero) hero.pause();
      setAudio(v);
    });

    v.addEventListener('pointerup', () => {
      userInteracted = true;
      if (v.paused) play(v);
      else setAudio(v);
    });

    v.addEventListener('mouseenter', () => {
      if (window.matchMedia('(pointer:fine)').matches) play(v);
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      let best = null;
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
      });
      if (best) play(best.target);
    }, { threshold: [0.65] });
    videos.filter(v => v !== hero).forEach(v => observer.observe(v));
  }

  if (watch) {
    watch.addEventListener('click', () => {
      userInteracted = true;
      const first = document.querySelector('video[data-preview="01"]');
      const section = document.getElementById('previews');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => play(first), 450);
    });
  }

  document.querySelectorAll('.buy').forEach(a => {
    a.addEventListener('click', () => {
      try { fbq('track', 'InitiateCheckout'); } catch (_) {}
    });
  });
})();
