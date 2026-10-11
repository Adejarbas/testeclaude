(function () {
  const { reduce, hoverPreview, scrubVideo, timecode } = window.SITE;

  /* abas do programa */
  const tabs = [...document.querySelectorAll('.days button')];
  const items = [...document.querySelectorAll('.prog__list li')];
  const showDay = (d) => {
    tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.d === d)));
    items.forEach((li) => (li.hidden = li.dataset.d !== d));
    if (!reduce && window.gsap) {
      gsap.fromTo(items.filter((li) => !li.hidden), { opacity: 0, x: -20 }, { opacity: 1, x: 0, stagger: 0.06, duration: 0.5, ease: 'power3.out' });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  tabs.forEach((t) => t.addEventListener('click', () => showDay(t.dataset.d)));
  items.forEach((li) => (li.hidden = li.dataset.d !== 'qui'));
  hoverPreview('.prog__list', 'li');

  /* timecode da abertura acompanha o vídeo */
  const openVideo = document.querySelector('.open__screen video');
  const openTc = document.querySelector('[data-tc]');
  openVideo.addEventListener('timeupdate', () => (openTc.textContent = timecode(openVideo.currentTime)));

  if (reduce || !window.gsap) return;

  /* 1. Abertura: tarjas recolhem, título se separa, frase aparece */
  gsap.from('.open__title span', { yPercent: 100, opacity: 0, duration: 1.6, ease: 'expo.out', stagger: 0.12, delay: 0.2 });
  gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.open', start: 'top top', end: '+=140%', scrub: 0.6, pin: true },
  })
    .to('.open__bar--t', { yPercent: -100 }, 0)
    .to('.open__bar--b', { yPercent: 100 }, 0)
    .to('.open__screen video', { scale: 1 }, 0)
    .to('.open__title span:first-child', { xPercent: -30, opacity: 0 }, 0)
    .to('.open__title span:last-child', { xPercent: 30, opacity: 0 }, 0)
    .to('.open__meta', { opacity: 0, duration: 0.3 }, 0)
    .to('.open__sub', { opacity: 1, duration: 0.3 }, 0.45)
    .to('.open__sub', { opacity: 0, y: -30, duration: 0.25 }, 0.85);

  /* 2. Túnel: a câmera atravessa os fotogramas em Z */
  const slabs = [...document.querySelectorAll('.slab')];
  const count = document.querySelector('.tunnel__count span');
  const GAP = 750;
  const last = slabs.length - 1;
  const endZ = last * GAP - 260; // para com o último quadro bem perto da câmera
  const place = (cam) => {
    let nearest = 0;
    slabs.forEach((s, i) => {
      const z = -i * GAP + cam;
      const x = (+s.dataset.x || 0) * (i === last ? 0 : 1.35);
      const y = (+s.dataset.y || 0) * (i === last ? 0 : 1.3);
      // some quando passa da câmera, aparece aos poucos lá no fundo
      let o = 1;
      if (z > 0) o = Math.max(0, 1 - z / 380);
      else if (z < -GAP * 4) o = Math.max(0, 1 - (-z - GAP * 4) / GAP);
      s.style.transform = `translate(-50%, -50%) translate3d(${x}vw, ${y}vh, ${z}px)`;
      s.style.opacity = o;
      s.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      if (z < 400 && z > -GAP * 0.6) nearest = i;
    });
    count.textContent = String(nearest + 1).padStart(2, '0');
  };
  place(0);
  ScrollTrigger.create({
    trigger: '.tunnel', start: 'top top', end: 'bottom bottom', scrub: true,
    onUpdate: (self) => place(gsap.utils.interpolate(0, endZ, self.progress)),
  });

  /* 3. Vídeo comandado pelo scroll */
  const sv = document.querySelector('.scrub video');
  const scrub = scrubVideo(sv);
  const tc = document.querySelector('[data-scrub-tc]');
  const bar = document.querySelector('.scrub__bar i');
  const lines = [...document.querySelectorAll('.scrub__lines p')];
  sv.addEventListener('timeupdate', () => (tc.textContent = timecode(sv.currentTime)));
  sv.addEventListener('seeked', () => (tc.textContent = timecode(sv.currentTime)));
  ScrollTrigger.create({
    trigger: '.scrub', start: 'top top', end: 'bottom bottom',
    onUpdate(self) {
      scrub.set(self.progress);
      bar.style.transform = `scaleX(${self.progress})`;
      const active = Math.min(lines.length - 1, Math.floor(self.progress * lines.length));
      lines.forEach((l, i) => {
        if (l._on === (i === active)) return;
        l._on = i === active;
        gsap.to(l, { opacity: l._on ? 1 : 0, y: l._on ? 0 : i < active ? -30 : 30, duration: 0.6, ease: 'power3.out' });
      });
    },
  });

  /* 4. Programa: linhas entram */
  gsap.from('.prog__head h2', { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.prog', start: 'top 75%' } });

  /* 5. Película: corre com o scroll e inclina conforme a velocidade */
  const strip = document.querySelector('.reel__strip');
  const skewTo = gsap.quickTo(strip, 'skewX', { duration: 0.5, ease: 'power3' });
  gsap.fromTo(strip, { x: () => window.innerWidth * 0.1 }, {
    x: () => -(strip.scrollWidth - window.innerWidth * 0.9),
    ease: 'none',
    scrollTrigger: {
      trigger: '.reel', start: 'top bottom', end: 'bottom top', scrub: 0.4, invalidateOnRefresh: true,
      onUpdate: (self) => skewTo(gsap.utils.clamp(-8, 8, self.getVelocity() / -300)),
    },
  });

  /* 6. Meia-noite */
  const nightSplit = SplitText.create('.night__title', { type: 'lines', mask: 'lines' });
  gsap.from(nightSplit.lines, { yPercent: 100, duration: 1.2, ease: 'expo.out', stagger: 0.1, scrollTrigger: { trigger: '.night', start: 'top 55%' } });
  gsap.fromTo('.night video', { scale: 1.2 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.night', start: 'top bottom', end: 'bottom top', scrub: true } });

  /* 7. Ingressos caem na mesa */
  gsap.from('.ticket', {
    y: 120, rotate: (i) => (i ? 6 : -5), opacity: 0, duration: 1.1, ease: 'expo.out', stagger: 0.15,
    scrollTrigger: { trigger: '.tickets__row', start: 'top 85%' },
  });
})();
