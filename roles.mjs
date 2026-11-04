// Who researches what. Each analyst gets exactly one of each apple type — one
// obvious bad, one obvious good, one hidden bad, one hidden good — so no analyst
// has an easy set and every one of them has something real to find. Each also
// owns at least two event years, so nobody sits silent through the middle game.
export const DESKS = {
  a1: { name:'Analyst 1', ids:['TOB','UTI','DEF','AUT'] },
  a2: { name:'Analyst 2', ids:['OIL','SFT','BNK','MIN'] },
  a3: { name:'Analyst 3', ids:['APP','PHA','SEM','FOOD'] }
};
export const ROLES = {
  manager: { name:'Fund manager', blurb:'You decide the policy, the price and the portfolio. You will be told nothing about the companies — your analysts hold all of it.' },
  a1:      { name:'Analyst 1',    blurb:'Four companies are yours. Nobody else sees what you see.' },
  a2:      { name:'Analyst 2',    blurb:'Four companies are yours. Nobody else sees what you see.' },
  a3:      { name:'Analyst 3',    blurb:'Four companies are yours. Nobody else sees what you see.' }
};
// With fewer than four players the manager stays pure and the twelve are split
// evenly across whoever is there, so the asymmetry that forces the conversation
// survives every group size.
export function deskFor(role, analystsPresent = 3) {
  if (role === 'manager') return [];
  if (analystsPresent >= 3) return DESKS[role].ids;
  const all = [...DESKS.a1.ids, ...DESKS.a2.ids, ...DESKS.a3.ids];
  const idx = role === 'a1' ? 0 : 1;
  const per = Math.ceil(12 / analystsPresent);
  return all.slice(idx * per, (idx + 1) * per);
}
