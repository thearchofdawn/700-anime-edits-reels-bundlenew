(() => {
  const videos = [...document.querySelectorAll('video[data-preview]')];
  const hero = document.querySelector('video[data-preview="hero"]');
  const watch = document.getElementById('watch-previews');
  let userInteracted = false;

  const setAudio = (v) => {
    if (!v) return;
    try {
      v.removeAttribute('muted');
      v.defaultMuted = false;
      v.muted = false;
      v.volume = 1;
    } catch (_) {}
  };

  const fixPreview04 = () => {
    const v = document.querySelector('video[data-preview="04"]');
    if (!v) return;
    const source = v.querySelector('source');
    if (source) {
      const replacement = 'https://raw.githubusercontent.com/thearchofdawn/700-anime-edits-reels-bundle/main/preview/preview-05.mp4.mp4';
      if (source.src !== replacement) {
        source.src = replacement;
        v.load();
      }
    }
  };

  const fixPreview01Label = () => {
    const label = document.querySelector('video[data-preview="01"]')?.closest('.preview')?.querySelector('.caption');
    if (label) label.textContent = 'PREVIEW 01.';
  };

  const pauseOthers = (current) => {
    videos.forEach(v => { if (v !== current) v.pause(); });
  };

  const play = (v) => {
    if (!v) return;
    pauseOthers(v);
    setAudio(v);
    const p = v.play();
    if (p && p.catch) {
      p.catch(() => {
        // Autoplay with sound can be blocked by the browser. Never mute as a workaround;
        // once the visitor interacts, playback starts at full volume.
      });
    }
  };

  fixPreview04();
  fixPreview01Label();

  videos.forEach(v => {
    setAudio(v);

    v.addEventListener('loadedmetadata', () => setAudio(v));
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
