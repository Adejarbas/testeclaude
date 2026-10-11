(function () {
  /* ========= Dados da loja — troque aqui ========= */
  const LOJA = {
    whatsapp: '5511900000000', // DDI + DDD + número, só dígitos
    tz: 'America/Sao_Paulo',
    // [abre, fecha] em horas por dia da semana (0 = domingo)
    horario: { 0: null, 1: [8, 19], 2: [8, 19], 3: [8, 19], 4: [8, 19], 5: [8, 19], 6: [8, 17] },
  };

  // Preço por porte [P, M, G, GG]; "longo" soma o adicional de pelo longo
  const SERVICOS = {
    cao: [
      { nome: 'Banho', obs: 'Shampoo neutro, ouvidos e perfume leve', preco: [65, 80, 100, 130], longo: [15, 20, 30, 40] },
      { nome: 'Banho + tosa higiênica', obs: 'Patas, barriga e região íntima', preco: [85, 105, 130, 165], longo: [15, 20, 30, 40] },
      { nome: 'Banho + tosa na máquina', obs: 'Corte completo, mesmo comprimento', preco: [110, 135, 170, 210], longo: [10, 15, 20, 30] },
      { nome: 'Banho + tosa na tesoura', obs: 'Acabamento à mão, leva mais tempo', preco: [140, 170, 210, 260], longo: [10, 15, 20, 30] },
      { nome: 'Hidratação', obs: 'Adicional ao banho', preco: [25, 30, 40, 50], longo: [5, 10, 10, 15] },
      { nome: 'Corte de unhas', obs: 'Avulso, sem banho', preco: [20, 20, 25, 25], longo: [0, 0, 0, 0] },
    ],
    gato: [
      { nome: 'Banho', obs: 'Manhã só de gatos, terça e quinta', preco: [90], longo: [20] },
      { nome: 'Banho + tosa higiênica', obs: 'Manhã só de gatos, terça e quinta', preco: [120], longo: [20] },
      { nome: 'Tosa completa', obs: 'Indicada para persas e pelo longo', preco: [160], longo: [0] },
      { nome: 'Corte de unhas', obs: 'Avulso', preco: [25], longo: [0] },
    ],
  };
  /* =============================================== */

  const { reduce } = window.SITE;
  const brl = (n) => 'R$ ' + n.toLocaleString('pt-BR');

  /* ---------- aberto agora? ---------- */
  const status = document.querySelector('[data-status]');
  function nowInStore() {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: LOJA.tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t).value;
    const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
    return { day, h: (+get('hour') % 24) + +get('minute') / 60 };
  }
  function updateStatus() {
    const { day, h } = nowInStore();
    const today = LOJA.horario[day];
    let text, open = false;
    if (today && h >= today[0] && h < today[1]) {
      open = true;
      text = `Aberto agora · até ${today[1]}h`;
    } else {
      // próximo dia com expediente
      let d = day, label = 'hoje';
      if (!today || h >= today[1]) {
        for (let i = 1; i <= 7; i++) {
          d = (day + i) % 7;
          if (LOJA.horario[d]) { label = i === 1 ? 'amanhã' : ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'][d]; break; }
        }
      }
      text = `Fechado · abre ${label} às ${LOJA.horario[d][0]}h`;
    }
    status.textContent = text;
    status.classList.toggle('open', open);
    document.querySelectorAll('.hours tr').forEach((tr) => tr.classList.toggle('today', +tr.dataset.day === day));
  }
  updateStatus();
  setInterval(updateStatus, 60000);

  /* ---------- tabela de preços ---------- */
  const state = { species: 'cao', size: 0, coat: 'curto' };
  const rowsEl = document.querySelector('[data-rows]');
  const sizePicker = document.querySelector('[data-only="cao"]');

  function renderPrices(animate) {
    const list = SERVICOS[state.species];
    const size = state.species === 'gato' ? 0 : state.size;
    rowsEl.innerHTML = list
      .map((s, i) => {
        const v = s.preco[size] + (state.coat === 'longo' ? s.longo[size] : 0);
        const from = s.nome === 'Hidratação' ? '<small>+</small>' : '';
        return `<tr><td class="svc">${s.nome}<small>${s.obs}</small></td><td class="val">${from}<span data-v="${v}">${brl(v)}</span></td><td class="act"><button type="button" data-book="${i}">Agendar este</button></td></tr>`;
      })
      .join('');
    if (animate && !reduce && window.gsap) {
      rowsEl.querySelectorAll('[data-v]').forEach((el) => {
        const o = { v: Math.round(+el.dataset.v * 0.8) };
        gsap.to(o, { v: +el.dataset.v, duration: 0.5, ease: 'power2.out', onUpdate: () => (el.textContent = brl(Math.round(o.v))) });
      });
    }
  }

  function bindRadios(attr, key, cast = (x) => x) {
    const btns = document.querySelectorAll(`[data-${attr}]`);
    btns.forEach((b) =>
      b.addEventListener('click', () => {
        btns.forEach((x) => x.setAttribute('aria-checked', String(x === b)));
        state[key] = cast(b.dataset[attr]);
        sizePicker.hidden = state.species === 'gato';
        renderPrices(true);
        syncForm();
      })
    );
  }
  bindRadios('species', 'species');
  bindRadios('size', 'size', Number);
  bindRadios('coat', 'coat');
  renderPrices(false);

  /* ---------- formulário → WhatsApp ---------- */
  const form = document.getElementById('form');
  const f = (n) => form.elements[n];
  const err = form.querySelector('.form__error');

  function fillServices() {
    const especie = f('especie').value === 'Gato' ? 'gato' : 'cao';
    const keep = f('servico').value;
    f('servico').innerHTML = SERVICOS[especie].map((s) => `<option>${s.nome}</option>`).join('');
    if ([...f('servico').options].some((o) => o.value === keep)) f('servico').value = keep;
    f('porte').closest('label').hidden = especie === 'gato';
  }
  function syncForm() {
    f('especie').value = state.species === 'gato' ? 'Gato' : 'Cão';
    f('porte').selectedIndex = state.size;
    fillServices();
  }
  f('especie').addEventListener('change', fillServices);
  syncForm();

  // "Agendar este" na tabela preenche o formulário e rola até ele
  rowsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (!b) return;
    syncForm();
    f('servico').selectedIndex = +b.dataset.book;
    const target = document.getElementById('agendar');
    if (window.SITE.lenis) window.SITE.lenis.scrollTo(target, { offset: -70 });
    else target.scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => f('pet').focus({ preventScroll: true }), 900);
  });

  // datas: a partir de hoje, sem domingo
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  f('dia').min = iso(new Date());

  const bairro = form.querySelector('.form__bairro');
  f('taxi').addEventListener('change', () => (bairro.hidden = !f('taxi').checked));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const problems = [];
    ['tutor', 'pet', 'dia'].forEach((n) => {
      const bad = !f(n).value.trim();
      f(n).setAttribute('aria-invalid', String(bad));
      if (bad) problems.push(n);
    });
    let dia = null;
    if (f('dia').value) {
      dia = new Date(f('dia').value + 'T12:00:00');
      if (dia.getDay() === 0) {
        problems.push('domingo');
        f('dia').setAttribute('aria-invalid', 'true');
      }
    }
    if (f('taxi').checked && !f('bairro').value.trim()) problems.push('bairro');
    if (problems.length) {
      err.hidden = false;
      err.textContent = problems.includes('domingo')
        ? 'Domingo a loja fica fechada. Escolha outro dia.'
        : problems.includes('bairro') && problems.length === 1
          ? 'Para o táxi dog, informe o endereço ou bairro.'
          : 'Preencha seu nome, o nome do pet e o dia.';
      return;
    }
    err.hidden = true;
    const especie = f('especie').value;
    const linhas = [
      `Olá! Quero agendar no Banho de Cheiro.`,
      ``,
      `Tutor: ${f('tutor').value.trim()}`,
      `Pet: ${f('pet').value.trim()} (${especie}${especie === 'Cão' ? ', porte ' + f('porte').value : ''})`,
      `Serviço: ${f('servico').value}`,
      `Dia: ${dia.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })} · ${f('periodo').value}`,
    ];
    if (f('taxi').checked) linhas.push(`Táxi dog: sim — ${f('bairro').value.trim()}`);
    if (f('obs').value.trim()) linhas.push(`Obs.: ${f('obs').value.trim()}`);
    window.open(`https://wa.me/${LOJA.whatsapp}?text=${encodeURIComponent(linhas.join('\n'))}`, '_blank', 'noopener');
  });

  /* ---------- galeria: arrastar com o mouse ---------- */
  const track = document.querySelector('.week__track');
  let down = null;
  track.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    down = { x: e.clientX, left: track.scrollLeft };
    track.classList.add('drag');
  });
  window.addEventListener('pointermove', (e) => down && (track.scrollLeft = down.left - (e.clientX - down.x)));
  window.addEventListener('pointerup', () => {
    down = null;
    track.classList.remove('drag');
  });

  /* ---------- barra fixa do celular aparece depois da abertura ---------- */
  const dock = document.querySelector('.dock');
  const heroObs = new IntersectionObserver(([e]) => dock.classList.toggle('on', !e.isIntersecting));
  heroObs.observe(document.querySelector('.hero__ctas'));

  /* ---------- como funciona: troca a foto conforme o passo ---------- */
  const imgs = [...document.querySelectorAll('.how__frame img')];
  const dots = [...document.querySelectorAll('.how__dots li')];
  const steps = [...document.querySelectorAll('.step')];
  const setStep = (i) => {
    imgs.forEach((im, k) => im.classList.toggle('on', k === i));
    dots.forEach((d, k) => d.classList.toggle('on', k <= i));
  };
  // as fotos da sequência carregam já, para a troca não piscar
  imgs.forEach((im) => (im.loading = 'eager'));

  if (reduce || !window.gsap) {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && setStep(+e.target.dataset.step)), { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach((s) => io.observe(s));
    return;
  }

  steps.forEach((s) => ScrollTrigger.create({ trigger: s, start: 'top 55%', end: 'bottom 55%', onToggle: (self) => self.isActive && setStep(+s.dataset.step) }));

  /* ---------- movimento ---------- */
  // abertura
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.hero__copy > *', { y: 40, opacity: 0, duration: 1.1, stagger: 0.08 })
    .from('.hero__tub', { clipPath: 'inset(100% 0 0 0 round 14px)', duration: 1.4 }, 0.15)
    .fromTo('.hero__title', { '--towel-x': 0 }, { '--towel-x': 1, duration: 0.9, ease: 'power3.inOut' }, 0.6)
    .from('.hero__tag', { scale: 0.6, rotate: -12, opacity: 0, duration: 0.8, ease: 'back.out(2)' }, 0.9);

  // vídeo da banheira desce devagar com o scroll
  gsap.to('.hero__tub video', { yPercent: 12, scale: 1.1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // faixa: anda com o scroll e acelera conforme a velocidade
  const row = document.querySelector('.ticker__row');
  let x = 0, boost = 0;
  ScrollTrigger.create({ trigger: '.ticker', start: 'top bottom', end: 'bottom top', onUpdate: (self) => (boost = gsap.utils.clamp(-14, 14, self.getVelocity() / 120)) });
  gsap.ticker.add(() => {
    x -= 0.6 + Math.abs(boost);
    boost *= 0.92;
    const half = row.scrollWidth / 2;
    if (-x >= half) x += half;
    row.style.transform = `translate3d(${x}px,0,0)`;
  });

  // creche: vídeo abre de um recorte menor
  gsap.fromTo('.daycare__video', { clipPath: 'inset(12% 10% 12% 10% round 22px)' }, {
    clipPath: 'inset(0% 0% 0% 0% round 22px)', ease: 'none',
    scrollTrigger: { trigger: '.daycare', start: 'top 85%', end: 'center center', scrub: true },
  });

  // gatos: foto redonda sobe mais rápido que o vídeo
  gsap.fromTo('.cats__inset', { yPercent: 40 }, { yPercent: -30, ease: 'none', scrollTrigger: { trigger: '.cats', start: 'top bottom', end: 'bottom top', scrub: true } });

  // entradas simples
  gsap.utils.toArray('.h2, .reviews blockquote, .daycare__facts div, .week__track figure').forEach((el) => {
    gsap.from(el, { y: 36, opacity: 0, duration: 0.9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%' } });
  });
})();
