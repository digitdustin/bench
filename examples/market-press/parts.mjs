// Parts that are rebuilt while the figure runs: tokens, the ask ladder, the lever arm and the needle.
// Shared by build.mjs (rest pose) and the live page (every frame), so both draw the same thing.
export function makeParts(k, G, P, D) {
  const V = G.viewOf(P);
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const Ln = (d, style) => k.lineSvg(d, style);
  const rot = (v, axis, angle) => {
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const d = G.dot3(axis, v);
    const x = G.cross3(axis, v);
    return [v[0] * c + x[0] * s + axis[0] * d * (1 - c), v[1] * c + x[1] * s + axis[1] * d * (1 - c), v[2] * c + x[2] * s + axis[2] * d * (1 - c)];
  };

  const COIN_R = 3.6;
  const COIN_T = 0.8; // a $1 coin
  const TOKEN_T = COIN_T / 2; // half of it: one share
  // A share token: half the thickness of the coin it was split from, with a face ring.
  function token(centre, axis, { lit = false, tone = "hi", spin = 0 } = {}) {
    const F0 = G.frameAlong(centre, axis);
    const F = { o: F0.o, a: F0.a, u: rot(F0.u, F0.a, spin), v: rot(F0.v, F0.a, spin) };
    const body = S(G.disc(-TOKEN_T / 2, TOKEN_T / 2, COIN_R, F, P, { steps: 40 }), { tone, lit });
    const facing = G.dot3(F.a, V);
    let marks = "";
    if (Math.abs(facing) > 0.25) {
      const face = facing >= 0 ? TOKEN_T / 2 : -TOKEN_T / 2;
      marks = Ln(G.circleOf(F, face, COIN_R - 0.7, P, 32), { tone: "lo" });
    }
    return body + marks;
  }
  // The whole coin, for the hopper: only its edge is ever seen, through the slot.
  function coin(centre, axis, { lit = false } = {}) {
    const F = G.frameAlong(centre, axis);
    return S(G.disc(-COIN_T / 2, COIN_T / 2, COIN_R, F, P, { steps: 40 }), { tone: "hi", lit });
  }

  // Resting orders behind a jaw: one plate per price level, 1¢ apart, as tall as the size resting there.
  // Built with the jaw face at local x = 0; side −1 is the YES carriage (plates on −x), +1 the NO carriage.
  const PLATE_PITCH = 2; // world units per cent
  const PLATE_T = 1.2;
  const plateHeight = (size) => 3 + size * 0.9;
  function plates(sizes, side) {
    const out = [];
    const list = sizes.map((size, i) => ({ size, i }));
    // paint back to front: for the YES side (−x) the farthest plate has the largest |x|; depth grows with x
    const ordered = side < 0 ? [...list].reverse() : list;
    for (const { size, i } of ordered) {
      const x = side < 0 ? -(D.carriage.jaw + 2 + i * PLATE_PITCH) - PLATE_T : D.carriage.jaw + 2 + i * PLATE_PITCH;
      const plan = { x, y: -7, w: PLATE_T, d: 14, r: 0.2 };
      out.push(`<g data-level="${i}">${S(k.slabOf(plan, D.carriage.deckTop, plateHeight(size), P, 2, 0.3), { tone: "mid" })}</g>`);
    }
    return out.join("");
  }
  const plateShapes = (sizes, side, faceX, A) =>
    sizes.map((size, i) => {
      const x = side < 0 ? -(D.carriage.jaw + 2 + i * PLATE_PITCH) - PLATE_T : D.carriage.jaw + 2 + i * PLATE_PITCH;
      return A.slab({ x: x + faceX, y: -7, w: PLATE_T, d: 14, r: 0.2 }, D.carriage.deckTop, plateHeight(size), { name: `carriage.${side < 0 ? "yes" : "no"}.plate` }, 2);
    });

  // The resolution lever: an arm from the hub to a ball knob, swung about the pin (y axis) by `angle` (radians, + toward NO).
  function lever(angle) {
    const L = D.lever;
    const dir = G.unit3([Math.sin(angle), 0, Math.cos(angle)]);
    const F = G.frameAlong([L.x, L.y, L.z], dir);
    const arm = S(G.prismOf(F, [[-0.8, -0.8], [0.8, -0.8], [0.8, 0.8], [-0.8, 0.8]], L.hubR, L.len, P), { tone: "hi" });
    const knobAt = G.add3([L.x, L.y, L.z], G.mul3(dir, L.len + L.knobR - 0.3));
    const knob = S(G.sphereOf(knobAt, L.knobR, P, { steps: 36 }), { tone: "hi" });
    return arm + knob;
  }

  // The price needle: 0¢ at the left front, 100¢ at the right front, 300° of travel.
  function needle(cents) {
    const d = D.dial;
    const a = (d.from + (cents / 100) * d.span) * (Math.PI / 180);
    const sx = Math.sin(a);
    const sy = -Math.cos(a);
    return k.lineOnTop([d.x - sx * 3.2, d.y - sy * 3.2], [d.x + sx * (d.r - 2.2), d.y + sy * (d.r - 2.2)], d.top + 0.2, P);
  }

  return { token, coin, plates, plateShapes, plateHeight, lever, needle, COIN_R, COIN_T, TOKEN_T, PLATE_PITCH, PLATE_T };
}
