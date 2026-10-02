/* ============================================================================
   HOSHINO // 首屏 3D（Three.js）
   ----------------------------------------------------------------------------
   · 透视地面网格 + 粒子尘 + 悬浮线框核心（右侧空位）
   · 鼠标视差、滚动推进、主题联动、离屏暂停
   · 仅在「宽屏 + 支持 WebGL + 未开启减少动效」时按需加载（见 index.html 引导脚本）
   · 加载失败或不可用时，CSS 版背景层继续生效作为兜底
   ============================================================================ */
import * as THREE from "../vendor/three.module.min.js";

const hero = document.querySelector(".hero");
const canvas = document.getElementById("heroCanvas");

if (hero && canvas) {
  const CORE_NDC = { x: 0.55, y: -0.66 };   // 核心的目标屏幕位置（NDC）

  const readTheme = () => {
    const light = document.documentElement.getAttribute("data-theme") === "positive";
    return light
      ? { line: 0x6f7f0a, opacity: 1 }
      : { line: 0xd9ff00, opacity: 1 };
  };

  let theme = readTheme();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setClearAlpha(0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 120);
  camera.position.set(0, 1, 7.4);
  camera.lookAt(0, -0.2, 0);

  /* ---------------------------------------------------- 地面网格 */
  const grid = new THREE.GridHelper(52, 52, theme.line, theme.line);
  grid.material.transparent = true;
  grid.material.opacity = 0.2;
  grid.position.y = -2.4;
  scene.add(grid);

  /* ---------------------------------------------------- 悬浮线框核心 */
  const coreGroup = new THREE.Group();
  scene.add(coreGroup);

  const lineMat = (opacity) =>
    new THREE.LineBasicMaterial({ color: theme.line, transparent: true, opacity });

  const outerCore = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.42, 0)),
    lineMat(0.6)
  );
  const innerCore = new THREE.LineSegments(
    new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.24, 0)),
    lineMat(0.32)
  );
  coreGroup.add(outerCore, innerCore);

  const circleLine = (radius, opacity, segments = 90) => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, 0));
    }
    return new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(points),
      lineMat(opacity)
    );
  };

  const ringA = circleLine(0.68, 0.36);
  const ringB = circleLine(0.55, 0.22);
  ringA.rotation.set(Math.PI / 2.6, 0.3, 0);
  ringB.rotation.set(-Math.PI / 3.2, -0.5, 0.4);
  coreGroup.add(ringA, ringB);

  /* ---------------------------------------------------- 粒子尘 */
  const COUNT = 220;
  const positions = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 11;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(
    dustGeo,
    new THREE.PointsMaterial({
      color: theme.line,
      size: 0.035,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
    })
  );
  scene.add(dust);

  /* ---------------------------------------------------- 布局 */
  const coreBase = new THREE.Vector3();

  function visibleSize() {
    const vFov = (camera.fov * Math.PI) / 180;
    const h = 2 * Math.tan(vFov / 2) * camera.position.z;
    return { w: h * camera.aspect, h };
  }

  function placeCore() {
    const size = visibleSize();
    coreBase.set((CORE_NDC.x * size.w) / 2, (CORE_NDC.y * size.h) / 2, 0);
  }

  function resize() {
    // 用画布自身的布局尺寸，保证几何体不被拉伸
    const w = canvas.clientWidth || hero.clientWidth;
    const h = canvas.clientHeight || hero.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    placeCore();
  }

  resize();

  if ("ResizeObserver" in window) {
    new ResizeObserver(resize).observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }

  /* ---------------------------------------------------- 交互 */
  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };

  hero.addEventListener(
    "pointermove",
    (event) => {
      const rect = hero.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    },
    { passive: true }
  );

  hero.addEventListener("pointerleave", () => {
    pointer.x = 0;
    pointer.y = 0;
  });

  /* ---------------------------------------------------- 主题联动 */
  const themedMaterials = [
    grid.material,
    outerCore.material,
    innerCore.material,
    ringA.material,
    ringB.material,
    dust.material,
  ];

  function applyTheme() {
    theme = readTheme();
    themedMaterials.forEach((material) => material.color.setHex(theme.line));
  }

  new MutationObserver(applyTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  /* ---------------------------------------------------- 渲染循环 */
  let running = true;
  let visible = true;
  const clock = new THREE.Clock();

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(
      (entries) => {
        visible = entries[0].isIntersecting;
      },
      { threshold: 0 }
    ).observe(hero);
  }

  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
  });

  function frame() {
    requestAnimationFrame(frame);
    if (!running || !visible) return;

    const t = clock.getElapsedTime();

    // 鼠标视差
    eased.x += (pointer.x * 0.9 - eased.x) * 0.05;
    eased.y += (-pointer.y * 0.6 - eased.y) * 0.05;
    camera.position.x = eased.x;
    camera.position.y = 1 + eased.y;
    camera.lookAt(0, -0.2, 0);

    // 滚动推进（相机后退，核心保持在屏幕同一位置）
    const p = Math.min(
      (window.scrollY || window.pageYOffset) / Math.max(window.innerHeight, 1),
      1
    );
    camera.position.z = 7.4 + p * 1.8;
    const size = visibleSize();
    coreGroup.position.set(
      (CORE_NDC.x * size.w) / 2,
      (CORE_NDC.y * size.h) / 2 + Math.sin(t * 0.8) * 0.07,
      0
    );
    canvas.style.opacity = String(1 - p * 0.55);

    // 核心自转
    outerCore.rotation.y = t * 0.24;
    outerCore.rotation.x = Math.sin(t * 0.3) * 0.25;
    innerCore.rotation.y = -t * 0.42;
    ringA.rotation.z = t * 0.18;
    ringB.rotation.z = -t * 0.12;

    // 粒子缓移
    dust.rotation.y = t * 0.012;

    renderer.render(scene, camera);
  }

  frame();

  hero.classList.add("has-3d");
}
