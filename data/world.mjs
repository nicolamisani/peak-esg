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
  ret: [ -13, +20, +27,  +7, +14, +10 ],
  conf:   ['h',   'h',   'h',   'm',   'l',   'n/a'],
};

// How hard the excess returns are squeezed. 1 = raw cousin data. The document's
// argument for compressing: wide dispersion turns this into a stock-picking game
// with ESG as decoration. Set by instrumentation — see tools/balance.mjs.
export const COMPRESSION = 2.5;

// The year in review, written after the year has run.
// -----------------------------------------------------------------------------
// These used to be shown BEFORE the year was traded, under the heading "the
// world, before you decide anything", which handed the manager the answer to
// the decision she was about to make. They now arrive where an investor really
// gets them: afterwards, in January, in somebody else's research note.
//
// Every claim here is checked against what the model actually pays out — see
// the realised table in VERIFICATION.md. A review that said defence had a good
// year in a year defence lagged would teach the opposite of the lesson.
//
// Written around the twelve industries without ever listing them, and with no
// company named: the review is market commentary, not a key to the game.
export const REVIEW = {
  2022: {
    strap: 'A land war, the fastest tightening in forty years, and nowhere obvious to hide.',
    body: [
      'Global developed equity ended the year down thirteen per cent in euro terms. The decline was led by the long-duration end of the market, where valuations had been set on the assumption that money would stay cheap. It did not spare the defensive parts of the market so much as hurt them less.',
      'The war reordered the leadership table within a fortnight. Defence budgets across Europe were rewritten upwards and the prime contractors ended the year among the handful of industries that rose at all. Energy did the same for a simpler reason: Europe spent the year buying hydrocarbons from anyone who was not Russia, at almost any price. Industrial metals held their ground on the same logic, then gave part of it back as recession talk spread.',
      'Everything geared to the discount rate or to the consumer was repriced hard. Software fell furthest and the chipmakers were close behind, and the fall was almost entirely multiple rather than earnings — a high rating is a liability in a year when the risk-free rate triples. Discretionary apparel and the carmakers suffered as a cost-of-living squeeze and higher borrowing costs arrived together. Even the drug makers, usually a refuge, gave up a fifth of their value as pandemic earnings washed out. Lenders fell less than the market: rising rates widen margins even as they shrink loan books. The old defensive trades — the tobacco companies, the regulated utilities, the packaged-food names — did what they are built to do, which is lose less.',
      'Flows told a different story from prices. Sustainable funds took money all year, a fourth consecutive record, and the mainstream share of it was the largest yet. That is worth sitting with. The worst year in a decade for the assets most sustainable funds are built on was also the year the most money arrived. Whether that is conviction or inertia is the question the next few years will answer.'
    ]
  },
  2023: {
    strap: 'The rate shock was priced rather than repeated, and last year\u2019s casualties led the recovery.',
    body: [
      'Developed equity recovered twenty per cent. Almost all of it came from the names that had fallen furthest: once the market decided the tightening cycle had an end, the long-duration multiple came back about as fast as it had gone.',
      'Software led by a wide margin and the chipmakers came with it. Discretionary apparel and the carmakers rebounded on a consumer who kept spending through the squeeze. The lenders had a more interesting year than their return suggests — a short, sharp scare over a handful of regional balance sheets in the spring, then a full recovery, finishing roughly in line with the market.',
      'What lagged is the more instructive half. The energy complex gave back part of the war premium as prices normalised, and the miners went with it. The defensive trades that earned their keep in the drawdown did very little in the rally: the tobacco names in particular finished the year almost exactly where they started, a two per cent return against a market up twenty. The regulated utilities did better but still trailed, held back by the same cost of capital that had hurt them in the first place — a business built on long-dated capital projects does not benefit from a rate rally the way a software business does. Defence held its gains without adding to them.',
      'And the flows turned. For the first time since the category became mainstream, sustainable funds saw net outflows in several large markets. The money that left was not the money that believed: dedicated sustainable mandates were broadly stable. What left was the money that arrived in 2021 because the label was performing, and discovered in 2022 that it was not.'
    ]
  },
  2024: {
    strap: 'A broad advance of twenty-seven per cent, and the year the screened-out names led it.',
    body: [
      'A strong year and an unusually broad one. Nominal growth stayed firm, the first rate cuts arrived, and almost everything rose.',
      'The uncomfortable fact is what led. The tobacco companies had their best year in a decade, more than fifteen points ahead of the market, on nothing more exotic than pricing power, cash generation and a starting valuation that assumed terminal decline. The regulated utilities were close behind, repriced sharply upwards once the market worked out who sells the electricity a data centre consumes. Energy and the lenders also beat the index. A portfolio built by removing the tobacco names, the oil majors and the banks that finance them trailed the market by a wide margin this year — for reasons that have nothing at all to do with whether the removals were justified.',
      'The capital cycle around artificial intelligence began in earnest, and it was narrower than the headlines implied. A handful of very large names absorbed most of the capital and most of the return. The rest of the semiconductor supply chain — the analogue and industrial end, which sells into cars, factories and appliances rather than into data centres — had its worst year of the five, up nine per cent against a market up twenty-seven. Being in the right industry was worth nothing this year; being in the right part of it was worth everything.',
      'Against all that, several large asset managers quietly dropped sustainability language from fund names and mandates. Labels changed considerably faster than holdings did. Mainstream sustainable flows had their worst year of the cycle while dedicated money stayed put. If there was a peak, this is the year it became visible.'
    ]
  },
  2025: {
    strap: 'A thin seven per cent, and a market that would only pay for cash flows it could already see.',
    body: [
      'The advance slowed sharply. Seven per cent for the year, and a market that spent most of it rotating rather than rising.',
      'Defence was the standout for the third time in four years: the rearmament programmes signed in 2022 reached the production stage and order books converted into revenue. The tobacco re-rating continued. The drug makers recovered on a run of approvals. Apparel surprised, as a consumer who had been written off twice kept buying.',
      'The casualties were the previous winners. Software gave up fourteen per cent as the market began asking what all that capital spending would earn. The semiconductor names drifted. The carmakers finished flat, caught between an electric transition costing more than planned and a buyer unwilling to pay for it. Energy settled: with prices back near their pre-war range the windfall years ended, and the sector returned four per cent in a market that returned seven. Mining did the same.',
      'The politics turned openly. Some institutional clients began asking managers to demonstrate that they were not applying sustainability screens — a question nobody was being asked three years earlier. Mainstream outflows continued. For a fund whose prospectus was written in 2022, this was the year the audience changed.'
    ]
  },
  2026: {
    strap: 'Fourteen per cent, and the capital cycle finally reaches the rest of the supply chain.',
    body: [
      'A better year and a broader one, with leadership that had very little to do with the previous twelve months.',
      'The semiconductor complex led by a distance. Two years after the capital cycle began, the spending reached the parts of the chain that make the unglamorous components, and the industrial and analogue names that were the market\u2019s worst performers in 2024 were its best in 2026. Mining followed the same logic one step further back: electrification, grid build-out and data-centre construction all end up as demand for copper and for the metals that go into a transformer.',
      'Defence held its gains. The lenders, the utilities, the carmakers and the drug makers all finished close to the index, as did the tobacco names. Software managed only seven per cent — not a collapse, but a year of being asked to justify a rating. Apparel was flat, the one real disappointment, as discount-driven volume failed to convert into margin.',
      'The transition itself continued without the noise: deployment numbers kept rising while the narrative went quiet. Regulators moved from guidance to penalties, and the first large greenwashing fines landed on funds whose documents had promised more than their holdings delivered. Outflows slowed to a trickle. Nothing had recovered, but nothing much was leaving either.'
    ]
  },
  2027: {
    strap: 'The war ends, the risk premium unwinds, and the money comes back with conditions.',
    body: [
      'Twenty-two per cent, and the fastest reversal of leadership in the five years we have been writing these notes. A ceasefire in Europe held, and then became an agreement.',
      'Everything that had been bid up on scarcity and fear unwound. Oil fell sharply as supply fears subsided faster than anyone had modelled, and the sector managed thirteen per cent in a market up twenty-two — its worst year relative to the index since the war began. Defence was worse still: procurement programmes went back for review and the ten-year order books that had justified the re-rating were quietly reopened. The tobacco names, which led the market in 2024, finished second from last; that re-rating had already happened.',
      'The reversal ran the other way with equal force. The consumer cyclicals led — apparel and the carmakers both up around twenty-eight per cent on lower energy costs and the first real-income tailwind in six years. Semiconductors matched them. The utilities, the packaged-food names and the drug makers all beat the index. Mining and the lenders finished close to it.',
      'And the money returned. Sustainable mandates took their largest inflows since 2021, and this time the mainstream share arrived with conditions attached: evidence, holdings-level disclosure, and a policy statement that could be checked against the portfolio. The funds that quietly dropped the language in 2024 discovered that it costs something to pick it back up.'
    ]
  }
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
    adj:{ DEF:-24, OIL:-22, MIN:-6, TOB:-10, UTI:+12, SEM:+16, AUT:+14, FOOD:+12, APP:+14, PHA:+6, SFT:+8 } },
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
