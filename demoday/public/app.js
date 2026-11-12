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
  // 날짜·장소가 둘 다 미정이면 한 줄로 정리
  if (!event.date && !event.venue) {
    $('#heroDate').textContent = 'COMING SOON';
    $('#heroVenue').textContent = '일정 · 장소는 추후 안내드립니다';
  }

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

/* ================= the key-visual globe (DEMO DAY) ================= */
// 회전하는 와이어프레임 지구 + 세계 각지에서 서울로 모이는 항로(대권 항로) + 궤도를 도는 위성.
// 글로벌 기술 인재가 국내 산업으로 들어오는 KTP 의 흐름을 그린다. 색은 KTP 보라·블루·핑크.
const SEOUL = [37.57, 126.98];
const HUBS = [
  ['SFO', 37.77, -122.42], ['BOS', 42.36, -71.06], ['NYC', 40.71, -74.0], ['YYZ', 43.65, -79.38],
  ['LON', 51.5, -0.13], ['BER', 52.52, 13.4], ['SIN', 1.35, 103.82], ['TLV', 32.08, 34.78],
];
function createGlobe(canvas, opts = {}) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0;
  const state = { open: 0, glow: 0, speed: 1, alpha: 1 };
  const RAD = Math.PI / 180;
  const TILT = -0.42; // 북반구가 조금 더 보이게
  // 지구 표면의 점(피보나치 분포)
  const vec = (lat, lon) => [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
  // 실제 대륙·나라 모양: public/assets/globe.json (tools/globe/build.py 로 Natural Earth 에서 생성)
  let LAND = [], BORDERS = [];
  fetch('/assets/globe.json?v=1')
    .then((r) => r.json())
    .then((g) => {
      for (let i = 0; i < g.dots.length; i += 2) {
        const v = vec(g.dots[i] * RAD, g.dots[i + 1] * RAD);
        // 점마다 반짝임 속도·위상을 다르게, 일부는 유난히 밝게
        LAND.push({ v, p: Math.random() * Math.PI * 2, s: 0.6 + Math.random() * 1.6, star: Math.random() < 0.035 });
      }
      BORDERS = g.lines.map((l) => {
        const pts = [];
        for (let i = 0; i < l.length; i += 2) pts.push(vec(l[i] * RAD, l[i + 1] * RAD));
        return pts;
      });
    })
    .catch(() => {});
  const arcs = HUBS.map(([code, la, lo], i) => ({ code, from: [la * RAD, lo * RAD], delay: i * 0.37, dur: 3.2 + (i % 3) * 0.5 }));
  const seoul = [SEOUL[0] * RAD, SEOUL[1] * RAD];

  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  // 회전(rot: 경도축) + 기울기 → 화면 좌표 [x, y, z]. z>0 이면 앞면.
  function project(v, rot, R, k = 1) {
    const [x0, y0, z0] = v;
    const x = x0 * Math.cos(rot) + z0 * Math.sin(rot);
    const z1 = -x0 * Math.sin(rot) + z0 * Math.cos(rot);
    const y = y0 * Math.cos(TILT) - z1 * Math.sin(TILT);
    const z = y0 * Math.sin(TILT) + z1 * Math.cos(TILT);
    return [x * R * k, -y * R * k, z];
  }
  function slerp(a, b, t) {
    const d = Math.acos(Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
    if (d < 1e-4) return a;
    const s1 = Math.sin((1 - t) * d) / Math.sin(d), s2 = Math.sin(t * d) / Math.sin(d);
    return [a[0] * s1 + b[0] * s2, a[1] * s1 + b[1] * s2, a[2] * s1 + b[2] * s2];
  }

  let last = 0, clock = 0;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    clock += dt * state.speed;
    ctx.clearRect(0, 0, w, h);
    if (state.alpha <= 0 || state.open <= 0.001) return;
    const mobile = w < 760;
    const cx = w * (opts.cx ?? 0.5);
    const cy = h * (opts.cy ?? (mobile ? 0.6 : 0.6));
    const R = Math.min(w * (mobile ? 0.36 : 0.24), h * (mobile ? 0.2 : 0.24)) * (opts.scale ?? 1) * (0.82 + 0.18 * state.open);
    // 서울이 앞쪽을 지나도록 천천히 회전(약 80초에 한 바퀴)
    const rot = -2.1 + clock * 0.078;
    const o = state.open;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = state.alpha;

    // atmosphere glow
    const atm = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.5);
    atm.addColorStop(0, 'rgba(60,70,255,0)');
    atm.addColorStop(0.45, `rgba(70,90,255,${0.16 * o})`);
    atm.addColorStop(1, 'rgba(60,40,200,0)');
    ctx.fillStyle = atm;
    ctx.fillRect(-R * 1.6, -R * 1.6, R * 3.2, R * 3.2);
    // planet body (뒤쪽 별을 가린다)
    const body = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R);
    body.addColorStop(0, `rgba(34,30,96,${0.95 * o})`);
    body.addColorStop(0.7, `rgba(10,10,36,${0.97 * o})`);
    body.addColorStop(1, `rgba(4,4,16,${o})`);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'lighter';
    // orbit ring — back half
    drawOrbit(R, clock, o, false);

    // graticule
    ctx.lineWidth = 0.8;
    const line = (pts) => {
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0, z0] = pts[i - 1], [x1, y1, z1] = pts[i];
        const z = (z0 + z1) / 2;
        if (z < -0.05) continue;
        ctx.strokeStyle = `rgba(110,120,255,${(0.03 + 0.1 * Math.max(0, z)) * o})`;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    };
    for (let lat = -60; lat <= 60; lat += 30) {
      const pts = [];
      for (let lo = -180; lo <= 180; lo += 6) pts.push(project(vec(lat * RAD, lo * RAD), rot, R));
      line(pts);
    }
    for (let lo = 0; lo < 360; lo += 30) {
      const pts = [];
      for (let la = -90; la <= 90; la += 6) pts.push(project(vec(la * RAD, lo * RAD), rot, R));
      line(pts);
    }
    // country borders + coastlines
    ctx.lineWidth = 0.7;
    for (const line of BORDERS) {
      let prev = null;
      for (const v of line) {
        const p = project(v, rot, R);
        if (prev && prev[2] > 0 && p[2] > 0) {
          ctx.strokeStyle = `rgba(150,165,255,${(0.08 + 0.32 * p[2]) * o})`;
          ctx.beginPath();
          ctx.moveTo(prev[0], prev[1]);
          ctx.lineTo(p[0], p[1]);
          ctx.stroke();
        }
        prev = p;
      }
    }
    // land dots — 반짝반짝
    const tw = t / 1000;
    for (const d of LAND) {
      const [x, y, z] = project(d.v, rot, R);
      if (z <= 0.02) continue;
      const twinkle = 0.5 + 0.5 * Math.sin(tw * d.s + d.p);
      const edge = Math.min(1, z * 1.6);
      if (d.star && twinkle > 0.7) {
        // 반짝이는 점: 작은 십자 빛
        const k = (twinkle - 0.7) / 0.3;
        const L = (2 + 5 * k) * (0.6 + 0.4 * z);
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * k * edge * o})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x - L, y); ctx.lineTo(x + L, y);
        ctx.moveTo(x, y - L); ctx.lineTo(x, y + L);
        ctx.stroke();
      }
      const a = (0.25 + 0.75 * twinkle) * edge * o;
      ctx.fillStyle = d.star ? `rgba(255,235,250,${a})` : `rgba(${185 + 70 * twinkle},${195 + 55 * twinkle},255,${a * 0.85})`;
      const sz = (d.star ? 1.8 : 1.15) * (0.7 + 0.5 * z);
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
    }
    // rim light
    const rim = ctx.createLinearGradient(-R, -R, R, R);
    rim.addColorStop(0, `rgba(160,170,255,${0.55 * o})`);
    rim.addColorStop(0.5, `rgba(100,80,255,${0.2 * o})`);
    rim.addColorStop(1, `rgba(255,120,190,${0.45 * o})`);
    ctx.strokeStyle = rim;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.stroke();

    // flight arcs → SEOUL
    const sv = vec(...seoul);
    const g = state.glow;
    for (const arc of arcs) {
      const fv = vec(...arc.from);
      const dist = Math.acos(fv[0] * sv[0] + fv[1] * sv[1] + fv[2] * sv[2]);
      const lift = 0.12 + dist * 0.12;
      const N = 48;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        const p = slerp(fv, sv, u);
        pts.push(project(p, rot, R, 1 + lift * Math.sin(Math.PI * u)));
      }
      // 항로 자체는 은은하게, 앞면(또는 지구 밖으로 보이는 부분)만
      const vis = (p) => p[2] > 0 || Math.hypot(p[0], p[1]) > R * 1.01;
      ctx.lineWidth = 1;
      for (let i = 1; i <= N; i++) {
        if (!vis(pts[i]) || !vis(pts[i - 1])) continue;
        ctx.strokeStyle = `rgba(120,130,255,${0.16 * g})`;
        ctx.beginPath();
        ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
        ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
      // 비행체(빛의 머리 + 꼬리)
      const cyc = (clock + arc.delay * arc.dur) % (arc.dur + 1.4);
      const head = Math.min(1, cyc / arc.dur);
      if (cyc < arc.dur + 0.6 && g > 0) {
        const tailLen = 0.32;
        const hi = Math.round(head * N);
        const ti = Math.max(0, Math.round((head - tailLen) * N));
        const fadeOut = cyc > arc.dur ? 1 - (cyc - arc.dur) / 0.6 : 1;
        for (let i = ti + 1; i <= hi; i++) {
          if (!vis(pts[i]) || !vis(pts[i - 1])) continue;
          const k = (i - ti) / Math.max(1, hi - ti);
          ctx.strokeStyle = `rgba(${170 + 85 * k},${120 + 100 * k},${255 - 20 * k},${k * 0.95 * g * fadeOut})`;
          ctx.lineWidth = 0.8 + 1.4 * k;
          ctx.beginPath();
          ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
          ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
        }
        const hp = pts[hi];
        if (head < 1 && vis(hp)) glow(hp[0], hp[1], R * 0.035, g * fadeOut, '255,200,240');
        if (head >= 1 && fadeOut > 0) {
          const sp = pts[N];
          if (sp[2] > 0) ring(sp[0], sp[1], R * (0.02 + 0.09 * (1 - fadeOut)), fadeOut * g);
        }
      }
      // 출발 도시
      const fp = pts[0];
      if (fp[2] > 0) {
        ctx.fillStyle = `rgba(170,190,255,${0.7 * fp[2] * g})`;
        ctx.beginPath();
        ctx.arc(fp[0], fp[1], 1.6, 0, Math.PI * 2);
        ctx.fill();
        if (!mobile && fp[2] > 0.35 && opts.labels !== false) {
          ctx.font = '500 9px "Pretendard Variable", Pretendard, system-ui, sans-serif';
          ctx.fillStyle = `rgba(170,180,255,${0.55 * fp[2] * g})`;
          ctx.fillText(arc.code, fp[0] + 5, fp[1] - 4);
        }
      }
    }
    // SEOUL beacon
    const sp = project(sv, rot, R);
    if (sp[2] > 0) {
      const pulse = (clock * 0.7) % 1;
      ring(sp[0], sp[1], R * (0.03 + 0.12 * pulse), (1 - pulse) * g * sp[2]);
      glow(sp[0], sp[1], R * 0.05, g * (0.6 + 0.4 * sp[2]), '255,170,220');
      if (opts.labels !== false) {
        ctx.font = `600 ${mobile ? 9 : 10}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;
        ctx.fillStyle = `rgba(255,220,240,${0.85 * g * sp[2]})`;
        ctx.fillText('SEOUL', sp[0] + 8, sp[1] + 3);
      }
    }

    // orbit ring — front half
    drawOrbit(R, clock, o, true);
    ctx.restore();
  }
  function glow(x, y, r, a, rgb) {
    const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
    gg.addColorStop(0, `rgba(255,255,255,${a})`);
    gg.addColorStop(0.3, `rgba(${rgb},${0.6 * a})`);
    gg.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = gg;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  function ring(x, y, r, a) {
    ctx.strokeStyle = `rgba(255,170,220,${0.8 * a})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  // 기울어진 궤도 + 위성. front=true 면 지구 앞쪽 반만 그린다.
  function drawOrbit(R, time, o, front) {
    const Ro = R * 1.42, k = 0.24, ang = -0.32;
    ctx.save();
    ctx.rotate(ang);
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = `rgba(130,140,255,${(front ? 0.45 : 0.18) * o})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, Ro * o, Ro * k * o, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const a = time * 0.42;
    const isFront = Math.sin(a) > 0;
    if (isFront === front && state.glow > 0) {
      const x = Math.cos(a) * Ro * o, y = Math.sin(a) * Ro * k * o;
      // 위성 꼬리
      for (let i = 1; i <= 14; i++) {
        const b = a - i * 0.03;
        if ((Math.sin(b) > 0) !== front) break;
        ctx.fillStyle = `rgba(180,190,255,${(1 - i / 14) * 0.5 * state.glow})`;
        ctx.fillRect(Math.cos(b) * Ro * o - 1, Math.sin(b) * Ro * k * o - 1, 2, 2);
      }
      glow(x, y, R * (front ? 0.06 : 0.035), state.glow * (front ? 1 : 0.5), '160,180,255');
    }
    ctx.restore();
  }

  resize();
  addEventListener('resize', resize);
  return { state, frame, resize };
}

/* ================= stars ================= */
// 우주 배경: 은은하게 깜빡이는 흰 별 + 가끔 십자로 반짝이는 밝은 별 + 드물게 지나가는 별똥별.
function createStars(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, stars = [], shoot = null, nextShoot = 4000;
  function resize() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * DPR;
    canvas.height = h * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    stars = Array.from({ length: Math.round((w * h) / 4200) }, () => {
      const bright = Math.random() < 0.05;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: bright ? 1.3 + Math.random() * 0.8 : 0.4 + Math.random() * 0.9,
        p: Math.random() * Math.PI * 2,
        s: 0.4 + Math.random() * 1.4,
        base: bright ? 0.55 : 0.18 + Math.random() * 0.3,
        bright,
        blue: Math.random() < 0.3,
      };
    });
  }
  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    const tw = t / 1000;
    for (const s of stars) {
      const k = 0.5 + 0.5 * Math.sin(tw * s.s + s.p);
      const a = s.base * (0.35 + 0.65 * k);
      ctx.fillStyle = s.blue ? `rgba(200,215,255,${a})` : `rgba(255,255,255,${a})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * (0.8 + 0.25 * k), 0, Math.PI * 2);
      ctx.fill();
      if (s.bright && k > 0.75 && !reduced) {
        const q = (k - 0.75) / 0.25;
        const L = s.r * (3 + 5 * q);
        ctx.strokeStyle = `rgba(255,255,255,${0.55 * q})`;
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(s.x - L, s.y); ctx.lineTo(s.x + L, s.y);
        ctx.moveTo(s.x, s.y - L); ctx.lineTo(s.x, s.y + L);
        ctx.stroke();
      }
    }
    // shooting star
    if (!reduced && !shoot && t > nextShoot) {
      shoot = { x: Math.random() * w * 0.8 + w * 0.1, y: Math.random() * h * 0.4, t0: t, a: Math.PI * (0.15 + Math.random() * 0.15) };
    }
    if (shoot) {
      const e = (t - shoot.t0) / 900;
      if (e >= 1) {
        shoot = null;
        nextShoot = t + 6000 + Math.random() * 9000;
      } else {
        const d = 260 * e, len = 90 * Math.sin(Math.PI * e);
        const hx = shoot.x + Math.cos(shoot.a) * d, hy = shoot.y + Math.sin(shoot.a) * d;
        const g = ctx.createLinearGradient(hx, hy, hx - Math.cos(shoot.a) * len, hy - Math.sin(shoot.a) * len);
        g.addColorStop(0, `rgba(255,255,255,${0.9 * Math.sin(Math.PI * e)})`);
        g.addColorStop(1, 'rgba(160,170,255,0)');
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(hx - Math.cos(shoot.a) * len, hy - Math.sin(shoot.a) * len);
        ctx.stroke();
      }
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

/* ================= HUD: 서울 시각 · 카운트다운 ================= */
function startHud() {
  $('#hudTeams').textContent = `${event.teams.length} PIONEERS`;
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  const target = event.startsAt ? new Date(event.startsAt).getTime() : NaN;
  if (!Number.isNaN(target)) $('#countdown').hidden = false;
  const tick = () => {
    $('#hudClock').textContent = `SEL ${fmt.format(new Date())} KST`;
    if (!Number.isNaN(target)) {
      let d = Math.max(0, Math.floor((target - Date.now()) / 1000));
      $('#cdD').textContent = pad(Math.floor(d / 86400));
      $('#cdH').textContent = pad(Math.floor((d % 86400) / 3600));
      $('#cdM').textContent = pad(Math.floor((d % 3600) / 60));
      $('#cdS').textContent = pad(d % 60);
    }
  };
  tick();
  setInterval(tick, 1000);
}

/* ================= boot ================= */
fill();
startHud();
const orb = createGlobe($('#orb'));
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
  $('#passCode').textContent = `KTP-DD26 · ${code}`;
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
    welcomeOrb = createGlobe(c, { cy: 0.5, scale: 1.25, labels: false });
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
