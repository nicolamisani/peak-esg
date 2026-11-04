// =============================================================================
// Peak ESG — the world, 2022 to 2027
// =============================================================================
// Five real years and an authored sixth. Index returns are approximate annual
// total returns for global developed equity; they set the ground every company
// is measured against. 2026 is the year in progress as this was written; 2027 is
// invented (see SCENARIO below) and is the scenario the game argues from, never
// a forecast.
//
// CONFIDENCE markers: [h] high, [m] medium, [l] low / estimated.

export const YEARS = [2022, 2023, 2024, 2025, 2026, 2027];

export const INDEX = {
  //        2022   2023   2024   2025   2026   2027
  ret:    [ -18,   +22,   +17,   +12,    +8,   +10 ],
  conf:   ['h',   'h',   'h',   'm',   'l',   'n/a'],
};

// How hard the excess returns are squeezed. 1 = raw cousin data. The document's
// argument for compressing: wide dispersion turns this into a stock-picking game
// with ESG as decoration. Set by instrumentation — see tools/balance.mjs.
export const COMPRESSION = 2.5;

// The macro beats. Named by what happened, never by country or politician. These
// reach the fund manager, not the specialists.
export const MACRO = {
  2022: [
    { t: 'A European land war begins', s: 'Energy and defence rally hard. Everything else falls.' },
    { t: 'Inflation returns', s: 'Central banks raise rates at the fastest pace in forty years.' },
    { t: 'Sustainable funds take record inflows for a fourth year', s: 'The money arrived last year. The question is whether it stays.' }
  ],
  2023: [
    { t: 'Rates keep climbing, then stop', s: 'Long-duration assets — renewables above all — are repriced hardest.' },
    { t: 'A regional banking scare', s: 'Brief, contained, and a reminder that balance sheets matter again.' },
    { t: 'Sustainable fund flows turn negative in several markets', s: 'The first outflows since the category became mainstream.' }
  ],
  2024: [
    { t: 'An artificial-intelligence capital cycle begins', s: 'Capital crowds into a narrow set of names. Industrial demand stays weak.' },
    { t: 'Several large asset managers quietly rename ESG funds', s: 'Labels are dropped faster than holdings change.' }
  ],
  2025: [
    { t: 'Energy prices settle', s: 'The windfall years end.' },
    { t: 'Anti-ESG politics reaches procurement', s: 'Some clients now ask funds to prove they are NOT applying screens.' }
  ],
  2026: [
    { t: 'The transition grinds on without the enthusiasm', s: 'Deployment continues; the narrative has gone quiet.' },
    { t: 'Greenwashing enforcement produces its first large fines', s: 'Regulators move from guidance to penalties.' }
  ],
  2027: [
    { t: 'The war in Europe ends', s: 'Defence orders are reviewed. Energy risk premia unwind.' },
    { t: 'Oil falls sharply', s: 'Supply fears subside faster than anyone modelled.' },
    { t: 'Public sustainability sentiment recovers', s: 'A new cohort of mandates arrives, and this time it asks for evidence.' }
  ]
};

// The endings. 2027 is invented, so its adjustments are authored directly in
// percentage points rather than passed through the cousin compression, and the
// year is deliberately large: it is the year the game argues from, and a small
// one cannot reorder six years of accumulated fees.
//
//   index     the market return that year
//   adj       added to a company's return, in points
//   esgTilt   multiplier on how much the ESG score drives flows that year
//   mainBase  the mainstream segment's flow trend that year
export const ENDINGS = {
  authored: { label: 'The war ends, oil falls, sentiment recovers',
    index:+22, esgTilt:1.8, mainBase:+0.26,
    adj:{ DEF:-34, OIL:-26, MIN:-6, TOB:-8, UTI:+26, SEM:+18, AUT:+12, FOOD:+8, APP:+6 } },
  grind:    { label: 'The war grinds on',
    index:-4,  esgTilt:0.7, mainBase:-0.04,
    adj:{ DEF:+34, OIL:+22, MIN:+14, BNK:+4, UTI:-12, SEM:-14, AUT:-10, APP:-12, SFT:-8 } },
  cold:     { label: 'Sentiment does not recover',
    index:+9,  esgTilt:0.3, mainBase:-0.14,
    adj:{ UTI:-26, SEM:-16, AUT:-12, FOOD:-8, APP:-10, OIL:+16, TOB:+16, DEF:+10, BNK:+6 } },
  hot:      { label: 'Oil stays high',
    index:+2,  esgTilt:0.8, mainBase:-0.02,
    adj:{ OIL:+40, MIN:+26, DEF:+10, BNK:+6, UTI:-14, AUT:-18, APP:-14, SFT:-10, SEM:-8 } }
};

export const SCENARIO = `It is the beginning of 2022. Last year there was a record inflow of
money into ESG funds. Is ESG at its peak? You have been given the job of launching one, and you
have five years to show your boss that she did well to trust you.`;
