//#region src/core/defaults.ts
var e = {
	radius: 16,
	depth: 50,
	feather: 16,
	curve: 2,
	chroma: 0,
	tint: [
		1,
		1,
		1,
		.05
	],
	glint: .2
};
//#endregion
//#region src/core/measure.ts
function t(e, t) {
	let n = e.getBoundingClientRect(), r = t.getBoundingClientRect();
	return {
		x: n.left - r.left,
		y: n.top - r.top,
		width: n.width,
		height: n.height
	};
}
var n = /* @__PURE__ */ new Map();
function r(e) {
	if (Array.isArray(e)) return e;
	let t = n.get(e);
	if (t) return t;
	let r = document.createElement("div");
	r.style.color = e, r.style.display = "none", document.body.appendChild(r);
	let i = getComputedStyle(r).color;
	document.body.removeChild(r);
	let a = i.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/);
	if (a) {
		let t = [
			parseInt(a[1], 10) / 255,
			parseInt(a[2], 10) / 255,
			parseInt(a[3], 10) / 255,
			a[4] === void 0 ? 1 : parseFloat(a[4])
		];
		return n.set(e, t), t;
	}
	let o = [
		1,
		1,
		1,
		1
	];
	return n.set(e, o), o;
}
//#endregion
//#region src/core/LensRegistry.ts
var i = class {
	elementLenses = /* @__PURE__ */ new Map();
	rectLenses = /* @__PURE__ */ new Map();
	registerElement(t, n) {
		this.elementLenses.set(t, {
			...e,
			...n
		});
	}
	registerRect(t) {
		let n = Symbol(), i = {
			...e,
			...t
		};
		return this.rectLenses.set(n, {
			x: t.x,
			y: t.y,
			width: t.width,
			height: t.height,
			radius: i.radius,
			depth: i.depth,
			feather: i.feather,
			curve: i.curve,
			chroma: i.chroma,
			tint: r(i.tint),
			glint: i.glint
		}), n;
	}
	unregister(e) {
		typeof e == "symbol" ? this.rectLenses.delete(e) : this.elementLenses.delete(e);
	}
	update(e, t) {
		if (typeof e == "symbol") {
			let n = this.rectLenses.get(e);
			if (n) {
				let i = t.tint ? r(t.tint) : n.tint;
				this.rectLenses.set(e, {
					...n,
					...t,
					tint: i
				});
			}
		} else {
			let n = this.elementLenses.get(e);
			n && this.elementLenses.set(e, {
				...n,
				...t
			});
		}
	}
	getActiveLenses(e) {
		let n = [];
		for (let [i, a] of this.elementLenses.entries()) {
			let o = t(i, e);
			n.push({
				x: o.x,
				y: o.y,
				width: o.width,
				height: o.height,
				radius: a.radius,
				depth: a.depth,
				feather: a.feather,
				curve: a.curve,
				chroma: a.chroma,
				tint: r(a.tint),
				glint: a.glint
			});
		}
		for (let e of this.rectLenses.values()) n.push(e);
		return n;
	}
};
//#endregion
//#region src/webgl/createContext.ts
function a(e) {
	let t = e.getContext("webgl", {
		alpha: !0,
		depth: !1,
		stencil: !1,
		antialias: !1,
		premultipliedAlpha: !0,
		preserveDrawingBuffer: !1
	}) || e.getContext("experimental-webgl");
	if (!t) throw Error("WebGL not supported");
	return t;
}
//#endregion
//#region src/webgl/TextureSource.ts
var o = class {
	gl;
	texture;
	constructor(e) {
		this.gl = e;
		let t = e.createTexture();
		if (!t) throw Error("Could not create texture");
		this.texture = t, e.bindTexture(e.TEXTURE_2D, this.texture), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR), e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR), e.bindTexture(e.TEXTURE_2D, null);
	}
	update(e) {
		let t = this.gl;
		t.bindTexture(t.TEXTURE_2D, this.texture), t.pixelStorei(t.UNPACK_FLIP_Y_WEBGL, !0), t.texImage2D(t.TEXTURE_2D, 0, t.RGBA, t.RGBA, t.UNSIGNED_BYTE, e), t.bindTexture(t.TEXTURE_2D, null);
	}
	getTexture() {
		return this.texture;
	}
	destroy() {
		this.gl.deleteTexture(this.texture);
	}
};
//#endregion
//#region src/webgl/createProgram.ts
function s(e, t, n) {
	let r = e.createShader(t);
	if (!r) throw Error("Could not create shader");
	if (e.shaderSource(r, n), e.compileShader(r), !e.getShaderParameter(r, e.COMPILE_STATUS)) {
		let t = e.getShaderInfoLog(r);
		throw e.deleteShader(r), Error(`Shader compilation failed: ${t}`);
	}
	return r;
}
function c(e, t, n) {
	let r = s(e, e.VERTEX_SHADER, t), i = s(e, e.FRAGMENT_SHADER, n), a = e.createProgram();
	if (!a) throw Error("Could not create program");
	if (e.attachShader(a, r), e.attachShader(a, i), e.linkProgram(a), !e.getProgramParameter(a, e.LINK_STATUS)) {
		let t = e.getProgramInfoLog(a);
		throw e.deleteProgram(a), Error(`Program linking failed: ${t}`);
	}
	return e.deleteShader(r), e.deleteShader(i), a;
}
//#endregion
//#region src/webgl/createQuad.ts
function l(e, t) {
	let n = new Float32Array([
		-1,
		-1,
		1,
		-1,
		-1,
		1,
		-1,
		1,
		1,
		-1,
		1,
		1
	]), r = e.createBuffer();
	if (!r) throw Error("Could not create buffer");
	e.bindBuffer(e.ARRAY_BUFFER, r), e.bufferData(e.ARRAY_BUFFER, n, e.STATIC_DRAW);
	let i = e.getExtension("OES_vertex_array_object"), a = null, o = e.getAttribLocation(t, "a_position");
	return i && (a = i.createVertexArrayOES(), i.bindVertexArrayOES(a), e.bindBuffer(e.ARRAY_BUFFER, r), e.enableVertexAttribArray(o), e.vertexAttribPointer(o, 2, e.FLOAT, !1, 0, 0), i.bindVertexArrayOES(null)), {
		buffer: r,
		vao: a,
		draw: () => {
			i && a ? (i.bindVertexArrayOES(a), e.drawArrays(e.TRIANGLES, 0, 6), i.bindVertexArrayOES(null)) : (e.bindBuffer(e.ARRAY_BUFFER, r), e.enableVertexAttribArray(o), e.vertexAttribPointer(o, 2, e.FLOAT, !1, 0, 0), e.drawArrays(e.TRIANGLES, 0, 6));
		},
		destroy: () => {
			e.deleteBuffer(r), i && a && i.deleteVertexArrayOES(a);
		}
	};
}
//#endregion
//#region src/shaders/liquidGlass.vert.ts
var u = "\nattribute vec2 a_position;\nvarying vec2 v_uv;\n\nvoid main() {\n  v_uv = a_position * 0.5 + 0.5;\n  // flip Y since WebGL textures have origin at bottom-left, but DOM uses top-left\n  // Actually, we'll handle the flip when we upload the texture via gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}\n", d = "\nprecision mediump float;\n\nvarying vec2 v_uv;\n\nuniform sampler2D u_source;\nuniform vec2 u_resolution;\nuniform vec4 u_lensRect;    // x, y, width, height (in pixels)\nuniform vec4 u_lensParams1; // radius, depth, feather, curve\nuniform vec4 u_lensParams2; // chroma, glint, unused, unused\nuniform vec4 u_lensTint;    // r, g, b, a\n\n// Rounded rectangle SDF\nfloat sdRoundRect(vec2 p, vec2 b, float r) {\n  vec2 d = abs(p) - b + vec2(r);\n  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)) - r;\n}\n\n// Get outward normal from rounded rectangle\nvec2 getNormal(vec2 p, vec2 b, float r) {\n  vec2 d = abs(p) - b + vec2(r);\n  if (d.x <= 0.0 && d.y <= 0.0) return vec2(0.0);\n  return sign(p) * normalize(max(d, 0.0));\n}\n\nvoid main() {\n  vec2 fragCoord = v_uv * u_resolution;\n  // flip Y back since fragCoord Y is 0 at bottom, but our DOM coordinates are 0 at top.\n  // Wait, if we flip Y during texture upload and the canvas is fullscreen, \n  // v_uv is bottom-up (0,0 bottom-left).\n  // u_lensRect uses top-left as origin (DOM coords).\n  // So we must convert DOM Y to GL Y:\n  float glY = u_resolution.y - fragCoord.y;\n  vec2 pxCoords = vec2(fragCoord.x, glY);\n\n  // Center of the lens\n  vec2 lensCenter = u_lensRect.xy + u_lensRect.zw * 0.5;\n  vec2 p = pxCoords - lensCenter;\n  \n  // Half extents\n  vec2 b = u_lensRect.zw * 0.5;\n  \n  float radius = u_lensParams1.x;\n  float depth = u_lensParams1.y;\n  float feather = u_lensParams1.z;\n  float curve = u_lensParams1.w;\n  \n  float chroma = u_lensParams2.x;\n  float glint = u_lensParams2.y;\n\n  // Compute SDF\n  float dist = sdRoundRect(p, b, radius);\n  \n  // Discard fragments outside the rounded rect\n  if (dist > 0.0) {\n    discard;\n  }\n\n  // Calculate edge effect amount\n  // dist goes from -b to 0 at the edge. \n  // We want the effect to happen within 'feather' pixels from the edge.\n  // So when dist is -feather, edge=0. When dist is 0, edge=1.\n  float edge = clamp((dist + feather) / feather, 0.0, 1.0);\n  \n  // Apply curve. \n  float amount = pow(edge, curve);\n\n  // Normal for displacement\n  vec2 normal = getNormal(p, b, radius);\n  \n  // Notice we must map the pixel normal back to UV space for offset.\n  // We negate the Y normal because UV Y goes up, but DOM Y goes down.\n  vec2 uvOffset = vec2(normal.x, -normal.y) * amount * (depth / u_resolution);\n  vec2 sampleUv = v_uv - uvOffset;\n\n  vec4 color;\n  if (chroma > 0.0) {\n    float cOffset = chroma * amount;\n    // slightly different offsets for RGB\n    vec2 offsetR = vec2(normal.x, -normal.y) * amount * ((depth + cOffset) / u_resolution);\n    vec2 offsetG = uvOffset;\n    vec2 offsetB = vec2(normal.x, -normal.y) * amount * ((depth - cOffset) / u_resolution);\n    \n    float rColor = texture2D(u_source, v_uv - offsetR).r;\n    float gColor = texture2D(u_source, v_uv - offsetG).g;\n    float bColor = texture2D(u_source, v_uv - offsetB).b;\n    float aColor = texture2D(u_source, sampleUv).a;\n    color = vec4(rColor, gColor, bColor, aColor);\n  } else {\n    color = texture2D(u_source, sampleUv);\n  }\n\n  // Apply tint\n  color.rgb = mix(color.rgb, u_lensTint.rgb, u_lensTint.a);\n\n  // Apply glint (simple specular-like highlight on the top-left edge)\n  // We can use the normal and dot product with a light vector\n  vec2 lightDir = normalize(vec2(-1.0, -1.0)); // coming from top-left in DOM space\n  float specular = max(dot(normal, lightDir), 0.0);\n  // sharpen specular\n  specular = pow(specular, 4.0) * amount;\n  \n  color.rgb += vec3(specular * glint);\n\n  gl_FragColor = color;\n}\n", f = class {
	gl;
	program;
	quad;
	locations;
	constructor(e) {
		this.gl = e, this.program = c(e, u, d), this.quad = l(e, this.program), this.locations = {
			u_source: e.getUniformLocation(this.program, "u_source"),
			u_resolution: e.getUniformLocation(this.program, "u_resolution"),
			u_lensRect: e.getUniformLocation(this.program, "u_lensRect"),
			u_lensParams1: e.getUniformLocation(this.program, "u_lensParams1"),
			u_lensParams2: e.getUniformLocation(this.program, "u_lensParams2"),
			u_lensTint: e.getUniformLocation(this.program, "u_lensTint")
		};
	}
	render(e) {
		let t = this.gl;
		t.useProgram(this.program), t.viewport(0, 0, e.resolution[0], e.resolution[1]), t.activeTexture(t.TEXTURE0), t.bindTexture(t.TEXTURE_2D, e.sourceTexture), this.locations.u_source && t.uniform1i(this.locations.u_source, 0), this.locations.u_resolution && t.uniform2f(this.locations.u_resolution, e.resolution[0], e.resolution[1]), t.enable(t.BLEND), t.blendFunc(t.ONE, t.ONE_MINUS_SRC_ALPHA);
		for (let n of e.lenses) this.locations.u_lensRect && t.uniform4f(this.locations.u_lensRect, n.x, n.y, n.width, n.height), this.locations.u_lensParams1 && t.uniform4f(this.locations.u_lensParams1, n.radius, n.depth, n.feather, n.curve), this.locations.u_lensParams2 && t.uniform4f(this.locations.u_lensParams2, n.chroma, n.glint, 0, 0), this.locations.u_lensTint && t.uniform4f(this.locations.u_lensTint, n.tint[0], n.tint[1], n.tint[2], n.tint[3]), this.quad.draw();
		t.disable(t.BLEND);
	}
	destroy() {
		this.quad.destroy(), this.gl.deleteProgram(this.program);
	}
}, p = class {
	overlay;
	gl;
	textureSource;
	pass;
	registry = new i();
	source;
	container;
	dpr;
	quality;
	rafId = 0;
	isRunning = !1;
	constructor(e) {
		this.source = e.source, this.container = e.container, this.dpr = e.dpr || "auto", this.quality = e.quality || "auto", this.overlay = document.createElement("canvas"), this.overlay.className = "liquid-glass-overlay", this.overlay.style.position = "absolute", this.overlay.style.top = "0", this.overlay.style.left = "0", this.overlay.style.pointerEvents = "none", getComputedStyle(this.container).position === "static" && (this.container.style.position = "relative"), this.container.appendChild(this.overlay), this.gl = a(this.overlay), this.textureSource = new o(this.gl), this.pass = new f(this.gl), this.resize = this.resize.bind(this), window.addEventListener("resize", this.resize), this.resize();
	}
	getActiveQuality() {
		let e = this.quality;
		return e === "auto" && (e = typeof navigator < "u" && /Mobi|Android|iPhone/i.test(navigator.userAgent) ? "low" : "high"), e;
	}
	resize() {
		let e = this.container.getBoundingClientRect(), t = this.getActiveQuality(), n = this.dpr === "auto" ? window.devicePixelRatio || 1 : this.dpr;
		n = t === "low" ? Math.min(n, 1) : Math.min(n, 2), this.overlay.width = e.width * n, this.overlay.height = e.height * n, this.overlay.style.width = `${e.width}px`, this.overlay.style.height = `${e.height}px`;
	}
	registerLens(e, t) {
		this.registry.registerElement(e, t);
	}
	registerRectLens(e, t) {
		return this.registry.registerRect({
			...e,
			...t
		});
	}
	unregisterLens(e) {
		this.registry.unregister(e);
	}
	updateLens(e, t) {
		this.registry.update(e, t);
	}
	start() {
		if (this.isRunning) return;
		this.isRunning = !0;
		let e = () => {
			this.tick(), this.isRunning && (this.rafId = requestAnimationFrame(e));
		};
		e();
	}
	stop() {
		this.isRunning = !1, cancelAnimationFrame(this.rafId);
	}
	tick() {
		let e = this.registry.getActiveLenses(this.container);
		if (e.length === 0) {
			this.gl.clearColor(0, 0, 0, 0), this.gl.clear(this.gl.COLOR_BUFFER_BIT);
			return;
		}
		let t = this.getActiveQuality(), n = t === "low" ? 4 : 16;
		e.length > n && (e = e.slice(0, n)), this.textureSource.update(this.source);
		let r = this.dpr === "auto" ? window.devicePixelRatio || 1 : this.dpr;
		r = t === "low" ? Math.min(r, 1) : Math.min(r, 2);
		let i = e.map((e) => ({
			...e,
			x: e.x * r,
			y: e.y * r,
			width: e.width * r,
			height: e.height * r,
			radius: e.radius * r,
			feather: e.feather * r,
			depth: e.depth * r,
			chroma: t === "low" ? 0 : e.chroma
		}));
		this.gl.clearColor(0, 0, 0, 0), this.gl.clear(this.gl.COLOR_BUFFER_BIT), this.pass.render({
			sourceTexture: this.textureSource.getTexture(),
			resolution: [this.overlay.width, this.overlay.height],
			lenses: i
		});
	}
	destroy() {
		this.stop(), window.removeEventListener("resize", this.resize), this.pass.destroy(), this.textureSource.destroy(), this.overlay.parentNode && this.overlay.parentNode.removeChild(this.overlay);
	}
};
//#endregion
//#region src/adapters/overlay.ts
function m(e) {
	return new p(e);
}
//#endregion
//#region src/adapters/pass.ts
function h(e, t) {
	return new f(e);
}
//#endregion
export { m as createCanvasLiquidGlass, h as createLiquidGlassPass };
