import event from '/event.config.js';

const $ = (s, el = document) => el.querySelector(s);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const DPR = Math.min(devicePixelRatio || 1, 2);
const TBD = '추후 안내';

/* ================= content from config ================= */
function fill() {
  document.title = `${event.brand} ${event.title} · RSVP`;
  $('#heroTitle').textContent = event.title;
  $('#heroTagline').textContent = event.tagline;
  $('#heroDate').innerHTML = event.date
    ? `${event.date}${event.dateDay ? `<small>(${event.dateDay})</small>` : ''}${event.time ? ` ${event.time}` : ''}`
    : `DATE ${TBD}`;
  $('#heroVenue').textContent = event.venue || TBD;

  $('#infoDate').textContent = event.infoDate || (event.date ? `${event.date} (${event.dateDay})` : TBD);
  $('#infoDateKo').textContent = event.infoDateSub || [event.dateKo, event.time].filter(Boolean).join(' ');
  $('#infoVenue').textContent = event.venue || TBD;
  $('#infoVenueKo').textContent = [event.venueKo, event.address].filter(Boolean).join(' · ');
  if (event.deadline) $('#infoDeadline').textContent = event.deadline;
  else $('#infoDeadline').textContent = TBD;

  if (event.timetable?.rows?.length) {
    const tt = event.timetable;
    const m = tt.match;
    // 비즈니스 매칭 칸은 첫 줄에만 넣고 모든 줄을 세로로 합친다
    const matchCell = m
      ? `<td class="is-merged" rowspan="${tt.rows.length}"><strong>${m.title}</strong>${(m.notes || []).map((n) => `<span>${n}</span>`).join('')}</td>`
      : '';
    $('#ttHead').innerHTML = tt.head.map((h) => `<th scope="col">${h}</th>`).join('');
    $('#ttBody').innerHTML = tt.rows
      .map(
        (r, i) =>
          (r.break
            ? `<tr class="is-break"><td colspan="2">${r.break}</td>`
            : `<tr><th scope="row">${r.time}</th><td><strong>${r.ir}</strong>${r.irNote ? `<span>${r.irNote}</span>` : ''}</td>`) +
          `${i === 0 ? matchCell : ''}</tr>`
      )
      .join('');
    $('#timetable').hidden = false;
  }

  $('#invitation').innerHTML = event.invitation.join(' <br />');
  const logo = (t, cls = '') =>
    t.logo ? `<img class="${cls}" src="/assets/teams/${t.logo}?v=3" alt="" data-scale="${t.scale || 1}" />` : '';
  const pill = (t) => `<span>${logo(t, 'team-logo')}<em>${t.name}</em></span>`;
  const half = Math.ceil(event.teams.length / 2);
  const a = event.teams.slice(0, half).map(pill).join('');
  const b = event.teams.slice(half).map(pill).join('');
  $('#marqueeA').innerHTML = (a + a).repeat(2);
  $('#marqueeB').innerHTML = (b + b).repeat(2);
  if (!event.teams.length) $('#pioneers').remove();
  if (event.teamsLink) {
    $('#teamsLink').href = event.teamsLink.href;
    $('#teamsLink').textContent = event.teamsLink.label;
    $('#teamsLink').hidden = false;
  }

  // form groups
  const letters = 'ABCDEFG';
  if (event.sessions.length) {
    $('#sessionsGroup').hidden = false;
    $('#sessions').innerHTML = event.sessions
      .map((s) => `<label class="chip"><input type="checkbox" name="sessions" value="${s}" /><span>${s}</span></label>`)
      .join('');
  }
  if (event.askTeams && event.teams.length) {
    $('#teamsGroup').hidden = false;
    $('#teamsHint').textContent = event.teamsHint;
    $('#teams').innerHTML = event.teams
      .map((t) => `<label class="chip"><input type="checkbox" name="teams" value="${t.name}" /><span>${t.name}</span></label>`)
      .join('');
  }
  if (event.matching?.length) {
    $('#matchingGroup').hidden = false;
    $('#matching').innerHTML = event.matching
      .map((m) => `<label class="chip"><input type="radio" name="matching" value="${m}" /><span>${m}</span></label>`)
      .join('');
  }
  // 로고마다 가로세로 비율이 달라서, 눈에 보이는 면적이 비슷해지도록 높이를 개별 계산한다.
  document.querySelectorAll('.team-logo').forEach((img) => {
    const size = () => {
      const ratio = img.naturalWidth / img.naturalHeight || 4;
      const k = Number(img.dataset.scale) || 1;
      const h = Math.min(48, Math.sqrt(3400 / ratio) * k, (210 * k) / ratio);
      img.style.height = `${h.toFixed(1)}px`;
    };
    img.complete ? size() : img.addEventListener('load', size, { once: true });
  });
  [...document.querySelectorAll('.group:not([hidden]) .num')].forEach((n, i) => (n.textContent = letters[i]));

  const pv = event.privacy;
  $('#privacy').innerHTML = `<p>${pv.org}은(는) 본 행사 참가 신청 및 운영을 위해 아래와 같이 개인정보를 수집·이용합니다.</p>
    <dl><dt>수집 항목</dt><dd>${pv.items}</dd><dt>수집 목적</dt><dd>${pv.purpose}</dd><dt>보유·이용 기간</dt><dd>${pv.retention}</dd></dl>
    <p>개인정보 수집·이용에 대한 동의를 거부할 권리가 있으나, 동의하지 않을 경우 행사 참가 신청이 제한될 수 있습니다.</p>`;

  $('#links').innerHTML = event.links
    .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${l.label}</a>`)
    .join('');

  if (event.closed) {
    $('#form').hidden = true;
    $('#closed').hidden = false;
  }
}

/* ================= the key-visual orb ================= */
// 같은 장축을 공유하는 타원들(구의 경선)이 빛의 줄기에서 바깥으로 흘러나가는 모습.
function createOrb(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  const N = 26;
  let w = 0, h = 0;
  const state = { open: 0, glow: 0, speed: 1, alpha: 1 };
  // 별똥별: 몇 초마다 광선이 순간 확 밝아지며 머리가 줄기를 따라 스쳐 지나간다.
  let shotStart = -1e9, nextShot = 0;
  const SHOT_MS = 950;

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    if (state.alpha <= 0) return;
    const mobile = w < 760;
    const cx = w * (opts.cx ?? 0.5);
    const cy = h * (opts.cy ?? (mobile ? 0.52 : 0.58));
    const R = Math.min(w * (mobile ? 0.6 : 0.36), h * 0.42) * (opts.scale ?? 1);
    const tilt = -0.52;
    const time = (t / 1000) * state.speed;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(tilt);
    ctx.globalAlpha = state.alpha;
    ctx.globalCompositeOperation = 'lighter';

    // meridians
    for (let i = 0; i < N; i++) {
      const u = (i / N + time * 0.018) % 1;
      const ry = R * Math.pow(u, 1.4) * state.open;
      const fade = Math.min(1, u / 0.08) * (1 - Math.max(0, (u - 0.88) / 0.12));
      const near = 1 - u;
      ctx.beginPath();
      ctx.ellipse(0, 0, R, Math.max(ry, 0.3), 0, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${86 + 120 * near * near}, ${72 + 40 * near * near}, ${230}, ${(0.22 + 0.38 * near) * fade})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // outer circle
    ctx.beginPath();
    ctx.ellipse(0, 0, R, R * state.open, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(90, 76, 230, ${0.55 * Math.min(1, state.open * 1.5)})`;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // glints travelling on the outer circle
    for (const k of [0, 1]) {
      const a = time * 0.35 + k * Math.PI * 0.95;
      const span = 0.32;
      const g = ctx.createLinearGradient(
        Math.cos(a - span) * R, Math.sin(a - span) * R * state.open,
        Math.cos(a + span) * R, Math.sin(a + span) * R * state.open,
      );
      g.addColorStop(0, 'rgba(255,120,190,0)');
      g.addColorStop(0.5, 'rgba(255,240,250,0.95)');
      g.addColorStop(1, 'rgba(255,120,190,0)');
      ctx.beginPath();
      ctx.ellipse(0, 0, R, R * state.open, 0, a - span, a + span);
      ctx.strokeStyle = g;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // the light streak on the major axis
    if (!reduced && state.glow > 0.9 && t > nextShot) {
      shotStart = t;
      nextShot = t + 2600 + Math.random() * 2600;
    }
    const sp = (t - shotStart) / SHOT_MS;
    const env = sp >= 0 && sp <= 1 ? Math.pow(Math.sin(Math.PI * Math.min(1, sp * 1.35)), 2) * (1 - sp * 0.4) : 0;
    const s = state.glow * (0.38 + 0.62 * env);
    if (s > 0) {
      const g = ctx.createLinearGradient(-R, 0, R, 0);
      g.addColorStop(0, 'rgba(120,80,255,0)');
      g.addColorStop(0.3, `rgba(170,90,255,${0.5 * s})`);
      g.addColorStop(0.55, `rgba(255,170,220,${0.95 * s})`);
      g.addColorStop(0.68, `rgba(255,255,255,${s})`);
      g.addColorStop(0.85, `rgba(140,110,255,${0.6 * s})`);
      g.addColorStop(1, 'rgba(90,70,255,0)');
      ctx.fillStyle = g;
      ctx.shadowColor = 'rgba(200,110,255,0.9)';
      for (const [th, blur] of [[R * 0.03, 40], [R * 0.011, 18], [R * 0.0035, 6]]) {
        ctx.shadowBlur = blur;
        ctx.beginPath();
        ctx.ellipse(R * 0.1, 0, R * 0.86, th, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      // shooting head + tail
      if (env > 0) {
        const head = -R * 0.85 + R * 1.75 * (1 - Math.pow(1 - Math.min(1, sp), 2.2));
        const tail = R * 0.95;
        const tg = ctx.createLinearGradient(head - tail, 0, head, 0);
        tg.addColorStop(0, 'rgba(140,90,255,0)');
        tg.addColorStop(0.6, `rgba(255,150,215,${0.55 * env})`);
        tg.addColorStop(1, `rgba(255,255,255,${env})`);
        ctx.fillStyle = tg;
        ctx.shadowColor = 'rgba(255,190,240,1)';
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.ellipse(head - tail / 2, 0, tail / 2, R * 0.016, 0, 0, Math.PI * 2);
        ctx.fill();
        const hg = ctx.createRadialGradient(head, 0, 0, head, 0, R * 0.09);
        hg.addColorStop(0, `rgba(255,255,255,${env})`);
        hg.addColorStop(0.35, `rgba(255,200,240,${0.6 * env})`);
        hg.addColorStop(1, 'rgba(160,100,255,0)');
        ctx.fillStyle = hg;
        ctx.shadowBlur = 40;
        ctx.beginPath();
        ctx.arc(head, 0, R * 0.09, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  resize();
  addEventListener('resize', resize);
  return { state, frame, resize };
}

/* ================= stars ================= */
function createStars(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, stars = [];
  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 9000) }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 0.9 + 0.2,
      p: Math.random() * Math.PI * 2,
    }));
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      const a = 0.25 + 0.35 * Math.sin(t / 1400 + s.p);
      ctx.fillStyle = `rgba(200,205,255,${a})`;
      ctx.fillRect(s.x, s.y, s.r, s.r);
    }
  }
  resize();
  addEventListener('resize', resize);
  return { frame };
}

/* ================= warp (welcome burst) ================= */
function createWarp(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, parts = [], start = 0;
  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  function fire(t) {
    start = t;
    parts = Array.from({ length: 260 }, () => {
      const a = Math.random() * Math.PI * 2;
      return { a, d: Math.random() * 40, v: 0.6 + Math.random() * 2.2, hue: Math.random() < 0.25 ? 320 : 248 };
    });
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    const e = (t - start) / 1000;
    const cx = w / 2, cy = h * 0.42;
    const speed = Math.max(0.04, Math.exp(-e * 1.6)) * 26;
    // central flash
    if (e < 1.2) {
      const r = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.6);
      r.addColorStop(0, `rgba(230,210,255,${0.55 * (1 - e / 1.2)})`);
      r.addColorStop(0.3, `rgba(110,80,255,${0.25 * (1 - e / 1.2)})`);
      r.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const p of parts) {
      const d0 = p.d;
      p.d += p.v * speed * (1 + p.d / 300);
      if (p.d > Math.hypot(w, h)) p.d = Math.random() * 20;
      const x0 = cx + Math.cos(p.a) * d0, y0 = cy + Math.sin(p.a) * d0;
      const x1 = cx + Math.cos(p.a) * p.d, y1 = cy + Math.sin(p.a) * p.d;
      ctx.strokeStyle = `hsla(${p.hue}, 100%, ${78}%, ${Math.min(0.9, p.d / 200)})`;
      ctx.lineWidth = Math.min(2, 0.4 + p.d / 400);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1 + (x1 - x0) * 0.2, y1 + (y1 - y0) * 0.2);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  resize();
  addEventListener('resize', resize);
  return { fire, frame };
}

/* ================= tween helper ================= */
const tweens = [];
function tween(obj, key, to, ms, delay = 0, ease = (x) => 1 - Math.pow(1 - x, 3)) {
  const t0 = performance.now() + delay;
  tweens.push({ obj, key, from: null, to, ms, t0, ease });
}
function runTweens(now) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    if (now < tw.t0) continue;
    if (tw.from === null) tw.from = tw.obj[tw.key];
    const p = Math.min(1, (now - tw.t0) / tw.ms);
    tw.obj[tw.key] = tw.from + (tw.to - tw.from) * tw.ease(p);
    if (p === 1) tweens.splice(i, 1);
  }
}

/* ================= boot ================= */
fill();
const orb = createOrb($('#orb'));
const stars = createStars($('#stars'));
const warp = createWarp($('#warp'));
let heroVisible = true;
let welcomeOpen = false;
let welcomeOrb = null;

new IntersectionObserver(([e]) => (heroVisible = e.isIntersecting)).observe($('.hero'));

function loop(t) {
  runTweens(t);
  stars.frame(t);
  if (heroVisible && !welcomeOpen) orb.frame(t);
  if (welcomeOpen) {
    warp.frame(t);
    welcomeOrb?.frame(t);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// welcome intro sequence
const hero = $('.hero');
const timers = [];
function finishIntro() {
  timers.forEach(clearTimeout);
  tweens.length = 0;
  orb.state.open = 1;
  orb.state.glow = 1;
  document.body.classList.add('step-1', 'step-2', 'step-3', 'step-4', 'step-5', 'is-ready');
  document.body.classList.remove('is-intro');
}
if (reduced || location.hash) {
  finishIntro();
} else {
  tween(orb.state, 'glow', 1, 900, 150);
  tween(orb.state, 'open', 1, 2200, 700, (x) => 1 - Math.pow(1 - x, 4));
  [[350, 'step-1'], [1000, 'step-2'], [1700, 'step-3'], [2200, 'step-4'], [2600, 'step-5'], [3000, 'is-ready']].forEach(
    ([ms, cls]) => timers.push(setTimeout(() => document.body.classList.add(cls), ms)),
  );
  timers.push(setTimeout(() => document.body.classList.remove('is-intro'), 3000));
  $('#skipIntro').addEventListener('click', finishIntro);
  hero.addEventListener('wheel', finishIntro, { once: true, passive: true });
  hero.addEventListener('touchmove', finishIntro, { once: true, passive: true });
}

// reveal on scroll
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
  { threshold: 0.12 },
);
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ================= form ================= */
const form = $('#form');
const phone = form.elements.phone;
phone.addEventListener('input', () => {
  const d = phone.value.replace(/\D/g, '').slice(0, 11);
  phone.value = d.length < 4 ? d : d.length < 8 ? `${d.slice(0, 3)}-${d.slice(3)}` : `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
});

function showErrors(errors = {}) {
  form.querySelectorAll('.field__error').forEach((el) => {
    const msg = errors[el.dataset.for] || '';
    el.textContent = msg;
    el.closest('.field')?.classList.toggle('has-error', !!msg);
  });
  const first = Object.keys(errors)[0];
  if (first) {
    const target = form.querySelector(`[name="${first}"]`) || form.querySelector(`[data-for="${first}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (target?.focus) setTimeout(() => target.focus({ preventScroll: true }), 400);
  }
}

function collect() {
  const fd = new FormData(form);
  return {
    org: fd.get('org'),
    name: fd.get('name'),
    position: fd.get('position'),
    phone: fd.get('phone'),
    email: fd.get('email'),
    sessions: fd.getAll('sessions'),
    teams: fd.getAll('teams'),
    matching: fd.get('matching') || '',
    message: fd.get('message'),
    consent: form.elements.consent.checked,
    website: fd.get('website'),
  };
}

function validate(d) {
  const e = {};
  if (!d.org.trim()) e.org = '소속을 입력해주세요.';
  if (!d.name.trim()) e.name = '성함을 입력해주세요.';
  if (!d.position.trim()) e.position = '직책을 입력해주세요.';
  if (d.phone.replace(/\D/g, '').length < 9) e.phone = '휴대폰 번호를 확인해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) e.email = '이메일 주소를 확인해주세요.';
  if (event.sessions.length && !d.sessions.length) e.sessions = '희망 세션을 선택해주세요.';
  if (event.matching?.length && !d.matching) e.matching = '비즈니스 매칭 희망 여부를 선택해주세요.';
  if (!d.consent) e.consent = '개인정보 수집·이용에 동의해주세요.';
  return e;
}

form.addEventListener('input', (e) => {
  const err = form.querySelector(`[data-for="${e.target.name}"]`);
  if (err?.textContent) {
    err.textContent = '';
    err.closest('.field')?.classList.remove('has-error');
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = collect();
  const errors = validate(data);
  showErrors(errors);
  $('#formStatus').textContent = '';
  if (Object.keys(errors).length) return;

  const btn = $('#submitBtn');
  btn.classList.add('is-loading');
  btn.disabled = true;
  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (body.errors) showErrors(body.errors);
      $('#formStatus').textContent = body.error || '제출에 실패했습니다. 잠시 후 다시 시도해주세요.';
      return;
    }
    openWelcome(data, body.id || '');
    form.reset();
  } catch {
    $('#formStatus').textContent = '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  } finally {
    btn.classList.remove('is-loading');
    btn.disabled = false;
  }
});

/* ================= welcome ================= */
const welcome = $('#welcome');
function openWelcome(d, id) {
  $('#welcomeName').textContent = d.name.trim();
  $('#welcomeEmail').textContent = d.email.trim();
  $('#passEvent').textContent = event.title;
  $('#passName').textContent = `${d.name.trim()} ${d.position.trim()}`;
  $('#passOrg').textContent = d.org.trim();
  $('#passDate').textContent = event.date ? `${event.date} (${event.dateDay})` : TBD;
  $('#passVenue').textContent = event.venue || TBD;
  const code = (id.replace(/-/g, '').slice(0, 8) || Date.now().toString(16)).toUpperCase();
  $('#passCode').textContent = `KTP · ${code}`;
  $('#passBars').innerHTML = [...(id || code).replace(/-/g, '')]
    .slice(0, 22)
    .map((c) => `<i style="width:${(parseInt(c, 16) % 3) + 1}px"></i>`)
    .join('');

  welcome.hidden = false;
  welcomeOpen = true;
  document.body.style.overflow = 'hidden';
  // 오브는 warp 캔버스 뒤에 별도 캔버스로 깐다
  if (!welcomeOrb) {
    const c = document.createElement('canvas');
    c.id = 'welcomeOrb';
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;opacity:.55';
    welcome.prepend(c);
    welcomeOrb = createOrb(c, { cy: 0.42, scale: 1.25 });
  }
  welcomeOrb.state.open = 0;
  welcomeOrb.state.glow = 0;
  welcomeOrb.state.speed = 2.4;

  requestAnimationFrame(() => {
    welcome.classList.add('is-open');
    if (!reduced) warp.fire(performance.now());
    tween(welcomeOrb.state, 'glow', 1, 800, 300);
    tween(welcomeOrb.state, 'open', 1, 2400, 500, (x) => 1 - Math.pow(1 - x, 4));
    tween(welcomeOrb.state, 'speed', 1, 3000, 400);
  });
  const steps = reduced ? [[0, 'show-text'], [0, 'show-pass'], [0, 'show-rest']] : [[500, 'show-text'], [1100, 'show-pass'], [2000, 'show-rest']];
  steps.forEach(([ms, cls]) => setTimeout(() => welcome.classList.add(cls), ms));
  setTimeout(() => $('#welcomeClose').focus({ preventScroll: true }), reduced ? 0 : 2100);
}

function closeWelcome() {
  welcome.classList.remove('is-open', 'show-text', 'show-pass', 'show-rest');
  setTimeout(() => {
    welcome.hidden = true;
    welcomeOpen = false;
    document.body.style.overflow = '';
    const s = $('#formStatus');
    s.style.color = '#b9b2ff';
    s.textContent = '참석 신청이 접수되었습니다. 감사합니다.';
  }, 600);
}
$('#welcomeClose').addEventListener('click', closeWelcome);
addEventListener('keydown', (e) => e.key === 'Escape' && !welcome.hidden && closeWelcome());
