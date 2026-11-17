// Shared harness for the five figures: one camera scale, one set of drawing helpers, one page writer.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../../anatomy/kit/iso-kit.mjs";
import * as G from "../../../anatomy/kit/lathe.mjs";
import * as A from "../../../anatomy/kit/audit.mjs";
import { tubePieces, tubeSvg } from "../../../anatomy/kit/tube.mjs";
import { kitScript } from "../../../anatomy/scripts/inline-kit.mjs";

export { k, G, A, tubePieces, tubeSvg, kitScript };
export const HERE = dirname(fileURLToPath(import.meta.url));
export const KITDIR = join(HERE, "../../../anatomy/kit");
export const SCALE = 1.707; // px per world unit, the press figure's scale, shared by the set
export const AZIMUTH = 38;
export const ELEVATION = 31;
export const W = 600;
export const STAGE_CSS = (cls, cursor = "ew-resize") => `.${cls}{touch-action:pan-y;cursor:${cursor}}.${cls}:focus{outline:none}.${cls}:focus-visible{outline:1px solid var(--anatomy-muted);outline-offset:6px}.mp-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}`;

// A projection at a fixed scale, centred on these points.
export function fixedProjection(points, width, height, { scale = SCALE, azimuth = AZIMUTH, elevation = ELEVATION, dx = 0, dy = 0 } = {}) {
  const unit = { origin: [0, 0], scale: 1, azimuth, elevation };
  const flat = points.map((p) => k.iso(p, unit));
  const xs = flat.map(([x]) => x);
  const ys = flat.map(([, y]) => y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return { origin: [width / 2 - cx * scale + dx, height / 2 - cy * scale + dy], scale, azimuth, elevation };
}

export function latheScript() {
  const src = readFileSync(join(KITDIR, "lathe.mjs"), "utf8").replace(/^import .*$/m, "").replace(/^export /gm, "");
  return `const G = (() => {${src}\nreturn { viewOf, scaleOf, frameAlong, frameOf, pointOf, disc, ringBand, solidOf, lathe, sphereOf, prismOf, circleOf, arcOf, ribsOf, spokesOf, dotsOf, dot3, add3, sub3, mul3, unit3, cross3, len3, lerp3, lightOf, toneOf, radialOf, angleToward };})();\n`;
}

// Drawing helpers bound to one projection and one recorder.
export function rig(P, R) {
  const V = G.viewOf(P);
  const KS = G.scaleOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const Dots = (points, style) => k.dotsSvg(points, style);
  const Faded = (list, style) => k.fadedSvg(list, style);
  const path3 = (points, closed = false) => k.pathOf(points.map(at), closed);
  const byDepth = (points) => [...points].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  const rect = (u0, u1, v0, v1) => [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
  const UPF = (x, y) => G.frameOf([x, y, 0], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const record = R.solid;
  function put(name, ref, svg, shapes = [], { bias = 0, ...rest } = {}) {
    return R.put({ name, at: ref, bias, svg, shapes, piece: "rig", ...rest });
  }
  function slab(name, plan, z0, h, style = {}, { steps = 4, bevel = 0, extra = "", inner = "", bias = 0, ref, lit = false } = {}) {
    const shape = record(A.slab(plan, z0, h, { name }, steps));
    put(name, ref ?? [plan.x + plan.w / 2, plan.y + plan.d / 2, z0 + h / 2], S(k.slabOf(plan, z0, h, P, steps, bevel), { tone: "mid", ...style, inner, lit }) + extra, [shape], { bias });
    return shape;
  }
  function box(name, [x0, y0, z0], [x1, y1, z1], style = {}, opts = {}) {
    return slab(name, { x: x0, y: y0, w: x1 - x0, d: y1 - y0, r: opts.r ?? 0.4 }, z0, z1 - z0, style, { steps: 2, ...opts });
  }
  function turned(name, F, profile, style = {}, { extra = "", inner = "", bias = 0, smooth, steps, bevel = 0, owner, ref } = {}) {
    const opts = { bevel, ...(smooth !== undefined ? { smooth } : {}), ...(steps ? { steps } : {}) };
    const paths = G.solidOf(profile, F, P, opts);
    const mid = (profile[0][0] + profile[profile.length - 1][0]) / 2;
    const shape = record(A.solid(F, profile, { name, owner }));
    put(name, ref ?? G.add3(F.o, G.mul3(F.a, mid)), S(paths, { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  }
  const disc = (name, F, s0, s1, r, style = {}, options = {}) => turned(name, F, [[s0, r], [s1, r]], style, options);
  function ringBand(name, F, s0, s1, rIn, rOut, style = {}, { extra = "", inner = "", bias = 0, steps = 48 } = {}) {
    const shape = record(A.ring(F, s0, s1, rIn, rOut, { name }));
    put(name, G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), S(G.ringBand(s0, s1, rIn, rOut, F, P, { steps }), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  }
  function prism(name, F, poly, s0, s1, style = {}, { extra = "", inner = "", bias = 0, ref } = {}) {
    const shape = record(A.prism(F, poly, s0, s1, { name }));
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    const cy = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    const centre = G.add3(G.add3(G.add3(F.o, G.mul3(F.a, (s0 + s1) / 2)), G.mul3(F.u, cx)), G.mul3(F.v, cy));
    put(name, ref ?? centre, S(G.prismOf(F, poly, s0, s1, P), { tone: "mid", ...style, inner }) + extra, [shape], { bias });
    return shape;
  }
  function ball(name, c, r, style = {}, { bias = 0, extra = "" } = {}) {
    const shape = record(A.ball(c, r, { name }));
    put(name, c, S(G.sphereOf(c, r, P, { steps: 32 }), { tone: "mid", ...style }) + extra, [shape], { bias });
    return shape;
  }
  function planeMatrix(o, ex, ey) {
    const p0 = at(o);
    const px = at(G.add3(o, ex));
    const py = at(G.add3(o, ey));
    const v = (x) => x.toFixed(4);
    return `matrix(${v(px[0] - p0[0])} ${v(px[1] - p0[1])} ${v(py[0] - p0[0])} ${v(py[1] - p0[1])} ${p0[0].toFixed(2)} ${p0[1].toFixed(2)})`;
  }
  // Base plate on feet with a groove, corner screws, and a ruler strip or label plate on request.
  function basePlate(PLATE, { h = 12, foot = 5, strip = null, label = null, ticks = null } = {}) {
    const out = [];
    out.push(`<path class="iso-halo" d="${k.haloOf(PLATE, -h - foot, h, P)}"/>`);
    for (const [x, y] of byDepth(k.corners(PLATE, 18))) {
      out.push(S(k.cylinder(x, y, 6, -h - foot, 1.6, P, 28), { tone: "lo" }));
      out.push(S(k.cylinder(x, y, 4.6, -h - foot + 1.6, foot - 1.6, P, 28), { tone: "mid" }));
    }
    out.push(S(k.slabOf(PLATE, -h, h, P, 8, 1.6), { tone: "mid", inner: Ln(k.sideSeam(PLATE, -h / 2 - 0.5, P, 8), { tone: "faint" }) }));
    out.push(Ln(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
    const screws = k.corners(PLATE, 9);
    out.push(Ln(screws.map(([x, y]) => k.ring(x, y, 2, 0, P, 16)).join(""), { tone: "lo" }));
    out.push(Dots(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
    record(A.slab(PLATE, -h, h, { name: "stand.plate", ground: true }, 8));
    if (strip) {
      out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
      if (ticks) {
        const t = k.topTicks(ticks.from, ticks.to, ticks.step, ticks.every, strip.y + 0.8, 0.6, [2, 3.6], P);
        out.push(Ln(t.minor, { tone: "lo" }), Ln(t.major, { tone: "mid" }));
        if (ticks.zero !== undefined) out.push(Ln(k.lineOnTop([ticks.zero, strip.y + 0.8], [ticks.zero, strip.y + 4.4], 0.62, P), { tone: "hi" }));
      }
      out.push(Dots([at([strip.x + 1.6, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 1.6, strip.y + 3.5, 0.6])], { size: 0.45 }));
      record(A.slab(strip, 0, 0.6, { name: "stand.strip", ground: true }, 3));
    }
    if (label) {
      out.push(S(k.slabOf(label, 0, 0.8, P, 3), { tone: "lo", crease: "none" }));
      out.push(Ln(k.planOutline(k.insetPlan(label, 1.4), 0.8, P, 3), { tone: "faint" }));
      out.push(Ln([0.62, 0.42, 0.52].map((f, i) => k.lineOnTop([label.x + 3.5, label.y + 3 + i * 2.8], [label.x + 3.5 + (label.w - 7) * f, label.y + 3 + i * 2.8], 0.8, P)).join(""), { tone: "lo", free: true }));
      out.push(Dots([at([label.x + label.w - 2.4, label.y + 2.2, 0.8]), at([label.x + label.w - 2.4, label.y + label.d - 2.2, 0.8])], { size: 0.45 }));
      record(A.slab(label, 0, 0.8, { name: "stand.label", ground: true }, 3));
    }
    return out.join("");
  }
  return { V, KS, at, S, Ln, Dots, Faded, path3, byDepth, rect, UPF, record, put, slab, box, turned, disc, ringBand, prism, ball, planeMatrix, basePlate };
}

// Writes a figure's standalone pages (dark and light) and its fragment for the combined page.
export function writeFigure({ id, name, plate, css, shared = "", live, title }) {
  const fragment = { id, plate: `<div id="${id}">${plate}</div>`, css, shared, live };
  writeFileSync(join(HERE, "out", `${name}.json`), JSON.stringify(fragment));
  const script = kitScript() + latheScript() + shared + `{\n${live}\n}`;
  for (const theme of ["dark", "light"]) {
    const page = k.pageHtml({ title, theme, body: `<style>${css}</style>` + fragment.plate, script, width: 780 });
    writeFileSync(join(HERE, theme === "light" ? `${name}-light.html` : `${name}.html`), page);
  }
  return fragment;
}
