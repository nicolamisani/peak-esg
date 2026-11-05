// =============================================================================
// Peak ESG — the model
// =============================================================================
// Pure. No DOM, no network, no randomness. Every figure a student sees comes
// from here, and tools/balance.mjs runs this same file to check the game is
// worth playing. Keep it that way: it is what made the Portfolio Builder's
// problems findable before a class saw them.
// =============================================================================

import { UNIVERSE, ACTIVITIES } from '../data/universe.mjs?v=11051207';
import { INDEX, YEARS, COMPRESSION, ENDINGS } from '../data/world.mjs?v=11051207';

// ---------------------------------------------------------------- constants --
export const START_AUM   = 500;              // EUR m
export const FEE_MIN     = 0.0010;           // 0.10%
export const FEE_MAX     = 0.0200;           // 2.00%
export const FEE_START   = 0.0080;           // the opening peer median
export const MAX_WEIGHT  = 3;
export const MIN_HOLDINGS= 3;
export const TRADES_YEAR = 2;                // position changes allowed per year
// Changing what the fund stands for. Investors bought the old promise, and a
// fixed slice of them leave when it changes — the figure the design settled on
// is 10-15%. The cut is one-off and recoverable through performance; what is
// not recoverable is the conviction money's view of a manager who changes her
// mind, which is why SWITCH_TRUST rides on the same coefficient as policy
// integrity (`c`). Return-driven money has c:0 and does not care at all.
export const SWITCH_CUT   = 0.12;            // of assets, once, on the switch
export const SWITCH_TRUST = 0.52;            // lasting, per switch, capped at 2
export const AUM_FLOOR   = 0.20;             // of starting AUM, per segment

export const DRAG = { severe: 20, moderate: 6 };   // pts of return, in the event year

export const SEGMENTS = [
  { id:'conv', name:'Conviction',     share:0.25,
    base:[ +0.08, +0.03, +0.01,  0.00, +0.01, +0.09 ],
    a:0.30, b:0.45, c:0.24, d:0.10, e:0.55, g:0.70, k:0.10, m:0.085 },
  { id:'main', name:'Mainstream ESG', share:0.50,
    base:[ +0.14, -0.05, -0.09, -0.07, -0.03, +0.15 ],
    a:1.10, b:0.20, c:0.09, d:0.30, e:0.30, g:0.25, k:0.26, m:0.060 },
  { id:'retn', name:'Return-driven',  share:0.25,
    base:[ -0.02, +0.03, +0.04, +0.03, +0.02, +0.04 ],
    a:1.60, b:0.00, c:0.00, d:0.50, e:0.12, g:0.00, k:0.30, m:0.035 }
];
//  base   the market trend for that segment: mainstream money pours in during
//         2022 and bleeds until it returns in 2027. That is the peak, mechanically.
//  m      the prospectus: conviction money reads the story hardest, return-
//         driven money barely at all
//  a      performance, per point of excess return over the index
//  b      the portfolio's ESG score, centred on 60
//  c      policy strictness — conviction money will not buy a fund that
//         promises nothing, which is what stops the null policy being optimal
//  d      fee above the live peer median, per percentage point
//  e      scandals in the holdings this year
//  g      the gap between what the fund wrote and what it holds
//  k      concentration. Professional money will not buy a fund of three names,
//         and UCITS limits say it partly cannot: one issuer is capped at 10% and
//         positions above 5% cannot exceed 40% in aggregate. That is a real
//         reason a sustainable fund cannot simply hold the ten best companies.

export const STRATEGIES = [
  { id:'exclude', name:'Negative screening',
    question:'Which activities will you exclude?',
    blurb:'Decide what the fund will not own, whatever it returns.' },
  { id:'best',    name:'Best in class',
    question:'How high in its industry must a company rank?',
    blurb:'Own the leaders of every industry, including the difficult ones.' },
  { id:'integrate', name:'ESG integration',
    question:'What is the minimum ESG score you will accept?',
    blurb:'One threshold, applied to every company, whatever it does.' }
];

// ------------------------------------------------------------------ returns --
// Cousin excesses are relative to their own market, so they are demeaned to make
// the twelve a self-contained universe: the average company then returns exactly
// the index each year, which is the "equal weight behaves like a global index"
// requirement. Compression then narrows the spread so the game is not won by
// stock-picking.
const MEAN_EXCESS = YEARS.map((_, t) =>
  UNIVERSE.reduce((s, c) => s + c.excess[t], 0) / UNIVERSE.length);

export const eventIn = (c, t) => c.events.find(e => e.year === YEARS[t]) || null;

export function ret(c, t, ending = null) {
  const ev = eventIn(c, t);
  const last = t === YEARS.length - 1;
  const e = (ending && last) ? ENDINGS[ending] : null;
  // 2027 is authored, so its adjustments are in points and bypass compression.
  return (e ? e.index : INDEX.ret[t])
       + (c.excess[t] - MEAN_EXCESS[t]) / COMPRESSION
       + (e ? (e.adj[c.id] || 0) : 0)
       - (ev ? DRAG[ev.sev] : 0);
}

export const byId = id => UNIVERSE.find(c => c.id === id);

// ------------------------------------------------------------------- policy --
// What a stated policy admits. The same shape for all three strategies, so
// strictness is one comparable number whatever the fund chose.
export function admits(policy, c) {
  if (!policy || !policy.strategy) return true;
  if (policy.strategy === 'exclude')
    return !c.activities.some(a => (policy.excluded || []).includes(a));
  if (policy.strategy === 'best')
    return rankOf(c) <= (policy.rank ?? 99);
  if (policy.strategy === 'integrate')
    return c.esg0 >= (policy.minScore ?? 0);
  return true;
}
export const rankOf = c => parseInt(String(c.rank), 10) || 99;

export const admitted = policy => UNIVERSE.filter(c => admits(policy, c));

// 0 = admits everyone and therefore promises nothing, 1 = admits the minimum.
// Capped at 9 of 12 excluded: past that, extra strictness buys no more credit.
export function strictness(policy) {
  const out = UNIVERSE.length - admitted(policy).length;
  return Math.max(0, Math.min(1, out / 9));
}

// ---------------------------------------------------------------- portfolio --
export function weightsOf(holdings) {
  const total = Object.values(holdings).reduce((s, w) => s + w, 0) || 1;
  const w = {};
  for (const [id, n] of Object.entries(holdings)) w[id] = n / total;
  return w;
}

export const held = holdings => Object.keys(holdings).map(byId);

export function portfolioReturn(holdings, t, ending = null) {
  const w = weightsOf(holdings);
  return held(holdings).reduce((s, c) => s + w[c.id] * ret(c, t, ending), 0);
}

export function portfolioESG(holdings, t) {
  const w = weightsOf(holdings);
  return held(holdings).reduce((s, c) => s + w[c.id] * c.esg[t], 0);
}

// Weighted exposure to this year's events, severe counting for more.
export function scandalExposure(holdings, t) {
  const w = weightsOf(holdings);
  return held(holdings).reduce((s, c) => {
    const ev = eventIn(c, t);
    return s + (ev ? w[c.id] * (ev.sev === 'severe' ? 1 : 0.30) : 0);
  }, 0);
}

// What the fund holds that its own stated policy says it should not.
export function breaches(policy, holdings) {
  const w = weightsOf(holdings);
  return held(holdings)
    .filter(c => !admits(policy, c))
    .map(c => ({ id:c.id, name:c.name, weight:w[c.id],
                 why: policy.strategy === 'exclude'
                      ? c.activities.map(a => ACTIVITIES[a]).join(', ')
                      : policy.strategy === 'best'
                        ? `ranked ${c.rank}`
                        : `scores ${c.esg0}` }));
}

// 0 to 1. Three sources, and the AI's over-claim score is one of them, so a fund
// can be caught by what it wrote as well as by what it holds.
export function greenwashGap(policy, holdings, overclaim = 0) {
  const byWeight = breaches(policy, holdings).reduce((s, b) => s + b.weight, 0);
  const nullPolicy = strictness(policy) < 0.05 ? 0.35 : 0;   // promises nothing
  return Math.max(0, Math.min(1, byWeight * 1.2 + nullPolicy + overclaim * 0.5));
}

// =============================================================================
// THE YEAR
// =============================================================================
// Demand is non-rival: no fund's gain is another's loss. But the peer median fee
// is computed live from the other funds, so undercutting still works — and if
// everyone undercuts, the median falls and the whole room earns less. That fee
// compression is real and it is deliberate; it belongs in the debrief.

export function newFund({ policy = null, fee = FEE_START } = {}) {
  const aum = {};
  SEGMENTS.forEach(s => { aum[s.id] = START_AUM * s.share; });
  return { aum, fee, holdings:{}, policy, overclaim:0, feesEarned:0,
           crisisCredit:0, appeal:{ conv:0, main:0, retn:0 },
           switches:0, switchPending:false, years:[] };
}

export const totalAUM = f => SEGMENTS.reduce((s, g) => s + f.aum[g.id], 0);

const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));

/**
 * One year. Pure: returns a new fund state and the decomposition the manager
 * sees. `crisisCredit` is set by the AI's judgement of a written response and
 * halves the reputational damage at most; it never touches the market loss.
 */
export function playYear(fund, t, { peerFee = FEE_START, ending = null } = {}) {
  // What the prospectus bought. The AI scores the copy once, per segment, in
  // -1..1; conviction money reads the story hardest and return-driven money
  // barely at all. Without this term the pitch could only ever cost you — the
  // over-claim feeds greenwashGap and nothing feeds the other way — which makes
  // writing it well a decision with no upside, the same defect the fee had
  // before it was made convex. It decays: year one is the launch, after that
  // performance does the talking.
  const A     = fund.appeal || { conv:0, main:0, retn:0 };
  const decay = 1 / (1 + 0.8 * t);
  const last = t === YEARS.length - 1;
  const E    = (ending && last) ? ENDINGS[ending] : null;
  const r      = portfolioReturn(fund.holdings, t, ending);
  const rIdx   = E ? E.index : INDEX.ret[t];
  const esg    = portfolioESG(fund.holdings, t);
  const expo   = scandalExposure(fund.holdings, t) * (1 - clamp(fund.crisisCredit, 0, 0.5));
  const strict = strictness(fund.policy);
  const gap    = greenwashGap(fund.policy, fund.holdings, fund.overclaim);
  // Signed, and asymmetric: being dearer than your peers costs more than being
  // cheaper earns. Undercutting has to work, or the cheap-and-big business model
  // does not exist — and because the median is live, a room that all undercuts
  // moves the median down and everybody earns less. That is fee compression, and
  // it is the point.
  // Convex above the median: a small premium is tolerated, a large one makes the
  // fund unsellable. Without the convexity the optimum sits at the top of the
  // range and the pricing decision has a dominant answer.
  const feeGapRaw = (fund.fee - peerFee) * 100;
  const feeGap    = feeGapRaw > 0 ? feeGapRaw * (1 + 2.5 * feeGapRaw)
                                  : feeGapRaw * 0.6;
  // effective number of positions, 1/HHI
  const wts  = Object.values(weightsOf(fund.holdings));
  const effN = 1 / (wts.reduce((x, w) => x + w * w, 0) || 1);
  const conc = Math.max(0, (5 - effN) / 5);

  const before = totalAUM(fund);
  const aum = {}, parts = {};
  let flowTotal = 0;

  for (const s of SEGMENTS) {
    const afterMarket = fund.aum[s.id] * (1 + r / 100);
    const comp = {
      base:    (E && s.id === 'main' && E.mainBase !== undefined) ? E.mainBase : s.base[t],
      perf:    s.a * (r - rIdx) / 100,
      esg:     s.b * (E ? E.esgTilt : 1) * (esg - 60) / 40,
      policy:  s.c * strict,
      fee:    -s.d * feeGap,
      scandal:-s.e * expo,
      green:  -s.g * gap,
      conc:   -s.k * conc,
      pitch:   s.m * (A[s.id] || 0) * decay,
      trust:  -s.c * SWITCH_TRUST * Math.min(2, fund.switches || 0)
    };
    const flow = clamp(Object.values(comp).reduce((x, y) => x + y, 0), -0.35, 0.45);
    const floor = START_AUM * s.share * AUM_FLOOR;
    // The one-off withdrawal, applied the year the strategy changed.
    const cut = fund.switchPending ? SWITCH_CUT : 0;
    aum[s.id] = Math.max(floor, afterMarket * (1 + flow) * (1 - cut));
    flowTotal += aum[s.id] - afterMarket;
    parts[s.id] = { comp, flow, from: fund.aum[s.id], afterMarket, to: aum[s.id] };
  }

  const after   = SEGMENTS.reduce((s, g) => s + aum[g.id], 0);
  const feeTake = fund.fee * (before + after) / 2;

  // the decomposition, in euros, aggregated across segments
  const euros = k => SEGMENTS.reduce((s, g) =>
    s + parts[g.id].afterMarket * parts[g.id].comp[k], 0);
  const decomposition = {
    year: YEARS[t], start: before, end: after,
    marketMove: before * (r / 100),
    flows: { base: euros('base'), performance: euros('perf'), esg: euros('esg'),
             policy: euros('policy'), fee: euros('fee'),
             scandal: euros('scandal'), greenwashing: euros('green'),
             concentration: euros('conc'), pitch: euros('pitch'),
             trust: euros('trust'),
             switched: fund.switchPending
               ? -SEGMENTS.reduce((x,g)=>x + parts[g.id].afterMarket *
                   (1 + parts[g.id].flow) * SWITCH_CUT, 0) : 0 },
    flowTotal, feeTake, ret: r, retIndex: rIdx, esg, strictness: strict, gap, expo,
    effN
  };

  return {
    fund: { ...fund, aum, feesEarned: fund.feesEarned + feeTake, crisisCredit: 0,
            switchPending: false,        // charged once, in the year it happened
            years: [...fund.years, decomposition] },
    decomposition
  };
}

/** Six years with fixed decisions — what the instrumentation plays. */
export const runGame = (o = {}) => runUnderEnding(o, o.ending || 'authored');

// The alternative 2027s, for the debrief. The model is deterministic and the
// ending is just a parameter, so every team can be re-scored under all four in
// no time at the end.
export function runUnderEnding({ holdings, policy, fee = FEE_START, overclaim = 0,
                                 appeal = null, peerFee = FEE_START }, ending = 'authored') {
  let f = newFund({ policy, fee });
  f.holdings = holdings; f.overclaim = overclaim;
  if (appeal) f.appeal = appeal;
  for (let t = 0; t < YEARS.length; t++) f = playYear(f, t, { peerFee, ending }).fund;
  return f;
}
