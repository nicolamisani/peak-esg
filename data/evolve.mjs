// =============================================================================
// Peak ESG — how a dossier changes, year by year
// =============================================================================
// Until now only the Media tab moved: the ESG score, the rank, the policy
// checklist, the NGO section and the board were all frozen at their 2021
// values for the whole game. An analyst who went back to a dossier in 2026
// found exactly what they had read in 2022, which makes the second reading
// pointless and the job smaller than it should be.
//
// Two things live here.
//
// EPS is an earnings index per company, 2022 to 2027, with 2021 = 100. It is
// authored, not derived: the game has prices but no earnings, and inventing a
// P/E by rolling the price alone would quietly assume flat earnings and print
// a number that looks measured. Each path follows that company's own news —
// Brightleaf's 2023 collapse is the €4.2bn write-down, Nordlys's 2024-25 hole
// is the order collapse and the discharge order, Calder's 2027 fall is the
// oil price. P/E is then price-over-earnings, both moving.
//
// CHANGES is sparse and cumulative: each year lists only what changed that
// year, and a dossier at year t is the 2021 baseline with every change up to
// and including t folded over it. Every entry traces to an event in
// data/news.mjs, so what an analyst reads in the dossier and what they were
// told in the news feed are the same story.

export const EPS = {
  //        2022  2023  2024  2025  2026  2027
  DEF:    [  115,  135,  158,  182,  196,  170 ],  // order book, then the reviews
  TOB:    [  106,   62,  112,  118,  117,  120 ],  // the 4.2bn write-down
  OIL:    [  210,  150,  128,  118,  112,   72 ],  // the windfall, then the peace
  UTI:    [  103,   99,  108,  117,  126,  138 ],  // financing costs, then the build
  BNK:    [  128,  141,  136,  128,  126,  130 ],  // rate rises lift the margin
  MIN:    [  168,  120,  104,  112,  126,  134 ],  // metals spike, coal runs off
  AUT:    [  108,   96,  112,  124,  131,  140 ],  // the recall, then hybrids
  SEM:    [  140,  132,   74,   58,   88,  120 ],  // order collapse, then the halt
  SFT:    [  122,  148,  166,  168,  174,  188 ],  // agents offset the seat decline
  APP:    [   92,   74,   86,   82,   94,  108 ],  // forced labour, then the complaint
  FOOD:   [  104,  110,   92,   96,  106,  116 ],  // pass-through, then trading down
  PHA:    [   78,   84,   96,  108,  116,  124 ]   // the pandemic revenue unwinds
};

// Only what changed. Anything absent is inherited from the year before.
export const CHANGES = {
  DEF: {
    2022: { rank: '2nd of 24',
            ngo: ['No active campaign.',
                  'Excluded by 4 of 5 large European ESG fund screens on weapons grounds, up from 3: two funds tightened their policy after the invasion.'] },
    2024: { rank: '4th of 24',
            policies: { supplierAudit: 'Yes, tier 1; tier 2 mapping begun at the Slovak subsidiary' } },
    2026: { rank: '7th of 24',
            ngo: ['An NGO coalition names Hartline Precision Guidance as a component supplier for cluster munitions. The company says the components are dual-use and the end-use certificates are in order.',
                  'Excluded by 4 of 5 large European ESG fund screens on weapons grounds.'],
            policies: { humanRights: 'Yes, group-wide, includes export controls — under review after the 2026 report' } },
    2027: { rank: '6th of 24',
            policies: { scope3: 'Partial — categories 1 and 11, with category 11 now covering the guided-munitions line' } }
  },

  TOB: {
    2023: { rank: '2nd of 11',
            policies: { transition: 'Yes, 2030 operational net zero — reaffirmed after the heated-tobacco write-down' } },
    2024: { rank: '1st of 11',
            ngo: ['No active campaign on conduct. Rated industry leader for the fifth year, on disclosure and governance.',
                  'Permanently excluded by most value-based screens on product grounds. The rating and the exclusion measure different things.'] },
    2026: { policies: { humanRights: 'Yes, group-wide, leaf supply chain included; living-income programme extended to three origins' } },
    2027: { rank: '1st of 11',
            ngo: ['No active campaign on conduct.',
                  'Permanently excluded by most value-based screens on product grounds.',
                  'Nicotine pouches reach 11% of revenue; two public-health bodies dispute the harm-reduction claim made for them.'] }
  },

  OIL: {
    2023: { rank: '6th of 31',
            policies: { transition: 'Yes — 40% production cut by 2030, though capital expenditure rose 22% against it this year' },
            ngo: ['Two active climate campaigns.',
                  'Named in shareholder resolutions on transition credibility in 2021 and again in 2023.'] },
    2024: { rank: '14th of 31',
            policies: { transition: 'No — the 2030 production-cut target was abandoned this year' },
            ngo: ['Three active climate campaigns; one escalated after the target was dropped.',
                  'The chief executive calls the original target "a commitment made in a different world".'] },
    2025: { rank: '19th of 31',
            policies: { scope3: 'Yes, categories 1 and 11 — renewables assets sold, so the comparison base changes' } },
    2026: { rank: '22nd of 31' },
    2027: { rank: '24th of 31',
            ngo: ['Three active climate campaigns.',
                  'With the peace, cash flow guidance is cut twice. Two campaigners now argue the transition case is financial rather than moral.'] }
  },

  UTI: {
    2022: { policies: { transition: 'Yes, 1.5°C aligned, validated interim targets — delivery now rate-sensitive' } },
    2023: { rank: '3rd of 44',
            ngo: ['No active campaign.',
                  'Cited approvingly in two NGO transition rankings, with a note that 2.1 GW has been deferred.'] },
    2025: { rank: '2nd of 44',
            ngo: ['No active campaign.',
                  'Cited approvingly in three NGO transition rankings. Renewables reach 71% of generation, two years ahead of plan.'] },
    2026: { policies: { transition: 'Yes, 1.5°C aligned; the 2030 interim milestone externally verified as on track' } },
    2027: { rank: '1st of 44' }
  },

  BNK: {
    2023: { rank: '9th of 58',
            ngo: ['One active campaign on fossil project finance.',
                  'Ranked 7th largest lender to new oil and gas in an NGO tally. The bank notes its own operations are carbon neutral, which the campaigners call beside the point.'] },
    2024: { rank: '14th of 58',
            policies: { transition: 'Yes — own operations only; green bond framework updated, use-of-proceeds categories expanded' } },
    2025: { rank: '22nd of 58',
            policies: { scope3: 'No financed-emissions disclosure — an NGO coalition has now calculated them at forty times operational emissions' },
            ngo: ['Two active campaigns on fossil project finance.',
                  'Financed emissions calculated externally at forty times operational emissions. The bank has not published its own figure.'] },
    2026: { rank: '26th of 58',
            policies: { transition: 'Yes — own operations, plus a thermal coal policy excluding new clients; existing relationships run to 2030' } },
    2027: { rank: '28th of 58',
            policies: { transition: 'Yes — own operations, coal policy, and a €200bn transition-finance target by 2030 with no interim milestone' } }
  },

  MIN: {
    2023: { rank: '15th of 36',
            policies: { transition: 'Yes — coal division in managed run-off, two mines closed, closure provision increased' } },
    2024: { rank: '11th of 36',
            ngo: ['The legacy coal campaign remains paused.',
                  'Third-party audit of all artisanal cobalt sources completed and published in full.',
                  'Named as a preferred supplier in two battery-supply studies.'] },
    2025: { rank: '8th of 36' },
    2026: { rank: '6th of 36',
            policies: { humanRights: 'Yes, group-wide, with a community grievance mechanism and a locally governed royalty fund' } },
    2027: { rank: '4th of 36',
            policies: { transition: 'Yes — last coal mine closed in 2027, four years ahead of the 2031 commitment' },
            ngo: ['The legacy coal campaign was closed when the last mine shut, four years early.',
                  'Named as a preferred supplier in three battery-supply studies.'] }
  },

  AUT: {
    2023: { rank: '16th of 29',
            ngo: ['Two active campaigns on lobbying against battery-electric mandates.',
                  'A recall of 1.2 million vehicles for a fuel-pump fault was handled in six weeks with no injuries reported.'] },
    2024: { rank: '12th of 29',
            ngo: ['Two active campaigns on lobbying against battery-electric mandates.',
                  'An NGO scorecard ranks Sakata last of eight on battery-electric ambition. The company argues its hybrid-led strategy abates more carbon per battery cell.'] },
    2025: { rank: '9th of 29' },
    2026: { rank: '7th of 29',
            policies: { transition: 'Yes, 2050 net zero; a solid-state pilot line announced for 2029' } },
    2027: { rank: '4th of 29',
            ngo: ['One active campaign on lobbying; the second was closed.',
                  'Independent testing confirms the lowest real-world fleet emissions among volume manufacturers — the hybrid argument, vindicated on the measure that counts.'] }
  },

  SEM: {
    2023: { rank: '3rd of 33',
            policies: { transition: 'Yes, 2027 carbon neutral on scopes 1 and 2; a third fab adds load' } },
    2024: { rank: '5th of 33' },
    2025: { rank: '12th of 33',
            policies: { supplierAudit: 'Yes, tier 1; chemical suppliers still excluded from scope, which regulators have now noticed' },
            ngo: ['Regulators find persistent fluorinated-compound discharge at two fabs. One line is halted.',
                  'The exclusion of chemical suppliers from the audit scope is cited in the finding.'] },
    2026: { rank: '14th of 33',
            policies: { supplierAudit: 'Yes, tier 1, now including chemical suppliers after the discharge order' },
            ngo: ['Remediation completed and the halted line restarted at reduced output.',
                  'One campaign remains open on groundwater monitoring.'] },
    2027: { rank: '11th of 33' }
  },

  SFT: {
    2023: { rank: '5th of 61' },
    2024: { rank: '4th of 61',
            policies: { scope3: 'Yes, full inventory — data-centre load now the largest category and rising' } },
    2025: { rank: '6th of 61',
            ngo: ['No active campaign.',
                  'Analysts question what per-outcome pricing does to seat growth; a small campaign asks what AI does to entry-level employment.'] },
    2026: { rank: '5th of 61',
            policies: { transition: 'Yes, net zero on scopes 1 and 2, 2040 for scope 3; 90% of data-centre load under long-term renewable supply' } },
    2027: { rank: '4th of 61',
            governance: { chair: 'Independent chair appointed; the founder remains chief executive' } }
  },

  APP: {
    2023: { rank: '21st of 47',
            policies: { humanRights: 'Yes — covers tier 1 suppliers. Forced labour found at a tier-two mill the company says it could not see.',
                        supplierAudit: 'Yes, tier 1. Tier 2 mapping still "in progress", now in its third year.' },
            ngo: ['An investigation documents forced labour at a tier-two mill. Two retailers suspend the brand.',
                  'The 2021 Disclosure Leader award is withdrawn by the awarding body.',
                  'A consumer group complaint about the recycled-content claims remains open.'] },
    2024: { rank: '18th of 47',
            policies: { supplierAudit: 'Yes, tier 1, and part of tier 2 — the supplier list is published for the first time' } },
    2025: { rank: '22nd of 47',
            ngo: ['A regulator upholds the consumer-group complaint: the sustainability claims on one line are unsubstantiated. A small fine follows.',
                  'The forced-labour finding remains unresolved at two mills.'] },
    2026: { rank: '19th of 47' },
    2027: { rank: '15th of 47',
            policies: { supplierAudit: 'Yes, tier 1 and tier 2 — mapping completed, four years after it was first called in progress' },
            ngo: ['Tier-two mapping completed. One campaign closed; one remains on remediation for the workers involved.'] }
  },

  FOOD: {
    2023: { rank: '9th of 52',
            ngo: ['The historic deforestation campaign remains closed.',
                  '100% of palm volume certified and traceable to mill, reconfirmed this year by two independent monitors.'] },
    2024: { rank: '7th of 52' },
    2025: { rank: '6th of 52',
            ngo: ['A campaign names Marchetti among twenty buyers in a deforestation headline. The underlying data is from 2018, before the traceability programme.',
                  '100% of palm volume certified and traceable to mill.'] },
    2026: { rank: '5th of 52',
            policies: { supplierAudit: 'Yes, satellite monitoring of all palm concessions, plus regenerative agriculture across 40% of direct sourcing' } },
    2027: { rank: '3rd of 52',
            policies: { transition: 'Yes, 1.5°C aligned with validated interim targets; water withdrawal down 31% against a 25% target' } }
  },

  PHA: {
    2023: { rank: '2nd of 38',
            ngo: ['No active campaign.',
                  'Ranked 2nd of 20 on the Access to Medicine Index. Two generics launched at tiered prices in low-income markets.',
                  'Animal testing where required by regulators; 3Rs programme published annually.'] },
    2025: { rank: '1st of 38',
            ngo: ['No active campaign.',
                  'Ranked 1st of 20 on the Access to Medicine Index.',
                  'Animal testing where required by regulators; 3Rs programme published annually.'] },
    2027: { policies: { transition: 'Yes, 2030 operational net zero — interim milestone met early' } }
  }
};

// The dossier as it stands at the end of year t (0 = 2022 … 5 = 2027), or the
// 2021 baseline for t < 0. Sparse and cumulative: fold every change up to t.
export function dossierAt(c, t, YEARS) {
  const out = { rank: c.rank, policies: { ...c.policies },
                ngo: [...c.ngo], governance: { ...c.governance } };
  const ch = CHANGES[c.id] || {};
  for (let i = 0; i <= t && i < YEARS.length; i++) {
    const d = ch[YEARS[i]];
    if (!d) continue;
    if (d.rank) out.rank = d.rank;
    if (d.ngo) out.ngo = d.ngo;
    if (d.policies) Object.assign(out.policies, d.policies);
    if (d.governance) Object.assign(out.governance, d.governance);
  }
  return out;
}
