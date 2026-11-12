// 선정팀 카드와 상세 보기 — 노션 「1기 선정팀」 데이터베이스를 그대로 옮긴 것.
// 데이터(assets/notion/teams.json)와 이미지는 노션에서 가져와 만든다. 노션 내용이 바뀌면 다시 만들어야 한다.
// 카드를 누르면 주소가 #team/<slug> 로 바뀌고 상세 창이 열린다(뒤로 가기로 닫힘, 링크 공유 가능).

import event from '/event.config.js';

const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const grid = $('#finalistsGrid');
const view = $('#teamView');
const pageEl = $('#teamViewPage');
let teams = [];
let openedByClick = false;

const ICONS = {
  text: '<path d="M4 7h16M4 12h16M4 17h10" />',
  tags: '<path d="M4 7h2M9 7h11M4 12h2M9 12h11M4 17h2M9 17h11" />',
  files: '<path d="M16.5 7.5 9 15a2.1 2.1 0 0 1-3-3l8-8a3.5 3.5 0 0 1 5 5l-8.5 8.5a5 5 0 0 1-7-7L11 3" />',
};
const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const tag = (t) => `<li class="n-tag n-tag--${esc(t.c)}">${esc(t.v)}</li>`;
const prop = (t, label) => t.props.find((p) => p.label === label);

/* ---------- 카드 ---------- */
function card(t) {
  const bg = prop(t, '팀 배경')?.values || [];
  const field = prop(t, '매칭 수요기업')?.values || [];
  const icon = t.icon?.img ? `<img class="finalist__icon" src="/${t.icon.img}" alt="" />` : t.icon?.emoji ? `<span class="finalist__icon">${t.icon.emoji}</span>` : '';
  return `<a class="finalist" href="#team/${esc(t.slug)}" data-slug="${esc(t.slug)}">
    <div class="finalist__cover"><img src="/${t.coverSm}" alt="${esc(t.name)} 커버" loading="lazy" /></div>
    <div class="finalist__body">
      <strong class="finalist__name">${icon}<span>${esc(t.name)}</span></strong>
      <ul class="n-tags">${bg.map(tag).join('')}</ul>
      <ul class="n-tags">${field.map(tag).join('')}</ul>
    </div>
  </a>`;
}

/* ---------- PC 배치: 분야 묶음을 한 줄 5칸에 채워 넣는다 ---------- */
const COLS = 5;
const WIDE = matchMedia('(min-width: 1101px)');
// 남은 칸에 통째로 들어가는 분야가 있으면 먼저 넣고(예: 피지컬 AI 3 + 우주·항공 2),
// 없으면 다음 분야를 남은 칸만큼 잘라 이어 붙인다(예: 바이오·헬스케어 4 + 미디어·커머스 1 | 나머지 5).
function pack(groups) {
  const queue = groups.map((g) => ({ g, teams: [...g.teams], first: true }));
  const out = [];
  let left = COLS;
  while (queue.length) {
    let i = queue.findIndex((q) => q.teams.length <= left);
    if (i < 0) i = 0;
    const q = queue[i];
    const take = q.teams.splice(0, Math.min(left, q.teams.length));
    out.push({ g: q.g, teams: take, first: q.first });
    q.first = false;
    if (!q.teams.length) queue.splice(i, 1);
    left -= take.length;
    if (left === 0) left = COLS;
  }
  return out;
}

/* ---------- 노션 블록 → HTML ---------- */
function blocks(list) {
  let html = '';
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    // 연속된 글머리 기호는 한 목록으로 묶는다
    if (b.t === 'li' || b.t === 'oli') {
      const tagName = b.t === 'li' ? 'ul' : 'ol';
      let items = '';
      while (i < list.length && list[i].t === b.t) items += `<li>${list[i].html}${kids(list[i++])}</li>`;
      i--;
      html += `<${tagName} class="n-list">${items}</${tagName}>`;
      continue;
    }
    html += block(b);
  }
  return html;
}
const kids = (b) => (b.children?.length ? `<div class="n-indent">${blocks(b.children)}</div>` : '');

function block(b) {
  switch (b.t) {
    case 'h2': return `<h2 class="n-h2">${b.html}</h2>`;
    case 'h3': return `<h3 class="n-h3">${b.html}</h3>`;
    case 'h4': return `<h4 class="n-h4">${b.html}</h4>`;
    case 'p': return b.html ? `<p class="n-p">${b.html}</p>${kids(b)}` : '<div class="n-gap"></div>';
    case 'hr': return '<hr class="n-hr" />';
    case 'quote': return `<blockquote class="n-quote">${b.html}${kids(b)}</blockquote>`;
    case 'callout':
      return `<div class="n-callout n-callout--${esc(b.color)}"><span class="n-callout__icon">${
        b.icon || svg('<path d="M7 4h10v16l-5-3.5L7 20z" />')
      }</span><div>${b.html ? `<p class="n-p">${b.html}</p>` : ''}${b.children ? blocks(b.children) : ''}</div></div>`;
    case 'img': {
      const ratio = b.ratio ? ` style="aspect-ratio:${(1 / b.ratio).toFixed(4)}"` : '';
      const w = b.w ? ` style="max-width:${Math.round(b.w)}px"` : '';
      return `<figure class="n-img"${w}><img src="/${b.src}" alt="" loading="lazy"${ratio} />${b.caption ? `<figcaption>${b.caption}</figcaption>` : ''}</figure>`;
    }
    case 'file': return `<a class="n-file" href="${esc(b.url)}" target="_blank" rel="noopener">${svg(ICONS.files)}<span>${esc(b.name)}</span></a>`;
    case 'cols':
      return `<div class="n-cols">${b.cols.map((c) => `<div class="n-col" style="flex:${c.ratio || 1} 1 0">${blocks(c.children)}</div>`).join('')}</div>`;
    default: return '';
  }
}

function propValue(p) {
  if (p.type === 'tags') return p.values.length ? `<ul class="n-tags">${p.values.map(tag).join('')}</ul>` : '<span class="n-empty">Empty</span>';
  if (p.type === 'files')
    return p.files.length
      ? p.files.map((f) => `<a class="n-file n-file--inline" href="${esc(f.url)}" target="_blank" rel="noopener">${svg(ICONS.files)}<span>${esc(f.name)}</span></a>`).join('')
      : '<span class="n-empty">Empty</span>';
  return p.text ? esc(p.text) : '<span class="n-empty">Empty</span>';
}

function render(t) {
  const i = teams.indexOf(t);
  const prev = teams[(i - 1 + teams.length) % teams.length];
  const next = teams[(i + 1) % teams.length];
  const icon = t.icon?.img ? `<img src="/${t.icon.img}" alt="" />` : t.icon?.emoji || '';
  pageEl.innerHTML = `
    <div class="tv-cover"><img src="/${t.cover}" alt="${esc(t.name)} 커버" style="object-position:center ${((1 - (t.coverPos ?? 0.5)) * 100).toFixed(1)}%" /></div>
    <div class="tv-body">
      ${icon ? `<div class="tv-icon">${icon}</div>` : ''}
      <h1 class="tv-title">${esc(t.name)}</h1>
      <dl class="tv-props">${t.props
        .map((p) => `<div class="tv-prop"><dt>${svg(ICONS[p.type] || ICONS.text)}${esc(p.label)}</dt><dd>${propValue(p)}</dd></div>`)
        .join('')}</dl>
      <div class="tv-content">${blocks(t.blocks)}</div>
      <nav class="tv-nav">
        <a href="#team/${esc(prev.slug)}" data-slug="${esc(prev.slug)}"><small>이전 팀</small>${esc(prev.name)}</a>
        <a href="#team/${esc(next.slug)}" data-slug="${esc(next.slug)}"><small>다음 팀</small>${esc(next.name)}</a>
      </nav>
    </div>`;
  view.scrollTop = 0;
}

/* ---------- 열기·닫기 (주소의 #team/<slug> 를 따른다) ---------- */
function sync() {
  const m = location.hash.match(/^#team\/(.+)$/);
  const t = m && teams.find((x) => x.slug === decodeURIComponent(m[1]));
  if (t) {
    render(t);
    if (view.hidden) {
      view.hidden = false;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => view.classList.add('is-open'));
      setTimeout(() => $('#teamViewClose').focus({ preventScroll: true }), 50);
    }
  } else if (!view.hidden) {
    view.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => (view.hidden = true), 300);
  }
}

function close() {
  if (openedByClick) history.back();
  else history.replaceState(null, '', location.pathname + location.search), sync();
  openedByClick = false;
}

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-slug]');
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
  e.preventDefault();
  const hash = `#team/${a.dataset.slug}`;
  // 상세 창 안에서 팀을 옮겨 다닐 때는 기록을 쌓지 않는다(뒤로 가기 한 번이면 목록으로 돌아오게)
  if (view.hidden) (history.pushState(null, '', hash), (openedByClick = true));
  else history.replaceState(null, '', hash);
  sync();
});
$('#teamViewClose').addEventListener('click', close);
view.addEventListener('click', (e) => e.target === view && close());
addEventListener('keydown', (e) => e.key === 'Escape' && !view.hidden && close());
addEventListener('hashchange', sync);
addEventListener('popstate', sync);

fetch('/assets/notion/teams.json?v=3')
  .then((r) => r.json())
  .then((data) => {
    const bySlug = Object.fromEntries(data.map((t) => [t.slug, t]));
    const divisions = (event.divisions || []).map((d) => ({
      ...d,
      groups: d.groups.map((g) => ({ ...g, teams: g.teams.map((s) => bySlug[s]).filter(Boolean) })),
    }));
    // 이전·다음 팀 이동도 분과 순서를 따른다. 분과에 안 넣은 팀은 맨 뒤에 붙는다.
    const listed = divisions.flatMap((d) => d.groups.flatMap((g) => g.teams));
    teams = [...listed, ...data.filter((t) => !listed.includes(t))];
    const draw = () => {
      const wide = WIDE.matches;
      grid.innerHTML = divisions.length
        ? divisions
            .map(
              (d) => `<section class="division">
                ${d.name ? `<h3 class="division__name">${esc(d.name)}</h3>` : ''}
                <div class="division__groups">${(wide ? pack(d.groups) : d.groups.map((g) => ({ g, teams: g.teams, first: true })))
                  .map(
                    (seg) => `<div class="division__group" style="--span:${Math.min(seg.teams.length, COLS)}">
                      <h4 class="division__field"${seg.first ? '' : ' aria-hidden="true" data-cont'}>${esc(seg.g.field)}<small>${seg.g.teams.length}팀</small></h4>
                      <div class="finalists__grid">${seg.teams.map(card).join('')}</div>
                    </div>`
                  )
                  .join('')}</div>
              </section>`
            )
            .join('')
        : `<div class="finalists__grid">${teams.map(card).join('')}</div>`;
    };
    draw();
    WIDE.addEventListener('change', draw);
    sync();
  })
  .catch(() => ($('#finalists').hidden = true));
