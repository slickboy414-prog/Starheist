// =====================================================================
//  STAR HEIST — Steal the Celebs!   (YouTube Playables sample build)
//  All celebrities are fictional, original characters.
// =====================================================================
import * as THREE from './three.module.min.js';
import { extendCelebs, THEME_DAYS } from './content.js';
import { t as tr, setLang, getLang, LANGS } from './i18n.js';

// ---------------------------------------------------------------------
//  YouTube Playables SDK wrapper (graceful fallback outside YouTube)
// ---------------------------------------------------------------------
const YT = (typeof window.ytgame !== 'undefined') ? window.ytgame : null;
const IN_YT = !!(YT && YT.IN_PLAYABLES_ENV);
const SAVE_KEY = 'starheist_save_v1';
const SDK = {
  firstFrame() { try { IN_YT && YT.game.firstFrameReady(); } catch (e) {} },
  ready() { try { IN_YT && YT.game.gameReady(); } catch (e) {} },
  async load() {
    if (IN_YT) { try { return (await YT.game.loadData()) || ''; } catch (e) { return ''; } }
    try { return localStorage.getItem(SAVE_KEY) || ''; } catch (e) { return ''; }
  },
  async save(str) {
    if (IN_YT) { try { await YT.game.saveData(str); } catch (e) {} return; }
    try { localStorage.setItem(SAVE_KEY, str); } catch (e) {}
  },
  audioEnabled() { try { return IN_YT ? YT.system.isAudioEnabled() : true; } catch (e) { return true; } },
  onAudioChange(cb) { try { IN_YT && YT.system.onAudioEnabledChange(cb); } catch (e) {} },
  onPause(cb) { try { IN_YT && YT.system.onPause(cb); } catch (e) {} },
  onResume(cb) { try { IN_YT && YT.system.onResume(cb); } catch (e) {} },
  async lang() { try { if (IN_YT) return await YT.system.getLanguage(); } catch (e) {} return navigator.language || 'en'; },
  score(v) { try { IN_YT && YT.engagement.sendScore({ value: Math.max(0, Math.floor(v)) }); } catch (e) {} },
  error() { try { IN_YT && YT.health.logError(); } catch (e) {} },
  warn() { try { IN_YT && YT.health.logWarning(); } catch (e) {} },
};
window.addEventListener('error', () => SDK.error());
window.addEventListener('unhandledrejection', () => SDK.warn());

// ---------------------------------------------------------------------
//  Utils
// ---------------------------------------------------------------------
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hdist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI; return a + d * Math.min(1, t); };
function fmt(n) {
  n = Math.max(0, n);
  if (n < 1000) return '' + Math.floor(n);
  const u = ['K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  const s = n < 10 ? n.toFixed(2) : n < 100 ? n.toFixed(1) : Math.floor(n).toString();
  return parseFloat(s) + u[i];
}
function wpick(items, wfn) {
  let tot = 0; for (const it of items) tot += wfn(it);
  let r = Math.random() * tot;
  for (const it of items) { r -= wfn(it); if (r <= 0) return it; }
  return items[items.length - 1];
}
let isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0;
if (isTouch) document.body.classList.add('touch');
// iOS / iPadOS: stop pinch-zoom, double-tap zoom and page bounce from moving the controls
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', (e) => { if (!(e.target.closest && e.target.closest('.panel, #popup'))) e.preventDefault(); }, { passive: false });

// ---------------------------------------------------------------------
//  Game data
// ---------------------------------------------------------------------
const RARITIES = [
  { name: 'LOCAL STAR', color: '#d0d0d0', hex: 0xd0d0d0, w: 55 },
  { name: 'VIRAL', color: '#4da6ff', hex: 0x4da6ff, w: 28 },
  { name: 'FAMOUS', color: '#c06bff', hex: 0xc06bff, w: 11 },
  { name: 'SUPERSTAR', color: '#ffcc00', hex: 0xffcc00, w: 4.5 },
  { name: 'ICON', color: '#ff3b6b', hex: 0xff3b6b, w: 0.35 },
  { name: 'ALL-TIME GOAT', color: 'rainbow', hex: 0xffffff, w: 0.04 },
  { name: 'EXCLUSIVE', color: '#00ffd5', hex: 0x00ffd5, w: 0 },
  { name: 'LIMITED', color: '#ff7af0', hex: 0xff7af0, w: 0 },
];
const MUTS = [
  { id: 0, name: '', mult: 1, w: 86 },
  { id: 1, name: 'GOLD', mult: 2, w: 10, color: '#ffd34d', hex: 0xffc832 },
  { id: 2, name: 'DIAMOND', mult: 3, w: 3.5, color: '#8ff6ff', hex: 0x9ff8ff },
  { id: 3, name: 'RAINBOW', mult: 5, w: 0.8, color: 'rainbow', hex: 0xffffff },
];
// Original, fictional celebrities only.
const CELEBS = [
  { name: 'Flex McMuscle', title: 'Gym Influencer', r: 0, cost: 40, inc: 2, look: { skin: 0xf1c27d, hair: 0x3b2314, hairStyle: 'short', top: 0xff4d4d, bottom: 0x2d3561, shoes: 0xffffff, muscle: true, sleeveless: true, acc: ['dumbbell', 'headband'] } },
  { name: 'Selfie Sally', title: 'Small-Town Selfie Queen', r: 0, cost: 65, inc: 3, look: { skin: 0xffdbac, hair: 0xf5d76e, hairStyle: 'ponytail', top: 0xff8fd8, bottom: 0x6ec6ff, shoes: 0xffffff, acc: ['phone'] } },
  { name: 'Pixel Pete', title: 'Viral Game Streamer', r: 0, cost: 90, inc: 4, look: { skin: 0xe0ac69, hair: 0x5a3a1a, hairStyle: 'spiky', top: 0x3ddc84, bottom: 0x333344, shoes: 0x222222, acc: ['headphones'] } },
  { name: 'Stormy Skies', title: 'Local TV Weatherman', r: 0, cost: 120, inc: 5, look: { skin: 0xc68642, hair: 0x222222, hairStyle: 'short', top: 0x34495e, bottom: 0x34495e, shoes: 0x111111, acc: ['tie', 'umbrella'] } },
  { name: 'Lil Icebox', title: 'Rising Rap Star', r: 1, cost: 350, inc: 12, look: { skin: 0x8d5524, hair: 0x111111, hairStyle: 'buzz', top: 0x7fdfff, bottom: 0x222222, shoes: 0xff3355, acc: ['shades', 'chain', 'cap'], capColor: 0xffffff } },
  { name: 'DJ Bass Drop', title: 'Club DJ', r: 1, cost: 550, inc: 18, look: { skin: 0xc68642, hair: 0xff33cc, hairStyle: 'mohawk', top: 0x1a1a2e, bottom: 0x333333, shoes: 0x00ffcc, acc: ['headphones', 'shades'] } },
  { name: 'Kiki Glow', title: 'Beauty Vlogger', r: 1, cost: 800, inc: 26, look: { skin: 0xffe0bd, hair: 0xc77dff, hairStyle: 'long', top: 0xff66aa, bottom: 0xff66aa, shoes: 0xffffff, dress: true, acc: ['phone', 'shades'] } },
  { name: 'Riff Raven', title: 'Rock Band Frontman', r: 2, cost: 2400, inc: 65, look: { skin: 0xf3d2b3, hair: 0x111111, hairStyle: 'long', top: 0x222222, bottom: 0x1b1b3a, shoes: 0x111111, acc: ['guitar', 'shades', 'chain'] } },
  { name: 'Chef Flambé', title: 'TV Celebrity Chef', r: 2, cost: 3500, inc: 90, look: { skin: 0xf1c27d, hair: 0x777777, hairStyle: 'short', top: 0xffffff, bottom: 0x222222, shoes: 0x111111, acc: ['chefhat', 'pan', 'mustache'] } },
  { name: 'Rex Steel', title: 'Action Movie Star', r: 2, cost: 5000, inc: 125, look: { skin: 0xd1a17a, hair: 0x3b2314, hairStyle: 'buzz', top: 0x556b2f, bottom: 0x3d3d29, shoes: 0x222222, muscle: true, sleeveless: true, acc: ['shades', 'bandana'] } },
  { name: 'Nova Starling', title: 'World-Tour Pop Megastar', r: 3, cost: 15000, inc: 320, look: { skin: 0xffe0bd, hair: 0xffb3e6, hairStyle: 'long', top: 0xff3fd0, bottom: 0xff3fd0, shoes: 0xffffff, dress: true, acc: ['mic', 'tiara'] } },
  { name: 'Duke Dazzle', title: 'Boy Band Heartthrob', r: 3, cost: 22000, inc: 450, look: { skin: 0xe8b98a, hair: 0xffe066, hairStyle: 'spiky', top: 0x9b5de5, bottom: 0xffffff, shoes: 0xffffff, acc: ['mic', 'chain', 'shades'] } },
  { name: 'Dusty Boots', title: 'Country Music Superstar', r: 3, cost: 30000, inc: 600, look: { skin: 0xf1c27d, hair: 0x8b5a2b, hairStyle: 'short', top: 0xc0392b, bottom: 0x3b5b92, shoes: 0x6b3e1e, acc: ['cowboy', 'guitar'], guitarColor: 0xe0a050 } },
  { name: 'Diva Diamond', title: 'Hollywood Screen Icon', r: 4, cost: 110000, inc: 1800, look: { skin: 0xc68642, hair: 0x111111, hairStyle: 'bun', top: 0xffd700, bottom: 0xffd700, shoes: 0xffd700, dress: true, acc: ['shades', 'tiara', 'boa'] } },
  { name: 'Mystic Max', title: 'Las Vegas Legend', r: 4, cost: 160000, inc: 2600, look: { skin: 0xffdbac, hair: 0x222222, hairStyle: 'short', top: 0x2b1055, bottom: 0x111111, shoes: 0x111111, acc: ['tophat', 'cape', 'wand', 'mustache'], capeColor: 0x6a0dad } },
  { name: 'The Ultra GOAT', title: 'Greatest Athlete Ever', r: 5, cost: 800000, inc: 11000, look: { skin: 0xf1c27d, hair: 0xffffff, hairStyle: 'spiky', top: 0xffffff, bottom: 0xdddddd, shoes: 0xffd700, acc: ['crown', 'cape', 'chain', 'shades'], capeColor: 0xffd700 } },
  { name: 'Captain Cosmo', title: 'Celebrity Astronaut', r: 5, cost: 1200000, inc: 16000, look: { skin: 0xe0ac69, hair: 0x222222, hairStyle: 'buzz', top: 0xf0f0f0, bottom: 0xf0f0f0, shoes: 0x888888, acc: ['helmet', 'cape'], capeColor: 0x3b82f6 } },
  { name: 'Morning Mike', title: 'Local Radio Host', r: 0, cost: 150, inc: 6, look: { skin: 0xffdbac, hair: 0x6b4423, hairStyle: 'short', top: 0xf39c12, bottom: 0x2c3e50, shoes: 0x111111, acc: ['headphones', 'mic'] } },
  { name: 'Dunk Dynamo', title: 'Pro Basketball Star', r: 2, cost: 4200, inc: 105, look: { skin: 0x8d5524, hair: 0x111111, hairStyle: 'buzz', top: 0x7b2cbf, bottom: 0x7b2cbf, shoes: 0xffffff, sleeveless: true, acc: ['ball', 'headband'], scale: 1.22 } },
  { name: 'Goalden Boy', title: 'World Cup Soccer Superstar', r: 3, cost: 40000, inc: 780, look: { skin: 0xe0ac69, hair: 0x2b1d0e, hairStyle: 'spiky', top: 0x1e88e5, bottom: 0xffffff, shoes: 0xffd700, acc: ['trophy'] } },
  { name: 'Velvet Vortex', title: 'Billion-Stream Music Icon', r: 4, cost: 220000, inc: 3500, look: { skin: 0xc68642, hair: 0xe8e8e8, hairStyle: 'long', top: 0x8e24aa, bottom: 0x8e24aa, shoes: 0xc0c0c0, dress: true, acc: ['mic', 'shades', 'crown'] } },
];
const { RECIPES, LIMITED_IDS, EXCLUSIVE_IDS } = extendCelebs(CELEBS);
const price = (c) => c.def.cost * c.mut.mult;

const BOT_INFO = [
  { name: 'RoboRich', color: 0xff4fa3, acc: ['tophat', 'chain'] },
  { name: 'Glitchy Gus', color: 0xff9f1c, acc: ['headphones'] },
  { name: 'Cyber Sue', color: 0x9b5de5, acc: ['tiara'] },
  { name: 'Botzilla', color: 0x4dd96b, acc: ['crown'] },
  { name: 'MegaByte', color: 0xff5454, acc: ['cap'] },
];
const BASE_DEFS = [
  { x: 0, z: 22, f: -1 }, { x: -38, z: 22, f: -1 }, { x: 38, z: 22, f: -1 },
  { x: -38, z: -22, f: 1 }, { x: 0, z: -22, f: 1 }, { x: 38, z: -22, f: 1 },
];
const UPGRADES = [
  { id: 'speed', icon: '👟', name: 'Turbo Sneakers', desc: 'Run 8% faster', max: 6, cost: (l) => 300 * Math.pow(3.2, l) },
  { id: 'slots', icon: '🏢', name: 'Bigger Agency', desc: '+1 celeb podium', max: 4, cost: (l) => 900 * Math.pow(4.2, l) },
  { id: 'lock', icon: '🔒', name: 'Laser Ropes', desc: '+10s lock time', max: 4, cost: (l) => 700 * Math.pow(3.6, l) },
  { id: 'flash', icon: '📸', name: 'Mega Flash', desc: 'Faster recharge, wider stun', max: 5, cost: (l) => 500 * Math.pow(3.4, l) },
  { id: 'star', icon: '⭐', name: 'Star Power', desc: '+25% income from your celebs', max: 10, cost: (l) => 3000 * Math.pow(3, l) },
];
const CARPET_SPEED = 2.4, CARPET_X0 = -62, CARPET_X1 = 63;

// ---------------------------------------------------------------------
//  Renderer / scene
// ---------------------------------------------------------------------
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
} catch (e) {
  document.getElementById('playBtn').textContent = 'WebGL not supported';
  SDK.error();
  throw e;
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('game').appendChild(renderer.domElement);

const scene = new THREE.Scene();
{
  const c = document.createElement('canvas'); c.width = 4; c.height = 256;
  const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#2b1b5a'); gr.addColorStop(0.42, '#9c4a8f'); gr.addColorStop(0.72, '#ff8f70'); gr.addColorStop(1, '#ffd29a');
  g.fillStyle = gr; g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; scene.background = t;
}
scene.fog = new THREE.Fog(0xffb98a, 120, 270);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 700);
scene.add(new THREE.HemisphereLight(0xfff1e0, 0x7a5c9e, 1.7));
const sun = new THREE.DirectionalLight(0xffd6a8, 2.0); sun.position.set(-40, 60, 30); scene.add(sun);

const gradTex = new THREE.DataTexture(new Uint8Array([120, 120, 120, 255, 195, 195, 195, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
gradTex.minFilter = gradTex.magFilter = THREE.NearestFilter; gradTex.needsUpdate = true;

const _mats = new Map();
function toon(hex, extra) {
  const k = hex + '|' + (extra ? JSON.stringify(extra) : '');
  let m = _mats.get(k);
  if (!m) { m = new THREE.MeshToonMaterial(Object.assign({ color: hex, gradientMap: gradTex }, extra || {})); _mats.set(k, m); }
  return m;
}
const _geos = new Map();
const G = (k, f) => { let g = _geos.get(k); if (!g) { g = f(); _geos.set(k, g); } return g; };
const boxG = (w, h, d) => G(`b${w}_${h}_${d}`, () => new THREE.BoxGeometry(w, h, d));
const cylG = (rt, rb, h, s = 12) => G(`c${rt}_${rb}_${h}_${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
const sphG = (r, ws = 12, hs = 8) => G(`s${r}_${ws}_${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
const coneG = (r, h, s = 8) => G(`k${r}_${h}_${s}`, () => new THREE.ConeGeometry(r, h, s));
const torG = (r, t, rs = 6, ts = 18) => G(`t${r}_${t}_${rs}_${ts}`, () => new THREE.TorusGeometry(r, t, rs, ts));
function M(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); if (parent) parent.add(m); return m; }
const lighten = (hex, t) => new THREE.Color(hex).lerp(new THREE.Color(0xffffff), t).getHex();
const darken = (hex, t) => new THREE.Color(hex).lerp(new THREE.Color(0x000000), t).getHex();

// Merged "person" materials (vertex colours keep draw calls low on phones)
const personMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex });
const goldMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex, emissive: 0x4a3000 });
const playerDecoMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex });
const diamondMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex, emissive: 0x124a58 });
const rainbowMat = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex, emissive: 0x222222 });
const rainbowBasics = [];
const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false });
const shadowGeo = new THREE.CircleGeometry(0.6, 16);
const glassMat = new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.28, depthWrite: false });

// ---------------------------------------------------------------------
//  Canvas text sprites
// ---------------------------------------------------------------------
const FONT = '"Arial Black","Segoe UI Black",Impact,system-ui,sans-serif';
function makeCanvasSprite(w, h, worldH) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  sprite.scale.set(worldH * w / h, worldH, 1);
  return { sprite, c, ctx, tex, w, h };
}
function disposeSprite(s) { s.tex.dispose(); s.sprite.material.dispose(); }
function rainbowFill(ctx, x0, x1) {
  const g = ctx.createLinearGradient(x0, 0, x1, 0);
  ['#ff4b4b', '#ffb13b', '#fff13b', '#3bff6b', '#3bc8ff', '#c13bff'].forEach((c, i, a) => g.addColorStop(i / (a.length - 1), c));
  return g;
}
function strokeText(ctx, txt, x, y, size, fill, maxW) {
  ctx.font = `900 ${size}px ${FONT}`;
  if (maxW) { const w = ctx.measureText(txt).width; if (w > maxW) { size = size * maxW / w; ctx.font = `900 ${size}px ${FONT}`; } }
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, size * 0.24); ctx.strokeStyle = '#000';
  ctx.strokeText(txt, x, y);
  if (fill === 'rainbow') { const w = ctx.measureText(txt).width; ctx.fillStyle = rainbowFill(ctx, x - w / 2, x + w / 2); } else ctx.fillStyle = fill;
  ctx.fillText(txt, x, y);
}

// ---------------------------------------------------------------------
//  Character builder (blocky cartoon people)
// ---------------------------------------------------------------------
function addHair(head, style, m) {
  const top = () => M(boxG(0.68, 0.18, 0.62), m, 0, 0.3, 0, head);
  switch (style) {
    case 'short': top(); M(boxG(0.68, 0.36, 0.14), m, 0, 0.12, -0.25, head); break;
    case 'long': top(); M(boxG(0.7, 0.95, 0.16), m, 0, -0.12, -0.27, head); M(boxG(0.1, 0.6, 0.5), m, -0.34, 0.02, -0.04, head); M(boxG(0.1, 0.6, 0.5), m, 0.34, 0.02, -0.04, head); break;
    case 'ponytail': top(); M(sphG(0.17), m, 0, 0.15, -0.4, head); M(boxG(0.16, 0.45, 0.16), m, 0, -0.15, -0.45, head); break;
    case 'buzz': M(boxG(0.66, 0.08, 0.6), m, 0, 0.31, 0, head); break;
    case 'mohawk': M(boxG(0.14, 0.34, 0.64), m, 0, 0.45, 0, head); break;
    case 'spiky': M(boxG(0.68, 0.14, 0.62), m, 0, 0.3, 0, head); for (let i = 0; i < 5; i++) M(coneG(0.1, 0.32, 6), m, -0.24 + i * 0.12, 0.5, i % 2 ? 0.08 : -0.1, head); break;
    case 'bun': top(); M(sphG(0.18), m, 0, 0.52, -0.05, head); break;
    case 'afro': M(sphG(0.52, 14, 10), m, 0, 0.25, -0.2, head); break;
    default: break;
  }
}
function addAcc(a, P, L) {
  const { head, body, armL, armR } = P;
  const gold = toon(0xffcc33), black = toon(0x151515), white = toon(0xffffff), metal = toon(0x9aa3b0);
  let m;
  switch (a) {
    case 'shades': M(boxG(0.62, 0.14, 0.05), black, 0, 0.06, 0.31, head); break;
    case 'chain': m = M(torG(0.25, 0.04, 6, 16), gold, 0, 1.62, 0.12, body); m.rotation.x = 1.25; M(sphG(0.07, 8, 6), gold, 0, 1.42, 0.27, body); break;
    case 'cap': { const cm = toon(L.capColor ?? 0xff3355); M(boxG(0.68, 0.16, 0.64), cm, 0, 0.34, 0, head); M(boxG(0.6, 0.05, 0.3), cm, 0, 0.28, 0.42, head); break; }
    case 'headphones': M(boxG(0.74, 0.07, 0.1), black, 0, 0.38, 0, head); for (const s of [-1, 1]) { m = M(cylG(0.13, 0.13, 0.1, 10), toon(0xff33cc), s * 0.36, 0.02, 0, head); m.rotation.z = Math.PI / 2; } break;
    case 'mic': m = M(cylG(0.035, 0.03, 0.3, 6), black, 0, -0.82, 0.2, armR); m.rotation.x = Math.PI / 2; M(sphG(0.08, 8, 6), metal, 0, -0.82, 0.38, armR); break;
    case 'guitar': { const gm = toon(L.guitarColor ?? 0xd35400); const g = new THREE.Group(); g.position.set(0.05, 1.12, 0.3); g.rotation.z = -0.7; body.add(g); M(boxG(0.48, 0.6, 0.12), gm, 0, -0.15, 0, g); M(boxG(0.08, 0.75, 0.06), toon(0x3b2314), 0, 0.5, 0, g); M(cylG(0.08, 0.08, 0.13, 10), black, 0, -0.1, 0.01, g).rotation.x = Math.PI / 2; g.updateMatrixWorld(); bakeChildren(g, body); break; }
    case 'chefhat': M(cylG(0.28, 0.24, 0.35, 12), white, 0, 0.48, 0, head); M(sphG(0.33, 10, 8), white, 0, 0.72, 0, head); break;
    case 'tophat': M(cylG(0.48, 0.48, 0.04, 16), black, 0, 0.32, 0, head); M(cylG(0.3, 0.3, 0.55, 14), black, 0, 0.6, 0, head); M(cylG(0.305, 0.305, 0.08, 14), toon(0xd62828), 0, 0.4, 0, head); break;
    case 'cowboy': M(cylG(0.62, 0.62, 0.05, 16), toon(0x8b5a2b), 0, 0.33, 0, head); M(cylG(0.28, 0.34, 0.32, 12), toon(0x8b5a2b), 0, 0.5, 0, head); break;
    case 'tiara': M(boxG(0.6, 0.06, 0.08), gold, 0, 0.36, 0.2, head); for (let i = -2; i <= 2; i++) M(coneG(0.05, 0.16 - Math.abs(i) * 0.03, 5), gold, i * 0.12, 0.45, 0.2, head); M(sphG(0.05, 6, 4), toon(0xff3b9a), 0, 0.42, 0.25, head); break;
    case 'crown': M(cylG(0.3, 0.3, 0.18, 10), gold, 0, 0.46, 0, head); for (let i = 0; i < 6; i++) { const t = i / 6 * Math.PI * 2; M(coneG(0.07, 0.2, 5), gold, Math.cos(t) * 0.26, 0.64, Math.sin(t) * 0.26, head); } M(sphG(0.07, 6, 4), toon(0xff2255), 0, 0.46, 0.3, head); break;
    case 'helmet': m = M(sphG(0.58, 16, 12), glassMat, 0, 0.02, 0, head); m.userData.noMerge = true; m.renderOrder = 2; break;
    case 'cape': m = M(boxG(0.84, 1.35, 0.05), toon(L.capeColor ?? 0xc0392b), 0, 1.02, -0.28, body); m.rotation.x = 0.12; break;
    case 'wand': m = M(cylG(0.025, 0.025, 0.5, 6), black, 0, -0.84, 0.22, armL); m.rotation.x = Math.PI / 2; M(boxG(0.06, 0.06, 0.1), white, 0, -0.84, 0.48, armL); break;
    case 'phone': M(boxG(0.16, 0.28, 0.05), toon(0x222222), 0, -0.86, 0.14, armL); M(boxG(0.13, 0.22, 0.02), toon(0x66ddff), 0, -0.86, 0.17, armL); break;
    case 'dumbbell': m = M(cylG(0.03, 0.03, 0.5, 6), metal, 0, -0.84, 0.05, armR); m.rotation.z = Math.PI / 2; for (const s of [-1, 1]) { m = M(cylG(0.12, 0.12, 0.1, 8), black, s * 0.22, -0.84, 0.05, armR); m.rotation.z = Math.PI / 2; } break;
    case 'umbrella': M(cylG(0.02, 0.02, 1.5, 5), black, 0, -0.1, 0.1, armL); M(coneG(0.8, 0.35, 10), toon(L.umbColor ?? 0x3498db), 0, 0.72, 0.1, armL); break;
    case 'tie': M(boxG(0.11, 0.5, 0.03), toon(0xd62828), 0, 1.33, 0.24, body); break;
    case 'headband': M(boxG(0.68, 0.08, 0.62), white, 0, 0.2, 0, head); break;
    case 'bandana': M(boxG(0.68, 0.1, 0.62), toon(0xd62828), 0, 0.2, 0, head); break;
    case 'boa': m = M(torG(0.32, 0.1, 6, 14), toon(0xff7ad9), 0, 1.66, 0, body); m.rotation.x = Math.PI / 2; break;
    case 'pan': m = M(cylG(0.03, 0.03, 0.35, 6), black, 0, -0.84, 0.2, armR); m.rotation.x = Math.PI / 2; M(cylG(0.22, 0.2, 0.05, 12), toon(0x333333), 0, -0.84, 0.48, armR); break;
    case 'mustache': m = M(boxG(0.3, 0.07, 0.04), toon(0x3b2314), 0, -0.06, 0.305, head); m.userData.keep = true; break;
    case 'ball': M(sphG(0.24, 12, 8), toon(0xf57c00), 0, -0.9, 0.12, armR); break;
    case 'trophy': M(cylG(0.2, 0.08, 0.3, 10), gold, 0, -0.72, 0.15, armL); M(cylG(0.05, 0.05, 0.15, 6), gold, 0, -0.93, 0.15, armL); M(boxG(0.22, 0.08, 0.22), toon(0x3b2314), 0, -1.03, 0.15, armL); break;
    case 'camera': M(boxG(0.28, 0.2, 0.16), black, 0, -0.84, 0.16, armR); m = M(cylG(0.07, 0.07, 0.12, 10), metal, 0, -0.84, 0.3, armR); m.rotation.x = Math.PI / 2; break;
  }
}
// move a sub-group's meshes into its parent (so they get merged)
function bakeChildren(g, parent) {
  for (const ch of [...g.children]) {
    ch.updateMatrix();
    ch.matrix.premultiply(g.matrix);
    ch.matrix.decompose(ch.position, ch.quaternion, ch.scale);
    parent.add(ch);
  }
  parent.remove(g);
}
const _tc = new THREE.Color();
function mergeGroup(group, override, mat) {
  const meshes = group.children.filter((o) => o.isMesh && !o.userData.noMerge);
  if (!meshes.length) return;
  const parts = []; let total = 0;
  for (const m of meshes) {
    m.updateMatrix();
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrix);
    parts.push([g, m]); total += g.attributes.position.count;
  }
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), col = new Float32Array(total * 3);
  let o = 0;
  for (const [g, m] of parts) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
    if (override != null && !m.userData.keep) _tc.set(override); else _tc.copy(m.material.color);
    for (let i = 0; i < n; i++) { col[(o + i) * 3] = _tc.r; col[(o + i) * 3 + 1] = _tc.g; col[(o + i) * 3 + 2] = _tc.b; }
    o += n; g.dispose(); group.remove(m);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeBoundingSphere();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.merged = true;
  group.add(mesh);
}
function buildPerson(L, mut) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body);
  const mus = L.muscle ? 1.22 : 1;
  const skinM = toon(L.skin), topM = toon(L.top), botM = toon(L.bottom), shoeM = toon(L.shoes ?? 0x222222), hairM = toon(L.hair ?? 0x222222);
  const legL = new THREE.Group(), legR = new THREE.Group();
  legL.position.set(-0.19, 0.85, 0); legR.position.set(0.19, 0.85, 0); body.add(legL, legR);
  for (const lg of [legL, legR]) { M(boxG(0.3, 0.72, 0.32), botM, 0, -0.36, 0, lg); M(boxG(0.33, 0.17, 0.44), shoeM, 0, -0.77, 0.05, lg); }
  M(boxG(0.82 * mus, 0.86, 0.46), topM, 0, 1.27, 0, body);
  if (L.dress) M(coneG(0.6, 0.95, 12), topM, 0, 0.78, 0, body);
  const ax = 0.41 * mus + 0.14;
  const armL = new THREE.Group(), armR = new THREE.Group();
  armL.position.set(-ax, 1.63, 0); armR.position.set(ax, 1.63, 0); body.add(armL, armR);
  const aw = 0.24 * (L.muscle ? 1.35 : 1);
  for (const a of [armL, armR]) { M(boxG(aw, 0.42, 0.27), L.sleeveless ? skinM : topM, 0, -0.2, 0, a); M(boxG(aw * 0.92, 0.4, 0.25), skinM, 0, -0.6, 0, a); }
  const head = new THREE.Group(); head.position.set(0, 2.03, 0); body.add(head);
  M(boxG(0.64, 0.6, 0.58), skinM, 0, 0, 0, head);
  if (L.robot) {
    const v = M(boxG(0.54, 0.15, 0.05), toon(0x22fff0), 0, 0.04, 0.3, head); v.userData.keep = true;
    M(cylG(0.03, 0.03, 0.35, 6), toon(0x888888), 0, 0.45, 0, head);
    M(sphG(0.08, 8, 6), toon(0xff3355), 0, 0.65, 0, head);
    M(boxG(0.7, 0.12, 0.12), toon(0x777788), 0, -0.05, 0, head);
  } else {
    const eye = toon(0x111111);
    for (const s of [-1, 1]) { const e = M(boxG(0.09, 0.13, 0.03), eye, s * 0.14, 0.05, 0.295, head); e.userData.keep = true; const w = M(boxG(0.035, 0.04, 0.01), toon(0xffffff), s * 0.14 + 0.02, 0.09, 0.312, head); w.userData.keep = true; }
    const mo = M(boxG(0.2, 0.05, 0.03), toon(0x7a2230), 0, -0.14, 0.295, head); mo.userData.keep = true;
  }
  addHair(head, L.hairStyle, hairM);
  const P = { root, body, legL, legR, armL, armR, head };
  for (const a of L.acc || []) addAcc(a, P, L);
  // bake
  let override = null, mat = personMat;
  if (mut && mut.id === 1) { override = mut.hex; mat = goldMat; }
  else if (mut && mut.id === 2) { override = mut.hex; mat = diamondMat; }
  else if (mut && mut.id === 3) { override = 0xffffff; mat = rainbowMat; }
  for (const g of [legL, legR, armL, armR, head, body]) mergeGroup(g, override, mat);
  const sh = new THREE.Mesh(shadowGeo, shadowMat); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.03; root.add(sh);
  return P;
}
function animPerson(p, mode, ph, t) {
  const { legL, legR, armL, armR, body, head } = p;
  legL.rotation.set(0, 0, 0); legR.rotation.set(0, 0, 0); armL.rotation.set(0, 0, 0); armR.rotation.set(0, 0, 0);
  body.rotation.set(0, 0, 0); body.position.y = 0; head.rotation.set(0, 0, 0);
  switch (mode) {
    case 'walk': case 'run': case 'carry': {
      const a = mode === 'walk' ? 0.65 : 0.95; const s = Math.sin(ph);
      legL.rotation.x = s * a; legR.rotation.x = -s * a;
      if (mode === 'carry') { armL.rotation.z = -2.85; armR.rotation.z = 2.85; }
      else { armL.rotation.x = -s * a * 0.9; armR.rotation.x = s * a * 0.9; }
      body.position.y = Math.abs(Math.cos(ph)) * (mode === 'walk' ? 0.07 : 0.12);
      if (mode === 'run') body.rotation.x = 0.12;
      break;
    }
    case 'idle': body.position.y = Math.sin(t * 2 + ph) * 0.02; armL.rotation.z = -0.08; armR.rotation.z = 0.08; break;
    case 'dance0': { const k = t * 6 + ph; body.rotation.y = Math.sin(k * 0.5) * 0.35; body.position.y = Math.abs(Math.sin(k)) * 0.12; armL.rotation.z = -1.7 - Math.sin(k) * 0.8; armR.rotation.z = 1.7 + Math.sin(k) * 0.8; head.rotation.z = Math.sin(k) * 0.15; break; }
    case 'dance1': { const k = t * 5 + ph; armR.rotation.z = 2.5 + Math.sin(k * 1.6) * 0.35; armL.rotation.z = -0.35; armL.rotation.x = -0.4; head.rotation.y = 0.25; body.rotation.y = Math.sin(k * 0.4) * 0.2; body.position.y = Math.abs(Math.sin(k)) * 0.05; break; }
    case 'dance2': { const k = t * 4 + ph; body.rotation.z = Math.sin(k) * 0.12; armL.rotation.z = -1.2 + Math.sin(k) * 0.6; armR.rotation.z = 1.2 + Math.sin(k) * 0.6; legL.rotation.z = -Math.max(0, Math.sin(k)) * 0.3; legR.rotation.z = Math.max(0, -Math.sin(k)) * 0.3; head.rotation.z = -Math.sin(k) * 0.2; break; }
    case 'pose': armR.rotation.z = 2.7; armL.rotation.z = -0.45; head.rotation.y = 0.35; body.rotation.y = Math.sin(t * 3) * 0.12; break;
    case 'flail': armL.rotation.z = -2 + Math.sin(t * 20) * 0.6; armR.rotation.z = 2 + Math.cos(t * 20) * 0.6; legL.rotation.x = Math.sin(t * 18) * 0.6; legR.rotation.x = -Math.sin(t * 18) * 0.6; break;
    case 'stun': body.rotation.z = Math.sin(t * 8) * 0.15; head.rotation.y = Math.sin(t * 5) * 0.6; armL.rotation.z = -0.9; armR.rotation.z = 0.9; break;
  }
}

// ---------------------------------------------------------------------
//  World
// ---------------------------------------------------------------------
const walls = [];    // {minX,maxX,minZ,maxZ}
const circles = [];  // {x,z,r}
const bases = [];
const celebs = [];
const agents = [];
const bots = [];
let carpetTex;

function addWallBox(x0, x1, z0, z1, h, mat) {
  const minX = Math.min(x0, x1), maxX = Math.max(x0, x1), minZ = Math.min(z0, z1), maxZ = Math.max(z0, z1);
  M(boxG(+(maxX - minX).toFixed(2), h, +(maxZ - minZ).toFixed(2)), mat, (minX + maxX) / 2, h / 2, (minZ + maxZ) / 2, scene);
  walls.push({ minX, maxX, minZ, maxZ });
}
function buildWorld() {
  // ground
  const gc = document.createElement('canvas'); gc.width = gc.height = 256; const g = gc.getContext('2d');
  g.fillStyle = '#f0d3a8'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = 'rgba(160,110,80,.25)'; g.lineWidth = 3;
  for (let i = 0; i <= 256; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke(); }
  const gt = new THREE.CanvasTexture(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(40, 30); gt.colorSpace = THREE.SRGBColorSpace;
  gt.anisotropy = 4;
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(190, 150), new THREE.MeshToonMaterial({ map: gt, gradientMap: gradTex }));
  plaza.rotation.x = -Math.PI / 2; scene.add(plaza);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), toon(0x6fbf5a)); grass.rotation.x = -Math.PI / 2; grass.position.y = -0.05; scene.add(grass);

  // red carpet "conveyor"
  const cc = document.createElement('canvas'); cc.width = 128; cc.height = 128; const c = cc.getContext('2d');
  c.fillStyle = '#c8102e'; c.fillRect(0, 0, 128, 128);
  c.fillStyle = '#a50d26'; c.fillRect(0, 0, 128, 10); c.fillRect(0, 118, 128, 10);
  c.fillStyle = '#ffd34d'; c.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 11 : 26; c.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); }
  c.closePath(); c.fill();
  carpetTex = new THREE.CanvasTexture(cc); carpetTex.wrapS = carpetTex.wrapT = THREE.RepeatWrapping; carpetTex.repeat.set(21, 1); carpetTex.colorSpace = THREE.SRGBColorSpace;
  const carpet = new THREE.Mesh(new THREE.BoxGeometry(126, 0.08, 6), [toon(0xa50d26), toon(0xa50d26), new THREE.MeshToonMaterial({ map: carpetTex, gradientMap: gradTex }), toon(0xa50d26), toon(0xa50d26), toon(0xa50d26)]);
  carpet.position.set(0, 0.04, 0); scene.add(carpet);
  for (const s of [-1, 1]) M(boxG(126, 0.1, 0.25), toon(0xffcc33), 0, 0.05, s * 3.1, scene);

  // arches + limo
  const archDefs = [{ x: -64, t: 'ARRIVALS' }, { x: 64, t: 'VIP EXIT' }];
  for (const ad of archDefs) {
    for (const s of [-1, 1]) { M(cylG(0.45, 0.55, 7, 12), toon(0xffcc33), ad.x, 3.5, s * 4.2, scene); circles.push({ x: ad.x, z: s * 4.2, r: 0.6 }); }
    M(boxG(1.2, 1.2, 9.6), toon(0x7a1fa2), ad.x, 7.2, 0, scene);
    const sp = makeCanvasSprite(512, 128, 2.2); sp.ctx.textAlign = 'center'; sp.ctx.textBaseline = 'middle';
    strokeText(sp.ctx, '★ ' + ad.t + ' ★', 256, 64, 72, '#ffd84d', 500); sp.tex.needsUpdate = true;
    sp.sprite.position.set(ad.x, 8.8, 0); scene.add(sp.sprite);
  }
  const limo = new THREE.Group(); limo.position.set(-72, 0, 0); scene.add(limo);
  M(boxG(10, 1.1, 2.6), toon(0x111111), 0, 0.9, 0, limo); M(boxG(6.5, 0.8, 2.4), toon(0x222233), -0.5, 1.8, 0, limo);
  M(boxG(6.3, 0.5, 2.45), toon(0x66ccff), -0.5, 1.85, 0, limo);
  for (const x of [-3.5, 3.5]) for (const z of [-1.3, 1.3]) { const w = M(cylG(0.5, 0.5, 0.4, 12), toon(0x222222), x, 0.5, z, limo); w.rotation.x = Math.PI / 2; }
  walls.push({ minX: -77, maxX: -67, minZ: -1.4, maxZ: 1.4 });

  // stanchions & ropes near the ends
  for (const side of [-1, 1]) for (const zs of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const x = side * (51 + i * 3.3);
      M(cylG(0.08, 0.12, 1.1, 8), toon(0xffcc33), x, 0.55, zs * 3.6, scene); M(sphG(0.14, 8, 6), toon(0xffcc33), x, 1.15, zs * 3.6, scene);
      if (i < 3) M(boxG(3.3, 0.09, 0.09), toon(0xb3002d), x + side * 1.65, 0.92, zs * 3.6, scene);
    }
  }
  // paparazzi
  const papLook = { skin: 0xe0ac69, hair: 0x333333, hairStyle: 'short', top: 0x444455, bottom: 0x222233, acc: ['camera', 'cap'], capColor: 0x222222 };
  const flashTex = (() => { const fc = document.createElement('canvas'); fc.width = fc.height = 64; const x = fc.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,230,.8)'); gr.addColorStop(1, 'rgba(255,255,200,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(fc); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  game.flashTex = flashTex;
  for (const side of [-1, 1]) for (const zs of [-1, 1]) for (let i = 0; i < 3; i++) {
    const look = Object.assign({}, papLook, { skin: pick([0xe0ac69, 0xf1c27d, 0x8d5524, 0xffdbac]), top: pick([0x444455, 0x5a4a3a, 0x2f4f4f]) });
    const p = buildPerson(look); p.root.position.set(side * (52.5 + i * 3.4), 0, zs * 5.2); p.root.rotation.y = zs > 0 ? Math.PI : 0; scene.add(p.root);
    p.armR.rotation.x = -1.4;
    const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: flashTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    fl.scale.set(2.2, 2.2, 1); fl.position.set(p.root.position.x, 2.2, zs * 4.5); scene.add(fl);
    game.paps.push({ p, fl, t: rand(0, 3) });
    circles.push({ x: p.root.position.x, z: p.root.position.z, r: 0.5 });
  }

  // spotlights
  const beamGeo = new THREE.ConeGeometry(5, 70, 18, 1, true); beamGeo.translate(0, -35, 0); beamGeo.rotateX(Math.PI);
  const beamMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.09, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  for (const [x, z] of [[-68, -9], [-68, 9], [68, -9], [68, 9]]) {
    const b = new THREE.Mesh(beamGeo, beamMat); b.position.set(x, 0, z); scene.add(b);
    M(cylG(0.9, 1.2, 1, 12), toon(0x333333), x, 0.5, z, scene);
    game.beams.push({ m: b, ph: rand(0, 6) });
  }

  // skyline
  const wc = document.createElement('canvas'); wc.width = 64; wc.height = 128; const w = wc.getContext('2d');
  w.fillStyle = '#000'; w.fillRect(0, 0, 64, 128);
  for (let y = 4; y < 128; y += 10) for (let x = 4; x < 64; x += 10) { w.fillStyle = Math.random() < 0.55 ? `rgba(255,${200 + randi(0, 55)},${120 + randi(0, 80)},1)` : 'rgba(40,30,60,1)'; w.fillRect(x, y, 6, 6); }
  const winTex = new THREE.CanvasTexture(wc); winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping; winTex.repeat.set(2, 3); winTex.colorSpace = THREE.SRGBColorSpace;
  const bMat = new THREE.MeshLambertMaterial({ color: 0x4a3470, emissive: 0xffffff, emissiveMap: winTex, emissiveIntensity: 0.55 });
  for (let i = 0; i < 46; i++) {
    const a = (i / 46) * Math.PI * 2 + rand(-0.04, 0.04);
    const r = rand(118, 150), h = rand(18, 70), wd = rand(10, 18);
    const m = new THREE.Mesh(new THREE.BoxGeometry(wd, h, wd), bMat);
    m.position.set(Math.cos(a) * r * 1.15, h / 2, Math.sin(a) * r); m.rotation.y = -a; scene.add(m);
  }
  // hills + giant sign
  for (const [x, s] of [[-60, 70], [10, 90], [80, 60]]) { const h = M(sphG(1, 20, 12), toon(0x7a9a5a), x, -8, -175, scene); h.scale.set(s, 38, 40); }
  const sc = makeCanvasSprite(1024, 160, 16);
  sc.ctx.textAlign = 'center'; sc.ctx.textBaseline = 'middle'; sc.ctx.font = `900 130px ${FONT}`; sc.ctx.fillStyle = '#ffffff';
  sc.ctx.fillText('STARVILLE', 512, 84); sc.tex.needsUpdate = true;
  const signMesh = new THREE.Mesh(new THREE.PlaneGeometry(105, 16.4), new THREE.MeshBasicMaterial({ map: sc.tex, transparent: true, fog: false }));
  signMesh.position.set(10, 24, -128); scene.add(signMesh);

  // palm trees
  for (const [x, z] of [[-19, 26], [19, 26], [-19, -26], [19, -26], [-58, 26], [58, 26], [-58, -26], [58, -26], [-80, 10], [80, -10], [-80, -12], [80, 12]]) palm(x, z);
}
function palm(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
  for (let i = 0; i < 5; i++) M(cylG(0.32 - i * 0.03, 0.36 - i * 0.03, 1.3, 8), toon(i % 2 ? 0x8b5a2b : 0x7a4b22), Math.sin(i * 0.4) * 0.2 * i, 0.65 + i * 1.25, 0, g);
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * Math.PI * 2; const l = new THREE.Group(); l.position.set(0.8, 6.4, 0); l.rotation.y = a; g.add(l);
    const leaf = M(boxG(3.4, 0.08, 0.9), toon(i % 2 ? 0x2e9e4a : 0x3fbf5a), 1.6, -0.3, 0, l); leaf.rotation.z = -0.35;
  }
  circles.push({ x: x, z: z, r: 0.55 });
}

// ---------------------------------------------------------------------
//  Bases ("agencies")
// ---------------------------------------------------------------------
const laserMat = new THREE.MeshBasicMaterial({ color: 0xff2a6d, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const laserBarMat = new THREE.MeshBasicMaterial({ color: 0xff7aa8, transparent: true, opacity: 0.9 });
// ---------- realistic agency HQ ----------
const glassMat2 = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradTex, transparent: true, opacity: 0.3, depthWrite: false });
const spotMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.03, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const buildings = [];
let marbleTex, officeTex;
function makeAgencyTextures() {
  const mc = document.createElement('canvas'); mc.width = mc.height = 256; const m = mc.getContext('2d');
  m.fillStyle = '#f4f1f6'; m.fillRect(0, 0, 256, 256);
  for (let k = 0; k < 14; k++) { m.strokeStyle = `rgba(150,140,170,${rand(0.08, 0.2)})`; m.lineWidth = rand(0.6, 2); m.beginPath(); let x = rand(0, 256), y = rand(0, 256); m.moveTo(x, y); for (let q = 0; q < 6; q++) { x += rand(-50, 50); y += rand(-50, 50); m.lineTo(x, y); } m.stroke(); }
  m.strokeStyle = 'rgba(120,110,140,.35)'; m.lineWidth = 2; m.strokeRect(1, 1, 127, 127); m.strokeRect(129, 1, 126, 127); m.strokeRect(1, 129, 127, 126); m.strokeRect(129, 129, 126, 126);
  marbleTex = new THREE.CanvasTexture(mc); marbleTex.wrapS = marbleTex.wrapT = THREE.RepeatWrapping; marbleTex.repeat.set(5, 4); marbleTex.colorSpace = THREE.SRGBColorSpace; marbleTex.anisotropy = 4;
  const oc = document.createElement('canvas'); oc.width = oc.height = 128; const o = oc.getContext('2d');
  o.fillStyle = '#000'; o.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) { const lit = Math.random() < 0.7; o.fillStyle = lit ? `rgb(${randi(200, 255)},${randi(210, 240)},${randi(150, 210)})` : '#2a3550'; o.fillRect(x * 32 + 4, y * 64 + 10, 24, 44); }
  officeTex = new THREE.CanvasTexture(oc); officeTex.wrapS = officeTex.wrapT = THREE.RepeatWrapping; officeTex.repeat.set(6, 2); officeTex.colorSpace = THREE.SRGBColorSpace;
}
function buildAgencyInterior(b, col) {
  if (!marbleTex) makeAgencyTextures();
  const deco = new THREE.Group(), glass = new THREE.Group(), spots = new THREE.Group();
  scene.add(deco, glass, spots);
  const L = (geo, mat, lx, y, lz, grp = deco) => { const p = b.local(lx, lz); return M(geo, mat, p.x, y, p.z, grp); };
  const box = (x0, x1, z0, z1) => { const a = b.local(x0, z0), c = b.local(x1, z1); return { minX: Math.min(a.x, c.x), maxX: Math.max(a.x, c.x), minZ: Math.min(a.z, c.z), maxZ: Math.max(a.z, c.z) }; };
  const solid = toon(lighten(col, 0.6)), accent = toon(col), dark = toon(darken(col, 0.35)), chrome = toon(0xd8dde6), gold = toon(0xffcc33);
  const white = toon(0xfafafa), glassC = toon(0xaee4ff), wood = toon(0x8a5a3b), green = toon(0x3c9a4a), black = toon(0x222222);
  // marble floor
  M(boxG(b.W, 0.12, b.D), new THREE.MeshToonMaterial({ map: marbleTex, color: lighten(col, 0.85), gradientMap: gradTex }), b.cx, 0.06, b.cz, scene);
  L(boxG(3, 0.02, 4.6), toon(0xb3002d), 0, 0.13, 5.8);                // entrance runner
  L(boxG(19.5, 0.02, 0.2), accent, 0, 0.13, -2.9); L(boxG(19.5, 0.02, 0.2), accent, 0, 0.13, -7.2); // stage lane inlays
  // glass office walls: low solid base, glass panes, chrome rail and mullions
  const glassWall = (x0, x1, z0, z1) => {
    const bx = box(x0, x1, z0, z1); walls.push(bx);
    const w = bx.maxX - bx.minX, d = bx.maxZ - bx.minZ, mx = (bx.minX + bx.maxX) / 2, mz = (bx.minZ + bx.maxZ) / 2;
    M(boxG(+w.toFixed(2), 0.9, +d.toFixed(2)), solid, mx, 0.45, mz, deco);
    M(boxG(+(w + 0.04).toFixed(2), 0.1, +(d + 0.04).toFixed(2)), chrome, mx, 2.5, mz, deco);
    M(boxG(+(w * 0.995).toFixed(2), 1.5, +(d * 0.4).toFixed(2)), glassC, mx, 1.7, mz, glass);
    const long = w > d ? w : d, n = Math.max(1, Math.round(long / 2.6));
    for (let k = 0; k <= n; k++) { const t = -long / 2 + k * long / n; M(boxG(w > d ? 0.09 : +(w + 0.03).toFixed(2), 1.6, w > d ? +(d + 0.03).toFixed(2) : 0.09), chrome, w > d ? mx + t : mx, 1.7, w > d ? mz : mz + t, deco); }
  };
  glassWall(-11.3, -10.7, -8.3, 8.3); glassWall(10.7, 11.3, -8.3, 8.3); glassWall(-11, -3.4, 7.7, 8.3); glassWall(3.4, 11, 7.7, 8.3);
  // office tower behind the stage wall (fades when it blocks the camera)
  walls.push(box(-11.3, 11.3, -13.6, -7.7));
  const tMat = new THREE.MeshLambertMaterial({ color: 0x9aa3ba, emissive: 0xffffff, emissiveMap: officeTex, emissiveIntensity: 0.55, transparent: true });
  const bMat = new THREE.MeshLambertMaterial({ color: col, transparent: true });
  const tp = b.local(0, -10.95), tower = new THREE.Group(); scene.add(tower);
  M(boxG(22.6, 7, 5.3), tMat, tp.x, 3.5, tp.z, tower); M(boxG(23, 0.7, 5.7), bMat, tp.x, 7.2, tp.z, tower); M(boxG(23, 0.4, 5.7), bMat, tp.x, 0.2, tp.z, tower);
  for (const ax of [-7, 6]) { const a = b.local(ax, -11.5); M(boxG(2, 1, 1.6), new THREE.MeshLambertMaterial({ color: 0xb8bcc6, transparent: true }), a.x, 8.05, a.z, tower); }
  b.towerEntry = { g: tower, mats: [tMat, bMat, ...tower.children.slice(3).map((m) => m.material)], box: { ...box(-11.5, 11.5, -13.7, -8.2), maxY: 8.6 }, a: 1 }; buildings.push(b.towerEntry);
  // interior stage wall + framed posters
  L(boxG(22, 2.7, 0.25), solid, 0, 1.35, -8.12);
  L(boxG(22, 0.12, 0.3), accent, 0, 2.75, -8.1);
  const posterCols = [0xff4fa3, 0xffcc00, 0x2ee6d6, 0x9b5de5, 0xff7a3d];
  [-9.6, -5, 0, 5, 9.6].forEach((x, k) => { L(boxG(1.7, 2, 0.08), black, x, 1.55, -7.95); L(boxG(1.45, 1.75, 0.05), toon(posterCols[(k + b.i) % 5]), x, 1.55, -7.9); L(cylG(0.32, 0.32, 0.04, 5), gold, x, 1.7, -7.86).rotation.x = Math.PI / 2; });
  // star plaques
  for (const rz of [-5, -1]) for (const sx of [-7.5, -2.5, 2.5, 7.5]) L(cylG(0.34, 0.34, 0.02, 5), gold, sx, 0.14, rz + 1.55);
  // reception desk + receptionist
  walls.push(box(6.6, 9.9, 4.3, 5.3));
  L(boxG(3.3, 1.05, 1), white, 8.25, 0.55, 4.8); L(boxG(3.32, 0.75, 0.04), accent, 8.25, 0.55, 5.31); L(boxG(3.5, 0.08, 1.15), dark, 8.25, 1.1, 4.8);
  L(boxG(0.7, 0.45, 0.06), black, 7.6, 1.4, 4.55); L(boxG(0.6, 0.36, 0.02), toon(0x66ccff), 7.6, 1.4, 4.59);
  const rc = b.local(8.4, 3.7); circles.push({ x: rc.x, z: rc.z, r: 0.4 });
  const rec = buildPerson({ skin: pick([0xf1c27d, 0xc68642, 0xffdbac, 0x8d5524]), hair: 0x2b1d0e, hairStyle: pick(['bun', 'short', 'ponytail']), top: lighten(col, 0.2), bottom: 0x222233, shoes: 0x111111, acc: ['phone'] });
  rec.root.position.set(rc.x, 0.12, rc.z); rec.root.rotation.y = b.f > 0 ? 0 : Math.PI; scene.add(rec.root); b.receptionist = rec;
  // lounge: sofa + coffee table + rug
  walls.push(box(-10.5, -9.2, 2.2, 4.6));
  L(boxG(2.8, 0.02, 3.2), toon(lighten(col, 0.35)), -8.9, 0.13, 3.4);
  L(boxG(1.2, 0.5, 2.4), accent, -9.85, 0.4, 3.4); L(boxG(0.35, 1, 2.4), accent, -10.35, 0.65, 3.4);
  for (const z of [2.1, 4.7]) L(boxG(1.2, 0.75, 0.3), dark, -9.85, 0.5, z);
  L(boxG(0.8, 0.08, 1.2), glassC, -8.2, 0.55, 3.4); for (const z of [2.95, 3.85]) L(boxG(0.06, 0.4, 0.06), chrome, -8.2, 0.33, z);
  // potted plants
  for (const [px, pz] of [[-10.1, -7.2], [10.1, 7.1]]) {
    const pp = b.local(px, pz); circles.push({ x: pp.x, z: pp.z, r: 0.5 });
    L(cylG(0.42, 0.32, 0.7, 10), wood, px, 0.45, pz); L(sphG(0.62, 10, 8), green, px, 1.35, pz); L(sphG(0.42, 8, 6), toon(0x4fb85c), px, 1.85, pz);
  }
  // entrance: chrome door frame, canopy, velvet ropes
  for (const s of [-1, 1]) { const p = b.local(s * 3.4, 8); circles.push({ x: p.x, z: p.z, r: 0.4 }); L(boxG(0.5, 3, 0.6), chrome, s * 3.4, 1.5, 8); L(cylG(0.09, 0.09, 3.3, 8), chrome, s * 3.9, 1.65, 10.9); const q = b.local(s * 3.9, 10.9); circles.push({ x: q.x, z: q.z, r: 0.2 }); }
  L(boxG(8.6, 0.12, 3.6), chrome, 0, 3.3, 9.5); L(boxG(8.4, 0.32, 3.4), accent, 0, 3.52, 9.5);
  for (const lx of [-2.5, 0, 2.5]) L(boxG(0.8, 0.04, 0.3), toon(0xfff6d0), lx, 3.24, 9.8);
  for (const s of [-1, 1]) { for (const zz of [8.8, 10.6]) { L(cylG(0.06, 0.09, 1, 8), gold, s * 4.8, 0.5, zz); L(sphG(0.11, 6, 4), gold, s * 4.8, 1.05, zz); } L(boxG(0.08, 0.08, 1.8), toon(0xb3002d), s * 4.8, 0.85, 9.7); }
  mergeGroup(deco, null, b.owner.isPlayer ? playerDecoMat : personMat); mergeGroup(glass, null, glassMat2); mergeGroup(spots, null, spotMat);
}
const _ray = new THREE.Vector3();
function segHitsBox(a, c, bx) {
  let t0 = 0, t1 = 1;
  for (const [o, d, mn, mx] of [[a.x, c.x - a.x, bx.minX, bx.maxX], [a.y, c.y - a.y, 0, bx.maxY], [a.z, c.z - a.z, bx.minZ, bx.maxZ]]) {
    if (Math.abs(d) < 1e-6) { if (o < mn || o > mx) return false; continue; }
    let u = (mn - o) / d, v = (mx - o) / d; if (u > v) [u, v] = [v, u];
    t0 = Math.max(t0, u); t1 = Math.min(t1, v); if (t0 > t1) return false;
  }
  return true;
}
function updateBuildingFade(dt) {
  for (const bd of buildings) {
    if (bd.off) { bd.g.visible = false; continue; }
    const hit = game.playing && segHitsBox(camera.position, camTarget, bd.box);
    bd.a += ((hit ? 0 : 1) - bd.a) * Math.min(1, dt * 10);
    bd.g.visible = bd.a > 0.04;
    for (const m of bd.mats) { m.opacity = bd.a; m.depthWrite = bd.a > 0.95; }
  }
}
function makeBase(i, def, owner) {
  const W = 22, D = 16, H = 2.4;
  const { x: cx, z: cz, f } = def;
  const b = { i, cx, cz, f, W, D, owner, locked: false, lockT: 0, lockCd: 0, slots: [], signKey: '' };
  b.local = (lx, lz) => ({ x: cx + lx, z: cz + f * lz });
  owner.base = b;
  const col = owner.color;
  buildAgencyInterior(b, col);
  const dz = b.local(0, 8).z;
  // sign over the entrance canopy + a big one on the roof (same texture)
  b.sign = makeCanvasSprite(512, 160, 2.0); const sp = b.local(0, 10.9); b.sign.sprite.position.set(sp.x, 4.6, sp.z); scene.add(b.sign.sprite);
  const roof = new THREE.Sprite(b.sign.sprite.material); roof.scale.set(9.6, 3, 1); const rp = b.local(0, -10.9); roof.position.set(rp.x, 9.2, rp.z); scene.add(roof); b.roofSign = roof;
  // laser
  b.laser = new THREE.Group(); b.laser.position.set(cx, 0, dz); scene.add(b.laser); b.laser.visible = false;
  M(boxG(6.8, 2.5, 0.1), laserMat, 0, 1.3, 0, b.laser);
  for (let k = 0; k < 5; k++) M(boxG(6.8, 0.06, 0.08), laserBarMat, 0, 0.35 + k * 0.5, 0, b.laser);
  b.doorBox = { minX: cx - 3.4, maxX: cx + 3.4, minZ: dz - 0.35, maxZ: dz + 0.35 };
  b.doorOut = b.local(0, 10.5); b.doorIn = b.local(0, 5.5);
  // podiums
  const rows = [-5, -1], xs = [-7.5, -2.5, 2.5, 7.5];
  let idx = 0;
  for (const rz of rows) for (const sx of xs) {
    const wp = b.local(sx, rz);
    const podium = M(cylG(1, 1.08, 0.7, 20), toon(0xf4f0ff), wp.x, 0.47, wp.z, scene);
    const ring = M(torG(0.92, 0.08, 6, 24), new THREE.MeshBasicMaterial({ color: 0x777777 }), wp.x, 0.84, wp.z, scene); ring.rotation.x = -Math.PI / 2;
    circles.push({ x: wp.x, z: wp.z, r: 1.02 });
    let approach;
    if (rz === -1) approach = [b.local(sx, 0.75)];
    else { const gx = sx < 0 ? -5 : 5; approach = [b.local(gx, 1.4), b.local(gx, -3), b.local(sx, -3)]; }
    const slot = { base: b, idx: idx++, floor: 0, pos: wp, celeb: null, podium, ring, approach, label: null, labelKey: '' };
    if (owner.isPlayer) {
      slot.label = makeCanvasSprite(256, 80, 0.75);
      const lp = b.local(sx, rz + 1.25); slot.label.sprite.position.set(lp.x, 1.35, lp.z); scene.add(slot.label.sprite); slot.label.sprite.visible = false;
    }
    b.slots.push(slot);
  }
  // lock pad
  b.pad = b.local(-9.1, 6.2);
  M(cylG(0.85, 0.9, 0.1, 18), toon(0xff2a6d), b.pad.x, 0.17, b.pad.z, scene);
  M(torG(0.85, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }), b.pad.x, 0.24, b.pad.z, scene).rotation.x = -Math.PI / 2;
  const pl = labelSprite('lockPad', null, '#ff9ec4', 256, 80, 0.7, 44); pl.position.set(b.pad.x, 1.2, b.pad.z); scene.add(pl);
  if (owner.isPlayer) {
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 60, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0x2ee6d6, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
    const bp = b.local(0, -7.2); beam.position.set(bp.x, 30, bp.z); scene.add(beam); game.beacon = beam;
    buildUpperFloors(b, col);
  }
  drawSign(b);
  bases.push(b);
  return b;
}
// ---------- upper floors (player agency, unlocked by rebirth) ----------
const i18nSprites = [];
function labelSprite(key, vars, color, w = 256, h = 80, worldH = 0.75, size = 40) {
  const s = makeCanvasSprite(w, h, worldH);
  const draw = () => { s.ctx.clearRect(0, 0, w, h); s.ctx.textAlign = 'center'; s.ctx.textBaseline = 'middle'; strokeText(s.ctx, tr(key, vars), w / 2, h / 2 + 2, size, color, w - 16); s.tex.needsUpdate = true; };
  draw(); i18nSprites.push(draw); return s.sprite;
}
function padSprite(key, vars, color) { return labelSprite(key, vars, color); }
function elevPad(b, at, y, color, label, labelColor, parent) {
  const g = new THREE.Group(); g.position.set(at.x, y, at.z); parent.add(g);
  M(cylG(0.85, 0.9, 0.1, 18), toon(color), 0, 0.05, 0, g);
  M(torG(0.85, 0.06, 6, 20), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 0.12, 0, g).rotation.x = -Math.PI / 2;
  const sp = padSprite(label[0], label[1], labelColor); sp.position.y = 1.15; g.add(sp);
  return g;
}
function buildUpperFloors(b, col) {
  const L = (lx, lz) => b.local(lx, lz);
  b.elev = L(9.6, -6.6); b.elevDown = L(9.6, -2.3); b.lane = L(9.9, -3); b.laneFront = L(9.9, 0.75);
  b.floors = [];
  b.groundUp = elevPad(b, b.elev, 0.12, 0x22c55e, ['upTo', { n: 2 }], '#9dffb8', scene);
  const tubeMat = new THREE.MeshBasicMaterial({ color: 0xaee4ff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  b.stair0 = buildStairs(b, 0); scene.add(b.stair0);
  addStairColliders(b);
  b.tube = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 1, 16, 1, true), tubeMat); b.tube.position.set(b.elev.x, 0, b.elev.z); scene.add(b.tube);
  const floorMat = new THREE.MeshToonMaterial({ map: marbleTex, color: lighten(col, 0.85), gradientMap: gradTex });
  const rows = [-5, -1], xs = [-7.5, -2.5, 2.5, 7.5];
  for (let n = 1; n <= 4; n++) {
    const y0 = n * FH, g = new THREE.Group(); scene.add(g);
    const deco = new THREE.Group(), glass = new THREE.Group(); g.add(deco, glass);
    M(boxG(22.6, 0.3, 16.6), floorMat, b.cx, y0 - 0.03, b.cz, g);
    M(boxG(22.8, 0.22, 16.8), toon(col), b.cx, y0 - 0.28, b.cz, deco);
    const rail = (x0, x1, z0, z1) => {
      const a = L(x0, z0), c = L(x1, z1);
      const bx = { minX: Math.min(a.x, c.x), maxX: Math.max(a.x, c.x), minZ: Math.min(a.z, c.z), maxZ: Math.max(a.z, c.z), floor: n };
      walls.push(bx);
      const w = bx.maxX - bx.minX, d = bx.maxZ - bx.minZ, mx = (bx.minX + bx.maxX) / 2, mz = (bx.minZ + bx.maxZ) / 2;
      M(boxG(+w.toFixed(2), 1.05, +(d * 0.4).toFixed(2)), toon(0xaee4ff), mx, y0 + 0.65, mz, glass);
      M(boxG(+(w + 0.04).toFixed(2), 0.1, +(d + 0.04).toFixed(2)), toon(0xd8dde6), mx, y0 + 1.2, mz, deco);
      M(boxG(+(w + 0.04).toFixed(2), 0.14, +(d + 0.04).toFixed(2)), toon(lighten(col, 0.5)), mx, y0 + 0.19, mz, deco);
    };
    rail(-11.3, 11.3, -8.3, -7.9); rail(-11.3, 11.3, 7.9, 8.3); rail(-11.3, -10.9, -8.3, 8.3); rail(10.9, 11.3, -8.3, 8.3);
    for (const [px, pz] of [[-11.1, -8.1], [11.1, -8.1], [-11.1, 8.1], [11.1, 8.1], [0, -8.1]]) { const p = L(px, pz); M(cylG(0.22, 0.22, FH, 10), toon(0xd8dde6), p.x, y0 - FH / 2, p.z, deco); }
    // podiums
    let k = 0;
    for (const rz of rows) for (const sx of xs) {
      const wp = L(sx, rz);
      const podium = M(cylG(1, 1.08, 0.7, 20), toon(0xf4f0ff), wp.x, y0 + 0.47, wp.z, g);
      const ring = M(torG(0.92, 0.08, 6, 24), new THREE.MeshBasicMaterial({ color: 0x777777 }), wp.x, y0 + 0.84, wp.z, g); ring.rotation.x = -Math.PI / 2;
      M(cylG(0.34, 0.34, 0.02, 5), toon(0xffcc33), L(sx, rz + 1.55).x, y0 + 0.14, L(sx, rz + 1.55).z, deco);
      circles.push({ x: wp.x, z: wp.z, r: 1.02, floor: n });
      const approach = rz === -1 ? [b.lane, b.laneFront, L(sx, 0.75)] : [b.lane, L(sx, -3)];
      const label = makeCanvasSprite(256, 80, 0.75); const lp = L(sx, rz + 1.25); label.sprite.position.set(lp.x, y0 + 1.35, lp.z); label.sprite.visible = false; g.add(label.sprite);
      b.slots.push({ base: b, idx: 8 * n + k++, floor: n, pos: wp, celeb: null, podium, ring, approach, label, labelKey: '' });
    }
    // elevator pads
    const up = n < 4 ? elevPad(b, b.elev, y0 + 0.12, 0x22c55e, ['upTo', { n: n + 2 }], '#9dffb8', g) : null;
    elevPad(b, b.elevDown, y0 + 0.12, 0xff9d00, ['downTo', { n }], '#ffd59a', g);
    // floor name
    const fsp = labelSprite('floorN', { n: n + 1 }, '#' + new THREE.Color(col).getHexString(), 512, 128, 1.6, 76);
    const fp = L(0, 8.4); fsp.position.set(fp.x, y0 + 2.1, fp.z); g.add(fsp);
    mergeGroup(deco, null, playerDecoMat); mergeGroup(glass, null, glassMat2);
    const sg = buildStairs(b, n); g.add(sg);
    b.floors.push({ n, g, up, sg });
  }
  refreshFloors(b);
}
function refreshFloors(b = player && player.base) {
  if (!b || !b.floors) return;
  const u = floorsUnlocked();
  game.fu = u;
  for (const f of b.floors) { f.unlocked = f.n <= u; if (f.up) f.up.visible = f.n + 1 <= u; f.sg.visible = f.n + 1 <= u; }
  b.stair0.visible = u >= 1;
  b.groundUp.visible = u > 0;
  if (b.towerEntry) b.towerEntry.off = u > 0;
  if (b.roofSign) { const rp = b.local(0, u > 0 ? -2 : -10.9); b.roofSign.position.set(rp.x, u > 0 ? u * FH + 4.2 : 9.2, rp.z); }
  b.tube.visible = u > 0; b.tube.scale.y = u * FH + 1.2; b.tube.position.y = (u * FH + 1.2) / 2;
}
function floorOf(o) { return o.floor || 0; }
function updateFloorVisibility() {
  const b = player.base; if (!b.floors) return;
  const home = game.playing && inside(b, player.pos.x, player.pos.z);
  const shown = home ? player.floor : 4;
  for (const f of b.floors) f.g.visible = f.unlocked && f.n <= shown;
  for (const a of agents) a.p.root.visible = floorOf(a) <= shown || !inside(b, a.pos.x, a.pos.z);
  for (const c of celebs) {
    const fl = c.state === 'placed' ? c.slot.floor : c.state === 'carried' ? floorOf(c.carrier) : c.state === 'moving' ? floorOf(player) : floorOf(c);
    c.p.root.visible = fl <= shown;
  }
}
function elevFx(a, fl) {
  burst(a.pos.x, fl * FH + 1, a.pos.z, 18, [0x9dffb8, 0xffffff], 3, 4);
  if (a.isPlayer) { Snd.play('pop'); floatText(tr('floorN', { n: fl + 1 }), a.pos.x, fl * FH + 3.4, a.pos.z, '#9dffb8'); }
}
function updatePlayerElevator() {
  const P = player, b = P.base; if (!b.floors) return;
  const u = floorsUnlocked(), fl = P.floor || 0;
  const onUp = hdist(P.pos, b.elev) < 0.9, onDown = fl > 0 && hdist(P.pos, b.elevDown) < 0.9;
  if (!onUp && !onDown) { P.padLock = false; return; }
  if (P.padLock || !inside(b, P.pos.x, P.pos.z)) return;
  if (onUp && fl < u) { P.floor = fl + 1; P.padLock = true; elevFx(P, P.floor); mission('floor'); if (game.tut >= 4 && !game.floorTip) { game.floorTip = true; feed(tr('floorTip')); } }
  else if (onUp && fl >= u && u < 4) { if (!P.padTip) { P.padTip = true; floatText(tr('floorLocked', { r: FLOOR_REBIRTH[u], n: u + 2 }), P.pos.x, fl * FH + 3.4, P.pos.z, '#ff9ec4'); } P.padLock = true; }
  else if (onDown) { P.floor = fl - 1; P.padLock = true; P.pos.x = b.elevDown.x; P.pos.z = b.elevDown.z; elevFx(P, P.floor); }
}
function drawSign(b) {
  const lockTxt = b.locked ? tr('lockedSign', { s: Math.ceil(b.lockT) }) : '';
  const key = lockTxt + getLang();
  if (key === b.signKey) return; b.signKey = key;
  const { ctx, tex } = b.sign; ctx.clearRect(0, 0, 512, 160); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const name = b.owner.isPlayer ? tr('yourAgency') : b.owner.name.toUpperCase();
  strokeText(ctx, name, 256, 52, 64, '#' + new THREE.Color(b.owner.color).getHexString(), 490);
  if (lockTxt) strokeText(ctx, lockTxt, 256, 118, 44, '#ff5c8d', 490);
  else if (!b.owner.isPlayer) strokeText(ctx, tr('talentAgency'), 256, 118, 32, '#ffffff', 490);
  else strokeText(ctx, tr('home'), 256, 118, 36, '#ffffff', 490);
  tex.needsUpdate = true;
}
const inside = (b, x, z) => Math.abs(x - b.cx) < b.W / 2 && Math.abs(z - b.cz) < b.D / 2;
const baseAt = (x, z) => { for (const b of bases) if (inside(b, x, z)) return b; return null; };
const unlockedSlots = (a) => a.isPlayer ? Math.min(8, 4 + game.up.slots + rebirthSlots()) : 8;
// ---------- Rebirth ----------
const REBIRTHS = [
  { cash: 25e3, tier: 2 }, { cash: 150e3, tier: 2 }, { cash: 750e3, tier: 3 }, { cash: 3e6, tier: 3 }, { cash: 12e6, tier: 4 },
  { cash: 50e6, tier: 4 }, { cash: 200e6, tier: 4 }, { cash: 800e6, tier: 5 }, { cash: 3e9, tier: 5 }, { cash: 12e9, tier: 5 },
];
const FH = 4.6;                          // height of one agency floor
const FLOOR_REBIRTH = [1, 3, 6, 9];      // rebirth needed for Floor 2, 3, 4, 5
const floorsUnlocked = (r = game.rebirth) => FLOOR_REBIRTH.filter((x) => r >= x).length;
const slotY = (slot) => slot.floor * FH + 0.82;
const rebirthMult = (r = game.rebirth) => 1 + 0.5 * r;
const rebirthSlots = (r = game.rebirth) => Math.min(4, Math.floor((r + 1) / 2));
const rebirthStartCash = (r = game.rebirth) => r ? Math.min(50000, 250 * Math.pow(4, r)) : 100;
const rebirthSpeed = (r = game.rebirth) => 1 + 0.03 * r;
function rebirthStatus() {
  const r = game.rebirth, req = REBIRTHS[r]; if (!req) return { max: true };
  const hasCash = player.cash >= req.cash;
  const hasTier = celebs.some((c) => c.owner === player && c.def.r >= req.tier && (c.state === 'placed' || c.state === 'walkToBase'));
  return { req, hasCash, hasTier, ok: hasCash && hasTier };
}
function renderRebirth() {
  const r = game.rebirth, st = rebirthStatus(), box = document.getElementById('rebirthBody'), sure = game.rebirthConfirm;
  if (st.max) {
    const ps = prestigeStatus(), p = game.prestige;
    box.innerHTML = `<p class="rb-big stroke">${tr('rbMax')}</p>
      <h4>${tr('pTitle')} ${p ? '• ' + tr('pLevel', { n: p }) + ' (' + prestigeTitle(p) + ')' : ''}</h4>
      <div class="rb-warn" style="background:rgba(255,204,0,.12)">${tr('pDesc')}</div>
      <h4>${tr('rbNeed')}</h4>
      <div class="rb-req ${ps.hasCash ? 'ok' : ''}">${ps.hasCash ? '✅' : '❌'} ${tr('rbCash', { x: fmt(prestigeCash()) })} <small>${tr('rbHave', { x: fmt(player.cash) })}</small></div>
      <div class="rb-req ${ps.hasEx ? 'ok' : ''}">${ps.hasEx ? '✅' : '❌'} ${tr('pOwnEx')}</div>
      <h4>${tr('rbGet')}</h4>
      <div class="rb-rew">💰 ${tr('rbIncome')} <b>x${prestigeMult()} → x${prestigeMult(p + 1)}</b></div>
      <div class="rb-rew">🏆 <b>${tr('pNext', { title: prestigeTitle(p + 1) })}</b></div>
      ${p === 0 ? '<div class="rb-rew">✨ <b>Golden agency</b></div>' : ''}
      <h4 class="warn">${tr('rbLose')}</h4><div class="rb-warn">${tr('rbLoseTxt')}</div>
      <button id="rbGo" data-prestige="1" class="stroke ${ps.ok ? (sure ? 'sure' : '') : 'no'}">${!ps.ok ? tr('rbNotReady') : sure ? tr('rbSure') : tr('pGo')}</button>`;
    return;
  }
  const tt = RARITIES[st.req.tier];
  box.innerHTML = `
    <div class="rb-row"><div class="rb-lvl stroke">♻️ ${r}</div><div class="rb-arrow">→</div><div class="rb-lvl next stroke">♻️ ${r + 1}</div></div>
    <h4>${tr('rbNeed')}</h4>
    <div class="rb-req ${st.hasCash ? 'ok' : ''}">${st.hasCash ? '✅' : '❌'} ${tr('rbCash', { x: fmt(st.req.cash) })} <small>${tr('rbHave', { x: fmt(player.cash) })}</small></div>
    <div class="rb-req ${st.hasTier ? 'ok' : ''}">${st.hasTier ? '✅' : '❌'} ${tr('rbOwn', { r: `<b style="color:${rColor(st.req.tier)}">${tr('r' + st.req.tier)}</b>` })}</div>
    <h4>${tr('rbGet')}</h4>
    <div class="rb-rew">💰 ${tr('rbIncome')} <b>x${rebirthMult(r)} → x${rebirthMult(r + 1)}</b></div>
    <div class="rb-rew">💵 ${tr('rbStart')} <b>$${fmt(rebirthStartCash(r + 1))}</b></div>
    <div class="rb-rew">👟 ${tr('rbSpeed')} <b>+${Math.round((rebirthSpeed(r + 1) - 1) * 100)}%</b></div>
    ${floorsUnlocked(r + 1) > floorsUnlocked(r) ? `<div class="rb-rew">🛗 <b>${tr('rbFloor', { n: floorsUnlocked(r + 1) + 1 })}</b></div>` : ''}
    ${rebirthSlots(r + 1) > rebirthSlots(r) ? `<div class="rb-rew">🏢 <b>${tr('rbPodium')}</b></div>` : ''}
    <div class="rb-rew">🏷️ ${tr('rbBadge', { n: r + 1 })}</div>
    <h4 class="warn">${tr('rbLose')}</h4>
    <div class="rb-warn">${tr('rbLoseTxt')}</div>
    <button id="rbGo" class="stroke ${st.ok ? (sure ? 'sure' : '') : 'no'}">${!st.ok ? tr('rbNotReady') : sure ? tr('rbSure') : tr('rbGo')}</button>`;
}
function resetAgency() {
  if (player.carrying) returnHome(player.carrying);
  player.moveCeleb = null;
  for (const c of [...celebs]) {
    if (c.owner !== player) continue;
    if (c.state === 'carried') returnHome(c);
    clearSlot(c.slot); removeCeleb(c);
  }
  for (const k of Object.keys(game.up)) game.up[k] = 0;
  player.cash = rebirthStartCash();
  refreshPlayerPodiums(); updateNameTag();
  const p = player.base.doorIn; player.floor = 0; player.stair = null; player.pos.set(p.x, 0.12, p.z);
  refreshFloors();
}
function doRebirth() {
  const st = rebirthStatus(); if (!st.ok) { Snd.play('error'); return; }
  if (!game.rebirthConfirm) { game.rebirthConfirm = true; renderRebirth(); return; }
  game.rebirthConfirm = false;
  game.rebirth++;
  resetAgency();
  closeModal();
  if (floorsUnlocked() > floorsUnlocked(game.rebirth - 1)) setTimeout(() => banner(tr('floorUnlocked', { n: floorsUnlocked() + 1 }), '#9dffb8'), 2600);
  banner(tr('rebirthDone', { n: game.rebirth, m: rebirthMult() }), '#7dffb0');
  feed(tr('rebirthFeed', { n: game.rebirth }));
  Snd.play('legend'); setTimeout(() => Snd.play('win'), 400); game.shake = 0.6;
  for (let i = 0; i < 6; i++) burst(player.pos.x + rand(-4, 4), 3, player.pos.z + rand(-4, 4), 50);
  doSave();
}
function toggleRebirth(force) { if (force === false) { if (activeModal === 'rebirth') closeModal(); } else if (force === true) openModal('rebirth'); else toggleModal('rebirth'); }


// ---------- All-Time GOAT animation ----------
// Arrival: rainbow light pillar from the sky + shockwave ring + bounce-in + confetti.
// Always on: 3 orbiting rainbow sparkle-stars, a soft rising glow and a gentle hover.
let sparkleTex = null;
function getSparkleTex() {
  if (sparkleTex) return sparkleTex;
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 7 : 30; g.lineTo(32 + Math.cos(a) * r, 32 + Math.sin(a) * r); }
  g.closePath(); g.fill();
  sparkleTex = new THREE.CanvasTexture(c); sparkleTex.colorSpace = THREE.SRGBColorSpace; return sparkleTex;
}
const goatBeamGeo = new THREE.CylinderGeometry(0.55, 1.1, 9, 18, 1, true); goatBeamGeo.translate(0, 4.5, 0);
const pillarGeo = new THREE.CylinderGeometry(1.4, 1.4, 60, 20, 1, true); pillarGeo.translate(0, 30, 0);
const goatPillars = [];
function addGoatFx(c) {
  const root = c.p.root, orbs = [];
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: getSparkleTex(), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
    s.scale.set(0.75, 0.75, 1); root.add(s); orbs.push(s);
  }
  const beam = new THREE.Mesh(goatBeamGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  root.add(beam);
  c.goat = { orbs, beam, ph: Math.random() * 6 };
}
function goatArrival(c, big = true) {
  const m = new THREE.Mesh(pillarGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.set(c.pos.x, c.pos.y, c.pos.z); scene.add(m);
  goatPillars.push({ m, c, t: 0, life: big ? 2.4 : 1.6 });
  ringFx(c.pos.x, c.pos.z, 0xffd84d, big ? 9 : 6); ringFx(c.pos.x, c.pos.z, 0xff5cf4, big ? 6 : 4);
  burst(c.pos.x, c.pos.y + 2.5, c.pos.z, big ? 90 : 50, [0xffd700, 0xffffff, 0xff5cf4, 0x3bc8ff, 0x5dff7a], 7, 10);
  if (big) c.arriveT = 0.9;
  if (hdist(c.pos, player.pos) < 40) game.shake = Math.max(game.shake, big ? 0.35 : 0.2);
}
const easeOutBack = (x) => { const k = 1.70158; return 1 + (k + 1) * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2); };
function updateGoatFx(c, dt) {
  const g = c.goat; if (!g) return;
  const t = game.t + g.ph, hue = (game.t * 0.25) % 1;
  g.orbs.forEach((s, i) => {
    const a = t * 2.2 + i * 2.094;
    s.position.set(Math.cos(a) * 1.15, 1.3 + Math.sin(t * 3 + i * 2) * 0.55, Math.sin(a) * 1.15);
    s.material.color.setHSL((hue + i / 3) % 1, 1, 0.65);
    const k = 0.6 + 0.25 * Math.sin(t * 5 + i); s.scale.set(k, k, 1);
  });
  g.beam.material.color.setHSL((hue + 0.5) % 1, 1, 0.6);
  g.beam.material.opacity = 0.1 + 0.06 * Math.sin(t * 2.5);
  // gentle hover while standing on a podium or the carpet
  if (c.state === 'placed' || c.state === 'carpet') c.p.body.position.y += 0.12 + Math.sin(t * 2) * 0.08;
  // bounce-in on arrival (carpet only, so carrying / moving scale is untouched)
  if (c.arriveT > 0) {
    c.arriveT -= dt;
    if (c.state === 'carpet') c.p.root.scale.setScalar(c.baseScale * Math.max(0.05, easeOutBack(clamp(1 - c.arriveT / 0.9, 0, 1))));
    if (c.arriveT <= 0 && c.state === 'carpet') c.p.root.scale.setScalar(c.baseScale);
  }
  if (c.p.root.visible && Math.random() < dt * 3 && hdist(c.pos, player.pos) < 45) burst(c.pos.x + rand(-0.6, 0.6), c.pos.y + 0.3, c.pos.z + rand(-0.6, 0.6), 2, [0xffd700, 0xffffff, 0xff5cf4], 0.4, 3);
}
function updateGoatPillars(dt) {
  for (let i = goatPillars.length - 1; i >= 0; i--) {
    const p = goatPillars[i]; p.t += dt; const k = p.t / p.life;
    p.m.position.set(p.c.pos.x, p.c.pos.y, p.c.pos.z);
    p.m.material.color.setHSL((game.t * 0.4) % 1, 1, 0.7);
    p.m.material.opacity = 0.85 * (1 - k);
    const w = 0.4 + (k < 0.15 ? k / 0.15 : 1 - (k - 0.15) * 0.6); p.m.scale.set(w, 1, w);
    if (k >= 1 || !celebs.includes(p.c)) { scene.remove(p.m); p.m.material.dispose(); goatPillars.splice(i, 1); }
  }
}

// ---------- bot rebirths ----------
// Bots rebirth too: they keep only their best celeb, restart their cash, and come back
// with more income, more speed and more frequent steals (aimed more at the player).
const botLvl = (b) => b.rebirth || 0;
function botCanRebirth(b) {
  const r = botLvl(b), req = REBIRTHS[r]; if (!req) return false;
  if (b.carrying || b.ai.state !== 'home') return false;
  if (b.cash < req.cash * 0.6) return false;
  return celebs.some((c) => c.owner === b && c.state === 'placed' && c.def.r >= Math.max(1, req.tier - 1));
}
function botRebirth(b) {
  let best = null;
  for (const c of celebs) if (c.owner === b && c.state === 'placed' && (!best || c.income > best.income)) best = c;
  for (const c of [...celebs]) if (c.owner === b && c.state === 'placed' && c !== best) { clearSlot(c.slot); removeCeleb(c); }
  b.rebirth = botLvl(b) + 1;
  b.cash = Math.min(50000, 250 * Math.pow(4, b.rebirth));
  updateBotTag(b);
  burst(b.pos.x, b.pos.y + 2, b.pos.z, 50, [0x7dffb0, 0xffffff, b.color]);
  feed(tr('botRebirth', { bot: `<b>${b.name}</b>`, n: b.rebirth }));
  if (hdist(b.pos, player.pos) < 45) { floatText('♻️ ' + b.rebirth, b.pos.x, b.pos.y + 3.6, b.pos.z, '#7dffb0'); Snd.play('upgrade'); }
  queueSave();
}
function updateBotTag(b) {
  const tag = b.tagSprite; if (!tag) return;
  tag.ctx.clearRect(0, 0, 512, 96); tag.ctx.textAlign = 'center'; tag.ctx.textBaseline = 'middle';
  strokeText(tag.ctx, '🤖 ' + b.name + (botLvl(b) ? ' ♻️' + botLvl(b) : ''), 256, 50, 58, '#' + new THREE.Color(b.color).getHexString(), 500);
  tag.tex.needsUpdate = true;
}
function updateNameTag() {
  const tag = player && player.tagSprite; if (!tag) return;
  tag.ctx.clearRect(0, 0, 512, 96); tag.ctx.textAlign = 'center'; tag.ctx.textBaseline = 'middle';
  strokeText(tag.ctx, `★ ${tr('you')}${game.rebirth ? ' ♻️' + game.rebirth : ''}${game.prestige ? ' 👑' + game.prestige : ''} ★`, 256, 50, 58, game.prestige ? '#ffd84d' : '#2ee6d6', 500); tag.tex.needsUpdate = true;
}
function playerSlots() { const n = unlockedSlots(player), u = floorsUnlocked(); return player.base.slots.filter((s) => s.floor === 0 ? s.idx < n : s.floor <= u); }
function freeSlot(a) { const list = a.isPlayer ? playerSlots() : a.base.slots; for (const s of list) if (!s.celeb) return s; return null; }
const ownedCelebs = (a) => celebs.filter((c) => c.owner === a);
function weakest(a) { let w = null; for (const c of celebs) if (c.owner === a && c.state === 'placed' && (!w || c.income < w.income)) w = c; return w; }
function route(fx, fz, fl, tx, tz) {
  const out = []; const fb = baseAt(fx, fz), tb = baseAt(tx, tz);
  if (fl > 0 && fb && fb.elev) out.push(fb.lane, fb.elev, { x: fb.elev.x, z: fb.elev.z, elev: 0 }, fb.lane, fb.laneFront);
  if (fb && fb !== tb) out.push(fb.doorIn, fb.doorOut);
  if (tb && tb !== fb) out.push(tb.doorOut, tb.doorIn);
  out.push({ x: tx, z: tz });
  return out;
}
function routeToSlot(fx, fz, slot, fl = 0) {
  const b = slot.base, out = [], fb = baseAt(fx, fz);
  if (fl > 0 && fb === b && fl === slot.floor) { out.push(...slot.approach); return out; }
  if (fb && fb !== b) out.push(fb.doorIn, fb.doorOut);
  if (fb !== b) out.push(b.doorOut, b.doorIn);
  if (slot.floor > 0) out.push(b.laneFront, b.lane, b.elev, { x: b.elev.x, z: b.elev.z, elev: slot.floor });
  out.push(...slot.approach);
  return out;
}
function refreshPlayerPodiums() {
  const n = unlockedSlots(player);
  player.base.slots.forEach((s, i) => { if (s.floor) return; s.podium.material = i < n ? toon(0xf4f0ff) : toon(0x555566); });
  refreshFloors();
}

// ---------------------------------------------------------------------
//  Collision
// ---------------------------------------------------------------------
function pushBox(p, r, b) {
  const cx = clamp(p.x, b.minX, b.maxX), cz = clamp(p.z, b.minZ, b.maxZ);
  const dx = p.x - cx, dz = p.z - cz, d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return;
  if (d2 > 1e-8) { const d = Math.sqrt(d2); p.x = cx + dx / d * r; p.z = cz + dz / d * r; return; }
  const l = p.x - b.minX, rr = b.maxX - p.x, t = p.z - b.minZ, bt = b.maxZ - p.z, m = Math.min(l, rr, t, bt);
  if (m === l) p.x = b.minX - r; else if (m === rr) p.x = b.maxX + r; else if (m === t) p.z = b.minZ - r; else p.z = b.maxZ + r;
}
function collide(p, r, who) {
  const fl = (who && who.floor) || 0;
  for (const w of walls) if ((w.floor || 0) === fl && !(w.needFloors && (game.fu || 0) < w.needFloors)) pushBox(p, r, w);
  if (fl === 0) for (const b of bases) if (b.locked && b.owner !== who) pushBox(p, r, b.doorBox);
  for (const c of circles) {
    if ((c.floor || 0) !== fl) continue;
    const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = r + c.r;
    if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m; }
  }
}
function moveCircle(p, r, dx, dz, who) {
  if (who && who.stair != null) { p.x += dx; p.z += dz; return; }
  p.x += dx; collide(p, r, who); p.z += dz; collide(p, r, who);
  p.x = clamp(p.x, -90, 90); p.z = clamp(p.z, -72, 72);
}
function groundY(x, z, fl = 0) { if (fl > 0) return fl * FH + 0.12; if (baseAt(x, z)) return 0.12; if (Math.abs(z) < 3 && Math.abs(x) < 63) return 0.08; return 0; }

// ---------------------------------------------------------------------
//  Effects: particles, floating text, rings
// ---------------------------------------------------------------------
const PMAX = 900;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PMAX * 3), pCol = new Float32Array(PMAX * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const points = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.32, vertexColors: true, transparent: true, depthWrite: false }));
points.frustumCulled = false; scene.add(points);
const parts = []; for (let i = 0; i < PMAX; i++) { parts.push({ life: 0 }); pPos[i * 3 + 1] = -999; }
let pIdx = 0;
const CONFETTI = [0xff4fa3, 0xffcc00, 0x2ee6d6, 0x9b5de5, 0x5dff7a, 0xffffff];
function burst(x, y, z, n, colors = CONFETTI, sp = 6, up = 7) {
  for (let k = 0; k < n; k++) {
    const p = parts[pIdx]; const i = pIdx; pIdx = (pIdx + 1) % PMAX;
    p.x = x; p.y = y; p.z = z; const a = Math.random() * Math.PI * 2, s = Math.random() * sp;
    p.vx = Math.cos(a) * s; p.vz = Math.sin(a) * s; p.vy = rand(up * 0.4, up); p.life = rand(0.8, 1.6);
    _tc.set(pick(colors)); pCol[i * 3] = _tc.r; pCol[i * 3 + 1] = _tc.g; pCol[i * 3 + 2] = _tc.b;
  }
  pGeo.attributes.color.needsUpdate = true;
}
function updateParticles(dt) {
  for (let i = 0; i < PMAX; i++) {
    const p = parts[i]; if (p.life <= 0) continue;
    p.life -= dt; p.vy -= 14 * dt; p.vx *= 0.98; p.vz *= 0.98;
    p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; if (p.y < 0.05) { p.y = 0.05; p.vy *= -0.3; }
    pPos[i * 3] = p.x; pPos[i * 3 + 1] = p.life > 0 ? p.y : -999; pPos[i * 3 + 2] = p.z;
  }
  pGeo.attributes.position.needsUpdate = true;
}
const floaters = [];
function floatText(txt, x, y, z, color = '#5dff7a', size = 1) {
  const s = makeCanvasSprite(512, 128, 0.95 * size);
  s.ctx.textAlign = 'center'; s.ctx.textBaseline = 'middle'; strokeText(s.ctx, txt, 256, 66, 80, color, 500); s.tex.needsUpdate = true;
  s.sprite.position.set(x, y, z); s.sprite.material.depthTest = false; s.sprite.renderOrder = 20; scene.add(s.sprite);
  floaters.push({ s, t: 0, life: 1.5 });
}
function updateFloaters(dt) {
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i]; f.t += dt; f.s.sprite.position.y += dt * 1.4;
    f.s.sprite.material.opacity = 1 - Math.pow(f.t / f.life, 3);
    if (f.t >= f.life) { scene.remove(f.s.sprite); disposeSprite(f.s); floaters.splice(i, 1); }
  }
}
const rings = [];
function ringFx(x, z, color, maxR = 6) {
  const m = new THREE.Mesh(torG(1, 0.08, 6, 40), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.4, z); scene.add(m); rings.push({ m, t: 0, maxR });
}
function updateRings(dt) {
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.t += dt; const k = r.t / 0.5; const s = 0.5 + k * r.maxR; r.m.scale.set(s, s, s); r.m.material.opacity = 0.9 * (1 - k);
    if (k >= 1) { scene.remove(r.m); r.m.material.dispose(); rings.splice(i, 1); }
  }
}

// ---------------------------------------------------------------------
//  Audio (procedural; respects YouTube audio setting)
// ---------------------------------------------------------------------
const Snd = {
  ctx: null, master: null, sfx: null, music: null, ytOn: SDK.audioEnabled(), musicTimer: null, lastCoin: 0,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended' && !game.paused) this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.master);
    this.music = this.ctx.createGain(); this.music.gain.value = 0.17; this.music.connect(this.master);
    this.apply(); this.startMusic();
  },
  apply() { if (this.master) this.master.gain.setTargetAtTime(this.ytOn && game.soundOn !== false ? 1 : 0, this.ctx.currentTime, 0.05); },
  tone(f, d, type = 'square', v = 0.3, f2 = null, delay = 0, dest = null, at = null) {
    const c = this.ctx; if (!c) return; const t = (at ?? c.currentTime) + delay;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + d + 0.03);
  },
  noise(d, v = 0.3, freq = 2000, delay = 0, dest = null, at = null) {
    const c = this.ctx; if (!c) return; const t = (at ?? c.currentTime) + delay;
    if (!this.nb) { this.nb = c.createBuffer(1, c.sampleRate, c.sampleRate); const ch = this.nb.getChannelData(0); for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1; }
    const s = c.createBufferSource(); s.buffer = this.nb; const fl = c.createBiquadFilter(); fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = 0.8;
    const g = c.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    s.connect(fl); fl.connect(g); g.connect(dest || this.sfx); s.start(t); s.stop(t + d + 0.02);
  },
  play(n) {
    if (!this.ctx || game.paused) return;
    switch (n) {
      case 'buy': [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.13, 'square', 0.13, null, i * 0.06)); break;
      case 'coin': { const now = this.ctx.currentTime; if (now - this.lastCoin < 0.07) return; this.lastCoin = now; this.tone(988, 0.07, 'square', 0.1); this.tone(1319, 0.14, 'square', 0.1, null, 0.06); break; }
      case 'steal': this.noise(0.35, 0.35, 1400); this.tone(300, 0.3, 'sawtooth', 0.12, 900); break;
      case 'win': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.22, null, i * 0.08)); break;
      case 'alarm': for (let i = 0; i < 3; i++) { this.tone(880, 0.18, 'sawtooth', 0.1, 660, i * 0.36); this.tone(660, 0.18, 'sawtooth', 0.1, 880, i * 0.36 + 0.18); } break;
      case 'warn': this.tone(740, 0.15, 'square', 0.1); this.tone(740, 0.15, 'square', 0.1, null, 0.22); break;
      case 'flash': this.noise(0.25, 0.4, 5000); this.tone(1800, 0.18, 'sine', 0.15, 300); break;
      case 'lock': this.tone(200, 0.4, 'sawtooth', 0.14, 800); this.tone(1200, 0.25, 'square', 0.05, null, 0.12); break;
      case 'zap': this.tone(900, 0.25, 'sawtooth', 0.14, 90); this.noise(0.2, 0.2, 3000); break;
      case 'error': this.tone(220, 0.12, 'square', 0.12); this.tone(160, 0.18, 'square', 0.12, null, 0.1); break;
      case 'legend': [784, 988, 1175, 1568, 1976].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.16, null, i * 0.09)); break;
      case 'caught': this.tone(420, 0.35, 'square', 0.16, 110); this.noise(0.15, 0.3, 800); break;
      case 'pop': this.tone(500, 0.09, 'sine', 0.2, 1300); break;
      case 'upgrade': [392, 523, 659, 784].forEach((f, i) => this.tone(f, 0.12, 'square', 0.12, null, i * 0.05)); break;
    }
  },
  startMusic() {
    const c = this.ctx, step = 60 / 112 / 4; let next = c.currentTime + 0.15, i = 0;
    const roots = [0, -4, 3, -2], bassPat = [0, 0, 12, 0, 7, 0, 12, 10], pent = [0, 3, 5, 7, 10, 12, 15];
    const tick = () => {
      if (!this.ctx || this.ctx.state !== 'running') return;
      while (next < c.currentTime + 0.3) {
        const s = i % 16, bar = Math.floor(i / 16) % 4, root = roots[bar], d = this.music;
        if (s % 4 === 0) this.tone(140, 0.16, 'sine', 0.55, 40, 0, d, next);
        if (s === 4 || s === 12) this.noise(0.14, 0.22, 1800, 0, d, next);
        if (s % 2 === 1) this.noise(0.04, 0.08, 8000, 0, d, next);
        if (s % 2 === 0) this.tone(55 * Math.pow(2, (root + bassPat[s % 8]) / 12), step * 1.7, 'triangle', 0.35, null, 0, d, next);
        if (s === 0 || s === 6 || s === 10) for (const iv of [0, 3, 7]) this.tone(220 * Math.pow(2, (root + iv) / 12), 0.18, 'square', 0.035, null, 0, d, next);
        if (s % 2 === 0 && Math.random() < 0.22) this.tone(880 * Math.pow(2, (root + pick(pent)) / 12), 0.16, 'triangle', 0.05, null, 0, d, next);
        next += step; i++;
      }
    };
    this.musicTimer = setInterval(tick, 60);
  },
};
SDK.onAudioChange((on) => { Snd.ytOn = on; Snd.apply(); });

// ---------------------------------------------------------------------
//  Game state
// ---------------------------------------------------------------------
const game = {
  t: 0, time: 0, playing: false, paused: false, shopOpen: false, loaded: false,
  spawnT: 0, stealCd: 25, playerStealCd: 85, eventT: 100, event: null, incomeMult: 1, luck: 1,
  up: { speed: 0, slots: 0, lock: 0, flash: 0, star: 0 }, rebirth: 0, rebirthConfirm: false,
  stats: { earned: 0, steals: 0, bestNet: 0, lastScore: 0 },
  tut: 0, adminForceUntil: 0, prestige: 0, seenHowTo: false, album: {}, albumDone: {}, streak: { last: '', count: 0, claimed: '' }, missions: null, soundOn: true, lang: '', fu: 0, shake: 0, paps: [], beams: [], flashTex: null, saveT: 20, dirtySave: 0,
};
let player;

function createAgent(o) {
  const p = buildPerson(o.look); scene.add(p.root);
  const a = Object.assign({ p, pos: p.root.position, yaw: 0, carrying: null, stunT: 0, ph: 0, moving: false, path: [], kb: { x: 0, z: 0 }, cash: 0, stuck: 0, last: { x: 0, z: 0 } }, o);
  a.ai = { state: 'home', think: rand(0, 1), decide: rand(2, 5), stealCd: rand(30, 70), wait: 0, repath: 0, celeb: null, slot: null, target: null, chaseT: 0 };
  const st = makeCanvasSprite(256, 96, 0.7); st.ctx.textAlign = 'center'; st.ctx.textBaseline = 'middle'; st.ctx.font = '64px sans-serif'; st.ctx.fillText('💫💫', 128, 52); st.tex.needsUpdate = true;
  st.sprite.position.y = 3.5; st.sprite.visible = false; p.root.add(st.sprite); a.stars = st.sprite;
  const tag = makeCanvasSprite(512, 96, 0.62); tag.ctx.textAlign = 'center'; tag.ctx.textBaseline = 'middle';
  strokeText(tag.ctx, o.isPlayer ? '★ YOU ★' : '🤖 ' + o.name, 256, 50, 58, '#' + new THREE.Color(o.color).getHexString(), 500); tag.tex.needsUpdate = true;
  tag.sprite.position.y = 2.95; p.root.add(tag.sprite); a.tag = tag.sprite; a.tagSprite = tag;
  agents.push(a);
  return a;
}

// ---------------------------------------------------------------------
//  Celebs
// ---------------------------------------------------------------------
let celebUid = 1;
function createCeleb(def, mut) {
  const p = buildPerson(def.look, mut);
  const sc = def.look.scale || (1 + def.r * 0.06);
  p.root.scale.setScalar(sc);
  const label = makeCanvasSprite(512, 260, 2.15); label.sprite.position.y = 3.4; p.root.add(label.sprite);
  if (def.r >= 3 || mut.id >= 2) {
    const ringMat = new THREE.MeshBasicMaterial({ color: def.r >= 3 ? RARITIES[def.r].hex : 0x9ff8ff, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
    const ring = new THREE.Mesh(torG(0.8, 0.07, 6, 28), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.08; p.root.add(ring); p.aura = ring;
    if (def.r === 5 || def.r === 6 || mut.id === 3) rainbowBasics.push(ringMat);
  }
  scene.add(p.root);
  const feat = def.id === featuredId();
  const c = { id: celebUid++, def, mut, featured: feat, income: def.inc * mut.mult * (feat ? 2 : 1), p, label, state: 'carpet', owner: null, slot: null, stored: 0, pos: p.root.position, yaw: Math.PI / 2, ph: Math.random() * 10, path: [], carrier: null, homeOwner: null, homeSlot: null, poseT: 0, baseScale: sc, dance: 'dance' + (Math.floor(Math.random() * 3)) };
  if (def.r === 5) addGoatFx(c);
  celebs.push(c); drawCelebLabel(c);
  return c;
}
function drawCelebLabel(c) {
  const { ctx, tex } = c.label; ctx.clearRect(0, 0, 512, 260); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const r = RARITIES[c.def.r]; const lines = [];
  if (c.featured) lines.push([tr('featured'), 30, '#ffe14d']);
  if (c.mut.id) lines.push([tr('mu' + c.mut.id), 34, c.mut.color]);
  lines.push([c.def.name, 48, '#ffffff']);
  if (c.def.title) lines.push([c.def.title, 28, '#ffd9f5']);
  lines.push([c.state === 'carpet' ? `$${fmt(price(c))}  •  +$${fmt(c.income)}/s` : `+$${fmt(c.income)}/s`, 36, c.state === 'carpet' ? '#ffe14d' : '#5dff7a']);
  lines.push([`${tr('r' + c.def.r)} • ${rarityChance(c.def.r)}`, 32, r.color]);
  let total = lines.reduce((s, l) => s + l[1] * 1.18, 0); let y = Math.max(0, 260 - total - 4);
  for (const [t, s, col] of lines) { y += s * 0.59; strokeText(ctx, t, 256, y, s, col, 500); y += s * 0.59; }
  tex.needsUpdate = true;
}
function removeCeleb(c) {
  const i = celebs.indexOf(c); if (i >= 0) celebs.splice(i, 1);
  scene.remove(c.p.root); disposeSprite(c.label);
  c.p.root.traverse((o) => { if (o.isMesh && o.userData.merged) o.geometry.dispose(); });
  if (c.p.aura) { const k = rainbowBasics.indexOf(c.p.aura.material); if (k >= 0) rainbowBasics.splice(k, 1); c.p.aura.material.dispose(); }
  if (c.goat) { for (const s of c.goat.orbs) s.material.dispose(); c.goat.beam.material.dispose(); c.goat = null; }
}
function rarityChance(i) {
  if (i === 6) return tr('fusionOnly'); if (i === 7) return tr('limitedOnly');
  const tot = RARITIES.reduce((s, r) => s + r.w, 0), p = RARITIES[i].w / tot * 100;
  return (p >= 1 ? +p.toFixed(1) : +p.toFixed(2)) + '%';
}
function rollRarity() {
  if (game.event && game.event.id === 'admin') return wpick([3, 4, 5], (i) => [50, 35, 15][i - 3]);
 return wpick(RARITIES.map((r, i) => i), (i) => RARITIES[i].w * (i >= 4 ? Math.min(2, game.luck) : i >= 2 ? game.luck : 1)); }
function rollMut() { return wpick(MUTS, (m) => m.w * (m.id ? game.luck : 1)); }
function spawnCarpetCeleb(x = CARPET_X0, forceR = null) {
  let r = forceR ?? rollRarity();
  let def = pickSpawnDef(r);
  if (forceR == null && game.event && game.event.id === 'admin' && Math.random() < 0.12) { def = CELEBS[limitedId()]; r = 7; }
  const c = createCeleb(def, rollMut());
  c.pos.set(x, 0.08, rand(-1.5, 1.5)); c.state = 'carpet';
  if (def.r === 5 && game.playing) goatArrival(c, true);
  if (game.playing && (r >= (game.event && game.event.id === 'admin' ? 4 : 3) || c.mut.id >= 2)) {
    const col = r >= 3 ? RARITIES[r].color : c.mut.color;
    banner(tr('carpetSpawn', { r: r >= 3 ? tr('r' + r) : tr('mu' + c.mut.id), c: def.name }), col === 'rainbow' ? '#ff8cf0' : col);
    Snd.play('legend');
  }
  return c;
}
function placeCeleb(c, slot, owner) {
  slot.celeb = c; c.slot = slot; c.owner = owner; c.state = 'placed'; c.path = [];
  c.pos.set(slot.pos.x, slotY(slot), slot.pos.z); c.floor = slot.floor;
  if (c.def.r === 5 && owner === player && game.playing) goatArrival(c, false);
  slot.ring.material.color.set(c.def.r === 5 ? 0xffffff : RARITIES[c.def.r].hex);
  drawCelebLabel(c);
}
function clearSlot(slot) { slot.celeb = null; slot.ring.material.color.set(0x777777); if (slot.label) slot.label.sprite.visible = false; }

// ---------------------------------------------------------------------
//  Core actions: buy / grab / deliver / return / sell / lock / flash
// ---------------------------------------------------------------------
function buy(a, c) {
  if (c.state !== 'carpet') return false;
  const cost = price(c);
  if (a.cash < cost) { if (a.isPlayer) { Snd.play('error'); floatText(tr('needCash', { x: fmt(cost) }), c.pos.x, 3.6, c.pos.z, '#ff6b6b'); } return false; }
  let s = freeSlot(a);
  if (!s && !a.isPlayer) { const w = weakest(a); if (w && w.income * 2 <= c.income) { a.cash += price(w) * 0.5; clearSlot(w.slot); removeCeleb(w); s = freeSlot(a); } }
  if (!s) { if (a.isPlayer) { Snd.play('error'); banner(tr('agencyFull'), '#ff9d00'); } return false; }
  a.cash -= cost; s.celeb = c; c.slot = s; c.owner = a; c.state = 'walkToBase'; c.floor = 0;
  c.path = routeToSlot(c.pos.x, c.pos.z, s).concat([{ x: s.pos.x, z: s.pos.z }]);
  drawCelebLabel(c);
  burst(c.pos.x, 2, c.pos.z, 30);
  if (a.isPlayer) {
    Snd.play('buy'); floatText(tr('signed', { c: c.def.name }), c.pos.x, 3.8, c.pos.z, '#ffe14d', 1.1);
    if (game.tut === 0) setTut(1);
    mission('buy'); if (c.def.r >= 2) mission('rare'); recordAlbum(c);
    queueSave();
  } else if (c.def.r >= 3 && hdist(a.pos, player.pos) < 60) feed(tr('botSigned', { bot: a.name, c: `<b style="color:${rColor(c.def.r)}">${c.def.name}</b>` }));
  return true;
}
function grab(a, c) {
  if (c.state !== 'placed' || c.owner === a) return false;
  c.state = 'carried'; c.carrier = a; c.homeOwner = c.owner; c.homeSlot = c.slot; a.carrying = c;
  c.p.root.scale.setScalar(c.baseScale * 0.8);
  Snd.play('steal');
  if (a.isPlayer) {
    banner(tr('gotRun', { c: c.def.name.toUpperCase() }), '#d68bff');
    burst(c.pos.x, 2, c.pos.z, 25, [0xd68bff, 0xffffff]);
  } else if (c.homeOwner === player) {
    banner(tr('grabbedYour', { bot: a.name, c: c.def.name }), '#ff4d6d'); Snd.play('alarm');
    feed(tr('stealingFeed', { bot: `<b>${a.name}</b>`, c: `<b>${c.def.name}</b>` }));
  }
  return true;
}
function deliver(a) {
  const c = a.carrying; const s = freeSlot(a);
  if (!s) { returnHome(c); if (a.isPlayer) banner(tr('noRoom'), '#ff9d00'); return; }
  const victim = c.homeOwner;
  clearSlot(c.homeSlot); a.carrying = null; c.carrier = null; c.homeOwner = null; c.homeSlot = null;
  c.p.root.scale.setScalar(c.baseScale); c.stored = 0;
  placeCeleb(c, s, a);
  burst(s.pos.x, 2.5, s.pos.z, 60);
  if (a.isPlayer) {
    game.stats.steals++;
    banner(tr('youStole', { c: c.def.name }), '#ffcc00'); Snd.play('win'); game.shake = 0.5;
    feed(tr('youStoleFeed', { c: `<b>${c.def.name}</b>`, v: victim.name })); mission('steal'); recordAlbum(c);
    if (game.tut === 2) setTut(3);
    queueSave();
  } else if (victim === player) {
    banner(tr('stolenYours', { bot: a.name, c: c.def.name }), '#ff4d6d'); Snd.play('caught');
    feed(tr('stoleYoursFeed', { bot: `<b>${a.name}</b>`, c: `<b>${c.def.name}</b>` }));
    queueSave();
  } else if (hdist(a.pos, player.pos) < 70) feed(tr('botStole', { bot: a.name, c: c.def.name, v: victim.name }));
}
function returnHome(c) {
  const a = c.carrier; if (a) a.carrying = null;
  c.carrier = null; c.state = 'placed'; c.slot = c.homeSlot; c.homeSlot = null; c.homeOwner = null;
  c.p.root.scale.setScalar(c.baseScale);
  c.pos.set(c.slot.pos.x, slotY(c.slot), c.slot.pos.z); c.floor = c.slot.floor;
  burst(c.pos.x, 2, c.pos.z, 20, [0xffffff, 0x9be7ff]);
  if (hdist(c.pos, player.pos) < 30) floatText(tr('returned'), c.pos.x, 3.6, c.pos.z, '#9be7ff');
}
function sell(c) {
  if (!c || c.owner !== player || c.state !== 'placed') return;
  const v = Math.floor(price(c) * 0.5 + c.stored);
  player.cash += v; game.stats.earned += c.stored;
  floatText(tr('sold', { x: fmt(v) }), c.pos.x, 3.6, c.pos.z, '#ffe14d'); burst(c.pos.x, 2, c.pos.z, 20, [0xffcc00]);
  clearSlot(c.slot); removeCeleb(c); Snd.play('coin'); queueSave();
}
function lockDuration(b) { return b.owner.isPlayer ? 20 + 10 * game.up.lock : 22; }
function lockBase(b) {
  if (b.locked || b.lockCd > 0) return false;
  b.locked = true; b.lockT = lockDuration(b); b.laser.visible = true;
  for (const a of agents) {
    if (a === b.owner || !inside(b, a.pos.x, a.pos.z)) continue;
    if (a.carrying && a.carrying.homeOwner === b.owner) returnHome(a.carrying);
    a.pos.x = b.doorOut.x + rand(-2.5, 2.5); a.pos.z = b.doorOut.z; a.floor = 0; a.stair = null; if (a.isPlayer && a.moveCeleb) endMove(null); a.stunT = Math.max(a.stunT, 0.7); a.path = [];
    burst(a.pos.x, 1.5, a.pos.z, 25, [0xff2a6d, 0xffffff]);
    if (a.isPlayer) { banner(tr('zapped'), '#ff5c8d'); Snd.play('zap'); game.shake = 0.4; }
  }
  if (hdist(player.pos, b.doorOut) < 40) Snd.play('lock');
  if (b.owner.isPlayer) { feed(tr('lockedFeed')); mission('lock'); if (game.tut === 3) setTut(4); }
  else if (hdist(player.pos, b.doorOut) < 30) feed(tr('botLocked', { bot: b.owner.name }));
  drawSign(b);
  return true;
}
function flashStats() { return { cd: Math.max(3, 8 - game.up.flash), r: 6 + game.up.flash * 0.9 }; }
function doFlash() {
  if (!game.playing) return;
  const P = player;
  if (P.flashCd > 0) { Snd.play('error'); return; }
  const fs = flashStats(); P.flashCd = fs.cd;
  let hit = 0;
  for (const b of bots) {
    if (hdist(b.pos, P.pos) > fs.r || (b.floor || 0) !== (P.floor || 0)) continue;
    b.stunT = 2.6; b.path = []; b.ai.state = 'home'; hit++;
    if (b.carrying) { const c = b.carrying; const mine = c.homeOwner === player; returnHome(c); if (mine) { banner(tr('saved', { c: c.def.name }), '#5dff7a'); Snd.play('win'); mission('defend'); } }
  }
  ringFx(P.pos.x, P.pos.z, 0xffffff, fs.r); ringFx(P.pos.x, P.pos.z, 0x9be7ff, fs.r * 0.7);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: game.flashTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  s.position.set(P.pos.x, 2, P.pos.z); s.scale.set(6, 6, 1); scene.add(s); floaters.push({ s: { sprite: s, tex: { dispose() {} } }, t: 0, life: 0.35 });
  Snd.play('flash');
  if (hit) { floatText(tr('stunned') + (hit > 1 ? ` x${hit}` : ''), P.pos.x, 3.6, P.pos.z, '#9be7ff'); mission('flash', hit); }
}

// ---------------------------------------------------------------------
//  Bot AI
// ---------------------------------------------------------------------
function toHome(b) { b.ai.state = 'home'; b.path = []; b.ai.wait = rand(0.3, 1.2); b.ai.celeb = null; b.ai.slot = null; }
function bestCarpetFor(b) {
  let best = null, bs = 0; const hasFree = !!freeSlot(b), w = weakest(b);
  for (const c of celebs) {
    if (c.state !== 'carpet' || c.pos.x > 40) continue;
    if (price(c) > b.cash) continue;
    if (!hasFree && (!w || c.income < w.income * 2)) continue;
    if (bots.some((o) => o !== b && o.ai.celeb === c)) continue;
    const s = c.income / (1 + hdist(b.pos, c.pos) * 0.03) * rand(0.7, 1.3);
    if (s > bs) { bs = s; best = c; }
  }
  return best;
}
function pickStealTarget(b) {
  let best = null, bs = 0;
  // when the player's cooldown is ready, bots mostly come for the player's best celeb (more often at higher rebirths)
  if (game.playerStealCd <= 0 && game.tut >= 2 && !player.base.locked && Math.random() < Math.min(0.9, 0.6 + 0.06 * (b.rebirth || 0))) {
    for (const c of celebs) {
      if (c.owner !== player || c.state !== 'placed' || bots.some((o) => o !== b && o.ai.celeb === c)) continue;
      const sc = c.income * rand(0.7, 1.3); if (sc > bs) { bs = sc; best = c; }
    }
    if (best) return best;
  }
  for (const c of celebs) {
    if (c.state !== 'placed' || c.owner === b || c.slot.base.locked) continue;
    if (c.owner === player && (game.playerStealCd > 0 || game.tut < 2)) continue;
    if (bots.some((o) => o !== b && o.ai.celeb === c)) continue;
    const s = c.income * (c.owner === player ? 1.8 * (1 + 0.2 * (b.rebirth || 0)) : 1) * rand(0.5, 1.5);
    if (s > bs) { bs = s; best = c; }
  }
  return best;
}
function botThink(b) {
  const ai = b.ai;
  if (b.carrying) { if (ai.state !== 'return') { ai.state = 'return'; ai.repath = 0; } return; }
  const thief = agents.find((a) => a !== b && a.carrying && a.carrying.homeOwner === b);
  if (thief) {
    if (ai.state !== 'chase') { ai.state = 'chase'; ai.target = thief; ai.chaseT = 16; ai.repath = 0; ai.triedLock = false; }
    if (!ai.triedLock && !b.base.locked && b.base.lockCd <= 0 && inside(b.base, thief.pos.x, thief.pos.z)) { ai.triedLock = true; if (Math.random() < 0.25) lockBase(b.base); }
    return;
  }
  const intr = agents.some((a) => a !== b && !a.carrying && hdist(a.pos, b.base.doorOut) < 8);
  if (intr) { if (!ai.sawIntr) { ai.sawIntr = true; if (!b.base.locked && b.base.lockCd <= 0 && Math.random() < 0.28) lockBase(b.base); } } else ai.sawIntr = false;
  if (ai.state !== 'home' || ai.decide > 0) return;
  if (game.playing && botCanRebirth(b) && Math.random() < 0.5) { botRebirth(b); ai.decide = rand(2, 4); return; }
  ai.decide = rand(1.5, 4);
  const c = bestCarpetFor(b);
  if (c && Math.random() < 0.65) { ai.state = 'buy'; ai.celeb = c; ai.repath = 0; return; }
  if (ai.stealCd <= 0 && game.stealCd <= 0) {
    const t = pickStealTarget(b);
    if (t) {
      let ok = !!freeSlot(b);
      if (!ok) { const w = weakest(b); if (w && t.income > w.income * 1.5) { b.cash += price(w) * 0.5; clearSlot(w.slot); removeCeleb(w); ok = true; } }
      if (ok) {
        ai.state = 'steal'; ai.celeb = t; ai.slot = t.slot; ai.warned = false; b.path = [];
        ai.stealCd = rand(35, 75) / (1 + 0.15 * (b.rebirth || 0)); game.stealCd = rand(9, 18);
        if (t.owner === player) game.playerStealCd = rand(40, 70) / (1 + 0.1 * (b.rebirth || 0));
      }
    }
  }
}
function updateBot(b, dt) {
  const ai = b.ai;
  if (b.stunT > 0) {
    b.stunT -= dt; b.stars.visible = b.stunT > 0; b.moving = false;
    if (b.stunT <= 0) toHome(b);
    applyKb(b, dt); b.pos.y = groundY(b.pos.x, b.pos.z, b.floor || 0);
    animPerson(b.p, 'stun', 0, game.t); b.p.root.rotation.y = b.yaw; return;
  }
  b.cash += dt * (0.6 + game.time * 0.002);
  if (!game.playing) { animPerson(b.p, 'idle', b.ph, game.t); return; }
  ai.think -= dt; ai.decide -= dt; ai.stealCd -= dt; ai.repath -= dt;
  if (ai.think <= 0) { ai.think = rand(0.35, 0.7); botThink(b); }
  switch (ai.state) {
    case 'home':
      if (!b.path.length) { ai.wait -= dt; if (ai.wait <= 0) { const w = b.base.local(rand(-5.5, 5.5), rand(2.5, 6)); b.path = route(b.pos.x, b.pos.z, b.floor || 0, w.x, w.z); ai.wait = rand(1.5, 4); } }
      break;
    case 'buy': {
      const c = ai.celeb;
      if (!c || c.state !== 'carpet' || price(c) > b.cash || c.pos.x > 58) { toHome(b); break; }
      if (ai.repath <= 0) { ai.repath = 0.35; b.path = route(b.pos.x, b.pos.z, b.floor || 0, c.pos.x + 1.5, c.pos.z); }
      if (hdist(b.pos, c.pos) < 2.3) { buy(b, c); toHome(b); }
      break;
    }
    case 'steal': {
      const s = ai.slot, c = s && s.celeb;
      if (!c || c !== ai.celeb || c.state !== 'placed' || c.owner === b || (s.base.locked && !inside(s.base, b.pos.x, b.pos.z))) { toHome(b); break; }
      if (!b.path.length) b.path = routeToSlot(b.pos.x, b.pos.z, s, b.floor || 0);
      if (c.owner === player && !ai.warned && hdist(b.pos, player.base.doorOut) < 15) {
        ai.warned = true; banner(tr('sneaking', { bot: b.name }), '#ff9d00'); Snd.play('warn');
        if (game.tut === 3) setHint(tr('tipLockNow'));
      }
      if ((b.floor || 0) === s.floor && hdist(b.pos, s.pos) < 2.5) { grab(b, c); ai.state = 'return'; ai.repath = 0; }
      break;
    }
    case 'return':
      if (!b.carrying) { toHome(b); break; }
      if (ai.repath <= 0) { ai.repath = 0.8; b.path = route(b.pos.x, b.pos.z, b.floor || 0, b.base.doorIn.x, b.base.doorIn.z); }
      break;
    case 'chase': {
      const t = ai.target; ai.chaseT -= dt;
      if (!t || !t.carrying || t.carrying.homeOwner !== b || ai.chaseT <= 0) { toHome(b); break; }
      if (ai.repath <= 0) { ai.repath = 0.25; b.path = route(b.pos.x, b.pos.z, b.floor || 0, t.pos.x, t.pos.z); }
      break;
    }
  }
  const speed = 6.1 * (1 + 0.03 * (b.rebirth || 0)) * (b.carrying ? 0.66 : 1) * (ai.state === 'chase' ? 1.04 : 1) * (ai.state === 'home' ? 0.5 : 1);
  followPath(b, speed, dt);
  applyKb(b, dt);
  // stuck detection
  if (b.moving) {
    b.stuck += dt;
    if (b.stuck > 1.5) { if (hdist(b.pos, b.last) < 0.6) { const a = rand(0, 6.28); b.path.unshift({ x: b.pos.x + Math.cos(a) * 3, z: b.pos.z + Math.sin(a) * 3 }); } b.stuck = 0; b.last.x = b.pos.x; b.last.z = b.pos.z; }
  }
  b.pos.y = groundY(b.pos.x, b.pos.z, b.floor || 0);
  if (b.carrying && inside(b.base, b.pos.x, b.pos.z)) { deliver(b); toHome(b); }
  b.ph += dt * (b.moving ? speed * 1.7 : 0);
  animPerson(b.p, b.carrying ? 'carry' : (b.moving ? (speed > 5 ? 'run' : 'walk') : 'idle'), b.ph, game.t);
  b.p.root.rotation.y = b.yaw;
}
function followPath(a, speed, dt) {
  a.moving = false;
  while (a.path.length) {
    const wp = a.path[0]; const dx = wp.x - a.pos.x, dz = wp.z - a.pos.z, d = Math.hypot(dx, dz);
    if (d < 0.4) { a.path.shift(); if (wp.elev != null) { a.floor = wp.elev; elevFx(a, a.floor); } continue; }
    const st = Math.min(speed * dt, d);
    moveCircle(a.pos, 0.45, dx / d * st, dz / d * st, a);
    a.yaw = angLerp(a.yaw, Math.atan2(dx, dz), dt * 10); a.moving = true;
    break;
  }
}
function applyKb(a, dt) {
  if (Math.abs(a.kb.x) + Math.abs(a.kb.z) < 0.05) return;
  moveCircle(a.pos, 0.45, a.kb.x * dt, a.kb.z * dt, a); a.kb.x *= Math.pow(0.02, dt); a.kb.z *= Math.pow(0.02, dt);
}
function checkCatches() {
  for (const a of agents) {
    const c = a.carrying; if (!c) continue;
    const d = c.homeOwner; if (!d || d.stunT > 0) continue;
    if ((a.floor || 0) === (d.floor || 0) && hdist(a.pos, d.pos) < 1.4) {
      returnHome(c);
      a.stunT = 1.1; const dx = a.pos.x - d.pos.x, dz = a.pos.z - d.pos.z, l = Math.hypot(dx, dz) || 1; a.kb.x = dx / l * 14; a.kb.z = dz / l * 14;
      burst(a.pos.x, 1.6, a.pos.z, 25, [0xffffff, 0xffcc00]);
      if (a.isPlayer) { banner(tr('caughtBy', { bot: d.name }), '#ff4d6d'); Snd.play('caught'); game.shake = 0.5; setHint(tr('tipFlash'), 6); }
      else if (d.isPlayer) { banner(tr('saved', { c: c.def.name }), '#5dff7a'); Snd.play('win'); mission('defend'); }
    }
  }
}

// ---------------------------------------------------------------------
//  Player
// ---------------------------------------------------------------------
const keys = {};
const joy = { id: null, ox: 0, oy: 0, x: 0, y: 0 };
const look = { id: null, lx: 0, ly: 0 };
let camYaw = 0, camPitch = 0.62, camDist = 15;
const camTarget = new THREE.Vector3();
let target = { kind: null, c: null }, sellTarget = null, collectT = 0;
function playerSpeed() { return 7 * rebirthSpeed() * (1 + 0.08 * game.up.speed) * (player.carrying ? 0.8 : 1); }
function updatePlayer(dt) {
  const P = player;
  P.flashCd = Math.max(0, P.flashCd - dt);
  let mx = 0, my = 0;
  if (keys.KeyW || keys.ArrowUp) my += 1; if (keys.KeyS || keys.ArrowDown) my -= 1;
  if (keys.KeyD || keys.ArrowRight) mx += 1; if (keys.KeyA || keys.ArrowLeft) mx -= 1;
  if (joy.id !== null) { mx += joy.x; my += joy.y; }
  if (P.stunT > 0) { P.stunT -= dt; mx = my = 0; }
  P.stars.visible = P.stunT > 0;
  const len = Math.hypot(mx, my); if (len > 1) { mx /= len; my /= len; }
  const sp = playerSpeed();
  P.moving = false;
  if (len > 0.08) {
    const fx = -Math.sin(camYaw), fz = -Math.cos(camYaw), rx = Math.cos(camYaw), rz = -Math.sin(camYaw);
    const dx = fx * my + rx * mx, dz = fz * my + rz * mx;
    moveCircle(P.pos, 0.45, dx * sp * dt, dz * sp * dt, P);
    P.yaw = angLerp(P.yaw, Math.atan2(dx, dz), dt * 14); P.moving = true;
    P.ph += dt * sp * 1.6 * Math.min(1, len);
  }
  applyKb(P, dt);
  P.pos.y = groundY(P.pos.x, P.pos.z, P.floor || 0);
  updateStairs(P);
  animPerson(P.p, P.stunT > 0 ? 'stun' : P.carrying ? 'carry' : P.moving ? (len > 0.6 ? 'run' : 'walk') : 'idle', P.ph, game.t);
  P.p.root.rotation.y = P.yaw;
  if (P.carrying && inside(P.base, P.pos.x, P.pos.z)) deliver(P);
  updatePlayerElevator();
  if (!P.floor && hdist(P.pos, P.base.pad) < 1.2 && !P.base.locked && P.base.lockCd <= 0) lockBase(P.base);
  // collect
  collectT -= dt;
  for (const c of celebs) {
    if (c.owner !== P || c.state !== 'placed' || c.stored < 1) continue;
    if (c.slot.floor === (P.floor || 0) && hdist(P.pos, c.slot.pos) < 2.8) {
      const v = Math.floor(c.stored); P.cash += v; game.stats.earned += v; c.stored -= v;
      if (collectT <= 0 || v > 5) floatText(`+$${fmt(v)}`, c.pos.x, 3.2, c.pos.z, '#5dff7a', 0.9);
      Snd.play('coin'); burst(c.pos.x, 1.2, c.pos.z, 6, [0x5dff7a, 0xffcc00], 2, 5);
      if (game.tut === 1) setTut(2);
      mission('collect', v);
    }
  }
  if (collectT <= 0) collectT = 0.25;
  // context target
  target = { kind: null, c: null }; sellTarget = null;
  let bd = 1e9;
  if (P.moveCeleb) {
    if (!inside(P.base, P.pos.x, P.pos.z)) { endMove(null); return; }
    let best = null, sd = 2.6;
    for (const s of playerSlots()) { if (s.floor !== (P.floor || 0)) continue; const d = hdist(P.pos, s.pos); if (d < sd && (!s.celeb || s.celeb === P.moveCeleb || (s.celeb.owner === P && s.celeb.state === 'placed'))) { sd = d; best = s; } }
    target = best ? { kind: best.celeb && best.celeb !== P.moveCeleb ? 'swap' : 'place', c: P.moveCeleb, slot: best } : { kind: 'cancelMove', c: P.moveCeleb };
    return;
  }
  if (!P.carrying && !P.floor && hdist(P.pos, FUSE_POS) < 4.3) { target = { kind: 'fuse', c: null }; bd = 3; }
  if (!P.carrying) {
    for (const c of celebs) {
      if (c.state === 'carpet') { const d = P.floor ? 99 : hdist(P.pos, c.pos); if (d < 3.3 && d < bd) { bd = d; target = { kind: 'buy', c }; } }
      else if (c.state === 'placed' && c.owner !== P) { const d = c.slot.floor !== (P.floor || 0) ? 99 : hdist(P.pos, c.slot.pos); if (d < 2.7 && d < bd) { bd = d; target = { kind: 'steal', c }; } }
      else if (c.state === 'placed' && c.owner === P) { const d = c.slot.floor !== (P.floor || 0) ? 99 : hdist(P.pos, c.slot.pos); if (d < 2.4 && (!sellTarget || d < hdist(P.pos, sellTarget.slot.pos))) sellTarget = c; }
    }
  }
}
function doAction() {
  if (!game.playing || game.shopOpen) return;
  const t = target;
  if (t.kind === 'fuse') { openModal('fuse'); return; }
  if (t.kind === 'place' || t.kind === 'swap') { endMove(t.slot); return; }
  if (t.kind === 'cancelMove') { endMove(null); return; }
  if (!t.c) return;
  if (t.kind === 'buy') buy(player, t.c);
  else if (t.kind === 'steal') {
    if (!freeSlot(player)) { Snd.play('error'); banner(tr('agencyFull'), '#ff9d00'); return; }
    grab(player, t.c);
  }
}
function doLockBtn() {
  if (!game.playing) return;
  const b = player.base;
  if (!inside(b, player.pos.x, player.pos.z) || player.floor) { Snd.play('error'); floatText(tr('goHomeLock'), player.pos.x, player.pos.y + 3.4, player.pos.z, '#ff9ec4'); return; }
  if (!lockBase(b)) Snd.play('error');
}
function doSell() { if (sellTarget) sell(sellTarget); }
function doMove() { if (player.moveCeleb) endMove(null); else if (sellTarget) startMove(sellTarget); }

// ---------------------------------------------------------------------
//  Celeb update
// ---------------------------------------------------------------------
function updateCelebs(dt) {
  const mult = game.incomeMult, pm = playerIncomeMult();
  for (let i = celebs.length - 1; i >= 0; i--) {
    const c = celebs[i];
    switch (c.state) {
      case 'carpet':
        c.pos.x += CARPET_SPEED * dt; c.yaw = Math.PI / 2; c.poseT -= dt;
        if (c.poseT < -rand(3, 9)) c.poseT = 1.3;
        c.ph += dt * 5;
        animPerson(c.p, c.poseT > 0 ? 'pose' : 'walk', c.ph, game.t);
        if (c.pos.x > CARPET_X1) { burst(c.pos.x, 1.5, c.pos.z, 8); removeCeleb(c); continue; }
        break;
      case 'walkToBase': {
        c.moving = false;
        while (c.path.length) {
          const wp = c.path[0]; const dx = wp.x - c.pos.x, dz = wp.z - c.pos.z, d = Math.hypot(dx, dz);
          if (d < 0.3) { c.path.shift(); if (wp.elev != null) c.floor = wp.elev; continue; }
          const st = Math.min(5.5 * dt, d); c.pos.x += dx / d * st; c.pos.z += dz / d * st; c.yaw = angLerp(c.yaw, Math.atan2(dx, dz), dt * 10); c.moving = true; break;
        }
        c.pos.y = groundY(c.pos.x, c.pos.z, c.floor || 0);
        c.ph += dt * 9; animPerson(c.p, 'walk', c.ph, game.t);
        if (!c.path.length) { placeCeleb(c, c.slot, c.owner); burst(c.pos.x, 2, c.pos.z, 20); if (c.owner === player) Snd.play('pop'); }
        break;
      }
      case 'placed':
        c.yaw = c.slot.base.f > 0 ? 0 : Math.PI;
        animPerson(c.p, c.dance, c.ph, game.t);
        if (game.playing) {
          if (c.owner.isPlayer) c.stored += c.income * mult * pm * dt;
          else c.owner.cash += c.income * mult * dt * 0.4 * (1 + 0.5 * (c.owner.rebirth || 0));
        }
        break;
      case 'moving':
        c.pos.set(player.pos.x, player.pos.y + 2.25, player.pos.z); c.yaw = player.yaw;
        animPerson(c.p, 'pose', c.ph, game.t);
        break;
      case 'carried': {
        const a = c.carrier;
        c.pos.set(a.pos.x, a.pos.y + 2.25, a.pos.z); c.yaw = a.yaw;
        animPerson(c.p, 'flail', c.ph, game.t);
        break;
      }
    }
    c.p.root.rotation.y = c.yaw;
    const dcam = hdist(c.pos, player.pos);
    c.label.sprite.visible = dcam < (c.def.r >= 3 ? 70 : 34);
    if (c.p.aura) c.p.aura.rotation.z += dt * 2;
    if (c.goat) updateGoatFx(c, dt);
  }
}
let podLabelT = 0;
function updatePodiumLabels(dt) {
  podLabelT -= dt; if (podLabelT > 0) return; podLabelT = 0.3;
  for (const s of player.base.slots) {
    if (!s.label) continue;
    const c = s.celeb;
    const show = c && c.owner === player && c.state === 'placed' && c.stored >= 1;
    s.label.sprite.visible = !!show;
    if (!show) continue;
    const k = '$' + fmt(c.stored);
    if (k === s.labelKey) continue; s.labelKey = k;
    const { ctx, tex } = s.label; ctx.clearRect(0, 0, 256, 80); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,.55)'; roundRect(ctx, 20, 8, 216, 64, 22); ctx.fill();
    strokeText(ctx, k, 128, 42, 44, '#5dff7a', 220); tex.needsUpdate = true;
  }
}
function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

// ---------------------------------------------------------------------
//  HUD
// ---------------------------------------------------------------------
const $ = (id) => document.getElementById(id);
const el = { move: $('btnMove'), hud: $('hud'), cash: $('cash'), cps: $('cps'), board: $('board'), banner: $('banner'), hint: $('hint'), feed: $('feed'), arrow: $('thiefArrow'), action: $('btnAction'), sell: $('btnSell'), flash: $('btnFlash'), lock: $('btnLock'), shop: $('shop'), shopList: $('shopList'), chip: $('eventChip'), mini: $('minimap'), joyBase: $('joyBase'), joyKnob: $('joyKnob'), popup: $('popup'), title: $('title'), play: $('playBtn') };
const miniCtx = el.mini.getContext('2d');
el.board.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); el.board.classList.toggle('open'); });
function banner(txt, color = '#fff') {
  el.banner.textContent = txt; el.banner.style.color = color;
  el.banner.classList.remove('show'); void el.banner.offsetWidth; el.banner.classList.add('show');
}
function feed(html) {
  const d = document.createElement('div'); d.innerHTML = html; el.feed.prepend(d);
  while (el.feed.children.length > 4) el.feed.lastChild.remove();
  setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 700); }, 7000);
}
let hintTimer = null;
function setHint(txt, secs) {
  el.hint.innerHTML = txt; el.hint.classList.remove('hidden');
  clearTimeout(hintTimer);
  if (secs) hintTimer = setTimeout(() => { if (game.tut >= 4) el.hint.classList.add('hidden'); else showTutHint(); placeHint(); }, secs * 1000);
  placeHint();
}
// on tall screens the hint sits at the very top and pushes the top HUD down
function placeHint() {
  const on = document.body.classList.contains('portrait') && !el.hint.classList.contains('hidden') && !el.hud.classList.contains('hidden');
  const h = on ? Math.ceil(el.hint.getBoundingClientRect().height + 8) : 0;
  document.documentElement.style.setProperty('--topPad', h + 'px');
  requestAnimationFrame(() => placeFeed());
}
const TUT = [
  '👉 Walk to the <b style="color:#ff4d6d">RED CARPET</b> and <b style="color:#5dff7a">BUY</b> a celeb!',
  '💰 Your celeb earns cash! Walk next to their podium to <b style="color:#5dff7a">COLLECT</b>.',
  '😈 Sneak into a rival bot agency and <b style="color:#d68bff">STEAL</b> their best celeb! Bring it home!',
  '🔒 Bots steal too! Step on your <b style="color:#ff9ec4">LOCK pad</b> to laser-lock your doors.',
];
function showTutHint() { if (game.tut < TUT.length) setHint(tr('tut' + game.tut)); else el.hint.classList.add('hidden'); }
function setTut(n) {
  game.tut = n;
  if (n >= TUT.length) { setHint(tr('tutPro'), 5); queueSave(); return; }
  showTutHint(); queueSave();
}
const keyHint = (k) => isTouch ? '' : `<span class="key">${k}</span>`;
let hudT = 0, boardT = 0, miniT = 0;
function netWorth(a) { let n = a.cash; for (const c of celebs) if (c.owner === a) n += price(c); return n; }
function playerCps() { let s = 0; for (const c of celebs) if (c.owner === player && c.state === 'placed') s += c.income; return s * game.incomeMult * playerIncomeMult(); }
function updateHUD(dt) {
  hudT -= dt; boardT -= dt; miniT -= dt;
  if (hudT <= 0) {
    hudT = 0.1;
    el.cash.textContent = '$' + fmt(player.cash);
    el.cps.textContent = `+$${fmt(playerCps())}/s` + (game.incomeMult > 1 ? ` (x${game.incomeMult})` : '');
    // action button
    const t = target; const a = el.action;
    a.className = 'stroke';
    if (player.carrying) { a.innerHTML = '🏃 ' + tr('runHome'); a.classList.add('carry'); }
    else if (t.kind === 'buy') {
      const cost = price(t.c), ok = player.cash >= cost && freeSlot(player);
      a.innerHTML = ok ? `🛒 ${tr('buy')} $${fmt(cost)}${keyHint('E')}` : (!freeSlot(player) ? '🏢 ' + tr('full') : `${tr('need')} $${fmt(cost)}`);
      if (!ok) a.classList.add('no');
    } else if (t.kind === 'steal') { a.innerHTML = `😈 ${tr('steal')}${keyHint('E')}`; a.classList.add('steal'); }
    else if (t.kind === 'fuse') { a.innerHTML = `🧪 ${tr('fuseLab')}${keyHint('E')}`; a.classList.add('fuse'); }
    else if (t.kind === 'place') { a.innerHTML = `📍 ${tr('placeHere')}${keyHint('E')}`; a.classList.add('carry'); }
    else if (t.kind === 'swap') { a.innerHTML = `🔁 ${tr('swap')}${keyHint('E')}`; a.classList.add('carry'); }
    else if (t.kind === 'cancelMove') { a.innerHTML = `❌ ${tr('cancel')}${keyHint('E')}`; a.classList.add('no'); }
    else a.classList.add('hidden');
    const showSell = sellTarget && !t.kind && !player.moveCeleb;
    el.sell.classList.toggle('hidden', !showSell); el.move.classList.toggle('hidden', !showSell);
    if (showSell) { el.sell.innerHTML = `💸 ${tr('sell')} $${fmt(price(sellTarget) * 0.5)}${keyHint('Q')}`; el.move.innerHTML = `🔀 ${tr('move')}${keyHint('M')}`; }
    updateMenuBar();
    // flash/lock
    const fcd = player.flashCd;
    el.flash.classList.toggle('dim', fcd > 0);
    el.flash.querySelector('span').innerHTML = fcd > 0 ? `${Math.ceil(fcd)}s` : `${tr('flash')}${keyHint('F')}`;
    const b = player.base, home = inside(b, player.pos.x, player.pos.z);
    el.lock.classList.toggle('dim', b.locked || b.lockCd > 0 || !home);
    el.lock.querySelector('span').innerHTML = b.locked ? `${tr('on')} ${Math.ceil(b.lockT)}s` : b.lockCd > 0 ? `${Math.ceil(b.lockCd)}s` : home ? `${tr('lock')}${keyHint('L')}` : tr('homeOnly');
    // event chip
    el.chip.classList.remove('hidden'); el.chip.textContent = game.event ? `${tr(game.event.key)} ${Math.ceil(game.event.t)}s` : '📅 ' + tr(todayTheme().key);
    // thief arrow
    const thief = bots.find((x) => x.carrying && x.carrying.homeOwner === player);
    if (thief) {
      el.arrow.classList.remove('hidden');
      const v = new THREE.Vector3(thief.pos.x, thief.pos.y + 3, thief.pos.z).project(camera);
      let x = v.x, y = v.y; if (v.z > 1) { x = -x; y = -y; }
      const on = Math.abs(x) < 0.9 && Math.abs(y) < 0.85 && v.z < 1;
      if (!on) { const m = Math.max(Math.abs(x), Math.abs(y)) || 1; x = x / m * 0.82; y = y / m * 0.78; }
      el.arrow.style.left = ((x + 1) / 2 * innerWidth) + 'px'; el.arrow.style.top = ((1 - y) / 2 * innerHeight) + 'px';
      el.arrow.textContent = on ? `🚨 ${thief.name}` : `🚨 ${tr('thief')} ${Math.round(hdist(thief.pos, player.pos))}m`;
    } else el.arrow.classList.add('hidden');
  }
  if (boardT <= 0) {
    boardT = 1;
    placeHint();
    const rows = agents.map((a) => ({ a, n: netWorth(a) })).sort((x, y) => y.n - x.n);
    el.board.innerHTML = `<div class="t">${tr('richest')}</div>` + rows.map((r, i) => `<div class="r ${r.a.isPlayer ? 'me' : ''}"><span><span class="dot" style="background:#${new THREE.Color(r.a.color).getHexString()}"></span>${i + 1}. ${r.a.isPlayer ? tr('you') + (game.rebirth ? ' ♻️' + game.rebirth : '') + (game.prestige ? ' 👑' + game.prestige : '') : r.a.name + (r.a.rebirth ? ' ♻️' + r.a.rebirth : '')}</span><span>$${fmt(r.n)}</span></div>`).join('');
    const nw = netWorth(player);
    if (nw > game.stats.bestNet) game.stats.bestNet = nw;
  }
  if (miniT <= 0) { miniT = 0.15; drawMinimap(); }
}
function drawMinimap() {
  const c = miniCtx, W = 160, H = 110; c.clearRect(0, 0, W, H);
  const mx = (x) => (x + 80) / 160 * W, mz = (z) => (z + 55) / 110 * H;
  c.fillStyle = '#c8102e'; c.fillRect(mx(-62), mz(-3), mx(62) - mx(-62), mz(3) - mz(-3));
  for (const b of bases) {
    c.fillStyle = '#' + new THREE.Color(b.owner.color).getHexString(); c.globalAlpha = 0.75;
    c.fillRect(mx(b.cx - 11), mz(b.cz - 8), mx(b.cx + 11) - mx(b.cx - 11), mz(b.cz + 8) - mz(b.cz - 8)); c.globalAlpha = 1;
    if (b.locked) { c.strokeStyle = '#ff2a6d'; c.lineWidth = 2; c.strokeRect(mx(b.cx - 11), mz(b.cz - 8), mx(b.cx + 11) - mx(b.cx - 11), mz(b.cz + 8) - mz(b.cz - 8)); }
  }
  for (const cl of celebs) if (cl.state === 'carpet' && cl.def.r >= 3) { c.fillStyle = '#ffcc00'; c.beginPath(); c.arc(mx(cl.pos.x), mz(cl.pos.z), 3, 0, 7); c.fill(); }
  for (const b of bots) {
    const th = b.carrying && b.carrying.homeOwner === player;
    c.fillStyle = th ? (Math.floor(game.t * 6) % 2 ? '#ff0000' : '#ffffff') : '#ffffff';
    c.beginPath(); c.arc(mx(b.pos.x), mz(b.pos.z), th ? 4 : 2.5, 0, 7); c.fill();
  }
  c.save(); c.translate(mx(player.pos.x), mz(player.pos.z)); c.rotate(-player.yaw + Math.PI);
  c.fillStyle = '#2ee6d6'; c.strokeStyle = '#000'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(0, -6); c.lineTo(4.5, 4.5); c.lineTo(-4.5, 4.5); c.closePath(); c.fill(); c.stroke(); c.restore();
}

// ---------------------------------------------------------------------
//  Shop
// ---------------------------------------------------------------------
function upCost(u) { return Math.round(u.cost(game.up[u.id])); }
function renderShop() {
  el.shopList.innerHTML = UPGRADES.map((u) => {
    const l = game.up[u.id], max = l >= u.max || (u.id === 'slots' && unlockedSlots(player) >= 8), cost = upCost(u), ok = player.cash >= cost;
    return `<div class="up"><div class="ic">${u.icon}</div><div class="tx">${tr('up_' + u.id)} <span style="color:#ffd84d">${tr('lv')} ${l}/${u.max}</span><small>${tr('ud_' + u.id)}</small></div>
      <button data-u="${u.id}" class="${max ? 'max' : ok ? '' : 'no'} stroke">${max ? tr('maxed') : '$' + fmt(cost)}</button></div>`;
  }).join('');
}
el.shopList.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('button'); if (!b) return; e.preventDefault();
  const u = UPGRADES.find((x) => x.id === b.dataset.u); if (!u) return;
  const l = game.up[u.id]; if (l >= u.max || (u.id === 'slots' && unlockedSlots(player) >= 8)) return;
  const cost = upCost(u);
  if (player.cash < cost) { Snd.play('error'); return; }
  player.cash -= cost; game.up[u.id]++; Snd.play('upgrade');
  if (u.id === 'slots') refreshPlayerPodiums();
  renderShop(); queueSave();
});
function toggleShop(force) { if (force === false) { if (activeModal === 'shop') closeModal(); } else if (force === true) openModal('shop'); else toggleModal('shop'); }

// ---------------------------------------------------------------------
//  Input
// ---------------------------------------------------------------------
addEventListener('keydown', (e) => {
  keys[e.code] = true;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  Snd.init();
  if (!game.playing) { if ((e.code === 'Enter' || e.code === 'Space') && game.loaded) startGame(); return; }
  if (e.repeat) return;
  if (activeModal && !['Escape', 'KeyP', 'KeyB', 'KeyR'].includes(e.code)) return;
  switch (e.code) {
    case 'KeyE': case 'Space': case 'Enter': doAction(); break;
    case 'KeyF': doFlash(); break;
    case 'KeyL': doLockBtn(); break;
    case 'KeyQ': doSell(); break;
    case 'KeyB': toggleShop(); break;
    case 'KeyR': toggleRebirth(); break;
    case 'KeyM': doMove(); break;
    case 'KeyP': toggleModal('pause'); break;
    case 'Escape': if (activeModal === 'howto') finishHowTo(); else if (activeModal) closeModal(); else openModal('pause'); break;
  }
});
addEventListener('keyup', (e) => { keys[e.code] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
const cvs = renderer.domElement;
cvs.addEventListener('contextmenu', (e) => e.preventDefault());
function becomeTouch(e) { if (e.pointerType === 'touch' && !isTouch) { isTouch = true; document.body.classList.add('touch'); computeUiScale(); } }
addEventListener('pointerdown', becomeTouch, true);
cvs.addEventListener('pointerdown', (e) => {
  Snd.init();
  if (e.pointerType !== 'mouse' && e.clientX < innerWidth * 0.45 && joy.id === null) {
    joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0;
    el.joyBase.style.left = (e.clientX - 60 * uiScale) + 'px'; el.joyBase.style.top = (e.clientY - 60 * uiScale) + 'px'; el.joyBase.style.bottom = 'auto';
    el.joyKnob.style.transform = 'translate(0,0)';
  } else if (look.id === null) { look.id = e.pointerId; look.lx = e.clientX; look.ly = e.clientY; }
  try { cvs.setPointerCapture(e.pointerId); } catch (er) {}
});
cvs.addEventListener('pointermove', (e) => {
  if (e.pointerId === joy.id) {
    let dx = e.clientX - joy.ox, dy = e.clientY - joy.oy; const m = Math.hypot(dx, dy), R = 55 * uiScale;
    if (m > R) { dx *= R / m; dy *= R / m; }
    joy.x = dx / R; joy.y = -dy / R; el.joyKnob.style.transform = `translate(${dx}px,${dy}px)`;
  } else if (e.pointerId === look.id) {
    camYaw -= (e.clientX - look.lx) * 0.006; camPitch = clamp(camPitch + (e.clientY - look.ly) * 0.004, 0.22, 1.2);
    look.lx = e.clientX; look.ly = e.clientY;
  }
});
const ptrUp = (e) => {
  if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; el.joyKnob.style.transform = 'translate(0,0)'; el.joyBase.style.left = ''; el.joyBase.style.top = ''; el.joyBase.style.bottom = ''; }
  if (e.pointerId === look.id) look.id = null;
};
cvs.addEventListener('pointerup', ptrUp); cvs.addEventListener('pointercancel', ptrUp);
cvs.addEventListener('wheel', (e) => { camDist = clamp(camDist + e.deltaY * 0.012, 8, 26); e.preventDefault(); }, { passive: false });
function bindBtn(b, fn) { b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); Snd.init(); fn(); }); }
bindBtn(el.action, doAction); bindBtn(el.sell, doSell); bindBtn(el.move, doMove); bindBtn(el.flash, doFlash); bindBtn(el.lock, doLockBtn);
bindBtn($('btnShop'), () => toggleShop()); bindBtn($('btnRebirth'), () => toggleRebirth());
for (const [b, m] of [['btnMissions', 'missions'], ['btnAlbum', 'album'], ['btnFuse', 'fuse'], ['btnPause', 'pause']]) bindBtn($(b), () => toggleModal(m));
document.querySelectorAll('[data-close]').forEach((b) => bindBtn(b, () => closeModal()));
$('rebirthBody').addEventListener('pointerdown', (e) => { const g = e.target.closest('#rbGo'); if (g) { e.preventDefault(); if (g.dataset.prestige) doPrestige(); else doRebirth(); } });
el.play.addEventListener('click', () => { Snd.init(); startGame(); });

// ---------------------------------------------------------------------
//  Events (Star Storm / Golden Hour)
// ---------------------------------------------------------------------
let eventIdx = 0;
// Admin Abuse: once a week, same moment for every player (Saturday 18:00 UTC, 30 minutes)
const WEEK = 7 * 864e5, ADMIN_LEN = 30 * 60e3;
const ADMIN_ANCHOR = Date.UTC(2026, 0, 3, 18, 0, 0); // a Saturday, 18:00 UTC
function adminInfo(now = Date.now()) {
  if (game.adminForceUntil > now) return { active: true, left: (game.adminForceUntil - now) / 1000 };
  const since = ((now - ADMIN_ANCHOR) % WEEK + WEEK) % WEEK;
  if (since < ADMIN_LEN) return { active: true, left: (ADMIN_LEN - since) / 1000 };
  return { active: false, next: now + (WEEK - since) };
}
function fmtWait(ms) { const m = Math.floor(ms / 60e3), d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60); return d ? `${d}d ${h}h` : h ? `${h}h ${m % 60}m` : `${m % 60}m`; }
function updateEvents(dt) {
  if (!game.playing) return;
  const ad = adminInfo();
  if (ad.active && (!game.event || game.event.id !== 'admin')) {
    game.event = { id: 'admin', key: 'evAdmin', t: ad.left };
    game.luck = 6; game.incomeMult = 3; game.spawnT = 0; game.adminDropT = 3;
    banner(tr('admin'), '#ff5cf4');
    feed(tr('adminFeed')); Snd.play('legend');
    return;
  }
  if (!game.event) {
    game.eventT -= dt;
    if (game.eventT <= 0) {
      const e = eventIdx++ % 2 === 0 ? { id: 'storm', key: 'evStorm', t: 40 } : { id: 'gold', key: 'evGold', t: 45 };
      game.event = e;
      if (e.id === 'storm') { game.luck = 4; banner(tr('storm'), '#ffcc00'); }
      else { game.incomeMult = 2; banner(tr('gold'), '#ff9d00'); }
      Snd.play('legend');
    }
  } else {
    if (game.event.id === 'admin') { const ai = adminInfo(); game.event.t = ai.active ? ai.left : 0; } else game.event.t -= dt;
    if (game.event.t <= 0) { game.event = null; game.luck = 1; game.incomeMult = 1; game.eventT = rand(110, 150); }
  }
}

// ---------------------------------------------------------------------
//  Save / load
// ---------------------------------------------------------------------
function serialize() {
  const list = [];
  for (const c of celebs) {
    if (c.owner !== player) continue;
    const slot = c.state === 'carried' ? c.homeSlot : c.slot;
    list.push({ d: c.def.id, m: c.mut.id, s: slot ? slot.idx : 0, st: Math.floor(c.stored) });
  }
  return JSON.stringify({ v: 1, t: Date.now(), cash: Math.floor(player.cash), up: game.up, rb: game.rebirth, pr: game.prestige, tut: game.tut, stats: game.stats, al: game.album, ad: game.albumDone, st: game.streak, mi: game.missions, so: game.soundOn, lang: game.lang, hw: game.seenHowTo ? 1 : 0, br: bots.map((b) => b.rebirth || 0), celebs: list });
}
let saving = false;
async function doSave() {
  if (!game.playing || saving) return;
  saving = true;
  try { await SDK.save(serialize()); } finally { saving = false; }
  const s = Math.floor(game.stats.bestNet);
  if (s > game.stats.lastScore) { game.stats.lastScore = s; SDK.score(s); }
}
function queueSave() { game.dirtySave = 2.5; }
function applySave(str) {
  let d = null;
  try { d = str ? JSON.parse(str) : null; } catch (e) { d = null; }
  if (!d || d.v !== 1) { player.cash = 100; return 0; }
  player.cash = Math.max(0, +d.cash || 0);
  for (const k of Object.keys(game.up)) game.up[k] = clamp(Math.floor(d.up?.[k] || 0), 0, UPGRADES.find((u) => u.id === k).max);
  game.tut = clamp(d.tut | 0, 0, 4);
  game.rebirth = clamp(d.rb | 0, 0, REBIRTHS.length); game.prestige = Math.max(0, d.pr | 0);
  if (d.al && typeof d.al === 'object') for (const [k, v] of Object.entries(d.al)) if (CELEBS[+k]) game.album[+k] = v | 0;
  if (d.ad && typeof d.ad === 'object') game.albumDone = d.ad;
  if (d.st && typeof d.st === 'object') game.streak = { last: String(d.st.last || ''), count: d.st.count | 0, claimed: String(d.st.claimed || '') };
  if (d.mi && d.mi.list) game.missions = d.mi;
  game.savedBotRb = Array.isArray(d.br) ? d.br.map((x) => clamp(x | 0, 0, REBIRTHS.length)) : null;
  game.soundOn = d.so !== false; game.lang = typeof d.lang === 'string' ? d.lang : ''; game.seenHowTo = !!d.hw;
  updateNameTag(); applyPrestigeLook();
  Object.assign(game.stats, d.stats || {});
  refreshPlayerPodiums();
  let incSum = 0;
  for (const s of d.celebs || []) {
    const def = CELEBS[s.d], mut = MUTS[s.m] || MUTS[0]; if (!def) continue;
    let slot = player.base.slots[s.s];
    if (!slot || slot.celeb || !playerSlots().includes(slot)) slot = freeSlot(player);
    if (!slot) continue;
    const c = createCeleb(def, mut); placeCeleb(c, slot, player); c.stored = Math.max(0, s.st || 0); recordAlbum(c, true);
    incSum += c.income;
  }
  const away = clamp((Date.now() - (d.t || Date.now())) / 1000, 0, 7200);
  const offline = Math.floor(incSum * playerIncomeMult() * away * 0.25);
  return away > 60 ? offline : 0;
}

// ---------------------------------------------------------------------
//  Setup bots scaled to the player's progress
// ---------------------------------------------------------------------
function setupBots() {
  let tier = -1; for (const c of celebs) if (c.owner === player) tier = Math.max(tier, c.def.r);
  const juicy = clamp(tier + 1, 2, tier >= 4 ? 4 : 3);
  const juicyBot = randi(0, 4), secondBot = (juicyBot + randi(1, 4)) % 5;
  BOT_INFO.forEach((info, i) => {
    const look = { robot: true, skin: 0xb8c2cc, top: info.color, bottom: 0x333344, shoes: 0x222222, hairStyle: 'none', acc: info.acc };
    const b = createAgent({ id: i + 1, name: info.name, color: info.color, isPlayer: false, look });
    makeBase(i + 1, BASE_DEFS[i + 1], b);
    const p = b.base.doorIn; b.pos.set(p.x + rand(-3, 3), 0.12, p.z); b.yaw = b.base.f > 0 ? 0 : Math.PI;
    b.rebirth = game.savedBotRb && game.savedBotRb[i] != null ? game.savedBotRb[i] : clamp(game.rebirth - randi(0, 2), 0, REBIRTHS.length);
    updateBotTag(b);
    b.cash = 150 * Math.pow(3, Math.max(0, tier + 1)) * rand(0.6, 1.4);
    const n = randi(3, 5); const maxT = clamp(tier, 0, 3);
    const tiers = [];
    for (let k = 0; k < n; k++) tiers.push(Math.random() < 0.6 ? randi(0, Math.max(0, maxT - 1)) : randi(0, maxT));
    if (i === juicyBot) tiers[0] = juicy; if (i === secondBot) tiers[0] = Math.max(1, juicy - 1);
    tiers.forEach((t, k) => { const def = pick(CELEBS.filter((c) => c.r === t)); const c = createCeleb(def, rollMut()); placeCeleb(c, b.base.slots[k], b); });
    bots.push(b);
  });
}

// ---------------------------------------------------------------------
//  Camera
// ---------------------------------------------------------------------
let titleAng = 0;
function updateCamera(dt) {
  if (!game.playing) {
    titleAng += dt * 0.08;
    camera.position.set(Math.sin(titleAng) * 42, 20, Math.cos(titleAng) * 42);
    camera.lookAt(0, 1, 0); return;
  }
  camTarget.lerp(new THREE.Vector3(player.pos.x, player.pos.y + 1.6, player.pos.z), 1 - Math.pow(0.0001, dt));
  const d = camDist * (camera.aspect < 0.8 ? 1.2 : camera.aspect > 2 ? 0.92 : 1);
  camera.position.set(camTarget.x + Math.sin(camYaw) * Math.cos(camPitch) * d, camTarget.y + Math.sin(camPitch) * d, camTarget.z + Math.cos(camYaw) * Math.cos(camPitch) * d);
  if (game.shake > 0) { game.shake -= dt; const s = game.shake * 0.6; camera.position.x += rand(-s, s); camera.position.y += rand(-s, s); }
  camera.lookAt(camTarget);
}
function onResize() { fitCamera(); computeUiScale(); }
addEventListener('resize', onResize);
addEventListener('orientationchange', () => setTimeout(onResize, 120));
if (window.visualViewport) visualViewport.addEventListener('resize', onResize);

// ---------------------------------------------------------------------
//  Indicators (tutorial pointer, target ring, thief beam)
// ---------------------------------------------------------------------
const pointer = new THREE.Mesh(coneG(0.55, 1.3, 10), new THREE.MeshBasicMaterial({ color: 0xffcc00 })); pointer.rotation.x = Math.PI; scene.add(pointer); pointer.visible = false;
const targetRing = new THREE.Mesh(torG(1.25, 0.09, 6, 32), new THREE.MeshBasicMaterial({ color: 0x5dff7a, transparent: true, opacity: 0.9 })); targetRing.rotation.x = -Math.PI / 2; scene.add(targetRing); targetRing.visible = false;
const thiefBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 40, 12, 1, true), new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false })); scene.add(thiefBeam); thiefBeam.visible = false;
function updateIndicators() {
  // target ring
  if (target.c) {
    const p = target.kind === 'buy' ? target.c.pos : target.c.slot.pos;
    targetRing.visible = true; targetRing.position.set(p.x, target.kind === 'buy' ? 0.15 : 0.9, p.z);
    targetRing.material.color.set(target.kind === 'buy' ? (player.cash >= price(target.c) ? 0x5dff7a : 0xff4d4d) : 0xd68bff);
    const s = 1 + Math.sin(game.t * 8) * 0.08; targetRing.scale.set(s, s, s);
  } else targetRing.visible = false;
  // thief beam
  const th = bots.find((b) => b.carrying && b.carrying.homeOwner === player);
  thiefBeam.visible = !!th; if (th) thiefBeam.position.set(th.pos.x, 20, th.pos.z);
  // tutorial pointer
  let tp = null;
  if (game.tut === 0) { let best = null, bd = 1e9; for (const c of celebs) if (c.state === 'carpet' && price(c) <= player.cash && c.pos.x < 50) { const d = hdist(c.pos, player.pos); if (d < bd) { bd = d; best = c; } } tp = best ? { x: best.pos.x, y: 4.6, z: best.pos.z } : { x: 0, y: 3, z: 0 }; }
  else if (game.tut === 1) { const c = celebs.find((c) => c.owner === player && c.state === 'placed'); if (c) tp = { x: c.pos.x, y: 5, z: c.pos.z }; }
  else if (game.tut === 2) { let best = null; for (const c of celebs) if (c.state === 'placed' && c.owner !== player && !c.slot.base.locked && (!best || c.income > best.income)) best = c; if (best) tp = { x: best.pos.x, y: 5.2, z: best.pos.z }; }
  else if (game.tut === 3) tp = { x: player.base.pad.x, y: 2.5, z: player.base.pad.z };
  if (player.carrying) tp = { x: player.base.cx, y: 5, z: player.base.cz };
  pointer.visible = !!tp && game.playing;
  if (tp) pointer.position.set(tp.x, tp.y + Math.abs(Math.sin(game.t * 4)) * 0.6, tp.z);
}

// ---------------------------------------------------------------------
//  Main loop
// ---------------------------------------------------------------------
function update(dt) {
  game.t += dt;
  if (game.playing) game.time += dt;
  game.stealCd -= dt; if (game.playing) game.playerStealCd -= dt;
  updateEvents(dt);
  game.spawnT -= dt;
  if (game.event && game.event.id === 'admin' && game.playing) { game.adminDropT = (game.adminDropT ?? 3) - dt; if (game.adminDropT <= 0) { game.adminDropT = 60; spawnCarpetCeleb(CARPET_X0, 5); ringFx(CARPET_X0 + 2, 0, 0xff5cf4, 10); } }
  if (game.spawnT <= 0) { const adm = game.event && game.event.id === 'admin'; game.spawnT = adm ? rand(1.1, 1.6) : rand(2.0, 2.9); spawnCarpetCeleb(); if (adm) burst(rand(-55, 55), 8, rand(-3, 3), 25, [0xff5cf4, 0xffcc00, 0xffffff], 3, 2); }
  carpetTex.offset.x -= dt * CARPET_SPEED / 6;
  for (const b of bases) {
    if (b.locked) { b.lockT -= dt; if (b.lockT <= 0) { b.locked = false; b.laser.visible = false; b.lockCd = b.owner.isPlayer ? 8 : rand(45, 80); } else b.laser.children[0].material.opacity = 0.25 + Math.sin(game.t * 12) * 0.1; }
    else if (b.lockCd > 0) b.lockCd -= dt;
    drawSign(b);
  }
  if (game.playing) updatePlayer(dt); else animPerson(player.p, 'idle', 0, game.t);
  for (const b of bots) updateBot(b, dt);
  if (game.playing) checkCatches();
  updateCelebs(dt);
  updatePodiumLabels(dt);
  updateParticles(dt); updateFloaters(dt); updateRings(dt); updateGoatPillars(dt);
  // paparazzi flashes
  for (const p of game.paps) { p.t -= dt; if (p.t <= 0) { p.t = rand(0.6, 3.5); p.fl.material.opacity = 1; } else p.fl.material.opacity = Math.max(0, p.fl.material.opacity - dt * 6); }
  if (game.beacon) game.beacon.visible = !game.playing || hdist(player.pos, player.base.doorIn) > 22;
  for (const b of game.beams) { b.m.rotation.z = Math.sin(game.t * 0.5 + b.ph) * 0.45; b.m.rotation.x = Math.cos(game.t * 0.37 + b.ph) * 0.3; }
  // rainbow
  const hue = (game.t * 0.25) % 1; rainbowMat.color.setHSL(hue, 0.9, 0.6);
  updateFuseLab(dt);
  for (const m of rainbowBasics) m.color.setHSL((hue + 0.5) % 1, 1, 0.6);
  if (game.playing) {
    updateIndicators(); updateHUD(dt);
    game.saveT -= dt; if (game.saveT <= 0) { game.saveT = 30; doSave(); }
    if (game.dirtySave > 0) { game.dirtySave -= dt; if (game.dirtySave <= 0) doSave(); }
  }
  updateCamera(dt);
  updateBuildingFade(dt);
  if (player) updateFloorVisibility();
  for (const bs of bases) if (bs.receptionist) animPerson(bs.receptionist, 'idle', bs.i, game.t);
  // keep the sun's light direction stable
}
let last = performance.now(), firstFrame = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (game.paused) return;
  if (!game.shopOpen) update(dt);
  renderer.render(scene, camera);
  if (!firstFrame) { firstFrame = true; SDK.firstFrame(); }
}

// ---------------------------------------------------------------------
//  Pause / resume (YouTube + tab visibility)
// ---------------------------------------------------------------------
function pause() { if (game.paused) return; game.paused = true; for (const k in keys) keys[k] = false; joy.id = null; joy.x = joy.y = 0; try { Snd.ctx && Snd.ctx.suspend(); } catch (e) {} doSave(); }
function resume() { if (!game.paused) return; game.paused = false; last = performance.now(); try { Snd.ctx && Snd.ctx.resume(); } catch (e) {} }
SDK.onPause(pause); SDK.onResume(resume);
document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); else if (!IN_YT) resume(); });

// =====================================================================
//  v3 features: menus, daily streak & missions, celeb album, fuse lab,
//  weekly schedule, prestige, podium moving, stairs, pause, languages
// =====================================================================
const rColor = (i) => { const c = RARITIES[i].color; return c === 'rainbow' ? '#ff8cf0' : c; };
const sig2 = (n) => { if (n < 100) return Math.max(1, Math.round(n)); const m = Math.pow(10, Math.floor(Math.log10(n)) - 1); return Math.round(n / m) * m; };

// ---------- modal manager (every panel pauses the game) ----------
let activeModal = null;
const MODAL_RENDER = { howto: () => renderHowTo(), shop: () => renderShop(), rebirth: () => renderRebirth(), missions: () => renderMissions(), album: () => renderAlbum(), fuse: () => renderFuse(), pause: () => renderPause() };
function openModal(id) {
  if (!game.playing) return;
  if (activeModal && activeModal !== id) closeModal();
  activeModal = id; game.shopOpen = true; game.rebirthConfirm = false;
  for (const k in keys) keys[k] = false;
  document.getElementById(id).classList.remove('hidden');
  if (MODAL_RENDER[id]) MODAL_RENDER[id]();
}
function closeModal() {
  if (!activeModal) return;
  document.getElementById(activeModal).classList.add('hidden');
  activeModal = null; game.shopOpen = false; last = performance.now();
}
function toggleModal(id) { if (activeModal === id) closeModal(); else openModal(id); }

// ---------- popup queue (welcome back, daily streak) ----------
const popupQueue = [];
function queuePopup(fn) { if (activeModal === 'howto') { howtoAfter.push(fn); return; } popupQueue.push(fn); if (el.popup.classList.contains('hidden')) nextPopup(); }
function nextPopup() {
  const fn = popupQueue.shift();
  if (!fn) { el.popup.classList.add('hidden'); return; }
  el.popup.innerHTML = ''; fn(el.popup); el.popup.classList.remove('hidden');
}

// ---------- calendar helpers (device local time) ----------
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const prevDayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d); };
const msToMidnight = () => { const d = new Date(), m = new Date(d); m.setHours(24, 0, 0, 0); return m - d; };
function seeded(str) {
  let h = 2166136261; for (const ch of str) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}

// ---------- weekly content schedule ----------
// Every week: a FEATURED celeb (8x spawn, x2 income) and a LIMITED celeb that only appears in Admin Abuse.
// Every day: a theme day that makes one kind of celeb 4x more common.
const weekIndex = (now = Date.now()) => Math.floor((now - ADMIN_ANCHOR) / WEEK);
const FEATURE_POOL = CELEBS.filter((c) => c.r >= 3 && c.r <= 5).map((c) => c.id);
const wrap = (i, n) => ((i % n) + n) % n;
function featuredId() { return FEATURE_POOL[wrap(weekIndex() * 37, FEATURE_POOL.length)]; }
function limitedId() { return LIMITED_IDS[wrap(weekIndex(), LIMITED_IDS.length)]; }
function todayTheme() { return THEME_DAYS[new Date().getDay()]; }
function pickSpawnDef(r) {
  const list = CELEBS.filter((c) => c.r === r), th = todayTheme().arch, f = featuredId();
  return wpick(list, (c) => (c.id === f ? 8 : 1) * (th.includes(c.arch) ? 4 : 1));
}
function refreshTitleText() {
  el.play.textContent = game.loaded ? tr('play') : tr('loading');
  const ai = adminInfo(), an = document.getElementById('adminNext');
  if (an) an.textContent = ai.active ? tr('adminLive') : tr('adminNext', { when: new Date(ai.next).toLocaleString(getLang(), { weekday: 'long', hour: 'numeric', minute: '2-digit' }), wait: fmtWait(ai.next - Date.now()) });
  const sc = document.getElementById('scheduleLine');
  if (sc) sc.textContent = tr('schedule', { theme: tr(todayTheme().key), feat: CELEBS[featuredId()].name, lim: CELEBS[limitedId()].name });
}

// ---------- income multipliers ----------
const albumCount = () => Object.keys(game.album).length;
const albumMult = () => 1 + 0.01 * albumCount();
const prestigeMult = (p = game.prestige) => 1 + 0.5 * p;
function playerIncomeMult() { return (1 + 0.25 * game.up.star) * rebirthMult() * albumMult() * prestigeMult(); }

// ---------- celeb album ----------
function recordAlbum(c, silent) {
  const id = c.def.id, bit = 1 << c.mut.id, had = game.album[id] || 0;
  if (had & bit) return;
  game.album[id] = had | bit;
  if (had || silent) return;
  setTimeout(() => banner(tr('newAlbum', { c: c.def.name }), '#9be7ff'), 900);
  mission('album');
  const r = c.def.r, page = CELEBS.filter((x) => x.r === r);
  if (!game.albumDone[r] && page.every((x) => game.album[x.id])) {
    game.albumDone[r] = 1; const reward = Math.round(2000 * Math.pow(8, Math.min(r, 6)));
    player.cash += reward;
    setTimeout(() => { banner(tr('alPageDone', { r: tr('r' + r), x: fmt(reward) }), '#ffcc00'); Snd.play('legend'); }, 2600);
  }
}
let albumTab = 0;
function renderAlbum() {
  const found = albumCount();
  let h = `<div class="al-top"><b>${tr('alFound', { a: found, b: CELEBS.length })}</b><small>${tr('alBonus', { x: found })}</small></div><div class="tabs">`;
  for (let r = 0; r < RARITIES.length; r++) {
    const list = CELEBS.filter((c) => c.r === r), f = list.filter((c) => game.album[c.id]).length;
    h += `<button data-tab="${r}" class="${r === albumTab ? 'on' : ''}" style="--c:${rColor(r)}">${tr('r' + r)} <small>${f}/${list.length}${game.albumDone[r] ? ' ✅' : ''}</small></button>`;
  }
  h += '</div><div class="al-grid">';
  for (const c of CELEBS.filter((x) => x.r === albumTab)) {
    const m = game.album[c.id] || 0;
    if (!m) { h += `<div class="al-card lock"><div class="al-q">?</div><div class="al-n">???</div><div class="al-t">${tr('r' + c.r)}</div></div>`; continue; }
    h += `<div class="al-card" style="--c:${rColor(c.r)}"><div class="al-n">${c.name}</div><div class="al-t">${c.title}</div>
      <div class="al-m">${[0, 1, 2, 3].map((i) => `<i class="${m & (1 << i) ? 'y' : ''} mu${i}" title="${i ? tr('mu' + i) : ''}"></i>`).join('')}</div><div class="al-i">+$${fmt(c.inc)}/s</div></div>`;
  }
  document.getElementById('albumBody').innerHTML = h + '</div>';
}
document.getElementById('albumBody').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-tab]'); if (b) { e.preventDefault(); albumTab = +b.dataset.tab; renderAlbum(); } });

// ---------- daily missions ----------
const MISSION_TYPES = [
  { type: 'buy', n: () => randi(3, 7) }, { type: 'steal', n: () => randi(1, 3) }, { type: 'collect', n: 'cash' },
  { type: 'defend', n: () => randi(1, 2) }, { type: 'lock', n: () => randi(1, 2) }, { type: 'flash', n: () => randi(2, 5) },
  { type: 'rare', n: () => 1 }, { type: 'album', n: () => randi(1, 3) }, { type: 'floor', n: () => randi(1, 3), need: () => floorsUnlocked() > 0 },
];
function ensureMissions() {
  const key = dayKey();
  if (game.missions && game.missions.day === key && Array.isArray(game.missions.list)) return;
  const R = seeded('missions' + key), pool = MISSION_TYPES.filter((m) => !m.need || m.need()), list = [];
  const base = Math.max(600, playerCps() * 240);
  let guard = 0;
  while (list.length < 3 && guard++ < 100) {
    const m = pool[Math.floor(R() * pool.length)];
    if (list.some((x) => x.type === m.type)) continue;
    list.push({ type: m.type, n: m.n === 'cash' ? sig2(base * 4) : m.n(), prog: 0, claimed: false, reward: sig2(base * (1 + list.length * 0.6)) });
  }
  game.missions = { day: key, list, bonus: false };
}
const missionText = (m) => tr('m_' + m.type, { n: m.type === 'collect' ? fmt(m.n) : m.n });
function mission(type, amt = 1) {
  if (!game.playing) return;
  ensureMissions();
  for (const m of game.missions.list) {
    if (m.type !== type || m.prog >= m.n) continue;
    m.prog = Math.min(m.n, m.prog + amt);
    if (m.prog >= m.n) { setTimeout(() => banner(tr('missionDone', { m: missionText(m) }), '#7dffb0'), 400); Snd.play('upgrade'); }
  }
}
function missionsClaimable() {
  ensureMissions(); const L = game.missions.list;
  return streakReady() || L.some((m) => m.prog >= m.n && !m.claimed) || (!game.missions.bonus && L.every((m) => m.claimed));
}
function renderMissions() {
  ensureMissions();
  const L = game.missions.list, hrs = Math.floor(msToMidnight() / 3600e3), mins = Math.floor(msToMidnight() / 60e3) % 60;
  let h = streakHtml(true) + `<h4>${tr('misTitle')} <small>${tr('misReset', { t: `${hrs}h ${mins}m` })}</small></h4>`;
  L.forEach((m, i) => {
    const pct = Math.round(m.prog / m.n * 100), ready = m.prog >= m.n;
    h += `<div class="mi-row ${m.claimed ? 'done' : ''}"><div class="mi-tx">${missionText(m)}<div class="mi-bar"><i style="width:${pct}%"></i></div><small>${m.type === 'collect' ? fmt(m.prog) + ' / ' + fmt(m.n) : m.prog + ' / ' + m.n} • +$${fmt(m.reward)}</small></div>
      <button data-claim="${i}" class="${ready && !m.claimed ? '' : 'no'} stroke">${m.claimed ? tr('done') : tr('claim')}</button></div>`;
  });
  const all = L.every((m) => m.claimed), bonus = sig2(L.reduce((s, m) => s + m.reward, 0));
  h += `<div class="mi-row bonus ${game.missions.bonus ? 'done' : ''}"><div class="mi-tx">${tr('misBonus')}<small>+$${fmt(bonus)}</small></div>
    <button data-claim="bonus" class="${all && !game.missions.bonus ? '' : 'no'} stroke">${game.missions.bonus ? tr('done') : tr('claim')}</button></div>`;
  document.getElementById('missionsBody').innerHTML = h;
}
document.getElementById('missionsBody').addEventListener('pointerdown', (e) => {
  const st = e.target.closest('[data-streak]'); if (st) { e.preventDefault(); claimStreak(); renderMissions(); return; }
  const b = e.target.closest('[data-claim]'); if (!b) return; e.preventDefault();
  const M = game.missions;
  if (b.dataset.claim === 'bonus') {
    if (M.bonus || !M.list.every((m) => m.claimed)) return Snd.play('error');
    M.bonus = true; const v = sig2(M.list.reduce((s, m) => s + m.reward, 0)); player.cash += v; floatText(`+$${fmt(v)}`, player.pos.x, player.pos.y + 3.4, player.pos.z);
  } else {
    const m = M.list[+b.dataset.claim]; if (!m || m.claimed || m.prog < m.n) return Snd.play('error');
    m.claimed = true; player.cash += m.reward; floatText(`+$${fmt(m.reward)}`, player.pos.x, player.pos.y + 3.4, player.pos.z);
  }
  Snd.play('win'); burst(player.pos.x, player.pos.y + 2, player.pos.z, 30); queueSave(); renderMissions();
});

// ---------- daily login streak ----------
function updateStreakOnStart() {
  const s = game.streak, today = dayKey();
  if (s.last === today) return;
  s.count = s.last === prevDayKey() ? s.count + 1 : 1; s.last = today;
}
const streakDay = () => ((Math.max(1, game.streak.count) - 1) % 7) + 1;
const streakReady = () => game.streak.last === dayKey() && game.streak.claimed !== dayKey();
const streakCash = (d) => sig2(Math.max(300, playerCps() * 90) * d);
function streakHtml(inPanel) {
  const cur = streakDay(), ready = streakReady();
  let h = `<div class="st-wrap"><h4>${tr('stTitle')} 🔥${game.streak.count}</h4><div class="st-row">`;
  for (let d = 1; d <= 7; d++) {
    const past = d < cur || (d === cur && !ready);
    h += `<div class="st-day ${d === cur ? 'cur' : ''} ${past ? 'got' : ''}"><b>${tr('stDay', { n: d })}</b><span>${d === 7 ? '⭐' : '💰'}</span><small>${d === 7 ? tr('r3') : '$' + fmt(streakCash(d))}</small></div>`;
  }
  h += '</div>';
  h += ready ? `<button data-streak="1" class="st-claim stroke">${tr('claim')}: ${cur === 7 ? tr('stCeleb') : '$' + fmt(streakCash(cur))}</button>` : `<p class="st-back">${tr('stBack', { n: (cur % 7) + 1 })}</p>`;
  return h + '</div>';
}
function claimStreak() {
  if (!streakReady()) return false;
  const d = streakDay(); game.streak.claimed = dayKey();
  if (d === 7) {
    const def = pick(CELEBS.filter((c) => c.r === 3)), s = freeSlot(player);
    if (s) { const c = createCeleb(def, MUTS[0]); placeCeleb(c, s, player); recordAlbum(c); burst(c.pos.x, c.pos.y + 2, c.pos.z, 60); }
    else player.cash += def.cost;
  } else player.cash += streakCash(d);
  banner(tr('stGot', { n: d }), '#ffb347'); Snd.play('win'); burst(player.pos.x, player.pos.y + 2, player.pos.z, 50); queueSave();
  if (!el.popup.classList.contains('hidden') && el.popup.querySelector('.st-wrap')) nextPopup();
  return true;
}
function streakPopup(box) {
  box.innerHTML = streakHtml(false) + `<button class="stroke st-later" id="stLater">${tr('close')}</button>`;
  const c = box.querySelector('[data-streak]');
  if (c) bindBtn(c, () => { claimStreak(); nextPopup(); });
  bindBtn(box.querySelector('#stLater'), () => nextPopup());
}

// ---------- fuse lab ----------
const FUSE_POS = { x: 19, z: 20 };
let fuseLiquid = null;
function buildFuseLab() {
  const g = new THREE.Group(); g.position.set(FUSE_POS.x, 0, FUSE_POS.z); scene.add(g);
  M(cylG(2.6, 2.8, 0.3, 24), toon(0x2b2d42), 0, 0.15, 0, g);
  M(torG(2.6, 0.12, 6, 32), new THREE.MeshBasicMaterial({ color: 0x00ffd5 }), 0, 0.32, 0, g).rotation.x = -Math.PI / 2;
  M(cylG(1.5, 1.6, 0.5, 20), toon(0xd8dde6), 0, 0.55, 0, g);
  fuseLiquid = M(cylG(1.15, 1.15, 2.6, 20), new THREE.MeshBasicMaterial({ color: 0x00ffd5, transparent: true, opacity: 0.85 }), 0, 2.1, 0, g);
  M(new THREE.CylinderGeometry(1.35, 1.35, 3.1, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide }), 0, 2.3, 0, g);
  M(cylG(1.5, 1.4, 0.4, 20), toon(0xd8dde6), 0, 4.0, 0, g); M(sphG(0.4, 10, 8), toon(0xff00aa), 0, 4.45, 0, g);
  for (const a of [0, 2.1, 4.2]) { const t = M(cylG(0.14, 0.14, 2.4, 8), toon(0xffcc33), Math.cos(a) * 2.1, 1.4, Math.sin(a) * 2.1, g); t.rotation.z = Math.cos(a) * 0.35; t.rotation.x = -Math.sin(a) * 0.35; }
  const sign = labelSprite('fuTitle', null, '#00ffd5', 512, 128, 1.5, 70); sign.position.set(0, 5.6, 0); g.add(sign);
  circles.push({ x: FUSE_POS.x, z: FUSE_POS.z, r: 2.3 });
  game.fuseLab = g;
}
function updateFuseLab(dt) {
  if (!fuseLiquid) return;
  fuseLiquid.material.color.setHSL((game.t * 0.15) % 1, 1, 0.55);
  fuseLiquid.scale.y = 0.85 + Math.sin(game.t * 3) * 0.1;
  if (Math.random() < dt * 4) burst(FUSE_POS.x + rand(-0.8, 0.8), 3.4, FUSE_POS.z + rand(-0.8, 0.8), 2, [0x00ffd5, 0xff00aa, 0xffffff], 0.6, 2);
}
const nearFuse = () => !player.floor && hdist(player.pos, FUSE_POS) < 4.6;
function fuseStatus(rec) {
  const used = new Set();
  const need = rec.need.map((id) => {
    const pickC = celebs.filter((c) => c.owner === player && c.state === 'placed' && c.def.id === id && !used.has(c)).sort((a, b) => a.mut.id - b.mut.id)[0] || null;
    if (pickC) used.add(pickC); return pickC;
  });
  return { need, has: need.every(Boolean), ok: need.every(Boolean) && player.cash >= rec.fee };
}
function renderFuse() {
  const near = nearFuse();
  let h = `<p class="fu-desc">${tr('fuDesc')}</p>` + (near ? '' : `<p class="fu-warn">📍 ${tr('fuNeedLab')}</p>`);
  RECIPES.forEach((r, i) => {
    const st = fuseStatus(r), res = CELEBS[r.result], have = game.album[res.id];
    h += `<div class="fu-card ${st.ok ? 'ready' : ''}"><div class="fu-res"><b>${have ? '✅ ' : ''}${res.name}</b><small>${res.title}</small><span>+$${fmt(res.inc)}/s</span></div>
      <div class="fu-need">${r.need.map((id, k) => `<span class="${st.need[k] ? 'ok' : ''}" style="--c:${rColor(CELEBS[id].r)}">${st.need[k] ? '✅' : '❌'} ${CELEBS[id].name}<small>${tr('r' + CELEBS[id].r)}</small></span>`).join('<em>+</em>')}</div>
      <div class="fu-row"><span>${tr('fuFee')}: $${fmt(r.fee)}</span><button data-fuse="${i}" class="${st.ok && near ? '' : 'no'} stroke">${st.has ? tr('fuGo') : tr('fuMissing')}</button></div></div>`;
  });
  document.getElementById('fuseBody').innerHTML = h;
}
function doFuse(i) {
  const r = RECIPES[i]; if (!r) return false;
  const st = fuseStatus(r);
  if (!st.ok || !nearFuse()) { Snd.play('error'); return false; }
  player.cash -= r.fee;
  const sameMut = st.need.every((c) => c.mut.id === st.need[0].mut.id) ? st.need[0].mut : MUTS[0];
  const slot = st.need[0].slot;
  for (const c of st.need) { clearSlot(c.slot); removeCeleb(c); }
  const nc = createCeleb(CELEBS[r.result], sameMut); placeCeleb(nc, slot, player); recordAlbum(nc);
  game.stats.fused = (game.stats.fused || 0) + 1;
  banner(tr('fused', { c: nc.def.name }), '#00ffd5'); Snd.play('legend'); setTimeout(() => Snd.play('win'), 350);
  for (let k = 0; k < 4; k++) burst(FUSE_POS.x, 4, FUSE_POS.z, 50, [0x00ffd5, 0xff00aa, 0xffe600, 0xffffff], 7, 9);
  ringFx(FUSE_POS.x, FUSE_POS.z, 0x00ffd5, 8); game.shake = 0.5;
  closeModal(); queueSave();
  return true;
}
document.getElementById('fuseBody').addEventListener('pointerdown', (e) => { const b = e.target.closest('[data-fuse]'); if (b) { e.preventDefault(); doFuse(+b.dataset.fuse); } });

// ---------- prestige (after Rebirth 10) ----------
const PRESTIGE_TITLES = ['Starville Legend', 'Hall of Famer', 'Living Icon', 'Galaxy Mogul', 'Eternal Superstar', 'Ultimate Tycoon', 'Mythic Mogul', 'Star Emperor'];
const prestigeTitle = (p) => p <= 0 ? '' : PRESTIGE_TITLES[Math.min(p, PRESTIGE_TITLES.length) - 1] + (p > PRESTIGE_TITLES.length ? ' ' + (p - PRESTIGE_TITLES.length + 1) : '');
const prestigeCash = (p = game.prestige) => 25e9 * Math.pow(4, p);
function prestigeStatus() {
  const hasCash = player.cash >= prestigeCash();
  const hasEx = celebs.some((c) => c.owner === player && c.def.r === 6 && (c.state === 'placed' || c.state === 'moving'));
  return { hasCash, hasEx, ok: game.rebirth >= REBIRTHS.length && hasCash && hasEx };
}
function applyPrestigeLook() {
  const gold = game.prestige > 0;
  playerDecoMat.color.set(gold ? 0xffe28a : 0xffffff); playerDecoMat.emissive.set(gold ? 0x3a2a00 : 0x000000);
}
function doPrestige() {
  const st = prestigeStatus(); if (!st.ok) { Snd.play('error'); return; }
  if (!game.rebirthConfirm) { game.rebirthConfirm = true; renderRebirth(); return; }
  game.rebirthConfirm = false;
  game.prestige++;
  resetAgency(); applyPrestigeLook(); closeModal();
  banner(tr('pDone', { n: game.prestige, title: prestigeTitle(game.prestige) }), '#ffd84d');
  Snd.play('legend'); setTimeout(() => Snd.play('win'), 400); game.shake = 0.7;
  for (let i = 0; i < 8; i++) burst(player.pos.x + rand(-5, 5), 3, player.pos.z + rand(-5, 5), 50, [0xffd84d, 0xffffff, 0xffb703]);
  doSave();
}

// ---------- rearranging podiums ----------
function startMove(c) {
  if (!c || c.owner !== player || c.state !== 'placed' || player.carrying || player.moveCeleb) return false;
  player.moveCeleb = c; c.state = 'moving'; c.p.root.scale.setScalar(c.baseScale * 0.8);
  if (c.slot.label) c.slot.label.sprite.visible = false;
  Snd.play('pop'); return true;
}
function endMove(slot) {
  const c = player.moveCeleb; if (!c) return;
  player.moveCeleb = null; c.p.root.scale.setScalar(c.baseScale);
  const from = c.slot;
  if (slot && slot !== from) {
    const other = slot.celeb;
    if (other && other !== c) {
      if (other.owner !== player || other.state !== 'placed') { placeCeleb(c, from, player); return; }
      placeCeleb(other, from, player);
    } else clearSlot(from);
    placeCeleb(c, slot, player);
    floatText(tr('moved'), c.pos.x, c.pos.y + 3, c.pos.z, '#ffe14d'); burst(c.pos.x, c.pos.y + 1, c.pos.z, 20); Snd.play('pop'); queueSave();
  } else placeCeleb(c, from, player);
}

// ---------- stairs (player agency, alongside the elevator) ----------
// A straight stair runs along the left wall from z'=0 (bottom) to z'=-6 (top), one per floor gap.
const STAIR_X0 = -10.6, STAIR_X1 = -9.0, STAIR_LEN = 6;
function buildStairs(b, k) {
  const g = new THREE.Group(), deco = new THREE.Group(); g.add(deco);
  const steps = 12, y0 = k * FH + 0.12, rise = FH / steps, run = STAIR_LEN / steps;
  const stepM = toon(0xf4f0ff), edgeM = toon(lighten(b.owner.color, 0.1)), chrome = toon(0xd8dde6);
  for (let i = 0; i < steps; i++) {
    const p = b.local((STAIR_X0 + STAIR_X1) / 2, -(i + 0.5) * run), top = y0 + (i + 1) * rise;
    M(boxG(1.55, 0.24, +(run + 0.04).toFixed(2)), stepM, p.x, top - 0.12, p.z, deco);
    M(boxG(1.56, 0.05, 0.08), edgeM, p.x, top + 0.005, b.local(0, -i * run - 0.04).z, deco);
    if (i % 3 === 0) { const q = b.local(STAIR_X1 + 0.05, -(i + 0.5) * run); M(cylG(0.04, 0.04, 1.0, 6), chrome, q.x, top + 0.5, q.z, deco); }
  }
  const ang = b.f * Math.atan2(FH, STAIR_LEN), len = Math.hypot(FH, STAIR_LEN);
  const mid = b.local(STAIR_X1 + 0.05, -STAIR_LEN / 2), midS = b.local((STAIR_X0 + STAIR_X1) / 2, -STAIR_LEN / 2);
  const rail = M(boxG(0.07, 0.07, +len.toFixed(2)), chrome, mid.x, y0 + FH / 2 + 1.0, mid.z, deco); rail.rotation.x = ang;
  const str = M(boxG(1.5, 0.3, +len.toFixed(2)), edgeM, midS.x, y0 + FH / 2 - 0.3, midS.z, deco); str.rotation.x = ang;
  mergeGroup(deco, null, playerDecoMat);
  return g;
}
function addStairColliders(b) {
  for (let n = 0; n <= 4; n++) {
    const a = b.local(STAIR_X1 - 0.05, -5.8), c = b.local(STAIR_X1 + 0.05, -0.3);
    walls.push({ minX: Math.min(a.x, c.x), maxX: Math.max(a.x, c.x), minZ: Math.min(a.z, c.z), maxZ: Math.max(a.z, c.z), floor: n, needFloors: n === 0 ? 1 : 0 });
  }
  const a = b.local(STAIR_X0 - 0.1, -6.25), c = b.local(STAIR_X1, -6.05);
  walls.push({ minX: Math.min(a.x, c.x), maxX: Math.max(a.x, c.x), minZ: Math.min(a.z, c.z), maxZ: Math.max(a.z, c.z), floor: 0, needFloors: 1 });
}
function updateStairs(P) {
  const b = P.base; if (!b.floors) return;
  const lx = P.pos.x - b.cx, lz = (P.pos.z - b.cz) * b.f, u = game.fu || 0;
  if (P.stair != null) {
    P.pos.x = b.cx + clamp(lx, STAIR_X0 + 0.4, STAIR_X1 - 0.4);
    if (lz > 0.35) { P.floor = P.stair; P.stair = null; }
    else if (lz < -STAIR_LEN - 0.3) { P.floor = P.stair + 1; P.stair = null; elevFx(P, P.floor); mission('floor'); }
    else P.pos.y = P.stair * FH + 0.12 + clamp(-lz / STAIR_LEN, 0, 1) * FH;
    return;
  }
  if (!(lx > STAIR_X0 - 0.05 && lx < STAIR_X1 + 0.05) || !inside(b, P.pos.x, P.pos.z)) return;
  const fl = P.floor || 0;
  if (lz <= 0.2 && lz >= -0.45 && u >= fl + 1) P.stair = fl;
  else if (fl >= 1 && lz <= -STAIR_LEN + 0.3 && lz >= -STAIR_LEN - 0.2) { P.stair = fl - 1; P.floor = fl - 1; }
}

// ---------- pause menu ----------
function renderPause() {
  const langBtns = Object.entries(LANGS).map(([code, name]) => `<button data-lang="${code}" class="${getLang() === code ? 'on' : ''}">${name}</button>`).join('');
  document.getElementById('pauseBody').innerHTML = `
    <button id="paResume" class="pa-big stroke">${tr('resume')}</button>
    <button id="paHow" class="pa-big stroke" style="background:linear-gradient(180deg,#ffd84d,#ff9d00)">${tr('howTo')}</button>
    <div class="pa-row"><span>🔊 ${tr('sound')}</span><button id="paSound" class="${game.soundOn ? 'on' : ''}">${game.soundOn ? tr('on') : tr('off')}</button></div>
    <div class="pa-row col"><span>🌐 ${tr('language')}</span><div class="pa-langs">${langBtns}</div></div>
    <div class="pa-row col"><span>🎮 ${tr('controls')}</span><small>${isTouch ? tr('ctrlTouch') : tr('ctrlKeys')}</small></div>
    <p class="pa-fine">${tr('fine')}</p>`;
}
document.getElementById('pauseBody').addEventListener('pointerdown', (e) => {
  const t0 = e.target.closest('button'); if (!t0) return; e.preventDefault();
  if (t0.id === 'paResume') { closeModal(); return; }
  if (t0.id === 'paHow') { openHowTo(0); return; }
  if (t0.id === 'paSound') { game.soundOn = !game.soundOn; Snd.apply(); queueSave(); renderPause(); return; }
  if (t0.dataset.lang) { game.lang = t0.dataset.lang; setLang(game.lang); applyLangUI(); queueSave(); renderPause(); }
});


// ---------- screen fitting: UI scale + camera framing for every device ----------
let uiScale = 1;
function computeUiScale() {
  const w = innerWidth, h = innerHeight, short = Math.min(w, h);
  let u;
  if (isTouch) {
    u = short >= 600 ? clamp(short / 600, 1.15, 1.3)      // tablets: 1.15-1.3
      : clamp(Math.min(w, h) / 395, 0.74, 1.12);            // phones: follow screen width
    if (h < 500 && w > h) u = clamp(h / 420, 0.78, 1.05); // landscape phones
  } else {
    u = clamp(Math.min(w / 1280, h / 760), 0.8, 1.4);  // desktop / laptop windows
  }
  uiScale = u;
  document.documentElement.style.setProperty('--u', u.toFixed(3));
  document.documentElement.style.setProperty('--pu', clamp(u, 1, 1.25).toFixed(3));
  document.body.classList.toggle('portrait', h > w * 1.1);
  document.body.classList.toggle('short', h < 500 && w > h);
  document.body.classList.toggle('phone', isTouch && short < 600);
  requestAnimationFrame(() => { if (el && el.hint) placeHint(); else placeFeed(); });
}
function placeFeed() {
  const lc = document.getElementById('leftCol'); if (!lc) return;
  const r = lc.getBoundingClientRect();
  if (r.height) document.documentElement.style.setProperty('--feedTop', Math.round(r.bottom + 10) + 'px');
}
function fitCamera() {
  const w = innerWidth, h = innerHeight, aspect = w / h;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w * h > 1.6e6 ? 1.5 : 2));
  renderer.setSize(w, h);
  camera.aspect = aspect;
  // keep roughly the same horizontal view on wide and tall screens
  const hfov = 74 * Math.PI / 180;
  camera.fov = clamp(2 * Math.atan(Math.tan(hfov / 2) / aspect) * 180 / Math.PI, 50, 80);
  camera.updateProjectionMatrix();
}

// ---------- How to Play ----------
const HOWTO_ART = ['🟥 🚶‍♀️ 🛒 ⭐', '💰 🏛️ 💵', '😈 🏃‍♂️ 🌟', '🔒 ⚡ 📸', '🛒 ♻️ 🛗', '📖 🧪 💎', '🔥 📋 👑', '🕹️ 👆'];
let howtoPage = 0, howtoAfter = [];
function renderHowTo() {
  const n = HOWTO_ART.length, i = howtoPage, last = i === n - 1;
  const text = i === n - 1 ? (isTouch ? tr('ctrlTouch') : tr('ctrlKeys')) : tr('ht' + (i + 1));
  document.getElementById('howtoBody').innerHTML = `
    <h2 class="stroke">${tr('howTo')}</h2>
    <div class="ht-step">${tr('htStep', { n: i + 1, m: n })}</div>
    <div class="ht-art">${HOWTO_ART[i]}</div>
    <div class="ht-t stroke">${tr('ht' + (i + 1) + 't')}</div>
    <p class="ht-x">${text}</p>
    <div class="ht-dots">${HOWTO_ART.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
    <div class="ht-nav">
      ${i > 0 ? `<button data-ht="back" class="stroke">${tr('htBack')}</button>` : `<button data-ht="skip" class="skip">${tr('htSkip')}</button>`}
      <button data-ht="${last ? 'done' : 'next'}" class="go stroke">${last ? tr('htGo') : tr('htNext')}</button>
    </div>`;
}
function openHowTo(page = 0) { howtoPage = page; openModal('howto'); }
function finishHowTo() {
  game.seenHowTo = true; queueSave();
  if (activeModal === 'howto') closeModal();
  const later = howtoAfter; howtoAfter = [];
  for (const fn of later) queuePopup(fn);
}
document.getElementById('howtoBody').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('[data-ht]'); if (!b) return; e.preventDefault();
  const a = b.dataset.ht;
  if (a === 'next') { howtoPage = Math.min(HOWTO_ART.length - 1, howtoPage + 1); renderHowTo(); Snd.play('pop'); }
  else if (a === 'back') { howtoPage = Math.max(0, howtoPage - 1); renderHowTo(); Snd.play('pop'); }
  else { finishHowTo(); Snd.play('win'); }
});

// ---------- language ----------
function applyLangUI() {
  document.documentElement.lang = getLang();
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.innerHTML = tr(n.dataset.i18n); });
  const kh = document.getElementById('keysHint'); if (kh) kh.textContent = tr('ctrlKeys');
  refreshTitleText();
  for (const draw of i18nSprites) draw();
  for (const b of bases) { b.signKey = ''; drawSign(b); }
  for (const c of celebs) drawCelebLabel(c);
  updateNameTag();
  if (game.playing) showTutHint();
  if (activeModal && MODAL_RENDER[activeModal]) MODAL_RENDER[activeModal]();
}

// ---------- menu bar badges ----------
function updateMenuBar() {
  const rs = rebirthStatus(), ps = rs.max ? prestigeStatus() : null;
  const rb = document.getElementById('btnRebirth');
  rb.classList.toggle('ready', !!(rs.ok || (ps && ps.ok)));
  rb.querySelector('b').textContent = rs.max ? '👑' + game.prestige : String(game.rebirth);
  document.getElementById('btnMissions').classList.toggle('ready', missionsClaimable());
  document.getElementById('btnAlbum').querySelector('b').textContent = albumCount();
  document.getElementById('btnFuse').classList.toggle('ready', nearFuse() || RECIPES.some((r) => fuseStatus(r).ok));
}

// ---------------------------------------------------------------------
//  Boot
// ---------------------------------------------------------------------
let offlineEarned = 0;
function startGame() {
  if (game.playing || !game.loaded) return;
  game.playing = true;
  el.title.classList.add('hidden'); el.hud.classList.remove('hidden');
  const p = player.base.doorIn; player.floor = 0; player.pos.set(p.x, 0.12, p.z + 0.5); player.yaw = Math.PI; camYaw = 0;
  camTarget.set(player.pos.x, 1.6, player.pos.z);
  if (!game.seenHowTo) openHowTo(0);
  if (offlineEarned > 0) queuePopup((box) => {
    box.innerHTML = `<h3 class="stroke">${tr('welcomeBack')}</h3><div>${tr('earnedAway')}</div><p class="stroke">+$${fmt(offlineEarned)}</p><button class="stroke" id="claimBtn">${tr('collect')}</button>`;
    bindBtn(box.querySelector('#claimBtn'), () => { player.cash += offlineEarned; game.stats.earned += offlineEarned; offlineEarned = 0; Snd.play('win'); burst(player.pos.x, 2, player.pos.z, 60); queueSave(); nextPopup(); });
  });
  updateStreakOnStart(); ensureMissions();
  if (streakReady()) queuePopup(streakPopup);
  showTutHint();
  feed(tr('welcome'));
  queueSave();
}
async function boot() {
  game.paps = []; game.beams = [];
  setLang(navigator.language);
  buildWorld();
  buildFuseLab();
  player = createAgent({ id: 0, name: 'You', color: 0x2ee6d6, isPlayer: true, look: { skin: 0xf1c27d, hair: 0x3b2314, hairStyle: 'short', top: 0x2ee6d6, bottom: 0x22313f, shoes: 0xffffff, acc: ['cap', 'camera'], capColor: 0xff3355 } });
  player.flashCd = 0;
  makeBase(0, BASE_DEFS[0], player);
  const dp = player.base.doorIn; player.pos.set(dp.x, 0.12, dp.z);
  refreshPlayerPodiums();
  // fill the carpet so the world feels alive immediately
  for (let x = CARPET_X0 + 2; x < CARPET_X1 - 4; x += rand(5, 7)) spawnCarpetCeleb(x, Math.random() < 0.92 ? null : 3);
  onResize();
  requestAnimationFrame(frame);
  const data = await SDK.load();
  offlineEarned = applySave(data);
  setLang(game.lang || await SDK.lang()); applyLangUI();
  if (!data) player.cash = 100;
  setupBots();
  game.loaded = true;
  el.play.disabled = false;
  refreshTitleText();
  SDK.ready();
}
boot();
// test hook (only with ?debug)
if (location.search.includes('debug')) window.__sh = { spawnCarpetCeleb, goatArrival, botRebirth, botCanRebirth, openHowTo, finishHowTo, computeUiScale, get uiScale() { return uiScale; }, RECIPES, LIMITED_IDS, EXCLUSIVE_IDS, recordAlbum, mission, ensureMissions, claimStreak, doFuse, doPrestige, startMove, endMove, openModal, closeModal, applyLangUI, setLang, tr, featuredId, limitedId, playerSlots, refreshFloors, freeSlot, updateFloorVisibility, toggleRebirth, doRebirth, rebirthStatus, CELEBS, scene, camera, renderer, glassMat2, personMat, forceAdmin(minutes = 30) { game.event = null; game.adminForceUntil = Date.now() + minutes * 60e3; updateEvents(0.016); }, game, get player() { return player; }, bots, celebs, bases, update, buy, grab, doFlash, lockBase, deliver, sell, startGame };
