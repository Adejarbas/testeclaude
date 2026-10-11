(function () {
  const { reduce, hoverPreview } = window.SITE;
  hoverPreview('.index__list', 'li');
  if (reduce || !window.gsap) return;

  const mm = gsap.matchMedia();

  /* 1. Abertura: a janela de vídeo abre, as metades do título se afastam */
  const hero = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.hero', start: 'top top', end: '+=160%', scrub: 0.8, pin: true },
  });
  hero
    .to('.hero__frame', { clipPath: 'inset(0% 0% 0% 0%)' }, 0)
    .to('.hero__frame video', { scale: 1 }, 0)
    .to('.hero__half--l', { xPercent: -95, yPercent: -40 }, 0)
    .to('.hero__half--r', { xPercent: 95, yPercent: 40 }, 0)
    .to('.hero__title', { color: '#ece7dc' }, 0.15)
    .to('.hero__top, .hero__foot', { autoAlpha: 0, y: -20, duration: 0.25 }, 0)
    .to('.hero__title', { autoAlpha: 0, duration: 0.25 }, 0.75);

  // entrada ao carregar
  gsap.from('.hero__half', { yPercent: 110, duration: 1.4, ease: 'expo.out', stagger: 0.08, delay: 0.1 });
  gsap.from('.hero__frame', { clipPath: 'inset(50% 50% 50% 50%)', duration: 1.6, ease: 'expo.inOut' });

  /* 2. Títulos entram linha por linha */
  document.querySelectorAll('.split').forEach((el) => {
    const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
    gsap.from(split.lines, {
      yPercent: 105, duration: 1.1, ease: 'power4.out', stagger: 0.09,
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
  });

  // fotos dentro de máscara: revela de baixo para cima e desacelera o zoom
  document.querySelectorAll('.mask').forEach((m) => {
    const img = m.querySelector('img');
    gsap.fromTo(m, { clipPath: 'inset(100% 0 0 0)' }, {
      clipPath: 'inset(0% 0 0 0)', duration: 1.4, ease: 'expo.out',
      scrollTrigger: { trigger: m, start: 'top 85%' },
    });
    gsap.fromTo(img, { scale: 1.25, yPercent: -6 }, {
      scale: 1, yPercent: 6, ease: 'none',
      scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* 3. Ensaio horizontal */
  const track = document.querySelector('.essay__track');
  const count = document.querySelector('.essay__count b');
  const plates = [...document.querySelectorAll('.plate')];
  const distance = () => track.scrollWidth - (window.innerWidth - (window.innerWidth > 800 ? document.querySelector('.essay__head').offsetWidth : 0));

  const horiz = gsap.to(track, {
    x: () => -distance(),
    ease: 'none',
    scrollTrigger: {
      trigger: '.essay',
      start: 'top top',
      end: () => '+=' + distance(),
      pin: '.essay__pin',
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate(self) {
        const n = Math.min(plates.length, Math.max(1, Math.round(self.progress * (plates.length - 1)) + 1));
        count.textContent = String(n).padStart(2, '0');
      },
    },
  });
  // parallax interno de cada foto durante o movimento horizontal
  plates.forEach((p) => {
    gsap.fromTo(p.querySelector('img'), { xPercent: -7 }, {
      xPercent: 7, ease: 'none',
      scrollTrigger: { trigger: p, containerAnimation: horiz, start: 'left right', end: 'right left', scrub: true },
    });
  });

  /* 4. Citação: as palavras acendem com o scroll */
  const q = document.querySelector('.pull__text');
  q.innerHTML = q.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  gsap.to('.pull__text .w', {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: '.pull', start: 'top 70%', end: 'bottom 60%', scrub: true },
  });

  /* 5. Duas velocidades */
  mm.add('(min-width: 801px)', () => {
    gsap.fromTo('.duo__small', { yPercent: 40 }, {
      yPercent: -60, ease: 'none',
      scrollTrigger: { trigger: '.duo', start: 'top bottom', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.duo__text', { yPercent: 20 }, {
      yPercent: -10, ease: 'none',
      scrollTrigger: { trigger: '.duo', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });

  /* 6. Tábua de marés: a curva desenha e o relógio troca */
  const line = document.querySelector('.tide__line');
  const len = line.getTotalLength();
  gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
  gsap.to(line, {
    strokeDashoffset: 0, ease: 'none',
    scrollTrigger: { trigger: '.tide', start: 'top top', end: 'bottom bottom', scrub: true },
  });
  // o relógio mostra o horário do cartão que já passou da metade da tela
  const hour = document.querySelector('.tide__hour');
  const steps = [...document.querySelectorAll('.tide__step')];
  ScrollTrigger.create({
    trigger: '.tide', start: 'top top', end: 'bottom bottom',
    onUpdate() {
      const mid = window.innerHeight * 0.6;
      let current = steps[0];
      steps.forEach((s) => s.getBoundingClientRect().top < mid && (current = s));
      if (hour.textContent === current.dataset.hour) return;
      hour.textContent = current.dataset.hour;
      gsap.fromTo(hour, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: 'power3.out' });
    },
  });
  steps.forEach((step) => {
    gsap.from(step, { y: 80, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: step, start: 'top 88%' } });
  });

  /* 7. Índice: linhas sobem em sequência */
  gsap.from('.index__list li', {
    y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.06,
    scrollTrigger: { trigger: '.index__list', start: 'top 80%' },
  });

  /* 8. Final: a moldura do vídeo abre */
  gsap.to('.outro__frame', {
    clipPath: 'inset(0% 0% 0% 0%)', ease: 'none',
    scrollTrigger: { trigger: '.outro', start: 'top top', end: 'bottom bottom', scrub: true },
  });
  gsap.from('.outro__line', {
    opacity: 0, y: 40, scrollTrigger: { trigger: '.outro', start: 'top 20%', end: 'center center', scrub: true },
  });
})();
