// =============================================================================
// Peak ESG — the client   ·   published 2026-11-04 14:02 UTC
// =============================================================================
// One screen, one kind of information, with a visible sense of where you are.
// Everything numeric comes from model/model.mjs; nothing is decided here.
// =============================================================================
import * as M from './model/model.mjs?v=11041402';
import { UNIVERSE, ACTIVITIES } from './data/universe.mjs?v=11041402';
import { INDEX, YEARS, REVIEW, SCENARIO, ENDINGS } from './data/world.mjs?v=11041402';
import { NEWS, newsFor } from './data/news.mjs?v=11041402';
import { ROLES, DESKS, SEATS, MAX_ANALYSTS, deskFor } from './roles.mjs?v=11041402';
import { makeNet } from './net.mjs?v=11041402';

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
  policy:{ strategy:null, excluded:[], rank:5, minScore:50 },
  policyText:'', fee:M.FEE_START,
  reviewYear:0, reviewTo:null,     // which year's review, and where it leads
  holdings:{}, fund:null, lastResult:null,
  openCo:null, openSect:'prof', flags:{}, trades:0,
  bot:[], botOpen:false, confirmNew:false, peerFee:M.FEE_START
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
  policy:S.policy, policyText:S.policyText,
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

// ------------------------------------------------------------------- rail ---
const MARK = `<svg width="22" height="20" viewBox="0 0 120 130"><g>
  <path fill="var(--green)" d="M6 62 L20 48 L27 53 L38 33 L45 39 L54 20 L63 6 L72 31 L79 25 L90 46 L97 39 L108 58 L114 62 Z"/>
  <path fill="var(--green)" opacity=".3" d="M6 68 L20 82 L27 77 L38 97 L45 91 L54 110 L63 124 L72 99 L79 105 L90 84 L97 91 L108 72 L114 68 Z"/>
</g></svg>`;

function rail() {
  const playing = S.phase==='play' || S.phase==='done';
  const dots = playing
    ? YEARS.map((y,i)=>`<i class="${i<S.year?'on':i===S.year?'now':''}"></i>`).join('')
    : '';
  const where = playing ? `${YEARS[S.year]} · year ${S.year+1} of 6` : stepLabel();
  const left = S.countdownEnds ? Math.max(0, Math.round((S.countdownEnds - Date.now())/1000)) : 0;
  const cd = left ? `<span class="clock">${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}</span>` : '';
  return `<header class="top"><div class="rail">
    <span class="mark">${MARK} Peak <span class="esg">ESG</span></span>
    <span class="where">${esc(where)}</span>${cd}
    <span class="dots">${dots}</span></div>${crew()}</header>`;
}
// Who is on this fund, under the rail, on every screen. The player's own name
// is marked so four people round one laptop can tell whose screen they are on.
function crew(){
  const r = S.roster;
  if (!r || !S.fundName) return '';
  const me = (S.who||'').trim();
  const tag = n => n && n === me ? `<b>${esc(n)}</b>` : esc(n || '—');
  const an = (r.analysts||[]).filter(Boolean);
  return `<div class="crew"><span class="f">${esc(r.fund || S.fundName)}</span>
    <span>Managed by ${tag(r.manager)}</span>
    ${an.length ? `<span>Analysts: ${an.map(tag).join(', ')}</span>`
                : `<span class="muted">No analysts yet</span>`}</div>`;
}
function stepLabel(){
  const m = { intro:'how it works', join:'joining', brief:'the brief', strategy:'step 1 of 3 · strategy',
    threshold:'step 2 of 3 · policy', fee:'step 3 of 3 · price',
    wait:'waiting', desk:'your desk',
    dossier:'your desk', allocate:'the portfolio', open:'open for business',
    team:'which fund?', seat:'taking a seat', teamfinal:'the result', final:'the result',
    switch:'changing the policy', review:'the year in review',
    standby:'brief the manager', news:'the news' };
  return m[S.screen] || '';
}

// -------------------------------------------------------------- bot strip ---
function botSay(who, msg, year){
  S.bot.push({ who, msg, year: year ?? YEARS[S.year] }); save();
}
function botStrip(){
  const last = S.bot[S.bot.length-1];
  const who = isMgr() ? 'Head of Distribution' : 'Head of Sustainability';
  const cls = isMgr() ? 'botstrip dist' : 'botstrip';
  // The first thing either of them says is who they are. Before this the strip
  // read "Nothing from me yet", which told a student nothing about why a
  // stranger was going to be talking to them for the rest of the game.
  const hello = isMgr()
    ? 'I bring the money in. I will tell you what investors are doing, what our rivals are charging, and what the market makes of our policy.'
    : 'I am your research, and your conscience. I will tell you when a rating moves or a story breaks on one of your four.';
  if (!last) return `<div class="${cls} quiet" id="bot">
      <span class="av">${isMgr()?'D':'S'}</span>
      <div><div class="who">${who}</div><div class="msg">${hello}</div></div></div>`;
  return `<div class="${cls}" id="bot">
    <span class="av">${isMgr()?'D':'S'}</span>
    <div><div class="who">${esc(last.who)}</div><div class="msg">${last.msg}</div></div>
    <span class="more">${S.bot.length} ›</span></div>`;
}
function botLog(){
  return `<div class="botlog" id="botlog"><div class="sheet">
    <h2 style="margin-top:0">Everything you have been told</h2>
    ${S.bot.slice().reverse().map(b=>`<div class="item">
      <div class="yr">${b.year} · ${esc(b.who)}</div><div>${b.msg}</div></div>`).join('')}
    <p class="small" style="text-align:center;margin:16px 0 4px;opacity:.65">${
      S.confirmNew
        ? `This erases this device's game. <a href="#" id="newyes">Yes, start over</a> · <a href="#" id="newno">cancel</a>`
        : `<a href="#" id="newask">Start a new game on this device</a>`}</p>
    <div class="actions"><button class="ghost wide" id="closelog">Close</button></div>
  </div></div>`;
}

// ------------------------------------------------------------------ paint ---
function render(){
  document.body.innerHTML = rail() + `<main class="${isMgr()?'wide':''}" id="main"></main>` + botStrip()
    + (S.botOpen ? botLog() : '');
  const m = $('#main');
  const scr = SCREENS[S.screen] || SCREENS.join;
  m.innerHTML = scr.html();
  scr.wire && scr.wire(m);
  const b = $('#bot'); if (b) b.onclick = () => { S.botOpen = true; paint(); };
  const cl = $('#closelog'); if (cl) cl.onclick = () => { S.botOpen = false; paint(); };
  // Two taps, because a mis-tap here would cost somebody their fund.
  const ask = $('#newask'); if (ask) ask.onclick = e => { e.preventDefault(); S.confirmNew = true; paint(); };
  const no  = $('#newno');  if (no)  no.onclick  = e => { e.preventDefault(); S.confirmNew = false; paint(); };
  const yes = $('#newyes'); if (yes) yes.onclick = e => { e.preventDefault(); startClean(); paint(); };
  window.scrollTo(0,0);
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
  ['It is January 2022, and you are launching an ESG fund',
   'Last year saw a record inflow of money into sustainable funds. Is ESG at its peak? You have been given the job of finding out, and five years to show your boss she was right to trust you.'],
  ['You are judged on the fees you earn, not the returns you make',
   'Cumulative management fees — a percentage of the assets you are managing, every year. That is the real objective of an asset manager, and it means growing the fund matters as much as picking well.'],
  ['Four of you to a fund, and none of you can see the whole thing',
   'One of you creates the fund and runs it. The other three are analysts, and each gets four companies to research. <b>The manager is shown no company information at all</b> — not a name, not a score, nothing.'],
  ['So the game is the conversation',
   'The analysts read; the manager decides. Nothing reaches the manager except what you say out loud. Anything that lets one of you succeed without talking to the others would be a mistake in the design, not a shortcut.'],
  ['Decide what the fund stands for, and how strictly',
   'Exclude activities, demand companies rank near the top of their industry, or set a minimum ESG score. Strict policies shut you out of winners; loose ones leave you open to the charge that the label means nothing.'],
  ['You write the policy down, and it is held against what you hold',
   'In your own words, before you have seen a single company. A clear promise brings money in — but promise more than the portfolio delivers and the gap will be found, and it makes every later scandal worse.'],
  ['Six years, paced from the front of the room',
   'Each year brings news, returns, and money flowing in or out. You can change your fee, trade a little, and even change what the fund stands for — though investors who bought the old promise will leave.'],
  ['One warning, and it is the point of the whole thing',
   'Every company shows you three years of past performance. It is real, it is prominent, and it is not a guide to what happens next. If you take nothing else from this, take that.'],
];
SCREENS.intro = {
  html(){ return `<h1>Peak ESG</h1>
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
      <div class="note info"><b>You will not see the companies.</b> Your analysts have them. You cannot build the portfolio without asking.</div>
      <p class="task">Next: choose what the fund stands for.</p>
      <div class="actions"><button id="n" class="wide">Begin</button></div>`;
    return `
      <h1>You are an analyst at ${esc(S.fundName)}</h1>
      <p class="lede">Four companies are on your desk${S.desk?` — the ${DESKS[S.desk].name.toLowerCase()}`:''}.
        Nobody else in the group can see them, and the manager cannot see any company at all.</p>
      <div class="note info">News about your four reaches you and only you. The manager hears only what you choose to say.</div>
      <p class="task">Read your four. Decide what the manager actually needs to know.</p>
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
    if (S.deskFull) return `<h1>That fund is full</h1>
      <p class="lede"><b>${esc(S.fundName)}</b> already has its three analysts.</p>
      <p class="task">Join another fund, or ask a manager in the room to start one.</p>
      <div class="actions"><button id="back" class="wide">Choose a different fund</button></div>`;
    if (!funds.length) return `<h1>Which fund?</h1>
      <p class="lede">Waiting for a fund manager to create one.</p>
      <p class="task">Someone in your group types the same four digits, chooses
        <b>Create the fund</b>, and names it. It will appear here within a second or two.</p>
      <div class="note">Nothing to do yet. Keep this screen open.</div>`;
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
      <div class="note">A moment.</div>`;
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
      <p class="task">Tap a company to read it. The score is one agency's opinion, nothing more.</p>
      ${ids.map(id=>{ const c=co(id); const f=S.flags[id];
        // The score moves with events, so showing the 2021 number all game
        // would hide the one thing an analyst is meant to be watching.
        const sc = playing ? c.esg[S.year] : c.esg0;
        const d  = playing ? sc - c.esg0 : 0;
        const r  = playing ? c.excess[S.year] + INDEX.ret[S.year] : null;
        return `<div class="co" data-id="${id}">
          <div><div class="nm">${esc(c.name)}</div>
          <div class="ind">${esc(c.industry)} · ${esc(c.region)}${
            r===null?'':` · <span class="${r>=0?'up':'down'}">${pc(r,0)} in ${yr}</span>`}</div>
          ${f?REC:''}</div>
          <span class="score ${sc>=70?'hi':sc<50?'lo':''}">${sc}${
            d ? `<small>${d>0?'+':'−'}${Math.abs(d)}</small>` : ''}</span></div>`; }).join('')}
      <div class="note">Every company here is rated by the same in-house analyst team, 0 to 100.
        Three of your four will turn out to be nothing like their score suggests.</div>`;
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
  <p class="small">Notice what it does. It names the exclusions exactly, so anyone can check
    them. And it promises nothing it cannot deliver — a tilt, a short list, and market-like
    returns. There is no gap for anybody to find.</p>
</details>`;

SCREENS.strategy = {
  html(){ return `<h1>What does the fund stand for?</h1>
    <p class="task">One strategy. You will set how strict it is on the next screen.</p>
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
    const warn = n<3 ? `<div class="note bad">That admits only ${n}. You need at least three holdings.</div>`
      : st<0.05 ? `<div class="note warn">This excludes nobody. A fund that promises nothing attracts no conviction money.</div>`
      : st>0.75 ? `<div class="note warn">Very strict. You are cutting away most of the market — including, possibly, companies you would have wanted.</div>` : '';
    const chars = (S.policyText||'').trim().length;
    return `<h1>${esc(str.question)}</h1>
      <p class="task">Strictness is the trade. Screen too hard and you lose the winners; screen too softly and you are promising nothing.</p>
      ${ctl}
      <div class="note ${n<3?'bad':'good'}" style="margin-top:18px">
        <b>Your policy admits ${n} of the 12 companies.</b></div>
      ${warn}
      <h2 style="margin-top:26px">Now write it down</h2>
      <p class="small">What will this fund not own, and why? Two or three sentences, in your
        own words. This is the fund's public promise, and everything you buy will be read
        against it — so write it <b>before</b> you have seen a single company.</p>
      <textarea id="pol" placeholder="This fund will not invest in…">${esc(S.policyText)}</textarea>
      ${POLICY_EXAMPLE}
      ${chars && chars < MIN_POLICY ? `<div class="note warn">A little longer. An investor
        cannot tell what this fund is for.</div>` : ''}
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
        `We have told the market the fund now stands for <b>${esc(STRAT_NAME[S.policy.strategy]||'something else')}</b>. `
        + `Expect about <b>${(M.SWITCH_CUT*100).toFixed(0)}%</b> of the book to leave this year.`);
      publishMe(); go('decide');
    };
  }
};

SCREENS.fee = {
  html(){ const f=S.fee;
    const tol = f>0.0130?'Most mainstream money will not pay this.'
              : f>0.0100?'Above the market. Conviction investors may stay; others will not.'
              : f>0.0060?'About the going rate.' : 'Cheap. You will attract volume and earn less on it.';
    return `<h1>What do you charge?</h1>
      <p class="task">Your fee is your revenue and your deterrent. Peers open at around 80bp.</p>
      <div class="big">${pct(f)}</div>
      <input type="range" id="r" min="10" max="200" step="5" value="${Math.round(f*10000)}">
      <div class="small" style="display:flex;justify-content:space-between"><span>0.10%</span><span>2.00%</span></div>
      <div class="note ${f>0.0130?'warn':'info'}" style="margin-top:16px">${tol}</div>
      <div class="actions"><button class="ghost" id="b">Back</button>
        <button id="n" class="wide">Open the fund</button></div>`; },
  wire(m){ const r=m.querySelector('#r');
    r.oninput=()=>{ S.fee=+r.value/10000; paint(); m.querySelector('#r').focus(); };
    m.querySelector('#b').onclick=()=>go('threshold');
    m.querySelector('#n').onclick=()=>{
      S.fund=M.newFund({policy:S.policy,fee:S.fee});
      botSay('Head of Distribution','Opening at <b>'+pct(S.fee)+'</b>. Keep an eye on what the others are charging — the median moves.',2022);
      publishMe(); go('allocate'); }; }
};

// ----------------------------------------------------------- the portfolio --
SCREENS.allocate = {
  html(){
    const n=Object.keys(S.holdings).length;
    const breach = M.breaches(S.policy, S.holdings);
    return `<h1>Build the portfolio</h1>
      <p class="task">You cannot see these companies. Ask your analysts. Tap to hold, tap the weight to raise it.</p>
      ${UNIVERSE.map(c=>{ const w=S.holdings[c.id]; const admitted=M.admits(S.policy,c);
        return `<div class="co ${w?'held':''}" data-id="${c.id}">
          <div><div class="nm">${esc(c.name)}</div>
            <div class="ind">${esc(c.industry)}${admitted?'':' · <b style="color:var(--red)">outside your policy</b>'}</div>
            ${recNote(c.id)}</div>
          ${w?`<button class="ghost" data-w="${c.id}" style="min-height:38px;padding:6px 14px">${w}×</button>`
             :'<span class="small">not held</span>'}</div>`; }).join('')}
      <div class="note ${n<M.MIN_HOLDINGS?'bad':'good'}" style="margin-top:14px">
        <b>${n} holding${n===1?'':'s'}.</b> Minimum three.</div>
      ${breach.length?`<div class="note warn"><b>${breach.length} holding${breach.length===1?'':'s'} outside your own stated policy.</b>
        You may hold them. It will be noticed.</div>`:''}
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
  html(){ const n = Object.keys(S.holdings).length;
    return `<h1>The fund is open</h1>
      <p class="lede"><b>${esc(S.fundName)}</b> is live: ${n} holding${n===1?'':'s'}, ${pct(S.fee)} a year.</p>
      <p class="task">The market opens when the room does. Nothing happens until then.</p>
      <div class="note info">Use the time. Ask your analysts what you have just bought,
        and why — you will not see a company name all game.</div>`; },
  wire(){ const st = S.net ? S.net.session() : null;
    if (st && st.stage === 'play')
      setTimeout(()=>{ S.year = st.year || 0; S.trades = 0; go('decide'); }, 0); }
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
    const on = S.reviewTo ? 'See the result'
             : isMgr() ? `On to ${YEARS[Math.min(5, S.reviewYear + 1)]}`
             : 'This year on my desk';
    return `<h1>${y} in review</h1>
      <p class="task">${esc(r.strap || '')}</p>
      <div class="sect review">${(r.body||[]).map(x=>`<p>${esc(x)}</p>`).join('')}</div>
      <div class="small" style="margin-top:12px">Peak Research · global equity strategy</div>
      <div class="actions"><button id="n" class="wide">${esc(on)}</button></div>`; },
  wire(m){ m.querySelector('#n').onclick=()=>{
    if (S.reviewTo) { const t = S.reviewTo; S.reviewTo = null; go(t); return; }
    S.trades = 0; go(isMgr() ? 'decide' : 'news'); }; }
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
      <p class="task">The manager has no company information at all. Say the one thing they need.</p>
      ${myDesk().map(id=>{ const c=co(id); const f=S.flags[id];
        return `<div class="co${f?' held':''}" data-id="${id}">
          <div><div class="nm">${esc(c.name)}</div><div class="ind">${esc(c.industry)}</div></div>
          <span class="small" style="margin-left:auto">${f?REC:'Tap to recommend'}</span></div>`; }).join('')}
      <div class="note">Recommending a company puts your name beside it on the manager's screen —
        <b>“${esc((S.who||'You').trim()||'You')} recommended it”</b>. It does not say why.
        That is your job, out loud.</div>
      <div class="actions"><button class="ghost" id="r">Re-read my dossiers</button></div>`; },
  wire(m){ m.querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{
      const id=r.dataset.id; S.flags[id]=!S.flags[id]; publishMe(); paint(); });
    m.querySelector('#r').onclick=()=>go('desk'); }
};

SCREENS.decide = {
  html(){
    const n=Object.keys(S.holdings).length;
    const breach=M.breaches(S.policy,S.holdings);
    return `<h1>Your move, ${YEARS[S.year]}</h1>
      <p class="task">Up to ${M.TRADES_YEAR} position changes, and the fee if you want it. ${M.TRADES_YEAR-S.trades} change${M.TRADES_YEAR-S.trades===1?'':'s'} left.</p>
      <h2>Fee &mdash; ${pct(S.fee)}</h2>
      <input type="range" id="r" min="10" max="200" step="5" value="${Math.round(S.fee*10000)}">
      <div class="small">Peers are charging about <b>${pct(S.peerFee)}</b>.</div>
      ${S.year>=5 ? '' : `<div class="note" style="margin-top:14px">
        <b>${esc(STRAT_NAME[S.policy.strategy]||'Your policy')}.</b>
        ${S.switches ? `Changed ${S.switches===1?'once':S.switches+' times'} already. `
                     : ''}You can change what the fund stands for, but investors bought
        the promise you made — a fixed share of them leave, and the conviction money
        remembers.
        <div class="actions" style="margin-top:10px">
          <button class="ghost" id="switch">Change what the fund stands for</button></div>
      </div>`}
      <h2>Holdings</h2>
      ${UNIVERSE.map(c=>{ const w=S.holdings[c.id];
        return `<div class="co ${w?'held':''}" data-id="${c.id}">
          <div><div class="nm">${esc(c.name)}</div>
            <div class="ind">${esc(c.industry)}</div>
            ${recNote(c.id)}</div>
          ${w?`<button class="ghost" data-w="${c.id}" style="min-height:38px;padding:6px 14px">${w}×</button>`
             :'<span class="small">—</span>'}</div>`; }).join('')}
      ${breach.length?`<div class="note warn">${breach.length} holding${breach.length===1?'':'s'} outside your stated policy.</div>`:''}
      <div class="actions"><button id="n" class="wide" ${n>=M.MIN_HOLDINGS?'':'disabled'}>Run ${YEARS[S.year]}</button></div>`;
  },
  wire(m){
    const r=m.querySelector('#r'); r.oninput=()=>{ S.fee=+r.value/10000; paint(); m.querySelector('#r').focus(); };
    const canTrade=()=>S.trades<M.TRADES_YEAR;
    m.querySelectorAll('[data-w]').forEach(b=>b.onclick=e=>{ e.stopPropagation();
      if(!canTrade()) return; S.trades++;
      const id=b.dataset.w; S.holdings[id]=(S.holdings[id]%M.MAX_WEIGHT)+1; publishMe(); paint(); });
    m.querySelectorAll('[data-id]').forEach(row=>row.onclick=()=>{ if(!canTrade()) return;
      S.trades++; const id=row.dataset.id;
      if (S.holdings[id]) delete S.holdings[id]; else S.holdings[id]=1; publishMe(); paint(); });
    const sw = m.querySelector('#switch');
    if (sw) sw.onclick = () => go('switch');
    m.querySelector('#n').onclick=()=>{
      const hit = severeHit();
      if (hit && S.crisisYear !== YEARS[S.year]) { S.crisis = hit; go('crisis'); }
      else resolveYear();
    };
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
      <div class="note warn"><b>And it does not end there.</b> Conviction money discounts
        a manager who changes their mind, every year from now on. A fund that rewrites its
        principles twice is not running a strategy.</div>
      <p class="task">You will choose the strategy again, set the threshold, and write
        the policy afresh — the market has to be told, in your own words.</p>
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
    return `<h1>It has broken</h1>
      <p class="task">${esc(c.name)} is ${(weight*100).toFixed(0)}% of your fund. Clients will ask today.</p>
      <div class="note bad"><b>${esc(c.name)}, ${YEARS[S.year]}</b><div style="margin-top:4px">${esc(ev.note)}</div></div>
      ${outside?`<div class="note warn">This company was outside your own stated policy. You held it anyway.</div>`:''}
      <h2>What do you say?</h2>
      <p class="small">Two or three sentences. It will be read against what you actually owned.</p>
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
      if (!text) { resolveYear(); return; }
      // Offline there is no assessor, so score it by rule: a specific answer of
      // reasonable length earns some credit, silence earns none. Never more than
      // half, and never against the loss on the shares.
      if (S.net.mode !== 'fire') {
        const words = text.split(/\s+/).length;
        const specific = new RegExp(S.crisis.c.name.split(' ')[0], 'i').test(text);
        S.fund.crisisCredit = Math.min(0.5, (words>=25?0.35:words>=12?0.2:0.05) + (specific?0.12:0));
        botSay('Head of Distribution',
          'Statement out. Scored by rule \u2014 no assessor on this device.');
        resolveYear(); return;
      }
      S.waitStarted=Date.now(); go('crisiswait');
      const poll=()=>{ const done = S.aiCrisisYear===YEARS[S.year];
        if (done || Date.now()-S.waitStarted>9000) resolveYear(); else setTimeout(poll,500); };
      setTimeout(poll,600);
    };
    m.querySelector('#n').onclick=()=>send((t.value||'').trim());
    m.querySelector('#skip').onclick=()=>send('');
  }
};

SCREENS.crisiswait = {
  html(){ return `<h1>Your statement is out</h1>
    <p class="lede">It is being read.</p>
    <p class="task">A credible answer halves the reputational damage. It cannot undo the loss on the shares.</p>`; }
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
      `<b>${esc(co(id).name)}.</b> ${esc(n.t)} — ${esc(n.s)}`);
  });

  // the Head of Distribution reacts to what just happened
  const d = decomposition;
  if (d.flows.scandal < -8) botSay('Head of Distribution',
    `We lost <b>${eur(-d.flows.scandal)}</b> to a scandal in the book. Clients are asking what we knew.`);
  else if (d.flows.greenwashing < -5) botSay('Head of Distribution',
    `<b>${eur(-d.flows.greenwashing)}</b> out on the gap between what we say and what we own. That is the cheapest money we will ever lose.`);
  else if (d.flows.fee < -6) botSay('Head of Distribution',
    `We are dear. <b>${eur(-d.flows.fee)}</b> walked out over price alone.`);
  else if (d.ret > d.retIndex + 4) botSay('Head of Distribution',
    `We beat the market by <b>${pc(d.ret-d.retIndex)}</b>. Put the fee up.`);
  else botSay('Head of Distribution',
    `Fees of <b>${eur(d.feeTake)}</b> this year. Assets ${d.end>=d.start?'up':'down'} at <b>${eur(d.end)}</b>.`);
  publishMe(); go('result');
}

SCREENS.result = {
  html(){
    const d=S.lastResult, up=d.end>=d.start;
    const rows=[['Market move', d.marketMove],
      ['New money, market trend', d.flows.base],
      ['Performance against the index', d.flows.performance],
      ['The portfolio’s ESG score', d.flows.esg],
      ['What the fund stands for', d.flows.policy],
      ['Your fee against peers', d.flows.fee],
      ['Scandals in the book', d.flows.scandal],
      ['The gap between words and holdings', d.flows.greenwashing],
      ['Concentration', d.flows.concentration],
      ['What the prospectus promised', d.flows.pitch],
      ['Investors who wanted the old strategy', d.flows.switched],
      ['Conviction money, after the change of mind', d.flows.trust]]
      .filter(([,v])=>Math.abs(v)>0.05);
    const prev = S.esgPrev, moved = prev==null ? null : d.esg - prev;
    return `<h1>${d.year}</h1>
      <p class="task">Where the money went.</p>
      <div class="big ${up?'up':'down'}">${eur(d.end)}</div>
      <div class="small">assets under management, from ${eur(d.start)}</div>
      <div class="decomp">${rows.map(([k,v])=>`<div class="row"><span>${k}</span>
        <span class="amt ${v>=0?'pos':'neg'}">${eur(v)}</span></div>`).join('')}
        <div class="row tot"><span>Fees earned this year</span><span class="amt">${eur(d.feeTake)}</span></div></div>
      <div class="note info">Return ${pc(d.ret)} against the market at ${pc(d.retIndex)}.
        Portfolio ESG score <b>${d.esg.toFixed(0)}</b>${
          moved===null ? '' : `, ${Math.abs(moved)<0.5 ? 'unchanged'
            : (moved>0?'up':'down') + ' ' + Math.abs(moved).toFixed(0) + ' as your companies were re-rated'}`}.
        You are not ranked on this — but everyone's is revealed at the end.</div>
      <div class="actions"><button id="n" class="wide">${
        S.year>=5?'Read the year in review':'Done for this year'}</button></div>`;
  },
  wire(m){ m.querySelector('#n').onclick=()=>{
    S.esgPrev = S.lastResult.esg;
    if(S.year>=5){ S.phase='done'; S.reviewYear=5; S.reviewTo='final'; go('review'); }
    else go('wait'); }; }
};

// --------------------------------------------------- the analyst's ending ---
// Three quarters of the room used to get no ending at all: the manager played
// through to the result and the analysts sat on "Tell her" until the laptop was
// closed. This is their payoff, and the hook for the debrief.
SCREENS.teamfinal = {
  html(){
    const r = S.teamResult;
    if (!r) return `<h1>Five years on</h1>
      <p class="lede">Waiting for your fund's result.</p>
      <div class="note">It arrives here in a moment.</div>`;
    const mine = myDesk().map(id => ({ c:co(id), w:(r.holdings||{})[id]||0, f:!!S.flags[id] }));
    const held = mine.filter(x=>x.w);
    return `<h1>${esc(r.name || 'Your fund')}</h1>
      <div class="big">${eur(r.fees||0)}</div>
      <div class="small">total fees earned${r.rank?` — ${ord(r.rank)} of ${r.of}`:''}</div>
      <div class="note info"><b>Portfolio ESG score ${Math.round(r.esg||0)}.</b>
        ${r.esgRank?`That is ${ord(r.esgRank)} of ${r.of} on sustainability, against ${ord(r.rank)} on fees.
        Whether those two agree is the whole argument.`:''}</div>
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
    return `<h1>${YEARS[S.year]} is done</h1>
    <p class="lede">Total fees so far: <b>${eur(S.fund?S.fund.feesEarned:0)}</b>.</p>
    <p class="task">${YEARS[Math.min(5,S.year+1)]} opens from the front of the room. Until then,
      talk to your analysts — ask what they are watching.</p>
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
      <div class="small">total fees earned — the thing you were judged on</div>
      <h2>And the endings we did not run</h2>
      <p class="small">The last year was invented. Here is the same fund under three others.</p>
      <div class="decomp">${rows.map(r=>`<div class="row"><span>${esc(r.e.label)}</span>
        <span class="amt">${eur(r.fees)}</span></div>`).join('')}</div>
      <div class="note info"><b>Portfolio ESG score: ${esg.toFixed(0)}.</b>
        You were never ranked on this. Everyone else’s is about to go on the board.</div>
      <div class="note">${rows[0].fees >= Math.max(...rows.map(r=>r.fees)) - 0.5
        ? 'Your fund held up under every ending. That is a strategy, not a bet.'
        : `Under the best of the other three you would have earned ${eur(Math.max(...rows.slice(1).map(r=>r.fees)))},
           under the worst ${eur(Math.min(...rows.slice(1).map(r=>r.fees)))}. Worth asking which future you were assuming.`}</div>`;
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
    const entered = st.stage === 'play' && (prevStage !== 'play' || st.year !== prevYear);
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
      botSay('Head of Distribution', esc(mine.aiPitch.note || 'Your prospectus has been read.'));
    }
    if (mine.aiCrisis && S.aiCrisisYear !== mine.aiCrisis.year) {
      S.aiCrisisYear = mine.aiCrisis.year;
      if (S.fund) S.fund.crisisCredit = mine.aiCrisis.credit || 0;
      botSay('Head of Distribution', esc(mine.aiCrisis.note || 'Your statement has been read.'));
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
    if (st.stage==='reveal' && S.screen!=='final' && S.screen!=='teamfinal'
        && !(S.screen==='review' && S.reviewTo) && S.screen!=='join') {
      // The instructor ends the game. Before this the analysts had no ending at
      // all — they sat on "Tell her" while the manager saw the result alone.
      // The last year is the authored one, so its review comes first.
      S.reviewYear = YEARS.length - 1;
      S.reviewTo = isMgr() ? 'final' : 'teamfinal';
      go('review');
    } else if (entered) {
      S.year = st.year; S.trades = 0;
      // Anyone still setting up is left alone — the manager joins the year when
      // she opens the fund, a late analyst when the next year turns.
      const stillSetting = isMgr() ? !S.fund
        : (!S.desk || S.screen==='join' || S.screen==='team' || S.screen==='seat');
      if (stillSetting) { save(); paint(); }
      else if (st.year === 0) go(isMgr() ? 'decide' : 'news');
      else { S.reviewYear = st.year - 1; S.reviewTo = null; go('review'); }
    } else if (S.screen!=='join' && S.screen!=='team') { save(); paint(); }
    else if (S.screen==='team') { paint(); }
  });
}
function publishMe(){
  if (!S.net) return;
  S.net.publish(S.role + '_' + (S.fundName||'g'), {
    role:S.role, name:S.fundName, teamId:S.teamId, joinedAt:S.joinedAt||null,
    who: (S.who||'').slice(0,24),
    fee:S.fee, flags:S.flags,
    esg: S.fund ? M.portfolioESG(S.holdings, Math.min(5,S.year)) : null,
    year: S.year,                 // the control panel reads readiness off this
    policy:S.policy, holdings:S.holdings,
    policyText:S.policyText,
    crisisText:S.crisisText||'', crisisYear:S.crisisYear||null,
    crisisEvent:S.crisisEvent||'', crisisCompany:S.crisisCompany||'',
    crisisWeight:S.crisisWeight||0, crisisOutside:!!S.crisisOutside,
    fees:S.fund?S.fund.feesEarned:0, aum:S.fund?M.totalAUM(S.fund):0 });
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
window.__peakBooted = true;              // the boot guard in index.html watches this
window.PEAK = { S, M, go, advance };     // for testing from the console
