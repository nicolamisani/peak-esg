// =============================================================================
// Transport
// =============================================================================
// Two backends behind one interface. `local` uses BroadcastChannel so several
// tabs on one machine stay in step — enough to build and test against. `fire`
// talks to the Firestore session the instructor's Mac is driving.
//
// Very little has to cross the wire, because demand is non-rival: each fund's
// simulation is independent. The instructor broadcasts the year; each manager
// publishes a small state doc; everyone reads the peer median and the board.
// Analysts need nothing but the year — their news is a pure function of the
// year and the companies on their desk.

const LOCAL_KEY = 'peakesg_local_v1';

export function makeNet({ mode = 'local', code = '0000' } = {}) {
  return mode === 'fire' ? fireNet(code) : localNet(code);
}

function localNet(code) {
  const subs = [];
  const ch = typeof BroadcastChannel !== 'undefined'
    ? new BroadcastChannel('peakesg_' + code) : null;
  const read  = () => { try { return JSON.parse(localStorage.getItem(LOCAL_KEY + code)) || base(); }
                        catch { return base(); } };
  // BroadcastChannel does not deliver to the tab that posted, so a single tab
  // would never see its own change. Notify local subscribers directly as well.
  const write = s => { localStorage.setItem(LOCAL_KEY + code, JSON.stringify(s));
                       ch && ch.postMessage(s); subs.forEach(f => f(s)); };
  const base  = () => ({ year:0, stage:'setup', countdownEnds:null, groups:{} });
  if (ch) ch.onmessage = e => subs.forEach(f => f(e.data));
  return {
    mode:'local', code,
    onState(f){ subs.push(f); f(read()); },
    session(){ return read(); },
    setSession(patch){ write({ ...read(), ...patch }); },
    publish(gid, doc){ const s = read(); s.groups[gid] = doc; write(s); },
    groups(){ return read().groups; },
    peerFee(fallback){ const g = Object.values(read().groups).filter(x=>x && x.fee);
      if (!g.length) return fallback;
      const f = g.map(x=>x.fee).sort((a,b)=>a-b); return f[(f.length/2)|0]; }
  };
}

// Firestore. The existing Greenmarket rules already fit: a student may create
// and edit only their own group document while the session is open, and may read
// the session doc and anything published under public/. Nothing to deploy.
function fireNet(code) {
  let db, uid, subs = [], cache = { year:0, stage:'setup', countdownEnds:null, groups:{} };
  const ready = (async () => {
    const [{ initializeApp }, auth, fs, cfg] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js'),
      import('./firebase-config.js')
    ]);
    const app = initializeApp(cfg.FIREBASE_CONFIG);
    const a = auth.getAuth(app); await auth.signInAnonymously(a);
    uid = a.currentUser.uid; db = fs.getFirestore(app);
    fs.onSnapshot(fs.doc(db, 'sessions', code), d => {
      const v = d.data() || {}; cache = { ...cache, ...v }; subs.forEach(f => f(cache)); });
    fs.onSnapshot(fs.doc(db, 'sessions', code, 'public', 'board'), d => {
      cache = { ...cache, board: (d.data() || {}).funds || [] }; subs.forEach(f => f(cache)); });
    // my own group document, which the worker writes assessments back into and
    // which the rules let only me read
    fs.onSnapshot(fs.doc(db, 'sessions', code, 'groups', uid), d => {
      const v = d.data() || {};
      cache = { ...cache, mine: { aiPitch: v.aiPitch || null, aiCrisis: v.aiCrisis || null,
                                  teamFlags: v.teamFlags || null, teamResult: v.teamResult || null,
                                  desk: v.desk || null, full: !!v.full } };
      subs.forEach(f => f(cache)); });
    return fs;
  })();
  return {
    mode:'fire', code,
    async onState(f){ subs.push(f); await ready; f(cache); },
    session(){ return cache; },
    async setSession(){ /* only the instructor's worker writes the session */ },
    async publish(gid, doc){ const fs = await ready;
      await fs.setDoc(fs.doc(db, 'sessions', code, 'groups', uid),
        { ownerUid: uid, submitted: false, score: null, peak: doc }, { merge: true }); },
    groups(){ return (cache.board || []).reduce((o,f)=>(o[f.id]=f,o),{}); },
    peerFee(fallback){ const g = (cache.board || []).filter(x=>x && x.fee);
      if (!g.length) return fallback;
      const f = g.map(x=>x.fee).sort((a,b)=>a-b); return f[(f.length/2)|0]; }
  };
}
