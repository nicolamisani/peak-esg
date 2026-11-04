// =============================================================================
// Peak ESG — the client   ·   published 2026-11-04 16:07 UTC
// =============================================================================
// One screen, one kind of information, with a visible sense of where you are.
// Everything numeric comes from model/model.mjs; nothing is decided here.
// =============================================================================
import * as M from './model/model.mjs?v=11041607';
import { UNIVERSE, ACTIVITIES } from './data/universe.mjs?v=11041607';
import { INDEX, YEARS, REVIEW, SCENARIO, ENDINGS } from './data/world.mjs?v=11041607';
import { NEWS, newsFor } from './data/news.mjs?v=11041607';
import { ROLES, DESKS, SEATS, MAX_ANALYSTS, deskFor } from './roles.mjs?v=11041607';
import { makeNet } from './net.mjs?v=11041607';

// ------------------------------------------------------------------ state ---
const S = {
  code:'', role:null, fundName:'', screen:'intro', net:null,
  teamId:null,                 // the manager's uid — what makes four devices a fund
  switches:0, switching:false,
  who:'',                      // the player's own name, as they typed it
  roster:null,                 // who else is on this fund, from the worker
  desk:null,                   // a1/a2/a3, assigned by the worker in join order
  analystsPresent:3,
  year:0, phase:'setup',
  resolvedYear:null,           // the last year this fund actually ran
  adds:0, drops:0,             // this year's budgets, reset when a year opens
  policy:{ strategy:null, excluded:[], rank:5, minScore:50 },
  policyText:'', fee:M.FEE_START,
  reviewYear:0, reviewTo:null,     // which year's review, and where it leads
  holdings:{}, fund:null, lastResult:null,
  openCo:null, openSect:'prof', flags:{}, trades:0,
  bot:[], botOpen:false, teamOpen:false, aside:null,
  ejected:{},                  // {uid: name} the manager has removed
  peerFee:M.FEE_START
};
const KEY = 'peakesg_me_v1';
// A pristine copy of the opening state. Restoring a saved game is the one
// thing that can poison a boot, so we keep a way back to a clean start.
const FRESH = JSON.parse(JSON.stringify(S));
function startClean(){
  try { localStorage.removeItem(KEY); } catch (e) {}
  Object.keys(S).forEach(k => { delete S[k]; });
  Object.assign(S, JSON.parse(JSON.stringify(FRESH)));
}
const save = () => { try{ localStorage.setItem(KEY, JSON.stringify({
  code:S.code, role:S.role, fundName:S.fundName, teamId:S.teamId, who:S.who,
  policy:S.policy, policyText:S.policyText, ejected:S.ejected,
  resolvedYear:S.resolvedYear,
  fee:S.fee, holdings:S.holdings, fund:S.fund, screen:S.screen,
  year:S.year, flags:S.flags, bot:S.bot })); }catch(e){} };
const load = () => { try{ return JSON.parse(localStorage.getItem(KEY)) || null; }catch(e){ return null; } };

// ----------------------------------------------------------------- helpers --
const $  = s => document.querySelector(s);
const el = (h) => { const d=document.createElement('div'); d.innerHTML=h.trim(); return d.firstElementChild; };
const esc = s => String(s==null?'':s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const eur = x => (x<0?'−':'') + '€' + Math.abs(x).toFixed(x>=100||x<=-100?0:1) + 'm';
const pc  = (x,d=1) => (x>=0?'+':'−') + Math.abs(x).toFixed(d) + '%';
const bp  = f => (f*10000).toFixed(0) + 'bp';
const pct = f => (f*100).toFixed(2) + '%';
const isMgr = () => S.role==='manager';
const STRAT_NAME = Object.fromEntries(M.STRATEGIES.map(x => [x.id, x.name]));
const ord = n => n + (['th','st','nd','rd'][(n%100-n%10!=10)*(n%10<4)*n%10] || 'th');
const co = id => M.byId(id);
// An analyst's own mark on her own desk. A red dot was invisible on a phone at
// arm's length, so it says the word.
const REC = '<span class="rec">Recommended</span>';
// And on the manager's screen, who recommended it. The worker sends
// {companyId: [names]}; an older session may still send a bare true.
function recNote(id){
  const v = (S.peerFlags || {})[id];
  if (!v) return '';
  const names = (Array.isArray(v) ? v : []).filter(Boolean).map(esc);
  const who = !names.length ? '' : names.length === 1 ? names[0]
    : names.slice(0,-1).join(', ') + ' and ' + names[names.length-1];
  return `<div class="rec">${who ? who + ' recommended it' : 'Recommended'}</div>`;
}
const myDesk = () => deskFor(S.desk, S.analystsPresent || 3);
const myName = () => (S.who || '').trim();
// Both heads open by naming you. A line addressed to nobody in particular is
// read by nobody in particular, and this bar is the only voice in the game.
const Hey = () => myName() ? esc(myName()) + ', ' : '';

// ------------------------------------------------------------------- rail ---
const MARK = `<svg width="22" height="20" viewBox="0 0 120 130"><g>
  <path fill="var(--green)" d="M6 62 L20 48 L27 53 L38 33 L45 39 L54 20 L63 6 L72 31 L79 25 L90 46 L97 39 L108 58 L114 62 Z"/>
  <path fill="var(--green)" opacity=".3" d="M6 68 L20 82 L27 77 L38 97 L45 91 L54 110 L63 124 L72 99 L79 105 L90 84 L97 91 L108 72 L114 68 Z"/>
</g></svg>`;

// The three beats, shown as a stepper so you always know which one you are in.
const BEAT = { decide:1, running:2, results:3 };
const beatOf = () => BEAT[S.phase] || (S.phase === 'reveal' ? 3 : 0);
function rail() {
  const playing = !!BEAT[S.phase] || S.phase==='reveal' || S.phase==='done';
  const dots = playing
    ? YEARS.map((y,i)=>`<i class="${i<S.year?'on':i===S.year?'now':''}"></i>`).join('')
    : '';
  const where = playing ? `${YEARS[S.year]} · year ${S.year+1} of 6` : stepLabel();
  const b = beatOf();
  const steps = b ? `<span class="beats">${
    ['Decide','The year runs','Results'].map((t,i)=>
      `<i class="${i+1===b?'on':i+1<b?'done':''}">${t}</i>`).join('')}</span>` : '';
  const left = S.countdownEnds ? Math.max(0, Math.round((S.countdownEnds - Date.now())/1000)) : 0;
  const cd = left ? `<span class="clock">${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</span>` : '';
  return `<header class="top"><div class="rail">
    <span class="mark">${MARK} Peak <span class="esg">ESG</span></span>
    <span class="where">${esc(where)}</span>${cd}
    <span class="dots">${dots}</span></div>${steps}${crew()}</header>`;
}
// Who is on this fund, under the rail, on every screen. The player's own name
// is marked so four people round one laptop can tell whose screen they are on.
function crew(){
  const r = S.roster;
  if (!r || !S.fundName) return '';
  const me = (S.who||'').trim();
  const tag = n => n && n === me ? `<b>${esc(n)}</b>` : esc(n || '—');
  const an = (r.analysts||[]).filter(Boolean);
  // The manager can open this to see who has actually joined and remove
  // anybody who should not be there. A room of seventeen funds reading names
  // out loud produces wrong-fund joins, and nothing else catches them.
  return `<div class="crew${isMgr() ? ' tap' : ''}" ${isMgr() ? 'id="crew"' : ''}>
    <span class="f">${esc(r.fund || S.fundName)}</span>
    <span>Managed by ${tag(r.manager)}</span>
    ${an.length ? `<span>Analysts: ${an.map(tag).join(', ')}</span>`
                : `<span class="muted">No analysts yet</span>`}
    ${isMgr() ? `<span class="manage">Manage</span>` : ''}</div>`;
}
function stepLabel(){
  const m = { intro:'how it works', join:'joining', brief:'the brief', strategy:'step 1 of 3 · strategy',
    threshold:'step 2 of 3 · policy', fee:'step 3 of 3 · price',
    wait:'waiting', desk:'your desk',
    dossier:'your desk', allocate:'the portfolio', open:'open for business',
    team:'which fund?', seat:'taking a seat', teamfinal:'the result', final:'the result',
    switch:'changing the policy', review:'the year in review', decide:'your move',
    performance:'how your fund did',
    standby:'brief the manager', news:'the news' };
  return m[S.screen] || '';
}

// -------------------------------------------------------------- bot strip ---
function botSay(who, msg, year){
  S.bot.push({ who, msg, year: year ?? YEARS[S.year] }); save();
}
// The heads say two kinds of thing. A message happens once and belongs in the
// history: a result, a scandal, the verdict on the policy. An aside describes
// the screen you are on right now and changes as you move a slider — it would
// fill the history with forty near-identical lines, so it is never saved.
// Screens set it from html(); render() clears it first.
function aside(msg){ S.aside = msg; return ''; }
function botStrip(){
  const last = S.bot[S.bot.length-1];
  const who = isMgr() ? 'Head of Distribution' : 'Head of Sustainability';
  const cls = isMgr() ? 'botstrip dist' : 'botstrip';
  // An aside outranks the last message: it is about the screen in front of you.
  if (S.aside) return `<div class="${cls}" id="bot">
    <span class="av">${isMgr()?'D':'S'}</span>
    <div><div class="who">${who}</div><div class="msg">${S.aside}</div></div>
    ${S.bot.length ? `<span class="more">All ${S.bot.length} message${S.bot.length===1?'':'s'}</span>` : ''}</div>`;
  // The first thing either of them says is who they are. Before this the strip
  // read "Nothing from me yet", which told a student nothing about why a
  // stranger was going to be talking to them for the rest of the game.
  const hello = isMgr()
    ? 'I handle sales. Tap this bar at any time to read everything I have sent you.'
    : 'I handle research. Tap this bar at any time to read everything I have sent you.';
  if (!last) return `<div class="${cls} quiet" id="bot">
      <span class="av">${isMgr()?'D':'S'}</span>
      <div><div class="who">${who}</div><div class="msg">${hello}</div></div></div>`;
  // The count on its own ("3 ›") did not read as a control, so nobody opened it
  // and every message but the last was effectively lost.
  return `<div class="${cls}" id="bot">
    <span class="av">${isMgr()?'D':'S'}</span>
    <div><div class="who">${esc(last.who)}</div><div class="msg">${last.msg}</div></div>
    <span class="more">${S.bot.length === 1 ? 'Open' : 'All ' + S.bot.length + ' messages'}</span></div>`;
}
function botLog(){
  const who = isMgr() ? 'the Head of Distribution' : 'the Head of Sustainability';
  return `<div class="botlog" id="botlog"><div class="sheet">
    <h2 style="margin-top:0">Messages from ${who}</h2>
    <p class="small">Newest first. You can open this from the bar at the bottom of any screen.</p>
    ${S.bot.slice().reverse().map(b=>`<div class="item">
      <div class="yr">${b.year} · ${esc(b.who)}</div><div>${b.msg}</div></div>`).join('')}
    <div class="actions"><button class="ghost wide" id="closelog">Close</button></div>
  </div></div>`;
}

// --------------------------------------------------------- who is on the fund
function teamSheet(){
  const r = S.roster || {};
  const team = r.team || [];
  const out = Object.entries(S.ejected || {});
  return `<div class="botlog" id="teamsheet"><div class="sheet">
    <h2 style="margin-top:0">Who is on ${esc(r.fund || S.fundName || 'your fund')}</h2>
    <p class="small">Check these are your three. Anyone who tapped the wrong fund can be
      removed, and the desk they were holding frees up for the right person.</p>
    ${team.length ? team.map(a => `<div class="co">
      <div><div class="nm">${esc(a.who || 'Unnamed')}</div>
        <div class="ind">${esc((DESKS[a.desk]||{}).name || 'seated')}</div></div>
      <button class="ghost" data-eject="${esc(a.uid)}" data-nm="${esc(a.who||'Unnamed')}"
        style="margin-left:auto;min-height:38px;padding:6px 14px">Remove</button></div>`).join('')
      : `<div class="note">No analysts have joined yet.</div>`}
    ${out.length ? `<h2>Removed</h2>
      ${out.map(([uid, nm]) => `<div class="co">
        <div><div class="nm">${esc(nm)}</div>
          <div class="ind">cannot rejoin this fund</div></div>
        <button class="ghost" data-unban="${esc(uid)}"
          style="margin-left:auto;min-height:38px;padding:6px 14px">Allow back</button></div>`).join('')}`
      : ''}
    <div class="actions"><button class="ghost wide" id="closeteam">Close</button></div>
  </div></div>`;
}

// ------------------------------------------------------------------ paint ---
// A Firestore snapshot arrives whenever anybody on the fund touches anything,
// and the old render() replaced document.body.innerHTML every time. Two
// consequences on a phone: the fixed bar at the bottom was destroyed and
// rebuilt constantly, which flickers, and window.scrollTo(0,0) ran on every
// snapshot, so you were thrown back to the top of a dossier while reading it.
// Now each of the three regions is compared and only written when it changed,
// and the scroll only resets when the screen actually changes.
const DOM = { rail:null, body:null, strip:null, screen:null, bot:null };

function render(){
  const scr = SCREENS[S.screen] || SCREENS.join;
  S.aside = null;                    // an aside belongs to one screen only
  const bodyHtml  = scr.html();      // building the screen is what sets it
  const railHtml  = rail();
  const stripHtml = botStrip() + (S.botOpen ? botLog() : '')
    + (S.teamOpen && isMgr() ? teamSheet() : '');
  const mainCls   = isMgr() ? 'wide' : '';

  // The header must stay a direct child of body: it is position:sticky, and a
  // wrapper would become its containing block and stop it sticking.
  let main = document.getElementById('main');
  if (!main) {
    document.body.innerHTML = railHtml
      + `<main class="${mainCls}" id="main"></main>`
      + `<div id="botwrap"></div>`;
    main = document.getElementById('main');
    DOM.rail = railHtml; DOM.body = null; DOM.strip = null;
  } else if (railHtml !== DOM.rail) {
    const t = document.querySelector('header.top');
    if (t) t.outerHTML = railHtml;
    DOM.rail = railHtml;
  }

  if (main.className !== mainCls) main.className = mainCls;
  const screenChanged = S.screen !== DOM.screen;
  const bodyChanged = bodyHtml !== DOM.body;
  if (bodyChanged) { main.innerHTML = bodyHtml; DOM.body = bodyHtml; }
  // Handlers live on the nodes, so they only need re-attaching when the nodes
  // were replaced. A screen whose html happens to be identical keeps working.
  if (bodyChanged || screenChanged) scr.wire && scr.wire(main);

  const wrap = document.getElementById('botwrap');
  if (wrap && stripHtml !== DOM.strip) {
    wrap.innerHTML = stripHtml;
    DOM.strip = stripHtml;
    const b = document.getElementById('bot');
    if (b) {
      b.onclick = () => { S.botOpen = true; paint(); };
      // main reserves --bot at the bottom for this fixed bar. It used to be a
      // fixed guess, and a two-line message on a phone is taller than the
      // guess, so the bar sat on top of the button the screen was asking you
      // to press. Measure it instead, and only write when it moves.
      const h = b.offsetHeight;
      if (h && h !== DOM.bot) {
        document.documentElement.style.setProperty('--bot', h + 'px');
        DOM.bot = h;
      }
    }
    const cl = document.getElementById('closelog');
    if (cl) cl.onclick = () => { S.botOpen = false; paint(); };
    const ct = document.getElementById('closeteam');
    if (ct) ct.onclick = () => { S.teamOpen = false; paint(); };
    wrap.querySelectorAll('[data-eject]').forEach(b => b.onclick = () => {
      S.ejected = { ...(S.ejected||{}), [b.dataset.eject]: b.dataset.nm };
      botSay('Head of Distribution',
        `<b>${Hey()}I have taken ${esc(b.dataset.nm)} off the fund.</b> That desk is free again.`);
      publishMe(); paint();
    });
    wrap.querySelectorAll('[data-unban]').forEach(b => b.onclick = () => {
      const e = { ...(S.ejected||{}) }; delete e[b.dataset.unban]; S.ejected = e;
      publishMe(); paint();
    });
  }

  if (screenChanged) { DOM.screen = S.screen; window.scrollTo(0, 0); }
}
// Never show nothing. A screen that throws gets an explanation and a way on,
// and the saved game is left alone — a reload usually fixes it.
function paint(){
  try { render(); }
  catch (err) {
    console.error('Peak ESG — screen failed to render:', S.screen, err);
    const q = new URLSearchParams(location.search); q.set('fresh','1');
    document.body.innerHTML = `<main><div class="bootfail">
      <h1>Something went wrong on this screen</h1>
      <p>Reload the page — your fund is saved on this device.</p>
      <div class="actions"><button class="wide" id="rl">Reload</button></div>
      <p class="muted">If it keeps happening,
        <a href="${location.pathname}?${q}">start a clean game</a>.</p>
      <pre>${esc(S.screen)} — ${esc(err && err.message)}</pre>
    </div></main>`;
    const r = $('#rl'); if (r) r.onclick = () => location.reload();
  }
}
const go = s => { S.screen = s; save(); paint(); };

// =============================================================================
// SCREENS
// =============================================================================
const SCREENS = {};

// --------------------------------------------------------------- the brief --
// Read before the code is asked for. Nobody absorbs rules while four people are
// trying to type the same four digits, and the pattern is proven in Zombies and
// Unicorns: one page, headings you can skim, one button out.
const HOWTO = [
  ['You are launching a sustainable fund in January 2022',
   'You start with €500m of other people’s money and a universe of twelve companies to invest it in. The game runs six years, 2022 to 2027.'],
  ['You are scored on the fees you earn, not the returns you make',
   'A management fee is a percentage of the money you are looking after, charged every year. Your score is the total of those fees across the six years. So the size of the fund matters as much as how well you pick — and the size depends on whether investors want to buy what you are selling.'],
  ['Four of you to a fund',
   'One of you creates the fund and runs it. The other three are analysts, with four companies each to research. <b>The manager is shown no company information at all</b> — not a name, not a score, nothing.'],
  ['So the manager has to ask, and the analysts have to explain',
   'The analysts read the dossiers; the manager decides. The only way information gets from one of you to the other is by talking.'],
  ['The manager decides what the fund stands for, and how strictly',
   'Three ways to do it: exclude activities the fund will not invest in, require companies to rank near the top of their industry, or set a minimum ESG score. A strict policy keeps you out of some good investments. A loose one is hard to defend as a sustainable fund at all.'],
  ['The policy is written down, and checked against what the fund owns',
   'The manager writes it in plain words before seeing any company. A clear promise brings money in. Promising more than the portfolio delivers costs money when the difference is noticed, and it makes any later scandal worse.'],
  ['Six years, paced from the front of the room',
   'Each year brings news about the companies, returns, and money flowing in or out. Between years you can change the fee, trade a little, and even change what the fund stands for — though investors who bought the old promise will leave.'],
  ['Past performance is not a guide to what happens next',
   'Every dossier shows three years of share price history, 2019 to 2021. It is accurate. It is also the most misleading thing on the screen.'],
];
SCREENS.intro = {
  html(){ return `
    <div class="title">
      <div class="titlemark">${MARK}</div>
      <div class="titlename">Peak <span>ESG</span></div>
      <div class="titlesub">Six years, twelve companies, one fund \u00b7 2022\u20132027</div>
    </div>
    <p class="lede">${esc(SCENARIO)}</p>
    <h2>How it works</h2>
    ${HOWTO.map(([h,p])=>`<div class="sect" style="margin-bottom:12px">
      <b>${esc(h)}</b><div style="margin-top:3px">${p}</div></div>`).join('')}
    <div class="actions"><button id="n" class="wide">I'm in</button></div>`; },
  wire(m){ m.querySelector('#n').onclick=()=>go('join'); }
};

// ------------------------------------------------------------------- join ---
SCREENS.join = {
  html(){ return `
    <h1>Join the game</h1>
    <h2>The code on the screen at the front</h2>
    <div class="code">${[0,1,2,3].map(i=>`<input inputmode="numeric" maxlength="1" data-i="${i}" value="${esc(S.code[i]||'')}">`).join('')}</div>
    <p class="task">Everyone in the room types the same four digits — your group is chosen next.</p>
    <h2>What are you doing?</h2>
    <div class="choices" id="roles">
      ${Object.entries(ROLES).map(([k,r])=>`<div class="choice${S.role===k?' sel':''}" data-r="${k}">
        <div class="lbl">${esc(r.name)}</div><div class="desc">${esc(r.blurb)}</div></div>`).join('')}
    </div>
    <div id="whoRow" class="${S.role?'':'hidden'}">
      <h2>What shall we call you?</h2>
      <input type="text" id="who" maxlength="24" placeholder="Sarah" value="${esc(S.who)}">
      <div class="small">Your team will see this. A first name or a nickname — whatever you like.</div>
    </div>
    <div id="nameRow" class="${S.role==='manager'?'':'hidden'}">
      <h2>Name the fund</h2>
      <input type="text" id="fname" maxlength="28" placeholder="Verde Capital" value="${esc(S.fundName)}">
      <div class="small">Your analysts will look for this name, so say it out loud.</div>
    </div>
    <div class="actions"><button id="go" class="wide" ${
      S.role && S.code.length===4 && S.who.trim() ? '':'disabled'}>${
      S.role==='analyst' ? 'Find my fund' : 'Start'}</button></div>
    <p class="small" style="text-align:center;margin-top:20px;opacity:.7">
      Played on this device before? <a href="#" id="newgame">Start a new game</a>.</p>`; },
  wire(m){
    const boxes=[...m.querySelectorAll('.code input')];
    boxes.forEach((b,i)=>{ b.oninput=()=>{ b.value=b.value.replace(/\D/g,'');
      S.code = boxes.map(x=>x.value).join(''); if(b.value&&i<3)boxes[i+1].focus();
      ready(); };
      b.onkeydown=e=>{ if(e.key==='Backspace'&&!b.value&&i>0)boxes[i-1].focus(); }; });
    m.querySelectorAll('[data-r]').forEach(c=>c.onclick=()=>{
      S.role=c.dataset.r; paint(); });
    const ready = () => { const g=$('#go');
      if (g) g.disabled = !(S.role && S.code.length===4 && S.who.trim()); };
    const wh=m.querySelector('#who'); if(wh) wh.oninput=()=>{ S.who=wh.value; ready(); };
    const fn=m.querySelector('#fname'); if(fn) fn.oninput=()=>{ S.fundName=fn.value; };
    // Forgets whatever this device was carrying and comes straight back here,
    // so nobody has to be told about ?fresh.
    const ng=m.querySelector('#newgame');
    if (ng) ng.onclick = e => { e.preventDefault(); startClean(); S.screen='join'; paint(); };
    ready();
    m.querySelector('#go').onclick=()=>{
      if (isMgr()) {
        // The manager IS the fund: her device creates the group document every
        // analyst will then attach to, so she joins first and names it.
        if (!S.fundName.trim()) S.fundName = 'Unnamed Fund';
        S.teamId = 'me';
        // Publish at once, not at the first decision: until her document exists
        // the fund is not on the board, and her analysts have nothing to tap.
        connect(); publishMe(); go('brief');
      } else {
        // An analyst has no fund yet. Connect, then let her pick it off the
        // live board — no second code to read out, and no way to mistype it.
        connect(); go('team');
      }
    };
  }
};

// ------------------------------------------------------------------ brief ---
SCREENS.brief = {
  html(){
    if (isMgr()) return `
      <h1>You run the fund</h1>
      <p class="lede">Three decisions before you open: what the fund stands for, how strict
        that is — written down, in your own words — and what you charge.</p>
      <div class="note info"><b>You will not see the companies.</b> Your analysts have the dossiers. You cannot build the portfolio without asking them.</div>
      <p class="task">Next: choose what the fund stands for.</p>
      <div class="actions"><button id="n" class="wide">Begin</button></div>`;
    const n = myDesk().length;
    return `
      <h1>Welcome to ${esc(S.fundName)}</h1>
      <p class="lede">${n} companies are yours to research${
        S.desk && n === 4 ? ` — the ${DESKS[S.desk].name.toLowerCase()}` : ''}.
        They are candidates for the fund, and nobody else in the group can see them.
        <b>The manager cannot see any company at all</b> — not a name, not a score.</p>
      <p class="task">Open each dossier and read it. There are seven sections: what the
        company does, its financials, its ESG score and where it ranks, its published
        policies, what NGOs say about it, its governance, and its press coverage.</p>
      <div class="note info"><b>You can recommend a company to the manager.</b> That puts
        your name beside it on their screen. There is no button for the opposite — if you
        think the fund should stay away from one of yours, you have to say so out loud.</div>
      <p class="task">News and share prices update inside the dossiers every year, so come
        back to them. The Head of Sustainability will send you anything that moves.</p>
      <div class="actions"><button id="n" class="wide">Open my desk</button></div>`;
  },
  wire(m){ m.querySelector('#n').onclick=()=> go(isMgr()?'strategy':'desk'); }
};

// ------------------------------------------------------- which fund is mine --
// Everything group-specific hangs off this: the fund's name, the flags reaching
// the right manager, and the ending. The board is already public, so the
// analyst taps a name instead of being told a second code.
SCREENS.team = {
  html(){
    const funds = (S.board || []).filter(f => f.uid);
    if (S.evictedFrom) return `<h1>You are not on that fund</h1>
      <p class="lede">The manager of <b>${esc(S.evictedFrom)}</b> removed you \u2014 most likely
        you tapped the wrong fund.</p>
      <p class="task">Check with your group which fund is yours, then choose it below.</p>
      <div class="actions"><button id="ok" class="wide">Choose a fund</button></div>`;
    if (S.deskFull) return `<h1>That fund is full</h1>
      <p class="lede"><b>${esc(S.fundName)}</b> already has its three analysts.</p>
      <p class="task">Join a different fund, or ask someone in the room to create one.</p>
      <div class="actions"><button id="back" class="wide">Choose a different fund</button></div>`;
    if (!funds.length) return `<h1>Which fund?</h1>
      <p class="lede">Waiting for a fund manager to create one.</p>
      <p class="task">Someone in your group types the same four digits, chooses
        <b>Create the fund</b>, and names it. It will appear here within a second or two.</p>
      <div class="note">Nothing to do yet. Leave this screen open.</div>`;
    return `<h1>Which fund?</h1>
      <p class="task">Tap the one your manager just named. Three analysts to a fund.</p>
      <div class="choices" id="funds">
        ${funds.map(f=>{ const n=(f.seats||1)-1, full=n>=MAX_ANALYSTS;
          return `<div class="choice${S.teamId===f.uid?' sel':''}${full?' off':''}"
            ${full?'':`data-u="${esc(f.uid)}"`}>
            <div class="lbl">${esc(f.name)}</div>
            <div class="desc">${full ? 'full — three analysts already'
              : `${n} of ${MAX_ANALYSTS} analysts so far`}</div></div>`; }).join('')}
      </div>
      <div class="note">If two funds share a name, ask your manager which is yours.</div>
      <div class="actions"><button id="n" class="wide" ${S.teamId?'':'disabled'}>That's mine</button></div>`;
  },
  wire(m){
    const ok = m.querySelector('#ok');
    if (ok) ok.onclick = () => { S.evictedFrom = null; paint(); };
    const b = m.querySelector('#back');
    if (b) b.onclick = () => { S.deskFull=false; S.teamId=null; S.fundName=''; publishMe(); paint(); };
    m.querySelectorAll('[data-u]').forEach(c=>c.onclick=()=>{
      S.teamId = c.dataset.u;
      S.fundName = (S.board||[]).find(f=>f.uid===S.teamId)?.name || '';
      paint(); });
    const n = m.querySelector('#n');
    // The worker decides which desk this is — the client only asks to sit down.
    if (n) n.onclick = () => { S.joinedAt = S.joinedAt || Date.now(); publishMe(); go('seat'); };
  }
};

// Waiting for the worker to hand out a desk. It is nearly always instant, but
// two analysts tapping the same fund at the same moment must not both get the
// first desk, so one authority assigns them and the client waits to be told.
SCREENS.seat = {
  html(){
    if (S.deskFull) return SCREENS.team.html();
    return `<h1>Taking your seat</h1>
      <p class="lede">Finding you a desk at <b>${esc(S.fundName)}</b>.</p>
      <div class="note">This takes a second.</div>`;
  },
  wire(m){ if (S.deskFull) { S.screen='team'; } }
};

// =============================================================================
// ANALYST
// =============================================================================
SCREENS.desk = {
  html(){
    const ids = myDesk();
    const playing = S.phase==='play';
    const yr = playing ? YEARS[S.year] : 2021;
    return `<h1>Your desk</h1>
      <p class="task">Tap a company to open its dossier. The score is one rating agency's opinion.</p>
      ${ids.map(id=>{ const c=co(id); const f=S.flags[id];
        // The score moves with events, so showing the 2021 number all game
        // would hide the one thing an analyst is meant to be watching.
        const sc = playing ? c.esg[S.year] : c.esg0;
        const d  = playing ? sc - c.esg0 : 0;
        // M.ret is the only place a company's return is decided. Reading
        // excess + index straight off the data skipped the demeaning, the
        // compression, the authored 2027 and the event drag, so the number on
        // the analyst's desk did not match what the portfolio actually earned.
        const r  = playing ? M.ret(c, S.year, 'authored') : null;
        return `<div class="co" data-id="${id}">
          <div><div class="nm">${esc(c.name)}</div>
          <div class="ind">${esc(c.industry)} · ${esc(c.region)}${
            r===null?'':` · <span class="${r>=0?'up':'down'}">${pc(r,0)} in ${yr}</span>`}</div>
          ${f?REC:''}</div>
          <span class="score ${sc>=70?'hi':sc<50?'lo':''}">${sc}${
            d ? `<small>${d>0?'+':'−'}${Math.abs(d)}</small>` : ''}</span></div>`; }).join('')}
      <div class="note">Every company here is scored 0 to 100 by the same in-house rating team.
        <b>Two of your four are not what their score suggests</b> — one is better than its score,
        one is worse. Working out which is your job.</div>`;
  },
  wire(m){ m.querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{
    S.openCo=r.dataset.id; S.openSect='prof'; go('dossier'); }); }
};

const SECTIONS = [
  ['prof','Profile'], ['fin','Financial'], ['esg','ESG'], ['pol','Policies'],
  ['ngo','NGO'], ['gov','Governance'], ['news','Media']
];
const FACT_LABEL = { ceo:'Chief executive', employees:'Employees', founded:'Founded',
                     hq:'Headquarters', revenue:'Revenue', listed:'Listed' };

SCREENS.dossier = {
  html(){
    const c = co(S.openCo); const s = S.openSect;
    const spark = (()=>{ const v=c.chart, lo=Math.min(...v), hi=Math.max(...v);
      const pts = v.map((x,i)=>`${6+i*52},${44-((x-lo)/((hi-lo)||1))*32}`).join(' ');
      return `<svg class="spark" width="124" height="52" viewBox="0 0 124 52">
        <polyline points="${pts}" fill="none" stroke="var(--green)" stroke-width="2.5"
          stroke-linejoin="round" stroke-linecap="round"/>
        <line x1="2" y1="49" x2="122" y2="49" stroke="var(--rule-2)" stroke-width="1"/></svg>`; })();
    let body='';
    // What a screener would show you first: what the company actually does, in
    // prose, before any number. Several of these carry a planted signal in
    // plain sight — a subsidiary, a percentage, a claim under review.
    if (s==='prof') body = `
      <p>${esc(c.profile)}</p>
      <h2 style="margin-top:18px">About ${esc(c.name)}</h2>
      <div class="kv"><span class="k">Industry</span><span class="v">${esc(c.industry)}</span></div>
      ${Object.entries(c.facts||{}).map(([k,v])=>
        `<div class="kv"><span class="k">${esc(FACT_LABEL[k]||k)}</span><span class="v">${esc(v)}</span></div>`).join('')}`;
    if (s==='fin') body = `
      <div class="small" style="margin-bottom:2px">Share price, 2019 to 2021</div>
      ${spark}<div style="font-family:var(--mono);font-weight:600;font-size:19px">${esc(c.chart3y)} over three years</div>
      <div class="kv"><span class="k">Price / earnings</span><span class="v">${c.pe}</span></div>
      <div class="kv"><span class="k">Region</span><span class="v">${esc(c.region)}</span></div>
      ${c.subsidiaries?`<div class="kv"><span class="k">Subsidiaries</span><span class="v">${c.subsidiaries.map(esc).join('<br>')}</span></div>`:''}
      ${c.water?`<div class="kv"><span class="k">Water</span><span class="v">${esc(c.water)}</span></div>`:''}`;
    if (s==='esg') body = `
      <div class="kv"><span class="k">In-house score</span><span class="v">${c.esg0} / 100</span></div>
      <div class="kv"><span class="k">Rank in its industry</span><span class="v">${esc(c.rank)}</span></div>
      <div class="kv"><span class="k">Excluded activities</span><span class="v">${
        c.activities.length?c.activities.map(a=>esc(ACTIVITIES[a])).join('<br>'):'None'}</span></div>`;
    if (s==='pol') body = Object.entries({
      'Climate transition plan':c.policies.transition, 'Human rights policy':c.policies.humanRights,
      'Scope 3 disclosure':c.policies.scope3, 'Supplier audit':c.policies.supplierAudit })
      .map(([k,v])=>`<div class="kv"><span class="k">${k}</span><span class="v">${esc(v)}</span></div>`).join('');
    if (s==='ngo') body = c.ngo.map(x=>`<p>${esc(x)}</p>`).join('');
    if (s==='gov') body = `
      <div class="kv"><span class="k">Chair</span><span class="v">${esc(c.governance.chair)}</span></div>
      <div class="kv"><span class="k">Chief executive</span><span class="v">${esc(c.governance.ceoChange)}</span></div>
      <div class="kv"><span class="k">Largest holder</span><span class="v">${esc(c.governance.holder)}</span></div>`;
    if (s==='news'){
      const upto = S.phase==='play' ? YEARS[S.year] : 2021;
      const items = NEWS[c.id].filter(n=>n.y<=upto);
      body = (c.media2021?`<p class="small">${esc(c.media2021)}</p>`:'') +
        (items.length ? items.slice().reverse().map(n=>`<div class="kv" style="display:block">
          <div class="k" style="font-family:var(--mono);font-size:12px">${n.y}</div>
          <div><b>${esc(n.t)}</b> — ${esc(n.s)}</div></div>`).join('')
        : '<p class="small">Nothing yet. The game has not started.</p>');
    }
    return `<h1>${esc(c.name)}</h1>
      <p class="lede">${esc(c.blurb)}</p>
      <div class="chips">${SECTIONS.map(([k,l])=>`<div class="chip${s===k?' on':''}" data-s="${k}">${l}</div>`).join('')}</div>
      <div class="sect">${body}</div>
      <div class="actions">
        <button class="ghost" id="flag">${S.flags[c.id]
          ? 'Withdraw the recommendation' : 'Recommend to the manager'}</button>
        <button class="ghost" id="back">Back to my desk</button></div>`;
  },
  wire(m){
    m.querySelectorAll('[data-s]').forEach(c=>c.onclick=()=>{ S.openSect=c.dataset.s; paint(); });
    m.querySelector('#back').onclick=()=>go('desk');
    m.querySelector('#flag').onclick=()=>{ const id=S.openCo;
      S.flags[id]=!S.flags[id]; publishMe(); paint(); };
  }
};

// =============================================================================
// MANAGER — setting up the fund
// =============================================================================
// Three steps: what the fund stands for, how strictly — written down — and what
// it charges. There used to be a fourth, a separate public blurb, which asked
// for the same promise a second time in shorter words. It was dropped; the
// policy statement IS the public promise, and it is now made before any company
// is chosen rather than after.
const MIN_POLICY = 40;
// A real one, so nobody has to guess what the genre sounds like. Folded away by
// default: an example on the screen while you write becomes a template to copy.
// Paraphrased from the fund's own published methodology, not quoted.
const POLICY_EXAMPLE = `<details class="ex"><summary>What one of these looks like in the real world</summary>
  <p class="small">BlackRock's iShares ESG Aware MSCI USA ETF — about $14bn — states its
    policy along these lines:</p>
  <blockquote>We aim to match the risk and return of the broad US market while tilting the
    portfolio towards companies rated more highly on environmental, social and governance
    grounds. We do not invest in tobacco, controversial weapons, civilian firearms, thermal
    coal or oil sands, nor in companies involved in very severe business controversies.
    The remaining holdings are weighted to maximise exposure to better-rated companies
    without departing far from the market's risk and return.</blockquote>
  <p class="small">Two things to copy. It names the exclusions exactly, so anyone can check
    them. And it promises only what it can deliver: a tilt towards better-rated companies, a
    short list of exclusions, and returns close to the market. There is no gap between the
    promise and the portfolio.</p>
</details>`;

SCREENS.strategy = {
  html(){ return `<h1>What does the fund stand for?</h1>
    <p class="task">Choose one. You set how strict it is on the next screen.</p>
    <div class="choices">${M.STRATEGIES.map(s=>`<div class="choice${S.policy.strategy===s.id?' sel':''}" data-s="${s.id}">
      <div class="lbl">${esc(s.name)}</div><div class="desc">${esc(s.blurb)}</div></div>`).join('')}</div>
    <div class="actions"><button id="n" ${S.policy.strategy?'':'disabled'}>Next</button></div>`; },
  wire(m){ m.querySelectorAll('[data-s]').forEach(c=>c.onclick=()=>{
      S.policy.strategy=c.dataset.s; paint(); });
    m.querySelector('#n').onclick=()=>go('threshold'); }
};

SCREENS.threshold = {
  html(){
    const p=S.policy, n=M.admitted(p).length, st=M.strictness(p);
    const str = M.STRATEGIES.find(s=>s.id===p.strategy);
    let ctl='';
    if (p.strategy==='exclude') ctl = `<div class="choices two">${
      Object.entries(ACTIVITIES).map(([k,v])=>`<div class="choice${p.excluded.includes(k)?' sel':''}" data-x="${k}">
        <div class="lbl">${esc(v)}</div></div>`).join('')}</div>`;
    if (p.strategy==='best') ctl = `
      <p>A company must rank <b>${p.rank===99?'anywhere':'in the top '+p.rank}</b> in its own industry.</p>
      <input type="range" id="r" min="1" max="25" value="${Math.min(25,p.rank)}">`;
    if (p.strategy==='integrate') ctl = `
      <p>Minimum in-house score: <b>${p.minScore}</b> out of 100.</p>
      <input type="range" id="r" min="0" max="90" step="5" value="${p.minScore}">`;
    // Advice goes to the Head of Distribution; the hard gate stays on screen,
    // because it explains a disabled button.
    const warn = n<3 ? `<div class="note bad">That admits only ${n} companies. You need at least three holdings.</div>` : '';
    if (n>=3 && st<0.05) aside('This excludes nothing. Investors who care about sustainability will not buy a fund with no policy.');
    else if (n>=3 && st>0.75) aside('Very strict. You are excluding most of the market, including companies you might have wanted to own.');
    else if (n>=3) aside(`Your policy admits ${n} of the twelve companies. That is a workable range.`);
    const chars = (S.policyText||'').trim().length;
    return `<h1>${esc(str.question)}</h1>
      <p class="task">The stricter the policy, the fewer companies the fund can own. Screen too hard and you lose investments you would have wanted; screen too softly and the fund is not promising anything.</p>
      ${ctl}
      <div class="note ${n<3?'bad':'good'}" style="margin-top:18px">
        <b>Your policy admits ${n} of the 12 companies.</b></div>
      ${warn}
      <h2 style="margin-top:26px">Now write it down</h2>
      <p class="small">You chose <b>${esc(str.name)}</b>${
        n ? ` and a threshold that admits ${n} of the twelve companies` : ''}.
        <b>Talk to your analysts before you write.</b> They have read the dossiers and you
        have not; ask them what a policy like this would mean in practice, and what it
        would rule out.</p>
      <p class="small">Then write it: two or three sentences, in your own words, saying
        what the fund will and will not own, <b>and why an investor should buy it</b>.
        This is what investors are told the fund stands for, and everything you buy is
        checked against it. You write it <b>before</b> you have seen a single company.</p>
      <textarea id="pol" placeholder="This fund will not invest in…">${esc(S.policyText)}</textarea>
      ${POLICY_EXAMPLE}
      ${chars && chars < MIN_POLICY ? `<div class="note warn">Too short. An investor could not tell
        what this fund is for.</div>` : ''}
      <div class="actions"><button class="ghost" id="b">Back</button>
        <button id="n" ${n>=3 && chars>=MIN_POLICY?'':'disabled'}>${
          S.switching ? 'Tell the market' : 'Next'}</button></div>`;
  },
  wire(m){
    m.querySelectorAll('[data-x]').forEach(c=>c.onclick=()=>{ const k=c.dataset.x;
      const i=S.policy.excluded.indexOf(k);
      if(i<0) S.policy.excluded.push(k); else S.policy.excluded.splice(i,1); paint(); });
    const r=m.querySelector('#r'); if(r) r.oninput=()=>{
      if(S.policy.strategy==='best') S.policy.rank=+r.value; else S.policy.minScore=+r.value;
      paint(); m.querySelector('#r').focus(); };
    const pol=m.querySelector('#pol');
    // Re-render on blur, not on every keystroke: paint() rebuilds the document,
    // which would take the caret with it.
    if (pol) { pol.oninput = () => { S.policyText = pol.value; };
               pol.onblur  = () => { S.policyText = pol.value; paint(); }; }
    m.querySelector('#b').onclick=()=>{ if(pol) S.policyText=pol.value; go('strategy'); };
    m.querySelector('#n').onclick=()=>{
      if (pol) S.policyText = pol.value;
      if (!S.switching) { go('fee'); return; }
      // Changing the policy mid-game. Charged by the model in the year it
      // happened, then cleared. The new wording is assessed afresh, which is
      // why the worker keys the assessment on the text and not on the fund.
      S.switching = false;
      S.switches = (S.switches || 0) + 1;
      S.fund.switchPending = true;
      S.fund.switches = S.switches;
      S.fund.policy = S.policy;
      botSay('Head of Distribution',
        `<b>${Hey()}it is done.</b> Investors have been told the fund now stands for `
        + `<b>${esc(STRAT_NAME[S.policy.strategy]||'something else')}</b>. `
        + `About <b>${(M.SWITCH_CUT*100).toFixed(0)}%</b> of the money will leave this year.`);
      publishMe(); go('decide');
    };
  }
};

SCREENS.fee = {
  html(){ const f=S.fee;
    const tol = f>0.0130?'Expensive. Most ordinary investors will not pay this.'
              : f>0.0100?'Above the market. Investors who believe in the fund may stay; others will leave.'
              : f>0.0060?'About the going rate.'
              : 'Cheap. More investors will buy, and you earn less from each of them.';
    return `<h1>What do you charge?</h1>
      <p class="task">The fee is the percentage investors pay you each year for managing
        their money. <b>It is what you are scored on</b> — your result is the total of the
        fees investors pay over the six years. Charge more and you earn more per euro, but a
        dear fund has to be worth it, or investors take their money elsewhere. Other funds
        are opening at about 0.80%.</p>
      <div class="big">${pct(f)}</div>
      <input type="range" id="r" min="10" max="200" step="5" value="${Math.round(f*10000)}">
      <div class="small" style="display:flex;justify-content:space-between"><span>0.10%</span><span>2.00%</span></div>
      ${aside(tol)}
      <div class="actions"><button class="ghost" id="b">Back</button>
        <button id="n" class="wide">Open the fund</button></div>`; },
  wire(m){ const r=m.querySelector('#r');
    r.oninput=()=>{ S.fee=+r.value/10000; paint(); m.querySelector('#r').focus(); };
    m.querySelector('#b').onclick=()=>go('threshold');
    m.querySelector('#n').onclick=()=>{
      S.fund=M.newFund({policy:S.policy,fee:S.fee});
      botSay('Head of Distribution',Hey()+'we are open at <b>'+pct(S.fee)+'</b> a year. Keep an eye on what the other funds charge — the market rate moves, and being dearer than it costs us money.',2022);
      publishMe(); go('allocate'); }; }
};

// ----------------------------------------------------------- the portfolio --
SCREENS.allocate = {
  html(){
    const n=Object.keys(S.holdings).length;
    const breach = M.breaches(S.policy, S.holdings);
    return `<h1>Build the portfolio</h1>
      <p class="task"><b>You cannot see the dossiers of these companies</b> — your analysts
        can. Ask them which ones fit the policy you wrote and will still earn a return, and
        ask for a closer look at any you are unsure about.</p>
      <p class="task">Tap a company to buy or sell it. Tap its weight to raise it from
        1× to 2× to 3× — a 3× holding is three times the size of a 1× holding.</p>
      ${UNIVERSE.map(c=>{ const w=S.holdings[c.id]; const admitted=M.admits(S.policy,c);
        return `<div class="co ${w?'held':''}" data-id="${c.id}">
          <div><div class="nm">${esc(c.name)}</div>
            <div class="ind">${esc(c.industry)}${admitted?'':' · <b style="color:var(--red)">outside your policy</b>'}</div>
            ${recNote(c.id)}</div>
          ${w?`<button class="ghost" data-w="${c.id}" style="min-height:38px;padding:6px 14px">${w}×</button>`
             :'<span class="small">not held</span>'}</div>`; }).join('')}
      <div class="note ${n<M.MIN_HOLDINGS?'bad':'good'}" style="margin-top:14px">
        <b>${n} holding${n===1?'':'s'}.</b> Minimum three.</div>
      ${breach.length?`<div class="note warn"><b>${breach.length} holding${breach.length===1?'':'s'} outside the policy you wrote.</b>
        You are allowed to own ${breach.length===1?'it':'them'}. Investors will notice the
        difference between what you promised and what you bought.</div>`:''}
      <div class="actions"><button id="n" class="wide" ${n>=M.MIN_HOLDINGS?'':'disabled'}>Done — open for business</button></div>`;
  },
  wire(m){
    m.querySelectorAll('[data-w]').forEach(b=>b.onclick=e=>{ e.stopPropagation();
      const id=b.dataset.w; S.holdings[id]=(S.holdings[id]%M.MAX_WEIGHT)+1; publishMe(); paint(); });
    m.querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{ const id=r.dataset.id;
      if (S.holdings[id]) delete S.holdings[id]; else S.holdings[id]=1; publishMe(); paint(); });
    // The instructor opens the market, not the manager. Before this each fund
    // walked into 2022 whenever its own manager happened to finish, so no two
    // funds were in the same year and the macro briefing arrived before the
    // trade it was about to explain.
    m.querySelector('#n').onclick=()=>{
      publishMe();
      const st = S.net ? S.net.session() : null;
      if (st && st.stage === 'play') { S.year = st.year || 0; S.trades = 0; go('decide'); }
      else go('open');
    };
  }
};

SCREENS.open = {
  html(){
    const ids = Object.keys(S.holdings);
    const w = M.weightsOf(S.holdings);
    const esg = M.portfolioESG(S.holdings, 0);
    const breach = M.breaches(S.policy, S.holdings);
    return `<h1>The fund is open</h1>
      <p class="lede">You have invested <b>${eur(M.START_AUM)}</b> in ${ids.length}
        compan${ids.length===1?'y':'ies'}, and you charge <b>${pct(S.fee)}</b> a year.</p>
      ${ids.map(id=>{ const c=co(id);
        return `<div class="co held">
          <div><div class="nm">${esc(c.name)}</div>
            <div class="ind">${esc(c.industry)}</div>${recNote(id)}</div>
          <span class="ret" style="margin-left:auto">${(w[id]*100).toFixed(0)}%</span></div>`; }).join('')}
      <div class="note info">The fund's ESG score is <b>${esg.toFixed(0)}</b> out of 100 —
        the average of your holdings' scores, weighted by how much of each you own.</div>
      ${breach.length
        ? `<div class="note warn"><b>${breach.length===1?'One holding is':breach.length+' holdings are'}
            outside the policy you wrote:</b> ${breach.map(b=>esc(b.name)).join(', ')}.
            You are allowed to own ${breach.length===1?'it':'them'}. Investors will notice
            the difference.</div>`
        : `<div class="note good">Every holding is inside the policy you wrote.</div>`}
      ${S.aiNote ? '' : `<div class="note">Your Head of Distribution is reading your policy
        statement now. Watch the bar at the bottom.</div>`}
      <div class="waitbox"><b>Waiting for 2022 to open</b>
        <div class="small" style="margin-top:4px">The instructor starts the first year from the
          front of the room. Nothing happens to your money until then.</div></div>`;
  },
  wire(){ const st = S.net ? S.net.session() : null;
    // A manager who finishes setting up after the first year has already been
    // opened joins it straight away; otherwise she waits for the instructor.
    if (st && (st.stage === 'decide' || st.stage === 'running'))
      setTimeout(()=>{ S.year = st.year || 0; S.trades = 0;
                       go(st.stage === 'running' ? 'running' : 'decide'); }, 0); }
};

// =============================================================================
// THE YEAR
// =============================================================================
// The year that has just finished, as somebody else's research note. This used
// to run BEFORE the year was traded, which handed the manager the answer to the
// decision she was about to make. Everyone reads it — for the analysts it is
// the only market information they get, and it is what makes the twelve
// companies on their desks part of a world rather than twelve index cards.
SCREENS.review = {
  html(){ const y = YEARS[S.reviewYear] || YEARS[0]; const r = REVIEW[y] || { body:[] };
    const on = 'How my fund did';
    // Not escaped: the reviews are authored here and carry <b> on the figures
    // that matter, because a wall of plain prose is a wall nobody reads.
    return `<h1>${y} in review</h1>
      <p class="task">${r.strap || ''}</p>
      <div class="sect review">${(r.body||[]).map(x=>`<p>${x}</p>`).join('')}</div>
      <div class="small" style="margin-top:12px">Peak Research · global equity strategy</div>
      <div class="actions"><button id="n" class="wide">${esc(on)}</button></div>`; },
  wire(m){ m.querySelector('#n').onclick=()=>go('performance'); }
};

// ------------------------------------------------------------ the year runs
// The one moment in the game when all four devices are showing the same thing.
// Before this beat existed, a year was a button press and different numbers:
// nothing marked the difference between deciding and being answered. The
// manager's device resolves the year while this plays; everybody waits the
// same four seconds, which is also what keeps the room together.
const RUN_MS = 4200;
SCREENS.running = {
  html(){
    const y = YEARS[S.year];
    const hold = fundHoldings();
    const n = Object.keys(hold).length;
    return `<div class="runwrap">
      <div class="runyear">${y}</div>
      <div class="runline"><i></i></div>
      <div class="runsub" id="runsub">The market opens\u2026</div>
      <div class="small" style="margin-top:26px">${
        isMgr() ? `${n} holding${n===1?'':'s'} \u00b7 ${pct(S.fee)} a year`
                : `${esc(S.fundName||'Your fund')} is invested`}</div>
    </div>`;
  },
  wire(m){
    // Resolve on the manager's device, once, while the animation plays. A
    // severe event among the holdings stops her first: she answers for it
    // before the year lands, which is what lets the model spend the credit in
    // the same year. Her analysts keep watching the animation.
    if (isMgr() && S.fund && S.resolvedYear !== S.year) {
      const hit = severeHit();
      if (hit && S.crisisYear !== YEARS[S.year]) { S.crisis = hit; setTimeout(()=>go('crisis'), 900); return; }
      try { resolveYear(); } catch (err) { console.error('Peak ESG \u2014 year failed to resolve', err); }
    }
    const sub = m.querySelector('#runsub');
    const beats = ['The market opens\u2026', 'Companies report\u2026',
                   'Investors move their money\u2026', 'The year closes.'];
    let i = 0;
    const step = () => { i++; if (i < beats.length && sub) { sub.textContent = beats[i];
                         setTimeout(step, RUN_MS / beats.length); } };
    setTimeout(step, RUN_MS / beats.length);
    // Every device tells the worker it has finished; the first one moves the
    // stage on and the rest are ignored.
    // Each device moves itself on when the animation is done. The worker moves
    // its own stage to `results` on the same timer, so the control panel keeps
    // up without the clients having to reach it — a phone on the room wifi
    // cannot call the instructor's laptop, and should not need to.
    if (!S.runTimer) S.runTimer = setTimeout(() => {
      S.runTimer = null;
      S.reviewYear = S.year; S.reviewTo = null; go('review');
    }, RUN_MS + 200);
  }
};

// ------------------------------------------------ how the year actually went
// Both seats see this, which is new: the analysts used to get no financial
// information at all until the game was over. The companies the fund did NOT
// own are the point of the screen — a screening policy costs whatever the
// excluded companies returned, and until now nobody could see that number.
const idxRet = t => (t === YEARS.length - 1 ? ENDINGS.authored.index : INDEX.ret[t]);
const fundHoldings = () => isMgr() ? S.holdings : ((S.teamResult || {}).holdings || {});
const isMyFund = f => (!isMgr() && S.teamId && f.uid === S.teamId)
                   || (!!f.name && f.name === S.fundName);
// A company's in-house score in a given year, and the fund's weighted average.
// t = -1 means the 2021 starting score, which is what year one is measured from.
const scoreAt = (c, t) => t < 0 ? c.esg0 : c.esg[t];
const fundEsgAt = (hold, t) => { const w = M.weightsOf(hold);
  return Object.keys(hold).reduce((x, id) => x + w[id] * scoreAt(co(id), t), 0); };
const delta = d => !d ? '' : `<small>${d > 0 ? '+' : '\u2212'}${Math.abs(d)}</small>`;

// What the year did to your fund. This used to be two screens on two clocks:
// the manager got a private `result` the moment she pressed Run, and everyone
// got a `performance` at the next year turn. Same year, two retrospectives,
// different numbers, an unknown wait between them. One screen now, the same on
// every device, and it leads with the thing that mattered instead of burying
// it seventh in a list of nine.
const FLOW_WORDS = {
  base:         ['money moving into sustainable funds generally',  'money leaving sustainable funds generally'],
  performance:  ['beating the market',                             'trailing the market'],
  esg:          ['the portfolio\u2019s ESG score',                     'the portfolio\u2019s ESG score'],
  policy:       ['what the fund stands for',                       'what the fund stands for'],
  fee:          ['charging less than your rivals',                 'charging more than your rivals'],
  scandal:      ['',                                               'a scandal in the portfolio'],
  greenwashing: ['',                                               'the gap between what you promised and what you own'],
  concentration:['',                                               'holding too few companies'],
  pitch:        ['the policy you wrote',                           'the policy you wrote'],
  switched:     ['',                                               'investors who had bought the old strategy'],
  trust:        ['',                                               'changing your mind about what the fund stands for']
};
SCREENS.performance = {
  html(){
    const t = S.reviewYear, y = YEARS[t], idx = idxRet(t);
    const hold = fundHoldings();
    const tr = S.teamResult || {};
    const d  = isMgr() ? S.lastResult : null;
    const r  = isMgr() ? (d ? d.ret : null) : (tr.ret == null ? null : tr.ret);
    const feeYear = isMgr() ? (d ? d.feeTake : null) : (tr.yearFees == null ? null : tr.yearFees);
    const total = isMgr() ? (S.fund ? S.fund.feesEarned : 0) : (tr.fees || 0);
    const aum = isMgr() ? (d ? d.end : null) : (tr.aum == null ? null : tr.aum);
    const rows = UNIVERSE.map(c => ({ c, w: hold[c.id] || 0, r: M.ret(c, t, 'authored'),
                                      sc: scoreAt(c, t), dd: scoreAt(c, t) - scoreAt(c, t - 1) }))
                         .sort((a, b) => b.r - a.r);
    const owned = rows.filter(x => x.w), rest = rows.filter(x => !x.w);
    const line = x => `<div class="co${x.w ? ' held' : ''}">
      <div><div class="nm">${esc(x.c.name)}</div>
        <div class="ind">${esc(x.c.industry)}${
          x.w ? ` \u00b7 ${isMgr() ? 'you held' : 'the fund held'} ${x.w}\u00d7` : ''}</div></div>
      <span class="score ${x.sc>=70?'hi':x.sc<50?'lo':''}" style="margin-left:auto">${x.sc}${delta(x.dd)}</span>
      <span class="ret ${x.r >= idx ? 'up' : 'down'}">${pc(x.r, 0)}</span></div>`;
    const esgNow = Object.keys(hold).length ? fundEsgAt(hold, t) : null;
    const esgWas = Object.keys(hold).length ? fundEsgAt(hold, t - 1) : null;
    const esgMove = esgNow === null ? 0 : Math.round(esgNow) - Math.round(esgWas);

    // The single largest thing that moved the money, said in a sentence. A
    // uniform list gives a EUR 0.9m row the same weight as a EUR 109m one, and
    // the student reads the headline and misses the lesson.
    let big = '';
    if (d && d.flows) {
      const all = Object.entries(d.flows)
        .map(([k, v]) => ({ k, v, w: FLOW_WORDS[k] ? FLOW_WORDS[k][v >= 0 ? 0 : 1] : '' }))
        .filter(x => x.w && Math.abs(x.v) > 1)
        .sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
      if (all.length) { const x = all[0];
        big = `<div class="note ${x.v >= 0 ? 'good' : 'bad'}" style="margin-top:14px">
          <b>The biggest single thing this year: ${x.v >= 0 ? 'you gained' : 'you lost'}
          ${eur(Math.abs(x.v))} through ${x.w}.</b></div>`; }
    }
    const rowsHtml = d ? [['The market itself', d.marketMove],
      ['New money, market trend', d.flows.base],
      ['Performance against the market', d.flows.performance],
      ['The portfolio\u2019s ESG score', d.flows.esg],
      ['What the fund stands for', d.flows.policy],
      ['Your fee against your rivals', d.flows.fee],
      ['Scandals in the portfolio', d.flows.scandal],
      ['The gap between words and holdings', d.flows.greenwashing],
      ['Holding too few companies', d.flows.concentration],
      ['The policy you wrote', d.flows.pitch],
      ['Investors who wanted the old strategy', d.flows.switched],
      ['Trust, after changing your mind', d.flows.trust]]
      .filter(([, v]) => Math.abs(v) > 0.05) : [];

    return `<h1>${y}: how your fund did</h1>
      <p class="task">What the year did to your money, and to every company in the universe.</p>
      ${r === null ? `<div class="note">Waiting for your fund\u2019s numbers.</div>` : `
        <div class="big ${r >= idx ? 'up' : 'down'}">${pc(r)}</div>
        <div class="small">your fund\u2019s return in ${y} \u2014 the market returned ${pc(idx)}</div>
        ${big}
        <div class="decomp" style="margin-top:16px">
          ${aum === null ? '' : `<div class="row"><span>The fund is now worth</span><span class="amt">${eur(aum)}</span></div>`}
          ${feeYear === null ? '' : `<div class="row"><span>Fees earned in ${y}</span><span class="amt">${eur(feeYear)}</span></div>`}
          <div class="row tot"><span>Fees earned so far</span><span class="amt">${eur(total)}</span></div>
        </div>
        ${rowsHtml.length ? `<details class="ex"><summary>Where the money went, line by line</summary>
          <div class="decomp">${rowsHtml.map(([k, v]) => `<div class="row"><span>${k}</span>
            <span class="amt ${v >= 0 ? 'pos' : 'neg'}">${eur(v)}</span></div>`).join('')}</div>
        </details>` : ''}`}
      ${esgNow === null ? '' : `<div class="note info">
        <b>The fund\u2019s ESG score is ${esgNow.toFixed(0)} out of 100</b>${
          esgMove === 0 ? ', unchanged this year'
            : `, ${esgMove > 0 ? 'up' : 'down'} ${Math.abs(esgMove)} from ${esgWas.toFixed(0)}`}.
        It moves on its own, without anybody trading: the rating team re-scores every
        company each year.</div>`}
      <h2>What the fund owned</h2>
      ${owned.length ? owned.map(line).join('') : `<div class="note">Nothing.</div>`}
      <h2>What it did not own</h2>
      <p class="small">This is what the policy and the portfolio cost the fund, or saved it.</p>
      ${rest.map(line).join('')}
      <div class="actions"><button id="n" class="wide">How everyone else did</button></div>`;
  },
  wire(m){ m.querySelector('#n').onclick = () => go('standings'); }
};

// ------------------------------------------------------------- the room ----
SCREENS.standings = {
  html(){
    const y = YEARS[S.reviewYear];
    const board = (S.board || []).slice().sort((a, b) => (b.fees || 0) - (a.fees || 0));
    const me = board.findIndex(isMyFund);
    return `<h1>Where everyone stands</h1>
      <p class="task">Total fees earned after ${y}. This is the only thing you are scored on.</p>
      ${board.length ? `<div class="decomp">${board.map((f, i) => `<div class="row${isMyFund(f) ? ' tot' : ''}">
        <span>${i + 1}. ${esc(f.name || 'Unnamed')}${isMyFund(f) ? ' \u2014 yours' : ''}</span>
        <span class="amt">${eur(f.fees || 0)}</span></div>`).join('')}</div>`
        : `<div class="note">No other funds yet.</div>`}
      ${me > 0 ? `<div class="note">${eur((board[0].fees||0) - (board[me].fees||0))} behind the leader.</div>`
        : me === 0 && board.length > 1 ? `<div class="note good">You are ahead.</div>` : ''}
      <div class="note info">Every fund here is running the same six years and the same twelve
        companies. The differences are all decisions.</div>
      <div class="actions"><button id="n" class="wide">${
        S.reviewTo ? 'See the final result' : 'Done'}</button></div>`;
  },
  wire(m){ m.querySelector('#n').onclick = () => {
    if (S.reviewTo) { const t = S.reviewTo; S.reviewTo = null; go(t); return; }
    go(isMgr() ? 'wait' : 'standby'); }; }
};

SCREENS.news = {             // analyst: what happened to my four
  html(){ const y=YEARS[S.year];
    const items = myDesk().map(id=>({ c:co(id), n:newsFor(id,y) })).filter(x=>x.n);
    return `<h1>${y}</h1>
      <p class="task">Your companies. One of these probably matters more than the others.</p>
      ${items.map(({c,n})=>`<div class="sect" style="margin-bottom:10px">
        <div class="small">${esc(c.name)}</div>
        <b>${esc(n.t)}</b><div style="margin-top:3px">${esc(n.s)}</div></div>`).join('')}
      <div class="actions"><button id="n" class="wide">Got it</button></div>`; },
  wire(m){ m.querySelector('#n').onclick=()=>go('standby'); }
};

SCREENS.standby = {          // analyst: between decisions
  html(){ const y=YEARS[S.year];
    return `<h1>Tell the manager</h1>
      <p class="task">The manager has no company information at all. Tell them what matters
        most about your four, and why.</p>
      ${myDesk().map(id=>{ const c=co(id); const f=S.flags[id];
        return `<div class="co${f?' held':''}" data-id="${id}">
          <div><div class="nm">${esc(c.name)}</div><div class="ind">${esc(c.industry)}</div></div>
          <span class="small" style="margin-left:auto">${f?REC:'Tap to recommend'}</span></div>`; }).join('')}
      <div class="note">Recommending a company puts your name beside it on the manager's
        screen: <b>“${esc((S.who||'You').trim()||'You')} recommended it”</b>. It does not say why —
        you have to explain that yourself.</div>
      <div class="actions"><button class="ghost" id="r">Re-read my dossiers</button></div>`; },
  wire(m){ m.querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{
      const id=r.dataset.id; S.flags[id]=!S.flags[id]; publishMe(); paint(); });
    m.querySelector('#r').onclick=()=>go('desk'); }
};

// Beat 1. Three things you may change, each said plainly, each with its own
// budget shown before you spend it. The old screen put the rules in one line
// of grey text above a slider and then refused silently when you broke them —
// taps simply did nothing, which is indistinguishable from the app being
// broken. There is no Run button: the instructor runs the year.
const ADDS_YEAR = 2, DROPS_YEAR = 2;
SCREENS.decide = {
  html(){
    const n = Object.keys(S.holdings).length;
    const breach = M.breaches(S.policy, S.holdings);
    const addsLeft = ADDS_YEAR - (S.adds || 0), dropsLeft = DROPS_YEAR - (S.drops || 0);
    const chip = (k, left, of) => `<span class="budget ${left ? '' : 'spent'}">${
      left ? `${left} of ${of} left` : `none left`} \u00b7 ${k}</span>`;
    return `<h1>${YEARS[S.year]}: do you want to change anything?</h1>
      <p class="task">The year has not happened yet. Talk to your analysts first \u2014 they
        have read this year\u2019s news and you have not.</p>

      <h2>1 \u00b7 The fee</h2>
      <p class="small">What investors pay you each year. Your rivals are charging about
        <b>${pct(S.peerFee)}</b>.</p>
      <div class="big">${pct(S.fee)}</div>
      <input type="range" id="r" min="10" max="200" step="5" value="${Math.round(S.fee*10000)}">

      ${S.year >= 5 ? '' : `<h2>2 \u00b7 What the fund stands for</h2>
      <div class="note warn"><span class="risky">\u26a0</span>
        <b>${esc(STRAT_NAME[S.policy.strategy] || 'Your policy')}.</b>
        ${S.switches ? `You have changed this ${S.switches === 1 ? 'once' : S.switches + ' times'} already. ` : ''}
        Changing it is the one expensive move on this screen: a fixed share of your
        investors leave immediately, and the ones who care most about sustainability
        trust you less for the rest of the game.
        <div class="actions" style="margin-top:10px">
          <button class="ghost" id="switch">Change what the fund stands for</button></div>
      </div>`}

      <h2>${S.year >= 5 ? '2' : '3'} \u00b7 The companies</h2>
      <p class="small">Tap a company to buy or drop it. Tap its weight to change how much of
        it you hold. ${chip('to add', addsLeft, ADDS_YEAR)} ${chip('to drop', dropsLeft, DROPS_YEAR)}
        <span class="budget">weights \u00b7 as many as you like</span></p>
      ${UNIVERSE.map(c => { const w = S.holdings[c.id];
        const blocked = w ? !dropsLeft : !addsLeft;
        return `<div class="co ${w ? 'held' : ''}${blocked ? ' off' : ''}" data-id="${c.id}">
          <div><div class="nm">${esc(c.name)}</div>
            <div class="ind">${esc(c.industry)}</div>
            ${recNote(c.id)}</div>
          ${w ? `<button class="ghost" data-w="${c.id}" style="min-height:38px;padding:6px 14px">${w}\u00d7</button>`
              : `<span class="small">not held</span>`}</div>`; }).join('')}
      ${n < M.MIN_HOLDINGS ? `<div class="note bad">You hold ${n}. The fund needs at least
        ${M.MIN_HOLDINGS} \u2014 add ${M.MIN_HOLDINGS - n} more.</div>` : ''}
      ${breach.length ? `<div class="note warn">${breach.length} holding${breach.length === 1 ? ' is' : 's are'}
        outside the policy you wrote. You may keep ${breach.length === 1 ? 'it' : 'them'};
        investors will notice.</div>` : ''}

      <div class="waitbox"><b>Waiting for ${YEARS[S.year]} to run</b>
        <div class="small" style="margin-top:4px">Change what you like until the instructor
          runs the year. Nothing you do here costs anything until then.</div></div>`;
  },
  wire(m){
    const r = m.querySelector('#r');
    r.oninput = () => { S.fee = +r.value / 10000; paint(); const x = $('#r'); if (x) x.focus(); };
    const sw = m.querySelector('#switch');
    if (sw) sw.onclick = () => go('switch');
    // Weights are free; adds and drops are not. A refusal says so out loud
    // rather than doing nothing, which is what made the screen look broken.
    m.querySelectorAll('[data-w]').forEach(b => b.onclick = e => { e.stopPropagation();
      const id = b.dataset.w;
      S.holdings[id] = (S.holdings[id] % M.MAX_WEIGHT) + 1; publishMe(); paint(); });
    m.querySelectorAll('[data-id]').forEach(row => row.onclick = () => {
      const id = row.dataset.id;
      if (S.holdings[id]) {
        if ((S.drops || 0) >= DROPS_YEAR) {
          botSay('Head of Distribution', `${Hey()}that is both of your sales for ${YEARS[S.year]}. You can still change the weights, and the fee.`);
          paint(); return;
        }
        S.drops = (S.drops || 0) + 1; delete S.holdings[id];
      } else {
        if ((S.adds || 0) >= ADDS_YEAR) {
          botSay('Head of Distribution', `${Hey()}that is both of your purchases for ${YEARS[S.year]}. You can still change the weights, and the fee.`);
          paint(); return;
        }
        S.adds = (S.adds || 0) + 1; S.holdings[id] = 1;
      }
      publishMe(); paint();
    });
  }
};

// ------------------------------------------------- changing the strategy ---
// Allowed, and costly, which is the only way it stays a decision. The cut is
// one-off and recoverable through performance; the conviction money's view of a
// manager who changes her mind is not. Measured: switching as a tactic loses
// about half a million, switching to rescue an over-strict policy gains about a
// million if you notice in the first year and nothing by the last.
SCREENS.switch = {
  html(){
    return `<h1>Change what the fund stands for</h1>
      <p class="lede">You promised <b>${esc(STRAT_NAME[S.policy.strategy]||'something')}</b>.
        Changing it now costs you <b>${(M.SWITCH_CUT*100).toFixed(0)}%</b> of the fund,
        immediately — those investors bought the old promise.</p>
      <div class="note warn"><b>There is a lasting cost as well.</b> Investors who care most
        about sustainability trust a manager who changes their mind less, every year from
        now on, and the effect doubles if you change twice.</div>
      <div class="note good"><b>And there can be a gain.</b> A different policy admits
        different companies. If the one you wrote is keeping the fund out of the companies
        that are actually performing, changing it can earn back more than it costs — most of
        all in the early years, when there is time left to recover. A policy written before
        you knew anything about the market is not a promise you are obliged to keep.</div>
      <p class="task">You will choose the strategy again, set how strict it is, and write
        the policy again — investors have to be told what the fund now stands for.
        <b>The decision is yours.</b></p>
      <div class="actions">
        <button class="ghost" id="no">Keep the current policy</button>
        <button id="yes">Change it</button></div>`;
  },
  wire(m){
    m.querySelector('#no').onclick = () => go('decide');
    m.querySelector('#yes').onclick = () => {
      S.switching = true;               // the policy screens return here, not to the fee
      go('strategy');
    };
  }
};

// A severe event among the holdings this year, if there is one. The manager
// learns of it after she has decided, and answers for it before the year lands.
function severeHit(){
  const w = M.weightsOf(S.holdings);
  for (const id of Object.keys(S.holdings)) {
    const c = co(id), ev = M.eventIn(c, S.year);
    if (ev && ev.sev === 'severe') return { c, ev, weight: w[id] };
  }
  return null;
}

SCREENS.crisis = {
  html(){ const { c, ev, weight } = S.crisis;
    const outside = !M.admits(S.policy, c);
    return `<h1>A scandal in your portfolio</h1>
      <p class="task">${esc(c.name)} is ${(weight*100).toFixed(0)}% of the fund. Investors will
        ask you about it today.</p>
      <div class="note bad"><b>${esc(c.name)}, ${YEARS[S.year]}</b><div style="margin-top:4px">${esc(ev.note)}</div></div>
      ${outside?`<div class="note warn">This company was outside the policy you wrote, and you owned it anyway.</div>`:''}
      <h2>What do you say?</h2>
      <p class="small">Two or three sentences. Your answer is checked against what the fund
        actually owned. A credible answer halves the damage to the fund's reputation; it
        cannot recover the money lost on the shares.</p>
      <textarea id="t" placeholder="Our position in ${esc(c.name)}\u2026">${esc(S.crisisText||'')}</textarea>
      <div class="actions">
        <button id="n" class="wide">Issue the statement</button>
        <button class="ghost" id="skip">Say nothing</button></div>`; },
  wire(m){
    const t=m.querySelector('#t'); t.oninput=()=>{S.crisisText=t.value;};
    const send = (text)=>{ const { c, ev, weight } = S.crisis;
      S.crisisText=text; S.crisisYear=YEARS[S.year]; S.crisisEvent=ev.note;
      S.crisisCompany=c.name; S.crisisWeight=weight;
      S.crisisOutside=!M.admits(S.policy,c);
      publishMe();
      const done = () => { resolveYear(); S.reviewYear = S.year; S.reviewTo = null; go('review'); };
      if (!text) { done(); return; }
      // Offline there is no assessor, so score it by rule: a specific answer of
      // reasonable length earns some credit, silence earns none. Never more than
      // half, and never against the loss on the shares.
      if (S.net.mode !== 'fire') {
        const words = text.split(/\s+/).length;
        const specific = new RegExp(S.crisis.c.name.split(' ')[0], 'i').test(text);
        S.fund.crisisCredit = Math.min(0.5, (words>=25?0.35:words>=12?0.2:0.05) + (specific?0.12:0));
        botSay('Head of Distribution',
          Hey()+'your statement has been assessed on this device, without the AI.');
        done(); return;
      }
      S.waitStarted=Date.now(); go('crisiswait');
      const poll=()=>{ const scored = S.aiCrisisYear===YEARS[S.year];
        if (scored || Date.now()-S.waitStarted>9000) done(); else setTimeout(poll,500); };
      setTimeout(poll,600);
    };
    m.querySelector('#n').onclick=()=>send((t.value||'').trim());
    m.querySelector('#skip').onclick=()=>send('');
  }
};

SCREENS.crisiswait = {
  html(){ return `<h1>Your statement has gone out</h1>
    <p class="lede">It is being read now.</p>
    <p class="task">This takes a moment.</p>`; }
};

function resolveYear(){
  S.fund.holdings = S.holdings; S.fund.fee = S.fee;
  S.fund.policy = S.policy; S.fund.overclaim = S.overclaim || 0;
  if (S.appeal) S.fund.appeal = S.appeal;
  S.fund.switches = S.switches || 0;
  // 2027 is the authored year — the war ends, oil falls, sentiment recovers.
  // It has to be applied in play, not only in the end-of-game comparison, or
  // the game never runs the scenario it argues from.
  const { fund, decomposition } = M.playYear(S.fund, S.year,
    { peerFee:S.peerFee, ending:'authored' });
  S.fund = fund; S.lastResult = decomposition;
  // §7, severity crossover. A minor story stays with the specialist who owns
  // the company; a big enough one is simply financial news and reaches the
  // manager too — but only for companies she actually holds. That gives the
  // intended asymmetry for free: the analyst saw the warning a year or two
  // earlier as a 'watch', and the manager only ever sees the explosion.
  const y = YEARS[S.year];
  Object.keys(S.holdings).forEach(id => {
    const n = newsFor(id, y);
    if (n && n.w === 'major') botSay('Head of Distribution',
      `<b>${Hey()}we own this.</b> ${esc(co(id).name)}: ${esc(n.t)} — ${esc(n.s)}`);
  });

  // the Head of Distribution reacts to what just happened
  const d = decomposition;
  if (d.flows.scandal < -8) botSay('Head of Distribution',
    `<b>${Hey()}this is bad.</b> We lost <b>${eur(-d.flows.scandal)}</b> over a scandal at one of our holdings, and investors are asking what we knew.`);
  else if (d.flows.greenwashing < -5) botSay('Head of Distribution',
    `<b>${Hey()}we are being caught out.</b> <b>${eur(-d.flows.greenwashing)}</b> left over the gap between what our policy promises and what we actually own. That is money we could keep just by meaning what we say.`);
  else if (d.flows.fee < -6) botSay('Head of Distribution',
    `<b>${Hey()}we are too expensive.</b> <b>${eur(-d.flows.fee)}</b> walked out over price alone. Think about the fee.`);
  else if (d.ret > d.retIndex + 4) botSay('Head of Distribution',
    `<b>${Hey()}good year.</b> We beat the market by <b>${pc(d.ret-d.retIndex)}</b>. We could charge more for this.`);
  else botSay('Head of Distribution',
    `${Hey()}we earned <b>${eur(d.feeTake)}</b> in fees this year, and the fund is ${d.end>=d.start?'up':'down'} at <b>${eur(d.end)}</b>.`);
  S.resolvedYear = S.year;
  publishMe();
}

// --------------------------------------------------- the analyst's ending ---
// Three quarters of the room used to get no ending at all: the manager played
// through to the result and the analysts sat on "Tell her" until the laptop was
// closed. This is their payoff, and the hook for the debrief.
SCREENS.teamfinal = {
  html(){
    const r = S.teamResult;
    if (!r) return `<h1>Five years on</h1>
      <p class="lede">Waiting for your fund's result.</p>
      <div class="note">It will appear here in a moment.</div>`;
    const mine = myDesk().map(id => ({ c:co(id), w:(r.holdings||{})[id]||0, f:!!S.flags[id] }));
    const held = mine.filter(x=>x.w);
    return `<h1>${esc(r.name || 'Your fund')}</h1>
      <div class="big">${eur(r.fees||0)}</div>
      <div class="small">total fees earned${r.rank?` — ${ord(r.rank)} of ${r.of}`:''}</div>
      <div class="note info"><b>Portfolio ESG score ${Math.round(r.esg||0)}.</b>
        ${r.esgRank?`Your fund is ${ord(r.esgRank)} of ${r.of} on sustainability and ${ord(r.rank)} of ${r.of} on fees.
        Compare those two numbers across the room.`:''}</div>
      <h2>Your four, and what the manager did with them</h2>
      <div class="decomp">${mine.map(x=>`<div class="row">
        <span>${esc(x.c.name)}${x.f?' <span class="small">· you recommended it</span>':''}</span>
        <span class="amt">${x.w?`held ${x.w}×`:'not held'}</span></div>`).join('')}</div>
      <div class="note">${
        held.length===0 ? 'The manager held none of your four. Did they hear what you told them, or did you not push hard enough?'
        : mine.some(x=>x.f && x.w) ? 'The manager bought something you had recommended. Was that your call or theirs — and did you tell them why?'
        : 'Nothing you recommended ended up in the book.'}</div>`;
  }
};

SCREENS.wait = {
  html(){
    // The year is opened from the front of the room. Offline, where there is no
    // room, the manager needs a way to move; in a real session the button only
    // ever confused people, because the client cannot write the session anyway.
    const solo = !S.net || S.net.mode !== 'fire';
    const next = YEARS[Math.min(5, S.year + 1)];
    return `<h1>${YEARS[S.year]} is finished</h1>
    <p class="lede">Total fees so far: <b>${eur(S.fund?S.fund.feesEarned:0)}</b>.</p>
    <div class="waitbox"><b>Waiting for ${S.year >= 5 ? 'the final result' : next}</b>
      <div class="small" style="margin-top:4px">${S.year >= 5
        ? 'The instructor will reveal every fund\u2019s result.'
        : 'The instructor opens the next year from the front of the room.'}</div></div>
    <p class="task">Use the time: ask your analysts what changed on their desks, and what
      they are watching for next year.</p>
    ${solo?`<div class="actions"><button class="ghost" id="adv">Advance (testing)</button></div>`:''}`; },
  wire(m){ const a=m.querySelector('#adv'); if(a) a.onclick=()=>advance(); }
};

SCREENS.final = {
  html(){
    // The live game already happened, crisis responses and all. Re-running it
    // from scratch under another ending would also discard those, so the
    // authored row would not match what the team actually earned. Instead take
    // the real total and apply the DIFFERENCE each alternative ending makes,
    // measured on a like-for-like replay. The authored row is then exact.
    const base = { holdings:S.holdings, policy:S.policy, fee:S.fee,
                   overclaim:S.overclaim||0, appeal:S.appeal||null };
    const ref  = M.runUnderEnding(base,'authored').feesEarned;
    const live = S.fund.feesEarned;
    const rows = Object.entries(ENDINGS).map(([k,e])=>({ k, e,
      fees: k==='authored' ? live : live + (M.runUnderEnding(base,k).feesEarned - ref) }));
    const esg = M.portfolioESG(S.holdings,5);
    return `<h1>Five years on</h1>
      <div class="big">${eur(S.fund.feesEarned)}</div>
      <div class="small">total fees earned over the six years — your score</div>
      <h2>The same fund under three other endings</h2>
      <p class="small">2027 was invented for this game. These are what your fund would have
        earned if it had gone differently.</p>
      <div class="decomp">${rows.map(r=>`<div class="row"><span>${esc(r.e.label)}</span>
        <span class="amt">${eur(r.fees)}</span></div>`).join('')}</div>
      <div class="note info"><b>Portfolio ESG score: ${esg.toFixed(0)}.</b>
        You were not scored on this. Every fund's is about to go on the board.</div>
      <div class="note">${rows[0].fees >= Math.max(...rows.map(r=>r.fees)) - 0.5
        ? 'Your fund did as well or better under every ending, so the result did not depend on guessing which one would happen.'
        : `Under the best of the other three you would have earned ${eur(Math.max(...rows.slice(1).map(r=>r.fees)))};
           under the worst, ${eur(Math.min(...rows.slice(1).map(r=>r.fees)))}. Your result depended on which future turned out to be true.`}</div>`;
  }
};

// =============================================================================
// WIRING TO THE SESSION
// =============================================================================
function connect(){
  S.net = makeNet({ mode: (new URLSearchParams(location.search)).get('net')==='local'?'local':'fire',
                    code: S.code });
  S.net.onState(st=>{
    // The stage the worker is in IS our phase; what matters for routing is the
    // moment it changes, because the instructor opening a year is the only
    // thing that moves anybody into one.
    const prevStage = S.phase, prevYear = S.year;
    S.phase = st.stage || S.phase;          // `phase` belongs to the Firestore rules
    const stageChanged = st.stage !== prevStage || st.year !== prevYear;
    S.peerFee = S.net.peerFee(M.FEE_START);
    S.countdownEnds = st.countdownEnds || null;
    // what the assessor made of the prose
    const mine = st.mine || {};
    S.board = st.board || S.board || [];
    // Keyed on a stamp of the wording, so a policy rewritten mid-game is scored
    // again. It used to be scored once per fund, which meant the switch screens
    // asked for new words that were never read.
    if (mine.aiPitch && S.aiPitchStamp !== (mine.aiPitch.stamp || 'x')) {
      S.aiPitchStamp = mine.aiPitch.stamp || 'x';
      S.overclaim = mine.aiPitch.overclaim || 0;
      // The three appeal scores are what the prospectus actually bought. They
      // were being computed and thrown away; the model now spends them.
      S.appeal = { conv: mine.aiPitch.conviction  || 0,
                   main: mine.aiPitch.mainstream  || 0,
                   retn: mine.aiPitch.returnDriven || 0 };
      if (S.fund) S.fund.appeal = S.appeal;
      S.aiNote = mine.aiPitch.note || '';
      botSay('Head of Distribution',
        `<b>${Hey()}I have read your policy.</b> ${esc(mine.aiPitch.note || 'It will do.')}`);
    }
    if (mine.aiCrisis && S.aiCrisisYear !== mine.aiCrisis.year) {
      S.aiCrisisYear = mine.aiCrisis.year;
      if (S.fund) S.fund.crisisCredit = mine.aiCrisis.credit || 0;
      botSay('Head of Distribution',
        `<b>${Hey()}the market has read your statement.</b> ${esc(mine.aiCrisis.note || 'It landed.')}`);
    }
    // Her own analysts' flags, and only theirs. The worker matches them by team
    // and writes them into her document, because the rules let a student read
    // nobody else's. A flag is a bare dot — it says something here, never what,
    // so she still has to ask. That is the point.
    if (isMgr() && mine.teamFlags) S.peerFlags = mine.teamFlags;
    // An analyst's fund result, written back the same way at the reveal.
    if (!isMgr() && mine.teamResult) S.teamResult = mine.teamResult;
    if (mine.teamRoster) S.roster = mine.teamRoster;
    if (!isMgr()) {
      // Removed by the manager. Let go of the fund so the picker is usable
      // again, and say who did it — otherwise the screen simply empties.
      if (mine.evicted && mine.evicted === S.teamId) {
        const was = S.fundName;
        S.teamId = null; S.fundName = ''; S.desk = null; S.joinedAt = null;
        S.roster = null; S.evictedFrom = was;
        publishMe(); go('team'); return;
      }
      S.deskFull = !!mine.full;
      if (mine.desk && mine.desk !== S.desk) S.desk = mine.desk;
      const f = (S.board||[]).find(x => x.uid === S.teamId);
      if (f) { S.analystsPresent = Math.max(1, (f.seats||1) - 1); S.fundName = f.name || S.fundName; }
      // seated at last
      if (S.screen === 'seat' && S.desk && !S.deskFull) go('brief');
      if (S.screen === 'seat' && S.deskFull) go('team');
    }
    // The guard on `review` has to be narrow: skip only the review that already
    // leads to the ending, or a player who happens to be reading a mid-game
    // review when the instructor ends the game never reaches their result.
    // ------------------------------------------------- the three beats ----
    // The instructor owns both transitions: `decide` opens a year, `running`
    // resolves it. Everything else follows from the stage, so the two roles
    // can never drift onto different moments in time again.
    const RESULTS = ['review', 'performance', 'standings'];
    const BUSY = ['crisis', 'crisiswait'];   // mid-statement: do not move her
    const ENDINGS = ['final', 'teamfinal'];
    const onEnding = RESULTS.includes(S.screen) && S.reviewTo;
    // Anyone still setting up is left where they are: the manager joins the
    // year when she opens the fund, a late analyst at the next year.
    const stillSetting = isMgr() ? !S.fund
      : (!S.desk || S.screen==='join' || S.screen==='team' || S.screen==='seat');

    if (st.stage === 'reveal' && !ENDINGS.includes(S.screen) && !onEnding && S.screen !== 'join') {
      // The last year is the authored one, so its review comes first.
      S.reviewYear = YEARS.length - 1;
      S.reviewTo = isMgr() ? 'final' : 'teamfinal';
      go('review');
    } else if (stillSetting) { save(); paint(); }
    else if (st.stage === 'running' && S.screen !== 'running' && !BUSY.includes(S.screen)) {
      S.year = st.year; go('running');
    } else if (st.stage === 'decide' && stageChanged) {
      // A new year to decide. Analysts read this year's news first.
      S.year = st.year; S.trades = 0; S.adds = 0; S.drops = 0;
      go(isMgr() ? 'decide' : 'news');
    } else if (st.stage === 'results' && !RESULTS.includes(S.screen)
               && S.screen !== 'running' && !BUSY.includes(S.screen)) {
      // Rejoined late, or reloaded mid-results.
      S.reviewYear = st.year; S.reviewTo = null; go('review');
    } else if (S.screen !== 'join' && S.screen !== 'team') { save(); paint(); }
    else if (S.screen === 'team') { paint(); }
  });
}
function publishMe(){
  if (!S.net) return;
  S.net.publish(S.role + '_' + (S.fundName||'g'), {
    role:S.role, name:S.fundName, teamId:S.teamId, joinedAt:S.joinedAt||null,
    who: (S.who||'').slice(0,24),
    fee:S.fee, flags:S.flags,
    esg: S.fund ? M.portfolioESG(S.holdings, Math.min(5,S.year)) : null,
    year: S.year,
    // Readiness means a RESOLVED year, not a year counter the worker moved.
    resolvedYear: S.resolvedYear == null ? null : S.resolvedYear,
    policy:S.policy, holdings:S.holdings,
    policyText:S.policyText, ejected:S.ejected||{},
    crisisText:S.crisisText||'', crisisYear:S.crisisYear||null,
    crisisEvent:S.crisisEvent||'', crisisCompany:S.crisisCompany||'',
    crisisWeight:S.crisisWeight||0, crisisOutside:!!S.crisisOutside,
    fees:S.fund?S.fund.feesEarned:0, aum:S.fund?M.totalAUM(S.fund):0,
    // The analysts' end-of-year screen is built from these: they have no fund
    // object of their own, so the manager's numbers travel through the worker.
    ret: S.lastResult ? S.lastResult.ret : null,
    yearFees: S.lastResult ? S.lastResult.feeTake : null });
  save();
}
function advance(){            // testing only; the instructor does this for real
  const s = S.net.session();
  S.net.setSession({ year: Math.min(5,(s.year||0)+1), stage:'play' });
}

// ------------------------------------------------------------------- boot ---
// ?fresh forgets this device's saved game. Rewrite the URL rather than
// navigating: assigning location.search reloads before the script finishes,
// and with an empty value it can loop.
const Q = new URLSearchParams(location.search);
if (Q.has('fresh')) {
  localStorage.removeItem(KEY);
  Q.delete('fresh');                       // keep net=fire and anything else
  try { history.replaceState(null, '', location.pathname + (Q.toString() ? '?' + Q : '')); }
  catch (e) {}
} else {
  const prev = load();
  if (prev && prev.code) {
    // Resuming is the risky step: a save written by an older build, or one
    // holding a screen that no longer exists, must not cost us the whole page.
    try { Object.assign(S, prev); connect(); }
    catch (err) {
      console.error('Peak ESG — could not resume the saved game; starting clean.', err);
      startClean();
    }
  }
}
try { paint(); }
catch (err) {
  console.error('Peak ESG — first paint failed; starting clean.', err);
  startClean(); paint();
}
// Delegated, because the header is rewritten whenever the roster changes and a
// handler bound to the old node would go with it.
document.addEventListener('click', e => {
  const c = e.target.closest && e.target.closest('#crew');
  if (c && isMgr()) { S.teamOpen = true; paint(); }
});
window.__peakBooted = true;              // the boot guard in index.html watches this
window.PEAK = { S, M, go, advance, publishMe };  // for testing from the console
