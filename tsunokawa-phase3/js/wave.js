/**
 * wave.js — 波動(出荷スパイク)のパーティクル波面。
 * 手続き的ジオメトリのみ(外部3Dアセット不使用)。three@0.160 ローカルバンドル。
 *
 * 3幕構成(uPhase 0→2 を main.js がスクロールから指示、内部で LERP 平滑化):
 *   第1幕 HERO       = 荒波(fbmノイズ・大振幅・ウォーム #FF7A59 優勢)
 *   第2幕 STORY      = 整流(正弦波に収束)
 *   第3幕 NUMBERS〜  = 静止(平坦格子・シアン #3FE0C5 優勢・まれに1点脈動)
 *
 * シーン遷移時は uAberration(点スプライトのRGBオフセット=色収差)を上げる。
 */

import * as THREE from '../vendor/three.module.min.js';

const LERP = 0.07;

const VERT = /* glsl */ `
  uniform float uTime;
  uniform float uPhase;
  uniform float uPulseTime;   // 脈動開始からの秒数(負値で無効)
  uniform vec2  uPulseCenter;
  uniform float uPixelRatio;
  attribute float aRand;
  varying vec3  vColor;
  varying float vAlpha;

  const vec3 WARM = vec3(1.0, 0.478, 0.349);   // #FF7A59
  const vec3 COOL = vec3(0.247, 0.878, 0.773); // #3FE0C5

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 p = position;

    // 幕ごとの重み(合計1)
    float w0 = 1.0 - smoothstep(0.0, 1.0, uPhase);
    float w2 = smoothstep(1.0, 2.0, uPhase);
    float w1 = 1.0 - w0 - w2;

    // 第1幕: 荒波
    float rough = (fbm(p.xz * 0.32 + vec2(uTime * 0.30, uTime * 0.17)) - 0.5) * 2.7
                + (noise(p.xz * 1.35 + uTime * 0.45) - 0.5) * 0.5;

    // 第2幕: 整流(正弦波に収束)
    float calm = sin(p.x * 0.62 + uTime * 1.1) * 0.55
               + sin(p.x * 0.21 - uTime * 0.55) * 0.30;

    // 第3幕: 静止(平坦格子+まれな1点脈動)
    float still = 0.0;
    float pulseGlow = 0.0;
    if (uPulseTime >= 0.0) {
      float d = distance(p.xz, uPulseCenter);
      float env = exp(-d * d * 0.16) * exp(-uPulseTime * 1.1);
      still += sin(d * 2.2 - uPulseTime * 4.2) * env * 0.85;
      pulseGlow = env;
    }

    p.y = rough * w0 + calm * w1 + still * w2;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float depth = -mv.z;
    float h = clamp(p.y * 0.6 + 0.5, 0.0, 1.0);

    // 色: ウォーム→シアンへ幕とともに遷移。波頭ほどわずかに明るく
    float cm = smoothstep(0.25, 1.65, uPhase);
    vec3 base = mix(WARM, COOL, cm);
    base = mix(base, vec3(0.93, 0.95, 0.97), h * h * 0.14);
    // 第3幕は全体をさらに沈めて「静けさ」を出す(加算合成の飽和防止)
    float dim = 1.0 - w2 * 0.62;
    float lum = (0.12 + h * 0.38 + aRand * 0.08) * dim;
    vColor = base * lum + COOL * pulseGlow * w2 * 1.2;

    // 霧: 奥行き・左右端でフェード(霧のかかった単色空間)
    float fog = smoothstep(27.0, 8.0, depth);
    float edge = smoothstep(17.5, 12.0, abs(position.x));
    vAlpha = fog * edge * (0.30 + h * 0.35);

    gl_PointSize = (0.8 + h * 1.0 + aRand * 0.35) * uPixelRatio * (120.0 / depth);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uAberration;
  varying vec3  vColor;
  varying float vAlpha;

  float disc(vec2 uv) {
    return smoothstep(0.5, 0.10, length(uv));
  }

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    vec2 off = vec2(uAberration, 0.0);
    float r = disc(uv - off);
    float g = disc(uv);
    float b = disc(uv + off);
    float a = max(r, max(g, b)) * vAlpha;
    if (a < 0.02) discard;
    gl_FragColor = vec4(vColor * vec3(r, g, b), a);
  }
`;

function buildGrid(cols, rows) {
  const count = cols * rows;
  const pos = new Float32Array(count * 3);
  const rand = new Float32Array(count);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      pos[i * 3 + 0] = (c / (cols - 1) - 0.5) * 36; // x: -18..18
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = -19 + (r / (rows - 1)) * 26; // z: -19..7
      rand[i] = Math.random();
      i++;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 1));
  return geo;
}

export function initWave(canvas) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    powerPreference: 'low-power',
  });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 3.6, 11);
  camera.lookAt(0, -1.2, -6);

  const uniforms = {
    uTime: { value: 0 },
    uPhase: { value: 0 },
    uAberration: { value: 0 },
    uPulseTime: { value: -1 },
    uPulseCenter: { value: new THREE.Vector2(0, -6) },
    uPixelRatio: { value: pixelRatio },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(buildGrid(220, 120), material);
  points.position.y = -2.4; // 波面はテキストより下に敷く(主役はあくまでコピー)
  scene.add(points);

  let phaseTarget = 0;
  let phaseCurrent = 0;
  let pulseStart = -1;
  let nextPulseAt = 0;
  let rafId = 0;
  const t0 = performance.now();

  function animate(now) {
    rafId = requestAnimationFrame(animate);
    const t = (now - t0) / 1000;

    // LERP平滑化(係数0.07)
    phaseCurrent += (phaseTarget - phaseCurrent) * LERP;
    uniforms.uPhase.value = phaseCurrent;
    uniforms.uTime.value = t;

    // 遷移中のみ色収差(点スプライトのRGBずれ)
    uniforms.uAberration.value = Math.min(0.1, Math.abs(phaseTarget - phaseCurrent) * 0.32);

    // 第3幕: まれに1点だけ脈動する
    if (phaseCurrent > 1.65) {
      if (pulseStart < 0 && t > nextPulseAt) {
        pulseStart = t;
        uniforms.uPulseCenter.value.set((Math.random() - 0.5) * 18, -12 + Math.random() * 12);
      }
      if (pulseStart >= 0) {
        const age = t - pulseStart;
        uniforms.uPulseTime.value = age;
        if (age > 4.5) {
          pulseStart = -1;
          uniforms.uPulseTime.value = -1;
          nextPulseAt = t + 6 + Math.random() * 8;
        }
      }
    } else {
      pulseStart = -1;
      uniforms.uPulseTime.value = -1;
      nextPulseAt = t + 3;
    }

    renderer.render(scene, camera);
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  window.addEventListener('resize', onResize);

  // タブ非表示中は描画停止
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(animate);
    }
  });

  rafId = requestAnimationFrame(animate);

  return {
    /** スクロール側から目標フェーズ(0..2)を渡す */
    setPhase(target) {
      phaseTarget = Math.max(0, Math.min(2, target));
    },
    getPhase() {
      return phaseCurrent;
    },
  };
}
