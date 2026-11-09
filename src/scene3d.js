import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const FONT = "'Bricolage Grotesque', system-ui, sans-serif";
const DOW = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const pad = (n) => String(n).padStart(2, '0');
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const DIGIT_COLORS = ['#8e4ec6','#e5484d','#f76b15','#f5a524','#30a46c','#12a594','#3e63dd','#0090ff','#d6409f','#6f6f6f'];
const ballColor = (n) => (n <= 10 ? '#e5484d' : n <= 20 ? '#3e63dd' : n <= 30 ? '#30a46c' : n <= 42 ? '#f5a524' : '#8e4ec6');

function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const v = (k) => cs.getPropertyValue(k).trim();
  return { bg: v('--bg'), card: v('--card'), ink: v('--ink'), muted: v('--muted'), line: v('--line'), accent: v('--accent'), accentInk: v('--accent-ink') };
}

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

// Returns null when WebGL is not available so the caller can fall back to the list view.
export function createStage(host, { onPick }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    if (!renderer.getContext()) throw new Error('no context');
  } catch {
    return null;
  }
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 300);
  camera.position.set(0, 12, 18);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI * 0.47;
  // Let a vertical swipe scroll the page on touch screens; horizontal drag and pinch still drive the scene.
  renderer.domElement.style.touchAction = 'pan-y';

  let theme = readTheme();
  let env = null;
  let content = null;
  let last = null;
  let layoutKey = '';
  let tween = null;
  let highlight = null;
  let needs = true;
  let built = false;

  const ballGeo = new THREE.SphereGeometry(0.36, 36, 24);
  const matCache = new Map();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  function ballMaterial(n, digit = false) {
    const key = digit ? `d${n}` : n;
    if (matCache.has(key)) return matCache.get(key);
    const [c, x] = canvas(512, 256);
    x.fillStyle = digit ? DIGIT_COLORS[n] : ballColor(n);
    x.fillRect(0, 0, 512, 256);
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    for (const cx of [128, 384]) {
      x.fillStyle = '#ffffff';
      x.beginPath();
      x.arc(cx, 128, 66, 0, Math.PI * 2);
      x.fill();
      x.fillStyle = '#10162a';
      x.font = `800 82px ${FONT}`;
      x.fillText(digit ? String(n) : pad(n), cx, 134);
    }
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAniso;
    const m = new THREE.MeshStandardMaterial({ map, roughness: 0.22, metalness: 0.04, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0 });
    m.userData = { num: n, digit };
    matCache.set(key, m);
    return m;
  }

  function clearBallCache() {
    for (const m of matCache.values()) {
      m.map.dispose();
      m.dispose();
    }
    matCache.clear();
  }

  function label(lines, track, labelW = 3.4) {
    const [c, x] = canvas(512, 200);
    x.textAlign = 'center';
    x.textBaseline = 'alphabetic';
    let size = 96;
    x.font = `800 ${size}px ${FONT}`;
    while (x.measureText(lines[0]).width > 470 && size > 40) {
      size -= 4;
      x.font = `800 ${size}px ${FONT}`;
    }
    x.fillStyle = theme.ink;
    x.fillText(lines[0], 256, 112);
    x.font = `600 46px ${FONT}`;
    x.fillStyle = theme.muted;
    x.fillText(lines[1], 256, 170);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAniso;
    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, opacity: 0 });
    const s = new THREE.Sprite(mat);
    s.center.set(0.5, 0);
    s.scale.set(labelW, (labelW * 200) / 512, 1);
    track.push(map, mat);
    return s;
  }

  function datePlate(dow, day, track) {
    const [c, x] = canvas(256, 128);
    x.textAlign = 'center';
    x.fillStyle = theme.accentInk;
    x.globalAlpha = 0.85;
    x.font = `700 34px ${FONT}`;
    x.textBaseline = 'alphabetic';
    x.fillText(dow, 128, 38);
    x.globalAlpha = 1;
    x.font = `800 82px ${FONT}`;
    x.fillText(String(day), 128, 112);
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = maxAniso;
    const mat = new THREE.MeshBasicMaterial({ map, transparent: true });
    track.push(map, mat);
    return mat;
  }

  // ---------- environment: light, floor shadow, blueprint grid ----------
  function buildEnv() {
    const g = new THREE.Group();
    const hemi = new THREE.HemisphereLight('#ffffff', theme.bg, 1.25);
    const fill = new THREE.DirectionalLight('#ffffff', 0.7);
    fill.position.set(-4, 5, 16);
    const sun = new THREE.DirectionalLight('#ffffff', 1.35);
    sun.position.set(3, 18, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -18;
    sun.shadow.camera.right = 18;
    sun.shadow.camera.top = 18;
    sun.shadow.camera.bottom = -18;
    sun.shadow.camera.far = 60;
    sun.shadow.bias = -0.0005;
    sun.shadow.radius = 4;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShadowMaterial({ opacity: 0.15 }));
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    const grid = new THREE.GridHelper(60, 60, theme.line, theme.line);
    grid.position.y = 0.002;
    grid.material.transparent = true;
    grid.material.opacity = 0.7;
    g.add(hemi, fill, sun, floor, grid);
    return g;
  }

  function disposeGroup(group) {
    if (!group) return;
    group.traverse((o) => {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
    });
  }

  function setEnv() {
    if (env) {
      scene.remove(env);
      disposeGroup(env);
    }
    env = buildEnv();
    scene.add(env);
  }

  // ---------- content builders ----------
  function buildTowers(items, cols, o = {}) {
    const group = new THREE.Group();
    const track = [];
    const targets = [];
    const entries = [];
    const size = o.size ?? 1.6;
    const pitch = o.pitch ?? 2.35;
    const rowPitch = o.rowPitch ?? 3.3;
    const maxTower = o.maxH ?? 3.3;
    const el = o.el ?? 34;
    const labelW = o.labelW ?? 3.4;
    const lo = Math.min(...items.map((i) => i.count));
    const rows = Math.ceil(items.length / cols);
    const max = Math.max(1, ...items.map((i) => i.count));
    const geo = new THREE.BoxGeometry(size, 1, size);
    track.push(geo);
    const empty = new THREE.Color(theme.line);
    const full = new THREE.Color(theme.accent);
    const t0 = performance.now();
    let maxH = 0.5;
    items.forEach((it, i) => {
      const c = i % cols;
      const r = Math.floor(i / cols);
      const ratio = it.count / max;
      const rel = max === lo ? 1 : (it.count - lo) / (max - lo);
      const h = it.count ? 0.5 + ratio * maxTower : 0.16;
      maxH = Math.max(maxH, h);
      const mat = new THREE.MeshStandardMaterial({
        color: empty.clone().lerp(full, it.count ? 0.45 + 0.55 * (o.relative ? rel : ratio) : 0),
        roughness: 0.5,
        metalness: 0.08,
        emissive: new THREE.Color(theme.accent),
        emissiveIntensity: 0,
      });
      track.push(mat);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.shared = true;
      const lab = label([it.title, it.sub], track, labelW);
      const x = (c - (cols - 1) / 2) * pitch;
      const z = (r - (rows - 1) / 2) * rowPitch;
      mesh.position.set(x, 0, z);
      lab.position.set(x, 0, z);
      group.add(mesh, lab);
      const e = { item: it, mesh, lab, h, lift: 0.15 + (size / 2) * Math.tan(THREE.MathUtils.degToRad(el)), delay: i * 55, t0, hover: 0, target: 0 };
      mesh.userData.entry = e;
      lab.userData.entry = e;
      entries.push(e);
      targets.push(mesh, lab);
    });
    const width = (cols - 1) * pitch + size;
    const depth = (rows - 1) * rowPitch + size;
    return {
      kind: 'towers',
      group,
      track,
      targets,
      entries,
      box: { w: Math.max(width + 0.6, o.minW ?? 0), d: depth, h: maxH + 2.0, el },
      update(now) {
        let active = false;
        for (const e of entries) {
          const p = reduce() ? 1 : ease(clamp01((now - e.t0 - e.delay) / 650));
          if (p < 1) active = true;
          e.hover += (e.target - e.hover) * 0.22;
          if (Math.abs(e.target - e.hover) > 0.004) active = true;
          else e.hover = e.target;
          const sy = Math.max(0.001, e.h * p);
          const sc = 1 + 0.07 * e.hover;
          e.mesh.scale.set(sc, sy, sc);
          e.mesh.position.y = sy / 2;
          e.mesh.material.emissiveIntensity = 0.45 * e.hover;
          e.lab.position.y = sy + e.lift + 0.25 * e.hover;
          e.lab.material.opacity = p;
        }
        return active;
      },
    };
  }

  function buildDays(items, cols) {
    const group = new THREE.Group();
    const track = [];
    const targets = [];
    const entries = [];
    const balls = [];
    const digit = items.some((it) => it.digit);
    const grpSet = items[0]?.group; // balls per draw time (Swertres 3, 4D 4, 2D 2); unset for plain lotto
    const grp = grpSet || 3;
    const nBalls = digit || grpSet ? Math.max(...items.map((it) => it.nums.length)) : 0;
    const W = digit ? 1.9 + 0.3 + 0.8 * nBalls + 0.5 * (Math.ceil(nBalls / grp) - 1) + 0.5
      : grpSet ? 1.9 + 0.3 + 0.88 * nBalls + 0.5 * (Math.ceil(nBalls / grp) - 1) + 0.5 : 7.6;
    const D = 1.0;
    const TH = 0.24;
    const PLATE = 1.9;
    const R = 0.36;
    const pitchZ = 1.4;
    const colGap = 1.3;
    const perCol = Math.max(1, Math.ceil(items.length / cols));
    const totalW = cols * W + (cols - 1) * colGap;
    const slabGeo = new THREE.BoxGeometry(W, TH, D);
    const plateGeo = new THREE.BoxGeometry(PLATE, TH + 0.04, D + 0.06);
    const planeGeo = new THREE.PlaneGeometry(PLATE - 0.1, (PLATE - 0.1) / 2);
    track.push(slabGeo, plateGeo, planeGeo);
    const slabMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(theme.card).lerp(new THREE.Color(theme.line), 0.12), roughness: 0.6 });
    const plateMat = new THREE.MeshStandardMaterial({ color: theme.accent, roughness: 0.45, metalness: 0.1 });
    track.push(slabMat, plateMat);
    const t0 = performance.now();
    items.forEach((it, i) => {
      const c = Math.floor(i / perCol);
      const r = i % perCol;
      const row = new THREE.Group();
      row.position.set(-totalW / 2 + c * (W + colGap) + W / 2, 0, (r - (perCol - 1) / 2) * pitchZ);
      const e = { item: it, row, delay: i * 45, t0, hover: 0, target: 0 };

      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.y = TH / 2;
      slab.receiveShadow = true;
      slab.castShadow = true;
      slab.userData = { shared: true, entry: e };
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(-W / 2 + PLATE / 2, (TH + 0.04) / 2, 0);
      plate.castShadow = true;
      plate.userData = { shared: true, entry: e };
      const txt = new THREE.Mesh(planeGeo, datePlate(it.dow, it.day, track));
      txt.rotation.x = -Math.PI / 2;
      txt.position.set(-W / 2 + PLATE / 2, TH + 0.045, 0);
      txt.userData = { shared: true, entry: e };
      row.add(slab, plate, txt);
      targets.push(slab, plate, txt);

      it.nums.forEach((n, k) => {
        if (n === null || n === undefined) return;
        const b = new THREE.Mesh(ballGeo, ballMaterial(n, digit));
        b.rotation.order = 'YXZ';
        b.rotation.x = -0.6;
        b.position.set(-W / 2 + PLATE + 0.3 + R + (digit ? k * 0.8 + Math.floor(k / grp) * 0.5 : k * 0.88 + (grpSet ? Math.floor(k / grp) * 0.5 : 0)), TH + R, 0);
        b.castShadow = true;
        b.userData = { shared: true, entry: e, num: n, digit };
        row.add(b);
        targets.push(b);
        balls.push(b);
      });
      group.add(row);
      entries.push(e);
    });
    return {
      kind: 'days',
      group,
      track,
      targets,
      entries,
      balls,
      box: { w: totalW, d: (perCol - 1) * pitchZ + D, h: 1.2, el: 50 },
      update(now) {
        let active = false;
        const az = controls.getAzimuthalAngle();
        for (const e of entries) {
          const p = reduce() ? 1 : ease(clamp01((now - e.t0 - e.delay) / 600));
          if (p < 1) active = true;
          e.hover += (e.target - e.hover) * 0.22;
          if (Math.abs(e.target - e.hover) > 0.004) active = true;
          else e.hover = e.target;
          e.row.position.y = (1 - p) * 3 + 0.18 * e.hover;
        }
        for (const b of balls) {
          b.rotation.y = az;
          const on = highlight === b.userData.num;
          b.scale.setScalar(on ? 1.22 : 1);
        }
        return active;
      },
    };
  }

  // ---------- camera ----------
  function fitTarget(box, aspect, az = 0) {
    const el = THREE.MathUtils.degToRad(box.el);
    const vf = THREE.MathUtils.degToRad(camera.fov);
    const hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const projH = box.h * Math.cos(el) + box.d * Math.sin(el);
    const dH = projH / 2 / Math.tan(vf / 2);
    const dW = box.w / 2 / Math.tan(hf / 2);
    const dist = Math.max(dH, dW) * 1.12 + (box.d / 2) * Math.cos(el);
    const target = new THREE.Vector3(0, box.h * 0.42, 0);
    const pos = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(dist).add(target);
    return { dist, target, pos };
  }

  function flyTo(fit, instant) {
    controls.minDistance = fit.dist * 0.3;
    controls.maxDistance = fit.dist * 1.8;
    if (instant || reduce()) {
      camera.position.copy(fit.pos);
      controls.target.copy(fit.target);
      tween = null;
    } else {
      tween = { t0: performance.now(), dur: 900, fp: camera.position.clone(), ft: controls.target.clone(), tp: fit.pos, tt: fit.target };
    }
    needs = true;
  }

  // ---------- show / rebuild ----------
  function size() {
    return { w: host.clientWidth, h: host.clientHeight };
  }

  function currentLayoutKey(level) {
    const { w, h } = size();
    return `${level}:${w / h > 1.3 ? 'wide' : 'narrow'}`;
  }

  function build(animateCamera) {
    if (!last) return;
    const { w, h } = size();
    if (!w || !h) return;
    const wide = w / h > 1.3;
    layoutKey = currentLayoutKey(last.level);
    if (content) {
      scene.remove(content.group);
      for (const t of content.track) t.dispose?.();
    }
    if (last.level === 'years') content = wide || last.items.length <= 4 ? buildTowers(last.items, last.items.length, last.items.length <= 4 ? { size: 2, pitch: 3.4, maxH: 3.6, minW: 15 } : {}) : buildTowers(last.items, Math.ceil(last.items.length / 2), { pitch: 2.5, rowPitch: 4.7, maxH: 2.2, el: 50, labelW: 3.0 });
    else if (last.level === 'months') content = buildTowers(last.items, wide ? 4 : 3, { size: 1.7, pitch: 2.75, rowPitch: 3.7, maxH: 1.5, el: 52, labelW: 2.7, relative: true });
    else content = buildDays(last.items, wide && last.items.length > 7 && !last.items.some((it) => it.digit || it.group) ? 2 : 1);
    scene.add(content.group);
    controls.maxAzimuthAngle = content.kind === 'days' ? 1.1 : Infinity;
    controls.minAzimuthAngle = content.kind === 'days' ? -1.1 : -Infinity;
    flyTo(fitTarget(content.box, w / h), !built || !animateCamera);
    built = true;
    needs = true;
  }

  function fitCanvas() {
    const { w, h } = size();
    if (!w || !h) return false;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needs = true;
    return true;
  }

  function resize() {
    if (fitCanvas() && last && (!content || layoutKey !== currentLayoutKey(last.level))) build(false);
  }

  // ---------- pointer interaction ----------
  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  function hitAt(e) {
    if (!content) return null;
    const r = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObjects(content.targets, false)[0];
    return hit ? hit.object : null;
  }
  function setHover(obj) {
    const entry = obj?.userData.entry || null;
    if (hovered && hovered !== entry) hovered.target = 0;
    hovered = entry;
    if (entry) entry.target = 1;
    const clickable = obj && (obj.userData.num != null || entry?.item?.pick);
    renderer.domElement.style.cursor = clickable ? 'pointer' : '';
    needs = true;
  }

  let down = null;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; });
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6;
    down = null;
    if (moved) return;
    const obj = hitAt(e);
    if (!obj) return;
    if (obj.userData.num != null) {
      highlight = highlight === obj.userData.num ? null : obj.userData.num;
      for (const m of matCache.values()) m.emissiveIntensity = highlight !== null && m.userData.num === highlight && m.userData.digit === !!obj.userData.digit ? 0.32 : 0;
      needs = true;
    } else if (obj.userData.entry?.item?.pick) onPick(obj.userData.entry.item.pick);
  });
  el.addEventListener('pointermove', (e) => { if (!e.buttons) setHover(hitAt(e)); });
  el.addEventListener('pointerleave', () => setHover(null));
  controls.addEventListener('change', () => { needs = true; });

  // ---------- loop ----------
  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (tween) {
      const p = ease(clamp01((now - tween.t0) / tween.dur));
      camera.position.lerpVectors(tween.fp, tween.tp, p);
      controls.target.lerpVectors(tween.ft, tween.tt, p);
      if (p >= 1) tween = null;
      needs = true;
    }
    if (content && content.update(now)) needs = true;
    if (controls.update()) needs = true;
    if (needs && host.clientWidth) {
      needs = false;
      renderer.render(scene, camera);
    }
  }

  function applyTheme() {
    theme = readTheme();
    clearBallCache();
    setEnv();
    if (last) build(false);
  }
  const mq = matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener('change', applyTheme);
  const ro = new ResizeObserver(resize);
  ro.observe(host);
  document.fonts?.ready.then(() => { if (last) applyTheme(); });

  setEnv();
  raf = requestAnimationFrame(frame);

  return {
    show(data) {
      highlight = null;
      for (const m of matCache.values()) m.emissiveIntensity = 0;
      last = data;
      setHover(null);
      fitCanvas();
      build(true);
    },
    resize,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mq.removeEventListener('change', applyTheme);
      controls.dispose();
      clearBallCache();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
