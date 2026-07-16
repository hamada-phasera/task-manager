/**
 * main.js — エントリポイント。
 * - figures.json(数値SSOT)の注入
 * - スクロール→波動フェーズ(0..2)の算出と wave.js への指示
 * - sticky 3幕ストーリーの幕切り替え
 * - シーン遷移ベール(フロスト+色収差の補助)
 * - マーキー一時停止 / サービスアコーディオン / CTA・フォーム(モック)
 *
 * 波面(WebGL)は遅延初期化: LCPはHEROテキスト。
 * prefers-reduced-motion では WebGL を起動せず静止背景に切り替える。
 */

import { initFigures } from './figures.js';
import { initScramble } from './scramble.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- 数値SSOT ------------------------------------------------------------ */

initFigures().catch((err) => {
  console.warn(err);
  const bar = document.createElement('div');
  bar.setAttribute('role', 'alert');
  bar.style.cssText =
    'position:fixed;bottom:0;left:0;right:0;z-index:50;padding:10px 16px;' +
    'background:#F5C518;color:#131003;font-size:13px;text-align:center;';
  bar.textContent =
    'data/figures.json を読み込めませんでした。ローカルサーバー経由で開いてください(README参照)。';
  document.body.appendChild(bar);
});

/* ---- 演出 ------------------------------------------------------------------ */

initScramble();

/* ---- S2 マーキー一時停止(WCAG 2.2.2) -------------------------------------- */

{
  const marquee = document.getElementById('marquee');
  const toggle = document.getElementById('marquee-toggle');
  toggle.addEventListener('click', () => {
    const paused = marquee.classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.querySelector('.marquee__toggle-label').textContent = paused ? '再生' : '一時停止';
    toggle.querySelector('.marquee__toggle-icon').textContent = paused ? '▶' : '❚❚';
  });
}

/* ---- S5 サービスアコーディオン(タップ開閉・aria-expanded) ------------------ */

document.querySelectorAll('.svc-card__toggle').forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute('aria-controls'));
  btn.addEventListener('click', () => {
    const open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
    btn.querySelector('.svc-card__toggle-label').textContent = open ? '詳細を見る' : '閉じる';
    btn.querySelector('.svc-card__toggle-icon').textContent = open ? '+' : '−';
  });
});

/* ---- S9 CTAカード→フォーム連携 & モック送信 --------------------------------- */

{
  const select = document.getElementById('f-subject');
  const cards = document.querySelectorAll('.cta-card');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      select.value = card.dataset.subject;
      cards.forEach((c) => c.removeAttribute('aria-current'));
      card.setAttribute('aria-current', 'true');
      document.getElementById('f-company').focus({ preventScroll: true });
      document.getElementById('contact-form').scrollIntoView({
        behavior: REDUCED ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  });

  const form = document.getElementById('contact-form');
  const result = document.getElementById('form-result');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    result.textContent =
      `受付内容(${select.value})を確認しました — 本サイトはデザインモックのため、実際の送信は行われていません。`;
  });
}

/* ---- スクロール→波動フェーズ / 3幕ストーリー -------------------------------- */

const story = document.getElementById('story');
const acts = [...document.querySelectorAll('.story__act')];
const numbers = document.getElementById('numbers');
const veil = document.getElementById('veil');

let phaseTarget = 0;

function computePhase() {
  const vh = window.innerHeight;
  const y = window.scrollY;
  const storyTop = story.offsetTop;
  const storySpan = story.offsetHeight - vh;

  // 第1幕(HERO)=0 → ストーリー内で 0→1(整流)
  const p = Math.max(0, Math.min(1, (y - storyTop) / storySpan));

  // NUMBERS 手前で 1→2(静止)
  const numbersTop = numbers.offsetTop;
  const q = Math.max(0, Math.min(1, (y - (numbersTop - vh * 0.8)) / (vh * 0.8)));

  phaseTarget = p + q;

  // 幕テキストの切り替え(ストーリー可視中のみ)
  const inStory = y >= storyTop - vh * 0.5 && y <= storyTop + story.offsetHeight - vh * 0.5;
  const actIndex = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
  acts.forEach((act, i) => {
    act.classList.toggle('is-active', inStory && i === actIndex);
  });
}

computePhase();
window.addEventListener('scroll', computePhase, { passive: true });
window.addEventListener('resize', computePhase);

/* ---- 波面の遅延初期化(LCP後・アイドル時) ----------------------------------- */

let wave = null;

function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

async function bootWave() {
  if (REDUCED || !supportsWebGL()) {
    document.documentElement.classList.add('no-wave');
    return;
  }
  try {
    const { initWave } = await import('./wave.js');
    wave = initWave(document.getElementById('wave-canvas'));
  } catch (err) {
    console.warn('wave init failed:', err);
    document.documentElement.classList.add('no-wave');
    return;
  }

  // ベール(フロスト+色収差の補助)と波面へのフェーズ伝搬
  let localPhase = 0;
  (function tick() {
    requestAnimationFrame(tick);
    wave.setPhase(phaseTarget);
    localPhase += (phaseTarget - localPhase) * 0.07; // wave.js と同じLERP係数
    const vi = Math.min(1, Math.abs(phaseTarget - localPhase) * 1.2);
    veil.style.opacity = (vi * 0.4).toFixed(3);
    const blur = (vi * 5).toFixed(1);
    veil.style.backdropFilter = `blur(${blur}px)`;
    veil.style.webkitBackdropFilter = `blur(${blur}px)`;
  })();
}

if (REDUCED) {
  document.documentElement.classList.add('no-wave');
} else if ('requestIdleCallback' in window) {
  window.addEventListener('load', () => requestIdleCallback(bootWave, { timeout: 1500 }));
} else {
  window.addEventListener('load', () => setTimeout(bootWave, 600));
}
