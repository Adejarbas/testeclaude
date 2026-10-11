(function () {
  /* ========= Dados da loja — confira e troque aqui ========= */
  const LOJA = {
    whatsapp: {
      loja1: '5515996067923', // Vossoroca
      loja2: '5515997780180', // Jardim Icatu
    },
    msgPadrao: 'Olá! Vim pelo site da Pet Camargo.',
  };
  // Tamanhos de saco vendidos (kg)
  const SACOS = { cao: [1, 3, 10.1, 15, 20], gato: [1, 3, 7.5, 10.1] };
  /* ========================================================= */

  const { reduce } = window.SITE;
  const wa = (loja, text) => `https://wa.me/${LOJA.whatsapp[loja]}?text=${encodeURIComponent(text || LOJA.msgPadrao)}`;

  // todos os botões de WhatsApp apontam para o número certo
  document.querySelectorAll('[data-wa]').forEach((a) => {
    a.href = wa(a.dataset.wa, a.dataset.waText);
    a.target = '_blank';
    a.rel = 'noopener';
  });

  /* ---------- calculadora de ração ----------
   * Energia diária ≈ 70 × peso^0,75 × fator de rotina (kcal).
   * Ração seca tem perto de 3,6 kcal por grama (cães) e 3,8 (gatos). */
  const peso = document.getElementById('c-peso');
  const pesoOut = document.getElementById('c-peso-out');
  const ativ = document.getElementById('c-ativ');
  const outs = { dia: document.querySelector('[data-out="dia"]'), mes: document.querySelector('[data-out="mes"]'), saco: document.querySelector('[data-out="saco"]') };
  const calcWa = document.querySelector('[data-calc-wa]');
  const pick = [...document.querySelectorAll('[data-animal]')];
  let animal = 'cao';
  const fmt = (n, d = 1) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });

  function calc() {
    const kg = +peso.value;
    pesoOut.textContent = `${kg} kg`;
    const fator = animal === 'gato' ? { '1.4': 1.0, '1.6': 1.2, '2.0': 1.4 }[ativ.value] : +ativ.value;
    const kcal = 70 * Math.pow(kg, 0.75) * fator;
    const g = kcal / (animal === 'gato' ? 3.8 : 3.6);
    const mes = (g * 30) / 1000;
    // saco que dura entre 1 e 2 meses (ração aberta perde sabor depois disso)
    const sacos = SACOS[animal];
    let saco = sacos[0];
    sacos.forEach((s) => s / (g / 1000) <= 62 && (saco = s));
    const dias = Math.round(saco / (g / 1000));
    outs.dia.textContent = `${Math.round(g)} g`;
    outs.mes.textContent = `${fmt(mes)} kg`;
    outs.saco.textContent = `${fmt(saco, saco % 1 ? 1 : 0)} kg · dura ~${dias} dias`;
    calcWa.href = wa('loja2', `Olá! Quero um saco de ração de ${fmt(saco, saco % 1 ? 1 : 0)} kg para ${animal === 'gato' ? 'gato' : 'cão'} de ${kg} kg. Qual marca vocês indicam?`);
  }
  pick.forEach((b) =>
    b.addEventListener('click', () => {
      animal = b.dataset.animal;
      pick.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
      peso.max = animal === 'gato' ? 12 : 60;
      if (+peso.value > +peso.max) peso.value = 4;
      if (animal === 'gato' && +peso.value > 8) peso.value = 4;
      calc();
    })
  );
  peso.addEventListener('input', calc);
  ativ.addEventListener('change', calc);
  calc();

  if (reduce || !window.gsap) return;

  /* ---------- movimento ---------- */
  // abertura
  gsap.timeline({ defaults: { ease: 'expo.out' } })
    .from('.hero__text > *', { y: 40, opacity: 0, duration: 1.1, stagger: 0.08 })
    .from('.sack', { y: 80, rotate: 8, opacity: 0, duration: 1.3 }, 0.1);

  // o saco balança de leve com o scroll
  gsap.to('.sack', { rotate: -2, y: 40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // faixa de categorias, acelera com a velocidade do scroll
  const row = document.querySelector('.ticker__row');
  let x = 0, boost = 0;
  ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onUpdate: (s) => (boost = gsap.utils.clamp(-12, 12, s.getVelocity() / 140)) });
  gsap.ticker.add(() => {
    x -= 0.7 + Math.abs(boost);
    boost *= 0.92;
    const half = row.scrollWidth / 2;
    if (-x >= half) x += half;
    row.style.transform = `translate3d(${x}px,0,0)`;
  });

  // corredor: no computador os sacos andam de lado enquanto a seção fica parada
  const mm = gsap.matchMedia();
  mm.add('(min-width: 861px)', () => {
    const track = document.querySelector('.aisle__track');
    const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.aisle', start: 'top top', end: () => '+=' + dist(), pin: '.aisle__pin', scrub: 0.6, invalidateOnRefresh: true },
    });
    gsap.utils.toArray('.bag').forEach((b, i) => gsap.set(b, { rotate: i % 2 ? 1.2 : -1.2 }));
  });

  // carimbo "sem gaiola" bate na foto
  gsap.from('.stamp', {
    scale: 2.4, opacity: 0, rotate: -40, duration: 0.6, ease: 'power4.in',
    scrollTrigger: { trigger: '.bath', start: 'top 60%' },
    onComplete: () => gsap.fromTo('.bath__media', { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' }),
  });

  // vídeo do gado com parallax
  gsap.fromTo('.farm video', { yPercent: -8, scale: 1.15 }, { yPercent: 8, scale: 1.15, ease: 'none', scrollTrigger: { trigger: '.farm', start: 'top bottom', end: 'bottom top', scrub: true } });

  // entradas simples
  gsap.utils.toArray('.h2, .farm__cols ul, .buy__ways div, .store').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
})();
