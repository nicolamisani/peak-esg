// =============================================================================
// Who researches what
// =============================================================================
// Each desk gets exactly one of each apple type — one obvious bad, one obvious
// good, one hidden bad, one hidden good — so no analyst has an easy set and
// every one of them has something real to find. Each also owns at least two
// event years, so nobody sits silent through the middle game.
//
// Analysts do not choose a desk and are not numbered. They join a fund and the
// worker hands out desks in join order, because a room of students asked to
// pick "Analyst 1, 2 or 3" produces teams with two of one and none of another,
// and nothing in the game notices.
export const DESKS = {
  a1: { name:'First desk',  ids:['TOB','UTI','DEF','AUT'] },
  a2: { name:'Second desk', ids:['OIL','SFT','BNK','MIN'] },
  a3: { name:'Third desk',  ids:['APP','PHA','SEM','FOOD'] }
};
export const SEATS = ['a1', 'a2', 'a3'];
export const MAX_ANALYSTS = SEATS.length;

export const ROLES = {
  manager: { name:'Create the fund',
             blurb:'You set the ESG strategy, the price and the portfolio. You see no company information; your analysts hold it.' },
  analyst: { name:'Join a fund as an analyst',
             blurb:'Four companies are yours to research. The manager sees none of them, so you have to explain what you find.' }
};

// With fewer than three analysts the manager still researches nothing and the
// twelve are split evenly across whoever is there, so the asymmetry that forces
// the conversation survives every group size.
export function deskFor(seat, analystsPresent = 3) {
  if (!seat || seat === 'manager') return [];
  if (analystsPresent >= 3) return (DESKS[seat] || DESKS.a1).ids;
  const all = [...DESKS.a1.ids, ...DESKS.a2.ids, ...DESKS.a3.ids];
  const idx = SEATS.indexOf(seat);
  const per = Math.ceil(12 / Math.max(1, analystsPresent));
  return all.slice(idx * per, (idx + 1) * per);
}
