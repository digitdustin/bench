// A binary prediction market, the way Polymarket's order book runs one.
// Prices are in cents of a $1 share. Every number the figure shows comes from here.
export const TICK = 1; // cents: the minimum price increment
export const PAYOUT = 100; // cents paid per winning share at resolution
export const DEPTH = 5; // resting price levels drawn behind each jaw

const SIZES = [2, 4, 3, 6, 9, 5, 7, 4, 8, 6, 10, 3];

export function market({ bid = 50, ask = 59 } = {}) {
  return {
    bid, // the reader's own YES bid, in cents
    yes: SIZES.slice(0, DEPTH), // sizes resting behind that bid (bid − 1, bid − 2 …)
    asks: Array.from({ length: DEPTH }, (_, i) => ({ p: ask + i * TICK, size: SIZES[(i + 3) % SIZES.length] })), // YES asks = NO bids at 100 − p
    fills: 0, // how many levels have been consumed, for the size cycle
    last: null, // last trade price, cents
    pairs: 0, // YES + NO pairs minted
    resolved: null, // null, "YES" or "NO"
  };
}

export const bestAsk = (m) => (m.asks.length ? m.asks[0].p : 100);
export const noBid = (m) => 100 - bestAsk(m); // what the NO side is bidding, in cents
export const spread = (m) => bestAsk(m) - m.bid;
export const crossed = (m) => !m.resolved && m.asks.length > 0 && m.bid >= bestAsk(m);
export const mid = (m) => (m.bid + bestAsk(m)) / 2;

// One stroke of the press: the best ask is lifted, $1 of collateral becomes one YES and one NO.
export function match(m) {
  if (!crossed(m)) return null;
  const level = m.asks.shift();
  m.last = level.p;
  m.pairs++;
  m.fills++;
  const deepest = m.asks.length ? m.asks[m.asks.length - 1].p : level.p;
  if (deepest < 100 - TICK) m.asks.push({ p: deepest + TICK, size: SIZES[(m.fills + 7) % SIZES.length] });
  return level;
}

export function resolve(m, outcome) {
  m.resolved = outcome;
  return m;
}

// Value of one share of a side, in cents: the last trade before resolution, 100 or 0 after.
export function valueOf(m, side) {
  if (m.resolved) return m.resolved === side ? PAYOUT : 0;
  const p = m.last ?? Math.round(mid(m)); // before a trade, the mark is the midpoint
  return side === "YES" ? p : 100 - p;
}
export const payout = (m) => (m.resolved ? m.pairs * PAYOUT : 0);
export const dollars = (cents) => `$${(cents / 100).toFixed(2)}`;
