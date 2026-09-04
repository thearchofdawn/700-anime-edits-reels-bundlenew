(() => {
  const videos = [...document.querySelectorAll('video[data-preview]')];
  const hero = document.querySelector('video[data-preview="hero"]');
  const watch = document.getElementById('watch-previews');

  const setFullAudio = (v) => {
    if (!v) return;
    v.muted = false;
    v.defaultMuted = false;
    v.volume = 1;
    v.removeAttribute('muted');
  };

  const pauseOthers = (current) => {
    videos.forEach((v) => {
      if (v !== current) v.pause();
    });
  };

  const playPreview = (v) => {
    if (!v) return;
    pauseOthers(v);
    setFullAudio(v);
    const promise = v.play();
    if (promise && promise.catch) {
      promise.catch(() => {
        // Keep the video unmuted at 100%. Browser autoplay policy may require interaction.
      });
    }
  };

  // Ensure Preview 04 uses preview-08.
  const preview04 = document.querySelector('video[data-preview="04"] source');
  if (preview04) {
    const preview08Url = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-08.mp4.mp4';
    if (preview04.src !== preview08Url) preview04.src = preview08Url;
    preview04.parentElement.load();
  }

  // Keep the page stat accurate: 6 real previews are currently shown in the main offer count.
  const previewStat = [...document.querySelectorAll('.insideStat')].find((el) =>
    el.querySelector('span')?.textContent.trim() === 'REAL PREVIEWS'
  );
  if (previewStat) {
    const number = previewStat.querySelector('b');
    if (number) number.textContent = '6';
  }

  videos.forEach((v) => {
    setFullAudio(v);

    v.addEventListener('loadedmetadata', () => setFullAudio(v));
    v.addEventListener('volumechange', () => {
      if (!v.muted) v.volume = 1;
    });
    v.addEventListener('play', () => {
      pauseOthers(v);
      if (v !== hero && hero) hero.pause();
      setFullAudio(v);
    });

    v.addEventListener('pointerup', () => {
      if (v.paused) playPreview(v);
      else setFullAudio(v);
    });

    v.addEventListener('mouseenter', () => {
      if (window.matchMedia('(pointer:fine)').matches) playPreview(v);
    });
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      let best = null;
      for (const entry of entries) {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.65) {
          if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
        }
      }
      if (best) playPreview(best.target);
    }, { threshold: [0.65] });

    videos.filter((v) => v !== hero).forEach((v) => observer.observe(v));
  }

  if (watch) {
    watch.addEventListener('click', () => {
      const first = document.querySelector('video[data-preview="01"]');
      const section = document.getElementById('previews');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => playPreview(first), 450);
    });
  }

  document.querySelectorAll('.buy').forEach((a) => {
    a.addEventListener('click', () => {
      try { fbq('track', 'InitiateCheckout'); } catch (_) {}
    });
  });
})();