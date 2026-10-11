(function () {
  const { reduce, hoverPreview } = window.SITE;

  /* relógio de São Paulo */
  const clock = document.getElementById('clock');
  const fmt = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const tickClock = () => (clock.textContent = fmt.format(new Date()));
  tickClock();
  setInterval(tickClock, 1000);

  /* filtro do arquivo */
  const rows = [...document.querySelectorAll('.list__table tbody tr')];
  document.querySelectorAll('.filters button').forEach((b) =>
    b.addEventListener('click', () => {
      document.querySelectorAll('.filters button').forEach((x) => x.classList.toggle('on', x === b));
      rows.forEach((r) => r.classList.toggle('hide', b.dataset.f !== 'all' && r.dataset.t !== b.dataset.f));
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    })
  );
  hoverPreview('.list__table', 'tbody tr');

  if (reduce || !window.gsap) return;
  const mm = gsap.matchMedia();

  /* 1. Intro: o zoom entra por dentro do traço de uma letra.
   * Desenhamos a palavra num canvas para achar um pixel preto perto do centro
   * — é ali que fica a origem do zoom, então a tela termina toda "dentro" do vídeo. */
  const word = document.querySelector('.intro__word');
  const knock = document.querySelector('.intro__knock');

  function strokeOrigin() {
    const r = word.getBoundingClientRect();
    const k = knock.getBoundingClientRect();
    const cs = getComputedStyle(word);
    const c = document.createElement('canvas');
    c.width = Math.ceil(r.width);
    c.height = Math.ceil(r.height);
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.font = `${cs.fontStretch} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = cs.letterSpacing;
    ctx.textBaseline = 'middle';
    ctx.fillText(word.textContent, 0, c.height / 2);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    const dark = (x, y) => data[(y * c.width + x) * 4 + 3] > 200;
    const cy = Math.round(c.height * 0.55);
    // anda do centro para a direita até achar um traço; usa o meio desse traço
    let x = Math.round(c.width / 2);
    while (x < c.width && !dark(x, cy)) x++;
    if (x < c.width) {
      let x2 = x;
      while (x2 < c.width && dark(x2, cy)) x2++;
      const mx = Math.round((x + x2) / 2);
      let y1 = cy, y2 = cy;
      while (y1 > 0 && dark(mx, y1)) y1--;
      while (y2 < c.height && dark(mx, y2)) y2++;
      return `${r.left - k.left + mx}px ${r.top - k.top + Math.round((y1 + y2) / 2)}px`;
    }
    return '50% 50%';
  }

  const intro = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.intro', start: 'top top', end: '+=170%', scrub: 0.7, pin: true, invalidateOnRefresh: true },
  });
  intro
    .to('.intro__meta', { autoAlpha: 0, duration: 0.15 }, 0)
    .fromTo(knock, { scale: 1 }, { scale: 60, ease: 'power3.in', duration: 0.75 }, 0)
    .set(knock, { autoAlpha: 0 }, 0.75)
    .fromTo('.intro__claim', { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.15 }, 0.8)
    .to({}, { duration: 0.1 });

  const setOrigin = () => gsap.set(knock, { transformOrigin: strokeOrigin() });
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    setOrigin();
    ScrollTrigger.addEventListener('refreshInit', () => {
      const s = gsap.getProperty(knock, 'scale');
      gsap.set(knock, { scale: 1 });
      setOrigin();
      gsap.set(knock, { scale: s });
    });
  });

  gsap.from(word, { yPercent: 18, opacity: 0, duration: 1.4, ease: 'expo.out' });

  /* 2. Manifesto em linhas */
  document.querySelectorAll('.split').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 100, duration: 1, ease: 'power4.out', stagger: 0.07,
      scrollTrigger: { trigger: el, start: 'top 80%' },
    });
  });
  // números contam até o valor
  document.querySelectorAll('.manifesto__facts dd').forEach((dd) => {
    const raw = dd.textContent;
    const num = parseFloat(raw.replace(',', '.'));
    const dec = raw.includes(',') ? 1 : 0;
    const suffix = raw.replace(/[\d.,\s]/g, '');
    const pad = raw.match(/^\d+/) ? raw.match(/^\d+/)[0].length : 1;
    const o = { v: 0 };
    gsap.to(o, {
      v: num, duration: 1.8, ease: 'power2.out',
      scrollTrigger: { trigger: dd, start: 'top 90%' },
      onUpdate() {
        const s = dec ? o.v.toFixed(1).replace('.', ',') : String(Math.round(o.v)).padStart(pad, '0');
        dd.textContent = s + (suffix ? ' ' + suffix : '');
      },
    });
  });

  /* 3. Pilha: cada cartão afunda quando o próximo chega */
  const cards = [...document.querySelectorAll('.card')];
  cards.forEach((card, i) => {
    gsap.fromTo(card.querySelector('img'), { scale: 1.12 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: card, start: 'top bottom', end: 'top top', scrub: true },
    });
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.93, filter: 'brightness(0.55)', ease: 'none',
      scrollTrigger: { trigger: next, start: 'top bottom', end: 'top top', scrub: true },
    });
  });

  /* 4. Grade: o centro cresce até cobrir a tela, os vizinhos se afastam */
  const pin = document.querySelector('.zoom__pin');
  const center = document.querySelector('.zoom__center');
  const figs = [...document.querySelectorAll('.zoom__grid figure')];
  const zoom = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: { trigger: '.zoom', start: 'top top', end: 'bottom bottom', scrub: 0.6, invalidateOnRefresh: true },
  });
  zoom.to(center, {
    x: () => pin.clientWidth / 2 - (center.offsetLeft + center.offsetParent.offsetLeft + center.offsetWidth / 2),
    y: () => pin.clientHeight / 2 - (center.offsetTop + center.offsetParent.offsetTop + center.offsetHeight / 2),
    scale: () => Math.max(pin.clientWidth / center.offsetWidth, pin.clientHeight / center.offsetHeight) * 1.01,
    duration: 1,
  }, 0);
  figs.forEach((f, i) => {
    if (f === center) return;
    const col = (i % 3) - 1;
    const row = Math.floor(i / 3) - 1;
    zoom.to(f, { xPercent: col * 120, yPercent: row * 120, opacity: 0, duration: 1 }, 0);
  });
  zoom.to('.zoom__label', { opacity: 0, duration: 0.3 }, 0)
    .to('.zoom__caption', { opacity: 1, y: 0, duration: 0.25 }, 0.85)
    .to({}, { duration: 0.3 });

  /* 5. Linhas do arquivo */
  gsap.from('.list__table tbody tr', {
    opacity: 0, y: 24, duration: 0.7, ease: 'power3.out', stagger: 0.04,
    scrollTrigger: { trigger: '.list__table', start: 'top 80%' },
  });

  /* 6. Faixa de vídeo abre da esquerda para a direita */
  gsap.to('.band__clip', {
    clipPath: 'inset(0 0% 0 0)', ease: 'none',
    scrollTrigger: { trigger: '.band', start: 'top 85%', end: 'top 20%', scrub: true },
  });

  mm.add('(min-width: 761px)', () => {
    gsap.from('.end__mail', {
      xPercent: -12, ease: 'none',
      scrollTrigger: { trigger: '.end', start: 'top bottom', end: 'bottom bottom', scrub: true },
    });
  });
})();
