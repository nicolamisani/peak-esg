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
    strap: 'A war in Europe, the sharpest rise in interest rates in forty years, and almost nowhere to hide.',
    body: [
      'Share prices around the world fell <b>13%</b> over the year. The companies that fell hardest were the ones whose value rested on profits a long way in the future \u2014 when borrowing costs jump, money you will not receive for ten years is worth a lot less today. Their profits mostly held up. What changed was how much investors were willing to pay for them.',
      'The war rearranged the winners within a fortnight. Governments across Europe tore up their defence budgets and wrote bigger ones, and the companies that build the equipment ended the year <b>up 12%</b> \u2014 one of only three industries to rise at all. Oil and gas rose for a simpler reason: Europe spent the year buying energy from anyone who was not Russia, at almost any price. Mining held its ground on the same logic.',
      'Everything that depends on cheap money or on people spending freely was hit hard. <b>Software fell 31%</b> and chipmakers <b>23%</b>. Clothing fell <b>29%</b> and carmakers <b>21%</b>, as households faced higher prices and higher mortgage payments at the same time. Even the drug companies, normally a safe place to hide, lost a fifth of their value as the extra sales from the pandemic disappeared. Banks fell less than the market, because higher interest rates widen the gap between what they pay savers and what they charge borrowers. Tobacco, utilities and packaged food did what they always do in a bad year: they lost less.',
      'The money told a different story from the prices. Sustainable funds took in more money than ever, for the fourth year running, and more of it than ever came from ordinary investors rather than specialists. The worst year in a decade for the kind of companies these funds hold was also the year the most money arrived.'
    ]
  },
  2023: {
    strap: 'Interest rates stopped rising, and last year\u2019s biggest losers led the recovery.',
    body: [
      'Share prices rose <b>20%</b>. Almost all of the gain came from the same companies that had fallen furthest the year before. Once investors decided that interest rates had peaked, everything they had marked down in 2022 was marked back up.',
      '<b>Software rose 50%</b>, the best of the twelve, with chipmakers <b>up 28%</b>. Clothing <b>rose 37%</b> and carmakers <b>26%</b>, because shoppers kept spending despite everything. Banks had a more dramatic year than their <b>20%</b> suggests: a handful of American banks collapsed in the spring and for a fortnight it looked like something bigger, then it passed.',
      'What lagged is the more interesting half. Oil and gas gave back part of the war premium as energy prices came down, and mining went with it. The industries that protected you in the crash did very little in the recovery \u2014 <b>tobacco returned 2%</b> against a market up 20%. Utilities did better but still trailed, held back by the same high borrowing costs that had hurt them in the first place: building power lines and wind farms is paid for with debt. Defence kept its gains without adding to them.',
      'And the money turned around. For the first time since sustainable investing went mainstream, more money left these funds than arrived, in several large markets. The investors who left were not the committed ones \u2014 specialist sustainable funds were broadly stable. What left was the money that had arrived in 2021 because the label was doing well, and found out in 2022 that it was not.'
    ]
  },
  2024: {
    strap: 'A strong year almost everywhere \u2014 and the year the excluded companies led it.',
    body: [
      'A good year, and an unusually broad one: share prices rose <b>27%</b> and almost everything went up.',
      '<b>Tobacco rose 42%</b>, its best year in a decade and fifteen points ahead of the market, for no exotic reason: these companies can raise prices without losing customers, they generate enormous amounts of cash, and investors had priced them as though the business was about to disappear. Utilities were close behind, <b>up 35%</b>, once the market worked out who sells the electricity that data centres consume. Oil and banks also beat the market. <b>A fund that had excluded tobacco, oil and the banks that lend to them trailed the market badly this year</b> \u2014 for reasons that have nothing to do with whether those exclusions were right.',
      'The wave of investment in artificial intelligence began in earnest, and it was narrower than the headlines suggested. A handful of very large companies took most of the money and most of the gains. The rest of the chip industry \u2014 the firms making the ordinary chips that go into cars, factories and washing machines \u2014 had its <b>worst year of the six, up only 9%</b> against a market up 27%.',
      'Meanwhile several of the largest fund managers quietly dropped the word "sustainable" from fund names and sales material. The labels changed considerably faster than the holdings did. Money kept leaving.'
    ]
  },
  2025: {
    strap: 'A thin year. Investors paid only for profits they could already see.',
    body: [
      'The rise slowed sharply: <b>7%</b> for the year, and most of that was money moving between industries rather than the market going up.',
      'Defence was the standout for the third time in four years, <b>up 25%</b> \u2014 the rearmament programmes signed in 2022 finally reached the factories, and orders turned into actual sales. Tobacco carried on climbing, <b>up 18%</b>. Drug companies recovered on a run of new approvals. Clothing surprised everyone at <b>16%</b>, as shoppers written off twice kept buying.',
      'The casualties were last year\u2019s winners. <b>Software fell 14%</b> as investors started asking what all that spending on artificial intelligence would actually earn. Chipmakers drifted. Carmakers finished flat, caught between an electric transition that cost more than planned and buyers unwilling to pay for it. Oil settled: with prices back to roughly where they were before the war, the windfall years ended, and the industry returned <b>4%</b> in a market that returned 7%.',
      'The politics turned openly hostile. Some large clients began asking fund managers to prove they were <i>not</i> applying sustainability screens \u2014 a question nobody was being asked three years earlier. Money kept leaving these funds.'
    ]
  },
  2026: {
    strap: 'A better year, and the investment wave finally reached the rest of the supply chain.',
    body: [
      'Share prices rose <b>14%</b>, and the leadership had very little to do with the previous twelve months.',
      'Chipmakers led by a distance, <b>up 37%</b>. Two years after the artificial-intelligence spending began, it reached the companies making the unglamorous components, and the firms that had been the market\u2019s worst performers in 2024 were its best in 2026. Mining followed the same logic one step further back, <b>up 17%</b>: electric cars, new power lines and data-centre construction all end up as demand for copper and for the metals inside a transformer.',
      'Defence held its gains, <b>up 19%</b>. Banks, utilities, carmakers, drug companies and tobacco all finished close to the market. <b>Software managed only 7%</b> \u2014 not a collapse, but a year of being asked to justify itself. Clothing was <b>flat</b>, the one real disappointment: heavy discounting moved the stock but made no money.',
      'The shift to cleaner energy carried on without the noise \u2014 installation figures kept rising while the talk went quiet. Regulators stopped issuing guidance and started issuing fines, and the first large penalties for greenwashing landed on funds whose documents had promised more than their holdings delivered. The outflows slowed to a trickle. Nothing had recovered, but very little was still leaving.'
    ]
  },
  2027: {
    strap: 'The war ends, the fear premium disappears, and the money comes back \u2014 with conditions.',
    body: [
      'Share prices rose <b>22%</b>, and the leadership flipped faster than in any of the five years before it. A ceasefire in Europe held, and then became an agreement.',
      'Everything that had been bid up on fear and scarcity came back down. <b>Oil managed only 13%</b> in a market up 22%, as the worry about supply disappeared faster than anyone had expected. <b>Defence was worse, up 12%</b>: governments sent procurement programmes back for review, and the ten-year order books that had justified the high prices were quietly reopened. Tobacco, which led the market in 2024, finished second from last \u2014 that re-pricing had already happened.',
      'The reversal ran the other way with equal force. Clothing and carmakers led, both <b>up around 28%</b>, helped by cheaper energy and the first real increase in household spending power in six years. Chipmakers matched them. Utilities, packaged food and drug companies all beat the market. Mining and banks finished close to it.',
      'And the money came back. Sustainable funds took their largest inflows since 2021 \u2014 but this time it arrived with conditions attached: evidence, a published list of holdings, and a policy that could be checked against what the fund actually owned. <b>The managers who quietly dropped the language in 2024 found that picking it back up cost them something.</b>'
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

export const SCENARIO = `It is the beginning of 2022. Last year brought a record inflow of money
into ESG funds, and the trade press is asking whether ESG has peaked. You have been given the job
of launching one, and six years to show your boss she was right to trust you.`;
