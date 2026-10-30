/*! Hairline by Lucas Markes — MIT. Upstream 37d2e78dcb333ab30c3338e28ed4a690364ea014
MIT License

Copyright (c) 2026 Lucas Marques

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

*/
(function(){
"use strict";const __hairClock={now:0};
const __modules={"core/iso":function(__require,module){
/**
 * Hairline — the drawing maths every figure shares, with no DOM. Ported from
 * the study (design/lab-hairline/cartilha-v2.html) arithmetic-for-arithmetic,
 * so a figure here can be diffed against its IIFE there by eye.
 *
 * Everything is in viewBox units: every figure is drawn in a 400 × 320 box and
 * scaled to its column by the svg, so no number here depends on the viewport.
 * World space is x/y on the ground and z up; the camera turns the ground by an
 * azimuth, then squashes y by sin(el) and lifts z by cos(el). There is no
 * perspective and no hidden-line removal: plates are filled with the ground
 * colour and painted back to front, so a nearer one simply covers.
 */

                                    
                                            

/** A sample on a rounded outline, with its outward normal on the ground plane. */
                                                                      
                            

/**
 * An orthographic camera. `az` is in radians, `k` is sin(elevation) (.5 is
 * the 2:1 view every figure rests at), `S` is the scale, and `ox`/`oy` the
 * screen offset `fit` computes. Mutable on purpose: the turntable turns it.
 */
                                                                                  
                                                                  

/** Two lines of a solid: its bright silhouette and the one dim crease inside it. */
                                                         

const clamp = (v        , a        , b        ) => Math.max(a, Math.min(b, v));
const lerp = (a        , b        , t        ) => a + (b - a) * t;
const rad = (d        ) => (d * Math.PI) / 180;
/** Two decimals: enough for a hairline at any zoom, and path strings stay short. */
const r2 = (n        ) => Math.round(n * 100) / 100;

/** A closed path through the points. */
const poly = (pts                 ) =>
  "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L") + "Z";
/** One straight segment, as its own subpath, so several can be joined into one `d`. */
const seg = (a      , b      ) => `M${r2(a[0])} ${r2(a[1])}L${r2(b[0])} ${r2(b[1])}`;
/** An open polyline; empty for fewer than two points. */
const open = (pts                 ) =>
  pts.length < 2 ? "" : "M" + pts.map((p) => r2(p[0]) + " " + r2(p[1])).join("L");

/* ---------- projection ---------- */

const Cam = (azDeg        , k        , S        )         => ({ az: rad(azDeg), k, S, ox: 0, oy: 0 });

/**
 * The projector for the camera as it is now. Figures that move the camera
 * (the turntable) call this again each frame; the rest call it once.
 */
function proj(C        )            {
  const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
  return (x, y, z) => {
    const X = x * c - y * s, Y = x * s + y * c;
    return [C.ox + C.S * X, C.oy + C.S * (Y * C.k - z * zf)];
  };
}

/**
 * The ground-plane inverse: the world x/y under a screen point, on the plane
 * at height z. This is how the pointer reaches the drawing — every hover in
 * the figures is tested in world units, never in pixels.
 */
function unproj(C        , sx        , sy        , z        )                   {
  const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
  const X = (sx - C.ox) / C.S, Y = ((sy - C.oy) / C.S + z * zf) / C.k;
  return [X * c + Y * s, -X * s + Y * c];
}

/** Sets the camera's offset so the bounding box of `pts` is centred on (cx, cy). */
function fit(C        , pts                 , cx        , cy        ) {
  C.ox = 0; C.oy = 0;
  const P = proj(C);
  let a = 1e9, b = -1e9, c = 1e9, d = -1e9;
  for (const p of pts) {
    const q = P(p[0], p[1], p[2]);
    a = Math.min(a, q[0]); b = Math.max(b, q[0]); c = Math.min(c, q[1]); d = Math.max(d, q[1]);
  }
  C.ox = cx - (a + b) / 2; C.oy = cy - (c + d) / 2;
}

/* ---------- rounded solids ---------- */

/**
 * A rounded rectangle, sampled. Each sample carries its outward normal, so a
 * caller can keep just the run that faces the camera. `n` samples per corner.
 */
function rrect(u0        , v0        , u1        , v1        , r        , n = 4)       {
  r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
  const out       = [];
  for (const [cu, cv, a0] of [[u1 - r, v1 - r, 0], [u0 + r, v1 - r, 90], [u0 + r, v0 + r, 180], [u1 - r, v0 + r, 270]])
    for (let k = 0; k <= n; k++) {
      const a = rad(a0 + (90 * k) / n), ca = Math.cos(a), sa = Math.sin(a);
      out.push({ u: cu + r * ca, v: cv + r * sa, nu: ca, nv: sa });
    }
  return out;
}

/** A circle of radius R about the origin, sampled the same way. */
function circ(R        , n = 96)       {
  const out       = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
    out.push({ u: R * ca, v: R * sa, nu: ca, nv: sa });
  }
  return out;
}

/** Convex hull (monotone chain), counter-clockwise in screen space. */
function hull(input                 )         {
  const pts = input.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const x = (o      , a      , b      ) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo         = [], up         = [];
  for (const p of pts) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length > 1 && x(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  lo.pop(); up.pop();
  return lo.concat(up);
}

/** A ring laid flat at height z, projected. */
const ringAt = (P           , ring                   , z        )         => ring.map((q) => P(q.u, q.v, z));

/**
 * The samples whose normal faces the camera. The world direction of
 * screen-down is (sin az, cos az), so facing is a dot product with it.
 */
const facing = (C        ) => {
  const s = Math.sin(C.az), c = Math.cos(C.az);
  return (q        ) => q.nu * s + q.nv * c >= -1e-6;
};

/** The one cyclic run of samples that pass `keep`, in ring order. */
function run(ring                   , keep                        )       {
  const n = ring.length;
  let s = -1;
  for (let i = 0; i < n; i++) if (keep(ring[i]) && !keep(ring[(i + n - 1) % n])) { s = i; break; }
  if (s < 0) return keep(ring[0]) ? ring.slice() : [];
  const out       = [];
  for (let k = 0; k < n && keep(ring[(s + k) % n]); k++) out.push(ring[(s + k) % n]);
  return out;
}

/**
 * A prism standing from z0 to z1. Its silhouette is the hull of the two rings,
 * so the vertical corners are never drawn; its only inner line is the crease,
 * the front run of an inset ring on the lid, which reads as a bevel.
 */
function prism(
  P           ,
  front                        ,
  ring                   ,
  inner                                      ,
  z0        ,
  z1        ,
)             {
  return {
    sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))),
    crease: inner ? open(ringAt(P, run(inner, front), z1)) : "",
  };
}

/** A rounded footprint and its crease ring, inset by b. */
const rings = (x0        , y0        , x1        , y1        , r        , b        )               => [
  rrect(x0, y0, x1, y1, r),
  rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.3, r - b)),
];

/** The leftmost, rightmost and nearest samples of a ring: where construction lines drop from. */
function extremes(P           , ring                   )                           {
  const pr = ring.map((q) => P(q.u, q.v, 0));
  let a = 0, b = 0, c = 0;
  pr.forEach((p, k) => { if (p[0] < pr[a][0]) a = k; if (p[0] > pr[b][0]) b = k; if (p[1] > pr[c][1]) c = k; });
  return [ring[a], ring[b], ring[c]];
}

/** Rounds every vertex of a closed polygon with a quadratic through the vertex; r per vertex. */
function fillet(pts                 , rs                   , n = 4)         {
  const m = pts.length, out         = [];
  for (let i = 0; i < m; i++) {
    const a = pts[(i + m - 1) % m], p = pts[i], b = pts[(i + 1) % m];
    const la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const t = Math.min(rs[i], la / 2, lb / 2);
    const p1 = [p[0] + ((a[0] - p[0]) / la) * t, p[1] + ((a[1] - p[1]) / la) * t];
    const p2 = [p[0] + ((b[0] - p[0]) / lb) * t, p[1] + ((b[1] - p[1]) / lb) * t];
    for (let k = 0; k <= n; k++) {
      const s = k / n, w = 1 - s;
      out.push([w * w * p1[0] + 2 * w * s * p[0] + s * s * p2[0], w * w * p1[1] + 2 * w * s * p[1] + s * s * p2[1]]);
    }
  }
  return out;
}

/**
 * A prism's mirror under its floor, as a path: the far edge of the reflection
 * and its two sides. `y0`/`y1` are where its fade starts (the floor's top) and
 * ends (just past the reflection's lowest point).
 */
function ghost(
  P           , front                        , ring                   , z0        , depth        ,
)                                        {
  const f = run(ring, front), lowP = ringAt(P, f, z0 - depth);
  return {
    d: open(lowP) + [f[0], f[f.length - 1]].map((q) => seg(P(q.u, q.v, z0), P(q.u, q.v, z0 - depth))).join(""),
    y0: Math.min(...ringAt(P, f, z0).map((p) => p[1])),
    y1: Math.max(...lowP.map((p) => p[1])) + 2,
  };
}

module.exports={clamp,lerp,rad,r2,poly,seg,open,Cam,proj,unproj,fit,rrect,circ,hull,ringAt,facing,run,prism,rings,extremes,fillet,ghost};
},
"core/motion":function(__require,module){
const {clamp}=__require("core/iso");

/**
 * Hairline — the two clocks, with no DOM. A discrete change (which card) gets
 * a long ease-out on a tween; a continuous input (where the pointer is) gets
 * a spring, because its target moves every frame and a timed ease would
 * always be chasing it. Both from the study (design/lab-hairline/cartilha-v2.html).
 *
 * Reduced motion is one flag here rather than a `matchMedia` call, so this
 * file stays pure and a test can flip it. The stage (components/hairline/
 * stage.ts) owns the only media query and writes the flag through
 * `setReducedMotion` before any figure ticks; figures read it with
 * `reducedMotion()`. With it on, springs and tweens land on their target in
 * one step.
 */

let reduced = false;
const setReducedMotion = (on         ) => { reduced = on; };
const reducedMotion = () => reduced;

                                                                                                       
                                                                                 

/** A spring at rest on x. k 100 · c 18 · m 1 unless told otherwise; `eps` is when it counts as settled. */
function spring(x        , o                = {})         {
  return { x, v: 0, t: x, k: o.k ?? 100, c: o.c ?? 18, m: o.m ?? 1, eps: o.eps ?? 0.01 };
}

/**
 * Advances a spring by dt seconds toward `sp.t`, substepped at 240 Hz so a
 * long frame can't make it overshoot. Returns whether it is still moving.
 */
function stepS(sp        , dt        )          {
  if (reduced) { sp.x = sp.t; sp.v = 0; return false; }
  const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
  for (let i = 0; i < n; i++) {
    const a = (-sp.k * (sp.x - sp.t) - sp.c * sp.v) / sp.m;
    sp.v += a * h; sp.x += sp.v * h;
  }
  if (Math.abs(sp.x - sp.t) < sp.eps && Math.abs(sp.v) < sp.eps * 10) { sp.x = sp.t; sp.v = 0; return false; }
  return true;
}

/** A CSS cubic-bezier as a function of progress: Newton first, bisection if it strays. */
function bezier(x1        , y1        , x2        , y2        )                        {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (u        ) => ((ax * u + bx) * u + cx) * u;
  const Y = (u        ) => ((ay * u + by) * u + cy) * u;
  const dX = (u        ) => (3 * ax * u + 2 * bx) * u + cx;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let u = t;
    for (let i = 0; i < 8; i++) {
      const e = X(u) - t;
      if (Math.abs(e) < 1e-5) break;
      const d = dX(u);
      if (Math.abs(d) < 1e-6) break;
      u -= e / d;
    }
    if (!(u >= 0 && u <= 1) || Math.abs(X(u) - t) > 1e-4) {
      let lo = 0, hi = 1;
      u = t;
      for (let i = 0; i < 24; i++) { if (X(u) < t) lo = u; else hi = u; u = (lo + hi) / 2; }
    }
    return Y(u);
  };
}

/** Linear's lift curve, 700ms (.32, .72, 0, 1): the discrete clock. */
const EASE_LIFT = bezier(0.32, 0.72, 0, 1);

/**
 * A tween on EASE_LIFT. `t0` is when it starts (it may be in the future: that
 * is how a stagger delays it), `dur` how long it runs, in ms of `now`.
 */
                                                                          
const tween = (v        , dur = 700)        => ({ from: v, to: v, t0: -1e9, dur });
/** Where the tween is at `now`. */
const tval = (tw       , now        ) => {
  const p = clamp((now - tw.t0) / tw.dur, 0, 1);
  return tw.from + (tw.to - tw.from) * (reduced ? 1 : EASE_LIFT(p));
};
/** Retargets from wherever it is now, starting after `delay` ms. A no-op if the target is unchanged. */
const tset = (tw       , to        , now        , delay        ) => {
  if (tw.to === to) return;
  tw.from = tval(tw, now); tw.to = to; tw.t0 = now + delay;
};
const tdone = (tw       , now        ) => reduced || now >= tw.t0 + tw.dur;

module.exports={setReducedMotion,reducedMotion,spring,stepS,bezier,EASE_LIFT,tween,tval,tset,tdone};
},
"core/stage":function(__require,module){
const {ghost,r2}=__require("core/iso");
const {EASE_LIFT,reducedMotion,setReducedMotion}=__require("core/motion");

/**
 * Hairline — the DOM side every figure shares: making svg nodes, the helpers
 * that write a solid or a dot into them, one frame loop for all six figures,
 * the pointer, and the only reduced-motion query.
 *
 * Everything comes apart. A page navigates away and back, and React's
 * StrictMode mounts twice. So `register` hands back an unregister, `pointer`
 * a disposer, and `disposer()` collects them so a figure's `destroy` is one
 * call. Once the last figure is unregistered no frame, observer or media
 * listener is left behind, and the next `register` starts them again.
 *
 * Nothing here touches `window` at import: the module is evaluated during
 * a server render too, so the loop, the observer and the media query are
 * created by the first `register`.
 */

/* ---------- the contract ---------- */

/** Where an engine writes its caption. Only `textContent` is ever touched, so it need not be an element. */
                                                     
                                                                                  
                                                                         
                                                                          

/* ---------- svg ---------- */

const NS = "http://www.w3.org/2000/svg";
                                                    

/** One svg element, with its attributes, appended to `parent` when there is one. */
function mk                                      (tag   , attrs               , parent                 )                          {
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  if (parent) parent.appendChild(e);
  return e;
}

/** A solid's two paths in one group: the silhouette (`.sil`) and its crease (`.nf.lo`). */
                                                                                
function solid(parent         )        {
  const g = mk("g", {}, parent);
  return { g, sil: mk("path", { class: "sil" }, g), cr: mk("path", { class: "nf lo" }, g) };
}
/** Writes a prism's paths into a solid. */
const put = (el       , s            ) => { el.sil.setAttribute("d", s.sil); el.cr.setAttribute("d", s.crease); };

/** A dot lying flat on a horizontal plane: an ellipse squashed by the camera. Position it with `place`. */
const flatDot = (parent         , C        , r        , cls        ) =>
  mk("ellipse", { rx: r2(r * C.S), ry: r2(r * C.S * C.k), class: cls }, parent);
const place = (el            , q      ) => { el.setAttribute("cx", String(r2(q[0]))); el.setAttribute("cy", String(r2(q[1]))); };

/** A vertical fade, as a mask, for reflections. Returns the `url(#…)` to put in a `mask` attribute. */
let fid = 0;
function fade(svg               , y0        , y1        , a0 = 0.7)         {
  const id = "hl-fd" + ++fid, defs = mk("defs", {}, svg);
  const lg = mk("linearGradient", { id: id + "g", gradientUnits: "userSpaceOnUse", x1: 0, y1: r2(y0), x2: 0, y2: r2(y1) }, defs);
  mk("stop", { offset: 0, "stop-color": "#fff", "stop-opacity": a0 }, lg);
  mk("stop", { offset: 1, "stop-color": "#fff", "stop-opacity": 0 }, lg);
  const m = mk("mask", { id, maskUnits: "userSpaceOnUse", x: 0, y: 0, width: 400, height: 320 }, defs);
  mk("rect", { x: 0, y: 0, width: 400, height: 320, fill: `url(#${id}g)` }, m);
  return `url(#${id})`;
}

/** A prism's mirror under its floor: the far edge of the reflection and its two sides, fading out. */
function reflect(
  svg               , parent         , P           , front                        ,
  ring                   , z0        , depth        ,
) {
  const r = ghost(P, front, ring, z0, depth);
  const gh = mk("g", { class: "ghost", mask: fade(svg, r.y0, r.y1) }, parent);
  mk("path", { d: r.d }, gh);
}


                                                      
                                                 
const manualBoards=new Map                   ();
function register(stage        ,tick     )     {
 let set=manualBoards.get(stage);
 if(!set){set=new Set();manualBoards.set(stage,set);}
 set.add(tick);tick(0,__hairClock.now);
 return {wake(){},unregister(){set .delete(tick);if(!set .size)manualBoards.delete(stage);}};
}
function advance(stage        ,dt       ,now       ){
 const b=manualBoards.get(stage);if(b)for(const tick of Array.from(b))tick(dt,now);
}
function drive(stage        ,p          ){
 const h=handlers.get(stage);if(!h)return;
 if(p)h.move(p,{pointerType:'ghost'}                );else h.leave({pointerType:'ghost'}                );
}
/* ---------- pointer ---------- */

                               
                                                  
                                       
                                     
                                        
                               
  

/** The handlers each stage's pointer() was given, so a tour can drive them. */
const handlers = new WeakMap                          ();
/** The tour on each stage, told when a real pointer arrives and leaves. */
const touring = new WeakMap                                            ();

/**
 * Pointer input in viewBox units. A mouse leaving acts at once; a finger
 * lifting holds the pose for 1.4s first, so a tap reads as a look rather than
 * a flash. Touch releases its capture on press, so dragging across the stage
 * keeps sending moves. Returns the disposer.
 */
function pointer(stage             , on                 )             {
  handlers.set(stage, on);
  let tm = 0;
  const pt = (e              )       => {
    const r = stage.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * 400, ((e.clientY - r.top) / r.height) * 320];
  };
  /* a real pointer holds the stage's tour before the figure hears it, and frees it after the figure hears the leave */
  const move = (e              ) => { clearTimeout(tm); touring.get(stage)?.hold(); on.move(pt(e), e); };
  const down = (e              ) => {
    clearTimeout(tm);
    touring.get(stage)?.hold();
    if (e.pointerType !== "mouse") stage.releasePointerCapture?.(e.pointerId);
    if (on.down) on.down(pt(e), e); else on.move(pt(e), e);
  };
  const leave = (e              ) => {
    clearTimeout(tm);
    tm = window.setTimeout(() => { on.leave(e); touring.get(stage)?.release(); }, e.pointerType === "mouse" ? 0 : 1400);
  };
  stage.addEventListener("pointermove", move);
  stage.addEventListener("pointerdown", down);
  stage.addEventListener("pointerleave", leave);
  return () => {
    clearTimeout(tm);
    if (handlers.get(stage) === on) handlers.delete(stage);
    stage.removeEventListener("pointermove", move);
    stage.removeEventListener("pointerdown", down);
    stage.removeEventListener("pointerleave", leave);
  };
}

/* ───── the tour: an unseen pointer that walks a figure's stops ───── */

/** Where an unseen pointer stops: a viewBox point, or null to leave the stage. */
                                              
                                          
/** The default stops: a diamond around the centre, left, up, right, down, then a leave. */
const LAP       = [[128, 150], [200, 118], [272, 150], [200, 206], null];

const TRAVEL = 900, DWELL = 1200, REST = 1800, RESUME = 1200, STAGGER = 450;
const GHOST = { pointerType: "ghost" }                ;
/** How many tours have started on the page: the stagger that keeps a page of them out of step. */
let started = 0;

/** Where a pointer heading for `p` first touches the viewBox: the ray from the centre through `p` meets the edge. */
function entry([x, y]      )       {
  const dx = x - 200, dy = y - 160;
  if (!dx && !dy) return [200, 320];
  const k = Math.min(dx ? (dx > 0 ? 200 : -200) / dx : Infinity, dy ? (dy > 0 ? 160 : -160) / dy : Infinity);
  return [200 + dx * k, 160 + dy * k];
}

/**
 * Walks `stops` on the figure under `stage`, calling the handlers its pointer()
 * was given as a hand would: in from the edge, TRAVEL to each stop on EASE_LIFT,
 * DWELL there, leave(GHOST) at a null stop and REST, then round again. A real
 * pointer or focus on the stage holds it; when they go it waits RESUME and
 * starts from the first stop. It is a board in the one loop: it sleeps offscreen
 * and leaves under reduced motion. onStop(i) is called on arriving at stop i,
 * or on leaving for a null stop i. A figure never calls this; the bench and the
 * package do.
 */
function tour(stage             , stops      , onStop                          )             {
  let i = 0;                                            // the stop the ghost is heading to
  let wait = RESUME + STAGGER * (started++ % 4);        // ms before the next travel begins
  let t = -1;                                           // ms into the travel; -1 before it begins
  let at              = null;                           // where the ghost is; null when off the stage
  let origin       = [200, 320];                        // where the current travel began
  let hand = false, keys = stage.contains(stage.ownerDocument.activeElement);
  let gone = false;

  const leave = () => { at = null; t = -1; handlers.get(stage)?.leave(GHOST); };
  const tick       = (dt) => {
    if (hand || keys || !stops.length) return false;
    if (reducedMotion()) { if (at) leave(); return false; }
    if (wait > 0) { wait -= dt * 1000; return true; }
    const stop = stops[i];
    if (stop === null) {
      if (at) leave();
      onStop?.(i);
      i = (i + 1) % stops.length;
      wait = REST;
      return true;
    }
    const h = handlers.get(stage);
    if (!h) return true;                                // the figure has not called pointer() yet, or has let it go
    if (t < 0) { origin = at ?? entry(stop); t = 0; }
    t = Math.min(TRAVEL, t + dt * 1000);
    const k = EASE_LIFT(t / TRAVEL);
    at = [origin[0] + (stop[0] - origin[0]) * k, origin[1] + (stop[1] - origin[1]) * k];
    h.move(at, GHOST);
    if (t < TRAVEL) return true;
    onStop?.(i);
    i = (i + 1) % stops.length;
    t = -1;
    wait = DWELL;
    return true;
  };

  /* a hand or the keyboard owns the handlers: the ghost drops where it was and says nothing until both are gone */
  const take = () => { at = null; t = -1; };
  const give = () => { if (hand || keys) return; i = 0; t = -1; wait = RESUME; board.wake(); };
  const me = {
    hold: () => { hand = true; take(); },
    release: () => { if (!hand) return; hand = false; give(); },
  };
  const focusIn = () => { keys = true; take(); };
  const focusOut = (e            ) => { if (keys && !stage.contains(e.relatedTarget               )) { keys = false; give(); } };
  stage.addEventListener("focusin", focusIn);
  stage.addEventListener("focusout", focusOut);
  touring.set(stage, me);
  const board = register(stage, tick);

  return {
    stop: () => {
      if (gone) return;
      gone = true;
      board.unregister();
      stage.removeEventListener("focusin", focusIn);
      stage.removeEventListener("focusout", focusOut);
      if (touring.get(stage) === me) touring.delete(stage);
      if (at) leave();
    },
  };
}

/* ---------- tear-down ---------- */

                        
                                                                                              
                            
                                              
                                                                                                                                                       
                                                 
                  
  

/**
 * Collects a figure's tear-down, so its `destroy` can be `bag.dispose`:
 *
 *   const bag = disposer();
 *   const B = register(stage, tick); bag.add(B.unregister);
 *   bag.add(pointer(stage, { move, leave }));
 *   bag.on(stage, "keydown", onKey);
 *   bag.add(() => svg.replaceChildren());
 *   return { set, destroy: bag.dispose };
 */
function disposer()           {
  let fns                    = [];
  return {
    add: (fn) => { fns.push(fn); },
    on: (target, type, fn, opts) => {
      const h = fn                 ;
      target.addEventListener(type, h, opts);
      fns.push(() => target.removeEventListener(type, h, opts));
    },
    dispose: () => {
      const run = fns;
      fns = [];
      for (let i = run.length - 1; i >= 0; i--) run[i]();
    },
  };
}

module.exports={mk,solid,put,flatDot,place,fade,reflect,register,advance,drive,pointer,LAP,tour,disposer};
},
"core/styles":function(__require,module){
/**
 * Hairline — the stylesheet, as a string, and the one function that puts it
 * in a document or a shadow root.
 *
 * Every selector is inside `:where()`, so each rule has zero specificity: a
 * rule of the page's always wins, and between these rules only their order
 * decides. The order below is therefore part of the design. The six
 * `--hairline-*` properties are the public theme; `--hl-*` are private and
 * read them with the palette as the fallback.
 */

const LIGHT = { plate: "#ffffff", hi: "#232327", edge: "#a4a4ac", mid: "#c3c3c9", lo: "#e0e0e4" };
const DARK = { plate: "#08090a", hi: "#d0d6e0", edge: "#5b5d64", mid: "#3e3e44", lo: "#29292d" };
const KEYS = ["plate", "hi", "edge", "mid", "lo"]         ;
                                                     

const vars = (p         ) => KEYS.map((k) => `--hl-${k}:var(--hairline-${k},${p[k]});`).join("");
const EASE = "cubic-bezier(0.5,0,0.1,1)";
const SVG = ":where([data-hairline]>svg)";

/** The stylesheet. `lightDark` adds the rule that follows the page's `color-scheme`, for browsers that have `light-dark()`. */
function css(lightDark         )         {
  const both = Object.fromEntries(KEYS.map((k) => [k, `light-dark(${LIGHT[k]},${DARK[k]})`]))           ;
  return [
    // the box, and the palette: light unless something below says otherwise
    `:where([data-hairline]){display:block;position:relative;aspect-ratio:5/4;touch-action:pan-y;user-select:none;-webkit-user-select:none;--hl-sw:var(--hairline-stroke,0.9);${vars(LIGHT)}}`,
    // the page's color-scheme
    lightDark ? `:where([data-hairline]){${vars(both)}}` : "",
    // an ancestor that says dark
    `:where(.dark,[data-theme="dark"]) :where([data-hairline]){${vars(DARK)}}`,
    // the figure's own theme option
    `:where([data-hairline][data-hairline-theme="light"]){${vars(LIGHT)}}`,
    `:where([data-hairline][data-hairline-theme="dark"]){${vars(DARK)}}`,
    `:where([data-hairline]:focus-visible){outline:1.5px solid var(--hl-hi);outline-offset:2px}`,
    `${SVG}{position:absolute;inset:0;width:100%;height:100%;display:block}`,
    // Riffle's live region: read, not seen
    `:where([data-hairline]>[data-hairline-live]){position:absolute;width:1px;height:1px;margin:-1px;padding:0;border:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`,
    // the drawing: plates are filled with the plate colour and painted back to front
    `${SVG} :where(path,polygon,ellipse,line){fill:var(--hl-plate);stroke:var(--hl-mid);stroke-width:var(--hl-sw);vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round;transition:stroke 260ms ${EASE}}`,
    `${SVG} :where(.nf){fill:none}`,
    `${SVG} :where(.fo){stroke:none}`,
    `${SVG} :where(.sil){stroke:var(--hl-edge)}`,
    `${SVG} :where(.hi){stroke:var(--hl-hi)}`,
    `${SVG} :where(.lo){stroke:var(--hl-lo)}`,
    `${SVG} :where(.dash){stroke-dasharray:1 3}`,
    `${SVG} :where(.dot){stroke:none;fill:var(--hl-hi);transition:fill 260ms ${EASE}}`,
    `${SVG} :where(.dot.m){fill:var(--hl-edge)}`,
    `${SVG} :where(.dot.off){fill:var(--hl-lo)}`,
    `${SVG} :where(.ghost path){fill:none;stroke:var(--hl-mid)}`,
  ].join("");
}

const done = new WeakSet                       ();

/** Puts the stylesheet in a document or a shadow root, once: adopted where that exists, a `<style>` element where it doesn't. */
function inject(root                       )       {
  if (done.has(root)) return;
  done.add(root);
  const doc = root.nodeType === 9 ? (root            ) : (root              ).ownerDocument;
  const win = doc.defaultView;
  const text = css(!!win?.CSS?.supports?.("color", "light-dark(#000,#fff)"));
  if (win && "adoptedStyleSheets" in root) {
    try {
      const sheet = new win.CSSStyleSheet();
      sheet.replaceSync(text);
      root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet];
      return;
    } catch {
      // no constructable stylesheets here: fall through to an element
    }
  }
  const style = doc.createElement("style");
  style.setAttribute("data-hairline-style", "");
  style.textContent = text;
  (root.nodeType === 9 ? doc.head ?? doc.documentElement : root).appendChild(style);
}

module.exports={css,inject};
},
"figures/basket":function(__require,module){
const {Cam,clamp,fit,hull,open,poly,proj,rad,rrect,run,seg,unproj}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {TABLE}=__require("intensity");

/**
 * Basket: a wire shopping basket. A rim and a floor, both solid, dim wires
 * standing between them, and a bail handle with a grip. The pointer tilts the
 * basket toward it on a spring, so the bare floor shows, and the handle
 * swings after it, late. At rest the basket stands level, the handle dropped
 * to one side, the rim bright; tilted, the bright goes to the floor. The
 * slider is the furthest tilt, in degrees.
 *
 * The pattern: a lean. Two springs hold the tilt as a vector on the ground,
 * set from the pointer on a fixed plane through the basket's middle, never
 * from the basket on screen. Everything turns about the floor's centre.
 * Tipped away from the camera it goes half as far, so the floor still shows.
 * The handle swings on a softer spring, as Rail's hangers, whose target is
 * read from the tilt as drawn: it comes late.
 */

const A = 40, B = 25, RR = 8, RT = 1.5, H = 30, F = 0.8;      // rim: half length, half width, corner radius, wire radius, height; the floor's size as a share of the rim's
const FT = 3, FB = 1.4, N = 44, BANDS = [0.45];               // floor: thickness, crease inset; wires round the wall; horizontal wires, as shares of the height
const HH = 30, HR = 8, HT = 1.3, GRIP = 9, GT = 2.6;          // handle: height over its pivots, corner radius, bar radius, grip half length, grip radius
const REST_H = -46, LIFT = 0.6, REACH = 70, S = 3;       // the handle's lean at rest, in degrees, and how far a degree of tilt lifts it; the pointer's distance for the full tilt; scale
                                                     

/** The tilt toward a ground direction by m degrees. Tipping away from the camera goes half as far, so the mouth stays open to it. */
function aim(dx        , dy        , m        )       {
  const a = Math.min(0, (dx + dy) * Math.SQRT1_2) / 2;          // half the part of the direction that points away from the camera, which is at 45°
  return [m * (dx - a * Math.SQRT1_2), m * (dy - a * Math.SQRT1_2)];
}

/** The tilt as a rotation about the floor's centre: the mouth turns toward (tx, ty) by their length, in degrees. */
function tilter(tx        , ty        )      {
  const m = Math.hypot(tx, ty), kx = m ? -ty / m : 0, ky = m ? tx / m : 0, c = Math.cos(rad(m)), s = Math.sin(rad(m));
  return (x, y, z) => { const d = (kx * x + ky * y) * (1 - c); return [x * c + ky * z * s + kx * d, y * c - kx * z * s + ky * d, z * c + (kx * y - ky * x) * s]; };
}

/** n samples evenly spaced by length round a closed ring. */
function stations(ring      , n        )       {
  const L = [0];
  for (let i = 1; i <= ring.length; i++) { const p = ring[i - 1], q = ring[i % ring.length]; L.push(L[i - 1] + Math.hypot(q.u - p.u, q.v - p.v)); }
  return Array.from({ length: n }, (_, k) => {
    const s = (k / n) * L[ring.length];
    let i = 0;
    while (L[i + 1] < s) i++;
    const p = ring[i], q = ring[(i + 1) % ring.length], f = (s - L[i]) / (L[i + 1] - L[i] || 1);
    return { u: p.u + (q.u - p.u) * f, v: p.v + (q.v - p.v) * f, nu: p.nu, nv: p.nv };
  });
}

/** A round bar's outline on screen: its centre line offset by its radius. Closed, it is a ring with a hole; open, its ends are round. */
function tube(Q                 , rho        , closed = false)         {
  const n = Q.length, L         = [], R         = [], T         = [];
  for (let i = 0; i < n; i++) {
    const a = Q[closed ? (i + n - 1) % n : Math.max(i - 1, 0)], b = Q[closed ? (i + 1) % n : Math.min(i + 1, n - 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, ty = (b[1] - a[1]) / l;
    T.push([tx, ty]); L.push([Q[i][0] - ty * rho, Q[i][1] + tx * rho]); R.push([Q[i][0] + ty * rho, Q[i][1] - tx * rho]);
  }
  if (closed) return poly(L) + poly(R.reverse());
  /** Half a round about c, from the left side to the right, bulging along d. */
  const cap = (c      , t      , d        ) => Array.from({ length: 7 }, (_, k)       => {
    const th = (Math.PI * (k + 1)) / 8, co = Math.cos(th) * d, si = Math.sin(th) * d;
    return [c[0] + rho * (-t[1] * co + t[0] * si), c[1] + rho * (t[0] * co + t[1] * si)];
  });
  return poly([...L, ...cap(Q[n - 1], T[n - 1], 1), ...R.reverse(), ...cap(Q[0], T[0], -1)]);
}

/** The handle's centre line in its own plane: u across the basket, w up from the pivots. */
const ARM         = /* @__PURE__ */ (() => [[-B, 0], ...Array.from({ length: 9 }, (_, k)       => { const t = Math.PI - (Math.PI / 2) * (k / 8); return [-B + HR + HR * Math.cos(t), HH - HR + HR * Math.sin(t)]; }),
  ...Array.from({ length: 9 }, (_, k)       => { const t = (Math.PI / 2) * (1 - k / 8); return [B - HR + HR * Math.cos(t), HH - HR + HR * Math.sin(t)]; }), [B, 0]])();
const GRIPS         = [[-GRIP, HH], [GRIP, HH]];

/** A point of the handle's plane, swung phi degrees toward +x about the pivots, in the basket's own frame. */
const swing = (phi        ) => { const c = Math.cos(rad(phi)), s = Math.sin(rad(phi)); return (p      )       => [p[1] * s, p[0], H + p[1] * c]; };

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, S);
  const MAXT = TABLE.basket[2];          // the slider's far end: under the camera's 30°, so it still sees into the mouth
  const HMAX = REST_H + LIFT * MAXT;     // the handle's most upright: where the furthest tilt lifts it
  const rim = rrect(-A, -B, A, B, RR, 14), wires = stations(rim, N);
  const floor = rim.map((q)         => ({ ...q, u: q.u * F, v: q.v * F }));
  const lid = rrect(-A * F + FB, -B * F + FB, A * F - FB, B * F - FB, RR * F - FB, 14);

  // The frame holds every pose: the furthest tilt every way, with the handle at both ends of its swing.
  const ext         = [];
  for (let k = -1; k < 8; k++) {
    const R = tilter(...aim(Math.cos((k * Math.PI) / 4), Math.sin((k * Math.PI) / 4), k < 0 ? 0 : MAXT));
    for (const q of rim) ext.push(R(q.u, q.v, H + RT), R(q.u * F, q.v * F, 0));
    for (const phi of [REST_H, HMAX]) for (const p of ARM) ext.push(R(...swing(phi)(p)));
  }
  fit(C, ext, 200, 166);
  const P0 = proj(C), sw = Math.sqrt(1 - C.k * C.k), cam       = [Math.sin(C.az) * sw, Math.cos(C.az) * sw, C.k];
  const g = mk("g", {}, svg);

  // Back to front: the far wall's wires, the floor, the near wall's wires, the rim, the handle and its grip.
  const far = mk("path", { class: "nf lo" }, g);
  const base = solid(g);
  const near = mk("path", { class: "nf lo" }, g);
  const ring = mk("path", { class: "sil" }, g);
  const bar = mk("path", { class: "sil" }, g);
  const grip = mk("path", { class: "sil" }, g);

  const tx = spring(0), ty = spring(0), hp = spring(REST_H, { k: 60, c: 6, eps: 0.02 });
  let dX = NaN, dY = NaN, dH = NaN, R = tilter(0, 0);
  const at = (p      ) => P0(...R(...p));
  /** Whether a wall with this outward normal faces the camera, once tilted. */
  const facing = (q        ) => { const n = R(q.nu, q.nv, 0); return n[0] * cam[0] + n[1] * cam[1] + n[2] * cam[2] >= 0; };

  function draw() {
    const moved = tx.x !== dX || ty.x !== dY;
    if (moved) {
      dX = tx.x; dY = ty.x; R = tilter(dX, dY);
      put(base, {
        sil: poly(hull(floor.map((q) => at([q.u, q.v, 0])).concat(floor.map((q) => at([q.u, q.v, FT]))))),
        crease: open(run(lid, facing).map((q) => at([q.u, q.v, FT]))),
      });
      // the wires: up the wall from the floor's edge to the rim, and round it at each band's height
      const d = ["", ""];
      for (const q of wires) d[+facing(q)] += seg(at([q.u * F - q.nu, q.v * F - q.nv, FT]), at([q.u, q.v, H]));   // a foot just inside the floor's edge, off its outline
      for (const b of BANDS) {
        const z = FT + (H - FT) * b, k = F + (1 - F) * b;
        rim.forEach((q, i) => { const r = rim[(i + 1) % rim.length]; d[+facing(q)] += seg(at([q.u * k, q.v * k, z]), at([r.u * k, r.v * k, z])); });
      }
      far.setAttribute("d", d[0]); near.setAttribute("d", d[1]);
      ring.setAttribute("d", tube(rim.map((q) => at([q.u, q.v, H])), RT * S, true));
    }
    if (moved || hp.x !== dH) {
      dH = hp.x;
      const s = swing(dH);
      bar.setAttribute("d", tube(ARM.map((p) => at(s(p))), HT * S));
      grip.setAttribute("d", tube(GRIPS.map((p) => at(s(p))), GT * S));
    }
  }

  const loop = register(stage, (dt) => {
    const a = stepS(tx, dt), b = stepS(ty, dt);
    hp.t = Math.min(REST_H + LIFT * Math.hypot(tx.x, ty.x), HMAX);   // any tilt lifts it off the rim; it chases the tilt as drawn, so it comes late
    const c = stepS(hp, dt);
    draw();
    return a || b || c;
  });
  bag.add(loop.unregister);

  let tmax = value, over = false, gx = 0, gy = 0;
  function retarget() {
    const r = Math.hypot(gx, gy), m = over && r ? clamp(tmax, 0, MAXT) * clamp(r / REACH, 0, 1) : 0;
    [tx.t, ty.t] = m ? aim(gx / r, gy / r, m) : [0, 0];
    read.textContent = over ? `tilt ${Math.round(Math.hypot(tx.t, ty.t))}° · 0` : "rest";
    ring.classList.toggle("hi", !over);
    base.sil.classList.toggle("hi", over);
    loop.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    // the pointer on a plane through the basket's middle, which never moves
    move: (p) => { over = true; [gx, gy] = unproj(C, p[0], p[1], H / 2); retarget(); },
    leave: () => { over = false; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { tmax = v; retarget(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/branches":function(__require,module){
const {Cam,circ,clamp,facing,fit,poly,prism,proj,rings,seg,unproj}=__require("core/iso");
const {tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Branches: a git history as an object on a board. A main line of commits
 * runs along a rail, each commit a puck seated on a round pad; a feature
 * branch forks off it near the start and merges back late. The rails are
 * closed strips that run pad to pad, so each fork and merge sits on a pad.
 * The pointer picks the commit under it: that puck rises off its pad, and
 * its first-parent ancestry rises after it, staggered back along its own
 * branch and through the fork, the farther back the less. Commits outside
 * that history stay seated. At rest, the feature's last commit is caught
 * bright, two ancestors under it. The slider is the reach, in commits.
 *
 * The pattern: discrete items, as Riffle's: tweens, a stagger by distance
 * (here, distance back through the history), and a hit test on the pucks'
 * shared rest top, which never moves.
 */

const D = 30, FY = 58, RW = 7, RT = 2.6, PR = 8, PH = 2.4, CR = 6.6, CH = 6, LIFT = 36, STEP = 45;
const BX0 = -15, BX1 = 7 * D + 15, BY0 = -16, BY1 = FY + 14, PB = 6, ZTOP = RT + PH + CH;

               
                                                                            
                                                                                    
  
                                                              

/** The history. Each commit: lane, number on its lane, world x, y, and its first parent. */
function history() {
  const cs         = [], at = (lane              , n        , x        , y        , parent        ) => (cs.push({ lane, n, x, y, parent }), cs.length - 1);
  const m           = [];
  for (let i = 0; i < 8; i++) m.push(at("main", i + 1, i * D, 0, i ? m[i - 1] : -1));
  const f1 = at("feature", 1, 2.5 * D, FY, m[1]), f2 = at("feature", 2, 3.5 * D, FY, f1), f3 = at("feature", 3, 4.5 * D, FY, f2);
  return { cs, m, f: [f1, f2, f3] };
}

/** A cubic from a to b, leaving a along (ox, oy) and arriving at b level. */
const bez = (a      , b      , ox        , oy        , ix        , n        ) => {
  const out         = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n, u = 1 - t, w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    const px = [a[0], a[0] + ox, b[0] - ix, b[0]], py = [a[1], a[1] + oy, b[1], b[1]];
    out.push([w[0] * px[0] + w[1] * px[1] + w[2] * px[2] + w[3] * px[3], w[0] * py[0] + w[1] * py[1] + w[2] * py[2] + w[3] * py[3]]);
  }
  return out;
};

/** A rail: the closed strip RW wide round a centre line of world points. Its ends sit under pads. */
function strip(c        ) {
  const L         = [], R         = [];
  c.forEach((p, i) => {
    const a = c[Math.max(0, i - 1)], b = c[Math.min(c.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;
    L.push([p[0] + nx * RW / 2, p[1] + ny * RW / 2]);
    R.push([p[0] - nx * RW / 2, p[1] - ny * RW / 2]);
  });
  return L.concat(R.reverse());
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let reach = value;
  const C = Cam(45, 0.5, 1.4);
  fit(C, [[BX0, BY0, -PB], [BX1, BY1, -PB], [BX1, BY0, -PB], [BX0, BY1, -PB], [BX0, BY0, ZTOP + LIFT], [BX1, BY0, ZTOP + LIFT]], 200, 166);
  const P = proj(C), front = facing(C);
  const { cs: seeds, m, f } = history();
  const xy = (i        )       => [seeds[i].x, seeds[i].y];

  const g = mk("g", {}, svg);
  const [br, bi] = rings(BX0, BY0, BX1, BY1, 12, 2.2);
  put(solid(g), prism(P, front, br, bi, -PB, 0));

  // The rails, pad to pad: main straight; each branch leaves its fork on a slant and comes back into its merge.
  const fork = (a      , b      ) => bez(a, b, (b[0] - a[0]) * 0.3, (b[1] - a[1]) * 0.5, (b[0] - a[0]) * 0.45, 14);
  const merge = (a      , b      ) => bez(b, a, (a[0] - b[0]) * 0.3, (a[1] - b[1]) * 0.5, (a[0] - b[0]) * 0.45, 14).reverse();
  const lines           = [
    [xy(m[0]), xy(m[7])],
    [...fork(xy(m[1]), xy(f[0])), ...merge(xy(f[2]), xy(m[6])).slice(1)],
  ];
  for (const c of lines) {
    const s = strip(c);
    mk("path", { d: poly(s.map((p) => P(p[0], p[1], 0))), class: "lo" }, g);
    mk("path", { d: poly(s.map((p) => P(p[0], p[1], RT))), class: "" }, g);
  }

  // Pads and pucks, by ascending x + y, so a nearer commit covers a farther one.
  const [pr, pi] = [circ(PR, 24), circ(PR - 1.4, 24)], [cr, ci] = [circ(CR, 24), circ(CR - 1.2, 24)];
  const at = (ring      , x        , y        )       => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + y }));
  const order = seeds.map((_, i) => i).sort((a, b) => seeds[a].x + seeds[a].y - (seeds[b].x + seeds[b].y));
  const cs           = [];
  for (const i of order) {
    const c = seeds[i];
    put(solid(g), prism(P, front, at(pr, c.x, c.y), at(pi, c.x, c.y), RT, PH + RT));
    const drop = mk("path", { class: "dash nf" }, g);
    cs[i] = { ...c, drop, el: solid(g), ring: at(cr, c.x, c.y), inner: at(ci, c.x, c.y), z: tween(0), drawn: NaN };
  }

  /** The first-parent history of commit a, nearest first: [index, steps back]. */
  const chain = (a        ) => { const out                          = []; for (let i = a, k = 0; i >= 0; i = cs[i].parent, k++) out.push([i, k]); return out; };
  const REST = f[2], REST_REACH = 2.2, REST_DEPTH = 0.5;

  function draw(c        , z        ) {
    if (z === c.drawn) return;
    c.drawn = z;
    const b = PH + RT + z;
    put(c.el, prism(P, front, c.ring, c.inner, b, b + CH));
    c.drop.setAttribute("d", seg(P(c.x, c.y, PH + RT), P(c.x, c.y, b)));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const c of cs) { draw(c, tval(c.z, now)); if (!tdone(c.z, now)) moving = true; }
    return moving;
  });
  bag.add(B.unregister);

  let act                = null, lit                = null, held = new Map                          ();
  /** Lifts commit a and its history, reach commits back, depth a share of full lift. The stagger runs back from a; what drops runs back from the commit let go. */
  function lift(a        , r        , depth        , instant          ) {
    const now = __hairClock.now, want = new Map                          ();
    for (const [i, k] of chain(a)) if (k <= r) want.set(i, [LIFT * depth * clamp(1 - k / (r + 1), 0, 1), k]);
    cs.forEach((c, i) => {
      const [to, k] = want.get(i) || [0, (held.get(i) || [0, 0])[1]];
      if (instant) c.z = tween(to);
      else tset(c.z, to, now, k * STEP);
    });
    held = want;
    if (lit !== a) { if (lit !== null) cs[lit].el.sil.classList.remove("hi"); lit = a; cs[a].el.sil.classList.add("hi"); }
    B.wake();
  }
  lift(REST, REST_REACH, REST_DEPTH, true);

  function choose(a               ) {
    if (a === act) return;
    act = a;
    if (a === null) { lift(REST, REST_REACH, REST_DEPTH); read.textContent = "rest"; }
    else { lift(a, reach, 1); read.textContent = `${cs[a].lane} · ${cs[a].n}`; }
  }

  /** The commit under a screen point, from the pucks' rest top, which every puck shares and none leaves when the pointer picks. */
  function hit(p      )                {
    const q = unproj(C, p[0], p[1], ZTOP);
    if (q[0] < BX0 || q[0] > BX1 || q[1] < BY0 || q[1] > BY1) return null;
    let best                = null, bd = Infinity;
    cs.forEach((c, i) => { const d = Math.hypot(c.x - q[0], c.y - q[1]); if (d < bd) { bd = d; best = i; } });
    return best;
  }

  bag.add(pointer(stage, { move: (p) => choose(hit(p)), leave: () => choose(null) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { reach = v; if (act !== null) lift(act, reach, 1); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/cabinet":function(__require,module){
const {Cam,clamp,facing,fit,hull,open,poly,prism,proj,rings,rrect,run,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Cabinet: a server rack of twelve 1U blades between two drilled rails, on a
 * plinth. Each blade is a chassis behind a faceplate: ears with pull handles
 * on the rails, four drive bays, a vent and a status lamp. The pointer's
 * height is read on the rack's closed front, and the blades near it slide out
 * along their rails, the farther the less, each on its own spring; the one
 * under it comes all the way and its lamp lights. At rest the last update has
 * stopped part-way: blade 7 half out and lit, a few others caught on the way.
 * The slider is the reach, in blades.
 *
 * The pattern: a continuous field, as Keyboard's, over a stack: a spring per
 * blade, a falloff by distance, a hit test on the rest pose's planes.
 */

const N = 12, U = 10.4, BH = 9.6, W = 84, EAR = 4, FT = 2, D = 44, OUT = 26;
const X0 = -10, X1 = W + 10, Z0 = 6, ZB = 11, ZT = ZB + (N - 1) * U + BH, H = ZT + 6;
/** Where the last update stopped: blade 7 half out, its neighbours and two others caught on their way. */
const REST = [0, 0, 0.2, 0, 0, 0.3, 0.58, 0.26, 0, 0, 0.13, 0];
const LIT = 6;

/** The share of full travel a blade comes out, u reaches from the pointer: all of it under the pointer, none past the reach. */
const falloff = (u        ) => (u >= 1 ? 0 : (1 - u) * (1 - u));
/** On a plate's front face, the samples whose edge meets its top or its right side: they lie inside the silhouette. */
const inner = (q        ) => 0.375 * q.nu + 0.307 * q.nv > 0;

/** A plate standing in the x-z plane, from y0 back to y1 front: its silhouette, and the crease of its front face. */
function slab(P           , ring      , inset             , y0        , y1        ) {
  const at = (r      , y        ) => r.map((q)       => P(q.u, y, q.v));
  return { sil: poly(hull(at(ring, y0).concat(at(ring, y1)))), crease: inset ? open(at(run(inset, inner), y1)) : "" };
}

              
                       
                                       
                                                                              
                            
  

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.5);
  const yo = D + FT + OUT;
  fit(C, [[X0, 0, 0], [X1, 0, H], [X1, D, 0], [X0, 0, H], [-EAR, yo, ZB], [-EAR, yo, ZT], [W + EAR, yo, ZB]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value, over                = null, lit               = null;

  const g = mk("g", {}, svg);
  // the plinth, set back under the cabinet, then the cabinet itself
  const [pr, pi] = rings(X0 + 3, 3, X1 - 3, D - 3, 3, 1.2);
  put(solid(g), prism(P, front, pr, pi, 0, Z0));
  const [br, bi] = rings(X0, 0, X1, D, 3.5, 1.6);
  put(solid(g), prism(P, front, br, bi, Z0, H));
  // its front: the opening's edge round the rails, a hole in each rail for every U; and the side panel's inset
  const onFront = (r      ) => r.map((q)       => P(q.u, D, q.v)), onSide = (r      ) => r.map((q)       => P(X1, q.u, q.v));
  mk("path", { d: poly(onFront(rrect(-7.6, ZB - 2.2, W + 7.6, ZT + 2.2, 2, 4))) + poly(onSide(rrect(5, Z0 + 7, D - 5, H - 7, 3, 4))), class: "lo nf" }, g);
  for (let i = 0; i < N; i++) for (const x of [-5.8, W + 5.8]) {
    place(mk("circle", { r: 0.75, class: "dot off" }, g), P(x, D, ZB + i * U + BH / 2));
  }

  // Bottom to top: the camera looks down, so a lower blade can never cover a higher one.
  const blades          = [];
  for (let i = 0; i < N; i++) {
    const z = ZB + i * U, gi = mk("g", {}, g);
    blades.push({
      i, z,
      body: rrect(0, z + 0.4, W, z + BH - 0.4, 1.6, 4),
      face: rrect(-EAR, z, W + EAR, z + BH, 2, 4),
      faceIn: rrect(-EAR + 0.8, z + 0.8, W + EAR - 0.8, z + BH - 0.8, 1.2, 4),
      chassis: solid(gi), plate: solid(gi),
      marks: mk("path", { class: "lo nf" }, gi),
      lamp: mk("circle", { r: 1.1, class: "dot off" }, gi),
      sp: spring(OUT * REST[i], { eps: 0.02 }), drawn: NaN,
    });
  }

  /** Blade b's faceplate marks, drawn on its front at y: two handles, four bays, a vent. */
  function marks(b       , y        ) {
    const z = b.z, F = (r      ) => poly(r.map((q)       => P(q.u, y, q.v)));
    let d = F(rrect(-3.4, z + 2, -1.2, z + BH - 2, 1, 3)) + F(rrect(W + 1.2, z + 2, W + 3.4, z + BH - 2, 1, 3));
    for (let k = 0; k < 4; k++) d += F(rrect(4 + k * 10.6, z + 2, 13.8 + k * 10.6, z + BH - 2, 1, 3));
    for (let k = 0; k < 8; k++) d += seg(P(50 + k * 2.6, y, z + 2.5), P(50 + k * 2.6, y, z + BH - 2.5));
    return d;
  }

  function drawBlade(b       ) {
    const o = b.sp.x;
    if (o === b.drawn) return;
    b.drawn = o;
    const yf = D + o + FT, zm = b.z + BH / 2;
    const ch = slab(P, b.body, null, D, D + o + 0.5);
    // the slide: where the chassis's side rides out along its rail
    put(b.chassis, { sil: ch.sil, crease: seg(P(W, D, zm), P(W, D + o, zm)) });
    put(b.plate, slab(P, b.face, b.faceIn, D + o, yf));
    b.marks.setAttribute("d", marks(b, yf));
    place(b.lamp, P(W - 5, yf, zm));
  }

  function light(b       ) {
    if (b === lit) return;
    if (lit) { lit.plate.sil.classList.remove("hi"); lit.lamp.setAttribute("class", "dot off"); }
    lit = b;
    lit.plate.sil.classList.add("hi");
    lit.lamp.setAttribute("class", "dot");
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const b of blades) { if (stepS(b.sp, dt)) m = true; drawBlade(b); }
    return m;
  });
  bag.add(B.unregister);

  // The hit test: the pointer is put on the rack's planes with every blade home, which never move.
  const o0 = P(0, 0, 0), E = [P(1, 0, 0), P(0, 1, 0), P(0, 0, 1)].map((p) => [p[0] - o0[0], p[1] - o0[1]]);
  /** The world point under screen point p on the plane where coordinate `axis` is c. */
  function onPlane(p      , axis        , c        )       {
    const [a, k] = [0, 1, 2].filter((n) => n !== axis), ea = E[a], ek = E[k];
    const rx = p[0] - o0[0] - c * E[axis][0], ry = p[1] - o0[1] - c * E[axis][1], det = ea[0] * ek[1] - ea[1] * ek[0];
    const w       = [0, 0, 0];
    w[axis] = c; w[a] = (rx * ek[1] - ry * ek[0]) / det; w[k] = (ea[0] * ry - ea[1] * rx) / det;
    return w;
  }
  /** The pointer's height, in blades from the bottom one, or null off the rack: first on each faceplate where it
   * stands at rest, top down as a higher blade covers a lower one; then on the closed front, and the side panel. */
  function hit(p      )                {
    for (let i = N - 1; i >= 0; i--) {
      const q = onPlane(p, 1, D + FT + OUT * REST[i]), z = (q[2] - ZB - BH / 2) / U;
      if (q[0] >= -EAR && q[0] <= W + EAR && Math.abs(z - i) <= 0.5) return z;
    }
    const f = onPlane(p, 1, D + FT), s = onPlane(p, 0, X1);
    let z                = null;
    if (f[0] >= X0 - OUT - 4 && f[0] <= X1 && f[2] >= -OUT * 0.8 && f[2] <= H) z = f[2];
    else if (s[1] >= 0 && s[1] <= D && s[2] >= 0 && s[2] <= H + 4) z = s[2];
    return z === null ? null : clamp((z - ZB - BH / 2) / U, 0, N - 1);
  }

  function retarget() {
    if (over === null) {
      for (const b of blades) b.sp.t = OUT * REST[b.i];
      light(blades[LIT]); read.textContent = "rest";
    } else {
      for (const b of blades) b.sp.t = OUT * falloff(Math.max(0, Math.abs(b.i - over) - 0.5) / R);
      const a = Math.round(over);
      light(blades[a]); read.textContent = "blade " + (a + 1);
    }
    B.wake();
  }
  light(blades[LIT]);

  bag.add(pointer(stage, {
    move: (p) => { over = hit(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over !== null) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/dish":function(__require,module){
const {Cam,circ,facing,fit,hull,open,poly,prism,proj,rad,ringAt,rings,rrect,run,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,flatDot,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Dish: a parabolic dish on a two-axis gimbal. A base plate engraved with an
 * azimuth scale, a turntable with an index dot, and a yoke whose two arms hold
 * the elevation axis; the dish hangs on it by two trunnions at its rim, with a
 * feed horn on three struts at its focus. The pointer aims the dish, as if it
 * stood in front of the screen: azimuth and elevation each ride a spring. The
 * bowl's outline is computed at every pose: the rim circle projected, and the
 * hull of the rim and the back. The reach is clamped so the dish always shows
 * its inside. At rest it looks off to the right, rim bright. The slider is the
 * azimuth reach, in degrees; elevation reaches half of it.
 *
 * The pattern: a continuous aim. Two springs, a clamped reach, a hit test that
 * reads only the pointer, and a paint order fixed by separating planes.
 */

const R = 26, FOC = 17, SK = 1.4, DEP = (R * R) / (4 * FOC), ZE = 46, W = 31, T = 5, ZB = 10, ZY = 16;
const AZ0 = 45, EL0 = 40, REST = [-20, 30], PIV       = [0, 0, ZE];
const ax = (p      , q      , s        )       => [p[0] + q[0] * s, p[1] + q[1] * s, p[2] + q[2] * s];
const dot3 = (p      , q      ) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];

                                                                
/** An aim's frame: h and e on the ground (e is the elevation axis), a the dish's axis, u the rim's up. */
function frame(th        , ph        )        {
  const t = rad(th), f = rad(ph), c = Math.cos(f), s = Math.sin(f);
  const h       = [Math.cos(t), Math.sin(t), 0], e       = [-Math.sin(t), Math.cos(t), 0];
  return { th, h, e, a: [h[0] * c, h[1] * c, s], u: [-h[0] * s, -h[1] * s, c] };
}
/** A point of the dish: `along` its axis from the rim's centre, rho out from it at angle psi. */
const onDish = (F       , along        , rho        , psi        ) => ax(ax(ax(PIV, F.a, along), F.e, rho * Math.cos(psi)), F.u, rho * Math.sin(psi));
/** A circle of n points about centre c, in the plane of x and y. */
const disc = (c      , x      , y      , r        , n        ) => Array.from({ length: n }, (_, i) => ax(ax(c, x, r * Math.cos((2 * Math.PI * i) / n)), y, r * Math.sin((2 * Math.PI * i) / n)));
/** A ring drawn in the (h, e) frame turned onto the ground. */
const turn = (ring      , F       )       => ring.map((q) => ({
  u: q.u * F.h[0] + q.v * F.e[0], v: q.u * F.h[1] + q.v * F.e[1], nu: q.nu * F.h[0] + q.nv * F.e[0], nv: q.nu * F.h[1] + q.nv * F.e[1],
}));

             
                                                  
                                                         
                                     
  

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let reach = value, over              = null;

  // Fitted to the four corners of the widest reach, and rest, so nothing leaves the frame.
  const C = Cam(45, 0.5, 2.5), pts         = [[-30, -30, 0], [30, 30, 0], [30, -30, 0], [-30, 30, 0]];
  for (const [th, ph] of [[-25, 5], [-25, 75], [115, 5], [115, 75], REST]) {
    const F = frame(th, ph);
    pts.push(...disc(PIV, F.e, F.u, R, 16), onDish(F, FOC - DEP + 3, 0, 0));
    for (const s of [-1, 1]) pts.push(ax(ax(PIV, F.e, s * (W + T / 2)), [0, 0, 1], 6));
  }
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C), Pv = (q      ) => P(q[0], q[1], q[2]);
  // the direction toward the camera, from the projection itself
  const o = P(0, 0, 0), cx = P(1, 0, 0), cy = P(0, 1, 0), cz = P(0, 0, 1);
  const r1 = [cx[0] - o[0], cy[0] - o[0], cz[0] - o[0]], r2 = [cx[1] - o[1], cy[1] - o[1], cz[1] - o[1]];
  const cross       = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
  const vl = Math.hypot(...cross) * Math.sign(cross[2]);
  const VD = cross.map((x) => x / vl)        ;

  // Static, back to front: the base, its azimuth scale, the turntable.
  const g = mk("g", {}, svg);
  const [br, bi] = rings(-30, -30, 30, 30, 9, 2);
  put(solid(g), prism(P, front, br, bi, 0, 5));
  for (let i = 0; i < 36; i++) {
    const t = (i / 36) * 2 * Math.PI, r = i % 9 === 0 ? 26.5 : 25.5;
    place(flatDot(g, C, i % 9 === 0 ? 0.75 : 0.5, "dot off"), P(r * Math.cos(t), r * Math.sin(t), 5));
  }
  put(solid(g), prism(P, front, circ(20, 48), circ(18.8, 48), 5, ZB));
  const index = flatDot(g, C, 0.8, "dot m");

  // Turning with the azimuth: the yoke's beam, then each side's arm, bearing and trunnion, in an order set per frame.
  const beam = solid(g);
  const yb = W + T / 2 + 1, [bmr, bmi] = rings(-9, -yb, 9, yb, 4, 1.4);
  const dishG = mk("g", {}, g);
  const sides         = [-1, 1].map((s) => {
    const sg = mk("g", {}, g);
    return {
      s, g: sg, near: null,
      ring: mk("path", { class: "nf" }, sg), arm: solid(sg), trun: mk("path", { class: "sil" }, sg),
      foot: rrect(-8, s * W - T / 2, 8, s * W + T / 2, 2.5, 4),
      top: rrect(-5.5, s * W - T / 2, 5.5, s * W + T / 2, 2.5, 4),
      inner: rrect(-4.5, s * W - T / 2 + 1, 4.5, s * W + T / 2 - 1, 1.5, 4),
    };
  });

  // The dish: its outline, a panel seam and the hub at its vertex seen through the aperture, the rim, the struts, the feed.
  const outline = mk("path", { class: "sil" }, dishG), seam = mk("path", { class: "nf lo" }, dishG), hubR = mk("path", { class: "nf lo" }, dishG);
  const rim = mk("path", { class: "nf hi" }, dishG), struts = mk("path", { class: "nf" }, dishG);
  const feed = solid(dishG);
  const BACK = [0, 0.35, 0.6, 0.78, 0.9, 0.97, 1];

  /** The seam at rho: the run of it seen through the aperture, its ends cut where the sight line meets the rim. */
  function seen(F       , rho        , n        ) {
    const along = (rho * rho) / (4 * FOC) - DEP, t = -along / dot3(F.a, VD), q         = [], s           = [];
    for (let i = 0; i < n; i++) {
      q.push(onDish(F, along, rho, (2 * Math.PI * i) / n));
      const hit = ax(q[i], VD, t);
      s.push(R - Math.hypot(hit[0] - PIV[0], hit[1] - PIV[1], hit[2] - PIV[2]));
    }
    if (s.every((x) => x > 0)) return poly(q.map(Pv));
    const i0 = s.findIndex((x, i) => x > 0 && s[(i + n - 1) % n] <= 0);
    if (i0 < 0) return "";
    const cut = (i        , j        ) => Pv(ax(q[i], [q[j][0] - q[i][0], q[j][1] - q[i][1], q[j][2] - q[i][2]], s[i] / (s[i] - s[j])));
    const out = [cut((i0 + n - 1) % n, i0)];
    let i = i0;
    while (s[i] > 0) { out.push(Pv(q[i])); i = (i + 1) % n; }
    out.push(cut((i + n - 1) % n, i));
    return open(out);
  }

  let drawn = "";
  function draw(th        , ph        ) {
    const key = th.toFixed(3) + "," + ph.toFixed(3);
    if (key === drawn) return;
    drawn = key;
    const F = frame(th, ph);
    place(index, P(18 * F.h[0], 18 * F.h[1], ZB));
    put(beam, prism(P, front, turn(bmr, F), turn(bmi, F), ZB, ZY));
    // a side whose outer face looks at the camera paints after the dish, inside out; the other before it, outside in
    for (const sd of sides) {
      const near = sd.s * dot3(F.e, VD) > 0;
      if (near !== sd.near) {
        sd.near = near;
        if (near) { sd.g.append(sd.trun, sd.arm.g, sd.ring); dishG.after(sd.g); }
        else { sd.g.append(sd.ring, sd.arm.g, sd.trun); dishG.before(sd.g); }
      }
      put(sd.arm, {
        sil: poly(hull(ringAt(P, turn(sd.foot, F), ZY).concat(ringAt(P, turn(sd.top, F), ZE + 6)))),
        crease: open(ringAt(P, run(turn(sd.inner, F), front), ZE + 6)),
      });
      const zz       = [0, 0, 1], out = ax(PIV, F.e, sd.s * (W + T / 2));
      sd.ring.setAttribute("d", poly(disc(out, F.h, zz, 3.4, 24).map(Pv)));
      sd.trun.setAttribute("d", poly(hull(disc(ax(PIV, F.e, sd.s * R), F.h, zz, 2.2, 16).concat(disc(ax(PIV, F.e, sd.s * (W - T / 2)), F.h, zz, 2.2, 16)).map(Pv))));
    }
    // the bowl: its outline is the hull of the rim and the back, a skin SK thick; the rim is all seen, as the reach keeps the inside to the camera
    const lip = disc(PIV, F.e, F.u, R, 72), back         = [];
    for (const f of BACK) for (let i = 0; i < 40; i++) back.push(onDish(F, (f * f * R * R) / (4 * FOC) - DEP - SK, f * R, (2 * Math.PI * i) / 40));
    outline.setAttribute("d", poly(hull(lip.concat(back).map(Pv))));
    seam.setAttribute("d", seen(F, 0.62 * R, 48));
    hubR.setAttribute("d", seen(F, 3.2, 20));
    rim.setAttribute("d", poly(lip.map(Pv)));
    const mouth = onDish(F, FOC - DEP - 3, 0, 0), tail = onDish(F, FOC - DEP + 3, 0, 0);
    struts.setAttribute("d", [90, 210, 330].map((d) => seg(Pv(onDish(F, 0, R, rad(d))), Pv(mouth))).join(""));
    put(feed, {
      sil: poly(hull(disc(mouth, F.e, F.u, 3.6, 16).concat(disc(tail, F.e, F.u, 2.4, 16)).map(Pv))),
      crease: poly(disc(tail, F.e, F.u, 1.3, 16).map(Pv)),
    });
  }

  const az = spring(REST[0], { eps: 0.01 }), el = spring(REST[1], { eps: 0.01 });
  const B = register(stage, (dt) => {
    const a = stepS(az, dt), b = stepS(el, dt);
    draw(az.x, el.x);
    return a || b;
  });
  bag.add(B.unregister);

  // The aim reads only the pointer's offset from the axis on screen, never what is drawn: nothing can flicker.
  const hub = P(0, 0, ZE);
  function retarget() {
    if (over) {
      az.t = AZ0 - reach * Math.tanh((over[0] - hub[0]) / 120);
      el.t = EL0 + (reach / 2) * Math.tanh((hub[1] - over[1]) / 90);
      read.textContent = `az ${Math.round((az.t + 360) % 360)} · el ${Math.round(el.t)}`;
    } else { az.t = REST[0]; el.t = REST[1]; read.textContent = "rest"; }
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = p; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { reach = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/drawer":function(__require,module){
const {Cam,facing,fit,hull,open,poly,prism,proj,rings,rrect,run}=__require("core/iso");
const {tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {TABLE}=__require("intensity");

/**
 * Drawer: a filing cabinet of three deep drawers on a plinth, each front with
 * a bar pull. The pointer's height picks a drawer; it slides out on its
 * runners and shows its inside, two dim dividers running back and nothing
 * between them. The others close. At rest the middle drawer stands a quarter
 * out, its front bright. The slider is how far a drawer comes out.
 *
 * The pattern: one of many, as Sieve's. A tween per drawer on how far it is
 * out. The pick puts the pointer on each front's plane where it stands at
 * rest, which moves only with the slider, never with the drawer on screen.
 * Only a drawer whose tween moved is drawn again.
 */

const N = 3, W = 54, D = 60, Z0 = 5, M = 3, PITCH = 26, G = 1.6, FT = 2.4; // drawers, carcass width and depth, plinth, margin round the fronts, a drawer's pitch, the gap between fronts, a front's thickness
const T = 1.3, IN = 3.2, LOW = 2.2, HIGH = 3.6, DIV = 2.6, S = 2.1;       // a wall's thickness, the box's inset from its front's sides, below its front's foot and its top, how far the dividers sit under the walls, scale
const ZB = Z0 + M, H = ZB + N * PITCH + M, REST = 0.7;                     // the lowest front's foot, the carcass's top, the rest pull as a share of the slider's

/** On a front's face, the samples whose edge meets its top or its right side: they lie inside the silhouette. */
const inner = (q        ) => 0.375 * q.nu + 0.307 * q.nv > 0;

/** A plate standing in the x-z plane, from y0 back to y1 front: its silhouette, and the crease of its front face. */
function slab(P           , ring      , inset      , y0        , y1        ) {
  const at = (r      , y        ) => r.map((q)       => P(q.u, y, q.v));
  return { sil: poly(hull(at(ring, y0).concat(at(ring, y1)))), crease: open(at(run(inset, inner), y1)) };
}

                                                                                                            

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const MAX = TABLE.drawer[2];
  const C = Cam(45, 0.5, S);
  // The carcass, and the top and bottom drawers out as far as the slider goes, each mirrored through the
  // carcass's middle: the cabinet stands in the middle of the frame, and the farthest pull still fits.
  const out = D + MAX + FT, ext         = [[0, 0, 0], [W, 0, 0], [0, 0, H], [W, 0, H], [W, D, 0], [0, out, ZB], [0, out, H - M], [W, out, ZB]];
  fit(C, ext.concat(ext.map(([x, y, z])       => [W - x, D - y, H - z])), 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // The plinth, set back under the carcass, then the carcass.
  const [pr, pi] = rings(3, 3, W - 3, D - 3, 2.4, 1);
  put(solid(g), prism(P, front, pr, pi, 0, Z0));
  const [cr, ci] = rings(0, 0, W, D, 3, 1.4);
  put(solid(g), prism(P, front, cr, ci, Z0, H));

  const x0 = M + IN, x1 = W - M - IN, xs = [x0 + (x1 - x0) / 3, x0 + (2 * (x1 - x0)) / 3];
  const onFace = (r      , y        ) => poly(r.map((q)       => P(q.u, y, q.v)));
  // Each drawer's opening on the carcass's face: hidden by its front, seen above its box when it is out.
  mk("path", { class: "nf lo", d: Array.from({ length: N }, (_, k) => {
    const z = ZB + k * PITCH + G / 2;
    return onFace(rrect(x0 - 0.8, z + LOW - 0.8, x1 + 0.8, z + PITCH - G - HIGH + 1.4, 0.8, 2), D);
  }).join("") }, g);

  // Bottom to top: the camera looks down, so a lower drawer never covers a higher one.
  // In a drawer, back to front: its floor, left wall, dividers, right wall, the box's outline, its front, its pull.
  const drawers           = Array.from({ length: N }, (_, k) => {
    const z0 = ZB + k * PITCH + G / 2, z1 = z0 + PITCH - G, dg = mk("g", {}, g);
    const parts = [0, 1, 2, 3].map(() => mk("path", { class: "lo" }, dg));
    parts.push(mk("path", { class: "nf sil" }, dg));
    return { z0, z1, parts, front: solid(dg), pull: solid(dg), drawn: NaN };
  });
  const face = (d        ) => rrect(M, d.z0, W - M, d.z1, 1.6, 4), faceIn = (d        ) => rrect(M + 1, d.z0 + 1, W - M - 1, d.z1 - 1, 1, 4);

  /** A box from y0 to y1 with a rounded footprint, standing from z0 to z1: its silhouette. */
  const box = (a        , b        , y0        , y1        , z0        , z1        , r        ) =>
    y1 - y0 < 0.05 ? "" : prism(P, front, rrect(a, y0, b, y1, r, 3), null, z0, z1).sil;

  function draw(d        , o        ) {
    if (o === d.drawn) return;
    d.drawn = o;
    const zb = d.z0 + LOW, zt = d.z1 - HIGH, yb = D + o, yf = yb + FT;
    const [floor, left, divs, right, outline] = d.parts;
    floor.setAttribute("d", box(x0, x1, D, yb, zb, zb + T, 0.6));
    left.setAttribute("d", box(x0, x0 + T, D, yb, zb + T, zt, 0.5));
    divs.setAttribute("d", xs.map((x) => box(x - 0.5, x + 0.5, D, yb, zb + T, zt - DIV, 0.4)).join(""));
    right.setAttribute("d", box(x1 - T, x1, D, yb, zb + T, zt, 0.5));
    outline.setAttribute("d", box(x0, x1, D, yb, zb, zt, 0.8));
    put(d.front, slab(P, face(d), faceIn(d), yb, yf));
    const zp = (d.z0 + d.z1) / 2, xm = W / 2;
    const [br, bi] = rings(xm - 9, yf, xm + 9, yf + 2.6, 1.3, 0.6);
    put(d.pull, prism(P, front, br, bi, zp - 1.3, zp + 1.3));
  }

  const tw = drawers.map(() => tween(0));
  const B = register(stage, (_dt, now) => {
    let m = false;
    drawers.forEach((d, k) => { draw(d, tval(tw[k], now)); if (!tdone(tw[k], now)) m = true; });
    return m;
  });
  bag.add(B.unregister);

  let pull = value, picked = -2;
  /** Opens drawer f, counted from the bottom, and closes the rest; -1 puts the cabinet back to rest. */
  function choose(f        , now        ) {
    if (f === picked) return;
    picked = f;
    const a = f < 0 ? 1 : f;
    tw.forEach((t, k) => tset(t, k === a ? (f < 0 ? pull * REST : pull) : 0, now, 0));
    drawers.forEach((d, k) => d.front.sil.classList.toggle("hi", k === a));
    read.textContent = f < 0 ? "rest" : `drawer ${N - f} · 0`;
    B.wake();
  }
  tw[1] = tween(pull * REST);
  choose(-1, -1e9);
  drawers.forEach((d, k) => draw(d, tval(tw[k], 0)));

  /** The world x and z under screen point p on the upright plane y = yf: the projection, inverted. */
  const c = Math.cos(C.az), s = Math.sin(C.az), zf = Math.sqrt(1 - C.k * C.k);
  const onFront = (p      , yf        )       => { const x = (p[0] - C.ox) / (C.S * c) + (yf * s) / c; return [x, ((x * s + yf * c) * C.k - (p[1] - C.oy) / C.S) / zf]; };
  /** The drawer under p: first on each front where it stands at rest, top down as a higher drawer covers a lower one;
   * off every front, the nearest middle in z on the closed front. */
  function pick(p      ) {
    for (let k = N - 1; k >= 0; k--) {
      const [x, z] = onFront(p, D + FT + (k === 1 ? pull * REST : 0)), d = drawers[k];
      if (x >= M && x <= W - M && z >= d.z0 && z <= d.z1) return k;
    }
    const z = onFront(p, D + FT)[1];
    return drawers.reduce((best, d, k) => (Math.abs(z - (d.z0 + d.z1) / 2) < Math.abs(z - (drawers[best].z0 + drawers[best].z1) / 2) ? k : best), 0);
  }

  bag.add(pointer(stage, { move: (p) => choose(pick(p), __hairClock.now), leave: () => choose(-1, __hairClock.now) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { pull = v; const f = picked; picked = -2; choose(f, __hairClock.now); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/elevator":function(__require,module){
const {Cam,circ,clamp,facing,fillet,fit,hull,open,poly,prism,proj,rings,rrect,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,flatDot,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Elevator: an open shaft, two walls at its back, the car inside it on two
 * guide rails, and four floors running off to the right of it, one landing
 * in front of the car's door on each. A rope runs from the car's crosshead
 * up through the head slab, over the traction sheave and down to a
 * counterweight that falls as the car rises. The pointer's height on the stage
 * picks a floor; the car travels there on a spring, through every floor in
 * between, and the floor it is bound for takes the bright stroke. At rest the
 * car is caught between the first and the second floor, bright. The slider is
 * the car's spring stiffness: stiffer travels faster.
 *
 * The pattern: scrub and pick. A spring for where the car is, a choice read
 * from the fixed floors, never from the car on screen.
 */

                                            

const SX = 32, SY = 34, FH = 36, CH = 25, T = 2.5, NF = 4, TOP = 3 * FH + CH + 7;
const CAR      = [5, 7, 28, 27], RX = 16.5, CW      = [-8, 11, -2, 23], CWH = 17;
const WALL = 2;
/** The plinth: under the shaft, and under the floors where they run back past the shaft's wall, no further. */
const BASE = fillet([[-16, -2], [33, -2], [33, -56], [76, -56], [76, 38], [-16, 38]], [3, 2, 4, 6, 6, 6]);
/** A floor's outline: the plate to the right of the shaft and the landing in front of the car's door, as one L. */
const FLOOR = fillet([[33, -56], [72, -56], [72, -6], [43, -6], [43, 34], [33, 34]], [4, 4, 4, 3, 3, 3]);
const CWX = (CW[0] + CW[2]) / 2, SR = (RX - CWX) / 2;
/** The sheave's centre. */
const SC       = [CWX + SR, SY / 2, TOP + 3 + SR + 2];
const REST_Z = 1.5 * FH - 4;
const NAMES = ["ground", "floor 1", "floor 2", "floor 3"];

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.3);
  fit(C, [[-16, -56, -8], [76, 38, -8], [76, -56, -8], [-16, 38, -8], [SC[0], SC[1], SC[2] + SR]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const block = (box     , r        , b        , z0        , z1        ) => { const [o, i] = rings(...box, r, b); put(solid(g), prism(P, front, o, i, z0, z1)); };
  const line = (cls        ) => mk("path", { class: cls }, g);
  // A slab on any outline, convex or not: its silhouette is the far run of the
  // top joined to the near run of the underside; the top's near run is the crease.
  const slab = (pts        , z0        , z1        ) => {
    const n = pts.length, near = pts.map((p, i) => { const q = pts[(i + 1) % n]; return q[1] - p[1] - (q[0] - p[0]) > 0; });
    const runOf = (want         ) => {
      const s = near.findIndex((f, i) => f === want && near[(i + n - 1) % n] !== want), out         = [];
      for (let i = s; near[i % n] === want; i++) out.push(pts[i % n]);
      return out.concat([pts[(s + out.length) % n]]);
    };
    const at = (r        , z        ) => r.map((p) => P(p[0], p[1], z)), back = runOf(false), fore = runOf(true);
    const sil = mk("path", { class: "sil", d: poly(at(back, z1).concat(at(fore, z0))) }, g);
    mk("path", { class: "nf lo", d: open(at(fore, z1)) }, g);
    return sil;
  };

  // The plinth, the shaft's two back walls, then back to front: the far rail,
  // the counterweight and its rope, the car, the near rail.
  slab(BASE, -8, -T);
  block([-14 - WALL, -WALL, -14, SY], 1, 0.5, -T, TOP);
  block([-14, -WALL, SX, 0], 1, 0.5, -T, TOP);
  block([RX - 1.3, 3, RX + 1.3, 5.4], 0.8, 0.5, -T, TOP);
  const [cwo, cwi] = rings(...CW, 1.6, 0.8);
  const cw = solid(g), cwBands = line("nf lo"), cwRope = line("nf");
  const [co, ci] = rings(...CAR, 2.4, 1.1);
  const car = solid(g), door = line("nf"), split = line("nf lo");
  const [ho, hi] = rings(RX - 1.7, 5.4, RX + 1.7, 28.6, 0.8, 0.5);
  const head = solid(g), rope = line("nf");
  block([RX - 1.3, 28.6, RX + 1.3, 31], 0.8, 0.5, -T, TOP);

  // The head slab, the machine behind the sheave, the ropes up to it, the sheave.
  block([-14 - WALL, -WALL, SX + 1, SY + 1], 4, 1.4, TOP, TOP + 3);
  block([CWX + 2, 4, RX - 2, SY / 2 - 3], 2, 1, TOP + 3, SC[2] + 4);
  mk("path", { class: "nf", d: seg(P(RX, SY / 2, TOP + 3), P(RX, SY / 2, SC[2])) + seg(P(CWX, SY / 2, TOP + 3), P(CWX, SY / 2, SC[2])) }, g);
  const disc = (y        , r        ) => circ(r, 28).map((q) => P(SC[0] + q.u, y, SC[2] + q.v));
  put(solid(g), { sil: poly(hull(disc(SY / 2 - 1.8, SR).concat(disc(SY / 2 + 1.8, SR)))), crease: poly(disc(SY / 2 + 1.8, SR - 1.4)) });
  const spokes = line("nf lo");
  mk("path", { class: "nf lo", d: poly(disc(SY / 2 + 1.8, 2.6)) }, g);

  // The floors, bottom to top: each an L-shaped slab, two columns at its
  // right holding up the next, and its number in dots on the landing by the door.
  const lands                                                            = [];
  for (let f = 0; f < NF; f++) {
    const z = f * FH, sil = slab(FLOOR, z - T, z);
    if (f < NF - 1) for (const y of [-53, -15]) block([62, y, 68, y + 6], 1.5, 0.8, z, z + FH - T);
    const dots                      = [];
    for (let k = 0; k <= f; k++) { const d = flatDot(g, C, 0.8, "dot off"); place(d, P(37, CAR[1] - 3 - k * 3, z)); dots.push(d); }
    lands.push({ sil, dots });
  }

  const sp = spring(REST_Z, { k: value, c: 1.8 * Math.sqrt(value) });
  let drawn = NaN, chosen                = null;

  function draw(z        ) {
    const zc = 3 * FH - z + 6, mid = (CAR[1] + CAR[3]) / 2;
    put(cw, prism(P, front, cwo, cwi, zc, zc + CWH));
    cwBands.setAttribute("d", [5, 9, 13].map((v) => seg(P(CW[0] + 0.6, CW[3], zc + v), P(CW[2] - 0.6, CW[3], zc + v))).join(""));
    cwRope.setAttribute("d", seg(P(CWX, SY / 2, zc + CWH), P(CWX, SY / 2, TOP)));
    put(car, prism(P, front, co, ci, z, z + CH));
    door.setAttribute("d", poly(rrect(CAR[1] + 3.5, z + 1.2, CAR[3] - 3.5, z + CH - 4, 1.2, 4).map((q) => P(CAR[2], q.u, q.v))));
    split.setAttribute("d", seg(P(CAR[2], mid, z + 1.2), P(CAR[2], mid, z + CH - 4)));
    put(head, prism(P, front, ho, hi, z + CH, z + CH + 2.4));
    rope.setAttribute("d", seg(P(RX, SY / 2, z + CH + 2.4), P(RX, SY / 2, TOP)));
    // the sheave turns as the rope runs over it
    const a = z / SR, y = SY / 2 + 1.8, at = (t        , r        ) => P(SC[0] + Math.cos(t) * r, y, SC[2] + Math.sin(t) * r);
    spokes.setAttribute("d", [0, 1, 2, 3, 4, 5].map((k) => seg(at(a + k * Math.PI / 3, 2.6), at(a + k * Math.PI / 3, SR - 1.4))).join(""));
  }

  const B = register(stage, (dt) => {
    const m = stepS(sp, dt);
    if (sp.x !== drawn) { drawn = sp.x; draw(sp.x); }
    return m;
  });
  bag.add(B.unregister);

  // The floor under the pointer: its height read on the fixed column of the car's door, against the floors, which never move.
  const base = P(CAR[2], SY / 2, 0)[1], perZ = base - P(CAR[2], SY / 2, 1)[1];
  const pick = (p      ) => clamp(Math.floor(((base - p[1]) / perZ + 8) / FH), 0, NF - 1);

  function choose(f        ) {
    if (f === chosen) return;
    chosen = f;
    sp.t = f < 0 ? REST_Z : f * FH;
    car.sil.classList.toggle("hi", f < 0);
    lands.forEach((l, i) => {
      l.sil.classList.toggle("hi", i === f);
      l.dots.forEach((d) => d.setAttribute("class", i === f ? "dot m" : "dot off"));
    });
    read.textContent = f < 0 ? "rest" : NAMES[f];
    B.wake();
  }
  choose(-1);

  bag.add(pointer(stage, { move: (p) => choose(pick(p)), leave: () => choose(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { sp.k = v; sp.c = 1.8 * Math.sqrt(v); B.wake(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/exploded":function(__require,module){
const {Cam,clamp,extremes,facing,fit,poly,prism,proj,ringAt,rings,rrect,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,flatDot,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Exploded — an app window taken apart into surface, sidebar, card and
 * popover. The pointer's x scrubs the gap through a spring; its y picks a
 * layer, which gets the bright edge, and its name and lift go to the
 * read-out. The bright edge is the whole callout. From the study's third
 * figure (design/lab-hairline/cartilha-v2.html).
 *
 * Picking is tested against the target gap, not the gap on screen, so the
 * layer under the pointer is the one it will be under once the spring lands.
 * Each layer's dashed drops (from its outermost points down to the layer
 * below) are painted before its plate, so a plate hides the guides behind it.
 */

                                             
              
               
                                                 
          
              
                                             
                       
                                           
                
                                                                           
             
  

const LAY          = [
  { name: "surface", r: [0, 0, 132, 96], rad: 7, segs: [[[1.5, 12], [130.5, 12]]], dots: [[7, 6], [13, 6], [19, 6]] },
  { name: "sidebar", r: [5, 17, 38, 91], rad: 4, segs: [[[10, 25], [28, 25]], [[10, 33], [32, 33]], [[10, 41], [24, 41]], [[10, 49], [30, 49]], [[10, 83], [22, 83]]] },
  { name: "card", r: [48, 22, 120, 62], rad: 5, segs: [[[54, 30], [92, 30]], [[54, 38], [112, 38]], [[54, 46], [104, 46]], [[54, 54], [80, 54]]] },
  { name: "popover", r: [80, 50, 126, 86], rad: 4, segs: [[[86, 58], [118, 58]], [[86, 74], [116, 74]], [[86, 80], [108, 80]]], sel: [83, 62, 123, 70] },
];

/** The gap's share of the max at rest (pointer away), and each slab's thickness. */
const REST = 0.18, TK = 2.4;

/** Even-odd point-in-polygon. */
function inside(pt      , pg                 ) {
  let c = false;
  for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) {
    const [xi, yi] = pg[i], [xj, yj] = pg[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let GAP = value, act = -1, lastP              = null;
  const e = spring(REST, { eps: 0.002 });
  const C = Cam(45, 0.5, 1.42);
  fit(C, [[0, 0, 0], [132, 96, 0], [132, 0, 0], [0, 96, 0], [0, 0, 3 * 34 + TK], [132, 0, 3 * 34 + TK]], 180, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  const els = LAY.map((L, i) => {
    const [ring, inner] = rings(...L.r, L.rad, 1.3);
    const ext           = extremes(P, ring);
    // The guide goes in before the plate: paint order is what hides it.
    const guide = i > 0 ? mk("path", { class: "nf dash" }, g) : null;
    const el        = solid(g);
    const marks = mk("path", { class: "nf" }, el.g);
    const selRing              = L.sel ? rrect(...L.sel, 2) : null;
    const selEl = L.sel ? mk("path", { class: "nf sil" }, el.g) : null;
    const dotEls = L.dots ? L.dots.map(() => flatDot(el.g, C, 1.6, "nf")) : null;
    return { ring, inner, ext, guide, el, marks, selRing, selEl, dotEls };
  });

  const corners = ([x0, y0, x1, y1]      , z        )         => [P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)];
  /** The topmost layer under the pointer, tested where the layers are going (target gap), not where they are. */
  function pick(p             ) {
    if (!p) return -1;
    for (let i = LAY.length - 1; i >= 0; i--) if (inside(p, corners(LAY[i].r, i * GAP * e.t + TK))) return i;
    return -1;
  }
  function setAct(a        ) {
    if (a === act) return;
    act = a;
    els.forEach((E, i) => E.el.sil.classList.toggle("hi", i === a));
    B.wake();
  }

  const B = register(stage, (dt) => {
    const m = stepS(e, dt), z = (i        ) => i * GAP * e.x;
    LAY.forEach((L, i) => {
      const E = els[i], zi = z(i), zt = zi + TK;
      put(E.el, prism(P, front, E.ring, E.inner, zi, zt));
      E.marks.setAttribute("d", L.segs.map(([a, b]) => seg(P(a[0], a[1], zt), P(b[0], b[1], zt))).join(""));
      if (E.selEl && E.selRing) E.selEl.setAttribute("d", poly(ringAt(P, E.selRing, zt)));
      if (E.dotEls && L.dots) L.dots.forEach(([dx, dy], k) => place(E.dotEls [k], P(dx, dy, zt)));
      if (E.guide) {
        const zp = z(i - 1) + TK;
        E.guide.setAttribute("d", E.ext.map((q) => seg(P(q.u, q.v, zi), P(q.u, q.v, zp))).join(""));
      }
    });
    read.textContent = act >= 0 ? `0${act + 1} · ${LAY[act].name} · z ${z(act).toFixed(1)}` : `gap ${(GAP * e.x).toFixed(1)}`;
    return m;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => { lastP = p; e.t = REST + (1 - REST) * clamp((p[0] - 60) / 280, 0, 1); setAct(pick(p)); B.wake(); },
    leave: () => { lastP = null; e.t = REST; setAct(-1); B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { GAP = v; if (lastP) setAct(pick(lastP)); B.wake(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/format":function(__require,module){
const {Cam,clamp,facing,fit,proj,rad,rrect,unproj}=__require("core/iso");
const {reducedMotion,spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {lid,slab}=__require("slab");

/**
 * Format: a file as a stack of ten thin slabs on a rounded board, one to a
 * line, indented like code. At rest it is unformatted: every line pivoted
 * about its own start, its indent wrong, none touching another. The pointer
 * runs the formatter down the file: every line above the pointer swings square
 * to its indent on a spring, staggered line by line; lines below stay as they
 * were. The line at the formatter's front takes the bright edge (none at
 * rest), which the kernel's stroke transition fades from line to line.
 * Leaving un-formats the file slowly, bottom-up, with no bounce.
 * The slider is the disorder, in degrees of the worst skew.
 *
 * The pattern: discrete items on springs. A stagger by distance, a hit test on
 * the ground plane (which never moves), and a rest that is a composition.
 */

const G = 12, WD = 5.5, T = 2.4, X0 = 8, IND = 13, PB = 5, STEP = 55, STEP_OUT = 80, MAXV = 14;
const BX0 = -9, BX1 = 118, BY0 = -8, BY1 = 9 * G + WD + 8, GUT = 1;
// Each line: indent level, length, and how it sits crooked at rest, as fractions of the slider's far end:
// yaw (about its own start, the indent point), dx (the indent error), dy (a small shift along the page), dz (unused: a raised line would cross its neighbour on screen).
// Picked by search so that no two lines touch at any slider value or any mix of their springs (lines further down are never less crooked than the ones above while the formatter runs).
const LINES                                                     = [
  [0, 56, 0.3, -8, -2, 0],
  [1, 40, 0.75, 8, -1.9, 0],
  [1, 58, 0.3, -8, -0.8, 0],
  [2, 74, 1, -8, -1.9, 0],
  [2, 48, 1, 8, 1.3, 0],
  [1, 34, 0.3, 8, 2, 0],
  [1, 66, 1, -8, -2, 0],
  [2, 52, 1, -8, -0.8, 0],
  [1, 30, 0.45, 8, 2, 0],
  [0, 22, 1, -8, 1.6, 0],
];
const N = LINES.length;

            
                                                                                                    
                                                              
                                                 
  

/** A ring turned by th degrees about (cx, cy) and moved by (dx, dy): normals turn with it. */
function turn(ring      , cx        , cy        , th        , dx        , dy        )       {
  const s = Math.sin(rad(th)), c = Math.cos(rad(th));
  return ring.map((q) => ({
    u: cx + (q.u - cx) * c - (q.v - cy) * s + dx, v: cy + (q.u - cx) * s + (q.v - cy) * c + dy,
    nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c,
  }));
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let mess = value / MAXV;

  // The camera is fitted to the board and to the most crooked, most raised line at the slider's far end.
  const C = Cam(45, 0.5, 1.9);
  fit(C, [[BX0, BY0, -PB], [BX1, BY0, -PB], [BX0, BY1, -PB], [BX1, BY1, -PB], [BX1, BY1, 9]], 200, 168);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [br, bi] = lid(BX0, BY0, BX1, BY1, 8, 2.2);
  put(solid(g), slab(P, front, br, bi, -PB, 0));
  // the gutter: a dashed guide on the board, before any line lies on it
  mk("path", { d: `M${P(X0 - 4, BY0 + 5, 0).join(" ")}L${P(X0 - 4, BY1 - 5, 0).join(" ")}`, class: "dash" }, g);

  const rows = LINES.map(([lv, len, yaw, dx, dy, dz], r) => {
    const x0 = X0 + lv * IND, y0 = r * G;
    const e = solid(g);
    return {
      r, yaw, dx, dy, dz, px: x0, py: y0 + WD / 2, drawn: NaN,
      ring: rrect(x0, y0, x0 + len, y0 + WD, 2.2, 6),
      sp: spring(1, { k: 100, c: 14, eps: 0.003 }), tgt: 1, due: -1, el: e,
      // the bright edge: the kernel's stroke transition fades it in and out; this only says when
      lit: false, wantLit: false, litDue: -1,
    }       ;
  });

  function draw(w     ) {
    const m = w.sp.x;
    if (m !== w.drawn) {
      w.drawn = m;
      const k = m * mess, th = w.yaw * MAXV * k, z = Math.max(0, m) * w.dz * mess;
      put(w.el, slab(P, front, turn(w.ring, w.px, w.py, th, w.dx * k, w.dy * k), null, z, z + T));
    }
  }

  let fr = -1;
  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const w of rows) {
      if (w.due >= 0) { if (now >= w.due) { w.sp.t = w.tgt; w.due = -1; } else moving = true; }
      if (stepS(w.sp, dt)) moving = true;
      if (w.litDue >= 0) {
        if (now >= w.litDue) { w.litDue = -1; if (w.lit !== w.wantLit) { w.lit = w.wantLit; w.el.sil.classList.toggle("hi", w.lit); } } else moving = true;
      }
      draw(w);
    }
    return moving;
  });
  bag.add(B.unregister);

  /** Lines 0..a are formatted. New ones snap in a ripple down from the old front; un-formatting is slow and goes bottom-up: the last to be fixed is the first to go. */
  function setFront(a        ) {
    if (a === fr) return;
    const now = __hairClock.now, prev = fr, rm = reducedMotion();
    fr = a;
    for (const w of rows) {
      const tgt = w.r <= a ? 0 : 1;
      if (tgt !== w.tgt) {
        w.tgt = tgt;
        const slow = tgt === 1;
        w.sp.k = slow ? 22 : 100; w.sp.c = slow ? 9.4 : 14;
        w.due = now + (rm ? 0 : slow ? (N - 1 - w.r) * STEP_OUT : (w.r - (prev + 1)) * STEP);
      }
      // the bright edge belongs to the line at the front, and to nothing at rest; it arrives with that line's snap
      const on = w.r === a ? 1 : 0;
      w.wantLit = !!on;
      w.litDue = now + (on && !rm ? Math.max(0, w.r - (prev + 1)) * STEP : 0);
    }
    read.textContent = a < 0 ? "rest" : `ln ${a + 1}`;
    B.wake();
  }

  // The pointer is read on the ground plane, which never moves: the line is the band of rows it is over.
  const rowAt = (p      ) => {
    const [x, y] = unproj(C, p[0], p[1], 0);
    return x < BX0 || x > BX1 || y < BY0 || y > BY1 ? -1 : clamp(Math.floor(y / G), -1, N - 1);
  };
  bag.add(pointer(stage, { move: (p) => setFront(rowAt(p)), leave: () => setFront(-1) }));
  bag.add(() => svg.replaceChildren());

  rows.forEach((w) => draw(w));
  return {
    set: (v) => { mess = v / MAXV; rows.forEach((w) => { w.drawn = NaN; }); B.wake(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/hub":function(__require,module){
const {Cam,clamp,facing,fit,hull,open,poly,proj,ringAt,rrect,seg}=__require("core/iso");
const {reducedMotion,spring,stepS,tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {inset,slab}=__require("slab");

/**
 * Hub: a thick plate in the middle of a faint floor grid, eight thin tiles
 * around it, a little off their cells, each joined to the hub by a dashed
 * link. The tile nearest the pointer rises on a spring and its link turns
 * solid, drawn out from the hub; the tiles beside it rise less, by how far
 * round the ring they sit. The risen tile is the bright mark; at rest it is
 * the hub's inset square. The slider is the rise, in world units.
 *
 * The pattern: one of many, on springs. A hit test on the tiles' resting
 * positions, a falloff by angle, a stagger by hops round the ring.
 */

const D = 52, HS = 10, T = 3, HUB = 18, HT = 8, FALL = [1, 0.5, 0.2, 0.06, 0], STEP = 70, HIT = 40;
// The rise arrives on a lightly underdamped spring; the return is slower and near-critical.
const UP = { k: 70, c: 14 }, DOWN = { k: 40, c: 12.4 }, DRAW = { k: 120, c: 21, eps: 0.002 }, RETRACT = { k: 36, c: 11.6, eps: 0.002 };
// Each tile's cell, and how far it sits off it.
const JIT = [[2, -2], [-2, 1.5], [1.5, 2.5], [-2.5, -1], [2, 1.5], [-1.5, 2], [2.5, -1.5], [-2, -2.5]];
const CELLS = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];

             
                                                                   
                                                                                                         
                                                                                 
  

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let lift = value;

  const C = Cam(45, 0.5, 1.76);
  const E = 3 * D / 2 - 4;
  const pts         = [[-E, -E, 0], [E, -E, 0], [E, E, 0], [-E, E, 0]];
  CELLS.forEach(([i, j], k) => pts.push([i * D + JIT[k][0] - HS, j * D + JIT[k][1] - HS, 24 * 1.15 + T], [i * D + JIT[k][0] + HS, j * D + JIT[k][1] + HS, 24 * 1.15 + T]));
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the floor: a faint grid on the tile pitch
  let d = "";
  for (let v = -E; v <= E + 1; v += D / 2) d += seg(P(v, -E, 0), P(v, E, 0)) + seg(P(-E, v, 0), P(E, v, 0));
  mk("path", { d, class: "nf lo" }, g);

  const tiles = CELLS.map(([i, j], k) => {
    const x = i * D + JIT[k][0], y = j * D + JIT[k][1];
    return { k, x, y, sp: spring(0, { ...UP }), lk: spring(0, { ...DRAW, eps: 0.002 }), hw: tween(0, 220), drawn: NaN, due: 0, tgt: 0, pend: false, on: false }        ;
  });
  // ring order, by angle: the neighbours of a tile are the ones beside it on the ring
  const ring = tiles.slice().sort((a, b) => Math.atan2(a.y, a.x) - Math.atan2(b.y, b.x));
  ring.forEach((t, n) => { t.n = n; });

  // links go down first: dashed to every tile, and a solid one over it that is drawn out from the hub
  // each link is a floor segment from the hub's rim to the tile's footprint edge
  tiles.forEach((t) => {
    const m = Math.max(Math.abs(t.x), Math.abs(t.y));
    t.a = HUB / m; t.b = 1 - HS / m;
    // the visible rim: where the floor segment comes out from behind the hub's silhouette
    const H = hull([[-HUB, -HUB], [HUB, -HUB], [HUB, HUB], [-HUB, HUB]].flatMap(([x, y]) => [P(x, y, 0), P(x, y, HT)]));
    const inside = (q      ) => { let s0 = 0; for (let i = 0; i < H.length; i++) { const a = H[i], b = H[(i + 1) % H.length], c = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]); if (c * s0 < 0) return false; if (c) s0 = c; } return true; };
    let u = t.a; while (u < t.b - 0.05 && inside(P(t.x * u, t.y * u, 0))) u += 0.005;
    t.a = Math.min(u + 0.01, t.b - 0.1);
    // short real dashes in the plain stroke, so the link reads at 240px
    const len = Math.hypot(t.x, t.y) * (t.b - t.a), n = Math.max(2, Math.round(len / 6));
    let dd = "";
    for (let i = 0; i < n; i++) {
      const u0 = t.a + ((t.b - t.a) * (i + 0.15)) / n, u1 = t.a + ((t.b - t.a) * (i + 0.65)) / n;
      dd += seg(P(t.x * u0, t.y * u0, 0), P(t.x * u1, t.y * u1, 0));
    }
    mk("path", { d: dd, class: "nf" }, g);
  });
  tiles.forEach((t) => { t.slot = mk("path", { class: "nf lo" }, g); t.line = mk("path", { class: "nf hi" }, g); });

  // plates, back to front by x + y; the hub sits among them
  let mark                 ;
  const order                  = [...tiles, null].sort((a, b) => (a ? a.x + a.y : 0) - (b ? b.x + b.y : 0));
  for (const t of order) {
    if (!t) {
      // the lip and the frame keep an even gap to the plate's edge as drawn; the mark stands free
      const r = rrect(-HUB, -HUB, HUB, HUB, 7, 8), ri = inset(C, r, 1.3), fr = inset(C, r, 2.8), mr = rrect(-7, -7, 7, 7, 2, 8);
      put(solid(g), slab(P, front, r, ri, 0, HT));
      mk("path", { d: open(ringAt(P, fr.concat(fr.slice(0, 1)), HT)), class: "nf lo" }, g);
      const md = open(ringAt(P, mr.concat(mr.slice(0, 1)), HT));
      mark = mk("path", { d: md, class: "nf hi" }, g);
      continue;
    }
    t.ring = rrect(t.x - HS, t.y - HS, t.x + HS, t.y + HS, 4, 8);
    t.inner = inset(C, t.ring, 1.1);
    t.el = solid(g);
  }

  const hubW = tween(1, 240);
  let hubOn = true;
  function draw(t      , now        ) {
    const z = Math.max(0, t.sp.x), l = clamp(t.lk.x, 0, 1), w = tval(t.hw, now);
    if (z !== t.drawn) {
      t.drawn = z; put(t.el, slab(P, front, t.ring, t.inner, z, z + T));
      t.slot.setAttribute("d", z > 0.4 ? poly(ringAt(P, t.ring, 0)) : "");
    }
    // the bright mark is the stroke's own colour transition, switched when its weight crosses half
    if ((w > 0.5) !== t.on) { t.on = w > 0.5; t.el.sil.classList.toggle("hi", t.on); }
    const e = t.a + (t.b - t.a) * l;
    t.line.setAttribute("d", l > 0.002 ? seg(P(t.x * t.a, t.y * t.a, 0), P(t.x * e, t.y * e, 0)) : "");
  }

  const B = register(stage, (dt, now) => {
    let moving = false;
    for (const t of tiles) {
      if (t.pend) { if (now >= t.due) { t.pend = false; Object.assign(t.sp, t.tgt > t.sp.t ? UP : DOWN); t.sp.t = t.tgt; } else moving = true; }
      if (stepS(t.sp, dt)) moving = true;
      if (stepS(t.lk, dt)) moving = true;
      if (!tdone(t.hw, now)) moving = true;
      draw(t, now);
    }
    const hw = tval(hubW, now) > 0.5;
    if (hw !== hubOn) { hubOn = hw; mark.setAttribute("class", hw ? "nf hi" : "nf lo"); }
    if (!tdone(hubW, now)) moving = true;
    return moving;
  });
  bag.add(B.unregister);

  // hit: the tile whose RESTING top is nearest the pointer on screen; the hub's own ground is rest
  const top = tiles.map((t) => P(t.x, t.y, T)), hubAt = P(0, 0, HT);
  let act = -1;
  function hit([sx, sy]      ) {
    if (Math.hypot(sx - hubAt[0], sy - hubAt[1]) < 30) return -1;
    let a = -1, best = HIT;
    top.forEach((q, k) => { const m = Math.hypot(sx - q[0], sy - q[1]); if (m < best) { best = m; a = k; } });
    // a little hysteresis: the tile already under the pointer is kept until another is clearly nearer
    if (a !== act && act >= 0) {
      const held = Math.hypot(sx - top[act][0], sy - top[act][1]);
      if (held < HIT && best > 0.8 * held) return act;
    }
    return a;
  }

  /** Hops round the ring from tile `from`. */
  const hops = (t      , from        ) => Math.min((t.n - from + 8) % 8, (from - t.n + 8) % 8);
  function setActive(a        ) {
    if (a === act) return;
    const now = __hairClock.now, from = a >= 0 ? tiles[a].n : tiles[act].n;
    act = a;
    tiles.forEach((t) => {
      const hop = hops(t, from), tgt = a < 0 ? 0 : lift * FALL[hop], rising = tgt > t.tgt;
      // up: the touched tile first, the others a beat behind by hops; down: the outer ones first, the one just left last
      const delay = reducedMotion() ? 0 : rising ? hop * STEP : a < 0 ? (4 - hop) * 25 : hop === 0 ? 60 : 0;
      t.tgt = tgt; t.due = now + delay; t.pend = true;
      const on = t.k === a;
      Object.assign(t.lk, on ? DRAW : RETRACT); t.lk.t = on ? 1 : 0;
      t.hw.dur = on ? 220 : 260; tset(t.hw, on ? 1 : 0, now, on ? 60 : 0);
    });
    hubW.dur = a < 0 ? 280 : 200; tset(hubW, a < 0 ? 1 : 0, now, a < 0 ? 180 : 0);
    read.textContent = a < 0 ? "rest" : "tile " + (a + 1);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => {
      lift = v;
      if (act >= 0) { const from = tiles[act].n; tiles.forEach((t) => { t.tgt = t.sp.t = lift * FALL[hops(t, from)]; t.pend = false; }); B.wake(); }
    },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/keyboard":function(__require,module){
const {Cam,clamp,facing,fit,hull,open,poly,prism,proj,ringAt,rings,rrect,run,seg,unproj}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Keyboard: a sixty-key board, rows staggered as a real one's are, with the
 * long keys a hand finds without looking: backspace, enter, the two shifts,
 * the space bar. Each cap is narrower at its top than at its foot, and each row
 * stands at its own height, the sculpted profile. The pointer is put on the
 * tops of the rows at rest, front row first; the key under it sinks all the
 * way and its neighbours follow it down, less the further away, each on its own
 * spring. At rest, enter is caught half-way down, bright. The slider is the
 * radius, in keys.
 *
 * The pattern: a continuous field, as Terrain's, over discrete parts: a spring
 * per key, a falloff by distance, a hit test on each row's rest top.
 */

const U = 14, PAD = 0.8, TAPER = 1.8, Z0 = 1, TRAVEL = 8, BZ = 6, CASE = 8, W = 15;
/** Each row's rest height, back to front: the sculpted profile, lowest on the home row. */
const ROW_H = [12.6, 11.3, 10.4, 11, 11.8];
/** Each row's keys, as [width in keys, read-out]. Fifteen keys wide; sixty keys in all. */
const L = (s        ) => s.split(" ").map((c)                   => [1, "key " + c]);
const ROWS                                 = [
  [[1, "esc"], ...L("1 2 3 4 5 6 7 8 9 0 - ="), [2, "bksp"]],
  [[1.5, "tab"], ...L("q w e r t y u i o p [ ]"), [1.5, "key \\"]],
  [[1.75, "caps"], ...L("a s d f g h j k l ; '"), [2.25, "enter"]],
  [[2.25, "shift l"], ...L("z x c v b n m , . /"), [2.75, "shift r"]],
  [[1.5, "ctrl l"], [1, "super"], [1.5, "alt l"], [7, "space"], [1.5, "alt r"], [1, "fn"], [1.5, "ctrl r"]],
];
const HOMING = ["key f", "key j"];

/** The share of full travel a neighbour sinks, u radii from the pointer: all of it at the pressed key's edge, nothing past one radius. */
const falloff = (u        ) => clamp(1 - u, 0, 1);

            
                                                                                     
                                                                                                        
  
                                   

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.42);
  fit(C, [[-BZ, -BZ, -CASE], [W * U + BZ, 5 * U + BZ, -CASE], [W * U + BZ, -BZ, -CASE], [-BZ, 5 * U + BZ, -CASE], [0, 0, ROW_H[0]]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value, over              = null, lit             = null;

  const g = mk("g", {}, svg);
  const [cr, ci] = rings(-BZ, -BZ, W * U + BZ, 5 * U + BZ, 9, 2.2);
  put(solid(g), prism(P, front, cr, ci, -CASE, 0));

  // Row by row from the back, and left to right in a row: each key is cut from
  // the ones behind it and to its left by a vertical plane, so this is back to front.
  const keys        = [];
  ROWS.forEach((row, r) => {
    let x = 0;
    for (const [w, name] of row) {
      const x0 = x * U, x1 = (x + w) * U, y0 = r * U, y1 = (r + 1) * U, t = PAD + TAPER;
      const el = solid(g);
      keys.push({
        r, name, x0, x1, y0, y1, h: ROW_H[r],
        foot: rrect(x0 + PAD, y0 + PAD, x1 - PAD, y1 - PAD, 2.6, 4),
        top: rrect(x0 + t, y0 + t, x1 - t, y1 - t, 2, 4),
        inner: rrect(x0 + t + 0.9, y0 + t + 0.9, x1 - t - 0.9, y1 - t - 0.9, 1.2, 4),
        el, sp: spring(ROW_H[r], { eps: 0.02 }), drawn: NaN,
        bump: HOMING.includes(name) ? mk("path", { class: "lo nf" }, el.g) : null,
      });
      x += w;
    }
  });
  const enter = keys.find((k) => k.name === "enter") ;

  /** Each key's target depth, from a point on the board, the key pressed, a radius in keys and a share of full travel. */
  function sink(at      , pressed     , radius        , depth        ) {
    for (const k of keys) {
      const dx = Math.max(k.x0 - at[0], 0, at[0] - k.x1), dy = Math.max(k.y0 - at[1], 0, at[1] - k.y1);
      const f = k === pressed ? 1 : falloff(Math.hypot(dx, dy) / (radius * U));
      k.sp.t = k.h - TRAVEL * depth * f;
    }
  }
  const restAt       = [(enter.x0 + enter.x1) / 2, (enter.y0 + enter.y1) / 2];
  sink(restAt, enter, 1.6, 0.6);
  for (const k of keys) k.sp.x = k.sp.t;

  function drawKey(k     ) {
    const h = k.sp.x;
    if (h === k.drawn) return;
    k.drawn = h;
    put(k.el, { sil: poly(hull(ringAt(P, k.foot, Z0).concat(ringAt(P, k.top, h)))), crease: open(ringAt(P, run(k.inner, front), h)) });
    if (k.bump) {
      const cx = (k.x0 + k.x1) / 2, cy = k.y1 - PAD - TAPER - 2.4;
      k.bump.setAttribute("d", seg(P(cx - 2.2, cy, h), P(cx + 2.2, cy, h)));
    }
  }
  function light(k     ) {
    if (k === lit) return;
    lit?.el.sil.classList.remove("hi");
    lit = k;
    k.el.sil.classList.add("hi");
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const k of keys) { if (stepS(k.sp, dt)) m = true; drawKey(k); }
    return m;
  });
  bag.add(B.unregister);

  const keyAt = (r        , x        ) => keys.find((k) => k.r === r && x >= k.x0 && x < k.x1) ;
  /** The key under a screen point, tested against each row's rest top, front row first, as a nearer row covers a farther one. */
  function hit(p      )              {
    for (let r = ROWS.length - 1; r >= 0; r--) {
      const q = unproj(C, p[0], p[1], ROW_H[r]);
      if (q[1] < r * U || q[1] >= (r + 1) * U || q[0] < 0 || q[0] >= W * U) continue;
      return { at: q, key: keyAt(r, q[0]) };
    }
    // in a gap between two rows' tops, or over the bezel: the nearest key on the board
    const q = unproj(C, p[0], p[1], ROW_H[2]);
    if (q[0] < -BZ || q[0] > W * U + BZ || q[1] < -BZ || q[1] > 5 * U + BZ) return null;
    const at       = [clamp(q[0], 0, W * U - 0.01), clamp(q[1], 0, 5 * U - 0.01)];
    return { at, key: keyAt(Math.floor(at[1] / U), at[0]) };
  }

  function retarget() {
    if (over) { sink(over.at, over.key, R, 1); light(over.key); read.textContent = over.key.name; }
    else { sink(restAt, enter, 1.6, 0.6); light(enter); read.textContent = "rest"; }
    B.wake();
  }
  light(enter);

  bag.add(pointer(stage, {
    move: (p) => { over = hit(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/laptop":function(__require,module){
const {Cam,clamp,facing,fit,hull,lerp,open,poly,prism,proj,rad,rings,rrect,run,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Laptop: a thin aluminium base with a keyboard well and a wide trackpad, and
 * a thin lid on a full-width hinge. On the lid's face a bezel holds the screen,
 * with a menu bar, a dock and one app window. The pointer's height sets how
 * far the lid stands open, from nearly shut to wide open, and the lid follows
 * it on a spring. At rest it stands open a little past upright, lit. The
 * slider is how far the lid is allowed to open, in degrees.
 *
 * The paint order is fixed and honest at every angle: the lid turns about an
 * axis through the middle of its thickness, so no part of it ever dips under
 * the base's top, and base then lid is back to front from nearly shut to
 * wide open. The screen's marks sit in front of the lid's plate while its face
 * looks at the viewer and behind it once the face turns away; they swap at the
 * angle where the face is edge-on and the marks are squeezed to a line.
 */

const W = 150, D = 106, HB = 4, T = 2.4, HZ = HB + T / 2, R = 7, B = 1.1;
const MIN = 15, REST = 100, BZ = 4.2, CHIN = 7.5, KU = 8.6, KY = 6;

/** The lid at th degrees from shut: lid space (u across, v from the hinge, w through it) to world. */
const lidAt = (th        ) => {
  const c = Math.cos(rad(th)), s = Math.sin(rad(th));
  return (u        , v        , w        )       => [u, v * c - w * s, HZ + v * s + w * c];
};

/** The keys, as [x0, y0, x1, y1] on the base: a half-height function row, four rows, and a row with an inverted-T of arrows. */
function keys() {
  const out                                          = [], x0 = (W - 14.5 * KU) / 2;
  const row = (y        , h        , widths          ) => { let x = x0; for (const w of widths) { out.push([x, y, x + w * KU, y + h]); x += w * KU; } };
  const ones = (n        ) => Array        (n).fill(1);
  row(KY, KU * 0.6, Array        (14).fill(14.5 / 14));
  let y = KY + KU * 0.6;
  for (const w of [[...ones(13), 1.5], [1.5, ...ones(13)], [1.75, ...ones(11), 1.75], [2.25, ...ones(10), 2.25]]) { row(y, KU, w); y += KU; }
  row(y, KU, [1, 1, 1, 1.25, 5, 1.25, 1]);
  const ax = x0 + 11.5 * KU, h = KU / 2;
  out.push([ax, y + h, ax + KU, y + KU], [ax + KU, y, ax + 2 * KU, y + h], [ax + KU, y + h, ax + 2 * KU, y + KU], [ax + 2 * KU, y + h, ax + 3 * KU, y + KU]);
  return { out, y1: y + KU, x0 };
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let maxA = value, over                = null;

  // Fitted to the base and to the lid at shut, upright, rest and the default widest; the slider's far end is checked to stay inside.
  const C = Cam(45, 0.5, 1.3), pts         = [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0]];
  for (const th of [MIN, 90, REST, 125]) for (const u of [0, W]) for (const v of [0, D]) for (const w of [-T / 2, T / 2]) pts.push(lidAt(th)(u, v, w));
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);

  // The direction toward the viewer, read off the projection: the world direction P cannot see.
  const o = P(0, 0, 0), ex = P(1, 0, 0), ey = P(0, 1, 0), ez = P(0, 0, 1);
  const r1 = [ex[0] - o[0], ey[0] - o[0], ez[0] - o[0]], r2 = [ex[1] - o[1], ey[1] - o[1], ez[1] - o[1]];
  let eye = [r1[1] * r2[2] - r1[2] * r2[1], r1[2] * r2[0] - r1[0] * r2[2], r1[0] * r2[1] - r1[1] * r2[0]];
  if (eye[2] < 0) eye = eye.map((n) => -n);
  const dot = (a          , b          ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const g = mk("g", {}, svg);

  // The base: a thin slab, then what lies on its top. It never moves.
  const [br, bi] = rings(0, 0, W, D, R, B);
  put(solid(g), prism(P, front, br, bi, 0, HB));
  const top = (q      ) => poly(q.map((s) => P(s.u, s.v, HB)));
  const kb = keys();
  mk("path", { class: "nf lo", d: kb.out.map(([a, b, c, d]) => top(rrect(a + 0.5, b + 0.5, c - 0.5, d - 0.5, 1.1, 2))).join("") }, g);
  mk("path", { class: "nf", d: top(rrect(kb.x0 - 1.6, KY - 1.6, W - kb.x0 + 1.6, kb.y1 + 1.6, 3, 4)) }, g);
  mk("path", { class: "nf", d: top(rrect(W / 2 - 35, D - 45, W / 2 + 35, D - 5, 3.2, 4)) }, g);

  // The lid: a plate and its thickness line, and the screen's marks, which change sides of the plate with the face.
  const lidG = mk("g", {}, g), lid = solid(lidG), scr = mk("g", {}, lidG);
  lid.sil.classList.add("hi");
  const [lr, li] = rings(0, 0, W, D, R, B);
  const disp = mk("path", { class: "nf" }, scr), bar = mk("path", { class: "nf lo" }, scr), dock = mk("path", { class: "nf lo" }, scr);
  const win = mk("path", {}, scr), strip = mk("path", { class: "nf lo" }, scr);
  const cam = mk("circle", { r: 0.8, class: "dot off" }, scr);
  const lights = [0, 1, 2].map(() => mk("circle", { r: 0.8, class: "dot off" }, scr));
  const VT = D - BZ, WX0 = 30, WX1 = 104, WV0 = CHIN + 16, WV1 = VT - 12;
  let faced                 = null, drawn = NaN;

  function drawLid(th        ) {
    if (th === drawn) return;
    drawn = th;
    const f = lidAt(th), c = Math.cos(rad(th)), s = Math.sin(rad(th));
    const at = (u        , v        , w        ) => P(...f(u, v, w)), on = (u        , v        ) => at(u, v, -T / 2);
    const plane = (q                   , w        ) => q.map((p) => at(p.u, p.v, w));
    const shows = dot([0, s, -c], eye) > 0, wf = shows ? -T / 2 : T / 2;
    const wall = (q        ) => dot([q.nu, q.nv * c, q.nv * s], eye) > 0;
    put(lid, { sil: poly(hull(plane(lr, -T / 2).concat(plane(lr, T / 2)))), crease: open(plane(run(li, wall), wf)) });
    if (shows !== faced) { faced = shows; if (shows) lid.g.after(scr); else lid.g.before(scr); }
    const face = (q      ) => poly(q.map((p) => on(p.u, p.v)));
    disp.setAttribute("d", face(rrect(BZ, CHIN, W - BZ, VT, 3, 4)));
    bar.setAttribute("d", seg(on(BZ + 1.5, VT - 4), on(W - BZ - 1.5, VT - 4)));
    dock.setAttribute("d", face(rrect(W / 2 - 28, CHIN + 2.5, W / 2 + 28, CHIN + 8.5, 2.2, 4)));
    win.setAttribute("d", face(rrect(WX0, WV0, WX1, WV1, 2.6, 4)));
    strip.setAttribute("d", seg(on(WX0, WV1 - 6), on(WX1, WV1 - 6)) + seg(on(WX0 + 20, WV0), on(WX0 + 20, WV1 - 6)));
    place(cam, on(W / 2, D - BZ / 2));
    lights.forEach((el, k) => place(el, on(WX0 + 4 + k * 3.4, WV1 - 3)));
  }

  const sp = spring(REST, { eps: 0.05 });
  const Bk = register(stage, (dt) => { const m = stepS(sp, dt); drawLid(sp.x); return m; });
  bag.add(Bk.unregister);
  drawLid(REST);

  // The pointer's height, over a band from the upright lid's top to the base's front, sets the angle; the stage never moves, so nothing can flicker.
  const yTop = P(W / 2, 0, HZ + D)[1] + 12, yBot = P(W / 2, D, 0)[1] - 12;
  function retarget() {
    if (over === null) { sp.t = Math.min(REST, maxA); read.textContent = "rest"; }
    else {
      sp.t = lerp(maxA, MIN, clamp((over - yTop) / (yBot - yTop), 0, 1));
      read.textContent = sp.t <= MIN + 0.5 ? "shut" : sp.t >= maxA - 0.5 ? "open" : `lid ${Math.round(sp.t)}°`;
    }
    Bk.wake();
  }

  bag.add(pointer(stage, {
    move: (p      ) => { over = p[1]; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { maxA = v; retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/lockers":function(__require,module){
const {Cam,clamp,facing,fit,hull,poly,prism,proj,rad,rings,rrect,seg}=__require("core/iso");
const {tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Lockers: a bank of twelve, six across and two high, standing on a plinth.
 * Each door is a thin steel plate with louvred vents, a blank number plate and
 * a latch cup on its free edge, hung on a hinge down its left side. The pointer
 * is put on the closed door faces; the locker under it swings its door open on
 * the 700ms curve, and the one open before it swings shut on the same clock.
 * An opening shows the locker's inside: its floor and shelf running back along
 * the inner wall. At rest, one door stands ajar, bright. The slider is how far
 * a door opens, in degrees.
 *
 * The pattern: one of many. A tween per door, a hit test on the plane of the
 * closed doors, and each door drawn every frame as a plate turned on its hinge.
 */

const COLS = 6, ROWS = 2, W = 24, HR = 38, GAP = 1.2, FM = 3, ZP = 6, D = 26, T = 1.4, DEP = 23;
const BW = COLS * W + 2 * FM, BH = ROWS * HR + 2 * FM, DW = W - 2 * GAP, DH = HR - 2 * GAP;
const REST_I = 5, REST_A = 22, FAR = 120;

/** The door's local outline and marks, in (u, v): u from the hinge, v up from its foot. */
const OUTLINE = rrect(0, 0, DW, DH, 1.8, 4);
const VENTS = [0, 1, 2].map((k) => rrect(4, DH - 6.6 - k * 3.2, DW - 4, DH - 5.2 - k * 3.2, 0.7, 2));
const PLATE = rrect(DW / 2 - 4.5, DH - 19, DW / 2 + 4.5, DH - 15, 1, 3);
const CUP = rrect(DW - 5.6, DH / 2 - 7, DW - 2.8, DH / 2 + 2, 1.2, 3);
const FRAME = rrect(2.6, 2.6, DW - 2.6, DH - 2.6, 1.4, 3);

/** Twice the signed area of a screen polygon: its sign says which way round it is seen. */
const area = (pts                 ) => pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0);

               
                                                                                                   
                                                                                          
  

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.6);
  // fitted with the corner doors swung to the slider's far end, so no pose leaves the frame
  const sw = [Math.cos(rad(FAR)) * DW, Math.sin(rad(FAR)) * DW];
  fit(C, [[-4, -4, 0], [BW + 4, D + 4, 0], [BW + 4, -4, 0], [-4, D + 4, 0], [0, 0, ZP + BH], [BW, 0, ZP + BH],
    [FM + sw[0], D + sw[1], ZP + FM], [FM + sw[0], D + sw[1], ZP + BH - FM]], 200, 166);
  const P = proj(C), front = facing(C);
  let MAX = value, act = -1;

  /** The world point (x, z) on the vertical plane y = y0 that lies under a screen point. */
  function onFace(p      , y0        )       {
    const o = P(0, y0, 0), a = P(1, y0, 0), b = P(0, y0, 1);
    const ex = [a[0] - o[0], a[1] - o[1]], ez = [b[0] - o[0], b[1] - o[1]], det = ex[0] * ez[1] - ex[1] * ez[0];
    const qx = p[0] - o[0], qy = p[1] - o[1];
    return [(qx * ez[1] - qy * ez[0]) / det, (ex[0] * qy - ex[1] * qx) / det];
  }
  /** A world segment, cut to what shows through a locker's opening: clipped on the face plane, as a screen path. */
  function through(A      , B      , L        ) {
    const pa = P(...A), pb = P(...B), a = onFace(pa, D), b = onFace(pb, D), m = 0.9;
    let t0 = 0, t1 = 1;
    const lim = [[a[0] - b[0], a[0] - (L.x0 + m)], [b[0] - a[0], L.x0 + DW - m - a[0]], [a[1] - b[1], a[1] - (L.z0 + m)], [b[1] - a[1], L.z0 + DH - m - a[1]]];
    for (const [p, q] of lim) {
      if (p === 0) { if (q < 0) return ""; continue; }
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
    }
    if (t1 - t0 < 0.01) return "";
    const at = (t        )       => [pa[0] + (pb[0] - pa[0]) * t, pa[1] + (pb[1] - pa[1]) * t];
    return seg(at(t0), at(t1));
  }

  const g = mk("g", {}, svg);
  const [pr, pi] = rings(-4, -4, BW + 4, D + 4, 5, 1.6);
  put(solid(g), prism(P, front, pr, pi, 0, ZP));
  const [br, bi] = rings(0, 0, BW, D, 3, 1.4);
  put(solid(g), prism(P, front, br, bi, ZP, ZP + BH));

  // Column by column from the left, bottom row before top: a door swings left and
  // out, over the column before it and the row below it, so this is back to front.
  const lockers           = [];
  for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) {
    const x0 = FM + c * W + GAP, z0 = ZP + FM + r * HR + GAP;
    const lg = mk("g", {}, g);
    mk("path", { d: poly(OUTLINE.map((q) => P(x0 + q.u, D, z0 + q.v))), class: "" }, lg);
    const L = { c, r, n: (ROWS - 1 - r) * COLS + c + 1, x0, z0, drawn: NaN, sign0: 0, tw: tween(0) }          ;
    const zs = L.z0 + DH - 9.5, x1 = L.x0 + DW;
    const inside = [
      through([L.x0, D, L.z0], [L.x0, D - DEP, L.z0], L),
      through([L.x0, D - 1.6, zs], [x1, D - 1.6, zs], L),
      through([L.x0, D - 1.6, zs], [L.x0, D - DEP, zs], L),
    ].join("");
    mk("path", { d: inside, class: "nf lo" }, lg);
    L.plate = mk("path", { class: "lo" }, lg);
    L.face = mk("path", { class: "sil" }, lg);
    L.marks = mk("path", { class: "nf lo" }, lg);
    L.cup = mk("path", { class: "nf" }, lg);
    lockers.push(L);
  }
  const byN = (n        ) => lockers.find((L) => L.n === n) ;

  /** Door L turned th degrees on its hinge: a point on it at (u, v), s off its middle plane toward the front. */
  function drawDoor(L        , th        ) {
    if (th === L.drawn) return;
    L.drawn = th;
    const cs = Math.cos(rad(th)), sn = Math.sin(rad(th));
    const at = (s        ) => (q                          ) => P(L.x0 + q.u * cs - s * sn, D + T / 2 + q.u * sn + s * cs, L.z0 + q.v);
    const fr = OUTLINE.map(at(T / 2)), bk = OUTLINE.map(at(-T / 2));
    const outward = area(fr) * L.sign0 > 0, s = outward ? T / 2 : -T / 2;
    L.plate.setAttribute("d", poly(hull(fr.concat(bk))));
    L.face.setAttribute("d", poly(outward ? fr : bk));
    const marks         = outward ? [...VENTS, PLATE] : [...VENTS, FRAME];
    L.marks.setAttribute("d", marks.map((m) => poly(m.map(at(s)))).join(""));
    L.cup.setAttribute("d", outward ? poly(CUP.map(at(s))) : "");
  }
  for (const L of lockers) L.sign0 = Math.sign(area(OUTLINE.map((q) => P(L.x0 + q.u, D + T, L.z0 + q.v))));

  const B = register(stage, (_dt, now) => {
    let m = false;
    for (const L of lockers) { drawDoor(L, tval(L.tw, now)); if (!tdone(L.tw, now)) m = true; }
    return m;
  });
  bag.add(B.unregister);

  /** The locker under a screen point, read on the plane of the closed door faces, which never moves. */
  function hit(p      ) {
    const [x, z] = onFace(p, D + T);
    if (x < 0 || x > BW || z < ZP || z > ZP + BH) return -1;
    const c = clamp(Math.floor((x - FM) / W), 0, COLS - 1), r = clamp(Math.floor((z - ZP - FM) / HR), 0, ROWS - 1);
    return (ROWS - 1 - r) * COLS + c + 1;
  }

  /** Opens locker n and shuts the one open before it; 0 puts the bank back to rest. */
  function choose(n        , force          ) {
    if (n === act && !force) return;
    act = n;
    const now = __hairClock.now, lit = n > 0 ? n : REST_I;
    for (const L of lockers) {
      tset(L.tw, L.n === n ? MAX : n <= 0 && L.n === REST_I ? REST_A : 0, now, 0);
      L.face.classList.toggle("hi", L.n === lit);
      L.cup.classList.toggle("hi", L.n === lit);
    }
    read.textContent = n > 0 ? "locker " + String(n).padStart(2, "0") : "rest";
    B.wake();
  }
  byN(REST_I).tw = tween(REST_A);
  choose(0, true);

  bag.add(pointer(stage, { move: (p) => choose(Math.max(0, hit(p))), leave: () => choose(0) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { MAX = v; if (act > 0) choose(act, true); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/loupe":function(__require,module){
const {Cam,circ,clamp,facing,fit,hull,open,poly,prism,proj,rings,rrect,seg,unproj}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Loupe: a stand loupe on three legs over a ruled sheet with nothing written
 * on it. The pointer drags the loupe across the sheet on a spring. Under the
 * glass the rules are drawn again, larger, and there is nothing between them.
 * At rest the glass straddles the margin where the rules start, so their ends
 * land inside it well away from where the runs outside it would put them;
 * its thin rim is the bright mark. The slider is the magnification.
 *
 * The pattern: follow a position. Two springs hold the point of the sheet the
 * eye sees through the glass's centre, set from the pointer on the sheet's
 * plane, which never moves; the loupe stands where its glass covers that
 * point. The glass shows the sheet there enlarged, cut to the lens by
 * arithmetic, not by a clip. Past the sheet's near edges the feet stand on
 * the table, so the glass reaches every rule.
 */

const SW = 124, SD = 92, ST = 2.4;                  // the sheet: width, depth, thickness
const ROWS = 7, Y0 = 13, DY = 11, ML = 26, MR = 12; // its rules: how many, the first one's y, their pitch, the left margin they start at, the right one
const R = 27, LZ = 20, RIM = 1.2, GLASS = R - 1.4;  // the loupe: ring radius, height of its underside, ring depth, glass radius
const LEGS = [45, 165, 285], FOOT = 35, PAD = 1.8, REST       = [ML + 9, 46], S = 2.1;

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, S), top = LZ + RIM;
  const feet = LEGS.map((a)       => [Math.cos((a * Math.PI) / 180), Math.sin((a * Math.PI) / 180)]);
  /** From the point the eye sees to the loupe's centre: the glass stands this far in front of it. */
  const [bx, by] = unproj(C, ...proj(C)(0, 0, 0), top);
  // The frame holds the rest pose; the reach still fits inside it (see the far and near corners).
  const ext         = [[0, 0, -ST], [SW, 0, -ST], [0, SD, -ST], [SW, SD, -ST]];
  for (const q of circ(R, 16)) ext.push([REST[0] + bx + q.u, REST[1] + by + q.v, top]);
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // The sheet, then its rules lying on it.
  const [so, si] = rings(0, 0, SW, SD, 6, 1.4);
  put(solid(g), prism(P, front, so, si, -ST, 0));
  const rowY = (i        ) => Y0 + i * DY;
  /** The lines on the sheet: the margin, then the rules that start at it. */
  const lines                      = [[[ML, Y0 - 7], [ML, rowY(ROWS - 1) + 7]], ...Array.from({ length: ROWS }, (_, i)               => [[ML, rowY(i)], [SW - MR, rowY(i)]])];
  mk("path", { class: "nf lo", d: lines.map(([p, q]) => seg(P(p[0], p[1], 0), P(q[0], q[1], 0))).join("") }, g);

  // The loupe: three legs, a thin ring round the glass, a glint on it, the sheet seen through it.
  const legs = mk("path", { class: "nf" }, g);
  const rim = solid(g);
  const glint = mk("path", { class: "nf lo" }, g);
  const seen = mk("path", { class: "nf sil" }, g);
  const shine = circ(GLASS * 0.72, 64).slice(26, 36);
  const ring = circ(R, 64), lens = circ(GLASS, 64), edge = rrect(0, 0, SW, SD, 6, 12), pad = circ(PAD, 12);
  /** A foot on the sheet stands on its top; one past its edge, on the table under it. */
  const floor = (x        , y        ) => (x >= 0 && x <= SW && y >= 0 && y <= SD ? 0 : -ST);

  const sx = spring(REST[0]), sy = spring(REST[1]), mag = spring(value);
  let cx = NaN, cy = NaN, dm = NaN;
  function draw() {
    if (sx.x === cx && sy.x === cy && mag.x === dm) return;
    const moved = sx.x !== cx || sy.x !== cy;
    cx = sx.x; cy = sy.x; dm = mag.x;
    const dx = cx + bx, dy = cy + by;
    if (moved) {
      const at = (q                          , z        ) => P(dx + q.u, dy + q.v, z);
      legs.setAttribute("d", feet.map(([c, s]) => {
        const fx = dx + c * FOOT, fy = dy + s * FOOT;
        const z = floor(fx, fy);
        return seg(P(fx, fy, z), P(dx + c * (R - 1), dy + s * (R - 1), LZ)) + poly(pad.map((q) => P(fx + q.u, fy + q.v, z)));
      }).join(""));
      put(rim, { sil: poly(hull(ring.map((q) => at(q, LZ)).concat(ring.map((q) => at(q, top))))), crease: poly(lens.map((q) => at(q, top))) });
      glint.setAttribute("d", open(shine.map((q) => at(q, top))));
    }
    // A line on the sheet, enlarged about the point the eye sees through the
    // glass's centre, and kept where it falls inside the glass.
    const r = GLASS - 1;
    const cut = (p      , q      ) => {
      const a0 = (p[0] - cx) * dm, a1 = (p[1] - cy) * dm, e0 = (q[0] - p[0]) * dm, e1 = (q[1] - p[1]) * dm;
      const A = e0 * e0 + e1 * e1, B = a0 * e0 + a1 * e1, D = B * B - A * (a0 * a0 + a1 * a1 - r * r);
      if (D <= 0) return "";
      const t0 = Math.max(0, (-B - Math.sqrt(D)) / A), t1 = Math.min(1, (-B + Math.sqrt(D)) / A);
      return t1 > t0 ? seg(P(dx + a0 + e0 * t0, dy + a1 + e1 * t0, top), P(dx + a0 + e0 * t1, dy + a1 + e1 * t1, top)) : "";
    };
    let d = edge.map((q, i) => cut([q.u, q.v], [edge[(i + 1) % edge.length].u, edge[(i + 1) % edge.length].v])).join("");
    for (const [p, q] of lines) d += cut(p, q);
    seen.setAttribute("d", d);
  }

  const loop = register(stage, (dt) => { const a = stepS(sx, dt), b = stepS(sy, dt), c = stepS(mag, dt); draw(); return a || b || c; });
  bag.add(loop.unregister);
  rim.sil.classList.add("hi");
  read.textContent = "rest";
  draw();

  bag.add(pointer(stage, {
    move: (p) => {
      // the pointer on the sheet's plane, which never moves: the glass comes to cover the point under it
      const [x, y] = unproj(C, p[0], p[1], 0);
      sx.t = clamp(x, ML, SW - MR); sy.t = clamp(y, Y0, rowY(ROWS - 1));
      read.textContent = `row ${Math.round((sy.t - Y0) / DY) + 1} · 0`;
      loop.wake();
    },
    leave: () => { sx.t = REST[0]; sy.t = REST[1]; read.textContent = "rest"; loop.wake(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { mag.t = v; loop.wake(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/padlock":function(__require,module){
const {Cam,circ,clamp,fillet,fit,hull,open,poly,proj,rad,run}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Padlock: a solid body with a keyway in its face, and a U-shaped shackle, a
 * round bar drawn as one tube. As the pointer comes near the lock, the
 * shackle rises out of the body on a spring; once its short leg has cleared
 * its hole, it swings about its long leg, which never leaves the body. Going
 * away drops it back and locks it. At rest it is caught just unlatched: up,
 * a little turned, bright. The slider is how far it swings, in degrees.
 *
 * The pattern: a continuous field with one part, as Terrain's falloff: one
 * spring on how open the lock is, set by the pointer's distance to the body,
 * which never moves. Lift and turn are both read from that one number, the
 * turn only once the lift is done, so the short leg can never cut the body.
 */

const W = 56, D = 20, H = 44, B = 1.6;                        // body: width, depth, height, crease inset
const T = 4.2, S2 = 30, XL = 13, YC = D / 2, ARM = 13, SINK = 7, LIFT = 11; // shackle: bar radius, leg spacing, long leg's x, legs' y, straight above the body, short leg's depth when shut, lift
const O1 = 0.42, REST_TURN = 26, R0 = 56, R1 = 200, SC = 2.75, TMAX = 100;
const VX = Math.SQRT1_2 * Math.sqrt(3);                      // the view's x (and y) for a z of 1, at Cam(45, .5)
const ss = (t        ) => t * t * (3 - 2 * t);

/** A closed outline in the face's own (x, z), as ring samples with outward normals. */
function samples(pts                 )       {
  return pts.map((p, i) => {
    const a = pts[(i + pts.length - 1) % pts.length], b = pts[(i + 1) % pts.length];
    const tx = b[0] - a[0], tz = b[1] - a[1], l = Math.hypot(tx, tz) || 1;
    return { u: p[0], v: p[1], nu: tz / l, nv: -tx / l };
  });
}

/** Where two screen segments cross, or null. */
function cross(p      , q      , r      , s      )              {
  const e0 = q[0] - p[0], e1 = q[1] - p[1], f0 = s[0] - r[0], f1 = s[1] - r[1], g0 = r[0] - p[0], g1 = r[1] - p[1];
  const d = e0 * f1 - e1 * f0;
  if (!d) return null;
  const t = (g0 * f1 - g1 * f0) / d, u = (g0 * e1 - g1 * e0) / d;
  return t > 0 && t < 1 && u > 0 && u < 1 ? [p[0] + t * e0, p[1] + t * e1] : null;
}
/** Cuts the loops an inner offset makes where the bar bends tighter than its radius on screen. */
function untangle(L        )         {
  for (let i = 0; i < L.length - 3; i++) for (let j = L.length - 2; j > i + 1; j--) {
    const x = cross(L[i], L[i + 1], L[j], L[j + 1]);
    if (x) { L.splice(i + 1, j - i, x); break; }
  }
  return L;
}

/** The bar's outline: its screen centre line offset by its radius, each end a flat round cut seen from above. */
function tube(Q                 , rho        )         {
  const n = Q.length, A         = [], Bk         = [];
  for (let i = 0; i < n; i++) {
    const a = Q[Math.max(i - 1, 0)], c = Q[i], b = Q[Math.min(i + 1, n - 1)];
    const u0 = [c[0] - a[0], c[1] - a[1]], u1 = [b[0] - c[0], b[1] - c[1]];
    const l0 = Math.hypot(u0[0], u0[1]) || 1, l1 = Math.hypot(u1[0], u1[1]) || 1;
    let tx = u0[0] / l0 + u1[0] / l1, ty = u0[1] / l0 + u1[1] / l1;
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    A.push([c[0] - ty * rho, c[1] + tx * rho]); Bk.push([c[0] + ty * rho, c[1] - tx * rho]);
  }
  const cap = (c      ) => { const o         = []; for (let k = 7; k >= 1; k--) { const t = (Math.PI * k) / 8; o.push([c[0] + rho * Math.cos(t), c[1] + rho * 0.5 * Math.sin(t)]); } return o; };
  return poly([...untangle(A), ...cap(Q[n - 1]), ...untangle(Bk).reverse(), ...cap(Q[0])]);
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const tm = spring(value);
  let over = false;

  // The shackle's centre line, from the short leg's end, over the bow, down the long leg into its hole.
  const line =    (P                                        , lift        , th        )      => {
    const u = [Math.cos(rad(th)), -Math.sin(rad(th))], za = H + ARM + lift, r = S2 / 2;
    const at = (s        , z        ) => P(XL + u[0] * s, YC + u[1] * s, z);
    const pts = [at(S2, Math.max(H - SINK + lift, H)), at(S2, za)];
    for (let i = 1; i < 28; i++) { const f = (Math.PI * i) / 28; pts.push(at(r + r * Math.cos(f), za + r * Math.sin(f))); }
    pts.push(at(0, za), at(0, H));
    return pts;
  };

  // The camera is fitted to the body and the shackle at its highest and furthest swing.
  const C = Cam(45, 0.5, SC);
  const id = (x        , y        , z        )       => [x, y, z];
  const ext         = [[0, 0, 0], [W, 0, 0], [0, D, 0], [W, D, 0], [0, 0, H]];
  for (const th of [0, 40, 80, TMAX]) for (const p of line(id, LIFT, th)) ext.push([p[0], p[1], p[2] + T]);
  fit(C, ext, 200, 170);
  const P = proj(C), rho = T * SC;

  // The body: its face a rounded block, fuller at the foot, stood out along y.
  const face = fillet([[0, 0], [W, 0], [W, H], [0, H]], [14, 14, 7, 7], 12);
  const inner = samples(fillet([[B, B], [W - B, B], [W - B, H - B], [B, H - B]], [14 - B, 14 - B, 7 - B, 7 - B], 12));
  const g = mk("g", {}, svg);
  put(solid(g), {
    sil: poly(hull(face.map((p) => P(p[0], 0, p[1])).concat(face.map((p) => P(p[0], D, p[1]))))),
    crease: open(run(inner, (q) => q.nu * VX + q.nv > 0).map((q) => P(q.u, D, q.v))),
  });

  // The keyway: a round hole and the slot under it, one closed cut in the face.
  const kx = W / 2, kz = H * 0.56, kr = 4.4, kw = 1.8, kb = kz - 12, a0 = Math.asin(kw / kr), key         = [];
  for (let i = 0; i <= 20; i++) { const t = -Math.PI / 2 + a0 + ((2 * Math.PI - 2 * a0) * i) / 20; key.push([kx + kr * Math.cos(t), kz + kr * Math.sin(t)]); }
  for (let i = 0; i <= 6; i++) { const t = Math.PI + (Math.PI * i) / 6; key.push([kx + kw * Math.cos(t), kb + kw * Math.sin(t)]); }
  mk("path", { d: poly(key.map((p) => P(p[0], D, p[1]))), class: "nf" }, g);

  // The two holes in the top the legs stand in.
  const hole = circ(T + 1.3, 20);
  for (const x of [XL, XL + S2]) mk("path", { d: poly(hole.map((q) => P(x + q.u, YC + q.v, H))), class: "nf lo" }, g);

  const bar = mk("path", { class: "sil" }, g);

  /** Lift and turn from how open the lock is: the lift first, then, with the short leg clear, the turn. */
  const pose = (o        , max        )                   => [LIFT * ss(clamp(o / O1, 0, 1)), max * ss(clamp((o - O1) / (1 - O1), 0, 1))];
  /** How open the rest pose is: just unlatched, turned REST_TURN degrees, whatever the slider. */
  const restO = () => O1 + (1 - O1) * (0.5 - Math.sin(Math.asin(1 - (2 * REST_TURN) / tm.t) / 3));

  const sp = spring(restO(), { eps: 0.002 });
  let dO = NaN, dT = NaN;
  function draw() {
    if (sp.x === dO && tm.x === dT) return;
    dO = sp.x; dT = tm.x;
    const [lift, th] = pose(sp.x, tm.x);
    bar.setAttribute("d", tube(line(P, lift, th), rho));
  }

  const loop = register(stage, (dt) => { const a = stepS(sp, dt), b = stepS(tm, dt); draw(); return a || b; });
  bag.add(loop.unregister);

  const c0 = P(W / 2, D / 2, H / 2);
  function retarget() {
    const [lift, th] = pose(sp.t, tm.t), shut = over && lift < SINK;   // read from the targets, never the pose on screen
    read.textContent = !over ? "rest" : shut ? "locked" : th < 1 ? "open" : Math.round(th) + "°";
    bar.classList.toggle("hi", !shut);
    loop.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = true; sp.t = clamp((R1 - Math.hypot(p[0] - c0[0], p[1] - c0[1])) / (R1 - R0), 0, 1); retarget(); },
    leave: () => { over = false; sp.t = restO(); retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { tm.t = v; if (!over) sp.t = restO(); retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/patch":function(__require,module){
const {Cam,clamp,facing,fillet,fit,hull,open,poly,prism,proj,rings,rrect,run,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Patch: a 2U rack patch panel, its face plate running out past a shallow body
 * into two rack ears, each with two screw slots. Twenty-four RJ45 jacks sit in
 * two modules of six by two, each jack a rectangle with the latch's notch on
 * top. Twenty-one hold a plug, a tapered boot and a short cable: the top row's
 * cables rise, the bottom row's hang. The pointer is put on the plane of the
 * plugs at rest; the cable under it lifts, its plug half out of the jack, and
 * its neighbours lean away from it, less the further away, each on its own
 * springs. At rest, port 08 is caught half out, bright. The slider is the
 * falloff radius, in ports.
 *
 * The pattern: a continuous field over discrete parts, as Keyboard's: a spring
 * per number, a falloff by distance, a hit test on a fixed plane at rest.
 */

const NC = 12, PITCH = 15, GAP = 8, EAR = 15, MAR = 5, H = 44, T = 2.6, DEEP = 18;
const X0 = EAR + MAR, W = 2 * X0 + NC * PITCH + GAP, ZT = 30, ZB = 12.5;
const JW = 5, JH = 4.2, NW = 1.9, NH = 1.7, JD = 2.4;
const PW = 4.3, PH = 3.5, PL = 4, BL = 5, CR = 1.8, OUT = 6, LEAN = 10, LZ = 7, LIFT = 9;
const EMPTY = [2, 10, 18], REST = 7, HIT_Y = 2.5;
/** Small irregularities, so no two cables at rest hang alike: [x, z] at the tip. */
const JIT = (p        )       => [((p * 7) % 5) - 2, ((p * 11) % 7) - 3];

/** The share of the full lean a cable takes, d ports from the one lifted: all of it next door, none past R more. */
const falloff = (d        , R        ) => (d === 0 ? 0 : clamp(1 - (d - 1) / R, 0, 1));

             
                                                                         
                                                                            
                                                                         
  

/** A closed tube round a run of screen points, w wide each side, with a round cap at each end. */
function tube(q                 , w        )         {
  const n = q.length, L         = [], Rt         = [], nrm         = [];
  for (let i = 0; i < n; i++) {
    const a = q[Math.max(0, i - 1)], b = q[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t       = [(b[0] - a[0]) / l, (b[1] - a[1]) / l];
    nrm.push(t);
    L.push([q[i][0] - t[1] * w, q[i][1] + t[0] * w]); Rt.push([q[i][0] + t[1] * w, q[i][1] - t[0] * w]);
  }
  const cap = (c      , t      , s        )         => {
    const out         = [];
    for (let k = 1; k < 6; k++) {
      const th = (k / 6) * Math.PI, cs = Math.cos(th), sn = Math.sin(th);
      out.push([c[0] + s * w * (-t[1] * cs + t[0] * sn), c[1] + s * w * (t[0] * cs + t[1] * sn)]);
    }
    return out;
  };
  return poly([...L, ...cap(q[n - 1], nrm[n - 1], 1), ...Rt.reverse(), ...cap(q[0], nrm[0], -1)]);
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const S = 1.5, C = Cam(45, 0.5, S);
  const tipZ = ZT + 27 + LIFT + LZ, lowZ = ZB - 26 - LZ;
  fit(C, [[0, -DEEP, H], [W, -DEEP, H], [0, 0, 0], [W, 0, 0], [X0, 34, tipZ], [W - X0, 34, lowZ], [X0, 34, lowZ]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value, over = -1, lit              = null;

  /** A ring standing in the x–z plane, projected at depth y; `seen` keeps the sides of a solid along y that face the camera. */
  const at = (ring      , cx        , y        , cz        ) => ring.map((q) => P(cx + q.u, y, cz + q.v));
  const seen = (q        ) => 0.612 * q.nu + 0.5 * q.nv > 0;
  const slab = (ring      , inner      , cx        , cz        , y0        , y1        ) => ({
    sil: poly(hull(at(ring, cx, y0, cz).concat(at(ring, cx, y1, cz)))),
    crease: open(at(run(inner, seen), cx, y1, cz)),
  });

  const g = mk("g", {}, svg);
  // the body behind the plate, narrower than it, so the plate's ends stand out as ears
  const [br, bi] = rings(EAR + 2, -DEEP, W - EAR - 2, -T, 3, 1.6);
  put(solid(g), prism(P, front, br, bi, 3, H - 3));
  put(solid(g), slab(rrect(0, 0, W, H, 3, 4), rrect(0.7, 0.7, W - 0.7, H - 0.7, 2.3, 4), 0, 0, -T, 0));
  const flat = (ring      )         => ring.map((q) => [q.u, q.v]);
  const face = (pts        , cls        ) => mk("path", { d: poly(pts.map(([x, z]) => P(x, 0, z))), class: cls }, g);
  for (const ex of [EAR / 2 + 1, W - EAR / 2 - 1]) for (const ez of [8, H - 8]) {
    face(flat(rrect(ex - 3.4, ez - 1.5, ex + 3.4, ez + 1.5, 1.5, 3)), "nf");
  }

  const ports = []          ;
  for (let p = 0; p < 2 * NC; p++) {
    const r = p < NC ? 0 : 1, c = p % NC;
    ports.push({ p, r, c, cx: X0 + (c + 0.5) * PITCH + (c >= 6 ? GAP : 0), cz: r ? ZB : ZT, full: !EMPTY.includes(p) }        );
  }
  // two modules, six by two
  for (const m of [0, 6]) {
    const a = ports[m].cx - PITCH / 2 + 1, b = ports[m + 5].cx + PITCH / 2 - 1;
    face(flat(rrect(a, ZB - JH - 3, b, ZT + JH + NH + 2.6, 2.4, 4)), "lo nf");
  }
  // each jack: its opening with the latch's notch, and the far wall seen through it
  const jack = fillet([[-JW, -JH], [JW, -JH], [JW, JH], [NW, JH], [NW, JH + NH], [-NW, JH + NH], [-NW, JH], [-JW, JH]], [1, 1, 1, 0.4, 0.5, 0.5, 0.4, 1]);
  for (const pt of ports) {
    const { cx, cz } = pt, d = JD;
    pt.jack = face(jack.map(([u, v])       => [cx + u, cz + v]), "nf");
    mk("path", { d: open(([[-JW + d, JH], [-JW + d, -JH + 0.816 * d], [JW, -JH + 0.816 * d]]          ).map(([u, v]) => P(cx + u, 0, cz + v))), class: "lo nf" }, g);
  }

  // plugs and boots, then the cables in front of them, each painted left to right
  const plugG = mk("g", {}, g), cabG = mk("g", {}, g);
  const plug = rrect(-PW, -PH, PW, PH, 1.2, 3), plugIn = rrect(-PW + 0.7, -PH + 0.7, PW - 0.7, PH - 0.7, 0.6, 3);
  const bootA = rrect(-3.7, -3, 3.7, 3, 1.6, 3), bootB = rrect(-2.4, -2.4, 2.4, 2.4, 2.3, 3);
  const order = ports.slice().sort((a, b) => a.c - b.c || a.r - b.r);
  for (const pt of order) {
    pt.pull = spring(0, { eps: 0.002 }); pt.lx = spring(0, { eps: 0.01 }); pt.lz = spring(0, { eps: 0.01 });
    if (!pt.full) continue;
    pt.plug = solid(plugG); pt.latch = mk("path", { class: "lo nf" }, pt.plug.g); pt.boot = solid(plugG);
    pt.cable = mk("path", { class: "sil" }, cabG);
    pt.drawn = "";
  }

  function drawPort(pt      ) {
    const k = pt.pull.x, lx = pt.lx.x, lz = pt.lz.x, key = [k, lx, lz].map((v) => v.toFixed(3)).join();
    if (key === pt.drawn) return;
    pt.drawn = key;
    const { cx, cz, r, p } = pt, y1 = PL + OUT * k, y2 = y1 + BL, up = r ? -1 : 1, [jx, jz] = JIT(p);
    put(pt.plug, slab(plug, plugIn, cx, cz, 0, y1));
    pt.latch.setAttribute("d", seg(P(cx, 0.6, cz + PH), P(cx, y1 - 0.8, cz + PH)));
    put(pt.boot, { sil: poly(hull(at(bootA, cx, y1, cz).concat(at(bootB, cx, y2, cz)))), crease: "" });
    // the cable: out of the boot along y, then bending up (top row) or down (bottom row)
    // a rising cable leaves its boot upwards, so it climbs between two jacks; a hanging one sags out first
    const out = r ? 6 : 2, lean = r ? 2 : 3;
    const p0       = [cx, y2 - 1.5, cz], p1       = r ? [cx + 0.5, y2 + out + 4 * k, cz] : [cx, y2 + 1 + 2 * k, cz + 6];
    const p3       = [cx + lean + jx + lx, y2 + out + 1 + LIFT * k, cz + up * (24 + jz) + lz + LIFT * k], p2       = [p3[0] - 0.6, p3[1] - 1, p3[2] - up * 12];
    const q         = [];
    for (let i = 0; i <= 16; i++) {
      const s = i / 16, a = (1 - s) ** 3, b = 3 * (1 - s) ** 2 * s, c = 3 * (1 - s) * s * s, d = s ** 3;
      q.push(P(...([0, 1, 2].map((j) => a * p0[j] + b * p1[j] + c * p2[j] + d * p3[j])        )));
    }
    pt.cable.setAttribute("d", tube(q, CR * S));
  }

  /** Each port's targets, from the port lifted, a radius in ports and a share of the full answer. */
  function aim(a        , radius        , depth        ) {
    const A = ports[a];
    for (const pt of ports) {
      const dx = pt.c - A.c, dr = pt.r - A.r, d = Math.hypot(dx, dr), f = falloff(d, radius) * depth;
      pt.pull.t = pt === A ? depth : 0;
      pt.lx.t = d ? clamp((dx / d) * f * LEAN, -LEAN, LEAN) : 0;
      pt.lz.t = d ? clamp((-dr / d) * f * LZ, -LZ, LZ) : 0;
    }
  }
  function light(pt      ) {
    if (pt === lit) return;
    const mark = (q      , on         ) => (q.full ? [q.plug.sil, q.boot.sil, q.cable] : [q.jack]).forEach((el) => el.classList.toggle("hi", on));
    if (lit) mark(lit, false);
    lit = pt;
    mark(pt, true);
  }
  aim(REST, 1.6, 0.55);
  for (const pt of ports) for (const s of [pt.pull, pt.lx, pt.lz]) s.x = s.t;
  light(ports[REST]);
  read.textContent = "rest";

  const B = register(stage, (dt) => {
    let m = false;
    for (const pt of ports) {
      for (const s of [pt.pull, pt.lx, pt.lz]) if (stepS(s, dt)) m = true;
      if (pt.full) drawPort(pt);
    }
    return m;
  });
  bag.add(B.unregister);

  // The plane of the plugs at rest, y = HIT_Y: it never moves, so a cable lifting cannot change the pick.
  const o = P(0, HIT_Y, 0), ux = P(1, HIT_Y, 0), uz = P(0, HIT_Y, 1);
  const ex = [ux[0] - o[0], ux[1] - o[1]], ez = [uz[0] - o[0], uz[1] - o[1]], det = ex[0] * ez[1] - ex[1] * ez[0];
  function hit([sx, sy]      ) {
    const qx = sx - o[0], qy = sy - o[1], x = (qx * ez[1] - qy * ez[0]) / det, z = (ex[0] * qy - ex[1] * qx) / det;
    if (x < X0 - 2 || x > W - X0 + 2 || z < ZB - JH - 6 || z > ZT + JH + 8) return -1;
    let best = -1, bd = Infinity;
    for (const pt of ports) {
      const dd = Math.abs(pt.cx - x) + (Math.abs(pt.cz - z) > (ZT - ZB) / 2 ? 1e3 : 0);
      if (dd < bd) { bd = dd; best = pt.p; }
    }
    return best;
  }

  function retarget() {
    if (over >= 0) { aim(over, R, 1); light(ports[over]); read.textContent = "port " + String(over + 1).padStart(2, "0"); }
    else { aim(REST, 1.6, 0.55); light(ports[REST]); read.textContent = "rest"; }
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { const h = hit(p); if (h !== over) { over = h; retarget(); } },
    leave: () => { over = -1; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over >= 0) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/phone":function(__require,module){
const {Cam,circ,clamp,extremes,facing,fillet,fit,hull,lerp,poly,prism,proj,ringAt,rings,rrect,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Phone: a phone lying face down, taken apart in four layers, from the bottom:
 * the glass with its notch, an L-shaped board with its chips, the battery with
 * the connector tab that runs to the board, and the back shell with its camera
 * bump and side buttons. The pointer's x scrubs the gaps (a spring per gap);
 * its y picks a layer, which takes the bright edge and goes to the read-out.
 * The gaps open in turn outwards from the layer picked: the two beside it
 * chase the target, and each further gap chases its inner neighbour. At rest
 * the board is caught lifting off the glass, bright. The slider is the
 * largest gap, in world units.
 *
 * The pattern: scrub and pick, as Exploded. Picking is tested against the
 * target gaps, never the gaps on screen, and the stack is centred on its own
 * middle so it opens both ways and stays in the frame.
 */

const W = 68, L = 140, R = 11, GMAX = 40;
/** Thicknesses: glass, board, the tallest chip, battery, shell, the camera bump and a lens. */
const TG = 2, TB = 1.6, TC = 1.8, TBAT = 7, TS = 6, TBUMP = 2.2, TL = 0.9;
const STACK = TG + TB + TC + TBAT + TS + TBUMP + TL;
const NAMES = ["glass", "board", "battery", "shell"];
/** The gaps at rest, as shares of the largest: the board caught lifting off the glass. */
const REST = [0.36, 0.3, 1.2], MIN = 0.08, PIVOT = 1;
const BOARD         = [[4, L - 44], [W - 4, L - 44], [W - 4, L - 5], [36, L - 5], [36, L - 30], [4, L - 30]];
const BAT                                   = [9, 12, W - 9, L - 48];
/** Chips on the board, [x0, y0, x1, y1, height], back to front: a modem, a socket, a regulator, the processor. */
const CHIPS                                                  = [
  [10, L - 41, 26, L - 34, 1.4], [45, L - 40, 54, L - 35, 1.2], [57, L - 42, 62, L - 36, 1.2], [42, L - 27, 56, L - 13, 1.8],
];
const RECT         = [[0, 0], [W, 0], [W, L], [0, L]];
const FOOT           = [RECT, BOARD, [[BAT[0], BAT[1]], [BAT[2], BAT[1]], [BAT[2], BAT[3]], [BAT[0], BAT[3]]], RECT];
const THICK = [TG, TB, TBAT, TS];

/** Each layer's base height, from the three gaps, centred so the stack opens both ways about its middle. */
function bases(g                   )           {
  const b = [0], t = [TG, TB + TC, TBAT];
  for (let j = 0; j < 3; j++) b.push(b[j] + t[j] + g[j]);
  const mid = (b[3] + TS + TBUMP + TL) / 2;
  return b.map((z) => z - mid);
}

/** Even-odd point-in-polygon, on screen. */
function inside(pt      , pg                 ) {
  let c = false;
  for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) {
    const [xi, yi] = pg[i], [xj, yj] = pg[j];
    if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/** A ring moved by (cx, cy) on the ground. */
const at = (ring      , cx        , cy        )       => ring.map((q) => ({ ...q, u: q.u + cx, v: q.v + cy }));

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let GAP = value, share                = null, act = -1, origin = PIVOT, lastP              = null;

  const C = Cam(45, 0.5, 1.5), H = (STACK + 3 * GMAX) / 2;
  fit(C, [[0, 0, -H], [W + 2.2, L, -H], [W + 2.2, 0, -H], [0, L, -H], [0, 0, H], [W + 2.2, 0, H], [0, L, H]], 200, 166);
  const P = proj(C), front = facing(C);
  const flat = (pts                 , z        ) => poly(pts.map(([x, y]) => P(x, y, z)));
  const g = mk("g", {}, svg);

  // the guides, from the shell's outermost points down to the glass: painted first, so every plate hides them
  const outer = rrect(0, 0, W, L, R, 8);
  const ext = extremes(P, outer).slice(0, 2), guide = mk("path", { class: "nf dash" }, g);

  // glass: a rounded slab, its display edge cut by the notch, a camera and a speaker slit in the notch
  const gg = mk("g", {}, g), glass = solid(gg), gIn = rrect(1.2, 1.2, W - 1.2, L - 1.2, R - 1.2, 8);
  const DISP = fillet([[4, 4], [W - 4, 4], [W - 4, L - 4], [W / 2 + 12, L - 4], [W / 2 + 12, L - 10], [W / 2 - 12, L - 10], [W / 2 - 12, L - 4], [4, L - 4]], [7.5, 7.5, 7.5, 2, 3.5, 3.5, 2, 7.5]);
  const disp = mk("path", { class: "nf" }, gg), lensF = mk("path", { class: "nf" }, gg), slit = mk("path", { class: "nf lo" }, gg);
  const camF = at(circ(1.5, 16), W / 2 + 6, L - 7);

  // board: an L-shaped plate, its edge as a second outline, and its chips
  const bg = mk("g", {}, g), BF = fillet(BOARD, [4, 4, 4, 4, 3, 4]);
  const bBack = mk("path", { class: "lo" }, bg), bFace = mk("path", { class: "sil" }, bg);
  const chips = CHIPS.map(([x0, y0, x1, y1, h]) => { const [ring, inner] = rings(x0, y0, x1, y1, 1.5, 0.7); return { ring, inner, h, el: solid(bg) }; });

  // battery: a rounded block, and the flex tab that leaves its near end with the connector on it
  const tg = mk("g", {}, g), battery = solid(tg), [batR, batI] = rings(...BAT, 6, 1.6);
  const TAB = fillet([[41, L - 48], [52, L - 48], [52, L - 31], [41, L - 31]], [0.5, 0.5, 2, 2]);
  const tBack = mk("path", { class: "lo" }, tg), tFace = mk("path", {}, tg), conn = solid(tg);
  const [conR, conI] = rings(42, L - 38, 51, L - 32, 1.5, 0.7);

  // shell: the back, two volume buttons standing off its near side, the camera bump and its lenses
  const sg = mk("g", {}, g), shell = solid(sg), sIn = rrect(1.8, 1.8, W - 1.8, L - 1.8, R - 1.8, 8);
  const buttons = [[L - 68, L - 58], [L - 54, L - 44]].map(([y0, y1]) => { const [ring, inner] = rings(W - 0.5, y0, W + 2.2, y1, 1.2, 0.5); return { ring, inner, el: solid(sg) }; });
  const bump = solid(sg), bumpR = rrect(7, L - 33, 33, L - 7, 7, 6), bumpI = rrect(8, L - 32, 32, L - 8, 6, 6);
  const lenses = [[14.5, L - 25.5], [25.5, L - 14.5]].map(([x, y]) => {
    const el = solid(sg);
    return { ring: at(circ(4.6, 24), x, y), inner: at(circ(3.6, 24), x, y), eye: at(circ(1.9, 16), x, y), el, glass: mk("path", { class: "nf lo" }, el.g) };
  });
  const flash = mk("path", { class: "nf" }, sg), FL = at(circ(1.7, 16), 25.5, L - 25.5);

  const draw                             = [
    (z) => {
      put(glass, prism(P, front, outer, gIn, z, z + TG));
      const t = z + TG;
      disp.setAttribute("d", flat(DISP, t));
      lensF.setAttribute("d", poly(ringAt(P, camF, t)));
      slit.setAttribute("d", seg(P(W / 2 - 6, L - 7, t), P(W / 2 + 1.5, L - 7, t)));
    },
    (z) => {
      bBack.setAttribute("d", flat(BF, z));
      bFace.setAttribute("d", flat(BF, z + TB));
      for (const c of chips) put(c.el, prism(P, front, c.ring, c.inner, z + TB, z + TB + c.h));
    },
    (z) => {
      put(battery, prism(P, front, batR, batI, z, z + TBAT));
      tBack.setAttribute("d", flat(TAB, z + 0.8));
      tFace.setAttribute("d", flat(TAB, z + 1.4));
      put(conn, prism(P, front, conR, conI, z + 1.4, z + 2.6));
    },
    (z) => {
      put(shell, prism(P, front, outer, sIn, z, z + TS));
      for (const b of buttons) put(b.el, prism(P, front, b.ring, b.inner, z + 1.6, z + 4.4));
      const t = z + TS, u = t + TBUMP;
      put(bump, prism(P, front, bumpR, bumpI, t, u));
      for (const l of lenses) { put(l.el, prism(P, front, l.ring, l.inner, u, u + TL)); l.glass.setAttribute("d", poly(ringAt(P, l.eye, u + TL))); }
      flash.setAttribute("d", poly(ringAt(P, FL, u)));
    },
  ];
  const sils = [glass.sil, bFace, battery.sil, shell.sil];

  /** The gaps the pointer asks for: one share of the largest across, or the rest pose. */
  const targets = () => [0, 1, 2].map((j) => GAP * (share === null ? REST[j] : share));
  const gs = targets().map((t) => spring(t, { eps: 0.01 }));
  const drawn = [NaN, NaN, NaN, NaN];

  const B = register(stage, (dt) => {
    // the gaps beside the origin chase the target; each further gap chases its inner neighbour's lag
    const T = targets(), order = [0, 1, 2].sort((a, b) => Math.abs(a + 0.5 - origin) - Math.abs(b + 0.5 - origin));
    let m = false;
    for (const j of order) {
      const d = j + 0.5 - origin, k = d > 0 ? j - 1 : j + 1;
      gs[j].t = Math.abs(d) < 1 ? T[j] : T[j] + gs[k].x - T[k];
      if (stepS(gs[j], dt)) m = true;
    }
    const b = bases(gs.map((s) => s.x));
    let changed = false;
    b.forEach((z, i) => { if (z !== drawn[i]) { drawn[i] = z; draw[i](z); changed = true; } });
    if (changed) guide.setAttribute("d", ext.map((q) => seg(P(q.u, q.v, b[3]), P(q.u, q.v, b[0] + TG))).join(""));
    return m;
  });
  bag.add(B.unregister);

  /** The layer under a screen point, tested where the layers are going (the target gaps), topmost first; else the nearest in height. */
  function pick(p      ) {
    const b = bases(targets());
    for (let i = 3; i >= 0; i--) {
      const f = FOOT[i], top = f.map(([x, y]) => P(x, y, b[i] + THICK[i]));
      const shape = i === 1 ? top : hull(top.concat(f.map(([x, y]) => P(x, y, b[i]))));
      if (inside(p, shape)) return i;
    }
    let best = 0, bd = Infinity;
    b.forEach((z, i) => { const dy = Math.abs(P(W / 2, L / 2, z + THICK[i])[1] - p[1]); if (dy < bd) { bd = dy; best = i; } });
    return best;
  }
  function setAct(a        ) {
    if (a >= 0) origin = a;
    act = a;
    const lit = a >= 0 ? a : PIVOT;
    sils.forEach((s, i) => s.classList.toggle("hi", i === lit));
    read.textContent = a >= 0 ? NAMES[a] : "rest";
    B.wake();
  }
  setAct(-1);

  bag.add(pointer(stage, {
    move: (p) => { lastP = p; share = lerp(MIN, 1, clamp((p[0] - 60) / 280, 0, 1)); setAct(pick(p)); },
    leave: () => { lastP = null; share = null; setAct(-1); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { GAP = v; if (lastP) setAct(pick(lastP)); B.wake(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/phosphor":function(__require,module){
const {Cam,fit,proj,unproj,facing,rings,prism,rrect,ringAt,extremes,poly,seg,clamp,lerp}=__require("core/iso");
const {reducedMotion}=__require("core/motion");
const {mk,solid,put,flatDot,place,reflect,register,pointer,disposer}=__require("core/stage");

/**
 * Phosphor (Fig 9.4): a 7 × 7 dot matrix you can paint on. Each dot holds an
 * intensity that decays with persistence τ (the slider, in ms). At idle a
 * loop of frames, seven row bytes each, excites the dots; the pointer
 * excites them instead, and the loop fades back in 1.2s after it leaves.
 * Ambient: the tick always asks for another frame, so it runs whenever the
 * stage is on screen and the shared observer puts it to sleep when it isn't.
 * Ported from the study's `#phosphor` (design/lab-hairline/cartilha-v2.html).
 */

const N = 7, PITCH = 10, M = 8, EXT = M * 2 + PITCH * (N - 1), T = 5, R = 2.5, DROP = 15, BT = 4, BO = 7;
/** The loop, seven row bytes per frame (MSB = left column): a ripple out from the centre, a pause, a diagonal sweep, a pause. */
const LOOP = [
  [0, 0, 0, 8, 0, 0, 0], [0, 0, 8, 20, 8, 0, 0], [0, 28, 34, 34, 34, 28, 0], [28, 34, 65, 65, 65, 34, 28], [65, 0, 0, 0, 0, 0, 65],
  [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0],
  [64, 0, 0, 0, 0, 0, 0], [32, 64, 0, 0, 0, 0, 0], [16, 32, 64, 0, 0, 0, 0], [8, 16, 32, 64, 0, 0, 0], [4, 8, 16, 32, 64, 0, 0], [2, 4, 8, 16, 32, 64, 0], [1, 2, 4, 8, 16, 32, 64],
  [0, 1, 2, 4, 8, 16, 32], [0, 0, 1, 2, 4, 8, 16], [0, 0, 0, 1, 2, 4, 8], [0, 0, 0, 0, 1, 2, 4], [0, 0, 0, 0, 0, 1, 2], [0, 0, 0, 0, 0, 0, 1],
  [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0],
];
const FRAME_MS = 110;
/** The loop waits this long after the pointer leaves, then fades its gain in over RAMP. */
const RESUME = 1200, RAMP = 400;
/** A painted dot at full, its four neighbours at this share. */
const SPLASH                                      = [[0, 0, 1], [1, 0, 0.45], [-1, 0, 0.45], [0, 1, 0.45], [0, -1, 0.45]];

const lit = (f        , r        , c        ) => (LOOP[f][r] >> (N - 1 - c)) & 1;

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let tau = value, clock = 0, lastFrame = -1, leftAt = -1e9, painting = false;
  let prev              = null;

  const C = Cam(45, 0.5, 2.12), ZB = -DROP - BT;
  fit(C, [[-BO, -BO, ZB], [EXT + BO, EXT + BO, ZB - 6], [EXT + BO, -BO, ZB], [-BO, EXT + BO, ZB], [0, 0, T]], 200, 160);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // base plate, its reflection, then the dashed drops, then the tile over them
  const [br, bi] = rings(-BO, -BO, EXT + BO, EXT + BO, 11, 1.8);
  reflect(svg, g, P, front, br, ZB, 12);
  put(solid(g), prism(P, front, br, bi, ZB, -DROP));
  const [tr, ti] = rings(0, 0, EXT, EXT, 7, 1.3);
  mk("path", { d: extremes(P, tr).map((q) => seg(P(q.u, q.v, 0), P(q.u, q.v, -DROP))).join(""), class: "nf dash" }, g);
  put(solid(g), prism(P, front, tr, ti, 0, T));
  mk("path", { d: poly(ringAt(P, rrect(3.5, 3.5, EXT - 3.5, EXT - 3.5, 4.5, 5), T)), class: "nf lo" }, g);

  const I = new Float32Array(N * N);
  const dots                      = [];
  for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
    const d = flatDot(g, C, R, "dot");
    place(d, P(M + c * PITCH, M + r * PITCH, T));
    dots.push(d);
  }

  /** Lights the cell nearest a point on the tile, and its neighbours less, never dimming what is brighter. */
  function excite(x        , y        , amt        ) {
    const c = Math.round((x - M) / PITCH), r = Math.round((y - M) / PITCH);
    for (const [dr, dc, k] of SPLASH) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || rr >= N || cc < 0 || cc >= N) continue;
      I[rr * N + cc] = Math.max(I[rr * N + cc], amt * k);
    }
  }

  const B = register(stage, (dt, now) => {
    if (reducedMotion() && !painting) {
      // no loop: settle on a composed still, the ripple's widest ring
      for (let i = 0; i < N * N; i++) I[i] = Math.max(I[i] * Math.exp((-dt * 1000) / tau), lit(3, Math.floor(i / N), i % N) * 0.8);
    } else {
      const decay = Math.exp((-dt * 1000) / tau);
      for (let i = 0; i < N * N; i++) I[i] *= decay;
      const gain = painting ? 0 : clamp((now - leftAt - RESUME) / RAMP, 0, 1);
      if (gain > 0) {
        clock += dt * 1000;
        const f = Math.floor(clock / FRAME_MS) % LOOP.length;
        if (f !== lastFrame) {
          lastFrame = f;
          for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (lit(f, r, c)) I[r * N + c] = Math.max(I[r * N + c], gain);
        }
        read.textContent = `loop · ${String(f + 1).padStart(2, "0")}/${LOOP.length}`;
      } else read.textContent = painting ? "paint" : "afterglow";
    }
    for (let i = 0; i < N * N; i++) dots[i].setAttribute("opacity", (0.14 + 0.86 * clamp(I[i], 0, 1)).toFixed(3));
    return true;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      painting = true;
      const q = unproj(C, p[0], p[1], T);
      // fill in between moves, so a fast stroke leaves a line rather than dots
      if (prev) {
        const n = Math.ceil(Math.hypot(q[0] - prev[0], q[1] - prev[1]) / 3);
        for (let k = 1; k <= n; k++) excite(lerp(prev[0], q[0], k / n), lerp(prev[1], q[1], k / n), 1);
      } else excite(q[0], q[1], 1);
      prev = q;
      B.wake();
    },
    // the resume is a timestamp the tick reads, not a timer, so re-entering or tearing down has nothing to cancel
    leave: () => { painting = false; prev = null; leftAt = __hairClock.now; clock = 0; lastFrame = -1; B.wake(); },
  }));

  bag.add(() => svg.replaceChildren());
  return { set: (v) => { tau = v; }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/plot":function(__require,module){
const {Cam,clamp,facing,fillet,fit,hull,open,poly,prism,proj,rings,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {TABLE}=__require("intensity");

/**
 * Plot: a bar chart standing up as an object, with no data in it. A base, a
 * back plate with dim grid lines, and seven flat tabs lying on the base where
 * the bars would stand. The pointer brushes the tabs: each lifts a little,
 * the nearest most, and drops back to zero while the pointer is still there.
 * At rest the tabs lie flat and one stands a hair proud, bright. The slider
 * is how far the nearest tab lifts.
 *
 * The pattern: a field, as Rail's. One spring per tab on its height, always
 * pulled back to zero; the brush is a kick of velocity, sized so the spring
 * peaks at the lift, falling off with the distance, in tabs, from the one
 * picked. The pick is the tab whose rest centre is nearest the pointer's
 * screen x, and the tabs are kicked only when the pick changes, so a pointer
 * held still leaves the chart flat.
 */

const N = 7, X0 = 13, DX = 10, TW = 5, TY0 = 6, TY1 = 11, TH = 1; // tabs: how many, the first one's centre, their pitch, width, far and near edge, thickness
const L = 2 * X0 + (N - 1) * DX, D = 16, BZ = 3.6, PY = 2, PT = 2, HP = 34, GRID = 4, AX = 7, TICK = 4; // base: length, depth, thickness; plate: back face, thickness, height; grid lines, the axis's x, a tick's length
const PROUD = 2.2, MARK = 4, S = 3.2;
/**
 * The tabs' spring is softer than the default, k 40 · c 11, so a kicked bar
 * stays up long enough to be read against the grid: it peaks at 165ms and
 * settles in 1s at the lowest lift to 1.4s at the highest, where the
 * default's flinch peaks at 100ms. KICK is the velocity that makes this
 * spring, stepped at 240 Hz, peak one unit above where it was kicked.
 */
const SPRING = { k: 40, c: 11, eps: 0.02 }, KICK = 16.4;
/** The share of the lift a tab d tabs from the one picked takes: all of it there, a little for every tab. */
const falloff = (d        ) => 1 / (1 + 0.5 * d * d);
/** The plate's face in its own (x, z), from its bottom right corner round. `fillet` gives ARC + 1 points a corner, so EDGE is the run from the first corner's end to the third's: its right side and top. */
const ARC = 5, FACE = /* @__PURE__ */ fillet([[L - 2, 0], [L - 2, HP], [2, HP], [2, 0]], [0.6, 4, 4, 0.6], ARC), EDGE = [ARC, 3 * (ARC + 1)]         ;

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const TOP = TABLE.plot[2];
  const C = Cam(45, 0.5, S);
  fit(C, [[0, 0, -BZ], [L, 0, -BZ], [0, D, -BZ], [L, D, -BZ], [0, PY, HP], [L, PY, HP]], 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // Back to front: the base, the plate and the grid on its face, then the tabs from the far end.
  const [bo, bi] = rings(0, 0, L, D, 6, 1.6);
  put(solid(g), prism(P, front, bo, bi, -BZ, 0));
  const face = (y        ) => FACE.map(([x, z]) => P(x, y, z));
  // A thin plate: its silhouette, and its near face's right side and top for the thickness.
  put(solid(g), { sil: poly(hull(face(PY).concat(face(PY + PT)))), crease: open(face(PY + PT).slice(...EDGE)) });
  // On its face, a chart with nothing plotted: dim grid lines, and the axis they start from, with a tick at each.
  const at = (x        , z        ) => P(x, PY + PT, z), zs = Array.from({ length: GRID }, (_, k) => (HP * (k + 1)) / (GRID + 1));
  mk("path", { class: "nf lo", d: zs.map((z) => seg(at(AX, z), at(L - 7, z))).join("") }, g);
  mk("path", { class: "nf", d: seg(at(AX, 0), at(AX, HP - 4)) + zs.map((z) => seg(at(AX - TICK, z), at(AX, z))).join("") }, g);
  const tabs = Array.from({ length: N }, (_, i) => { const x = X0 + i * DX; return { ring: rings(x - TW / 2, TY0, x + TW / 2, TY1, 1.2, 0.4), el: solid(g) }; });

  const sp = tabs.map((_, i) => spring(i === MARK ? PROUD : 0, SPRING));
  const drawn = tabs.map(() => NaN);
  function draw() {
    tabs.forEach((t, i) => {
      const h = clamp(sp[i].x, 0, TOP);
      if (h === drawn[i]) return;
      drawn[i] = h;
      put(t.el, prism(P, front, t.ring[0], t.ring[1], 0, TH + h));
    });
  }

  const loop = register(stage, (dt) => { let m = false; for (const s of sp) m = stepS(s, dt) || m; draw(); return m; });
  bag.add(loop.unregister);

  // Each tab's rest centre on screen: what the pointer's x is read against.
  const cx = tabs.map((_, i) => P(X0 + i * DX, (TY0 + TY1) / 2, 0)[0]);
  let lift = value, picked = -2;
  /** Kicks every tab up toward its share of the lift, from tab a; one already that high is left alone. */
  function kick(a        ) {
    sp.forEach((s, i) => { const need = lift * falloff(Math.abs(i - a)) - s.x; if (need > 0) s.v = Math.max(s.v, KICK * need); });
    loop.wake();
  }
  function choose(a        ) {
    if (a === picked) return;
    picked = a;
    sp.forEach((s, i) => { s.t = a < 0 && i === MARK ? PROUD : 0; });
    if (a >= 0) kick(a);
    tabs.forEach((t, i) => t.el.sil.classList.toggle("hi", i === (a < 0 ? MARK : a)));
    read.textContent = a < 0 ? "rest" : `bar ${a + 1} · 0`;
    loop.wake();
  }
  choose(-1);
  draw();

  bag.add(pointer(stage, {
    move: (p) => choose(cx.reduce((best, x, i) => (Math.abs(p[0] - x) < Math.abs(p[0] - cx[best]) ? i : best), 0)),
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { lift = v; if (picked >= 0) kick(picked); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/plug":function(__require,module){
const {Cam,circ,clamp,fit,hull,lerp,open,poly,proj,rad,rrect,run,unproj}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Plug: a wall plate with a socket, and a plug lying on the floor at the end
 * of a cord that curves away out of the frame. The pointer draws the plug up
 * toward the socket on a spring, and the cord pays out behind it. It never
 * seats: it stops short, and falls back when the pointer leaves. At rest it
 * lies on the floor, its two pins bright, the socket's holes bare. The slider
 * is how much of the way to the socket the plug can come.
 *
 * The pattern: follow a position. One spring on how far along its way the
 * plug is, set from where the pointer falls on the screen line from the
 * plug's rest to the socket, which never moves. Where the plug is and how far
 * it has turned to face the wall are both read from that one number.
 */

const PT = 3, PH = 21, ZC = 30, PR = 7, B = 1.4;           // the plate: thickness, half its side, the socket's height, corner radius, crease inset
const HOLE = 2.6, HS = 8, RECESS = 13;                     // the socket: hole radius, the holes' offset from its centre, the recess round them
const BW = 11, BH = 6.5, BR = 4.5, BL = 18;                // the plug's body: half width, half height, corner radius, length
const PIN = 2, PL = 11, SL = 7, S0 = 4.6, S1 = 3, CR = 1.8; // pin radius, pin length, the sleeve's length and two radii, the cord's radius
const REST       = [48, 8], YAW = 100, TURN = 0.7, S = 2.8; // the pins' face on the floor, its heading, the share of the way the turn takes, scale
const EDGE = 398;                                          // where the cord leaves the picture: the viewBox's right edge, less a stroke
const ss = (t        ) => t * t * (3 - 2 * t);

/** Cuts the loops an inner offset makes where the cord bends tighter than its radius on screen. */
function untangle(L        )         {
  for (let i = 0; i < L.length - 3; i++) for (let j = L.length - 2; j > i + 1; j--) {
    const p = L[i], q = L[i + 1], r = L[j], s = L[j + 1];
    const e0 = q[0] - p[0], e1 = q[1] - p[1], f0 = s[0] - r[0], f1 = s[1] - r[1], g0 = r[0] - p[0], g1 = r[1] - p[1], d = e0 * f1 - e1 * f0;
    if (!d) continue;
    const t = (g0 * f1 - g1 * f0) / d, u = (g0 * e1 - g1 * e0) / d;
    if (t > 0 && t < 1 && u > 0 && u < 1) { L.splice(i + 1, j - i, [p[0] + t * e0, p[1] + t * e1]); break; }
  }
  return L;
}

/** A screen line up to where it first crosses x = X, ending on it. */
function upTo(L        , X        )         {
  const i = L.findIndex((p) => p[0] > X);
  if (i < 1) return i < 0 ? L : [];
  const p = L[i - 1], q = L[i], f = (X - p[0]) / (q[0] - p[0]);
  return [...L.slice(0, i), [X, p[1] + (q[1] - p[1]) * f]];
}

/** The cord's outline: its screen centre line offset by its radius, the plug's end a round cut, the far end cut off at x = X with no line across it, as the frame would. */
function tube(Q                 , rho        , X        )         {
  const n = Q.length, A         = [], Bk         = [];
  for (let i = 0; i < n; i++) {
    const a = Q[Math.max(i - 1, 0)], c = Q[i], b = Q[Math.min(i + 1, n - 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    A.push([c[0] - ty * rho, c[1] + tx * rho]); Bk.push([c[0] + ty * rho, c[1] - tx * rho]);
  }
  const cap = (c      ) => { const o         = []; for (let k = 7; k >= 1; k--) { const t = (Math.PI * k) / 8; o.push([c[0] + rho * Math.cos(t), c[1] + rho * 0.5 * Math.sin(t)]); } return o; };
  return open([...upTo(untangle(Bk), X).reverse(), ...cap(Q[0]), ...upTo(untangle(A), X)]);
}

/** Where the plug is s of the way to the socket: the centre of its pins' face, its heading (w) and its width (u). Up is up. */
function pose(s        )                                {
  const th = rad(lerp(YAW, 180, ss(clamp(s / TURN, 0, 1))));
  return {
    c: [lerp(REST[0], PL, s), lerp(REST[1], 0, s), lerp(BH, ZC, Math.sin((s * Math.PI) / 2))],
    w: [Math.cos(th), Math.sin(th), 0],
    u: [-Math.sin(th), Math.cos(th), 0],
  };
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, S), zf = Math.sqrt(1 - C.k * C.k);
  /** Toward the camera: a face whose normal has a positive dot with this is seen. */
  const V       = [Math.sin(C.az) * zf, Math.cos(C.az) * zf, C.k];
  const dot = (a      , b      ) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  /** A point in the plug's own frame: a across, b up, d along its heading from the pins' face. */
  const at = (o                         , a        , b        , d        )       =>
    [o.c[0] + a * o.u[0] + d * o.w[0], o.c[1] + a * o.u[1] + d * o.w[1], o.c[2] + b];

  // The camera is fitted to the plate and the plug at both ends of its way.
  const ext         = [];
  for (const x of [0, -PT]) for (const y of [-PH, PH]) for (const z of [ZC - PH, ZC + PH]) ext.push([x, y, z]);
  for (const s of [0, 1]) { const o = pose(s); for (const a of [-BW, BW]) for (const b of [-BH, BH]) for (const d of [PL, -BL - SL]) ext.push(at(o, a, b, d)); }
  fit(C, ext, 200, 166);
  const P = proj(C), Pv = (p      ) => P(p[0], p[1], p[2]);

  // The plate: a thin slab on the wall, its face toward +x, the recess and two holes cut into it.
  const g = mk("g", {}, svg);
  const face = rrect(-PH, ZC - PH, PH, ZC + PH, PR, 6), lip = rrect(-PH + B, ZC - PH + B, PH - B, ZC + PH - B, PR - B, 6);
  put(solid(g), {
    sil: poly(hull(face.map((q) => P(0, q.u, q.v)).concat(face.map((q) => P(-PT, q.u, q.v))))),
    crease: open(run(lip, (q) => q.nu * V[1] + q.nv * V[2] > 0).map((q) => P(0, q.u, q.v))),
  });
  mk("path", { class: "nf lo", d: poly(circ(RECESS, 48).map((q) => P(0, q.u, ZC + q.v))) }, g);
  mk("path", { class: "nf", d: [-HS, HS].map((y) => poly(circ(HOLE, 16).map((q) => P(0, y + q.u, ZC + q.v)))).join("") }, g);

  // The plug, back to front as it lies; the order turns over with it.
  const pg = mk("g", {}, svg);
  const cord = mk("path", { class: "sil" }, pg), sleeve = mk("path", { class: "sil" }, pg), body = solid(pg), pins = mk("path", { class: "sil hi" }, pg);
  const s0 = circ(S0, 16), s1 = circ(S1, 16);
  /** An end rounded over rr: the cross-section f(inset) in four steps, from the face at d inward along dir. */
  const rounded = (f                     , rr        , d        , dir        ) =>
    [0, 30, 60, 90].map((a)                 => [f(rr * (1 - Math.sin(rad(a)))), d + dir * rr * (1 - Math.cos(rad(a)))]);
  const box = (k        ) => rrect(-BW + k, -BH + k, BW - k, BH - k, BR - k), rod = (k        ) => circ(PIN - k, 12);
  const inner = box(2), shell = [...rounded(box, 2, 0, -1), ...rounded(box, 2, -BL, 1)], prong = [[rod(0), 0]                  , ...rounded(rod, PIN * 0.8, PL, -1)];
  /** The silhouette of a solid swept through cross-sections, each a ring at a distance along the heading, a0 across. */
  const sweep = (o                         , parts                       , a0 = 0) =>
    poly(hull(parts.flatMap(([r, d]) => r.map((q) => Pv(at(o, a0 + q.u, q.v, d))))));

  // The cord's floor end, past the frame's right edge, and the floor point it bends round; neither moves.
  // The cord is drawn only up to just inside that edge, so it runs out of the picture without leaving the viewBox.
  const end       = [...unproj(C, 440, 150, CR), CR], bend       = [REST[0] + 18, REST[1] - 52, CR];
  let front = true, drawn = NaN;
  const sp = spring(0, { eps: 0.002 });

  function draw() {
    if (sp.x === drawn) return;
    drawn = sp.x;
    const o = pose(sp.x), pinsFace = dot(o.w, V) > 0, vu = dot(o.u, V);
    if (pinsFace !== front) { front = pinsFace; pg.append(...(front ? [cord, sleeve, body.g, pins] : [pins, body.g, cord, sleeve])); }
    const dEnd = front ? 0 : -BL;
    put(body, {
      sil: sweep(o, shell),
      crease: open(run(inner, (q) => q.nu * vu + q.nv * V[2] > 0).map((q) => Pv(at(o, q.u, q.v, dEnd)))),
    });
    pins.setAttribute("d", [-HS, HS].map((a) => sweep(o, prong, a)).join(""));
    sleeve.setAttribute("d", sweep(o, [[s0, -BL], [s1, -BL - SL]]));
    // The cord: a cubic from inside the sleeve's end, leaving along the plug's heading, round the bend to the floor end.
    const t0 = at(o, 0, 0, -BL - SL + 2), t1 = at(o, 0, 0, -BL - SL - 26), Q         = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 40, a = (1 - t) ** 3, b = 3 * (1 - t) ** 2 * t, c = 3 * (1 - t) * t * t, d = t ** 3;
      Q.push(P(a * t0[0] + b * t1[0] + c * bend[0] + d * end[0], a * t0[1] + b * t1[1] + c * bend[1] + d * end[1], a * t0[2] + b * t1[2] + c * bend[2] + d * end[2]));
    }
    cord.setAttribute("d", tube(Q, CR * S, EDGE));
  }

  const loop = register(stage, (dt) => { const m = stepS(sp, dt); draw(); return m; });
  bag.add(loop.unregister);

  // The line the pointer is read along: from the pins' face at rest to the socket, on screen. Neither moves.
  const A = Pv(pose(0).c), Bs = P(0, 0, ZC), ab       = [Bs[0] - A[0], Bs[1] - A[1]], ab2 = ab[0] * ab[0] + ab[1] * ab[1];
  let pull = value, along = -1;
  function retarget() {
    sp.t = along < 0 ? 0 : Math.min(along, pull);
    // the gap from the pins' tips to the socket, read from the target, never the pose on screen
    const o = pose(sp.t), tip = at(o, 0, 0, PL);
    read.textContent = along < 0 ? "rest" : `gap ${Math.round(Math.hypot(tip[0], tip[1], tip[2] - ZC))} · 0 V`;
    loop.wake();
  }
  retarget();
  draw();

  bag.add(pointer(stage, {
    move: (p) => { along = clamp(((p[0] - A[0]) * ab[0] + (p[1] - A[1]) * ab[1]) / ab2, 0, 1); retarget(); },
    leave: () => { along = -1; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { pull = v; retarget(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/query":function(__require,module){
const {Cam,circ,clamp,facing,fit,open,poly,prism,proj,rad}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {TABLE}=__require("intensity");

/**
 * Query: a question mark built as a solid on a small round plinth. The hook
 * is one bent bar, swept along a centre line of an arc, a neck and a stem, as
 * Padlock's shackle is; the dot is a ball lying loose on the plinth under it.
 * The pointer turns the hook about its stem toward it, and the ball rolls
 * round after it, later and softer, and comes back to lie under the stem. At
 * rest the hook stands well off square and the ball lies on its axis,
 * under the stem's foot, bright: the dot of the mark. The slider is how far
 * the hook turns, in degrees.
 *
 * The pattern: follow a position. One spring on the hook's turn, set by the
 * pointer's screen x against the stem's, which never moves. The ball follows
 * that turn on a softer spring, because a loose ball lags what it rolls after;
 * it is pushed off the axis only by how far it lags, a few units at most, so
 * it always reads as the dot and settles back under the stem.
 */

const PR = 27, PH = 6, B = 1.6;                         // the plinth: radius, height, crease inset
const T = 4.3, R = 16, ZC = 66, A0 = 200, A1 = -35;     // the bar: radius, the hook's radius, its centre's height, where the arc starts and ends
const ZK = 38, ZS = 29, BR = 6, SWAY = 0.2, TRAVEL = 4; // the neck's foot, the stem's end, the ball's radius, how far off the axis a degree of lag pushes it, and the most it goes
const FACE = -45, REST = 36, REACH = 150, S = 2.6;        // the plane that faces the camera, the rest turn, the pointer's reach in viewBox units, scale
const LIGHT       = [-Math.SQRT1_2, -Math.SQRT1_2], GLEAM = 0.4; // where the light comes from on screen (the ball's glint too), and how far the bar's crease leans to it, in radii

/** The centre line in the hook's own plane (s across, z up): over the arc, down the neck, down the stem. */
const LINE         = /* @__PURE__ */ (() => {
  const pts         = [];
  for (let i = 0; i <= 30; i++) { const a = rad(A0 + ((A1 - A0) * i) / 30); pts.push([R * Math.cos(a), ZC + R * Math.sin(a)]); }
  const e = pts[pts.length - 1], a = rad(A1), t       = [Math.sin(a), -Math.cos(a)];
  const c1       = [e[0] + t[0] * 10, e[1] + t[1] * 10], c2       = [0, ZK + 10];   // long handles: the neck bends no tighter than 2.5 bar radii
  for (let i = 1; i <= 20; i++) {
    const u = i / 20, w = 1 - u;
    pts.push([w * w * w * e[0] + 3 * w * w * u * c1[0] + 3 * w * u * u * c2[0], w * w * w * e[1] + 3 * w * w * u * c1[1] + 3 * w * u * u * c2[1] + u * u * u * ZK]);
  }
  pts.push([0, ZS]);
  return pts;
})();

/** The run of LINE the bar's crease follows: the arc, short of its tip and of the neck. */
const ARC = [2, 28];

/** Point i of a screen centre line, moved d toward the light across the bar: the line a round section catches its light on. */
function lean(Q                 , i        , d        )       {
  const a = Q[Math.max(i - 1, 0)], b = Q[Math.min(i + 1, Q.length - 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = -(b[1] - a[1]) / l, ny = (b[0] - a[0]) / l, k = d * (nx * LIGHT[0] + ny * LIGHT[1]);
  return [Q[i][0] + nx * k, Q[i][1] + ny * k];
}

/** Where two screen segments cross, or null. */
function cross(p      , q      , r      , s      )              {
  const e0 = q[0] - p[0], e1 = q[1] - p[1], f0 = s[0] - r[0], f1 = s[1] - r[1], g0 = r[0] - p[0], g1 = r[1] - p[1];
  const d = e0 * f1 - e1 * f0;
  if (!d) return null;
  const t = (g0 * f1 - g1 * f0) / d, u = (g0 * e1 - g1 * e0) / d;
  return t > 0 && t < 1 && u > 0 && u < 1 ? [p[0] + t * e0, p[1] + t * e1] : null;
}
/** Cuts the loops an inner offset makes where the bar bends tighter than its radius on screen. */
function untangle(L        )         {
  for (let i = 0; i < L.length - 3; i++) for (let j = L.length - 2; j > i + 1; j--) {
    const x = cross(L[i], L[i + 1], L[j], L[j + 1]);
    if (x) { L.splice(i + 1, j - i, x); break; }
  }
  return L;
}

/** The bar's outline: its screen centre line offset by its radius. The curl's tip is a dome, round from anywhere; the stem's foot is cut flat, seen from above. */
function tube(Q                 , rho        )         {
  const n = Q.length, A         = [], Bk         = [], tan         = [];
  for (let i = 0; i < n; i++) {
    const a = Q[Math.max(i - 1, 0)], c = Q[i], b = Q[Math.min(i + 1, n - 1)];
    const l0 = Math.hypot(c[0] - a[0], c[1] - a[1]) || 1, l1 = Math.hypot(b[0] - c[0], b[1] - c[1]) || 1;
    let tx = (c[0] - a[0]) / l0 + (b[0] - c[0]) / l1, ty = (c[1] - a[1]) / l0 + (b[1] - c[1]) / l1;
    const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    tan.push([tx, ty]);
    A.push([c[0] - ty * rho, c[1] + tx * rho]); Bk.push([c[0] + ty * rho, c[1] - tx * rho]);
  }
  /** The dome: half a round from the near side to the far, through the point the tip faces. */
  const dome = (c      , t      ) => Array.from({ length: 9 }, (_, k)       => {
    const a = (Math.PI * (k + 1)) / 10, cs = -Math.cos(a), sn = -Math.sin(a);
    return [c[0] + rho * (-t[1] * cs + t[0] * sn), c[1] + rho * (t[0] * cs + t[1] * sn)];
  });
  /** The flat cut: the near half of a level round, as Padlock's ends are. The stem stands plumb, so it runs left to right. */
  const cut = (c      ) => Array.from({ length: 7 }, (_, k)       => { const a = (Math.PI * (7 - k)) / 8; return [c[0] + rho * Math.cos(a), c[1] + rho * 0.5 * Math.sin(a)]; });
  return poly([...untangle(A), ...cut(Q[n - 1]), ...untangle(Bk).reverse(), ...dome(Q[0], tan[0])]);
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const TMAX = TABLE.query[2];
  let max = value, over = false;

  /** The hook's plane, turned th degrees from facing the camera: a point (s, z) of it in the world. */
  const at = (th        ) => { const a = rad(FACE - th), c = Math.cos(a), n = Math.sin(a); return (s        , z        )       => [s * c, s * n, z]; };
  /** The ball's centre: on the axis under the stem, pushed across the hook's plane by how far it lags the turn. */
  const ball = (lag        , th        )       => at(th)(clamp(lag * SWAY, -TRAVEL, TRAVEL), PH + BR);

  // The camera is fitted to the plinth and the hook at both ends of its widest turn.
  const C = Cam(45, 0.5, S);
  const ext         = [[-PR, 0, 0], [PR, 0, 0], [0, -PR, 0], [0, PR, 0]];
  for (const th of [-TMAX, -TMAX / 2, 0, TMAX / 2, TMAX]) for (const p of LINE) { const q = at(th)(p[0], p[1]); ext.push([q[0], q[1], q[2] + T], [q[0], q[1], q[2] - T]); }
  fit(C, ext, 200, 166);
  C.ox += 200 - proj(C)(0, 0, 0)[0];   // the stem stands on the frame's middle, however unevenly the turns reach
  const P = proj(C), front = facing(C), rho = T * S;
  const g = mk("g", {}, svg);

  // Back to front: the plinth, the ball lying on it, the hook over it.
  put(solid(g), prism(P, front, circ(PR, 72), circ(PR - B, 72), 0, PH));
  const dot = solid(g);
  const disc = circ(BR * S, 40), shine = circ(BR * S * 0.62, 40).slice(23, 31);
  const bar = mk("path", { class: "sil" }, g);
  const gleam = mk("path", { class: "nf lo" }, g);

  /** The rest turn: off square, the other way from where it opens, and always inside the slider's reach. */
  const rest = () => -Math.min(REST, 0.9 * max);
  const sp = spring(rest()), roll = spring(rest(), { k: 36, c: 7 });
  let dH = NaN, dB = NaN;
  function draw() {
    if (sp.x !== dH) {
      dH = sp.x;
      const w = at(sp.x);
      const Q = LINE.map((p) => P(...w(p[0], p[1])));
      bar.setAttribute("d", tube(Q, rho));
      gleam.setAttribute("d", open(Q.slice(ARC[0], ARC[1]).map((c, i) => lean(Q, ARC[0] + i, GLEAM * rho))));
    }
    const lag = sp.x - roll.x;
    if (lag !== dB) {
      dB = lag;
      const c = P(...ball(lag, roll.x));
      put(dot, { sil: poly(disc.map((q) => [c[0] + q.u, c[1] + q.v])), crease: open(shine.map((q)       => [c[0] + q.u, c[1] + q.v])) });
    }
  }

  const loop = register(stage, (dt) => {
    roll.t = sp.x;   // the ball rolls after where the hook is, not where it is going
    const a = stepS(sp, dt), b = stepS(roll, dt);
    draw();
    return a || b;
  });
  bag.add(loop.unregister);

  const cx = P(0, 0, 0)[0];
  let px = cx;
  function retarget() {
    sp.t = over ? max * clamp((px - cx) / REACH, -1, 1) : rest();   // read from the target, never the turn on screen
    read.textContent = over ? `turn ${Math.abs(Math.round(sp.t))}° · 0` : "rest";
    dot.sil.classList.toggle("hi", !over);
    bar.classList.toggle("hi", over);
    loop.wake();
  }
  retarget();

  bag.add(pointer(stage, {
    move: (p) => { over = true; px = p[0]; retarget(); },
    leave: () => { over = false; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { max = v; retarget(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/rail":function(__require,module){
const {Cam,clamp,facing,fillet,fit,hull,open,poly,prism,proj,rad,rings}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Rail: a garment rail on two uprights, with seven bare hangers. The pointer
 * brushes the hangers: each rocks on its hook away from it, the nearest most,
 * and settles. At rest they hang at uneven angles and one is bright. The
 * slider is how many hangers the brush reaches.
 *
 * The pattern: a field, as Terrain's. One spring per hanger on its rock, the
 * target falling off with its distance, in hangers, from the one picked. The
 * pick is the hanger whose rest centre is nearest the pointer's screen x. The
 * springs are softer than the default because a hanger is a pendulum.
 */

const L = 132, TOP = 92, POST = 4.4, FOOT = 34, BAR = 2;  // rail length, its height, upright side, foot depth, rail radius
const N = 7, X0 = 21, DX = 15, TH = 1.8, ROCK = 22;       // hangers, the first one's x, their pitch, thickness, furthest rock in degrees
const REST = [4, -7, 2, 13, -3, 6, -9], MARK = 3, S = 1.9;
/** A hanger in its own plane: s along its shoulders, d down from the rail's centre. */
const BODY = /* @__PURE__ */ fillet([[0, 9], [25, 21], [25, 25], [-25, 25], [-25, 21]], [4, 2, 2, 2, 2], 5);
const HOLE = /* @__PURE__ */ fillet([[0, 14], [15, 21.5], [-15, 21.5]], [2, 1.2, 1.2], 4);
/** Its hook: the stem, then up the rail's near side and over; the tip that drops behind the rail is hidden, so not drawn. */
const HOOK         = /* @__PURE__ */ (() => [[0, 9], [0, 5], ...Array.from({ length: 10 }, (_, k)       => { const t = rad(120 - k * 20); return [Math.sin(t) * 3.4, -Math.cos(t) * 3.4]; })])();

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, S);
  const ext         = [[0, -FOOT / 2, 0], [L, -FOOT / 2, 0], [0, FOOT / 2, 0], [L, FOOT / 2, 0], [0, 0, TOP + 6], [L, 0, TOP + 6], [0, -30, TOP - 30], [L, 30, TOP - 30]];
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const block = (x0        , y0        , x1        , y1        , r        , z0        , z1        ) => { const [o, i] = rings(x0, y0, x1, y1, r, 0.7); put(solid(g), prism(P, front, o, i, z0, z1)); };

  // Back to front: the far foot and upright, the hangers from the far end, the rail, their hooks, the near foot and upright.
  // The hangers go under the rail: all of one the rail crosses on screen is its far shoulder, which is behind it.
  block(-POST / 2 - 1, -FOOT / 2, POST / 2 + 1, FOOT / 2, 2.2, 0, 3);
  block(-POST / 2, -POST / 2, POST / 2, POST / 2, 1.4, 3, TOP + 4);
  const bodies = Array.from({ length: N }, () => solid(g));
  block(0, -BAR, L, BAR, BAR, TOP - BAR, TOP + BAR);
  const hooks = bodies.map(() => mk("path", { class: "nf" }, g));
  block(L - POST / 2 - 1, -FOOT / 2, L + POST / 2 + 1, FOOT / 2, 2.2, 0, 3);
  block(L - POST / 2, -POST / 2, L + POST / 2, POST / 2, 1.4, 3, TOP + 4);

  const sp = REST.map((a) => spring(a, { k: 60, c: 6, eps: 0.02 }));
  const drawn = REST.map(() => NaN);
  function draw() {
    sp.forEach((s, i) => {
      if (s.x === drawn[i]) return;
      drawn[i] = s.x;
      const c = Math.cos(rad(s.x)), n = Math.sin(rad(s.x)), x = X0 + i * DX;
      // a point of the hanger's plane, rocked about the rail
      const at = (p      , dx        ) => P(x + dx, p[0] * c + p[1] * n, TOP - (p[1] * c - p[0] * n));
      put(bodies[i], { sil: poly(hull(BODY.map((p) => at(p, 0)).concat(BODY.map((p) => at(p, TH))))), crease: poly(HOLE.map((p) => at(p, TH))) });
      hooks[i].setAttribute("d", open(HOOK.map((p) => at(p, TH / 2))));
    });
  }

  const loop = register(stage, (dt) => { let m = false; for (const s of sp) m = stepS(s, dt) || m; draw(); return m; });
  bag.add(loop.unregister);

  // Each hanger's rest centre on screen: what the pointer's x is read against.
  const cx = REST.map((_, i) => P(X0 + i * DX, 0, TOP - 17)[0]);
  let reach = value, picked = -2, side = 1;
  function choose(a        ) {
    picked = a;
    sp.forEach((s, i) => {
      const f = a < 0 ? 0 : clamp(1 - Math.abs(i - a) / (reach + 0.5), 0, 1);
      s.t = REST[i] - ROCK * f * f * (i === a ? side : Math.sign(i - a));   // a lower rock swings the bottom right: away from a pointer on the left
    });
    bodies.forEach((b, i) => b.sil.classList.toggle("hi", i === (a < 0 ? MARK : a)));
    read.textContent = a < 0 ? "rest" : `hanger ${a + 1} · 0`;
    loop.wake();
  }
  choose(-1);
  draw();

  bag.add(pointer(stage, {
    move: (p) => {
      const a = cx.reduce((best, x, i) => (Math.abs(p[0] - x) < Math.abs(p[0] - cx[best]) ? i : best), 0);
      side = p[0] < cx[a] ? 1 : -1;
      choose(a);
    },
    leave: () => choose(-1),
  }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { reach = v; choose(picked < 0 ? -1 : picked); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/rebuild":function(__require,module){
const {Cam,facing,fit,hull,lerp,poly,proj,ringAt,rrect,seg,unproj}=__require("core/iso");
const {EASE_LIFT,reducedMotion,tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {inset,slab}=__require("slab");

/**
 * Rebuild: a monorepo as a tree of package tiles on a rounded plinth, a thick
 * root at the back, two packages under it, five more under those, joined by
 * dashed links on the floor. The tile under the pointer rises, and every
 * package that depends on it (its subtree) rises after it, hop by hop along
 * the links, each a little less; a pulse of ink runs down each link just ahead
 * of the tile it feeds. The rest stay down. Letting go is slower and softer than the
 * rise, deepest tile first. The touched tile takes the bright edge as the
 * last one lets it go (the stage's stroke transition is the cross-fade); at
 * rest that is the root. The slider is the rise, in world units.
 *
 * The pattern: discrete items. Tweens, a stagger by hop (forward on the rise,
 * reversed on the return), and a hit test on the target pose of each tile, so
 * a tile rising under the pointer cannot flip it.
 */
const T = 3, TH = 5, HALF = 12, HUBH = 18, FALL = 0.7, REACH = 24;
// ms: a hop of the rise, a hop of the return (deepest first), the two durations, the pulse, the mark's hand-over
const HOP = 125, RHOP = 90, UP = 700, DOWN = 1350, PULSE = 420, LATE = 70;
const TAIL = 0.45, GRACE = 400;
// Depth runs down the screen (x + y), spread across it (x - y); parents sit between their children.
                                                                                    
                                                                
             
                                             
                                                                                                              
                                                                         
  
/** The tree's shape; each mount draws its own copy, so two of the figure on a page never share a tile. */
const TREE                                                   = [
  { p: -1, l: 0, d: 0, s: -9 },
  { p: 0, l: 1, d: 60, s: -54 }, { p: 0, l: 1, d: 60, s: 36 },
  { p: 1, l: 2, d: 120, s: -72 }, { p: 1, l: 2, d: 120, s: -36 },
  { p: 2, l: 2, d: 120, s: 0 }, { p: 2, l: 2, d: 120, s: 36 }, { p: 2, l: 2, d: 120, s: 72 },
];
/** Hops from a to b along the links. */
const dist = (a        , b        ) => {
  const up = (i        ) => { const c           = []; for (; i >= 0; i = TREE[i].p) c.push(i); return c; };
  const ca = up(a), cb = up(b), m = ca.find((i) => cb.includes(i)) ;
  return ca.indexOf(m) + cb.indexOf(m);
};
const under = (a        , b        ) => { for (let i = b; i >= 0; i = TREE[i].p) if (i === a) return true; return false; };

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let rise = value, act = -1, grace                = null;
  const NODES = TREE.map((t) => ({ ...t })        );
  const half = (n      ) => (n.l ? HALF : HUBH), thick = (n      ) => (n.l ? T : TH), round = (n      ) => (n.l ? 4.6 : 7);
  NODES.forEach((n, i) => { n.i = i; n.x = n.d + n.s; n.y = n.d - n.s; n.h = half(n); n.tw = tween(0); n.drawn = NaN; n.want = !n.i; n.at = undefined; });

  const C = Cam(45, 0.5, 1.5);
  const ext         = [];
  for (const n of NODES) ext.push([n.x - n.h, n.y - n.h, 0], [n.x + n.h, n.y + n.h, 0], [n.x, n.y, 20 + TH]);
  fit(C, ext, 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);

  // Links and footprints lie on the floor, so they go down before any tile.
  const links         = [];
  for (const n of NODES) {
    if (n.p < 0) continue;
    const q = NODES[n.p], dx = n.x - q.x, dy = n.y - q.y, L = Math.hypot(dx, dy);
    // a straight run on the floor from one slab's edge to the other's, along the line between their centres
    const cut = (h        ) => h / Math.max(Math.abs(dx), Math.abs(dy)) * L + 2.5;
    const a = cut(q.h) / L, e = 1 - cut(n.h) / L;
    // short real dashes along the run, in screen space
    const A = P(q.x + dx * a, q.y + dy * a, 0), Z = P(q.x + dx * e, q.y + dy * e, 0);
    const k = Math.max(2, Math.round(Math.hypot(Z[0] - A[0], Z[1] - A[1]) / 9));
    const lk       = { n, pt: tween(0, PULSE), on: false, dashes: [] }; links.push(lk);
    for (let j = 0; j < k; j++) lk.dashes.push({ u: (j + 0.35) / k, d: seg([lerp(A[0], Z[0], (j + 0.1) / k), lerp(A[1], Z[1], (j + 0.1) / k)], [lerp(A[0], Z[0], (j + 0.6) / k), lerp(A[1], Z[1], (j + 0.6) / k)]), full: seg([lerp(A[0], Z[0], j / k), lerp(A[1], Z[1], j / k)], [lerp(A[0], Z[0], (j + 1) / k), lerp(A[1], Z[1], (j + 1) / k)]), lit: 0 }        );
  }
  // each dash is its own path, so the pulse can take them one by one (the stage eases the ink)
  for (const L of links) for (const e of L.dashes) e.el = mk("path", { d: e.d, class: "nf" }, g);
  for (const n of NODES) {
    const r = rrect(n.x - n.h, n.y - n.h, n.x + n.h, n.y + n.h, round(n), 8);
    n.ring = r;
    mk("path", { d: poly(ringAt(P, r, 0)), class: "nf lo" }, g);
  }
  // Back to front by x + y of the centre.
  const order = NODES.slice().sort((a, b) => a.x + a.y - (b.x + b.y));
  for (const n of order) {
    const r = rrect(n.x - n.h, n.y - n.h, n.x + n.h, n.y + n.h, round(n), 8);
    n.ring = r; n.inner = inset(C, r, n.l ? 1.1 : 1.3); n.el = solid(g);
    // the root carries a recessed square in its lid
    if (!n.l) {
      n.rec = inset(C, r, 2.8); n.recEl = mk("path", { class: "nf lo" }, n.el.g);
    }
  }
  const draw = (n      , h        ) => {
    put(n.el, slab(P, front, n.ring, n.inner, h, h + thick(n)));
    if (n.rec) n.recEl .setAttribute("d", poly(ringAt(P, n.rec, h + thick(n))));
  };

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const n of NODES) {
      const h = tval(n.tw, now);
      if (!tdone(n.tw, now)) moving = true;
      if (h !== n.drawn) { n.drawn = h; draw(n, h); }
    }
    // on open floor the last tile is held a moment before it lets go
    if (grace !== null) { if (now >= grace) { grace = null; set(-1); } else moving = true; }
    // the bright mark changes hands a beat after the old one lets go
    for (const n of NODES) {
      if (n.at === undefined) continue;
      if (now >= n.at) { n.el.sil.classList.toggle("hi", n.want); n.at = undefined; } else moving = true;
    }
    for (const L of links) {
      if (!L.on) continue;
      const fin = tdone(L.pt, now);
      moving = true;
      // the head travels the run, mostly steadily, the tail of lit dashes behind it
      const s = tval(L.pt, now);
      let lo = 0, hi = 1;
      for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (EASE_LIFT(m) < s) lo = m; else hi = m; }
      const hd = fin ? 9 : lerp(lo, s, 0.3) * (1 + TAIL);
      for (const e of L.dashes) {
        // under the head a dash closes up into a solid run; behind it, it stays inked and lets go
        const x = hd - e.u, lit = x < 0 || x >= TAIL ? 0 : x < TAIL * 0.4 ? 2 : 1;
        if (lit !== e.lit) { e.lit = lit; e.el.classList.toggle("sil", lit > 0); e.el.setAttribute("d", lit === 2 ? e.full : e.d); }
      }
      if (fin) { L.on = false; L.pt.from = L.pt.to = 0; L.pt.t0 = -1e9; }
    }
    return moving;
  });
  bag.add(B.unregister);

  /** The rise tile n takes when a is touched: it falls off a little with each hop down the links. */
  const target = (a        , n      ) => (a >= 0 && under(a, n.i) ? rise * FALL ** dist(a, n.i) : 0);

  const within = (q      , pg        ) => {
    const s = pg.map((a, i) => { const b = pg[(i + 1) % pg.length]; return (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]); });
    return s.every((v) => v >= 0) || s.every((v) => v <= 0);
  };
  /** The tile under the point on its target pose, the nearest in front first; else keep, near the tree, or -1 away from it. */
  function hit(p      )         {
    for (let k = order.length - 1; k >= 0; k--) {
      const n = order[k], z = target(act, n);
      if (within(p, hull(ringAt(P, n.ring, 0).concat(ringAt(P, n.ring, z + thick(n)))))) return n.i;
    }
    const [x, y] = unproj(C, p[0], p[1], 0);
    return NODES.some((n) => Math.hypot(x - n.x, y - n.y) < n.h + REACH - HALF) ? act : -1;
  }

  const name = (a        ) => (a < 0 ? "rest" : a === 0 ? "root" : `pkg ${NODES[a].l}·${NODES.filter((n) => n.l === NODES[a].l && n.i <= a).length}`);
  /** Moves tile n to y after delay: a rise keeps the arrival's life, a fall is slower. */
  const go = (n      , y        , now        , delay        ) => {
    if (n.tw.to === y) return;
    const up = y > n.tw.to;
    tset(n.tw, y, now, delay);
    n.tw.dur = up ? UP : DOWN;
  };
  /** Touches a (-1 lets go): tiles that rise follow the hops from a; tiles that fall go deepest first from the one left. */
  function set(a        ) {
    if (a === act) return;
    const now = __hairClock.now, o = act, now_t = NODES.map((n) => target(a, n));
    act = a;
    let deep = 0;
    NODES.forEach((n, i) => { if (now_t[i] < n.tw.to && o >= 0) deep = Math.max(deep, dist(o, n.i)); });
    NODES.forEach((n, i) => go(n, now_t[i], now, now_t[i] < n.tw.to ? (deep - dist(o, n.i)) * RHOP : a >= 0 ? dist(a, n.i) * HOP : 0));
    for (const L of links) {
      L.pt.from = L.pt.to = 0; L.pt.t0 = -1e9; L.on = false; for (const e of L.dashes) { e.lit = 0; e.el.classList.remove("sil"); e.el.setAttribute("d", e.d); }
      if (a >= 0 && under(a, L.n.i) && L.n.i !== a) { L.on = true; tset(L.pt, 1, now, dist(a, L.n.p) * HOP + 20); }
    }
    for (const n of NODES) {
      const on = n.i === (a < 0 ? 0 : a);
      if (on !== n.want) { n.want = on; n.at = on ? now + LATE : now; }
    }
    read.textContent = name(a);
    B.wake();
  }
  NODES[0].el.sil.classList.add("hi");
  read.textContent = "rest";
  for (const n of NODES) draw(n, 0);

  bag.add(pointer(stage, {
    move: (p) => {
      const h = hit(p);
      if (h < 0 && act >= 0 && !reducedMotion()) { if (grace === null) { grace = __hairClock.now + GRACE; B.wake(); } return; }
      grace = null; set(h);
    },
    leave: () => { grace = null; set(-1); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { rise = v; const now = __hairClock.now; for (const n of NODES) { if (n.tw.to !== target(act, n)) { tset(n.tw, target(act, n), now, 0); n.tw.dur = UP; } } B.wake(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/relay":function(__require,module){
const {Cam,facing,fit,lerp,poly,proj,ringAt,rrect,seg}=__require("core/iso");
const {tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {inset,slab}=__require("slab");

/**
 * Relay: a hub plate and four branches of thin tiles on a floor, joined by
 * dashed links. The pointer picks the nearest leaf; the path from the hub to it
 * lights hop by hop: each link turns solid as a line that grows along it, and
 * each tile on the path rises a little, a short delay per hop. The leaf takes
 * the bright edge, which cross-fades from one leaf to the next (and to the hub's
 * rim at rest). Moving to another leaf lowers the old path leaf to hub, slower
 * than it rose, then lights the new one. The slider is the delay per hop, in ms.
 *
 * The pattern: discrete items. Tweens, a stagger by hop count, and a hit test
 * on the leaves' resting positions, so a tile that has risen cannot flip the choice.
 */

const T = 3, HT = 7, RISE = 9, TS = 9, HS = 17;
// Each branch leaves the hub along an axis: its first tile at `a`, its second at `b`, then leaves
// beside the second, to either side. Tiles are [along, across] on that axis; the parent is the one before it.
const BRANCHES = [
  { d: [-1, 0], a: 50, b: 84, side: [-1, 1] },
  { d: [0, -1], a: 50, b: 76, side: [1] },
  { d: [1, 0], a: 50, b: 84, side: [-1, 1] },
  { d: [0, 1], a: 50, b: 76, side: [-1] },
];
const FORK = 31;

             
                                                  
                                                                                                            
                                     
  

/** The tiles of the tree: world centre, parent index (-1 is the hub), depth, and its leaf's read-out. */
function tree()         {
  const nodes         = [];
  BRANCHES.forEach((br, k) => {
    const at = (s        , o        )       => [br.d[0] * s - br.d[1] * o, br.d[1] * s + br.d[0] * o];
    const i = nodes.length;
    nodes.push({ c: at(br.a, 0), par: -1, dep: 1 }        );
    nodes.push({ c: at(br.b, 0), par: i, dep: 2 }        );
    br.side.forEach((s, j) => nodes.push({ c: at(br.b, s * FORK), par: i + 1, dep: 3, tag: "leaf " + (k + 1) + "·" + (j + 1) }        ));
  });
  return nodes;
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let step = value;
  const nodes = tree(), leaves = nodes.filter((n) => n.tag);

  const C = Cam(45, 0.5, 1.9);
  const pts         = [[-HS, -HS, 0], [HS, HS, 0], [-HS, HS, 0], [HS, -HS, 0]];
  for (const n of nodes) for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pts.push([n.c[0] + sx * TS, n.c[1] + sy * TS, T + RISE]);
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);

  // Links, painted before the plates they join: a dashed run, and over it the solid line that grows.
  for (const n of nodes) {
    const from = n.par < 0 ? [0, 0] : nodes[n.par].c;
    const dx = n.c[0] - from[0], dy = n.c[1] - from[1], len = Math.hypot(dx, dy), o0 = n.par < 0 ? HS : 0, o1 = 0;
    n.a = P(from[0] + (dx / len) * o0, from[1] + (dy / len) * o0, 0); n.b = P(n.c[0] - (dx / len) * o1, n.c[1] - (dy / len) * o1, 0);
    let dd = "";
    const L = Math.hypot(n.b[0] - n.a[0], n.b[1] - n.a[1]), k = Math.max(2, Math.round(L / 9));
    for (let j = 0; j < k; j++) dd += seg([lerp(n.a[0], n.b[0], (j + 0.1) / k), lerp(n.a[1], n.b[1], (j + 0.1) / k)], [lerp(n.a[0], n.b[0], (j + 0.6) / k), lerp(n.a[1], n.b[1], (j + 0.6) / k)]);
    mk("path", { d: dd, class: "nf" }, g);
  }
  for (const n of nodes) {
    n.link = mk("path", { class: "nf sil" }, g);
    n.l = tween(0); n.z = tween(0); n.h = tween(0); n.ld = NaN; n.zd = NaN; n.hd = false;
  }

  // The hub: a thick plate with a recessed square set in its top.
  const hub = solid(g);
  const hr = rrect(-HS, -HS, HS, HS, 7, 8);
  put(hub, slab(P, front, hr, inset(C, hr, 1.3), 0, HT));
  const rim = mk("path", { d: poly(ringAt(P, inset(C, hr, 2.8), HT)), class: "nf hi" }, g);
  const rimW = tween(1); let rimD = true;
  mk("path", { d: poly(ringAt(P, inset(C, hr, 3.8), HT)), class: "nf lo" }, g);

  // The tiles, back to front by x + y.
  for (const n of nodes.slice().sort((p, q) => p.c[0] + p.c[1] - q.c[0] - q.c[1])) {
    n.ring = rrect(n.c[0] - TS, n.c[1] - TS, n.c[0] + TS, n.c[1] + TS, 3.6, 8);
    n.inner = inset(C, n.ring, 1);
    n.el = solid(g);
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const n of nodes) {
      const l = tval(n.l, now), z = tval(n.z, now);
      if (l !== n.ld) {
        n.ld = l;
        n.link.setAttribute("d", l > 0.002 ? seg(n.a, [lerp(n.a[0], n.b[0], l), lerp(n.a[1], n.b[1], l)]) : "");
      }
      if (z !== n.zd) {
        n.zd = z;
        put(n.el, slab(P, front, n.ring, n.inner, z * RISE, z * RISE + T));
      }
      // The bright edge is a class on the silhouette; the kernel eases the stroke between the two (260ms),
      // so the hand-off is a cross-fade. Its weight tween only says when to flip.
      if (n.tag) { const h = tval(n.h, now) > 0.5; if (h !== n.hd) { n.hd = h; n.el.sil.classList.toggle("hi", h); } }
      if (!tdone(n.l, now) || !tdone(n.z, now) || !tdone(n.h, now)) moving = true;
    }
    const rw = tval(rimW, now) > 0.5;
    if (rw !== rimD) { rimD = rw; rim.classList.toggle("hi", rw); }
    if (!tdone(rimW, now)) moving = true;
    return moving;
  });
  bag.add(B.unregister);

  // Hit test on the leaves' rest positions, in screen space: they never move. It is sticky: the leaf
  // in hand is kept until another is clearly nearer, so a pointer passing by does not flash it.
  const spot = leaves.map((n) => P(n.c[0], n.c[1], T));
  const CAP = 78, STICK = 18;
  const dist = (i        , [x, y]      ) => Math.hypot(spot[i][0] - x, spot[i][1] - y);
  function hit(p      ) {
    let best = -1, bd = CAP;
    spot.forEach((_, i) => { const d = dist(i, p); if (d < bd) { bd = d; best = i; } });
    if (act >= 0 && best !== act && dist(act, p) < CAP && dist(act, p) - bd < STICK) return act;
    return best;
  }

  // Tweens with their own length: what rises is quick, what falls back is longer and softer.
  const UP = 700, DOWN = 1500;
  const go = (tw       , to        , now        , delay        , dur        ) => { if (tw.to === to) return; tset(tw, to, now, delay); tw.dur = dur; };
  const lit = new Set      (), parentOf = (n      )              => (n.par < 0 ? null : nodes[n.par]);
  let act = -1;
  /** Lights the path to leaf a (-1: none). What leaves the path goes first, leaf to hub, slower than it rose; what joins it follows, hub to leaf. */
  function setActive(a        ) {
    if (a === act) return;
    const now = __hairClock.now, want = new Set      (), out = step * 1.5;
    for (let n              = a < 0 ? null : leaves[a]; n; n = parentOf(n)) want.add(n);
    const off = [...lit].filter((n) => !want.has(n)), top = off.reduce((m, n) => Math.max(m, n.dep), 0);
    const wait = off.length ? (off.length - 1) * out * 0.65 + step * 0.5 : 0;
    for (const n of nodes) {
      const on = want.has(n), was = lit.has(n);
      if (on === was) continue;
      if (on) { go(n.l, 1, now, wait + (n.dep - 1) * step, UP); go(n.z, 1, now, wait + n.dep * step, UP); }
      else { go(n.z, 0, now, (top - n.dep) * out, DOWN); go(n.l, 0, now, (top - n.dep) * out + out * 0.5, DOWN); }
      if (n.tag) {
        // the bright edge hands over: the old leaf lets go just as the new one takes hold
        if (on) go(n.h, 1, now, wait + n.dep * step, 40);
        else go(n.h, 0, now, a < 0 ? 0 : Math.max(0, wait + 3 * step - 60), 40);
      }
    }
    lit.clear(); want.forEach((n) => lit.add(n));
    go(rimW, a < 0 ? 1 : 0, now, a < 0 ? (off.length - 1) * out * 0.5 + 120 : 0, 40);
    act = a;
    read.textContent = a < 0 ? "rest" : leaves[a].tag ;
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { step = v; }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/riffle-geometry":function(__require,module){
const {Cam,facing,fillet,fit,hull,open,poly,proj,rad,ringAt,rrect,run,seg}=__require("core/iso");

/**
 * Riffle's drawing, with no DOM: the camera, the tray and a card in any pose,
 * as path strings. The engine (riffle.ts) writes these into its svg on every
 * frame.
 */

const N = 8, W = 84, H = 54, G = 13, TW = 22, TH = 7, TABS = [6, 31, 56], TK = 1.4;
const REST = -12, BACK = -24, FWD = 20, LIFT = 16;
const X0 = -5, X1 = W + 5, Y0 = -9, Y1 = (N - 1) * G + 9, WH = 20, WR = 6, WT = 2.4;

/** The camera, fitted to the tray with a card lifted, so nothing leaves the frame in any pose. */
function camera()         {
  const C = Cam(45, 0.5, 1.62);
  fit(C, [[X0, Y0, 0], [X1, Y1, -8], [X1, Y0, 0], [X0, Y1, 0], [X0, Y0, H + TH], [X1, Y0, H + TH + LIFT]], 200, 166);
  return C;
}

/** The tray's outline and the rim's inner edge. */
const trayRings = ()                               => ({
  outer: rrect(X0, Y0, X1, Y1, WR, 6),
  inner: rrect(X0 + WT, Y0 + WT, X1 - WT, Y1 - WT, WR - WT, 6),
});

/** A run of points ordered left to right on screen. */
const LR = (pts        ) => (pts[0][0] <= pts[pts.length - 1][0] ? pts : pts.slice().reverse());

/**
 * The tray's paths, which never move. `far` is painted before the cards, `near`
 * after them; each entry is [d, class].
 */
function tray(P           , front                        , outer      , inner      ) {
  // far half: body, the rim's inner edge, and the floor seam along the far walls
  const far                     = [
    [poly(hull(ringAt(P, outer, 0).concat(ringAt(P, outer, WH)))), "sil"],
    [poly(ringAt(P, inner, WH)), "nf"],
    [open(ringAt(P, run(inner, (q) => !front(q)), 2.5)), "nf lo"],
  ];
  // near half: one opaque piece from the rim's inner edge down to the floor
  const iF = LR(ringAt(P, run(inner, front), WH)), oT = LR(ringAt(P, run(outer, front), WH)), oB = LR(ringAt(P, run(outer, front), 0));
  // a finger pull, set into the front
  const hx = (X0 + X1) / 2, onFront = (ring      ) => ring.map((q) => P(q.u, Y1, q.v));
  const near                     = [
    [poly([...iF, oT[oT.length - 1], ...oB.slice().reverse(), oT[0]]), "fo"],
    [open(oT), "nf lo"],
    [open(iF), "nf"],
    [open([oT[0], ...oB, oT[oT.length - 1]]), "nf sil"],
    [poly(onFront(rrect(hx - 11, 6.5, hx + 11, 12.5, 3, 5))), "nf"],
    [poly(onFront(rrect(hx - 9.4, 8, hx + 9.4, 11, 1.5, 5))), "nf lo"],
  ];
  return { far, near };
}

/**
 * Card i, back to front: its number (8 at the back), which of the three tab
 * positions it takes, and its filleted outline, drawn upright in its own plane.
 */
function card(i        ) {
  const n = N - i, t0 = TABS[(N - 1 - i) % 3];
  const shape = fillet(
    [[0, 0], [W, 0], [W, H], [t0 + TW, H], [t0 + TW, H + TH], [t0, H + TH], [t0, H], [0, H]],
    [1, 1, 3.2, 1.8, 2.4, 2.4, 1.8, 3.2],
  );
  return { n, t0, shape };
}

                                                                                                  

/**
 * Card i leaning th degrees (negative leans back) and lifted by `lift`: its
 * back edge, face, heading and rules as paths, and where each of the eight
 * punches of its number sits, in a 4 × 2 grid on the tab.
 */
function pose(P           , i        , t0        , shape                 , th        , lift        )           {
  const yb = i * G, s = Math.sin(rad(th)), c = Math.cos(rad(th));
  const w = (u        , v        ) => P(u, yb + v * s, v * c + lift);
  const wb = (u        , v        ) => P(u, yb + v * s - TK * c, v * c + TK * s + lift);
  const punch         = [];
  for (let k = 0; k < 8; k++) punch.push(w(t0 + TW / 2 + ((k % 4) - 1.5) * 3.6, H + TH / 2 + (0.5 - Math.floor(k / 4)) * 2.8));
  return {
    back: poly(shape.map((p) => wb(p[0], p[1]))),
    face: poly(shape.map((p) => w(p[0], p[1]))),
    head: seg(w(6, H - 11), w(W - 6, H - 11)),
    rules: [H - 18, H - 25, H - 32, H - 39].map((v) => seg(w(6, v), w(W - 6, v))).join(""),
    punch,
  };
}

/** The fitted camera, its projector and facing test, and the tray's rings: what both the engine and the still start from. */
function scene() {
  const C = camera();
  return { C, P: proj(C), front: facing(C), ...trayRings() };
}

module.exports={W,H,G,TW,TH,TABS,TK,BACK,FWD,LIFT,X1,Y0,Y1,WH,WR,WT,N,REST,X0,camera,trayRings,tray,card,pose,scene};
},
"figures/riffle":function(__require,module){
const {clamp,rad}=__require("core/iso");
const {tdone,tset,tval,tween}=__require("core/motion");
const {BACK,FWD,G,H,LIFT,N,REST,W,card,pose,scene,tray}=__require("figures/riffle-geometry");
const {disposer,mk,place,pointer,reflect,register}=__require("core/stage");

/**
 * Riffle (Fig 9.1) — a rounded tray holding eight cards. The card under the pointer stands up and lifts; the ones in front
 * lean forward and the ones behind lean back, staggered outwards from it on
 * the 700ms lift curve. A discrete figure, so every card runs on tweens.
 *
 * Selection never reads the posed cards: it comes from static oblique bands
 * along the resting top edges, so a card moving out from under the pointer
 * can't flip the choice back and forth. The bands are geometry only; nothing
 * draws them. The stage is a focusable group; the arrow keys walk the cards
 * and the read-out names the one pulled by its number.
 *
 * The drawing itself — camera, tray, a card in any pose — is pure and lives in
 * riffle-geometry.ts; this file is the DOM, the tweens and the input.
 */

             
                                       
                                                                                          
                            
                                   
                     
  

const mount = ({ stage, svg, read }           , value        )               => {
  const bag = disposer();
  let stag = value;

  const { P, front, outer, inner } = scene();
  const paths = tray(P, front, outer, inner);

  const g = mk("g", {}, svg);
  reflect(svg, g, P, front, outer, 0, 14);
  for (const [d, cls] of paths.far) mk("path", { d, class: cls }, g);

  const cards         = [];
  for (let i = 0; i < N; i++) {
    const { n, t0, shape } = card(i);
    const grp = mk("g", {}, g);
    const back = mk("path", { class: "lo" }, grp), face = mk("path", { class: "sil" }, grp);
    const head = mk("path", { class: "nf" }, grp), rules = mk("path", { class: "nf lo" }, grp);
    // the card's number, punched in a 4 × 2 grid on its tab
    const punch                     = [];
    for (let k = 0; k < 8; k++) punch.push(mk("circle", { r: 1.05, class: "dot " + (k === n - 1 ? "m" : "off") }, grp));
    cards.push({ n, t0, shape, back, face, head, rules, punch, a: tween(REST), z: tween(0) });
  }

  for (const [d, cls] of paths.near) mk("path", { d, class: cls }, g);

  // hit bands: oblique strips along the RESTING top edges. They never move.
  const top = (i        ) => P(W / 2, i * G + H * Math.sin(rad(REST)), H * Math.cos(rad(REST)));
  const c0 = top(0), c1 = top(1), d = [c1[0] - c0[0], c1[1] - c0[1]];
  const px0 = P(0, 0, 0), px1 = P(1, 0, 0), ex = [px1[0] - px0[0], px1[1] - px0[1]];
  const HALF = W / 2 + 6, det = d[0] * ex[1] - d[1] * ex[0];

  /** The card whose band holds the point, in the band's own (s, r) coordinates; -1 outside. */
  function hit([x, y]      ) {
    const qx = x - c0[0], qy = y - c0[1];
    const s = (qx * ex[1] - qy * ex[0]) / det, r = (d[0] * qy - d[1] * qx) / det;
    if (Math.abs(r) > HALF || s < -0.5 || s > N + 1) return -1;
    return clamp(Math.round(s), 0, N - 1);
  }

  function draw(i        , th        , lift        ) {
    const cd = cards[i], q = pose(P, i, cd.t0, cd.shape, th, lift);
    cd.back.setAttribute("d", q.back);
    cd.face.setAttribute("d", q.face);
    cd.head.setAttribute("d", q.head);
    cd.rules.setAttribute("d", q.rules);
    cd.punch.forEach((el, k) => place(el, q.punch[k]));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    cards.forEach((cd, i) => { draw(i, tval(cd.a, now), tval(cd.z, now)); if (!tdone(cd.a, now) || !tdone(cd.z, now)) moving = true; });
    return moving;
  });
  bag.add(B.unregister);

  let act = -1;
  const caption = (a        ) => (a < 0 ? "rest" : String(N - a).padStart(2, "0"));
  /** Pulls card a (-1 puts them all back). The stagger spreads out from the card pulled, or the one let go. */
  function setActive(a        ) {
    if (a === act) return;
    const now = __hairClock.now, from = a >= 0 ? a : act;
    act = a;
    cards.forEach((cd, i) => {
      const delay = Math.abs(i - from) * stag;
      const th = a < 0 ? REST : i < a ? BACK : i > a ? FWD : 0;
      tset(cd.a, th, now, delay); tset(cd.z, a === i ? LIFT : 0, now, delay);
      cd.face.classList.toggle("hi", i === a); cd.head.classList.toggle("hi", i === a); cd.punch[cd.n - 1].classList.toggle("m", i !== a);
    });
    read.textContent = caption(a);
    B.wake();
  }

  bag.add(pointer(stage, { move: (p) => setActive(hit(p)), leave: () => setActive(-1) }));
  bag.on(stage, "keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { setActive(act < 0 ? N - 1 : Math.min(N - 1, act + 1)); e.preventDefault(); }
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") { setActive(act < 0 ? N - 1 : Math.max(0, act - 1)); e.preventDefault(); }
    // Escape puts a pulled card back and claims the key; at rest it passes on to the page.
    else if (e.key === "Escape" && act >= 0) { setActive(-1); e.preventDefault(); }
  });
  bag.on(stage, "blur", () => setActive(-1));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { stag = v; },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/router":function(__require,module){
const {Cam,circ,clamp,facing,fit,hull,lerp,open,poly,prism,proj,rad,ringAt,rrect,run,seg}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,flatDot,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Router: a low wifi router with a row of status lights along its front edge
 * and four antennas standing on swivel bosses along its back. Each antenna is a
 * tapered rod that leans in its own upright plane, square to the line of sight,
 * so the four never touch and always paint in the same order. The pointer pulls
 * each one toward itself on its own spring: the nearest reaches all the way
 * for it, the others less the further away they are. At rest they stand as they
 * were left, the last one tilted out and bright. The slider is the spread, in
 * antennas.
 *
 * The pattern: a continuous aim over a row of parts. A spring per antenna, a
 * falloff by distance with a floor, a clamped lean, and a hit test on the
 * antennas' fixed pivots.
 */

const X1 = 124, Y1 = 58, H = 14, T = 3, BR = 13;
const XS = [18, 48, 78, 108], YB = 11, KH = 5, KR = 4.6, L = 56, R0 = 3.3, R1 = 2.1, ELBOW = 0.21;
const STOP = R1 + 1, MAX = 44, REST = [-9, 3, -4, 32], LIT0 = 3;
const D = [Math.SQRT1_2, -Math.SQRT1_2];

/** The share of its reach an antenna takes, u pivots further from the pointer than the nearest one: all of it, down to a floor R pivots on. */
const falloff = (u        , R        ) => clamp(1 - u / R, 0.1, 1);

/** Antenna i's axis, `l` along it, leaning th degrees in its plane (positive leans right on screen). */
const along = (i        , th        , l        )       => {
  const s = Math.sin(rad(th)), c = Math.cos(rad(th));
  return [XS[i] + D[0] * s * l, YB + D[1] * s * l, H + KH - 1 + c * l];
};

                                                                          

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let R = value, over              = null, lit             = null;

  // Fitted to the body and to every antenna at both ends of its lean, so nothing leaves the frame.
  const C = Cam(45, 0.5, 1.78), pts         = [[0, 0, 0], [X1, Y1, 0], [X1, 0, 0], [0, Y1, 0]];
  XS.forEach((_, i) => { for (const th of [-MAX, 0, MAX]) pts.push(along(i, th, L + R1)); });
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C), Pv = (q      ) => P(q[0], q[1], q[2]);
  const o = P(0, 0, 0), dd = P(D[0], D[1], 0), zz = P(0, 0, 1);
  const SH = Math.hypot(dd[0] - o[0], dd[1] - o[1]), SZ = o[1] - zz[1];

  // The body: a low shell, narrower at its top than at its foot, and the status lights along its front.
  const g = mk("g", {}, svg);
  const foot = rrect(0, 0, X1, Y1, BR, 6), top = rrect(T, T, X1 - T, Y1 - T, BR - T, 6);
  const inner = rrect(T + 1.6, T + 1.6, X1 - T - 1.6, Y1 - T - 1.6, BR - T - 1.6, 6);
  put(solid(g), { sil: poly(hull(ringAt(P, foot, 0).concat(ringAt(P, top, H)))), crease: open(ringAt(P, run(inner, front), H)) });
  for (let k = 0; k < 6; k++) {
    const z = H * 0.56, y = Y1 - T * (z / H) + 0.1;
    place(mk("circle", { r: 1.05, class: k === 0 ? "dot m" : "dot off" }, g), P(34 + k * 9, y, z));
  }
  // a vent grille across the front of the lid, in staggered rows
  for (let j = 0; j < 3; j++) for (let k = 0; k < 13 - (j % 2); k++) place(flatDot(g, C, 0.5, "dot off"), P(26 + (j % 2) * 3 + k * 6, 29 + j * 5.5, H));

  // Back to front: each antenna's boss, then the antenna. Every antenna leans in a plane x + y = const, so the order never changes.
  const ants        = XS.map((x, i) => {
    const boss = solid(g);
    const shift = (ring      )       => ring.map((q) => ({ ...q, u: q.u + x, v: q.v + YB }));
    put(boss, prism(P, front, shift(circ(KR, 16)), shift(circ(KR - 1.1, 16)), H, H + KH));
    return { i, el: solid(g), sp: spring(REST[i], { eps: 0.05 }), drawn: NaN, piv: Pv(along(i, 0, 0)) };
  });
  const gap = Math.abs(ants[1].piv[0] - ants[0].piv[0]) / SH;

  /** A disc of screen points about p, r world units across. */
  const disc = (p      , r        )         => Array.from({ length: 20 }, (_, k)       => [p[0] + r * SH * Math.cos((k * Math.PI) / 10), p[1] + r * SH * Math.sin((k * Math.PI) / 10)]);
  function drawAnt(a     ) {
    const th = a.sp.x;
    if (th === a.drawn) return;
    a.drawn = th;
    const b = Pv(along(a.i, th, 0)), t = Pv(along(a.i, th, L)), e = Pv(along(a.i, th, L * ELBOW));
    const len = Math.hypot(t[0] - b[0], t[1] - b[1]), n = [-(t[1] - b[1]) / len, (t[0] - b[0]) / len];
    const w = lerp(R0, R1, ELBOW) * SH - 1.1;
    put(a.el, {
      sil: poly(hull(disc(b, R0).concat(disc(t, R1)))),
      crease: seg([e[0] + n[0] * w, e[1] + n[1] * w], [e[0] - n[0] * w, e[1] - n[1] * w]),
    });
  }
  function light(a     ) {
    if (a === lit) return;
    lit?.el.sil.classList.remove("hi");
    lit = a;
    a.el.sil.classList.add("hi");
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const a of ants) { if (stepS(a.sp, dt)) m = true; drawAnt(a); }
    return m;
  });
  bag.add(B.unregister);

  /**
   * Each antenna aims at the pointer from its fixed pivot, in its own plane. A
   * pointer within reach is raised onto the circle the tip sweeps, so a tip
   * stops just short of it and never passes it: two antennas either side of
   * the pointer meet over it, and never cross.
   */
  function retarget() {
    if (!over) {
      ants.forEach((a, i) => { a.sp.t = REST[i]; });
      light(ants[LIT0]); read.textContent = "rest";
    } else {
      const at = over;
      const dxs = ants.map((a) => (at[0] - a.piv[0]) / SH), d0 = Math.min(...dxs.map(Math.abs));
      const near = ants[dxs.findIndex((d) => Math.abs(d) === d0)];
      ants.forEach((a, i) => {
        const dx = Math.sign(dxs[i]) * Math.max(Math.abs(dxs[i]) - STOP, 0), hz = Math.max((a.piv[1] - at[1]) / SZ, Math.sqrt(Math.max(L * L - dx * dx, 0)), 0);
        const aim = (Math.atan2(dx, hz) * 180) / Math.PI;
        a.sp.t = clamp(aim, -MAX, MAX) * falloff((Math.abs(dxs[i]) - d0) / gap, R);
      });
      light(near);
      read.textContent = `antenna ${near.i + 1} · ${Math.round(Math.abs(near.sp.t))}°`;
    }
    B.wake();
  }
  light(ants[LIT0]);

  bag.add(pointer(stage, {
    move: (p) => { over = p; retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/settle":function(__require,module){
const {Cam,clamp,facing,fit,lerp,poly,proj,rad,ringAt,rrect,seg,unproj}=__require("core/iso");
const {reducedMotion,spring,stepS,tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {inset,slab}=__require("slab");

/**
 * Settle: a hub plate on a faint floor grid and twelve thin tiles lying
 * scattered and crooked around it, no links. The nearer the pointer comes to
 * the hub, the more the map resolves: each tile slides and turns into its
 * place in a pinwheel tree on its own spring, the inner ones first, and a
 * dashed link draws in from the hub once both its ends are seated. Pointer far
 * away: they drift back to the heap. The hub takes the bright stroke. The
 * slider is the reach, in world units: how far from the hub the map starts to
 * resolve.
 *
 * The pattern: a field, read as a count. The pointer sets a distance on the
 * ground plane (which never moves); each tile has its own threshold on it.
 */

const TH = 3.2, HALF = 9, HUB = 17, HUBT = 6.5, GRID = 22, GN = 0, GR = 86;
// [settled x, y, parent (-1 hub), scattered x, y, angle, z]
const T             = [
  [50, 0, -1, 51, -19, 14, 0], [88, 0, 0, 93, 23, -22, 0], [50, 34, 0, 58, 50, 26, 0],
  [0, 50, -1, -21, 59, -16, 0], [0, 88, 3, 20, 84, 28, 0], [-34, 50, 3, -59, 64, -20, 0],
  [-50, 0, -1, -67, -20, -12, 0], [-88, 0, 6, -91, 26, 20, 0], [-50, -34, 6, -47, -57, -28, 0],
  [0, -50, -1, 22, -46, 18, 0], [0, -88, 9, -15, -95, -14, 0], [34, -50, 9, 62, -60, 22, 0],
];

                                                                                                         
             
                                                                                                 
                                                                                                                            
  

/** A rounded square of half-side h about (cx, cy), turned by a degrees: a ring whose samples carry their normals round with it. */
function turned(cx        , cy        , h        , r        , a        )       {
  const c = Math.cos(rad(a)), s = Math.sin(rad(a));
  return rrect(-h, -h, h, h, r, 8).map((q) => ({
    u: cx + q.u * c - q.v * s, v: cy + q.u * s + q.v * c, nu: q.nu * c - q.nv * s, nv: q.nu * s + q.nv * c,
  }));
}

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let reach = value, q = 0;

  const C = Cam(45, 0.5, 1.9);
  const pts         = [[0, 0, HUBT], [GR, 0, 0], [-GR, 0, 0], [0, GR, 0], [0, -GR, 0]];
  for (const t of T) for (const [x, y] of [[t[0], t[1]], [t[3], t[4]]]          ) pts.push([x - 11, y - 11, 0], [x + 11, y + 11, 0], [x + 11, y - 11, 0], [x - 11, y + 11, 0]);
  fit(C, pts, 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  // the floor: a faint grid, lying flat, under everything
  let d = "";
  for (let k = -GN; k <= GN; k++) {
    const e = Math.sqrt(GR * GR - (k * GRID) ** 2);
    d += seg(P(k * GRID, -e, 0), P(k * GRID, e, 0)) + seg(P(-e, k * GRID, 0), P(e, k * GRID, 0));
  }
  if (GN > 0) mk("path", { d, class: "nf lo" }, g);

  // links are guides on the floor: painted before every plate they join
  const links         = T.map((t, i) => {
    const a       = t[2] < 0 ? [0, 0] : [T[t[2]][0], T[t[2]][1]], b       = [t[0], t[1]];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const ha = t[2] < 0 ? HUB : HALF, from       = [a[0] + u[0] * (ha + 2), a[1] + u[1] * (ha + 2)], to       = [b[0] - u[0] * (HALF + 2), b[1] - u[1] * (HALF + 2)];
    return { i, from, to, tw: tween(0), p: parent(i), el: mk("path", { class: "nf" }, g), drawn: NaN };
  });
  function parent(i        ) { return T[i][2]; }

  // the hub: a thick slab with a recessed square set into its lid
  const hub = mk("g", {}, g);
  const hr = rrect(-HUB, -HUB, HUB, HUB, 7, 8);
  const hs = solid(hub);
  put(hs, slab(P, front, hr, inset(C, hr, 1.3), 0, HUBT));
  hs.sil.classList.add("hi");
  mk("path", { d: poly(ringAt(P, inset(C, hr, 2.8), HUBT)), class: "nf lo" }, hub);

  const tiles         = T.map((t, i) => ({
    i, t, el: solid(mk("g", {}, g)),
    // the inner tiles seat first and a little more briskly; the outer ones follow, out of step
    th: [0.05, 0.3, 0.4][i % 3],
    sp: spring(0, { k: i % 3 === 0 ? 120 : 90 - (i % 3) * 8, c: i % 3 === 0 ? 14 : 12, eps: 0.002 }),
    key: "", ord: 0, k: 0,
    // arrival and return keep their own springs: the return is softer, near-critical, no bounce
    rise: { k: i % 3 === 0 ? 120 : 90 - (i % 3) * 8, c: i % 3 === 0 ? 14 : 12 },
    fall: { k: [38, 44, 50][i % 3], c: 2 * Math.sqrt([38, 44, 50][i % 3]) },
    // outermost let go first: the leaves, then the middles, then the stems
    lag: [0.3, 0.2, 0.12][i % 3] * 1000,
    want: 0, wait: 0, falling: false,
  }));

    function pose(tl      ) {
    const s = tl.sp.x, [sx, sy, , x0, y0, a0, z0] = tl.t;
    const w = clamp(s, 0, 1), hop = 6.5 * w * (1 - w) * 4 / 4;
    const x = lerp(x0, sx, s), y = lerp(y0, sy, s), a = lerp(a0, 0, s), z = Math.max(0, lerp(z0, 0, w) + hop);
    return { x, y, a, z };
  }
  function drawTile(tl      ) {
    const p = pose(tl), key = [p.x, p.y, p.a, p.z].map((v) => v.toFixed(2)).join();
    tl.k = p.x + p.y + 6 * p.z;
    if (key === tl.key) return;
    tl.key = key;
    const r = turned(p.x, p.y, HALF, 3.6, p.a);
    put(tl.el, slab(P, front, r, inset(C, r, 1), p.z, p.z + TH));
  }

  let order = "";
  function paintOrder() {
    const list = tiles.slice().sort((a, b) => a.k - b.k);
    const hubAt = list.findIndex((t) => t.k > 0), arr = list.slice();
    // the hub sits at x + y = 0; tiles are painted around it
    const seq                                = hubAt < 0 ? arr.map((t) => t.el.g).concat(hub) : arr.slice(0, hubAt).map((t) => t.el.g).concat(hub, arr.slice(hubAt).map((t) => t.el.g));
    const id = seq.map((e) => (e === hub ? "h" : tiles.findIndex((t) => t.el.g === e))).join();
    if (id === order) return;
    order = id;
    for (const e of seq) g.appendChild(e);
  }

  function drawLink(l      , now        ) {
    const A = l.p < 0 ? null : tiles[l.p], B2 = tiles[l.i];
    const a = A ? A.sp.x : 1, b = B2.sp.x;
    // it draws in only once both ends are seated, and draws back out as soon as either is asked to leave
    const want = Math.min(a, b) > 0.96 && B2.want >= 1 && (!A || A.want >= 1) ? 1 : 0;
    if (l.tw.to !== want) { tset(l.tw, want, now, 0); l.tw.dur = want ? 700 : 900; }
    const u = tval(l.tw, now);
    if (u === l.drawn) return;
    l.drawn = u;
    // real dashes along the link in screen space, as many as the draw-in has reached
    const pa = P(l.from[0], l.from[1], 0), pb = P(l.to[0], l.to[1], 0), k = Math.max(2, Math.round(Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) / 9));
    let dd = "";
    for (let j = 0; j < k; j++) {
      const f0 = (j + 0.1) / k, f1 = Math.min((j + 0.6) / k, u);
      if (f1 > f0) dd += seg([lerp(pa[0], pb[0], f0), lerp(pa[1], pb[1], f0)], [lerp(pa[0], pb[0], f1), lerp(pa[1], pb[1], f1)]);
    }
    l.el.setAttribute("d", dd);
  }

  const B = register(stage, (dt, now) => {
    let m = false;
    for (const tl of tiles) {
      if (tl.wait > 0) { tl.wait -= dt * 1000; m = true; if (tl.wait <= 0) tl.sp.t = tl.want; }
      if (stepS(tl.sp, dt)) m = true;
      drawTile(tl);
    }
    for (const l of links) { drawLink(l, now); if (!tdone(l.tw, now)) m = true; }
    paintOrder();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    let n = 0;
    for (const tl of tiles) {
      const s = clamp((q - tl.th) / 0.22, 0, 1);
      if (s > tl.want) {
        tl.falling = false; tl.wait = 0; tl.want = s; Object.assign(tl.sp, tl.rise); tl.sp.t = s;
      } else if (s < tl.want) {
        if (!tl.falling) { tl.falling = true; tl.wait = reducedMotion() ? 0 : tl.lag; Object.assign(tl.sp, tl.fall); }
        tl.want = s;
        if (tl.wait <= 0) tl.sp.t = s;
      }
      if (s > 0.5) n++;
    }
    read.textContent = q <= 0 ? "rest" : `map ${n}·${tiles.length}`;
    B.wake();
  }

  /** How resolved the map is, 0 at the reach and beyond, 1 at the hub. */
  const resolve = (dd        ) => { const u = clamp((reach - dd) / (reach - 18), 0, 1); return u * u * (3 - 2 * u); };
  bag.add(pointer(stage, {
    move: (p) => { const [x, y] = unproj(C, p[0], p[1], 0); q = resolve(Math.hypot(x, y)); retarget(); },
    leave: () => { q = 0; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());
  for (const tl of tiles) drawTile(tl);
  paintOrder();
  read.textContent = "rest";

  return { set: (v) => { reach = v; }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/sieve":function(__require,module){
const {Cam,circ,fit,hull,open,poly,proj,unproj}=__require("core/iso");
const {tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {TABLE}=__require("intensity");

/**
 * Sieve: three test sieves stacked over a pan, standing a little apart. The
 * pointer's height picks a sieve; it rises clear of the one below, the ones
 * above it ride up with it, and each mesh is bare. At rest the stack is parted
 * under the middle sieve, whose rim is bright. The slider is the gap.
 *
 * The pattern: one of many. A tween for the gap under each sieve, staggered
 * outwards from the one picked. The pick is read from the sieves' rest
 * heights, which move only with the slider, never from the stack on screen.
 */

const N = 3, R = 36, H = 11, PAN = 8, WALL = 2.6, SEAT = 2, FLOOR = 1.6; // sieves, radius, a sieve's height, the pan's, wall, closed gap, the mesh above a sieve's foot
const CHORDS = [-22, -11, 0, 11, 22], STEP = 40, S = 2.35, REST = 0.8, RIDE = 0.6; // mesh chords, stagger ms, scale, the rest gap and the gap above a pick, as shares of the gap

/** The gap under sieve i when sieve f is picked (-1 for rest: the stack parted under the middle one). */
const under = (f        , i        , gap        ) => {
  const a = f < 0 ? 1 : f;
  return i === a ? (f < 0 ? gap * REST : gap) : f >= 0 && i === a + 1 ? gap * RIDE : SEAT;
};

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const [, MID, MAX] = TABLE.sieve;
  const C = Cam(45, 0.5, S);
  // The tallest pose (a lower sieve picked at the widest gap) and the rest stack at the default gap. The box
  // runs as far below the rest stack's middle as the tallest top is above it: rest sits in the middle, and the tallest still fits.
  const tall = PAN + N * H + SEAT + MAX * (1 + RIDE), rest = PAN + N * H + 2 * SEAT + MID * REST;
  const ext         = [];
  for (const [x, y] of [[-R, 0], [R, 0], [0, -R], [0, R]]) ext.push([x, y, rest - tall], [x, y, tall]);
  fit(C, ext, 200, 166);
  const P = proj(C), y0 = P(0, 0, 0)[1];
  const rise = (z        ) => P(0, 0, z)[1] - y0;
  const outer = circ(R, 72), inner = circ(R - WALL, 72);
  const g = mk("g", {}, svg);

  // The pan, then the sieves bottom to top: each a drum, its mouth, and its mesh seen through the mouth.
  const drum = (z0        , z1        )         => hull(outer.map((q) => P(q.u, q.v, z0)).concat(outer.map((q) => P(q.u, q.v, z1))));
  put(solid(g), { sil: poly(drum(0, PAN)), crease: poly(inner.map((q) => P(q.u, q.v, PAN))) });
  const parts = Array.from({ length: N }, () => ({ s: solid(g), mesh: mk("path", { class: "nf lo" }, g) }));

  /** The runs of a line on the floor at zf that show through the mouth at zm. */
  const through = (pts                 , zf        , zm        )           => {
    const runs           = [[]];
    for (const [u, v] of pts) {
      const s = P(u, v, zf), m = unproj(C, s[0], s[1], zm);
      if (Math.hypot(u, v) < R - WALL && Math.hypot(m[0], m[1]) < R - WALL) runs[runs.length - 1].push(s);
      else if (runs[runs.length - 1].length) runs.push([]);
    }
    return runs.filter((r) => r.length > 1);
  };
  // The mesh: chords both ways, and the floor's edge, begun at the front so its far run is one piece.
  const chord = (a      , b      )         => Array.from({ length: 29 }, (_, k) => [a[0] + ((b[0] - a[0]) * k) / 28, a[1] + ((b[1] - a[1]) * k) / 28]);
  const lines = CHORDS.flatMap((c) => [chord([c, -R], [c, R]), chord([-R, c], [R, c])]);
  lines.push(Array.from({ length: 73 }, (_, k) => { const t = Math.PI / 4 + (k / 72) * Math.PI * 2, r = R - WALL - 0.05; return [r * Math.cos(t), r * Math.sin(t)]; }));

  // A sieve standing on the ground, drawn once. What shows through the mouth depends only on the mouth's
  // height over the mesh, so a sieve at any height is this, moved up the screen.
  const body = drum(0, H), mouth = inner.map((q) => P(q.u, q.v, H)), mesh = lines.flatMap((l) => through(l, FLOOR, H));
  const up = (pts                 , dy        ) => pts.map((p)       => [p[0], p[1] + dy]);

  const gaps = Array.from({ length: N }, () => tween(SEAT));
  const drawn = gaps.map(() => NaN);
  let picked = -2, gap = value;
  function draw(now        ) {
    let z = PAN;
    gaps.forEach((t, i) => {
      z += tval(t, now);
      if (z !== drawn[i]) {
        drawn[i] = z;
        const dy = rise(z);
        put(parts[i].s, { sil: poly(up(body, dy)), crease: poly(up(mouth, dy)) });
        parts[i].mesh.setAttribute("d", mesh.map((r) => open(up(r, dy))).join(""));
      }
      z += H;
    });
  }

  const loop = register(stage, (_dt, now) => { draw(now); return gaps.some((t) => !tdone(t, now)); });
  bag.add(loop.unregister);

  /** Sets every gap for a pick, f being the sieve picked, or -1 for rest. */
  function choose(f        , now        ) {
    if (f === picked) return;
    picked = f;
    const a = f < 0 ? 1 : f;
    gaps.forEach((t, i) => tset(t, under(f, i, gap), now, Math.abs(i - a) * STEP));
    parts.forEach((p, i) => p.s.sil.classList.toggle("hi", i === a));
    read.textContent = f < 0 ? "rest" : `sieve ${N - f} · 0`;
    loop.wake();
  }
  choose(-1, -1e9);
  draw(0);

  /** The rest stack's middles on screen, bottom to top: what the pointer's height is read against. */
  const bands = () => { let z = PAN; return gaps.map((_, i) => { z += under(-1, i, gap); const y = P(0, 0, z + H / 2)[1]; z += H; return y; }); };
  let mids = bands();
  const pick = (p      ) => mids.reduce((best, y, i) => (Math.abs(p[1] - y) < Math.abs(p[1] - mids[best]) ? i : best), 0);

  bag.add(pointer(stage, { move: (p) => choose(pick(p), __hairClock.now), leave: () => choose(-1, __hairClock.now) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { gap = v; mids = bands(); const f = picked; picked = -2; choose(f, __hairClock.now); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/slow":function(__require,module){
const {Cam,fit,proj,unproj,facing,rings,prism,clamp,r2,seg}=__require("core/iso");
const {spring,stepS,reducedMotion}=__require("core/motion");
const {mk,solid,put,flatDot,place,register,pointer,disposer}=__require("core/stage");

/**
 * Fig 9.5, Slow — hover dilates the clock. Crates ride a belt through a gate,
 * growing in at one end and out at the other, each lid carrying its serial as
 * a 3 × 3 dot code. Hovering never stops the world: it springs the clock's
 * rate down to the slider's value, so everything keeps moving, just slowly
 * enough to read. The crate nearest the pointer lifts and its serial goes to
 * the read-out. The gate's two posts and lintel are depth-sorted with the
 * crates, and brighten as a crate passes under them. Ported from the study's `#slow`
 * (design/lab-hairline/cartilha-v2.html).
 *
 * Ambient: the loop runs every frame while the stage is on screen (the stage
 * puts it to sleep offscreen). Under reduced motion the resting rate is 0, so
 * the belt stands still until hovered, when it creeps at the slider's rate.
 */

const L = 210, BW = 26, BT = 5, CUBE = 15, NC = 6, SPEED = 1 / 9, GATE = L * 0.62, GH = 38;

                                                   
                                                                

/** How big a crate is at belt position u (0..1): smoothstep in over the first 8%, out over the last. */
const size = (u        ) => { const a = clamp(Math.min(u, 1 - u) / 0.08, 0, 1); return a * a * (3 - 2 * a); };

/**
 * How lit the gate is by a crate at x: a cos² swell, full under the lintel. It
 * rises over half the gap between crates (about .75s at full speed) and falls
 * over half that once the crate is through (about .37s), so the gate breathes
 * in and lets go. Read off the belt, not a timer, so it slows with the clock.
 */
const RISE = L / NC / 2, FALL = RISE / 2;
const glow = (x        ) => {
  const d = x - GATE, w = d < 0 ? RISE : FALL;
  return Math.abs(d) >= w ? 0 : Math.cos((Math.PI / 2) * (Math.abs(d) / w)) ** 2;
};

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let slow = value, over              = null, clock = 2.4;
  const rate = spring(1, { eps: 0.002 });
  const C = Cam(45, 0.5, 1.8);
  fit(C, [[0, 0, 0], [L, BW, 0], [L, 0, 0], [0, BW, 0], [0, 0, GH], [GATE, -8, GH]], 200, 168);
  const P = proj(C), front = facing(C);
  const g = mk("g", {}, svg);
  const [bR, bI] = rings(0, 0, L, BW, 5, 1.3);
  put(solid(g), prism(P, front, bR, bI, 0, BT));
  const slats = mk("path", { class: "nf lo" }, g);
  // crates and the gate share one layer, re-sorted by depth (x + y at 45°) every frame
  const layer = mk("g", {}, g);
  const pool          = [];
  for (let j = 0; j < NC; j++) {
    const el        = { ...solid(layer), dots: [] };
    for (let k = 0; k < 9; k++) el.dots.push(flatDot(el.g, C, 1, "dot off"));
    pool.push(el);
  }
  // the lintel's key is past both posts and every crate under it, so it paints last among its neighbours
  const gate = ([[-8, -3, 0, GH - 4, GATE - 5.5], [BW + 3, BW + 8, 0, GH - 4, GATE + BW + 5.5], [-8, BW + 8, GH - 4, GH, GATE + BW + 8.5]]         )
    .map(([y0, y1, z0, z1, key]) => {
      const el = solid(layer), [rg, ig] = rings(GATE - 1.6, y0, GATE + 1.6, y1, 1.4, 0.6);
      put(el, prism(P, front, rg, ig, z0, z1));
      // the glow is driven every frame from the belt; the stroke's CSS transition would only lag it
      el.sil.style.transition = "none";
      return { el, key };
    });
  const lifts = Array.from({ length: NC }, () => spring(0, { eps: 0.03 }));
  let hot = -1, order = "", gatePct = 0;

  const B = register(stage, (dt) => {
    let m = stepS(rate, dt);
    const base = reducedMotion() ? 0 : 1;
    if (!over) rate.t = base;
    clock += dt * rate.x;
    const items         = [];
    for (let j = 0; j < NC; j++) {
      const q = j / NC + clock * SPEED, u = q - Math.floor(q), lap = Math.floor(q);
      items.push({ j, x: u * L, s: size(u), serial: 141 + lap * NC + j });
    }
    // nearest crate to the pointer, on the belt plane
    let want = -1;
    if (over) {
      let best = 34;
      for (const it of items) if (it.s > 0.6 && Math.abs(it.x - over[0]) < best) { best = Math.abs(it.x - over[0]); want = it.j; }
    }
    hot = want;
    lifts.forEach((sp, j) => { sp.t = j === hot ? 11 : 0; if (stepS(sp, dt)) m = true; });
    items.sort((a, b) => a.x - b.x);
    let gateGlow = 0, hotSerial = 0;
    // stable ids, so the layer is only re-appended when the order actually changes
    const draw                                                         = gate.map((p, i) => ({ id: "g" + i, key: p.key, g: p.el.g }));
    items.forEach((it, k) => {
      const el = pool[k], sz = CUBE * it.s, x0 = it.x - sz / 2, x1 = it.x + sz / 2, y0 = BW / 2 - sz / 2, y1 = BW / 2 + sz / 2;
      const z0 = BT + lifts[it.j].x, z1 = z0 + sz;
      draw.push({ id: k, key: it.x + BW / 2, g: el.g });
      if (sz < 0.3) { el.g.setAttribute("visibility", "hidden"); return; }
      el.g.removeAttribute("visibility");
      const [rg, ig] = rings(x0, y0, x1, y1, 2.6 * it.s, 0.9 * it.s);
      put(el, prism(P, front, rg, ig, z0, z1));
      const isHot = it.j === hot;
      el.sil.classList.toggle("hi", isHot);
      // the serial, as a 3 × 3 code on the lid (bit 0 top-left)
      const pitch = sz * 0.2, rr = r2(0.55 * it.s * C.S);
      el.dots.forEach((d, b) => {
        place(d, P(it.x + ((b % 3) - 1) * pitch, BW / 2 + (Math.floor(b / 3) - 1) * pitch, z1));
        d.setAttribute("rx", String(rr)); d.setAttribute("ry", String(r2(rr * C.k)));
        d.setAttribute("class", (it.serial >> b) & 1 ? (isHot ? "dot" : "dot m") : "dot off");
      });
      if (isHot) hotSerial = it.serial;
      gateGlow = Math.max(gateGlow, glow(it.x) * it.s);
    });
    draw.sort((a, b) => a.key - b.key);
    const sig = draw.map((d) => d.id).join();
    if (sig !== order) { order = sig; draw.forEach((d) => layer.appendChild(d.g)); }
    // the edge colour mixed toward the lit one; written only when the percent changes
    const pct = Math.round(gateGlow * 100);
    if (pct !== gatePct) {
      gatePct = pct;
      const stroke = pct ? `color-mix(in srgb, var(--hl-hi) ${pct}%, var(--hl-edge))` : "";
      gate.forEach((p) => { p.el.sil.style.stroke = stroke; });
    }
    const off = (((clock * SPEED * L) % 21) + 21) % 21, sl           = [];
    for (let x = off; x < L; x += 21) if (x > 5 && x < L - 5) sl.push(seg(P(x, 4, BT), P(x, BW - 4, BT)));
    slats.setAttribute("d", sl.join(""));
    read.textContent = `rate ${rate.x.toFixed(2)}×` + (hot >= 0 ? ` · #${String(hotSerial).padStart(4, "0")}` : "");
    // The study asks for every frame. Under reduced motion at rest the belt is
    // stopped, so the frame would repeat itself: sleep until input or a change
    // of preference wakes it (both do). Visually the same.
    if (reducedMotion() && !over && rate.x === 0) return m;
    return true;
  });
  bag.add(B.unregister);
  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], BT); rate.t = slow; B.wake(); },
    leave: () => { over = null; B.wake(); },
  }));
  bag.add(() => svg.replaceChildren());
  return { set: (v) => { slow = v; if (over) rate.t = v; B.wake(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/stack":function(__require,module){
const {Cam,facing,fit,poly,proj,ringAt,rings}=__require("core/iso");
const {spring,stepS,tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");
const {lid,slab}=__require("slab");

/**
 * Stack: a call stack, five frames laid one over another on a base plate, each
 * a thin slab with a quiet inset rim on the lid. The pointer's height picks a
 * frame: the frames above it lift away on the 700ms curve, the top one furthest
 * and each in turn, so the chosen frame opens to the eye and takes the bright
 * edge. At rest the stack sits closed with the top frame, the one running now,
 * bright. The slider is the lift, in world units.
 *
 * The pattern: discrete items. Tweens, a stagger by distance, and a hit test
 * on static bands of the resting stack's height, so a lifting frame cannot
 * move the choice.
 */
const N = 5, T = 4, PITCH = 9, Z0 = 7, FW = 56, STEP = 55;
const BASE = [-8, -8, 64, 64], BT = 4;
// Each frame sits a little off the one below, so the closed stack is not a block.
// Motion: opening is quick and gets a calm settle; closing is slower and softer,
// the low frames first and the top one last to land; the bright mark rides the kernel's 260ms stroke fade.
const OPEN = 700, CLOSE = 1250, CSTEP = 45, KICK = 0.42, SETTLE = 230;
const HYS = 5;
const OFF = [[-1.5, 1], [1.5, -1.2], [-0.5, -1.8], [2, 1.2], [0, 0]];

                                                                                                                                   

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let lift = value;
  /** How far frame j stands above its place when frame a is chosen: the top frame furthest. */
  const up = (j        , a        ) => (j <= a ? 0 : lift * (0.4 + (0.6 * (j - a)) / (N - 1 - a)));

  const C = Cam(45, 0.5, 2.2);
  const ztop = Z0 + (N - 1) * PITCH + T;
  fit(C, [[BASE[0], BASE[1], 0], [BASE[2], BASE[3], 0], [BASE[0], BASE[1], ztop + 46], [BASE[2], BASE[3], ztop + 46]], 200, 166);
  const P = proj(C), front = facing(C);

  const g = mk("g", {}, svg);
  const [br, bi] = lid(BASE[0], BASE[1], BASE[2], BASE[3], 7, 2);
  put(solid(g), slab(P, front, br, bi, 0, BT));
  // a recessed square in the base, under the stack
  const [rr] = rings(4, 4, 52, 52, 4, 1);
  mk("path", { d: poly(ringAt(P, rr, BT)), class: "nf lo" }, g);

  const fr          = [];
  for (let j = 0; j < N; j++) {
    const x0 = 0 + OFF[j][0], y0 = 0 + OFF[j][1];
    const [ring] = lid(x0, y0, x0 + FW, y0 + FW, 5, 1.1);
    const el = solid(g);
    // the same quiet inset rim on every lid: the slab's lip
    const [rim] = lid(x0 + 4, y0 + 4, x0 + FW - 4, y0 + FW - 4, 2.5, 0.6);
    fr.push({ j, ring, el, rim, tw: tween(0), sp: spring(0, { k: 90, c: 10, eps: 0.005 }), kick: Infinity, drawn: NaN });
  }

  function draw(f       , e        ) {
    const z = Z0 + f.j * PITCH + e;
    put(f.el, slab(P, front, f.ring, f.rim, z, z + T));
  }

  const B = register(stage, (_dt, now) => {
    let moving = false;
    for (const f of fr) {
      if (now >= f.kick) { f.kick = Infinity; f.sp.v = KICK * f.sp.v0 ; }
      const bump = f.sp.x !== 0 || f.sp.v !== 0 ? (stepS(f.sp, _dt), f.sp.x) : 0;
      const e = tval(f.tw, now) + bump;
      if (!tdone(f.tw, now) || f.kick !== Infinity || f.sp.x !== 0 || f.sp.v !== 0) moving = true;
      if (e !== f.drawn) { f.drawn = e; draw(f, e); }
    }
    return moving;
  });
  bag.add(B.unregister);

  // Hit bands: the resting stack's heights on screen. They never move.
  const mid = fr.map((f) => P(FW / 2 + OFF[f.j][0], FW - 9 + OFF[f.j][1], Z0 + f.j * PITCH + T)[1]);
  const xs = ringAt(P, br, 0).map((q) => q[0]), yb = Math.max(...ringAt(P, br, 0).map((q) => q[1]));
  const xa = Math.min(...xs) + 4, xb = Math.max(...xs) - 4, ya = mid[N - 1] - 150;
  /** The frame at the point's height, clamped to the stack; -1 off the column. */
  function hit([x, y]                  ) {
    if (x < xa || x > xb || y > yb || y < ya) return -1;
    // keep the current frame until the pointer is clearly inside another band
    if (act >= 0) {
      const lo = act < N - 1 ? (mid[act] + mid[act + 1]) / 2 : -1e9, hi = act > 0 ? (mid[act - 1] + mid[act]) / 2 : 1e9;
      if (y >= lo - HYS && y <= hi + HYS) return act;
    }
    let a = 0;
    while (a < N - 1 && y < (mid[a] + mid[a + 1]) / 2) a++;
    return a;
  }

  let act = -1;
  function apply(a        , from        ) {
    const now = __hairClock.now, s = a < 0 ? N - 1 : a;
    fr.forEach((f) => {
      const to = a < 0 ? 0 : up(f.j, a), cur = tval(f.tw, now);
      if (to !== f.tw.to) {
        const closing = to < cur;
        tset(f.tw, to, now, closing ? (a < 0 ? f.j * CSTEP : Math.abs(f.j - from) * 30) : Math.abs(f.j - from) * STEP);
        f.tw.dur = closing ? CLOSE : OPEN;
        if (!closing) { f.kick = f.tw.t0 + SETTLE; f.sp.v0 = Math.max(6, to - cur) * 0.5; f.sp.v0  /= KICK; }
      }
      f.el.sil.classList.toggle("hi", f.j === s);
    });
    B.wake();
  }
  apply(-1, N - 1);
  read.textContent = "rest";

  function over(a        ) {
    if (a === act) return;
    const from = a < 0 ? act : a;
    act = a;
    read.textContent = a < 0 ? "rest" : "fr " + (a + 1);
    apply(a, from);
  }

  bag.add(pointer(stage, { move: (p) => over(hit(p)), leave: () => over(-1) }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v        ) => { lift = v; apply(act, act < 0 ? N - 1 : act); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/terminal":function(__require,module){
const {Cam,clamp,fillet,fit,poly,prism,proj,rings,rrect}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {disposer,mk,pointer,put,register,solid}=__require("core/stage");

/**
 * Terminal: a terminal window floating upright as a thin rounded slab. A title
 * bar with its three round buttons across the top, a prompt bar across the
 * foot with a chevron and a block cursor, and between them the output: rows
 * of rounded bars, indented and of different lengths, as code and logs are.
 * The pointer's height scrolls back through twenty-four lines of history on a
 * spring; lines leaving the top pass in behind the title bar, and new ones
 * come up from behind the prompt bar, cut where they meet it. The line under the
 * pointer lifts off the slab, and its neighbours less, each on its own spring.
 * At rest the window is scrolled back half a line and one long line is caught
 * lifted, bright. The slider is how far the lift spreads, in lines.
 *
 * The slab stands in the x–z plane and faces +y, so the figure draws in its
 * own frame: u across, v up, w out of the face, P2(u, v, w) = P(u, w, v).
 * The pattern: scrub and pick. One spring for the scroll, a spring per line
 * for its lift, a falloff by distance, and a hit test on the rest planes.
 */

const N = 24, V = 7, G = 11, T = 2.1, LH = 1.8, CH = 3.9, LIFT = 5.5, HB = 3.4, SLAB = 3;
const W = 150, TB = 17, PB = 17, PAD = 11, IN = 2.5, FIRST = 37;
const VB = PB, VA = PB + V * G, H = VA + TB, E = 4;
/** The history, oldest first: an indent in cells, then each token's length in cells. */
const HIST = [
  "0 5 12", "2 7 3 9", "2 14", "4 6 10", "4 18", "2 3", "0 2", "0 2 6 8",
  "0 26", "0 20", "0 11 4", "2 9 12", "2 5 3 7", "4 16", "4 8 8", "2 4",
  "0 3 14", "0 24", "0 30", "0 17", "2 6 11", "2 13", "0 9 5", "0 4 7",
];
/** Rest: scrolled back part way into a line, with line 18 lifted and its neighbours following. */
const REST_TOP = N - V - 2.6, REST_LINE = 18, REST_R = 2;

/** The share of the full lift a line takes, d lines from the one under the pointer: all of it there, none past R. */
const falloff = (d        , R        ) => clamp(1 - d / R, 0, 1);
const smooth = (t        ) => t * t * (3 - 2 * t);
/** A ring sample faces the camera: its normal, in the slab's u–v plane, against the view direction (x .612, z .5). */
const front = (q        ) => 0.612 * q.nu + 0.5 * q.nv > 0;
/** A ring cut to the window between the bars: whatever lies past a bar is pressed flat against it. */
const cut = (ring      )       => ring.map((q) => ({ ...q, v: clamp(q.v, VB, VA) }));

                                                 
                                                                 
                                     

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.62);
  const W3 = (u        , v        , w        )                           => [u, w, v];
  fit(C, [W3(0, 0, -SLAB), W3(W, 0, -SLAB), W3(0, H, -SLAB), W3(W, H, -SLAB), W3(W, 0, HB + 2.8), W3(0, H, HB + 1.3), W3(PAD, VA - 4, LIFT + LH)], 200, 166);
  const P = proj(C), P2 = (u        , v        , w        ) => P(u, w, v);
  let R = value, over       = null, lit            = [];

  const g = mk("g", {}, svg);
  const [sr, si] = rings(0, 0, W, H, 9, 2);
  put(solid(g), prism(P2, front, sr, si, -SLAB, 0));

  // The history, oldest (highest) first. Each token is a pill, cut to the window as it is drawn.
  const rows        = HIST.map((s, j) => {
    const [ind, ...tok] = s.split(" ").map(Number), segs        = [];
    let at = ind;
    for (const n of tok) {
      const x0 = PAD + at * CH;
      segs.push({ x0, x1: x0 + n * CH - 1.4, el: solid(g) });
      at += n + 1;
    }
    return { j, segs, sp: spring(0, { eps: 0.01 }), drawn: "" };
  });

  // The prompt bar, its chevron (two strokes joined into one shape) and the block cursor, painted after the
  // lines as the title bar is: a line coming up out of it rises from behind it, cut flat inside it.
  const [pr, pi] = rings(IN, IN, W - IN, VB, 6, 1.4);
  put(solid(g), prism(P2, front, pr, pi, 0, HB));
  const cy = (IN + VB) / 2;
  const chev = fillet([[0, 6.2], [8.5, 0], [0, -6.2], [0, -3.1], [4.25, 0], [0, 3.1]], [0.9, 1.1, 0.9, 0.5, 0.6, 0.5]);
  const chevEl = mk("path", { d: poly(chev.map(([x, y]) => P2(PAD + x, cy + y, HB))), class: "nf" }, g);
  const [kr, ki] = rings(PAD + 13, cy - 5.2, PAD + 13 + CH * 1.5, cy + 5.2, 1.2, 0.8);
  const cursor = solid(g);
  put(cursor, prism(P2, front, kr, ki, HB, HB + 2.8));

  // The title bar and its buttons, painted after the lines: a line going up passes in behind it.
  const [tr, ti] = rings(IN, VA, W - IN, H - IN, 6, 1.4);
  put(solid(g), prism(P2, front, tr, ti, 0, HB));
  for (let i = 0; i < 3; i++) {
    const cx = PAD + i * 8.5, cv = (VA + H - IN) / 2;
    const [r, ri] = rings(cx - 2.8, cv - 2.8, cx + 2.8, cv + 2.8, 2.8, 0.8);
    put(solid(g), prism(P2, front, r, ri, HB, HB + 1.3));
  }

  /** Row j with the window scrolled to `top` lines: cut to the window, and lifted less as it nears either bar. */
  function drawRow(rw     , top        ) {
    const key = top + "|" + rw.sp.x;
    if (key === rw.drawn) return;
    rw.drawn = key;
    const vc = VA - (rw.j - top + 0.5) * G, v0 = Math.max(vc - T, VB), v1 = Math.min(vc + T, VA);
    const env = smooth(clamp((VA - vc - T) / E, 0, 1)) * smooth(clamp((vc - T - VB) / E, 0, 1));
    const w0 = rw.sp.x * env;
    for (const s of rw.segs) {
      if (v1 - v0 < 0.05) { put(s.el, { sil: "", crease: "" }); continue; }
      const ring = cut(rrect(s.x0, vc - T, s.x1, vc + T, T, 4)), inner = cut(rrect(s.x0 + 0.7, vc - T + 0.7, s.x1 - 0.7, vc + T - 0.7, T - 0.7, 4));
      put(s.el, prism(P2, front, ring, inner, w0, w0 + LH));
    }
  }

  function light(els           ) {
    for (const el of lit) el.classList.remove("hi");
    lit = els;
    for (const el of lit) el.classList.add("hi");
  }

  const top = spring(REST_TOP, { eps: 0.002 });
  const B = register(stage, (dt) => {
    let m = stepS(top, dt);
    for (const rw of rows) { if (stepS(rw.sp, dt)) m = true; drawRow(rw, top.x); }
    return m;
  });
  bag.add(B.unregister);

  /** The slab-frame point [u, v] under a screen point, on the plane w. */
  function onFace([sx, sy]      , w        )       {
    const o = P2(0, 0, w), a = P2(1, 0, w), b = P2(0, 1, w);
    const ax = a[0] - o[0], ay = a[1] - o[1], bx = b[0] - o[0], by = b[1] - o[1], det = ax * by - ay * bx;
    return [((sx - o[0]) * by - (sy - o[1]) * bx) / det, (ax * (sy - o[1]) - ay * (sx - o[0])) / det];
  }
  /** Where the pointer is, on the rest planes, nearest first: "prompt", a depth down the rows from 0 to 1, or null off the window. */
  function hit(p      )       {
    const qb = onFace(p, HB), inU = (q      ) => q[0] > IN && q[0] < W - IN;
    if (inU(qb) && qb[1] > IN && qb[1] < VB) return "prompt";
    if (inU(qb) && qb[1] > VA && qb[1] < H - IN) return 0;
    const q = onFace(p, 0);
    if (q[0] < 0 || q[0] > W || q[1] < 0 || q[1] > H) return null;
    return q[1] <= VB ? "prompt" : clamp((VA - G / 2 - q[1]) / ((V - 1) * G), 0, 1);
  }

  function retarget() {
    let t        , c        , r = R;
    if (over === null) { t = REST_TOP; c = REST_LINE; r = REST_R; read.textContent = "rest"; }
    else if (over === "prompt") { t = N - V; c = -1; read.textContent = "prompt"; }
    else {
      // The pointer runs over the row centres; the column scrolls with it, and the line nearest it is taken, kept clear of both bars.
      t = over * (N - V);
      c = clamp(Math.round(over * (N - 1)), Math.ceil(t), Math.floor(t + V - 1));
      read.textContent = "line " + (FIRST + c);
    }
    top.t = t;
    for (const rw of rows) rw.sp.t = c < 0 ? 0 : LIFT * falloff(Math.abs(rw.j - c), r);
    light(c < 0 ? [cursor.sil, chevEl] : rows[c].segs.map((s) => s.el.sil));
    B.wake();
  }
  retarget();
  for (const rw of rows) rw.sp.x = rw.sp.t;

  bag.add(pointer(stage, {
    move: (p) => { over = hit(p); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v; if (over !== null) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/terrain":function(__require,module){
const {Cam,clamp,facing,fit,prism,proj,rings,unproj}=__require("core/iso");
const {spring,stepS}=__require("core/motion");
const {flatDot,mk,place,pointer,put,register,disposer,solid}=__require("core/stage");

/**
 * Terrain (Fig 9.2): Fig 0.3's falloff in two dimensions. The pointer is
 * projected back onto the ground, and each of 81 pillars on a rounded plinth
 * takes its height from its radial distance to it, each on its own spring. At
 * rest the field is a designed dune with two rises. A 3 × 3 dot mark rides the
 * lid of the pillar under the pointer, or the peak at rest; pillars above half
 * height take the bright stroke. The slider is the radius, in cells.
 * Ported from the study's `#terrain` (design/lab-hairline/cartilha-v2.html).
 */

const N = 9, CELL = 14, FOOT = 11, HMAX = 58, EXT = N * CELL, PB = 5;

/** Linear's ratios, as a fraction of the radius: 1 → .31 at 42% → .09 at the edge and beyond. */
const falloff = (u        ) =>
  u <= 0 ? 1 : u <= 0.417 ? 1 - (u / 0.417) * 0.6875 : u <= 1 ? 0.3125 - ((u - 0.417) / 0.583) * 0.2185 : 0.094;

                                                                                                               

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  const C = Cam(45, 0.5, 1.58);
  fit(C, [[-6, -6, -PB], [EXT + 6, EXT + 6, -PB], [EXT + 6, -6, -PB], [-6, EXT + 6, -PB], [0, 0, HMAX * 0.75]], 200, 166);
  const P = proj(C), front = facing(C);
  let R = value * CELL, over                          = null;

  const g = mk("g", {}, svg), cols        = [];
  const [pr, pi] = rings(-6, -6, EXT + 6, EXT + 6, 9, 2.2);
  put(solid(g), prism(P, front, pr, pi, -PB, 0));
  // Diagonal by diagonal from the back corner, so appending is painting back to front.
  for (let s = 0; s <= 2 * (N - 1); s++) for (let i = 0; i < N; i++) {
    const j = s - i;
    if (j < 0 || j >= N) continue;
    const u = i / (N - 1), v = j / (N - 1);
    const h0 = 4 + 25 * Math.exp(-((u - 0.22) ** 2 + (v - 0.74) ** 2) / 0.07) + 12 * Math.exp(-((u - 0.8) ** 2 + (v - 0.26) ** 2) / 0.035);
    const x0 = i * CELL + (CELL - FOOT) / 2, y0 = j * CELL + (CELL - FOOT) / 2;
    const [ring, inner] = rings(x0, y0, x0 + FOOT, y0 + FOOT, 2.6, 0.9);
    cols.push({ i, j, h0, ring, inner, sp: spring(h0, { eps: 0.04 }), el: solid(g), drawn: NaN });
  }

  // The mark: a 3 × 3 of dots riding the lid of one pillar, moved in the paint
  // order to just after it, so the pillars in front still cover it.
  const mark = mk("g", {}, g), md                      = [];
  for (let k = 0; k < 9; k++) md.push(flatDot(mark, C, 0.55, k === 4 ? "dot" : "dot m"));
  const peak = cols.reduce((a, b) => (b.h0 > a.h0 ? b : a));
  const byCell = new Map             ();
  cols.forEach((c) => byCell.set(c.i + "," + c.j, c));
  let mc             = null, want = peak;

  function drawMark() {
    if (want !== mc) { mc = want; mc.el.g.after(mark); }
    const cx = (mc.i + 0.5) * CELL, cy = (mc.j + 0.5) * CELL, h = Math.max(0.6, mc.sp.x);
    md.forEach((el, k) => place(el, P(cx + ((k % 3) - 1) * 2.5, cy + (Math.floor(k / 3) - 1) * 2.5, h)));
  }
  // A pillar whose spring hasn't moved keeps its paths: most of the 81 are still on most frames.
  function drawCol(c     ) {
    const h = Math.max(0.6, c.sp.x);
    if (h === c.drawn) return;
    c.drawn = h;
    put(c.el, prism(P, front, c.ring, c.inner, 0, h));
    c.el.sil.classList.toggle("hi", h > HMAX * 0.5);
  }

  const B = register(stage, (dt) => {
    let m = false;
    for (const c of cols) { if (stepS(c.sp, dt)) m = true; drawCol(c); }
    drawMark();
    return m;
  });
  bag.add(B.unregister);

  function retarget() {
    for (const c of cols) {
      if (!over) { c.sp.t = c.h0; continue; }
      const dx = (c.i + 0.5) * CELL - over[0], dy = (c.j + 0.5) * CELL - over[1];
      c.sp.t = HMAX * falloff(Math.hypot(dx, dy) / R);
    }
    if (over) {
      const i = clamp(Math.floor(over[0] / CELL), 0, N - 1), j = clamp(Math.floor(over[1] / CELL), 0, N - 1);
      want = byCell.get(i + "," + j) ;
      read.textContent = `cell ${i}·${j}`;
    } else { want = peak; read.textContent = "rest"; }
    B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => { over = unproj(C, p[0], p[1], 0); retarget(); },
    leave: () => { over = null; retarget(); },
  }));
  bag.add(() => svg.replaceChildren());

  return {
    set: (v) => { R = v * CELL; if (over) retarget(); },
    destroy: bag.dispose,
  };
};

module.exports={mount};
},
"figures/turntable-geometry":function(__require,module){
/**
 * Turntable — the blocks on the platter and the order they are painted in,
 * with no DOM, so the one part of the figure that can go wrong all the way
 * round (tests/hairline-geometry.spec.ts sweeps it) is checked without a
 * browser. From the study's sixth figure (design/lab-hairline/cartilha-v2.html).
 *
 * The camera turns and the blocks stand still, so which block is in front
 * changes with the azimuth and is worked out again every frame. `s` and `c`
 * are sin and cos of the azimuth, `k` is sin(elevation).
 */

/** One axis-aligned block: [x0, y0, z0, x1, y1, z1, column]. A column is blocks stacked on one footprint. */
                                                                                    

const BLK                 = [
  [-42, -42, 0, -12, -12, 14, 0], [-36, -36, 14, -18, -18, 34, 0],
  [0, -46, 0, 16, -6, 10, 1],
  [24, -32, 0, 40, -16, 44, 2],
  [-44, 4, 0, -4, 18, 22, 3],
  [8, 6, 0, 40, 38, 8, 4], [16, 14, 8, 28, 26, 20, 4],
  [-30, 28, 0, -16, 42, 12, 5],
];

/** The azimuth the figure is drawn at, and the quarter turn between its detents. */
const HOME = 45;
const DETENT = 90;

/** The nearest quarter-turn detent to an angle, in degrees: every stop is 2:1 again. */
const detent = (a        ) => HOME + DETENT * Math.round((a - HOME) / DETENT);

/** A sort key for blocks no plane separates: farther is smaller. */
const depth = (b     , s        , c        ) => (b[0] + b[3]) * s + (b[1] + b[4]) * c + (b[2] + b[5]) * 0.01;

/**
 * Whether A is painted before B. Two blocks in one column stack, lower first;
 * otherwise any axis plane between their footprints says which one is behind.
 */
function behind(A     , B     , s        , c        )          {
  if (A[6] === B[6]) return A[2] < B[2];
  if (A[3] <= B[0]) return s > 0;
  if (B[3] <= A[0]) return s < 0;
  if (A[4] <= B[1]) return c > 0;
  if (B[4] <= A[1]) return c < 0;
  return depth(A, s, c) < depth(B, s, c);
}

/** A block's screen box at unit scale and no offset: [x0, y0, x1, y1]. */
function scr(b     , s        , c        , k        )                                   {
  const zf = Math.sqrt(1 - k * k);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const x of [b[0], b[3]]) for (const y of [b[1], b[4]]) for (const z of [b[2], b[5]]) {
    const X = x * c - y * s, Y = (x * s + y * c) * k - z * zf;
    x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y);
  }
  return [x0, y0, x1, y1];
}

/**
 * The painter's order and how many picks had to break a cycle. Only pairs
 * whose screen boxes overlap are constrained (far pairs could otherwise chain
 * into a cycle), then a topological sort draws the farthest free block first.
 * If no block is free, the farthest waiting one is forced; `forced` counts
 * those, and for BLK it should stay 0 at every angle.
 */
function paintOrder(bs                , s        , c        , k        )                                      {
  const n = bs.length, bx = bs.map((b) => scr(b, s, c, k));
  const next             = bs.map(() => []), wait = bs.map(() => 0);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const a = bx[i], b = bx[j];
    if (i === j || a[2] <= b[0] || b[2] <= a[0] || a[3] <= b[1] || b[3] <= a[1]) continue;
    if (behind(bs[i], bs[j], s, c)) { next[i].push(j); wait[j]++; }
  }
  const out           = [], done = bs.map(() => false);
  let forced = 0;
  while (out.length < n) {
    let pick = -1, pass = 0;
    for (; pass < 2 && pick < 0; pass++)
      for (let i = 0; i < n; i++)
        if (!done[i] && (pass || !wait[i]) && (pick < 0 || depth(bs[i], s, c) < depth(bs[pick], s, c))) pick = i;
    if (pass === 2) forced++;
    done[pick] = true; out.push(pick);
    for (const j of next[pick]) wait[j]--;
  }
  return { order: out, forced };
}

/** Indices into `bs`, back to front. */
const order = (bs                , s        , c        , k        ) => paintOrder(bs, s, c, k).order;

module.exports={BLK,HOME,DETENT,detent,depth,behind,scr,paintOrder,order};
},
"figures/turntable":function(__require,module){
const {Cam,circ,clamp,facing,lerp,prism,proj,r2,rad,rings,seg}=__require("core/iso");
const {reducedMotion,spring,stepS}=__require("core/motion");
const {BLK,HOME,detent,order}=__require("figures/turntable-geometry");
const {disposer,flatDot,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Turntable — flick it round. The camera is the variable: moving across the
 * platter pushes its near edge, friction bleeds the spin off, and once it is
 * slow a spring pulls it into the nearest quarter-turn detent, so every stop
 * is 2:1 again. Pointer y springs the elevation. The blocks are re-ordered
 * every frame (lib/hairline/turntable-geometry.ts). From the study's sixth
 * figure (design/lab-hairline/cartilha-v2.html).
 *
 * The slider is `coast`: the friction's time constant, in ms.
 */

const RING = 70, PT = 4, WMAX = 540, ON_INDEX = 14;

                                                 

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let coast = value;

  // The platter's angle in degrees, its angular velocity, and whether it is coasting, settling or at rest.
  const spin = { a: HOME, w: 0, mode: "rest"                               , tgt: HOME };
  const kk = spring(0.5, { eps: 0.0005 });
  let lastX                = null, lastT = 0, lastMove = -1e9;

  /** Coast under friction, then spring into the detent; 240Hz substeps so a long frame can't overshoot. */
  function stepSpin(dt        , now        ) {
    if (spin.mode === "rest") return false;
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      if (spin.mode === "coast") {
        spin.w *= Math.exp((-h * 1000) / coast); spin.a += spin.w * h;
        if (Math.abs(spin.w) < 45 && now - lastMove > 90) { spin.mode = "settle"; spin.tgt = detent(spin.a + spin.w * 0.2); }
      } else { spin.w += (-90 * (spin.a - spin.tgt) - 16 * spin.w) * h; spin.a += spin.w * h; }
    }
    if (spin.mode === "settle" && Math.abs(spin.a - spin.tgt) < 0.02 && Math.abs(spin.w) < 0.3) { spin.a = spin.tgt; spin.w = 0; spin.mode = "rest"; }
    return spin.mode !== "rest";
  }

  const C = Cam(HOME, 0.5, 1.85); C.ox = 200; C.oy = 184;
  const plat = circ(RING), platIn = circ(RING - 1.5);
  const blocks          = BLK.map((b) => { const [ring, inner] = rings(b[0], b[1], b[3], b[4], 3, 1.1); return { b, ring, inner }; });
  const TALL = blocks.find((k) => k.b[5] >= 40) ;
  // each column lights by its top block only
  const tops                        = {};
  blocks.forEach((k) => { if (!tops[k.b[6]] || k.b[5] > tops[k.b[6]].b[5]) tops[k.b[6]] = k; });
  const base                                   = {};
  blocks.forEach((k) => { if (k.b[2] === 0) base[k.b[6]] = [(k.b[0] + k.b[3]) / 2, (k.b[1] + k.b[4]) / 2]; });

  const g = mk("g", {}, svg);
  const platter = solid(g), ticks = mk("path", { class: "nf lo" }, g), major = mk("path", { class: "nf" }, g);
  const north = flatDot(g, C, 1.7, "dot m");
  const index = mk("path", { class: "nf" }, g);
  const pool = BLK.map(() => solid(g));
  // The tall block's dot code: a 4 × 4 grid less its corners, the rim dots medium. It rides that block's lid,
  // so it is moved to just after whichever pool group the tall block is drawn in.
  const acc = mk("g", {}, g), accD                                                    = [];
  for (let k = 0; k < 16; k++) {
    const r = Math.floor(k / 4), q = k % 4, edge = r % 3 === 0, side = q % 3 === 0;
    if (edge && side) continue;
    accD.push({ r, q, el: flatDot(acc, C, 0.6, edge || side ? "dot m" : "dot") });
  }
  let accAt               = null;

  const B = register(stage, (dt, now) => {
    let m = stepSpin(dt, now);
    if (stepS(kk, dt)) m = true;
    C.az = rad(spin.a); C.k = kk.x;
    const P = proj(C), front = facing(C), c = Math.cos(C.az), s = Math.sin(C.az);
    put(platter, prism(P, front, plat, platIn, -PT, 0));
    const tk           = [], mj           = [];
    for (let d = 0; d < 360; d += 15) {
      const a = rad(d), long = d % 90 === 0, r0 = long ? RING - 12 : RING - 8;
      (long ? mj : tk).push(seg(P(Math.cos(a) * r0, Math.sin(a) * r0, 0), P(Math.cos(a) * (RING - 4.5), Math.sin(a) * (RING - 4.5), 0)));
    }
    ticks.setAttribute("d", tk.join("")); major.setAttribute("d", mj.join(""));
    place(north, P(0, -(RING - 17), 0)); north.setAttribute("ry", String(r2(1.7 * C.S * C.k)));
    const bottom = C.oy + RING * C.S * C.k + PT * C.S * Math.sqrt(1 - C.k * C.k);
    index.setAttribute("d", `M${C.ox - 4} ${r2(bottom + 10)}L${C.ox} ${r2(bottom + 4)}L${C.ox + 4} ${r2(bottom + 10)}`);
    // while the platter is handled or turning, the column passing the index mark lights; at rest nothing does
    let lit = -1, best = ON_INDEX;
    if (lastX !== null || spin.mode !== "rest")
      for (const col in base) {
        const [x, y] = base[col], off = (Math.abs(Math.atan2(x * c - y * s, x * s + y * c)) * 180) / Math.PI;
        if (off < best) { best = off; lit = +col; }
      }
    order(BLK, s, c, C.k).forEach((j, i) => {
      const k = blocks[j];
      put(pool[i], prism(P, front, k.ring, k.inner, k.b[2], k.b[5]));
      pool[i].sil.classList.toggle("hi", k === tops[lit]);
      if (k === TALL && accAt !== pool[i]) { accAt = pool[i]; accAt.g.after(acc); }
    });
    const [x0, y0, , x1, y1, z1] = TALL.b, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    accD.forEach(({ r, q, el }) => {
      place(el, P(cx + (q - 1.5) * 2.6, cy + (r - 1.5) * 2.6, z1));
      el.setAttribute("ry", String(r2(0.6 * C.S * C.k)));
    });
    read.textContent = `az ${String(Math.round(((spin.a % 360) + 360) % 360)).padStart(3, "0")}° · el ${Math.round((Math.asin(kk.x) * 180) / Math.PI)}°`;
    return m;
  });
  bag.add(B.unregister);

  bag.add(pointer(stage, {
    move: (p) => {
      const now = __hairClock.now;
      kk.t = lerp(Math.sin(rad(40)), Math.sin(rad(20)), clamp(p[1] / 320, 0, 1));
      if (lastX !== null) {
        const dx = p[0] - lastX;
        if (reducedMotion()) spin.a -= dx * 0.9;
        else {
          // pushing the near edge: the platter's front follows the pointer
          const vp = dx / Math.max(0.008, (now - lastT) / 1000);
          spin.w = clamp(lerp(spin.w, -vp * 0.9, 0.35), -WMAX, WMAX); spin.mode = "coast";
        }
        if (Math.abs(dx) > 0.5) lastMove = now;
      }
      lastX = p[0]; lastT = now; B.wake();
    },
    leave: () => { lastX = null; kk.t = 0.5; if (reducedMotion()) spin.a = detent(spin.a); B.wake(); },
  }));

  bag.add(() => svg.replaceChildren());
  return { set: (v) => { coast = v; B.wake(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"figures/vault":function(__require,module){
const {Cam,circ,clamp,fit,hull,lerp,open,poly,proj,rrect,run,seg}=__require("core/iso");
const {reducedMotion,tdone,tset,tval,tween}=__require("core/motion");
const {disposer,mk,place,pointer,put,register,solid}=__require("core/stage");

/**
 * Vault: a round vault door standing proud of a wall block, a combination dial
 * at its centre and three bolts on its lock side, each thrown across a gap into
 * a keeper bolted to the wall. Circling the pointer round the dial pushes it;
 * it coasts, friction bleeds the spin, and a detent every ten catches it. When
 * it lands on forty the bolts draw back into the door, staggered out from the
 * one nearest the pointer, and they are thrown again once the dial leaves.
 * At rest the dial sits on thirty, the combination's long tick bright just
 * past the index. The slider is the coast: friction's time constant, in ms.
 *
 * The pattern: push the camera, as Turntable's: friction, then a spring into
 * the detent; tweens for the bolts' choice; a hit test on the door's own plane.
 */

const R = 40, DP = 14, ZC = 64, RD = 17, DT = 4, KN = 6, KH = 6, GAP = 10, KL = 11, KW = 12, KD = 10, BR = 3.6;
const HX = -R - 8, HR = 4.6, WX0 = -70, WX1 = 70, WZ1 = 130, WT = 14, COMBO = 40, REST = 30, STEP = 50, WMAX = 150;
const THETA = [72, 26, -20];
/** Toward the viewer, for Cam(45, 0.5): a face whose normal has a positive dot with it is seen. */
const V       = [Math.SQRT1_2 * Math.sqrt(0.75), Math.SQRT1_2 * Math.sqrt(0.75), 0.5];
const dir = (deg        )       => [Math.cos((deg * Math.PI) / 180), 0, Math.sin((deg * Math.PI) / 180)];
const wrap = (d        ) => ((((d + 50) % 100) + 100) % 100) - 50;

/**
 * A rounded solid along axis e from s0 to s1, its cross-section `ring` lying in
 * the (a, b) plane round o: the hull of its two ends, and one crease on the end
 * at s1 where it meets the side the viewer sees.
 */
function bar(P           , o      , e      , a      , b      , ring      , inner      , s0        , s1        ) {
  const at = (q        , s        ) => P(
    o[0] + e[0] * s + a[0] * q.u + b[0] * q.v,
    o[1] + e[1] * s + a[1] * q.u + b[1] * q.v,
    o[2] + e[2] * s + a[2] * q.u + b[2] * q.v,
  );
  const seen = (q        ) => [0, 1, 2].reduce((t, i) => t + (a[i] * q.nu + b[i] * q.nv) * V[i], 0) > 0;
  return {
    sil: poly(hull(ring.map((q) => at(q, s0)).concat(ring.map((q) => at(q, s1))))),
    crease: open(run(inner, seen).map((q) => at(q, s1))),
  };
}

                                                                                  

const mount              = ({ stage, svg, read }, value) => {
  const bag = disposer();
  let coast = value;
  const Y       = [0, 1, 0], X       = [1, 0, 0], Z       = [0, 0, 1], O       = [0, 0, ZC];

  const C = Cam(45, 0.5, 1.5);
  fit(C, [[WX0, -WT, 0], [WX1, -WT, 0], [WX0, -WT, WZ1], [WX1, -WT, WZ1], [WX0, KD, 0], [WX1, 0, 0], [WX0, 0, WZ1], [WX1, 0, WZ1]], 200, 166);
  const P = proj(C);

  const g = mk("g", {}, svg);
  // the wall block, then the door standing proud of it, painted back to front
  put(solid(g), bar(P, [0, 0, 0], Y, X, Z, rrect(WX0, 0, WX1, WZ1, 9, 6), rrect(WX0 + 2, 2, WX1 - 2, WZ1 - 2, 7, 6), -WT, 0));
  // the hinge, a barrel on the left with two arms into the door
  put(solid(g), bar(P, [HX, DP * 0.55, 0], Z, X, Y, circ(HR, 28), circ(HR - 1, 28), ZC - 26, ZC + 26));
  for (const dz of [-15, 15]) put(solid(g), bar(P, [0, 0, ZC + dz], Y, X, Z, rrect(HX, -4, -R + 6, 4, 3, 4), rrect(HX + 1, -3, -R + 5, 3, 2, 4), 1, DP * 0.8));
  put(solid(g), bar(P, O, Y, X, Z, circ(R, 72), circ(R - 2.4, 72), 0, DP));
  // the door's stepped face, and the index, a short stroke above the dial
  mk("path", { class: "nf lo", d: poly(circ(R - 8, 64).map((q) => P(q.u, DP, ZC + q.v))) }, g);
  mk("path", { class: "nf", d: seg(P(0, DP, ZC + RD + 1.8), P(0, DP, ZC + RD + 6.5)) }, g);
  const dial = solid(g);
  put(dial, bar(P, O, Y, X, Z, circ(RD, 56), circ(RD - 1.4, 56), DP, DP + DT));
  const ticks = mk("path", { class: "nf lo" }, g), longs = mk("path", { class: "nf" }, g), combo = mk("path", { class: "nf" }, g);
  put(solid(g), bar(P, O, Y, X, Z, circ(KN, 32), circ(KN - 1, 32), DP + DT, DP + DT + KH));

  // three bolts, each with the keeper it is thrown into; the keeper is painted after its bolt and covers its end
  const bolts         = THETA.map((th) => {
    const e = dir(th), t = dir(th + 90);
    const el = solid(g), keep = solid(g);
    put(keep, bar(P, O, Y, e, t, rrect(R + GAP, -KW / 2, R + GAP + KL, KW / 2, 3, 4), rrect(R + GAP + 1.4, -KW / 2 + 1.4, R + GAP + KL - 1.4, KW / 2 - 1.4, 1.8, 4), 0, KD));
    for (const s of [-3.4, 3.4]) {
      const c = R + GAP + KL / 2 + s;
      place(mk("circle", { r: 0.9, class: "dot off" }, keep.g), P(e[0] * c, KD, ZC + e[2] * c));
    }
    return { th, e, t, el, tw: tween(0), drawn: NaN };
  });
  const drawBolt = (b      , k        ) => {
    const s1 = lerp(R + GAP + 4.5, R + 1.2, k);
    if (s1 === b.drawn) return;
    b.drawn = s1;
    put(b.el, bar(P, [0, DP / 2, ZC], b.e, b.t, Y, circ(BR, 24), circ(BR - 0.9, 24), R - 0.2, s1));
  };

  // the dial: a is the number under the index, w its speed in numbers a second
  const spin = { a: REST, w: 0, mode: "rest"                               , tgt: REST };
  let raw = REST, said = "", last                = null, lastT = 0, lastMove = -1e9, over = false, opened = false, from = 1, lit                = null, drawnA = NaN;

  function drawDial() {
    if (spin.a === drawnA) return;
    drawnA = spin.a;
    const tk           = [], lg           = [], z = DP + DT;
    for (let m = 0; m < 100; m += 5) {
      const th = 90 + (m - spin.a) * 3.6, e = dir(th), r0 = m % 10 ? RD - 4 : RD - 6.5, r1 = RD - 1.8;
      const d = seg(P(e[0] * r0, z, ZC + e[2] * r0), P(e[0] * r1, z, ZC + e[2] * r1));
      if (m === COMBO) combo.setAttribute("d", d);
      else (m % 10 ? tk : lg).push(d);
    }
    ticks.setAttribute("d", tk.join(""));
    longs.setAttribute("d", lg.join(""));
  }

  /** One bright place: the bolts when open, the dial while handled, the combination's tick at rest. */
  function light() {
    const want = opened ? "bolts" : over ? "dial" : "combo";
    if (want === lit) return;
    lit = want;
    bolts.forEach((b) => b.el.sil.classList.toggle("hi", want === "bolts"));
    dial.sil.classList.toggle("hi", want === "dial");
    combo.classList.toggle("hi", want === "combo");
  }

  function setOpen(on         , now        ) {
    opened = on;
    bolts.forEach((b, i) => tset(b.tw, on ? 1 : 0, now, Math.abs(i - from) * STEP));
    light();
  }

  /** Coast under friction, a detent's pull every ten; once slow, a spring into the nearest. 240Hz substeps. */
  function stepSpin(dt        , now        ) {
    if (spin.mode === "rest") return false;
    const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
    for (let i = 0; i < n; i++) {
      if (spin.mode === "coast") {
        spin.w = spin.w * Math.exp((-h * 1000) / coast) - 40 * Math.sin((spin.a / 10) * 2 * Math.PI) * h;
        spin.a += spin.w * h;
        if (Math.abs(spin.w) < 12 && now - lastMove > 90) { spin.mode = "settle"; spin.tgt = Math.round((spin.a + spin.w * 0.15) / 10) * 10; }
      } else { spin.w += (-90 * (spin.a - spin.tgt) - 16 * spin.w) * h; spin.a += spin.w * h; }
    }
    if (spin.mode === "settle" && Math.abs(spin.a - spin.tgt) < 0.01 && Math.abs(spin.w) < 0.2) {
      spin.a = spin.tgt = ((spin.tgt % 100) + 100) % 100; spin.w = 0; spin.mode = "rest";
    }
    return spin.mode !== "rest";
  }

  const B = register(stage, (dt, now) => {
    let m = stepSpin(dt, now);
    const near = Math.abs(wrap(spin.a - COMBO));
    if (!opened && near < 0.8 && Math.abs(spin.w) < 6) setOpen(true, now);
    else if (opened && near > 2.5) setOpen(false, now);
    drawDial();
    bolts.forEach((b) => { drawBolt(b, tval(b.tw, now)); if (!tdone(b.tw, now)) m = true; });
    const n = String(((Math.round(spin.a) % 100) + 100) % 100).padStart(2, "0");
    const say = over || spin.mode !== "rest" ? `dial ${n}` + (opened ? " · open" : "") : "rest";
    if (say !== said) read.textContent = said = say;
    return m;
  });
  bag.add(B.unregister);

  // the pointer on the door's face plane, which never moves
  const p0 = P(0, DP, 0), px = P(1, DP, 0), pz = P(0, DP, 1);
  const ax = [px[0] - p0[0], px[1] - p0[1]], az = [pz[0] - p0[0], pz[1] - p0[1]], det = ax[0] * az[1] - ax[1] * az[0];
  function onFace([sx, sy]      )       {
    const qx = sx - p0[0], qy = sy - p0[1];
    return [(qx * az[1] - qy * az[0]) / det, (ax[0] * qy - ax[1] * qx) / det - ZC];
  }

  function leave() {
    over = false; last = null;
    if (reducedMotion()) { raw = spin.a = ((Math.round(spin.a / 10) * 10) % 100 + 100) % 100; spin.w = 0; spin.mode = "rest"; }
    light(); B.wake();
  }

  bag.add(pointer(stage, {
    move: (p) => {
      const [u, v] = onFace(p), r = Math.hypot(u, v);
      if (r > R + GAP + KL + 10) return leave();
      const now = __hairClock.now, ang = (Math.atan2(v, u) * 180) / Math.PI;
      over = true;
      from = THETA.reduce((bi, th, i) => (Math.abs(wrap((ang - th) / 3.6)) < Math.abs(wrap((ang - THETA[bi]) / 3.6)) ? i : bi), 0);
      if (last !== null) {
        // circling the dial turns it with the pointer; near its centre the push fades
        const da = (-(((ang - last + 540) % 360) - 180) / 3.6) * clamp(r / 22, 0, 1);
        if (reducedMotion()) { raw += da; spin.a = Math.round(raw / 10) * 10; spin.mode = "rest"; }
        else {
          spin.w = clamp(lerp(spin.w, da / Math.max(0.008, (now - lastT) / 1000), 0.35), -WMAX, WMAX);
          spin.mode = "coast"; raw = spin.a;
        }
        if (Math.abs(da) > 0.05) lastMove = now;
      }
      last = ang; lastT = now;
      light(); B.wake();
    },
    leave,
  }));
  light();
  bag.add(() => svg.replaceChildren());

  return { set: (v) => { coast = v; B.wake(); }, destroy: bag.dispose };
};

module.exports={mount};
},
"index":function(__require,module){
const {create}=__require("mount");
const {mount: basketEngine}=__require("figures/basket");
const {mount: branchesEngine}=__require("figures/branches");
const {mount: cabinetEngine}=__require("figures/cabinet");
const {mount: dishEngine}=__require("figures/dish");
const {mount: drawerEngine}=__require("figures/drawer");
const {mount: elevatorEngine}=__require("figures/elevator");
const {mount: explodedEngine}=__require("figures/exploded");
const {mount: formatEngine}=__require("figures/format");
const {mount: hubEngine}=__require("figures/hub");
const {mount: keyboardEngine}=__require("figures/keyboard");
const {mount: laptopEngine}=__require("figures/laptop");
const {mount: lockersEngine}=__require("figures/lockers");
const {mount: loupeEngine}=__require("figures/loupe");
const {mount: padlockEngine}=__require("figures/padlock");
const {mount: patchEngine}=__require("figures/patch");
const {mount: phoneEngine}=__require("figures/phone");
const {mount: phosphorEngine}=__require("figures/phosphor");
const {mount: plotEngine}=__require("figures/plot");
const {mount: plugEngine}=__require("figures/plug");
const {mount: queryEngine}=__require("figures/query");
const {mount: railEngine}=__require("figures/rail");
const {mount: rebuildEngine}=__require("figures/rebuild");
const {mount: relayEngine}=__require("figures/relay");
const {mount: riffleEngine}=__require("figures/riffle");
const {mount: routerEngine}=__require("figures/router");
const {mount: settleEngine}=__require("figures/settle");
const {mount: sieveEngine}=__require("figures/sieve");
const {mount: slowEngine}=__require("figures/slow");
const {mount: stackEngine}=__require("figures/stack");
const {mount: terminalEngine}=__require("figures/terminal");
const {mount: terrainEngine}=__require("figures/terrain");
const {mount: turntableEngine}=__require("figures/turntable");
const {mount: vaultEngine}=__require("figures/vault");

/**
 * @lucasmarkes/hairline — thirty-three isometric line figures that answer the pointer.
 *
 * One function per figure. Each takes an element and the same options, draws
 * into the element, and returns `{ update, destroy }`. Each function names
 * its engine itself, so a bundle that imports one figure carries one.
 */

                                                       

/** A tray of eight cards. The card under the pointer stands up; the arrow keys walk the cards. `intensity` spreads the ripple further from the pulled card. */
function riffle(el             , options                  )         {
  return create({
    id: "riffle",
    label: "A tray of eight cards. Hover or use the arrow keys to pull a card.",
    rest: "rest",
    engine: riffleEngine,
    focusable: true,
  }, el, options);
}

/** Eighty-one pillars on a plinth that rise around the pointer. `intensity` widens the area that rises. */
function terrain(el             , options                  )         {
  return create({
    id: "terrain",
    label: "Eighty-one pillars on a plinth that rise around the pointer and rest as a dune with two rises.",
    rest: "rest",
    engine: terrainEngine,
  }, el, options);
}

/** An app window in four layers. Moving across opens the gap; moving down picks a layer. `intensity` opens the layers further. */
function exploded(el             , options                  )         {
  return create({
    id: "exploded",
    label: "An app window taken apart into four layers. Moving across opens the gap; moving down picks a layer.",
    rest: "",
    engine: explodedEngine,
  }, el, options);
}

/** A seven by seven dot matrix that plays a loop, and fades like phosphor where the pointer paints it. `intensity` makes the trail linger longer. */
function phosphor(el             , options                  )         {
  return create({
    id: "phosphor",
    label: "A seven by seven dot matrix on a floating tile that plays a loop, and fades like phosphor where you paint it.",
    rest: "loop",
    engine: phosphorEngine,
  }, el, options);
}

/** Crates riding a belt through a gate. Hovering slows the clock without stopping it. `intensity` slows it more. */
function slow(el             , options                  )         {
  return create({
    id: "slow",
    label: "Crates riding a belt through a gate. Hovering slows the clock without stopping it.",
    rest: "rate 1.00×",
    engine: slowEngine,
  }, el, options);
}

/** Blocks on a turntable. A flick across it spins it; it settles on the nearest quarter turn. `intensity` makes the spin coast longer. */
function turntable(el             , options                  )         {
  return create({
    id: "turntable",
    label: "Blocks on a turntable. Flick across it to spin it; it settles on the nearest quarter turn.",
    rest: "az 045° · el 30°",
    engine: turntableEngine,
  }, el, options);
}

/** A sixty-key board. The key under the pointer sinks, and its neighbours follow it down, less the further away. `intensity` widens how far the press reaches. */
function keyboard(el             , options                  )         {
  return create({
    id: "keyboard",
    label: "A sixty-key board. The key under the pointer sinks, and its neighbours follow it down, less the further away.",
    rest: "rest",
    engine: keyboardEngine,
  }, el, options);
}

/** Four floors beside an open shaft. The pointer's height picks a floor, and the car travels there through the ones between. `intensity` makes the car travel faster. */
function elevator(el             , options                  )         {
  return create({
    id: "elevator",
    label: "Four floors beside an open shaft. The pointer's height picks a floor, and the car travels there through the ones between.",
    rest: "rest",
    engine: elevatorEngine,
  }, el, options);
}

/** A phone in layers: glass, board, battery, shell. Moving across opens the gap; moving down picks a layer. `intensity` opens the layers further. */
function phone(el             , options                  )         {
  return create({
    id: "phone",
    label: "A phone in layers: glass, board, battery, shell. Moving across opens the gap; moving down picks a layer.",
    rest: "rest",
    engine: phoneEngine,
  }, el, options);
}

/** A thin laptop: the pointer's height sets how far the lid stands open, and the lid follows it on a spring. `intensity` lets the lid open wider. */
function laptop(el             , options                  )         {
  return create({
    id: "laptop",
    label: "A thin laptop: the pointer's height sets how far the lid stands open, and the lid follows it on a spring.",
    rest: "rest",
    engine: laptopEngine,
  }, el, options);
}

/** A terminal window: the pointer's height scrolls back through its history, and the line under it lifts off the screen. `intensity` spreads the lift over more lines. */
function terminal(el             , options                  )         {
  return create({
    id: "terminal",
    label: "A terminal window: the pointer's height scrolls back through its history, and the line under it lifts off the screen.",
    rest: "rest",
    engine: terminalEngine,
  }, el, options);
}

/** A rack of twelve blades: the pointer's height pulls the nearest ones out on their rails, the farther the less. `intensity` pulls out more blades. */
function cabinet(el             , options                  )         {
  return create({
    id: "cabinet",
    label: "A rack of twelve blades: the pointer's height pulls the nearest ones out on their rails, the farther the less.",
    rest: "rest",
    engine: cabinetEngine,
  }, el, options);
}

/** A commit graph on a board: the commit under the pointer rises, and its history rises after it, the farther back the less. `intensity` raises more of the history. */
function branches(el             , options                  )         {
  return create({
    id: "branches",
    label: "A commit graph on a board: the commit under the pointer rises, and its history rises after it, the farther back the less.",
    rest: "rest",
    engine: branchesEngine,
  }, el, options);
}

/** A vault door: circling the pointer turns its dial, which coasts and catches every ten; on forty its three bolts draw back. `intensity` lets the dial coast longer. */
function vault(el             , options                  )         {
  return create({
    id: "vault",
    label: "A vault door: circling the pointer turns its dial, which coasts and catches every ten; on forty its three bolts draw back.",
    rest: "rest",
    engine: vaultEngine,
  }, el, options);
}

/** A bank of twelve lockers, one ajar at rest: the locker under the pointer opens, and the one open before it swings shut. `intensity` opens the door wider. */
function lockers(el             , options                  )         {
  return create({
    id: "lockers",
    label: "A bank of twelve lockers, one ajar at rest: the locker under the pointer opens, and the one open before it swings shut.",
    rest: "rest",
    engine: lockersEngine,
  }, el, options);
}

/** A stand loupe over a blank ruled sheet: the pointer drags it across, and the rules pass enlarged under the glass with nothing between them. `intensity` magnifies more. */
function loupe(el             , options                  )         {
  return create({
    id: "loupe",
    label: "A stand loupe over a blank ruled sheet: the pointer drags it across, and the rules pass enlarged under the glass with nothing between them.",
    rest: "rest",
    engine: loupeEngine,
  }, el, options);
}

/** A padlock: as the pointer nears, the shackle springs up out of the body and swings open about its long leg. `intensity` swings the shackle further. */
function padlock(el             , options                  )         {
  return create({
    id: "padlock",
    label: "A padlock: as the pointer nears, the shackle springs up out of the body and swings open about its long leg.",
    rest: "rest",
    engine: padlockEngine,
  }, el, options);
}

/** A patch panel of twenty-four ports: the cable under the pointer lifts, and its neighbours lean away, less the further away. `intensity` spreads the lean over more ports. */
function patch(el             , options                  )         {
  return create({
    id: "patch",
    label: "A patch panel of twenty-four ports: the cable under the pointer lifts, and its neighbours lean away, less the further away.",
    rest: "rest",
    engine: patchEngine,
  }, el, options);
}

/** A parabolic dish on a two-axis gimbal: the pointer aims it, and it follows on a spring. `intensity` swings the dish further. */
function dish(el             , options                  )         {
  return create({
    id: "dish",
    label: "A parabolic dish on a two-axis gimbal: the pointer aims it, and it follows on a spring.",
    rest: "rest",
    engine: dishEngine,
  }, el, options);
}

/** A wifi router whose antennas lean toward the pointer, the nearest the most and the others less the further away. `intensity` spreads the lean over more antennas. */
function router(el             , options                  )         {
  return create({
    id: "router",
    label: "A wifi router whose antennas lean toward the pointer, the nearest the most and the others less the further away.",
    rest: "rest",
    engine: routerEngine,
  }, el, options);
}

/** Three test sieves stacked over a pan: the pointer's height picks one, it rises clear of the stack, and every mesh is bare. `intensity` opens the gap further. */
function sieve(el             , options                  )         {
  return create({
    id: "sieve",
    label: "Three test sieves stacked over a pan: the pointer's height picks one, it rises clear of the stack, and every mesh is bare.",
    rest: "rest",
    engine: sieveEngine,
  }, el, options);
}

/** A garment rail with seven bare hangers: the pointer brushes them, and each rocks away from it, the nearest most, and settles. `intensity` reaches more hangers. */
function rail(el             , options                  )         {
  return create({
    id: "rail",
    label: "A garment rail with seven bare hangers: the pointer brushes them, and each rocks away from it, the nearest most, and settles.",
    rest: "rest",
    engine: railEngine,
  }, el, options);
}

/** A wall socket and a plug lying on the floor at the end of its cord: the pointer draws the plug up toward the socket, and it stops short. `intensity` brings it nearer. */
function plug(el             , options                  )         {
  return create({
    id: "plug",
    label: "A wall socket and a plug lying on the floor at the end of its cord: the pointer draws the plug up toward the socket, and it stops short of it.",
    rest: "rest",
    engine: plugEngine,
  }, el, options);
}

/** A question mark built as a solid on a plinth, its dot a loose ball: the hook turns about its stem toward the pointer, and the ball rolls after it. `intensity` turns the hook further. */
function query(el             , options                  )         {
  return create({
    id: "query",
    label: "A question mark built as a solid on a plinth, its dot a loose ball: the hook turns about its stem toward the pointer, and the ball rolls after it.",
    rest: "rest",
    engine: queryEngine,
  }, el, options);
}

/** A filing cabinet of three drawers: the pointer's height picks one, it slides out, and inside are two dividers and nothing between them. `intensity` pulls the drawer further out. */
function drawer(el             , options                  )         {
  return create({
    id: "drawer",
    label: "A filing cabinet of three drawers: the pointer's height picks one, it slides out, and inside are two dividers and nothing between them.",
    rest: "rest",
    engine: drawerEngine,
  }, el, options);
}

/** An empty wire shopping basket under a bail handle: the pointer tilts it toward itself on a spring, so the bare floor shows, and the handle swings after it, late. `intensity` tilts it further. */
function basket(el             , options                  )         {
  return create({
    id: "basket",
    label: "An empty wire shopping basket under a bail handle: the pointer tilts it toward itself on a spring, so the bare floor shows, and the handle swings after it, late.",
    rest: "rest",
    engine: basketEngine,
  }, el, options);
}

/** A bar chart with no data: seven flat tabs on its base, before a plate of grid lines. The pointer brushes them, and each lifts a little, the nearest most, and drops back to zero. `intensity` lifts them higher. */
function plot(el             , options                  )         {
  return create({
    id: "plot",
    label: "A bar chart with no data: seven flat tabs on its base, before a plate of grid lines. The pointer brushes them, and each lifts a little, the nearest most, and drops back to zero.",
    rest: "rest",
    engine: plotEngine,
  }, el, options);
}

/** A hub and eight tiles on a grid: the tile under the pointer rises and its link turns solid, and its neighbours rise less. `intensity` raises the tiles higher. */
function hub(el             , options                  )         {
  return create({
    id: "hub",
    label: "A hub and eight tiles on a grid: the tile under the pointer rises and its link turns solid; its neighbours rise less.",
    rest: "rest",
    engine: hubEngine,
    tour: [[205, 112], [260, 144], [328, 179], [263, 207], [201, 243], [131, 209], [76, 177], [136, 141], null],
  }, el, options);
}

/** A hub and four branches of tiles: the path to the leaf under the pointer lights hop by hop, each tile rising in turn. `intensity` makes each hop wait longer. */
function relay(el             , options                  )         {
  return create({
    id: "relay",
    label: "A hub and four branches of tiles: the path to the leaf under the pointer lights hop by hop, each tile rising in turn.",
    rest: "rest",
    engine: relayEngine,
    tour: [[45, 145], [140, 253], [271, 258], [355, 216], [344, 151], null],
  }, el, options);
}

/** Twelve tiles lie crooked round a hub; as the pointer nears it they slide into a tree and the links draw in. `intensity` starts the tree from further away. */
function settle(el             , options                  )         {
  return create({
    id: "settle",
    label: "Twelve tiles lie crooked round a hub; as the pointer nears it they slide into a tree and the links draw in.",
    rest: "rest",
    engine: settleEngine,
    tour: [[360, 40], [320, 120], [203, 155], null],
  }, el, options);
}

/** A file of ten crooked lines: the pointer runs the formatter down it, and every line above snaps square to its indent. `intensity` starts the lines more crooked. */
function format(el             , options                  )         {
  return create({
    id: "format",
    label: "A file of ten crooked lines: the pointer runs the formatter down it, and every line above snaps square to its indent.",
    rest: "rest",
    engine: formatEngine,
    tour: [[290, 162], [199, 168], [135, 200], null],
  }, el, options);
}

/** A tree of package tiles: the one touched rises, and every package that depends on it rises after it along the links. `intensity` raises them higher. */
function rebuild(el             , options                  )         {
  return create({
    id: "rebuild",
    label: "A tree of package tiles: the one touched rises, and every package that depends on it rises after it along the links.",
    rest: "rest",
    engine: rebuildEngine,
    tour: [[47, 236], [276, 172], [181, 106], null],
  }, el, options);
}

/** A call stack of five frames: the pointer's height picks one, and the frames above lift away to open it. `intensity` lifts them further. */
function stack(el             , options                  )         {
  return create({
    id: "stack",
    label: "A call stack of five frames: the pointer's height picks one, and the frames above lift away to open it.",
    rest: "rest",
    engine: stackEngine,
    tour: [[200, 250], [200, 216], [200, 199], null],
  }, el, options);
}

module.exports={riffle,terrain,exploded,phosphor,slow,turntable,keyboard,elevator,phone,laptop,terminal,cabinet,branches,vault,lockers,loupe,padlock,patch,dish,router,sieve,rail,plug,query,drawer,basket,plot,hub,relay,settle,format,rebuild,stack};
},
"intensity":function(__require,module){
/**
 * One option, `intensity`, for every figure. Each figure turns it into the
 * one number its engine takes: two straight lines that meet at 0.5, where the
 * number is the figure's default, with the figure's limits at 0 and 1.
 *
 * Internal: neither entry exports this. The site keeps a copy of TABLE for its
 * copy and its tests hold the two together.
 */

                                                                                                                                                                                                                                                                                                                                                                                               

/** Each figure's number at intensity 0, 0.5 and 1. Slow's falls: a slower clock is a stronger answer. */
const TABLE                                                      = {
  riffle: [0, 40, 90], // stagger, ms
  terrain: [1.5, 3, 5], // radius, cells
  exploded: [12, 28, 40], // gap, viewBox units
  phosphor: [150, 520, 1500], // afterglow, ms
  slow: [0.6, 0.2, 0.05], // rate, × normal speed
  turntable: [200, 650, 1500], // coast, ms
  keyboard: [1, 2, 3.5], // radius, keys
  elevator: [40, 100, 220], // stiffness, spring units
  phone: [16, 28, 40], // gap, viewBox units
  laptop: [100, 125, 150], // lid, degrees
  terminal: [1, 2, 3.5], // spread, lines
  cabinet: [1.5, 3, 5], // reach, blades
  branches: [1, 3, 6], // reach, commits
  vault: [250, 600, 1500], // coast, ms
  lockers: [55, 90, 120], // opening, degrees
  padlock: [45, 90, 100], // swing, degrees
  patch: [1, 2.5, 5], // radius, ports
  dish: [30, 50, 70], // reach, degrees
  router: [0.5, 1.5, 3], // spread, antennas
  loupe: [1.3, 1.8, 2.6], // magnification, ×
  sieve: [6, 14, 24], // gap, viewBox units
  rail: [1, 2, 3.5], // radius, hangers
  plug: [0.35, 0.6, 0.9], // pull, fraction of the way to the socket
  query: [20, 40, 55], // turn, degrees; past 55 the hook folds over itself and stops reading as one
  drawer: [12, 22, 34], // pull, viewBox units
  basket: [8, 16, 28], // tilt, degrees
  plot: [3, 6, 12], // lift, viewBox units
  hub: [10, 16, 24], // rise, viewBox units
  relay: [40, 120, 220], // delay, ms per hop
  settle: [90, 120, 150], // reach, viewBox units from the hub
  format: [9, 12, 14], // disorder, degrees of the worst skew
  rebuild: [8, 14, 20], // rise, viewBox units
  stack: [22, 34, 46], // lift, viewBox units
};

const DEFAULT = 0.5;

/** An intensity from anything: numeric strings are read, what is not a finite number is the default, the rest is clamped to 0…1. */
function intensity(value         )         {
  const n = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n)) return DEFAULT;
  return Math.min(1, Math.max(0, n));
}

/** The figure's own number for an intensity, rounded to three decimals so 0.7 gives Riffle 60 and not 59.99999999999999. */
function parameter(figure          , value         )         {
  const [lo, mid, hi] = TABLE[figure];
  const i = intensity(value);
  const v = i <= 0.5 ? lo + (i / 0.5) * (mid - lo) : mid + ((i - 0.5) / 0.5) * (hi - mid);
  return Math.round(v * 1000) / 1000;
}

module.exports={TABLE,DEFAULT,intensity,parameter};
},
"mount":function(__require,module){
const {inject}=__require("core/styles");
const {LAP,tour}=__require("core/stage");
const {parameter}=__require("intensity");

/**
 * Hairline — the public wrapper around an engine. An engine draws into an svg
 * it is handed and writes its caption to a read-out; this file makes both,
 * dresses the host element, and gives back the two calls a consumer needs.
 *
 * It only ever removes what it added: the svg, the live region, and the
 * attributes the host did not already have.
 */

/** What every figure takes. */
                               
                                                                                                 
                     
                                                                                                                                           
                                    
                                                                               
                 
                                                                                                
                                  
     
                                                                         
                                                                              
                                                                  
     
                 
  

                      
                                                                                                                                  
                                         
                                                                                       
                  
  

/** What a figure is: its engine, and what it says about itself. */
                    
               
                                     
                
                                                                                 
               
                      
                                                                                        
                      
                                                                                   
              
  

const NS = "http://www.w3.org/2000/svg";
const mounted = new WeakMap                     ();

/** An error from a consumer's callback, reported as uncaught without unwinding the frame loop every figure shares. */
const report = (err         ) => {
  if (typeof reportError === "function") reportError(err);
  else setTimeout(() => { throw err; });
};

function create(spec      , el             , options                  )         {
  if (typeof document === "undefined") {
    throw new Error(`hairline: ${spec.id}() needs a DOM. Call it in the browser, once the element exists: in an effect, in onMount, or in a script after the element.`);
  }
  if (!el || el.nodeType !== 1) {
    throw new TypeError(`hairline: ${spec.id}() takes an element as its first argument, and got ${el === null ? "null" : typeof el}.`);
  }
  mounted.get(el)?.();

  const opts                  = { ...options };
  const doc = el.ownerDocument;
  const root = el.getRootNode();
  inject(root.nodeType === 9 || "host" in root ? (root                         ) : doc);

  /* attributes: the host's own are left alone, ours are remembered */
  const owned = new Set        ();
  const attr = (name        , value               ) => {
    if (!owned.has(name) && el.hasAttribute(name)) return;
    if (value === null) { el.removeAttribute(name); owned.delete(name); }
    else { el.setAttribute(name, value); owned.add(name); }
  };
  const dress = () => {
    attr("data-hairline-theme", opts.theme === "light" || opts.theme === "dark" ? opts.theme : null);
    attr("aria-label", el.hasAttribute("aria-labelledby") ? null : typeof opts.label === "string" ? opts.label : spec.label);
  };
  attr("data-hairline", spec.id);
  attr("role", spec.focusable ? "group" : "img");
  if (spec.focusable) attr("tabindex", "0");
  dress();

  const svg = doc.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 400 320");
  svg.setAttribute("aria-hidden", "true");
  el.appendChild(svg);
  let live                     = null;
  if (spec.focusable) {
    live = doc.createElement("span");
    live.setAttribute("data-hairline-live", "");
    live.setAttribute("aria-live", "polite");
    el.appendChild(live);
  }

  /* the read-out: engines write it every frame, so only a change goes any further */
  let text                = null;
  let playing                    = null;
  const read          = {
    get textContent() { return text; },
    set textContent(value) {
      const next = value ?? "";
      if (next === text) return;
      text = next;
      /* a playing figure says only what a person did: the tour's stops stay out of the live region, the rest caption always goes in */
      if (live && live.textContent !== next && (!playing || next === spec.rest || el.matches(":hover, :focus-within"))) live.textContent = next;
      const fn = opts.onRead;
      if (typeof fn === "function") try { fn(next); } catch (err) { report(err); }
    },
  };

  let value = parameter(spec.id, opts.intensity);
  /* the tour registers before the engine, so its board ticks first in a frame: the ghost moves, then the engine draws the answer */
  playing = opts.play === true ? tour(el, spec.tour ?? LAP) : null;
  let engine              ;
  try { engine = spec.engine({ stage: el, svg, read }, value); } catch (err) { playing?.stop(); throw err; }
  if (text === null) read.textContent = spec.rest;

  let dead = false;
  const destroy = () => {
    if (dead) return;
    dead = true;
    if (mounted.get(el) === destroy) mounted.delete(el);
    playing?.stop();
    playing = null;
    engine.destroy();
    svg.remove();
    live?.remove();
    for (const name of owned) el.removeAttribute(name);
    owned.clear();
  };
  mounted.set(el, destroy);

  return {
    update(next) {
      if (dead || !next) return;
      /* a caller without types may send keys that are not options; they are kept and never read */
      const own = opts                           , given = next                           ;
      for (const k in given) {
        if (given[k] === undefined) delete own[k];
        else own[k] = given[k];
      }
      const v = parameter(spec.id, opts.intensity);
      if (v !== value) { value = v; engine.set(v); }
      const play = opts.play === true;
      if (play !== !!playing) {
        playing?.stop();
        playing = play ? tour(el, spec.tour ?? LAP) : null;
      }
      dress();
    },
    destroy,
  };
}

module.exports={create};
},
"slab":function(__require,module){
const {hull,open,poly,ringAt,rrect,run}=__require("core/iso");

/**
 * Slabs: the tiles, plates and frames of the graph figures, drawn whole. Not
 * in src/core, so the skill's kernel and the pages it wrote stay as they are.
 */

/**
 * A prism whose lid is drawn whole. The silhouette carries the lid's front
 * edge, so the lid reads as a face on its band, and the crease is the inset
 * ring all round, a lip.
 */
function slab(
  P           ,
  front                        ,
  ring                   ,
  inner                                      ,
  z0        ,
  z1        ,
)             {
  return {
    sil: poly(hull(ringAt(P, ring, z1).concat(ringAt(P, ring, z0)))) + open(ringAt(P, run(ring, front), z1)),
    crease: inner ? poly(ringAt(P, inner, z1)) : "",
  };
}

/**
 * A ring set d inside another, the gap measured on the screen, so it reads even all the way round, corners
 * included. Concentric in plan is not enough: the 2:1 view squeezes the top and bottom corners, which pinches
 * the gap there, and stretches the side corners, which opens it. So each sample goes to the view plane with
 * its normal, moves d + m in, and stays only if it is that far inside every tangent; then it grows back m, and
 * where the cut took a corner out the ring turns round it at radius m. Then back to plan, to ride any height.
 */
function inset(C        , ring                   , d        , m = 1)       {
  const c = Math.cos(C.az), s = Math.sin(C.az), k = C.k, e = d + m, out       = [];
  const put = (x        , y        , a        , b        ) => {
    const nu = c * a + k * s * b, nv = k * c * b - s * a, l = Math.hypot(nu, nv);
    out.push({ u: x * c + (y / k) * s, v: (y / k) * c - x * s, nu: nu / l, nv: nv / l });
  };
  // the view plane: the normal goes by the inverse transpose, so it stays square to the edge as drawn
  const v = ring.map((q) => {
    const a = q.nu * c - q.nv * s, b = (q.nu * s + q.nv * c) / k, l = Math.hypot(a, b);
    return [q.u * c - q.v * s, (q.u * s + q.v * c) * k, a / l, b / l];
  });
  const w = v
    .map(([x, y, a, b]) => [x - e * a, y - e * b, a, b])
    .filter(([x, y]) => v.every(([X, Y, a, b]) => (x - X) * a + (y - Y) * b < 1e-6 - e));
  w.forEach(([x, y, a, b], i) => {
    const [X, Y, A, B] = w[(i + 1) % w.length], t = Math.atan2(a * B - b * A, a * A + b * B);
    put(x + m * a, y + m * b, a, b);
    if (Math.abs(t) < 0.1) return;
    // the two edges meet at (px, py): round it
    const h = x * a + y * b, H = X * A + Y * B, D = a * B - b * A, px = (h * B - H * b) / D, py = (a * H - A * h) / D;
    for (let j = 0, n = Math.ceil(Math.abs(t) / 0.2); j <= n; j++) {
      const r = Math.atan2(b, a) + (t * j) / n, ca = Math.cos(r), sa = Math.sin(r);
      put(px + m * ca, py + m * sa, ca, sa);
    }
  });
  return out;
}

/** A rounded footprint and its lip, inset by b, sampled finely enough for a large tile: eight samples per corner. */
const lid = (x0        , y0        , x1        , y1        , r        , b        )               => [
  rrect(x0, y0, x1, y1, r, 8),
  rrect(x0 + b, y0 + b, x1 - b, y1 - b, Math.max(0.3, r - b), 8),
];

module.exports={slab,inset,lid};
}};
const __cache={};function __require(id){if(__cache[id])return __cache[id].exports;const module=__cache[id]={exports:{}};if(!__modules[id])throw Error("Hairline module missing: "+id);__modules[id](__require,module);return module.exports;}
// Motion Studio adapter. The clock and pointer are driven by the playhead.
// No RAF, Date.now, implicit tour, media query, or CSS transition affects export.
const figures=__require('index');
const stageClock=__require('core/stage');
const motion=__require('core/motion');
const figureNames=Object.keys(figures).filter(n=>typeof figures[n]==='function');
function defaultPointer(name,seed){
 if(name==='riffle'){
  const g=__require('figures/riffle-geometry'),P=g.scene().P;
  const a=g.REST*Math.PI/180;
  return t=>{const i=3.5+3.3*Math.sin(t*1.6+seed),q=P(g.W/2,i*g.G+g.H*Math.sin(a),g.H*Math.cos(a));return[q[0]/400,q[1]/320];};
 }
 return t=>[.5+.26*Math.sin(t*1.7+seed),.5+.33*Math.cos(t*1.3+seed*.7)];
}
let styleAdded=false;
function ensureStyle(){
 if(styleAdded)return;styleAdded=true;
 const s=document.createElement('style');s.dataset.hairlineMotionStyle='';
 s.textContent='[data-hairline]>svg :is(path,polygon,ellipse,line,circle){transition:none!important} [data-hairline]>[data-hairline-live]{display:none}';
 document.head.append(s);
}
function create(host,name='exploded',options={}){
 if(!figures[name])throw new Error('Unknown Hairline figure '+name);
 ensureStyle();
 const STEP=1/60;
 const seed=Number(options.seed)||0;
 let engine=null,frame=0,dead=false;
 const pointer=typeof options.pointer==='function'?options.pointer:defaultPointer(name,seed);
 const reset=()=>{
  if(engine)engine.destroy();
  frame=0;__hairClock.now=0;motion.setReducedMotion(false);
  engine=figures[name](host,{intensity:options.intensity??.8,theme:options.theme||'dark',play:false,label:options.label||name});
  host.style.setProperty('--hairline-plate',options.plate||'#08080b');
  host.style.setProperty('--hairline-hi',options.highlight||'#ffffff');
  host.style.setProperty('--hairline-edge',options.edge||'#c3c2ce');
  host.style.setProperty('--hairline-mid',options.mid||'#777582');
  host.style.setProperty('--hairline-lo',options.low||'#37343e');
  host.style.setProperty('--hairline-stroke',String(options.stroke??1.1));
 };
 reset();
 return {
  seek(time,x,y){
   if(dead)return;
   const target=Math.max(0,Math.round((Number(time)||0)*60));
   if(target<frame)reset();
   while(frame<target){
    frame++;
    const t=frame*STEP;__hairClock.now=t*1000;
    const p=pointer(t);
    stageClock.drive(host,p?[Math.max(0,Math.min(1,p[0]))*400,Math.max(0,Math.min(1,p[1]))*320]:null);
    stageClock.advance(host,STEP,__hairClock.now);
   }
   // Optional explicit pointer is a pose override. For deterministic animated
   // pointer motion across seeks, supply options.pointer(t) instead.
   if(Number.isFinite(x)&&Number.isFinite(y)){
    __hairClock.now=target*STEP*1000;
    stageClock.drive(host,[x*400,y*320]);stageClock.advance(host,0,__hairClock.now);
   }
  },
  destroy(){if(dead)return;dead=true;engine?.destroy();engine=null;},
  get figure(){return name;}
 };
}
window.HairlineMotion=Object.freeze({create,figures:Object.freeze(figureNames),upstream:'37d2e78dcb333ab30c3338e28ed4a690364ea014'});


})();
