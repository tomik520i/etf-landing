/* Liquid Glass Canvas 0.1.0: one GPU pass over the static background.
 * No DOM snapshots, pointer-driven layout writes, tilt, or idle render loop. */
const panels = [...document.querySelectorAll('.card, .kpi')];
const preferences = ['(prefers-reduced-motion: reduce)', '(prefers-reduced-transparency: reduce)', '(prefers-contrast: more)'].map(q => matchMedia(q));
let cleanup = null;
let generation = 0;

async function configure() {
  const version = ++generation;
  cleanup?.(); cleanup = null;
  if (!panels.length || preferences.some(q => q.matches)) return;
  let canvas, pass, gl, texture, image, source, ctx, observer;
  let frame = 0, resize = true, measure = true, boxes = [], stopped = false;
  // Stabilní velikost pozadí: na telefonu zasouvací lišta prohlížeče mění výšku okna (innerHeight),
  // plátno má ale výšku 100lvh – texturu přepočítáme jen při změně šířky nebo skutečné výšky plátna.
  let stableW = 0, stableH = 0;
  function stop() {
    stopped = true; cancelAnimationFrame(frame); observer?.disconnect();
    removeEventListener('scroll', schedule); removeEventListener('resize', onResize);
    document.removeEventListener('visibilitychange', schedule);
    canvas?.remove(); document.documentElement.classList.remove('webgl-glass');
    if (gl && !gl.isContextLost()) { pass?.destroy(); if (texture) gl.deleteTexture(texture); }
  }
  // výška plátna = 100lvh (CSS) – při zasunutí/vysunutí lišty se nemění, takže se textura nepřepočítává
  function onResize() { if ((canvas.clientWidth || innerWidth) !== stableW || (canvas.clientHeight || innerHeight) !== stableH) resize = true; measure = true; schedule(); }
  function schedule() { if (!stopped && !frame && !document.hidden) frame = requestAnimationFrame(draw); }
  function draw() {
    frame = 0;
    if (stopped) return;
    try {
      // šířka plátna bez posuvníku (innerWidth ho na desktopu zahrnuje → čočky by byly posunuté)
      const w = canvas.clientWidth || innerWidth;
      // Cap buffers at CSS resolution, including high-DPR phones.
      if (resize) {
        resize = false;
        stableW = w;
        stableH = canvas.clientHeight || innerHeight;
        const h = stableH;
        canvas.width = source.width = w; canvas.height = source.height = h;
        const scale = Math.max(w / 1600, h / 1100), mobile = w < 900;
        // Bake a little frost into the static texture once, not per frame.
        ctx.filter = 'blur(0.5px)';
        ctx.drawImage(image, (w - 1600 * scale) * (mobile ? .61 : .5), 0, 1600 * scale, 1100 * scale);
        ctx.filter = 'none';
        const shade = ctx.createLinearGradient(0, 0, w, 0);
        if (mobile) { shade.addColorStop(0, '#030919db'); shade.addColorStop(1, '#03091977'); }
        else { shade.addColorStop(0, '#030919c9'); shade.addColorStop(.58, '#03091935'); shade.addColorStop(1, '#03091908'); }
        ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
        gl.bindTexture(gl.TEXTURE_2D, texture); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        measure = true;
      }
      const h = stableH; // výška plátna a textury (stabilní), ne aktuální innerHeight
      if (measure) {
        measure = false;
        boxes = panels.map(panel => {
          const r = panel.getBoundingClientRect();
          return {x:r.left+scrollX, y:r.top+scrollY, width:r.width, height:r.height,
            radius:parseFloat(getComputedStyle(panel).borderTopLeftRadius)||30};
        });
      }
      const lenses = boxes.filter(r => r.y-scrollY < h && r.y+r.height-scrollY > 0).map(r => ({
        ...r, x:r.x-scrollX, y:r.y-scrollY,
        // Feather stays inside the normal field so displacement reaches zero
        // continuously at the interior instead of creating a cut-out seam.
        depth:36, feather:r.radius, curve:1.8, chroma:0.6, tint:[.06,.14,.23,.025], glint:.12,
      }));
      gl.clearColor(0,0,0,0); gl.clear(gl.COLOR_BUFFER_BIT);
      pass.render({sourceTexture:texture, resolution:[w,h], lenses});
      document.documentElement.classList.add('webgl-glass');
    } catch { stop(); }
  }
  try {
    const library = await import('./vendor/liquid-glass-canvas-0.1.0.js');
    image = new Image(); image.src = new URL('../css/market-scene.svg', import.meta.url).href;
    await image.decode(); if (version !== generation) return;
    canvas = document.createElement('canvas'); canvas.className = 'glass-renderer'; canvas.setAttribute('aria-hidden','true');
    gl = canvas.getContext('webgl', {alpha:true,depth:false,stencil:false,antialias:false,premultipliedAlpha:true});
    if (!gl) return;
    pass = library.createLiquidGlassPass(gl); texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D,texture);
    for (const axis of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T]) gl.texParameteri(gl.TEXTURE_2D,axis,gl.CLAMP_TO_EDGE);
    for (const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
    source = document.createElement('canvas'); ctx = source.getContext('2d');
    document.body.append(canvas); canvas.addEventListener('webglcontextlost',stop,{once:true});
    observer = new ResizeObserver(() => { measure = true; schedule(); });
    panels.forEach(panel => observer.observe(panel)); observer.observe(document.body);
    addEventListener('scroll',schedule,{passive:true}); addEventListener('resize',onResize,{passive:true});
    document.addEventListener('visibilitychange',schedule); cleanup = stop; schedule();
  } catch { stop(); }
}
preferences.forEach(q => q.addEventListener('change',configure));
configure();
