// =============================================================================
// Peak ESG — the news feed
// =============================================================================
// Every company, every year. Most years carry one short line: if news only
// appeared when something was wrong, news would BE the scandal and spotting it
// would take no judgement. The noise is what makes the signal worth finding.
//
//   w:'minor'  one line, usually nothing
//   w:'watch'  something a careful reader should note
//   w:'major'  the event itself
//
// Roughly one item in five is a real signal. Company news reaches that company's
// specialist, whatever its type; market news reaches the manager.

export const NEWS = {

DEF: [
 {y:2022,w:'major',t:'Order intake doubles',s:'European states lift defence budgets. The order book passes four years of revenue.'},
 {y:2023,w:'minor',t:'New naval radar contract',s:'A framework award from three navies, delivered from the Marine division.'},
 {y:2024,w:'watch',t:'Precision Guidance division expands',s:'The Slovak subsidiary adds a second line for guided munitions components.'},
 {y:2025,w:'minor',t:'Record half-year margin',s:'Operating margin reaches 13.1%, the highest in a decade.'},
 {y:2026,w:'major',t:'Cluster munitions report',s:'An NGO coalition names Hartline Precision Guidance as a component supplier for cluster munitions. Three pension clients open reviews.'},
 {y:2027,w:'major',t:'Order reviews begin',s:'With the war over, several states pause procurement pending review. The order book is marked down.'}],

TOB: [
 {y:2022,w:'minor',t:'Price rises hold',s:'Volumes fall 3%, revenue rises 6%. The pricing power is intact.'},
 {y:2023,w:'major',t:'Impairment on next-generation brands',s:'A €4.2bn write-down on the heated-tobacco portfolio acquired in 2019.'},
 {y:2024,w:'watch',t:'Rated industry leader again',s:'Brightleaf retains the top ESG rating in its sector for the fifth year, on disclosure and governance.'},
 {y:2025,w:'minor',t:'Dividend raised',s:'A 4% increase, the twenty-sixth consecutive year.'},
 {y:2026,w:'minor',t:'Menthol ban in two markets',s:'Modelled as a 1% revenue effect.'},
 {y:2027,w:'minor',t:'Nicotine pouches reach 11% of revenue',s:'Growth continues but slows.'}],

OIL: [
 {y:2022,w:'major',t:'Record annual profit',s:'Energy prices spike after the war begins. Calder posts the largest profit in its history.'},
 {y:2023,w:'watch',t:'Upstream capital expenditure rises',s:'Spending on new production is up 22% against a plan that promised a 40% cut by 2030.'},
 {y:2024,w:'major',t:'Transition target abandoned',s:'Calder drops the 2030 production-cut target. The chief executive calls the original plan "not investable".'},
 {y:2025,w:'minor',t:'Two renewables assets sold',s:'The offshore wind portfolio goes to an infrastructure fund.'},
 {y:2026,w:'minor',t:'Buyback extended',s:'A further €6bn returned to shareholders.'},
 {y:2027,w:'major',t:'Oil falls sharply',s:'Supply fears unwind with the peace. Calder’s cash flow guidance is cut twice in six months.'}],

UTI: [
 {y:2022,w:'watch',t:'Rate rises hit the build programme',s:'Every project is long-duration. The cost of capital rises faster than tariffs.'},
 {y:2023,w:'major',t:'Three projects deferred',s:'Verenda delays 2.1 GW of offshore wind as financing costs bite. The shares fall with the sector.'},
 {y:2024,w:'minor',t:'Grid investment approved',s:'A regulator approves €9bn of network spending to 2030.'},
 {y:2025,w:'minor',t:'Renewables reach 71% of generation',s:'Two years ahead of the stated plan.'},
 {y:2026,w:'minor',t:'Interim target verified',s:'An external body confirms the 2030 milestone is on track.'},
 {y:2027,w:'major',t:'Sentiment returns',s:'New mandates arrive asking for evidence rather than labels. Verenda is in almost all of them.'}],

BNK: [
 {y:2022,w:'minor',t:'Net interest income jumps',s:'Rate rises lift margins across the retail book.'},
 {y:2023,w:'watch',t:'Project finance league table',s:'Meridian ranks 7th among lenders to new oil and gas. The bank notes its own operations are carbon neutral.'},
 {y:2024,w:'minor',t:'Green bond framework updated',s:'Use-of-proceeds categories expanded.'},
 {y:2025,w:'major',t:'Financed emissions published',s:'An NGO coalition calculates Meridian’s financed emissions at forty times its operational footprint. The bank does not dispute the figure.'},
 {y:2026,w:'minor',t:'Coal policy tightened',s:'New thermal coal clients excluded; existing relationships continue to 2030.'},
 {y:2027,w:'minor',t:'Transition finance target set',s:'A €200bn target by 2030, with no interim milestone.'}],

MIN: [
 {y:2022,w:'major',t:'Metals prices spike',s:'Copper and nickel reach records. The coal division has its last strong year.'},
 {y:2023,w:'minor',t:'Coal run-off on schedule',s:'Two mines closed, closure provision increased.'},
 {y:2024,w:'watch',t:'Artisanal sourcing audited',s:'Third-party audit of all artisanal cobalt sources completed and published in full.'},
 {y:2025,w:'minor',t:'Battery supplier agreements',s:'Two long-term nickel contracts with European cell makers.'},
 {y:2026,w:'minor',t:'Community fund established',s:'A share of royalties directed to a locally governed fund.'},
 {y:2027,w:'watch',t:'Last coal mine closes early',s:'Four years ahead of the 2031 commitment.'}],

AUT: [
 {y:2022,w:'minor',t:'Supply chain normalises',s:'Semiconductor shortages ease; output recovers.'},
 {y:2023,w:'major',t:'Recall of 1.2 million vehicles',s:'A fuel-pump fault. Handled in six weeks, no injuries reported.'},
 {y:2024,w:'watch',t:'Criticised on electrification',s:'An NGO scorecard ranks Sakata last of eight on battery-electric ambition. The same report shows it has the lowest fleet-average emissions of the eight.'},
 {y:2025,w:'minor',t:'Hybrid demand exceeds forecast',s:'Production raised twice.'},
 {y:2026,w:'minor',t:'Solid-state battery pilot',s:'A pilot line announced for 2029.'},
 {y:2027,w:'watch',t:'Fleet emissions lead the sector',s:'Independent testing confirms the lowest real-world fleet emissions among volume makers.'}],

SEM: [
 {y:2022,w:'minor',t:'Record bookings',s:'Power semiconductor demand outruns capacity.'},
 {y:2023,w:'minor',t:'Second fab announced',s:'A new plant, with state support, in the same basin as the existing two.'},
 {y:2024,w:'major',t:'Automotive orders collapse',s:'Customers cut inventory hard. Revenue guidance is withdrawn.'},
 {y:2025,w:'major',t:'Discharge order',s:'Regulators find persistent fluorinated-compound discharge at two fabs. One line is halted pending remediation.'},
 {y:2026,w:'minor',t:'Remediation completed',s:'The halted line restarts at reduced output.'},
 {y:2027,w:'minor',t:'Grid inverter demand recovers',s:'Orders return with the renewables build.'}],

SFT: [
 {y:2022,w:'major',t:'Growth stocks de-rate',s:'Cloudline falls with the sector as rates rise. The business is unchanged.'},
 {y:2023,w:'major',t:'AI agents announced',s:'A new product line priced per outcome rather than per seat. The shares nearly double.'},
 {y:2024,w:'minor',t:'Net revenue retention 108%',s:'Slower than the 2021 peak, still positive.'},
 {y:2025,w:'watch',t:'Seat growth stalls',s:'Customers report smaller teams doing the same work. Analysts ask what AI does to per-seat pricing.'},
 {y:2026,w:'minor',t:'Data centre power purchase',s:'A long-term renewable supply agreement covering 90% of load.'},
 {y:2027,w:'minor',t:'Agent revenue reaches 14% of total',s:'Enough to offset the seat decline, not enough to reaccelerate.'}],

APP: [
 {y:2022,w:'watch',t:'Cost-of-living squeeze',s:'Volumes hold, margins fall. Tier-two mapping is still described as "in progress".'},
 {y:2023,w:'major',t:'Forced labour documented',s:'An investigation finds forced labour at a tier-two mill. Lumenwear says it had no visibility of that tier. Two retailers suspend the brand.'},
 {y:2024,w:'minor',t:'Supplier list published',s:'Tier one and, for the first time, part of tier two.'},
 {y:2025,w:'watch',t:'Consumer-group complaint upheld',s:'A regulator finds the sustainability claims on one line unsubstantiated. A small fine, and the line is renamed.'},
 {y:2026,w:'minor',t:'Resale platform launched',s:'Second-hand trade-in in four markets.'},
 {y:2027,w:'minor',t:'Tier-two mapping completed',s:'Four years after it was first described as in progress.'}],

FOOD: [
 {y:2022,w:'minor',t:'Input costs passed through',s:'Pricing holds margins roughly flat.'},
 {y:2023,w:'minor',t:'Palm traceability reconfirmed',s:'Two independent monitors verify 100% traceability to mill.'},
 {y:2024,w:'major',t:'Volumes fall as prices bite',s:'Consumers trade down to own-label across three categories.'},
 {y:2025,w:'watch',t:'Named in a deforestation headline',s:'A campaign names Marchetti among twenty buyers. The underlying data is from 2018, before the traceability programme.'},
 {y:2026,w:'minor',t:'Regenerative agriculture programme',s:'Extended to 40% of direct sourcing.'},
 {y:2027,w:'minor',t:'Water targets met early',s:'Withdrawal down 31% against a 2030 target of 25%.'}],

PHA: [
 {y:2022,w:'minor',t:'Vaccine revenue normalises',s:'Pandemic-era demand unwinds as expected.'},
 {y:2023,w:'minor',t:'Two generics launched',s:'Both at tiered prices in low-income markets.'},
 {y:2024,w:'major',t:'Plant suspension',s:'A quality inspection halts one site for four months. No product recall.'},
 {y:2025,w:'watch',t:'Second on the Access to Medicine Index',s:'Up one place, on licensing and tiered pricing.'},
 {y:2026,w:'minor',t:'3Rs report published',s:'Animal use down 18% year on year.'},
 {y:2027,w:'minor',t:'Patent cliff managed',s:'Two launches offset the expiry.'}]

};

export const newsFor = (id, year) => (NEWS[id] || []).find(n => n.y === year) || null;
