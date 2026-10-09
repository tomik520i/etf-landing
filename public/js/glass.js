/* Visual-only glass optics, shared by the landing page, document and admin. */
const panels = [...document.querySelectorAll('.card, .kpi')];
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const pointer = matchMedia('(hover: hover) and (pointer: fine)');
const contrast = matchMedia('(prefers-contrast: more)');
const transparency = matchMedia('(prefers-reduced-transparency: reduce)');
const visible = new Set(panels);
let frame = 0;
let active = null;
let point = null;

function reset(panel) {
  panel.classList.remove('glass-active');
  for (const key of ['--rx', '--ry', '--mx', '--my']) panel.style.removeProperty(key);
}

function paint() {
  frame = 0;
  const w = innerWidth, h = innerHeight;
  const zoom = 1.055;
  const cover = Math.max(w / 1600, h / 1100);
  const aw = 1600 * cover * zoom, ah = 1100 * cover * zoom;
  const mobile = w < 900;
  // Reproject the same scene into the thin rim with a slightly larger optical
  // scale. Only the background is displaced; text and controls stay untouched.
  for (const panel of visible) {
    const r = panel.getBoundingClientRect();
    panel.style.setProperty('--lens-size', `${w * zoom}px ${h * zoom}px, ${aw}px ${ah}px`);
    const x = -(aw - w) * (mobile ? .61 : .5) - r.left;
    panel.style.setProperty('--lens-position', `${-r.left - w * .0275}px ${-r.top}px, ${x}px ${-r.top}px`);
    panel.classList.add('glass-optics');
  }
  if (!active || !point || motion.matches || !pointer.matches) return;
  const r = active.getBoundingClientRect();
  const x = Math.max(0, Math.min(1, (point.x - r.left) / r.width));
  const y = Math.max(0, Math.min(1, (point.y - r.top) / r.height));
  // Limit displacement by panel size instead of giving small funds extra tilt.
  const ax = Math.min(1.5, 75 / r.height), ay = Math.min(1.5, 75 / r.width);
  active.style.setProperty('--rx', `${((.5 - y) * 2 * ax).toFixed(3)}deg`);
  active.style.setProperty('--ry', `${((x - .5) * 2 * ay).toFixed(3)}deg`);
  active.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
  active.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
}
function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
for (const panel of panels) {
  panel.addEventListener('pointermove', (event) => {
    if (event.pointerType === 'touch' || !pointer.matches || motion.matches || contrast.matches || transparency.matches) return;
    // Keep form controls steady while the user enters or adjusts a value.
    if (panel.contains(document.activeElement) && document.activeElement.matches('input, select, textarea')) return;
    active = panel;
    point = { x: event.clientX, y: event.clientY };
    panel.classList.add('glass-active');
    schedule();
  });
  panel.addEventListener('pointerleave', () => {
    reset(panel);
    if (active === panel) { active = null; point = null; }
    schedule();
  });
  panel.addEventListener('focusin', () => { reset(panel); active = null; point = null; });
}
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (isIntersecting) visible.add(target); else visible.delete(target);
    }
    schedule();
  }, { rootMargin: '80px' });
  panels.forEach(panel => observer.observe(panel));
}
if ('ResizeObserver' in window) {
  const observer = new ResizeObserver(schedule);
  panels.forEach(panel => observer.observe(panel));
}
for (const query of [motion, pointer, contrast, transparency]) query.addEventListener('change', () => {
  panels.forEach(reset); active = null; point = null; schedule();
});
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });
addEventListener('blur', () => { panels.forEach(reset); active = null; point = null; });
schedule();
