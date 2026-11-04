// =============================================================================
// Peak ESG — the client   ·   published 2026-11-04 06:40 UTC
// =============================================================================
// One screen, one kind of information, with a visible sense of where you are.
// Everything numeric comes from model/model.mjs; nothing is decided here.
// =============================================================================
import * as M from './model/model.mjs';
import { UNIVERSE, ACTIVITIES } from './data/universe.mjs';
import { INDEX, YEARS, MACRO, SCENARIO, ENDINGS } from './data/world.mjs';
import { NEWS, newsFor } from './data/news.mjs';
import { ROLES, DESKS, deskFor } from './roles.mjs';
import { makeNet } from './net.mjs';

// ------------------------------------------------------------------ state ---
const S = {
  code:'', role:null, fundName:'', screen:'join', net:null,
  teamId:null,                 // the manager's uid — what makes four devices a fund
  year:0, phase:'setup',
  policy:{ strategy:null, excluded:[], rank:5, minScore:50 },
  policyText:'', pitchText:'', fee:M.FEE_START,
  holdings:{}, fund:null, lastResult:null,
  openCo:null, openSect:'fin', flags:{}, trades:0,
  bot:[], botOpen:false, peerFee:M.FEE_START
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
  code:S.code, role:S.role, fundName:S.fundName, teamId:S.teamId,
  policy:S.policy, policyText:S.policyText,
  pitchText:S.pitchText, fee:S.fee, holdings:S.holdings, fund:S.fund, screen:S.screen,
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
const ord = n => n + (['th','st','nd','rd'][(n%100-n%10!=10)*(n%10<4)*n%10] || 'th');
const co = id => M.byId(id);
const myDesk = () => deskFor(S.role);

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
  return `<div class="rail">
    <span class="mark">${MARK} Peak <span class="esg">ESG</span></span>
    <span class="where">${esc(where)}</span>${cd}
    <span class="dots">${dots}</span></div>`;
}
function stepLabel(){
  const m = { join:'joining', brief:'the brief', strategy:'step 1 of 4 · strategy',
    threshold:'step 2 of 4 · policy', fee:'step 3 of 4 · price',
    pitch:'step 4 of 4 · prospectus', wait:'waiting', desk:'your desk',
    dossier:'your desk', allocate:'the portfolio',
    team:'which fund?', teamfinal:'the result', final:'the result',
    standby:'brief her', news:'the news', market:'the market' };
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
  if (!last) return `<div class="${cls} quiet" id="bot">
      <span class="av">${isMgr()?'D':'S'}</span>
      <div><div class="who">${who}</div><div class="msg">Nothing from me yet.</div></div></div>`;
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

// ------------------------------------------------------------------- join ---
SCREENS.join = {
  html(){ return `
    <h1>Peak ESG</h1>
    <p class="lede">${esc(SCENARIO)}</p>
    <h2>Join</h2>
    <div class="code">${[0,1,2,3].map(i=>`<input inputmode="numeric" maxlength="1" data-i="${i}" value="${esc(S.code[i]||'')}">`).join('')}</div>
    <p class="task">Everyone in your group types the same four digits.</p>
    <h2>Who are you?</h2>
    <div class="choices two" id="roles">
      ${Object.entries(ROLES).map(([k,r])=>`<div class="choice${S.role===k?' sel':''}" data-r="${k}">
        <div class="lbl">${esc(r.name)}</div><div class="desc">${esc(r.blurb)}</div></div>`).join('')}
    </div>
    <div id="nameRow" class="${S.role==='manager'?'':'hidden'}">
      <h2>Name the fund</h2>
      <input type="text" id="fname" maxlength="28" placeholder="Verde Capital" value="${esc(S.fundName)}">
    </div>
    <div class="actions"><button id="go" class="wide" ${S.role&&S.code.length===4?'':'disabled'}>Start</button></div>`; },
  wire(m){
    const boxes=[...m.querySelectorAll('.code input')];
    boxes.forEach((b,i)=>{ b.oninput=()=>{ b.value=b.value.replace(/\D/g,'');
      S.code = boxes.map(x=>x.value).join(''); if(b.value&&i<3)boxes[i+1].focus();
      $('#go').disabled = !(S.role&&S.code.length===4); };
      b.onkeydown=e=>{ if(e.key==='Backspace'&&!b.value&&i>0)boxes[i-1].focus(); }; });
    m.querySelectorAll('[data-r]').forEach(c=>c.onclick=()=>{
      S.role=c.dataset.r; paint(); });
    const fn=m.querySelector('#fname'); if(fn) fn.oninput=()=>{ S.fundName=fn.value; };
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
      <p class="lede">Four decisions before you open: what the fund stands for, how strict that is, what you charge, and what you tell the public.</p>
      <div class="note info"><b>You will not see the companies.</b> Your analysts have them. You cannot build the portfolio without asking.</div>
      <p class="task">Next: choose what the fund stands for.</p>
      <div class="actions"><button id="n" class="wide">Begin</button></div>`;
    return `
      <h1>You are an analyst</h1>
      <p class="lede">Four companies are on your desk. Nobody else in the group can see them, and the manager cannot see any company at all.</p>
      <div class="note info">News about your four reaches you and only you. What the manager hears is what you tell her.</div>
      <p class="task">Read your four. Decide what she actually needs to know.</p>
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
    if (!funds.length) return `<h1>Which fund?</h1>
      <p class="lede">Waiting for your fund manager to join and name the fund.</p>
      <p class="task">She types the same four digits, chooses <b>Fund manager</b>, and names it.
        It will appear here within a second or two.</p>
      <div class="note">Nothing to do yet. Keep this screen open.</div>`;
    return `<h1>Which fund?</h1>
      <p class="task">Tap the fund your manager just named.</p>
      <div class="choices" id="funds">
        ${funds.map(f=>`<div class="choice${S.teamId===f.uid?' sel':''}" data-u="${esc(f.uid)}">
          <div class="lbl">${esc(f.name)}</div></div>`).join('')}
      </div>
      <div class="note">If two funds share a name, check with her which is yours.</div>
      <div class="actions"><button id="n" class="wide" ${S.teamId?'':'disabled'}>That's mine</button></div>`;
  },
  wire(m){
    m.querySelectorAll('[data-u]').forEach(c=>c.onclick=()=>{
      S.teamId = c.dataset.u;
      S.fundName = (S.board||[]).find(f=>f.uid===S.teamId)?.name || '';
      paint(); });
    const n = m.querySelector('#n');
    if (n) n.onclick = () => { publishMe(); go('brief'); };
  }
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
          <div><div class="nm">${esc(c.name)}${f?' <span class="flag">●</span>':''}</div>
          <div class="ind">${esc(c.industry)} · ${esc(c.region)}${
            r===null?'':` · <span class="${r>=0?'up':'down'}">${pc(r,0)} in ${yr}</span>`}</div></div>
          <span class="score ${sc>=70?'hi':sc<50?'lo':''}">${sc}${
            d ? `<small>${d>0?'+':'−'}${Math.abs(d)}</small>` : ''}</span></div>`; }).join('')}
      <div class="note">Every company here is rated by the same in-house analyst team, 0 to 100.
        Three of your four will turn out to be nothing like their score suggests.</div>`;
  },
  wire(m){ m.querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{
    S.openCo=r.dataset.id; S.openSect='fin'; go('dossier'); }); }
};

const SECTIONS = [
  ['fin','Financial'], ['esg','ESG'], ['pol','Policies'],
  ['ngo','NGO'], ['gov','Governance'], ['news','Media']
];

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
        <button class="ghost" id="flag">${S.flags[c.id]?'Unflag':'Flag for the manager'}</button>
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
    return `<h1>${esc(str.question)}</h1>
      <p class="task">Strictness is the trade. Screen too hard and you lose the winners; screen too softly and you are promising nothing.</p>
      ${ctl}
      <div class="note ${n<3?'bad':'good'}" style="margin-top:18px">
        <b>Your policy admits ${n} of the 12 companies.</b></div>
      ${warn}
      <div class="actions"><button class="ghost" id="b">Back</button>
        <button id="n" ${n>=3?'':'disabled'}>Next</button></div>`;
  },
  wire(m){
    m.querySelectorAll('[data-x]').forEach(c=>c.onclick=()=>{ const k=c.dataset.x;
      const i=S.policy.excluded.indexOf(k);
      if(i<0) S.policy.excluded.push(k); else S.policy.excluded.splice(i,1); paint(); });
    const r=m.querySelector('#r'); if(r) r.oninput=()=>{
      if(S.policy.strategy==='best') S.policy.rank=+r.value; else S.policy.minScore=+r.value;
      paint(); m.querySelector('#r').focus(); };
    m.querySelector('#b').onclick=()=>go('strategy');
    m.querySelector('#n').onclick=()=>go('fee');
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
      <div class="actions"><button class="ghost" id="b">Back</button><button id="n">Next</button></div>`; },
  wire(m){ const r=m.querySelector('#r');
    r.oninput=()=>{ S.fee=+r.value/10000; paint(); m.querySelector('#r').focus(); };
    m.querySelector('#b').onclick=()=>go('threshold');
    m.querySelector('#n').onclick=()=>go('pitch'); }
};

SCREENS.pitch = {
  html(){ return `<h1>Write the prospectus</h1>
    <p class="task">Two short pieces of writing. Both will be checked against what you actually hold.</p>
    <h2>The policy, in your own words</h2>
    <p class="small">What will this fund not own, and why? Two or three sentences.</p>
    <textarea id="pol" placeholder="This fund will not invest in…">${esc(S.policyText)}</textarea>
    <h2>What you tell the public</h2>
    <p class="small">The sentence an investor reads first.</p>
    <textarea id="pit" style="min-height:80px" placeholder="A fund for investors who…">${esc(S.pitchText)}</textarea>
    <div class="actions"><button class="ghost" id="b">Back</button>
      <button id="n" class="wide">Open the fund</button></div>`; },
  wire(m){
    m.querySelector('#pol').oninput=e=>{S.policyText=e.target.value;};
    m.querySelector('#pit').oninput=e=>{S.pitchText=e.target.value;};
    m.querySelector('#b').onclick=()=>go('fee');
    m.querySelector('#n').onclick=()=>{ S.fund=M.newFund({policy:S.policy,fee:S.fee});
      botSay('Head of Distribution','Opening at <b>'+pct(S.fee)+'</b>. Keep an eye on what the others are charging — the median moves.',2022);
      publishMe(); go('allocate'); };
  }
};

// ----------------------------------------------------------- the portfolio --
SCREENS.allocate = {
  html(){
    const n=Object.keys(S.holdings).length;
    const flagged = S.peerFlags || {};
    const breach = M.breaches(S.policy, S.holdings);
    return `<h1>Build the portfolio</h1>
      <p class="task">You cannot see these companies. Ask your analysts. Tap to hold, tap the weight to raise it.</p>
      ${UNIVERSE.map(c=>{ const w=S.holdings[c.id]; const admitted=M.admits(S.policy,c);
        return `<div class="co ${w?'held':''}" data-id="${c.id}">
          <div><div class="nm">${esc(c.name)}${flagged[c.id]?' <span class="flag">●</span>':''}</div>
            <div class="ind">${esc(c.industry)}${admitted?'':' · <b style="color:var(--red)">outside your policy</b>'}</div></div>
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
    m.querySelector('#n').onclick=()=>{ S.phase='play'; S.year=0; publishMe(); go('market'); };
  }
};

// =============================================================================
// THE YEAR
// =============================================================================
SCREENS.market = {           // manager: what happened in the world
  html(){ const y=YEARS[S.year];
    return `<h1>${y}</h1>
      <p class="task">The world, before you decide anything.</p>
      ${(MACRO[y]||[]).map(n=>`<div class="sect" style="margin-bottom:10px">
        <b>${esc(n.t)}</b><div class="small" style="margin-top:3px">${esc(n.s)}</div></div>`).join('')}
      <div class="note info">Your analysts have had news about your companies. Ask them before you move.</div>
      <div class="actions"><button id="n" class="wide">Decide</button></div>`; },
  wire(m){ m.querySelector('#n').onclick=()=>{ S.trades=0; go('decide'); }; }
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
    return `<h1>Tell her</h1>
      <p class="task">She has no company information at all. Say the one thing she needs.</p>
      ${myDesk().map(id=>{ const c=co(id); const f=S.flags[id];
        return `<div class="co" data-id="${id}">
          <div><div class="nm">${esc(c.name)}</div><div class="ind">${esc(c.industry)}</div></div>
          <span class="small">${f?'flagged':'tap to flag'}</span></div>`; }).join('')}
      <div class="note">Flagging puts a mark beside the company on her screen. It does not say why — that is your job, out loud.</div>
      <div class="actions"><button class="ghost" id="r">Re-read my dossiers</button></div>`; },
  wire(m){ m.querySelectorAll('[data-id]').forEach(r=>r.onclick=()=>{
      const id=r.dataset.id; S.flags[id]=!S.flags[id]; publishMe(); paint(); });
    m.querySelector('#r').onclick=()=>go('desk'); }
};

SCREENS.decide = {
  html(){
    const n=Object.keys(S.holdings).length, flagged=S.peerFlags||{};
    const breach=M.breaches(S.policy,S.holdings);
    return `<h1>Your move, ${YEARS[S.year]}</h1>
      <p class="task">Up to ${M.TRADES_YEAR} position changes, and the fee if you want it. ${M.TRADES_YEAR-S.trades} change${M.TRADES_YEAR-S.trades===1?'':'s'} left.</p>
      <h2>Fee &mdash; ${pct(S.fee)}</h2>
      <input type="range" id="r" min="10" max="200" step="5" value="${Math.round(S.fee*10000)}">
      <div class="small">Peers are charging about <b>${pct(S.peerFee)}</b>.</div>
      <h2>Holdings</h2>
      ${UNIVERSE.map(c=>{ const w=S.holdings[c.id];
        return `<div class="co ${w?'held':''}" data-id="${c.id}">
          <div><div class="nm">${esc(c.name)}${flagged[c.id]?' <span class="flag">●</span>':''}</div>
            <div class="ind">${esc(c.industry)}</div></div>
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
    m.querySelector('#n').onclick=()=>{
      const hit = severeHit();
      if (hit && S.crisisYear !== YEARS[S.year]) { S.crisis = hit; go('crisis'); }
      else resolveYear();
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
      ['What the prospectus promised', d.flows.pitch]].filter(([,v])=>Math.abs(v)>0.05);
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
      <div class="actions"><button id="n" class="wide">${S.year>=5?'See the result':'Waiting for the next year'}</button></div>`;
  },
  wire(m){ m.querySelector('#n').onclick=()=>{
    S.esgPrev = S.lastResult.esg;
    if(S.year>=5){ S.phase='done'; go('final'); } else go('wait'); }; }
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
      <h2>Your four, and what she did with them</h2>
      <div class="decomp">${mine.map(x=>`<div class="row">
        <span>${esc(x.c.name)}${x.f?' <span class="flag">●</span>':''}</span>
        <span class="amt">${x.w?`held ${x.w}×`:'not held'}</span></div>`).join('')}</div>
      <div class="note">${
        held.length===0 ? 'She held none of your four. Did she hear what you told her, or did you not push hard enough?'
        : mine.some(x=>x.f && x.w) ? 'She bought something you had flagged. Was that your call or hers — and did you tell her why?'
        : 'Nothing you flagged ended up in the book.'}</div>`;
  }
};

SCREENS.wait = {
  html(){ return `<h1>${YEARS[S.year]} is done</h1>
    <p class="lede">Total fees so far: <b>${eur(S.fund?S.fund.feesEarned:0)}</b>.</p>
    <p class="task">Waiting for the next year. Talk to your analysts.</p>
    <div class="actions"><button class="ghost" id="adv">Advance (testing)</button></div>`; },
  wire(m){ m.querySelector('#adv').onclick=()=>advance(); }
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
    const yearChanged = st.year !== S.year;
    S.phase = st.stage || S.phase;          // `phase` belongs to the Firestore rules
    S.peerFee = S.net.peerFee(M.FEE_START);
    S.countdownEnds = st.countdownEnds || null;
    // what the assessor made of the prose
    const mine = st.mine || {};
    S.board = st.board || S.board || [];
    if (mine.aiPitch && !S.aiPitchSeen) {
      S.aiPitchSeen = true; S.overclaim = mine.aiPitch.overclaim || 0;
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
    if (st.stage==='reveal' && S.screen!=='final' && S.screen!=='teamfinal' && S.screen!=='join') {
      // The instructor ends the game. Before this the analysts had no ending at
      // all — they sat on "Tell her" while the manager saw the result alone.
      go(isMgr() ? 'final' : 'teamfinal');
    } else if (yearChanged && st.stage==='play') {
      S.year = st.year; S.trades = 0;
      go(isMgr() ? 'market' : 'news');
    } else if (S.screen!=='join' && S.screen!=='team') { save(); paint(); }
    else if (S.screen==='team') { paint(); }
  });
}
function publishMe(){
  if (!S.net) return;
  S.net.publish(S.role + '_' + (S.fundName||'g'), {
    role:S.role, name:S.fundName, teamId:S.teamId, fee:S.fee, flags:S.flags,
    esg: S.fund ? M.portfolioESG(S.holdings, Math.min(5,S.year)) : null,
    year: S.year,                 // the control panel reads readiness off this
    policy:S.policy, holdings:S.holdings,
    policyText:S.policyText, pitchText:S.pitchText,
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
