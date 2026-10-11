/*
 * Núcleo compartilhado pelos três sites.
 * - Monta as fotos (Unsplash) e vídeos (Wikimedia Commons) a partir de data-attributes
 * - Liga Lenis (scroll suave) ao ticker do GSAP / ScrollTrigger
 * - Toca/pausa vídeos conforme entram e saem da tela
 */
(function () {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const UNSPLASH = 'https://images.unsplash.com/';
  const COMMONS = 'https://upload.wikimedia.org/wikipedia/commons/';

  const photo = (id, w, q = 72) => `${UNSPLASH}${id}?auto=format&fit=crop&q=${q}&w=${w}`;

  /* ---------- Fotos ---------- */
  document.querySelectorAll('img[data-u]').forEach((img) => {
    const id = img.dataset.u;
    const widths = (img.dataset.w || '640,1080,1600,2200').split(',').map(Number);
    img.srcset = widths.map((w) => `${photo(id, w)} ${w}w`).join(', ');
    img.sizes = img.dataset.sizes || '100vw';
    img.src = photo(id, widths[Math.min(2, widths.length - 1)]);
    img.decoding = 'async';
    if (!img.hasAttribute('loading')) img.loading = 'lazy';
    img.addEventListener('load', () => img.classList.add('is-in'), { once: true });
    img.addEventListener('error', () => img.classList.add('is-broken'), { once: true });
  });

  /* ---------- Vídeos ----------
   * data-commons="c/c7/Arquivo.webm" -> tenta 720p, 480p, 1080p (transcodes) e o original.
   * Se nada carregar, fica o poster (uma foto do Unsplash), então nunca aparece buraco preto.
   */
  const videos = [...document.querySelectorAll('video[data-commons]')];
  const attachSources = (v) => {
    if (v.dataset.ready) return;
    v.dataset.ready = '1';
    const path = v.dataset.commons;
    const name = path.split('/').pop();
    const order = (v.dataset.q || '720p,480p,1080p').split(',');
    const urls = order.map((q) => `${COMMONS}transcoded/${path}/${name}.${q}.vp9.webm`);
    urls.push(COMMONS + path);
    urls.forEach((u) => {
      const s = document.createElement('source');
      s.src = encodeURI(u);
      s.type = 'video/webm';
      v.appendChild(s);
    });
    v.load();
  };

  videos.forEach((v) => {
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.preload = v.dataset.scrub ? 'auto' : 'metadata';
    if (v.dataset.poster) v.poster = photo(v.dataset.poster, 1600, 65);
    if (!v.dataset.scrub) v.loop = true;
  });

  if ('IntersectionObserver' in window) {
    // carrega antes de aparecer
    const near = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && attachSources(e.target)),
      { rootMargin: '120% 0px' }
    );
    // toca só o que está visível
    const seen = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          const v = e.target;
          if (v.dataset.scrub) return;
          if (e.isIntersecting && !reduce) v.play().catch(() => {});
          else v.pause();
        }),
      { threshold: 0.05 }
    );
    videos.forEach((v) => {
      near.observe(v);
      seen.observe(v);
    });
  } else {
    videos.forEach(attachSources);
  }

  /* ---------- Scroll suave ---------- */
  let lenis = null;
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    if (window.SplitText) gsap.registerPlugin(SplitText);
    if (!reduce && window.Lenis) {
      lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9 });
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 && document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.6 });
    else target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  // Quando fotos chegam depois do layout, as medidas do ScrollTrigger mudam.
  window.addEventListener('load', () => window.ScrollTrigger && ScrollTrigger.refresh());

  /* ---------- Utilitários ---------- */

  // Liga o currentTime de um vídeo a um progresso 0..1, com suavização.
  function scrubVideo(video) {
    let target = 0;
    let busy = 0;
    video.addEventListener('seeked', () => (busy = 0));
    const tick = () => {
      const d = video.duration;
      if (busy && performance.now() - busy > 500) busy = 0; // seek travado não bloqueia para sempre
      if (d && isFinite(d) && !busy) {
        const want = Math.min(d - 0.05, target * d);
        if (Math.abs(video.currentTime - want) > 0.04) {
          busy = performance.now();
          video.currentTime = video.currentTime + (want - video.currentTime) * 0.35;
        }
      }
    };
    if (window.gsap) gsap.ticker.add(tick);
    return {
      set(p) {
        target = p;
      },
    };
  }

  // Formata segundos como timecode de cinema 00:00:00:00 (24 fps)
  function timecode(sec) {
    const f = Math.floor((sec % 1) * 24);
    const s = Math.floor(sec) % 60;
    const m = Math.floor(sec / 60) % 60;
    const h = Math.floor(sec / 3600);
    const p = (n) => String(n).padStart(2, '0');
    return `${p(h)}:${p(m)}:${p(s)}:${p(f)}`;
  }

  // Imagem flutuante que segue o cursor sobre listas (índices, programação)
  function hoverPreview(listSelector, rowSelector) {
    const list = document.querySelector(listSelector);
    if (!list || !window.matchMedia('(hover: hover)').matches) return;
    const box = document.createElement('div');
    box.className = 'hover-preview';
    box.innerHTML = '<img alt="">';
    document.body.appendChild(box);
    const img = box.firstChild;
    const xTo = gsap.quickTo(box, 'x', { duration: 0.55, ease: 'power3' });
    const yTo = gsap.quickTo(box, 'y', { duration: 0.55, ease: 'power3' });
    list.addEventListener('pointermove', (e) => {
      xTo(e.clientX);
      yTo(e.clientY);
    });
    list.querySelectorAll(rowSelector).forEach((row) => {
      row.addEventListener('pointerenter', () => {
        const id = row.dataset.preview;
        if (!id) return;
        img.src = photo(id, 640, 70);
        box.classList.add('on');
      });
      row.addEventListener('pointerleave', () => box.classList.remove('on'));
    });
  }

  window.SITE = { reduce, lenis, photo, scrubVideo, timecode, hoverPreview };
})();
