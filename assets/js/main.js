/* =========================================================
   PROJECT N1 — interactions
   ========================================================= */
(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Boot overlay (once per session) ---------- */
  (function boot() {
    const el = $('#boot');
    let seen = false;
    try { seen = sessionStorage.getItem('n1-boot') === '1'; sessionStorage.setItem('n1-boot', '1'); } catch (e) { seen = true; }
    if (seen || reduce) return;
    const log = $('#bootLog');
    const lines = ['> PROJECT N1 // TACTICAL NET', '> AUTH ............ OK', '> SCOPE CALIBRATE . OK', '> FIELD GRID ...... LOADED', '> ENTERING THE PLYWOOD JUNGLE_'];
    el.classList.add('is-on');
    document.documentElement.style.overflow = 'hidden';
    let i = 0;
    const t = setInterval(() => { log.textContent += (i ? '\n' : '') + lines[i++]; if (i >= lines.length) clearInterval(t); }, 190);
    setTimeout(() => {
      el.classList.add('is-done');
      document.documentElement.style.overflow = '';
      setTimeout(() => el.remove(), 500);
    }, 1350);
  })();

  /* ---------- Mobile nav ---------- */
  const toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    links.classList.toggle('is-open', open);
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); links.classList.remove('is-open'); }
  });

  /* ---------- Active nav link on scroll ---------- */
  const navMap = new Map($$('#navLinks a').map(a => [a.getAttribute('href').slice(1), a]));
  const secObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      navMap.forEach(a => a.classList.remove('is-active'));
      const a = navMap.get(en.target.id); if (a) a.classList.add('is-active');
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((_, id) => { const s = document.getElementById(id); if (s) secObs.observe(s); });

  /* ---------- Clock + live field status (Pacific time) ---------- */
  // day: [openHour, closeHour] in 24h local PT; close 24 = midnight
  const HOURS = { 0: [13, 22], 1: [17, 22], 2: [17, 22], 3: [17, 22], 4: [17, 22], 5: [19, 24], 6: [13, 22] };
  const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const fmt12 = h => { const hh = h % 24; return (hh % 12 || 12) + (hh < 12 ? ' AM' : ' PM'); };
  function ptNow() {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23' })
      .formatToParts(new Date()).map(x => [x.type, x.value]));
    return { day: DAYS.indexOf(p.weekday.toUpperCase()), h: +p.hour, m: +p.minute, s: +p.second };
  }
  const statusEl = $('#navStatus'), clockEl = $('#navClock');
  function tickStatus() {
    const n = ptNow(), pad = v => String(v).padStart(2, '0');
    clockEl.textContent = `${pad(n.h)}:${pad(n.m)}:${pad(n.s)} PT`;
    const now = n.h + n.m / 60, [o, c] = HOURS[n.day];
    let text, open = now >= o && now < c;
    if (open) text = `Field hot · til ${c === 24 ? 'midnight' : fmt12(c)}`;
    else if (now < o) text = `Field cold · opens ${fmt12(o)}`;
    else { const nd = (n.day + 1) % 7; text = `Field cold · opens ${DAYS[nd]} ${fmt12(HOURS[nd][0])}`; }
    statusEl.classList.toggle('is-open', open);
    statusEl.classList.toggle('is-closed', !open);
    statusEl.lastElementChild.textContent = text;
  }
  tickStatus(); setInterval(tickStatus, 1000);

  // highlight today's admission card
  const today = ptNow().day;
  $$('.price[data-days]').forEach(c => { if (c.dataset.days.split(',').map(Number).includes(today)) c.classList.add('is-today'); });

  /* ---------- Text scramble ---------- */
  const GLYPHS = '!<>-_\\/[]{}=+*^?#01ABCDEFNX';
  function scramble(el) {
    if (reduce || el.dataset.done) return;
    el.dataset.done = 1;
    // work on text nodes so inner <em> etc. survive
    const nodes = [];
    const walk = n => n.childNodes.forEach(c => c.nodeType === 3 ? nodes.push(c) : walk(c));
    walk(el);
    const finals = nodes.map(n => n.nodeValue);
    const total = finals.join('').length, dur = Math.min(900, 380 + total * 18);
    const start = performance.now();
    (function frame(t) {
      const p = Math.min(1, (t - start) / dur);
      let idx = 0;
      nodes.forEach((n, k) => {
        const f = finals[k];
        let out = '';
        for (let i = 0; i < f.length; i++, idx++) {
          const reveal = idx / total < p * 1.15 - 0.15;
          out += reveal || f[i] === ' ' ? f[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        n.nodeValue = out;
      });
      if (p < 1) requestAnimationFrame(frame); else nodes.forEach((n, k) => (n.nodeValue = finals[k]));
    })(start);
  }

  /* ---------- Reveal on scroll ---------- */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      $$('[data-scramble]', en.target).forEach(scramble);
      if (en.target.matches('[data-scramble]')) scramble(en.target);
      revObs.unobserve(en.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => revObs.observe(el));
  // hero headline scrambles on load (after boot)
  setTimeout(() => $$('.hero [data-scramble]').forEach((el, i) => setTimeout(() => scramble(el), i * 140)), $('#boot.is-on') ? 1300 : 150);

  /* ---------- Tabs ---------- */
  const tabs = $$('[role="tab"]');
  function selectTab(tab, focus) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => selectTab(t));
    t.addEventListener('keydown', e => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });
  // deep-link: game-mode links to the Nerf tab
  if (location.hash === '#nerf') selectTab($('#tab-nerf'));

  /* ---------- Hero laser targeting ---------- */
  const hero = $('.hero'), target = $('#target');
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduce) {
    const h = $('.target__h', target), v = $('.target__v', target), r = $('.target__reticle', target), read = $('#targetRead');
    let tx = 0, ty = 0, cx = 0, cy = 0, raf = 0;
    const loop = () => {
      cx += (tx - cx) * 0.22; cy += (ty - cy) * 0.22;
      h.style.transform = `translateY(${cy}px)`;
      v.style.transform = `translateX(${cx}px)`;
      r.style.transform = `translate(${cx}px, ${cy}px)`;
      read.style.transform = `translate(${cx + 30}px, ${cy + 26}px)`;
      read.textContent = `GRID ${String(Math.round(cx / 8)).padStart(3, '0')} / ${String(Math.round(cy / 8)).padStart(3, '0')}`;
      raf = Math.abs(tx - cx) + Math.abs(ty - cy) > 0.3 ? requestAnimationFrame(loop) : 0;
    };
    hero.addEventListener('pointermove', e => {
      const b = hero.getBoundingClientRect();
      tx = e.clientX - b.left; ty = e.clientY - b.top;
      hero.classList.add('is-aiming');
      if (!raf) raf = requestAnimationFrame(loop);
    });
    hero.addEventListener('pointerleave', () => hero.classList.remove('is-aiming'));
  }

  /* ---------- Radar scope ---------- */
  (function radar() {
    const cv = $('#radar'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const countEl = $('#radarCount'), brgEl = $('#radarBrg');
    const topo = new Image(); topo.src = 'assets/img/topo.png';
    let W = 0, R = 0, dpr = 1, topoPat = null, visible = true;
    const PHOS = '77,255,136';
    const TAU = Math.PI * 2;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.clientWidth; R = W / 2;
      cv.width = W * dpr; cv.height = W * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildBase();
    }

    // static layer (rings, ticks, topo) cached offscreen
    let base = document.createElement('canvas');
    function buildBase() {
      base.width = W * dpr; base.height = W * dpr;
      const b = base.getContext('2d');
      b.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = b.createRadialGradient(R, R, 0, R, R, R);
      g.addColorStop(0, '#07190c'); g.addColorStop(1, '#020803');
      b.fillStyle = g; b.beginPath(); b.arc(R, R, R, 0, TAU); b.fill();
      b.save(); b.beginPath(); b.arc(R, R, R - 1, 0, TAU); b.clip();
      if (topo.complete && topo.naturalWidth) {
        // tint topo green on a temp canvas
        const t = document.createElement('canvas'); t.width = t.height = 512;
        const tc = t.getContext('2d'); tc.drawImage(topo, 0, 0, 512, 512);
        tc.globalCompositeOperation = 'source-in'; tc.fillStyle = `rgb(${PHOS})`; tc.fillRect(0, 0, 512, 512);
        b.globalAlpha = 0.16; topoPat = b.createPattern(t, 'repeat');
        b.fillStyle = topoPat; b.fillRect(0, 0, W, W); b.globalAlpha = 1;
      }
      // grid
      b.strokeStyle = `rgba(${PHOS},.06)`; b.lineWidth = 1;
      const step = W / 12;
      for (let x = step; x < W; x += step) { b.beginPath(); b.moveTo(x, 0); b.lineTo(x, W); b.moveTo(0, x); b.lineTo(W, x); b.stroke(); }
      b.restore();
      // rings
      for (let i = 1; i <= 4; i++) {
        b.strokeStyle = `rgba(${PHOS},${i === 4 ? .55 : .22})`; b.lineWidth = i === 4 ? 1.5 : 1;
        b.beginPath(); b.arc(R, R, (R - 2) * i / 4, 0, TAU); b.stroke();
        if (i < 4) { b.fillStyle = `rgba(${PHOS},.45)`; b.font = `${Math.max(9, W / 48)}px "Share Tech Mono", monospace`; b.fillText(`${i * 10}M`, R + 4, R - (R - 2) * i / 4 + 12); }
      }
      // crosshair
      b.strokeStyle = `rgba(${PHOS},.25)`; b.setLineDash([3, 5]);
      b.beginPath(); b.moveTo(R, 6); b.lineTo(R, W - 6); b.moveTo(6, R); b.lineTo(W - 6, R); b.stroke(); b.setLineDash([]);
      // diagonal lines
      b.strokeStyle = `rgba(${PHOS},.08)`;
      [Math.PI / 4, 3 * Math.PI / 4].forEach(a => { b.beginPath(); b.moveTo(R + Math.cos(a) * R, R + Math.sin(a) * R); b.lineTo(R - Math.cos(a) * R, R - Math.sin(a) * R); b.stroke(); });
      // bearing ticks
      for (let d = 0; d < 360; d += 5) {
        const a = (d - 90) * Math.PI / 180, long = d % 30 === 0, l = long ? 12 : 5;
        b.strokeStyle = `rgba(${PHOS},${long ? .8 : .35})`;
        b.beginPath(); b.moveTo(R + Math.cos(a) * (R - 2), R + Math.sin(a) * (R - 2)); b.lineTo(R + Math.cos(a) * (R - 2 - l), R + Math.sin(a) * (R - 2 - l)); b.stroke();
        if (long) {
          b.fillStyle = `rgba(${PHOS},.7)`; b.font = `${Math.max(9, W / 46)}px "Share Tech Mono", monospace`;
          b.textAlign = 'center'; b.textBaseline = 'middle';
          b.fillText(String(d).padStart(3, '0'), R + Math.cos(a) * (R - 26), R + Math.sin(a) * (R - 26));
        }
      }
      b.textAlign = 'start'; b.textBaseline = 'alphabetic';
    }
    topo.onload = () => W && buildBase();

    // contacts
    const LABELS = ['HOSTILE', 'HOSTILE', 'HOSTILE', 'FRIENDLY', 'UNK', 'HOSTILE', 'OBJ'];
    const blips = LABELS.map((lab, i) => ({
      r: 0.25 + Math.random() * 0.62, a: Math.random() * TAU,
      vr: (Math.random() - .5) * 0.004, va: (Math.random() - .5) * 0.002,
      life: 0, lab: `${lab} ${String(i + 1).padStart(2, '0')}`, friendly: lab === 'FRIENDLY', obj: lab === 'OBJ'
    }));

    let sweep = -Math.PI / 2, last = performance.now();
    const RPM = 15, speed = RPM * TAU / 60; // rad/s

    function draw(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (!reduce) sweep = (sweep + speed * dt) % TAU;
      ctx.clearRect(0, 0, W, W);
      ctx.drawImage(base, 0, 0, W, W);

      ctx.save(); ctx.beginPath(); ctx.arc(R, R, R - 2, 0, TAU); ctx.clip();
      // sweep wedge
      const trail = 1.35;
      if (ctx.createConicGradient) {
        const cg = ctx.createConicGradient(sweep - trail, R, R);
        cg.addColorStop(0, `rgba(${PHOS},0)`);
        cg.addColorStop(trail / TAU * 0.85, `rgba(${PHOS},.14)`);
        cg.addColorStop(trail / TAU, `rgba(${PHOS},.42)`);
        cg.addColorStop(trail / TAU + 0.0001, `rgba(${PHOS},0)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R, sweep - trail, sweep); ctx.closePath(); ctx.fill();
      } else {
        for (let i = 0; i < 30; i++) {
          const a0 = sweep - trail * (i + 1) / 30, a1 = sweep - trail * i / 30;
          ctx.fillStyle = `rgba(${PHOS},${0.3 * (1 - i / 30) ** 2})`;
          ctx.beginPath(); ctx.moveTo(R, R); ctx.arc(R, R, R, a0, a1); ctx.closePath(); ctx.fill();
        }
      }
      // leading beam
      ctx.strokeStyle = `rgba(${PHOS},.95)`; ctx.lineWidth = 2;
      ctx.shadowColor = `rgb(${PHOS})`; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(R, R); ctx.lineTo(R + Math.cos(sweep) * R, R + Math.sin(sweep) * R); ctx.stroke();
      ctx.shadowBlur = 0;

      // blips
      let lit = 0;
      ctx.font = `${Math.max(9, W / 50)}px "Share Tech Mono", monospace`;
      blips.forEach(bp => {
        if (!reduce) {
          bp.r = Math.min(0.9, Math.max(0.15, bp.r + bp.vr * dt * 10));
          bp.a += bp.va * dt * 10;
          if (Math.random() < 0.004) { bp.vr = (Math.random() - .5) * 0.004; bp.va = (Math.random() - .5) * 0.002; }
        }
        const diff = ((sweep - bp.a) % TAU + TAU) % TAU;
        if (diff < speed * dt * 1.5 + 0.02) bp.life = 1;
        else bp.life = Math.max(0, bp.life - dt / 3.6);
        if (reduce) bp.life = 0.8;
        if (bp.life <= 0.02) return;
        lit++;
        const x = R + Math.cos(bp.a) * bp.r * R, y = R + Math.sin(bp.a) * bp.r * R;
        const col = bp.obj ? '255,182,39' : bp.friendly ? '160,220,255' : PHOS;
        ctx.fillStyle = `rgba(${col},${bp.life})`;
        ctx.shadowColor = `rgb(${col})`; ctx.shadowBlur = 14 * bp.life;
        ctx.beginPath();
        if (bp.obj) { ctx.rect(x - 4, y - 4, 8, 8); } else ctx.arc(x, y, 3.2 + 2 * bp.life, 0, TAU);
        ctx.fill(); ctx.shadowBlur = 0;
        if (bp.life > 0.92) { // ping ring right after detection
          ctx.strokeStyle = `rgba(${col},${(bp.life - .92) * 10})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x, y, 6 + (1 - bp.life) * 160, 0, TAU); ctx.stroke();
        }
        if (bp.life > 0.3) {
          ctx.fillStyle = `rgba(${col},${bp.life * .85})`;
          ctx.fillText(bp.lab, x + 9, y - 7);
          ctx.strokeStyle = `rgba(${col},${bp.life * .5})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x + 4, y - 4); ctx.lineTo(x + 8, y - 8); ctx.stroke();
        }
      });
      ctx.restore();

      // own position
      ctx.fillStyle = `rgb(${PHOS})`; ctx.shadowColor = `rgb(${PHOS})`; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(R, R - 7); ctx.lineTo(R + 5, R + 5); ctx.lineTo(R, R + 2); ctx.lineTo(R - 5, R + 5); ctx.closePath(); ctx.fill();
      ctx.shadowBlur = 0;

      countEl.textContent = `CONTACTS ${String(lit).padStart(2, '0')}`;
      brgEl.textContent = `BRG ${String(Math.round(((sweep + Math.PI / 2) * 180 / Math.PI + 360) % 360)).padStart(3, '0')}°`;

      if (!reduce && visible) requestAnimationFrame(draw);
    }

    size();
    new ResizeObserver(() => { const w = cv.clientWidth; if (w && w !== W) size(); }).observe(cv);
    // pause when off-screen
    new IntersectionObserver(([en]) => {
      const was = visible; visible = en.isIntersecting;
      if (visible && !was && !reduce) { last = performance.now(); requestAnimationFrame(draw); }
    }).observe(cv);
    document.fonts && document.fonts.ready.then(() => buildBase());
    requestAnimationFrame(draw);
  })();

  /* ---------- Contact form → prefilled email ---------- */
  const form = $('#msgForm'), err = $('#msgErr');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form));
    const missing = [];
    if (!d.name.trim()) missing.push('name');
    if (!/^\S+@\S+\.\S+$/.test(d.email.trim())) missing.push('a valid email');
    if (!d.message.trim()) missing.push('a message');
    if (missing.length) { err.textContent = `⚠ Please add ${missing.join(', ')}.`; return; }
    err.textContent = '';
    const body = `${d.message}\n\n— ${d.name}\n${d.email}${d.phone ? '\n' + d.phone : ''}`;
    location.href = `mailto:ProjectN1.COI@Gmail.com?subject=${encodeURIComponent('[Website] ' + d.topic)}&body=${encodeURIComponent(body)}`;
  });

  $('#year').textContent = new Date().getFullYear();
})();
