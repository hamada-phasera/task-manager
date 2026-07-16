/**
 * figures.js — 数値SSOT(data/figures.json)の読み込みと注入。
 * サイト上の全数値はここを経由して描画される。HTML側は data-* フックのみ。
 * approval.status === "pending" の値には黄色(#F5C518)の要承認バッジを自動付与する。
 */

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export async function loadFigures() {
  const res = await fetch('data/figures.json');
  if (!res.ok) throw new Error(`figures.json の取得に失敗しました (${res.status})`);
  return res.json();
}

function approvalBadge(fig, { dot = false } = {}) {
  if (fig.approval?.status !== 'pending') return null;
  const sup = document.createElement('sup');
  sup.className = 'badge-approve' + (dot ? ' badge-approve--dot' : '');
  sup.title = `要承認: ${fig.approval.note ?? ''}`;
  if (!dot) sup.textContent = '要承認';
  else sup.setAttribute('aria-label', '要承認');
  return sup;
}

function figText(fig) {
  // 例: "13,800" + "件/日"、"200" + "店舗" + "+"
  return `${fig.display}${fig.unit ?? ''}${fig.displaySuffix ?? ''}`;
}

/** インライン注入: <span data-fig="key"> → 「0.001%」等の表示+バッジ */
function injectInline(data) {
  document.querySelectorAll('[data-fig]').forEach((el) => {
    const fig = data.figures[el.dataset.fig];
    if (!fig) return;
    el.textContent = figText(fig);
    const badge = approvalBadge(fig);
    if (badge) el.appendChild(badge);
  });
}

/** HUD注入: 生値をモノスペース向けにカンマ整形(バッジはドット表示) */
function injectHud(data) {
  document.querySelectorAll('[data-hud]').forEach((el) => {
    const fig = data.figures[el.dataset.hud];
    if (!fig) return;
    const v = fig.value;
    el.textContent = Number.isInteger(v) ? v.toLocaleString('en-US') : String(v);
    const badge = approvalBadge(fig, { dot: true });
    if (badge) el.appendChild(badge);
  });
}

/** 会社情報の注入(社名・住所・TEL) */
function injectCompany(data) {
  const c = data.company;
  document.querySelectorAll('[data-company]').forEach((el) => {
    const key = el.dataset.company;
    if (c[key] == null) return;
    el.textContent = c[key];
  });
  const tel = document.getElementById('footer-tel');
  if (tel) tel.href = c.telHref;
}

/** 拠点数(activeのみ)を配列から導出して注入 */
function injectLocationCount(data) {
  const n = data.locations.filter((l) => l.status === 'active').length;
  document.querySelectorAll('[data-locations-count]').forEach((el) => {
    el.textContent = String(n);
  });
}

/** S6 拠点グリッドの描画 */
function renderLocations(data) {
  const grid = document.getElementById('locations-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const loc of data.locations) {
    const li = document.createElement('li');
    li.className = 'loc-card' + (loc.status === 'planned' ? ' loc-card--planned' : '');
    const no = String(loc.no).padStart(2, '0');
    li.innerHTML = `
      <span class="loc-card__no">SITE_${no}</span>
      <span class="loc-card__name"></span>
      <span class="loc-card__area"></span>
      <span class="loc-card__tags"></span>`;
    li.querySelector('.loc-card__name').textContent = loc.name;
    li.querySelector('.loc-card__area').textContent = loc.area;
    const tags = li.querySelector('.loc-card__tags');
    for (const t of loc.tags) {
      const s = document.createElement('span');
      s.className = 'loc-card__tag';
      s.textContent = t;
      tags.appendChild(s);
    }
    if (loc.status === 'planned') {
      const b = document.createElement('span');
      b.className = 'badge-planned';
      b.textContent = loc.plannedLabel;
      tags.appendChild(b);
    }
    grid.appendChild(li);
  }
  const note = document.getElementById('locations-note');
  if (note) note.textContent = data.locationsNote ?? '';
}

/** S7 事例カードの描画(課題→波動対応→定量成果の3行) */
function renderCases(data) {
  const list = document.getElementById('cases-list');
  if (!list) return;
  list.innerHTML = '';
  for (const cs of data.cases) {
    const art = document.createElement('article');
    art.className = 'case-card';
    art.innerHTML = `
      <header>
        <h3 class="case-card__client"></h3>
        <p class="case-card__industry"></p>
      </header>
      <div class="case-card__rows">
        <div class="case-card__row"><span class="case-card__rowlabel">課題</span><span class="case-card__challenge"></span></div>
        <div class="case-card__row"><span class="case-card__rowlabel">波動対応</span><span class="case-card__response"></span></div>
        <div class="case-card__row"><span class="case-card__rowlabel">定量成果</span>
          <span class="case-card__result">
            <span class="case-card__result-label"></span>
            <span class="case-card__value" data-case-count></span>
            <span class="case-card__result-unit"></span>
          </span>
        </div>
      </div>`;
    const client = art.querySelector('.case-card__client');
    client.textContent = cs.client;
    const badge = document.createElement('sup');
    badge.className = 'badge-approve';
    badge.textContent = cs.clientBadge;
    badge.title = 'クライアント実名は承認取得後に差し替え';
    client.appendChild(badge);
    art.querySelector('.case-card__industry').textContent = cs.industry;
    art.querySelector('.case-card__challenge').textContent = cs.challenge;
    art.querySelector('.case-card__response').textContent = cs.response;
    art.querySelector('.case-card__result-label').textContent = cs.result.label;
    const valEl = art.querySelector('.case-card__value');
    valEl.textContent = cs.result.display;
    valEl.dataset.countTo = String(cs.result.value);
    valEl.dataset.countDecimals = String((cs.result.display.split('.')[1] ?? '').length);
    art.querySelector('.case-card__result-unit').textContent = cs.result.unit;
    list.appendChild(art);
  }
  const note = document.getElementById('cases-note');
  if (note) note.textContent = data.casesNote ?? '';
}

/** S4 要承認フットノートの自動生成 */
function renderApprovalFootnote(data) {
  const el = document.getElementById('approval-footnote');
  if (!el) return;
  const pending = Object.values(data.figures).filter((f) => f.approval?.status === 'pending');
  if (pending.length === 0) { el.remove(); return; }
  const items = pending.map((f) => `${f.label}(社内資料では ${f.approval.conflict})`).join(' / ');
  el.textContent = `※「要承認」バッジの数値は社内資料と矛盾があり、広報の最終確認待ちです — ${items}`;
}

/* ---- カウントアップ(Stripe式 / IBM Plex Mono) ---------------------------- */

function formatCount(n, { decimals = 0, grouping = true } = {}) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: grouping,
  });
}

function animateCount(el, spec) {
  const { to, decimals = 0, suffix = '', grouping = true } = spec;
  const duration = 1500;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(2, -10 * t); // easeOutExpo
  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const v = to * ease(t);
    el.dataset.countText = formatCount(t >= 1 ? to : v, { decimals, grouping }) + suffix;
    syncCountText(el);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/** バッジ(子要素)を保持したままテキスト部分だけ更新する */
function syncCountText(el) {
  let textNode = el.firstChild;
  if (!textNode || textNode.nodeType !== Node.TEXT_NODE) {
    textNode = document.createTextNode('');
    el.prepend(textNode);
  }
  textNode.nodeValue = el.dataset.countText;
}

function setupCountUps(data) {
  const targets = [];

  document.querySelectorAll('[data-count]').forEach((el) => {
    const fig = data.figures[el.dataset.count];
    if (!fig?.count) return;
    const spec = fig.count;
    el.dataset.countText = formatCount(spec.to, spec) + (spec.suffix ?? '');
    syncCountText(el);
    const badge = approvalBadge(fig);
    if (badge) el.appendChild(badge);
    targets.push({ el, spec });
  });

  document.querySelectorAll('[data-case-count]').forEach((el) => {
    const to = Number(el.dataset.countTo);
    const decimals = Number(el.dataset.countDecimals);
    targets.push({ el, spec: { to, decimals } });
  });

  if (REDUCED || !('IntersectionObserver' in window)) return; // 最終値を即表示済み

  // 一旦0表示に戻し、可視化時にカウントアップ
  for (const { el, spec } of targets) {
    el.dataset.countText = formatCount(0, spec) + (spec.suffix ?? '');
    syncCountText(el);
  }
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const hit = targets.find((t) => t.el === e.target);
      if (hit) animateCount(hit.el, hit.spec);
      io.unobserve(e.target);
    }
  }, { threshold: 0.4 });
  for (const { el } of targets) io.observe(el);
}

/** すべての注入を実行して figures データを返す */
export async function initFigures() {
  const data = await loadFigures();
  injectCompany(data);
  injectLocationCount(data);
  injectInline(data);
  injectHud(data);
  renderLocations(data);
  renderCases(data);
  renderApprovalFootnote(data);
  setupCountUps(data);
  return data;
}
