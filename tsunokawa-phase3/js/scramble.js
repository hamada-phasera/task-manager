/**
 * scramble.js — igloo.inc 参照のテキストスクランブル演出。
 * [data-scramble] : 可視化されるたびに一度だけ実行(セクションラベル向け)
 * [data-scramble-once] : 初回ロード時に実行(HERO見出し向け)
 * prefers-reduced-motion では何もしない。
 */

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>_#%+-=';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function scramble(el, duration = 900) {
  const original = el.textContent;
  const chars = [...original];
  const start = performance.now();
  el.setAttribute('aria-label', original); // 読み上げは常に確定テキスト

  function frame(now) {
    const t = Math.min(1, (now - start) / duration);
    const settled = Math.floor(t * chars.length);
    let out = '';
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      if (i < settled || /\s/.test(c)) out += c;
      else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }
    el.textContent = out;
    if (t < 1) requestAnimationFrame(frame);
    else el.textContent = original;
  }
  requestAnimationFrame(frame);
}

export function initScramble() {
  if (REDUCED) return;

  document.querySelectorAll('[data-scramble-once]').forEach((el) => {
    // 和文見出しはスクランブルせずフェード(グリフ置換は欧文ラベルのみ)
    el.animate(
      [{ opacity: 0, filter: 'blur(6px)' }, { opacity: 1, filter: 'blur(0px)' }],
      { duration: 900, easing: 'ease-out' }
    );
  });

  if (!('IntersectionObserver' in window)) return;
  const done = new WeakSet();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting || done.has(e.target)) continue;
      done.add(e.target);
      scramble(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.6 });
  document.querySelectorAll('[data-scramble]').forEach((el) => io.observe(el));
}
