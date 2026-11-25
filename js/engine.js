/* 패스메이트 공부 화면 — HAE
   컴활 1급 앱의 공부 화면(문제풀기·개념학습·요약본·벼락치기·오답노트·기록)을 패스메이트 안에 그대로 옮겨 만든 것.
   PM_ENGINE_START(ROOT): ROOT 안에 공부 화면을 그려요. 자격증 데이터는 window.EXAM / QDATA / SDATA / IMGDATA,
   기록 저장은 window.PM_ENG_IO, 잠금은 window.PM_GATE, 위쪽 버튼은 window.PM_SHELL 이 맡아요. */
window.PM_ENGINE_START=function(ROOT){
const EX=window.EXAM;
const Q=window.QDATA, S=window.SDATA, C=window.CDATA||[], G=window.GDATA||[];
const IMG=window.IMGDATA||{};
Q.forEach(q=>{if(q.img&&IMG[q.img])q.img=IMG[q.img];if(q.eimg&&IMG[q.eimg])q.eimg=IMG[q.eimg];});
if(EX.autoNeg){const NR=/(옳지\s*않은|틀린|거리가\s*먼|아닌\s*것|적절하지\s*않은|해당하지\s*않는|해당되지\s*않는|잘못된|잘못\s*연결|않은\s*것|없는\s*것은|부적당한|부적합한|관계가\s*없는)[^.?]*\??\s*$/;Q.forEach(q=>{if(!q.fx&&q.neg==null&&NR.test(q.q.split(/[.。]\s/).pop()))q.neg=1;});}

const QM={}; Q.forEach(q=>QM[q.id]=q);
/* 문제·보기 섞기: 같은 회차를 다시 열어도 문제 순서와 보기 순서가 매번 바뀌어요 (순서·번호로 외우기 방지).
   풀이 중에만 섞인 보기(view)를 쓰고, 기록에는 항상 원래 보기 번호로 저장해요. */
const ORIG=Object.assign({},QM);
const MKR=/[①②③④⑤]/g;
function canMix(q){ if(!q||!q.o||q.o.length<2||q.full||q.fo||q.eimg||q.oimg) return false;
  if(q.e&&/정답\s*처리|[1-5]번\s*(과|와|·|,|및|모두|이\s*정답)/.test(q.e)) return false; // 해설이 보기 번호를 직접 말하는 문제는 그대로
  return !q.o.some(o=>!o||!String(o).trim()||/[①②③④⑤]|모두|전부|위의|보기 중|이상 모두|없음|없다\s*\.?$|모든 것/.test(o)); }
function makePerm(ids){ const P={}; ids.forEach(id=>{const q=ORIG[id]; if(canMix(q)) P[id]=shuffle(q.o.map((_,i)=>i));}); return P; }
function viewOf(id,perm){ const q=ORIG[id]; const inv={}; perm.forEach((o,d)=>inv[o]=d);
  const v=Object.create(q); v.o=perm.map(i=>q.o[i]); v.a=inv[q.a-1]+1; v._perm=perm;
  if(q.e&&!/[①②③④⑤]/.test(String(q.q||'')+String(q.passage||''))) v.e=String(q.e).replace(MKR,m=>{const k=MK.indexOf(m); return k<perm.length&&inv[k]!=null?MK[inv[k]]:m;});
  return v; }
let PERM_ON=null;
function syncPerm(){ const c=store.cur, want=(tab==='quiz'&&c&&c.perm)?c:null;
  if(PERM_ON===want) return;
  if(PERM_ON&&PERM_ON.perm) Object.keys(PERM_ON.perm).forEach(id=>{QM[id]=ORIG[id];});
  if(want) Object.keys(want.perm).forEach(id=>{if(ORIG[id]) QM[id]=viewOf(id,want.perm[id]);});
  PERM_ON=want; }
function toOrigPick(id,pick){ const c=store.cur, p=c&&c.perm&&c.perm[id]; return p&&pick?p[pick-1]+1:pick; }
function unmixCur(c){ if(!c||!c.perm) return; const P={}; Object.keys(c.picks).forEach(id=>{const p=c.perm[id]; P[id]=p&&c.picks[id]?p[c.picks[id]-1]+1:c.picks[id];}); c.picks=P; delete c.perm; PERM_ON&&Object.keys(PERM_ON.perm||{}).forEach(id=>{QM[id]=ORIG[id];}); Object.keys(QM).forEach(id=>{QM[id]=ORIG[id];}); PERM_ON=null; }
function mixOrder(ids){ const by={}; const order=[]; ids.forEach(id=>{const s=(ORIG[id]||{}).s||0; if(!by[s]){by[s]=[];order.push(s);} by[s].push(id);}); return order.flatMap(s=>shuffle(by[s])); }
const SUBJ=EX.subj; const SN=SUBJ.map((_,i)=>i).slice(1); const NS=SN.length; const PER=EX.per||20; const LIMIT=(EX.min||60)*60;
const PERS=SN.map(s=>(EX.perS&&EX.perS[s])||PER); const perOf=s=>PERS[s-1]; const NQ=PERS.reduce((a,b)=>a+b,0);
const PTS=EX.pts||null; const AVGN=PTS?'총점':'평균';
const PERTXT=EX.perS?SN.map(s=>`${s}과목 ${perOf(s)}`).join(' · ')+'문항':`과목별 ${PER}문항`;
function isFail(x,s){return x!=null&&(PTS?x<PTS[s]*0.4:x<40);}
const isPart=r=>!!(r&&r.sub&&r.sub.some(x=>x===null)); const PL=r=>isPart(r)?'과목 일부':(r.pass?'합격':'불합격');
const limOf=ids=>Math.max(60,Math.round(LIMIT*Math.min(1,(ids||[]).length/NQ))); const limMin=ids=>Math.round(limOf(ids)/60);
const SETS=[...new Set(Q.map(q=>q.set))];
const MK='①②③④⑤';
const KEY=EX.store;
let store={ans:{},hist:[],cur:null,pref:{instant:true}};
try{const s=JSON.parse(window.PM_ENG_IO.get()||'null'); if(s) store=Object.assign(store,s);}catch(e){}
if(EX.examDate&&store.pref&&!('examDate' in store.pref)) store.pref.examDate=EX.examDate;
function save(){try{window.PM_ENG_IO.set(JSON.stringify(store));}catch(e){}}
const $=s=>document.querySelector(s);
const app=ROOT.querySelector('.s-app'), nav=ROOT.querySelector('.s-nav'), modal=ROOT.querySelector('.s-modal');
const LIVE=()=>ROOT.isConnected&&window.PM_ENGINE_LIVE===ROOT;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* ---------- 용어 사전 (HAE): 문제·해설 속 용어를 누르면 뜻이 떠요 ---------- */
const GT=[]; G.forEach((g,i)=>[g.w,...(g.k||[])].forEach(t=>{t=String(t||'').trim(); if(t.length>=2) GT.push([esc(t),i]);}));
GT.sort((a,b)=>b[0].length-a[0].length);
const GMAP={}; GT.forEach(([t,i])=>{if(!(t in GMAP)) GMAP[t]=i;});
const GRX=GT.length?new RegExp(Object.keys(GMAP).map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g'):null;
const AN=/[A-Za-z0-9]/;
function gLink(h){ if(!GRX||!h) return h; const used=new Set();
  return String(h).replace(GRX,(m,off,str)=>{const i=GMAP[m]; if(i==null||used.has(i)) return m;
    if(AN.test(m[0])&&AN.test(str[off-1]||'')) return m; if(AN.test(m[m.length-1])&&AN.test(str[off+m.length]||'')) return m;
    if(str.lastIndexOf('<',off)>str.lastIndexOf('>',off)) return m; // 태그 안은 건너뜀
    used.add(i); return `<button type="button" class="gterm" data-g="${i}">${m}</button>`;}); }
function gFind(text){ if(!GRX) return []; const out=[]; const seen=new Set(); const t=esc(text); let m; GRX.lastIndex=0;
  while((m=GRX.exec(t))){const i=GMAP[m[0]]; if(i!=null&&!seen.has(i)){seen.add(i);out.push(i);}} return out; }
function gKey(g){return g.w;}
function gSaved(i){const g=G[i]; return !!(g&&store.gs&&store.gs[gKey(g)]);}
function gToggle(i){const g=G[i]; if(!g) return; store.gs=store.gs||{}; if(store.gs[gKey(g)]) delete store.gs[gKey(g)]; else store.gs[gKey(g)]=Date.now(); save();}
function gQs(g){ if(g._q) return g._q; const ts=[g.w,...(g.k||[])].filter(t=>t&&t.length>=2); g._q=Q.filter(q=>!q.ob&&ts.some(t=>(q.q+' '+q.o.join(' ')).includes(t))).map(q=>q.id); return g._q; }
function gCard(g,i){ return `<article class="gcard"><div class="gh"><b>${esc(g.w)}</b>${g.en?`<span class="gen">${esc(g.en)}</span>`:''}${NS>1&&g.s?`<span class="chip s${g.s}">${g.s}과목</span>`:''}</div><p class="gd">${esc(g.d)}</p>${g.x?`<p class="gx"><b>시험 포인트</b>${esc(g.x)}</p>`:''}${g.k&&g.k.length?`<p class="gk">다른 표기 · ${g.k.map(esc).join(', ')}</p>`:''}</article>`;}
function gDrill(g){const ids=shuffle(gQs(g)).slice(0,20); if(!ids.length) return; startGuard(()=>startSession({title:`용어 연습 · ${g.w}`,ids,instant:true,kind:'drill'}));}
function gPop(i){ const g=G[i]; if(!g) return; const busy=tab==='quiz'&&store.cur; const n=gQs(g).length;
  const bg=document.createElement('div'); bg.className='sheetbg center gpop';
  bg.innerHTML=`<div class="sheet confirm" role="dialog" aria-label="용어 뜻">${gCard(g,i)}<div class="gbtns">${n&&!busy?`<button class="btn" id="gpGo">이 용어 문제 ${Math.min(n,20)}개 풀기</button>`:''}<button class="btn ghost" id="gpSave">${gSaved(i)?'★ 외울 용어에 담김':'☆ 외울 용어에 담기'}</button><button class="btn ghost" id="gpX">닫기</button></div></div>`;
  ROOT.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#gpX').onclick=()=>bg.remove();
  bg.querySelector('#gpSave').onclick=e=>{gToggle(i); e.currentTarget.textContent=gSaved(i)?'★ 외울 용어에 담김':'☆ 외울 용어에 담기';};
  const go=bg.querySelector('#gpGo'); if(go) go.onclick=()=>{bg.remove(); gDrill(g);};
}
ROOT.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('.gterm[data-g],.gchip[data-g]'); if(!b||!ROOT.contains(b)) return; e.preventDefault(); e.stopPropagation(); gPop(+b.dataset.g);},true);
let tab='home', view=null, tick=null;
{const h=ROOT.dataset.tab||''; if(['home','cram','notes','sum','rec','concept'].includes(h)) tab=h;}
{const v=ROOT.dataset.view||''; if(tab==='home'&&['custom','today'].includes(v)) view={type:v};}

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function record(id,pick){
  const q=QM[id]; const ok=pick===q.a;
  const r=store.ans[id]||{w:0,r:0};
  if(ok){r.r++; if(r.w>0) r.fix=(r.fix||0)+1;} else {r.w++; r.fix=0;}
  r.last=ok?'r':'w'; r.pick=q._perm&&pick?q._perm[pick-1]+1:pick; r.t=Date.now();
  store.ans[id]=r; logAnswer(id,ok); todayCheck();
}
function todayCheck(){ const T=store.today; if(!T||T.bonus||T.d!==dayKey()) return; if(T.ids.every(i=>{const x=store.ans[i];return x&&x.t&&dayKey(x.t)===T.d&&!x.kept;})){T.bonus=true; try{window.PM_SHELL.todayDone();}catch(e){}}}
function isOpenWrong(id){const r=store.ans[id];return r&&r.w>0&&r.last==='w';}
function wrongIds(){return Object.keys(store.ans).filter(id=>QM[id]&&store.ans[id].w>0);}
function openWrong(){return wrongIds().filter(isOpenWrong);}
function score(ids,picks){
  const sc={}; SN.forEach(s=>sc[s]=[0,0]);
  ids.forEach(id=>{const q=QM[id];sc[q.s][1]++; if(picks[id]===q.a) sc[q.s][0]++;});
  if(PTS){
    const sub=SN.map(s=>sc[s][1]?Math.round(sc[s][0]/sc[s][1]*PTS[s]):null);
    const vs=SN.filter(s=>sc[s][1]); const got=vs.reduce((a,s)=>a+sub[s-1],0), max=vs.reduce((a,s)=>a+PTS[s],0);
    const avg=max?(vs.length<NS?got:Math.round(got/max*100)):0; // 일부 과목만 있는 회차는 원점수 합
    const pass=vs.length===NS && avg>=60 && vs.every(s=>!isFail(sub[s-1],s));
    return {sub,tot:avg,avg,pass,raw:sc};
  }
  const sub=SN.map(s=>sc[s][1]?Math.round(sc[s][0]/sc[s][1]*100):null);
  const valid=sub.filter(x=>x!==null);
  const tot=valid.reduce((a,b)=>a+b,0);
  const avg=valid.length?Math.round(tot/valid.length*100)/100:0;
  const pass=valid.length===NS && avg>=60 && valid.every(x=>x>=40);
  return {sub,tot,avg,pass,raw:sc};
}
function fmt(sec){sec=Math.max(0,Math.floor(sec));return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');}
function tipHTML(q){
  if(!q.tip) return '';
  const sec=S[q.tip[0]]; const it=sec.items[q.tip[1]];
  return `<div class="tip"><span class="lbl">요약본 · ${esc(sec.t)}</span><mark>${gLink(esc(it.t))}</mark></div>`;
}
function markFix(q,o){
  if(!q.fx) return esc(o);
  const hits=[]; q.fx.forEach(([w,c])=>{const i=o.indexOf(w); if(i>=0 && !hits.some(h=>i<h[1]&&i+w.length>h[0])) hits.push([i,i+w.length,c]);});
  hits.sort((a,b)=>a[0]-b[0]); let out='',p=0;
  hits.forEach(([s,e,c])=>{out+=esc(o.slice(p,s))+`<span class="wr">${esc(o.slice(s,e))}</span><span class="cr">${esc(c)}</span>`;p=e;});
  return out+esc(o.slice(p));
}
function fixBlock(q){
  if(!q.fx) return '';
  return `<div class="fixbox"><span class="lbl">✍ 어디가 틀렸고 어떻게 고치나 · ${MK[q.a-1]}번</span>${markFix(q,q.o[q.a-1])}</div>`;
}
/* 그림: img(한 장, 데이터에 포함) 또는 f(회차별 그림 파일을 필요할 때 불러옴) */
const FIGW={}; window.FIGS=window.FIGS||{};
function loadFig(set){
  if(!EX.figDir||FIGW[set]) return; FIGW[set]=1;
  const sc=document.createElement('script'); sc.src=EX.figDir+set.slice(0,10).replace(/\./g,'-')+'.js';
  sc.onload=()=>{document.querySelectorAll('[data-fig]').forEach(el=>{const im=window.FIGS[el.dataset.fig]; if(im) el.outerHTML=im.map(s=>`<img class="${el.dataset.cls}" src="${s}" alt="문제 그림">`).join('');});};
  document.head.appendChild(sc);
}
function tblHTML(q){const T=q.tbl; if(!T) return ''; return `<div class="qtbl">${T.cap?`<span>${esc(T.cap)}</span>`:''}<div class="scroll-x"><table><tr>${T.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr>${T.r.map(r=>`<tr>${r.map((c,j)=>j===0&&T.h[0]===''?`<th>${esc(c)}</th>`:`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div></div>`;}
function imgsHTML(q,cls){
  cls=cls==null?'qimg':cls; if(q.tbl&&cls!=='__no') return tblHTML(q)+imgsHTML(Object.assign({},q,{tbl:null}),cls);
  if(q.img) return `<img class="${cls}" loading="lazy" src="${q.img}" alt="문제 그림">`;
  if(q.f){const im=window.FIGS[q.fid||q.id]; if(im) return im.map(s=>`<img class="${cls}" loading="lazy" src="${s}" alt="문제 그림">`).join(''); loadFig(q.set); return `<div class="figwait" data-fig="${q.fid||q.id}" data-cls="${cls}">그림 불러오는 중…</div>`;}
  return '';
}
function subjChip(s){return `<span class="chip s${s}">${s}과목 ${SUBJ[s]}</span>`;}

/* ---------- sessions ---------- */
function startSession(opt){
  const ids=mixOrder(opt.ids);
  store.cur={road:opt.road||null,title:opt.title,ids:ids,perm:makePerm(ids),picks:{},done:{},flags:{},instant:opt.instant,cbt:!!opt.cbt,fs:1,page:0,limit:opt.limit||null,start:Date.now(),used:0,idx:0,kind:opt.kind||'exam',set:opt.set||null};
  save(); tab='quiz'; render();
}
function elapsed(c){return c.used+(c.paused?0:(Date.now()-c.start)/1000);}
function remaining(c){return c.limit? c.limit-elapsed(c):null;}
function pauseCur(){const c=store.cur;if(c&&!c.paused){c.used=elapsed(c);c.paused=true;save();}}
function resumeCur(){const c=store.cur;if(c&&c.paused){c.paused=false;c.start=Date.now();save();}}
/* 이어 풀기: 시간이 이미 끝난 시험이면 바로 채점하지 않고 고르게 함 */
function goResume(){
  const c=store.cur; if(!c) return;
  if(c.limit&&remaining(c)<=0){
    const bg=document.createElement('div'); bg.className='sheetbg center';
    bg.innerHTML=`<div class="sheet confirm"><b>${esc(SL(c.title))} 제한 시간이 이미 끝났어요</b><span class="hint">${Object.keys(c.picks).length}/${c.ids.length}문항 답함</span><div class="row"><button class="btn" id="rsMore">시간 다시 ${EX.min}분으로 이어 풀기</button><button class="btn ghost" id="rsEnd">지금까지 푼 것 채점</button></div></div>`;
    ROOT.appendChild(bg);
    bg.querySelector('#rsMore').onclick=()=>{bg.remove();c.used=0;c.paused=false;c.start=Date.now();save();tab='quiz';render();window.scrollTo(0,0);};
    bg.querySelector('#rsEnd').onclick=()=>{bg.remove();resumeCur();finish();};
    bg.onclick=e=>{if(e.target===bg)bg.remove();};
    return;
  }
  resumeCur();tab='quiz';render();window.scrollTo(0,0);
}

function finish(){
  const c=store.cur; if(!c) return; tickQ(c,null);
  unmixCur(c); // 원래 보기 번호로 되돌린 뒤 채점·저장
  if(!c.instant){c.ids.forEach(id=>{if(c.picks[id]) record(id,c.picks[id]);});}
  const part=c.kind!=='exam'; const sIds=part?c.ids.filter(id=>c.picks[id]):c.ids; const sc=score(sIds.length?sIds:c.ids,c.picks);
  const res={title:c.title,kind:c.kind,date:Date.now(),ids:c.ids,picks:c.picks,sub:sc.sub,avg:sc.avg,tot:sc.tot,pass:sc.pass,dur:Math.round(elapsed(c)),n:part&&sIds.length?sIds.length:c.ids.length,part:part,correct:c.ids.filter(id=>c.picks[id]===QM[id].a).length,qt:c.qt||{}};
  if(c.title==='오늘의 문제'&&store.today&&!store.today.bonus){const T=store.today; if(T.ids.every(id=>{const r=store.ans[id];return r&&r.t&&dayKey(r.t)===T.d&&!r.kept;})){T.bonus=true; try{window.PM_SHELL.todayDone();}catch(e){}}}
  if(c.road&&res.correct/res.n>=0.7){store.road=store.road||{};store.road[c.road]=true;}
  p20Record(c,res);
  if(Object.keys(c.picks).length){ store.hist.unshift(res); store.hist=store.hist.slice(0,40); }
  store.cur=null; save(); clearInterval(tick);
  showResult(res);
}

/* ---------- render ---------- */
function setNav(){
  nav.hidden = (tab==='quiz')||(tab==='cram'&&cramView()==='paper');
  nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.tab===tab);});
  const nb=nav.querySelector('[data-tab="notes"]'); const n=openWrong().length;
  let bd=nb.querySelector('.badge'); if(n){if(!bd){bd=document.createElement('span');bd.className='badge';nb.appendChild(bd);} bd.textContent=n;} else if(bd) bd.remove();
}
nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;tab=b.dataset.tab;view=null;if(tab==='concept')conUnit=null;render();window.scrollTo(0,0);});

function render(){
  clearInterval(tick); syncPerm();
  if(tab!=='quiz'||!store.cur) modal.innerHTML='';
  setNav();
  ROOT.classList.toggle('cbton',tab==='quiz'&&!!(store.cur&&store.cur.cbt));
  ROOT.classList.toggle('ppon',(tab==='quiz'&&!!(store.cur&&store.cur.cbt)&&cbtStyle()==='paper')||(tab==='cram'&&cramView()==='paper'));
  if(tab==='quiz' && store.cur) return store.cur.cbt?(cbtStyle()==='paper'?renderPaper():renderCBT()):(qView()==='scroll'?renderQuizScroll():renderQuiz());
  if(tab==='quiz') tab='home';
  if(window.PM_GATE&&window.PM_GATE(tab==='home'&&view&&view.type==='flash'?'flash':tab,topbar(''))){ nav.hidden=false; ROOT.classList.remove('ppon','cbton'); return; } // 패스메이트 잠금(게스트·벼락치기 코드) — 잠금 화면에서도 아래 메뉴는 보이게
  if(view&&view.type==='result') return renderResult(view.res);
  if(tab==='home'&&view){const V={saved:renderSaved,search:renderSearch,today:renderToday,flash:renderFlash,custom:renderCustom,gloss:renderGloss,p20:renderP20}[view.type]; if(V) return V();}
  if(tab==='home') return renderHome();
  if(tab==='notes') return renderNotes();
  if(tab==='sum') return renderSum();
  if(tab==='concept') return renderConcept();
  if(tab==='rec') return renderRec();
  if(tab==='cram') return renderCram();
}

function topbar(extra){ const SO=window.PM_SOLO; if(SO) return `<div class="top"><div class="brand">${esc(EX.brand||EX.short)}<small>${esc(EX.brandSub||EX.name)}</small></div><div class="sp"></div>${SO.chip?SO.chip():''}${ddayChip()}${extra||''}</div>`;
  return `<div class="top"><button class="pm-brand" type="button" onclick="window.PM_SHELL.home()" aria-label="패스메이트 홈으로"><span class="pm-mark" aria-hidden="true"><i></i><i></i><i></i></span><span class="pm-name">패스메이트</span></button><div class="brand">${esc(EX.short||EX.name)}<small>${esc(EX.name)}</small></div><div class="sp"></div>${ddayChip()}<button class="iconbtn" type="button" onclick="window.PM_SHELL.switchCert()">자격증 바꾸기 ▾</button><button class="iconbtn" type="button" onclick="window.PM_SHELL.account()">${esc(window.PM_SHELL.label())}</button>${extra||''}</div>`;}

function subjStats(){
  const st={}; SN.forEach(s=>st[s]=[0,0]);
  Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id];if(!q)return;st[q.s][1]++;if(r.last==='r')st[q.s][0]++;});
  return st;
}

const MAINSETS=SETS.filter(s=>EX.isMain(s,Q));
const OLDSETS=SETS.filter(s=>!EX.isMain(s,Q)).sort();
const SL=s=>EX.setLabel?EX.setLabel(s):s;
let oldOpen=false;
function setBtn(s){
  const setDone={}; store.hist.forEach(h=>{if((h.kind==='exam'||h.kind==='practice')&&!setDone[h.title]) setDone[h.title]=h;});
  const rnd=s==='랜덤 모의고사'; const n=rnd?60:Q.filter(q=>q.set===s).length; const d=setDone[rnd?'':s];
  const label=rnd?`🎲 랜덤 ${NQ}문항`:SL(s);
  const sub=d?`최근 ${d.avg}점${d.kind==='practice'?'(연습)':''} · ${PL(d)}`:(rnd?`전체에서 ${PERTXT}`:`${n}문항`);
  return `<button class="setbtn ${d?'done':''}" data-set="${esc(s)}"><b>${esc(label)}</b><span>${sub}</span></button>`;
}
/* ---------- 랜덤 실전 모의고사 ---------- */
const RSRC=EX.rand;
function qKey(q){return (q.q.replace(/[\s\W_]+/g,'').slice(0,36))+'|'+(q.o[q.a-1]||'').replace(/[\s\W_]+/g,'').slice(0,16);}
function rsrc(){const k=store.pref.rsrc;return RSRC[k]?k:Object.keys(RSRC)[0];}
function randList(){if(!store.rand)store.rand=[];return store.rand;}
function makeRandom(src){
  const pool=Q.filter(q=>!q.ob&&(RSRC[src]||RSRC[Object.keys(RSRC)[0]]).f(q));
  const ids=[];
  SN.forEach(s=>{const P=pool.filter(q=>q.s===s);
    const un=shuffle(P.filter(q=>!store.ans[q.id])), wr=shuffle(P.filter(q=>store.ans[q.id]&&store.ans[q.id].last==='w')), rest=shuffle(P.filter(q=>store.ans[q.id]&&store.ans[q.id].last!=='w'));
    const seen=new Set(); let k=0;
    for(const q of un.concat(wr,rest)){const key=qKey(q); if(seen.has(key)) continue; seen.add(key); ids.push(q.id); if(++k===perOf(s)) break;}
  });
  const L=randList(); const no=(L.reduce((m,r)=>Math.max(m,r.no),0))+1;
  const r={no,t:`랜덤 실전 ${no}회`,src,ids,d:Date.now()}; L.unshift(r); store.rand=L.slice(0,30); save(); return r;
}
function randBlock(){
  const L=randList(); const src=rsrc();
  const setDone={}; store.hist.forEach(h=>{if(!setDone[h.title]) setDone[h.title]=h;});
  return `<div class="panel confirm randp"><b>🎲 랜덤 실전 모의고사</b><span class="hint">${EX.poolName||'기출'}에서 ${PERTXT}, 모두 ${NQ}문항을 뽑아 새 시험지를 만들어요. 안 푼 문제 → 틀린 문제 순으로 먼저 뽑고, 똑같은 문제는 한 번만 넣어요.</span>
  <div class="seg" id="rSrc">${Object.entries(RSRC).map(([k,v])=>`<button data-v="${k}" class="${src===k?'on':''}">${v.t}</button>`).join('')}</div>
  <span class="hint" style="margin-top:-4px">${RSRC[src].d} ${EX.hasOb?' · 옛 버전 내용 제외':''}</span>
  <div class="row"><button class="btn" id="rNew">새 시험지 풀기</button></div>
  ${L.length?`<div class="rlist">${L.slice(0,8).map(r=>{const d=setDone[r.t];return `<div class="ritem"><div><b>${esc(r.t)}</b><span>${RSRC[r.src].t} · ${new Date(r.d).getMonth()+1}/${new Date(r.d).getDate()}${d?` · 최근 ${d.avg}점 ${PL(d)}`:''}</span></div><button class="iconbtn" data-rgo="${r.no}">풀기</button></div>`;}).join('')}</div>`:''}</div>`;
}
function bindRand(){
  app.querySelectorAll('#rSrc button').forEach(b=>b.onclick=()=>{store.pref.rsrc=b.dataset.v;save();renderHome();});
  const go=r=>{ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go(r);}); startExam({title:r.t,ids:r.ids}); };
  const cram=r=>{cramSet=r.no;cramSrc='R';cramSubj=0;cramMine=false;cramOrder=null;cramShown=20;tab='cram';view=null;render();window.scrollTo(0,0);};
  const nb=$('#rNew'); if(nb) nb.onclick=()=>{ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;nb.click();}); go(makeRandom(rsrc())); };
  const nc=$('#rNewCram'); if(nc) nc.onclick=()=>cram(makeRandom(rsrc()));
  app.querySelectorAll('[data-rgo]').forEach(b=>b.onclick=()=>go(randList().find(r=>r.no===+b.dataset.rgo)));
  app.querySelectorAll('[data-rcram]').forEach(b=>b.onclick=()=>cram(randList().find(r=>r.no===+b.dataset.rcram)));
}
/* 시험 시작: 한 문제씩 / CBT 시험지 중 고르기 */
function startExam(o,pr){
  const K=pr?'practicePick':'examPick'; const isC=store.pref[K]?store.pref[K]==='cbt':!pr; let sub=pr?'instant':(store.pref.lastMode||(curMode()==='cbt'?'instant':curMode()));
  const tm=pr?'시간 제한 없음 · 스톱워치':`${limMin(o.ids)}분 타이머`;
  const bg=document.createElement('div'); bg.className='sheetbg center';
  bg.innerHTML=`<div class="sheet confirm"><b>${esc(SL(o.title))} · ${pr?'연습모드':'시험모드'} · 어떻게 풀까요?</b><span class="hint">${o.ids.length}문항 · ${pr?'푼 문제만 채점해서 점수 저장':'제한 시간 '+limMin(o.ids)+'분'}</span>
  <div class="pick2"><button class="${isC?'on':''}" data-t="cbt"><b>CBT 시험지로 풀기</b><span>2단 시험지 + 답안지 · ${tm} · 채점하기로 끝내기</span></button><button class="${!isC?'on':''}" data-t="one"><b>한 문제씩 풀기</b><span>${sub==='exam'?'끝나고 채점':'바로 채점'} · ${tm}</span></button></div>
  ${pr?'':`<div class="vseg" id="pkMode"><span>한 문제씩 채점</span><button data-v="instant" class="${sub==='instant'?'on':''}">바로 채점</button><button data-v="exam" class="${sub==='exam'?'on':''}">끝나고 채점</button></div>`}
  <button class="btn ghost" id="pkX">취소</button></div>`;
  ROOT.appendChild(bg);
  bg.querySelectorAll('#pkMode button').forEach(x=>x.onclick=e=>{e.stopPropagation();sub=x.dataset.v;store.pref.lastMode=sub;save();bg.querySelectorAll('#pkMode button').forEach(y=>y.classList.toggle('on',y===x));const sp=bg.querySelector('[data-t="one"] span');if(sp)sp.textContent=(sub==='exam'?'끝나고 채점':'바로 채점')+' · '+tm;});
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#pkX').onclick=()=>bg.remove();
  bg.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{bg.remove();
    store.pref[K]=b.dataset.t; const cbt=b.dataset.t==='cbt';
    if(pr){save(); return startSession(Object.assign({instant:!cbt,cbt,kind:'practice'},o));}
    if(cbt){if(curMode()!=='cbt')store.pref.lastMode=curMode();store.pref.mode='cbt';}else{store.pref.mode=sub;store.pref.instant=sub==='instant';}
    save(); startSession(Object.assign({instant:curMode()==='instant',cbt:curMode()==='cbt',limit:limOf(o.ids),kind:'exam'},o));});
}
function curMode(){return store.pref.mode||(store.pref.instant?'instant':'exam');}
function renderHome(){
  const c=store.cur; // null here since tab home with cur => still allow resume
  const st=subjStats();
  const setDone={}; store.hist.forEach(h=>{if((h.kind==='exam'||h.kind==='practice')&&!setDone[h.title]) setDone[h.title]=h;});
  const ow=openWrong().length;
  let h=topbar();
  if(store.cur){
    const cc=store.cur, ans=Object.keys(cc.picks).length;
    h+=`<div class="sec"><div class="panel resume confirm"><b>풀던 시험이 있어요 · ${esc(SL(cc.title))}</b><span class="hint">${ans}/${cc.ids.length}문항 답함${cc.limit?(remaining(cc)>0?` · 남은 시간 ${fmt(remaining(cc))}`:' · 제한 시간 끝남'):''}</span><div class="row"><button class="btn" id="goResume">이어서 풀기</button><button class="btn ghost" id="dropCur">그만두고 채점</button></div></div></div>`;
  }
  h+=p20HomeCard();
  h+=`<div class="sec">${menuGrid()}</div>`;
  h+=progressBlock();
  h+=`<div class="sec"><div class="hero"><h1>이번엔 붙는다${dday()!==null&&dday()>=0?` <small class="hdd">시험까지 ${dday()?'D-'+dday():'D-DAY'}</small>`:''}</h1>
  ${EX.ruleHTML||`<p>합격 기준: ${NS===3?'세':NS===5?'다섯':NS} 과목 모두 40점 이상 + 평균 60점 이상. 과목당 ${PER}문항, 한 문항 ${100/PER}점이에요.</p>
  <div class="rule"><div><b>40↑</b><span>과목별 과락선</span></div><div><b>60↑</b><span>평균 합격선</span></div><div><b>${100/PER}점</b><span>문항당 배점</span></div></div>`}</div></div>`;
  h+=prevBlock();
  h+=`<div class="sec" id="randSec"><div class="sech"><h2>실전 모의고사 (${EX.min}분 타임어택)</h2></div>
  ${randBlock()}
  ${MAINSETS.length?`<div class="yr">${esc(EX.mainLabel||'회차별 시험지')}</div><div class="sets">${MAINSETS.map(setBtn).join('')}</div>`:''}
  ${OLDSETS.length?`<details class="oldsets" ${oldOpen?'open':''}><summary><span>${esc(EX.oldLabel)} · ${OLDSETS.length}회</span><span class="muted">${Q.filter(q=>OLDSETS.includes(q.set)).length}문항 ▾</span></summary>
  ${EX.oldFlat?`<div class="sets">${OLDSETS.map(setBtn).join('')}</div>`:[...new Set(OLDSETS.map(s=>s.slice(0,4)))].sort().reverse().map(y=>`<div class="yr">${y}년</div><div class="sets">${OLDSETS.filter(s=>s.startsWith(y)).map(setBtn).join('')}</div>`).join('')}
  ${EX.oldNote?`<p class="hint">${esc(EX.oldNote)}</p>`:''}</details>`:''}</div></div>`;
  h+=`<div class="sec" id="drillSec"><div class="sech"><h2>과목별 풀이 (시간제한 없음)</h2></div><div class="row">
    ${SN.map(s=>`<button class="btn ghost" data-drill="${s}">${s}과목 ${PER}문제</button>`).join('')}</div>
    <div class="row"><button class="btn ${ow?'bad':'ghost'}" id="drillWrong" ${ow?'':'disabled'}>틀린 문제 다시 풀기 ${ow?`(${ow})`:''}</button><button class="btn ghost" id="drillNew">안 푼 문제만 20개</button></div></div>`;
  h+=`<div class="sec"><div class="sech"><h2>과목별 내 정답률</h2><span class="muted" style="font-size:12px">빨간 선 40 · 검은 선 60</span></div><div class="panel bars">${SN.map(s=>{const [a,b]=st[s];const p=b?Math.round(a/b*100):0;return `<div class="bar"><span>${s}과목</span><div class="tr"><i style="width:${p}%;background:${b&&p<40?'var(--bad)':'var(--accent)'}"></i><span class="l40"></span><span class="l60"></span></div><b>${b?p+'%':'-'}</b></div>`;}).join('')}
  <p class="hint">푼 문제 ${Object.keys(store.ans).length} / 전체 ${Q.length}문항 ${EX.statLine?EX.statLine(Q):''}</p></div></div>`;
  app.innerHTML=h;
  bindPrev(); bindRand(); bindMenu(); bindProgress();
  const pg=$('#p20Go'); if(pg) pg.onclick=()=>{p20Open=null;openView('p20');};
  app.querySelectorAll('#qvSeg button').forEach(b=>b.onclick=()=>{store.pref.qview=b.dataset.v;save();renderHome();});
  app.querySelectorAll('#cbSeg button').forEach(b=>b.onclick=()=>{store.pref.cbtStyle=b.dataset.v;save();renderHome();});
  app.querySelectorAll('#modeSeg button').forEach(b=>b.onclick=()=>{store.pref.mode=b.dataset.v;store.pref.instant=b.dataset.v==='instant';save();renderHome();});
  app.querySelectorAll('#typeSeg button').forEach(b=>b.onclick=()=>{if(b.dataset.v==='cbt'){if(curMode()!=='cbt')store.pref.lastMode=curMode();store.pref.mode='cbt';store.pref.instant=false;}else{store.pref.mode=store.pref.lastMode||'instant';store.pref.instant=store.pref.mode==='instant';}save();renderHome();});
  const od=app.querySelector('.oldsets'); if(od) od.ontoggle=()=>{oldOpen=od.open;};
  app.querySelectorAll('[data-set]').forEach(b=>b.onclick=()=>{
    const s=b.dataset.set;
    if(store.cur&&store.cur.title===s){goResume();return;}
    if(store.cur) return confirmBox(`풀던 시험(${SL(store.cur.title)})이 있어요. 지우고 ${SL(s)}을 새로 시작할까요?`,()=>{store.cur=null;b.click();});
    let ids,title;
    if(s==='랜덤 모의고사'){ids=SN.flatMap(k=>shuffle(Q.filter(q=>q.s===k&&!q.ob)).slice(0,perOf(k)).map(q=>q.id));title='랜덤 모의고사';}
    else {ids=Q.filter(q=>q.set===s).sort((a,b)=>a.n-b.n).map(q=>q.id);title=s;}
    startExam({title,ids});
  });
  app.querySelectorAll('[data-drill]').forEach(b=>b.onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;b.click();});
    const s=+b.dataset.drill; // prioritize unseen & wrong
    const pool=Q.filter(q=>q.s===s&&!q.ob); const un=shuffle(pool.filter(q=>!store.ans[q.id])); const rest=shuffle(pool.filter(q=>store.ans[q.id]));
    startSession({title:`${s}과목 연습`,ids:un.concat(rest).slice(0,PER).map(q=>q.id),instant:true,kind:'drill'});
  });
  const dw=$('#drillWrong'); if(dw) dw.onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;dw.click();});
    const ids=shuffle(openWrong()); startSession({title:'오답 다시 풀기',ids,instant:true,kind:'wrong'});};
  $('#drillNew').onclick=()=>{
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;$('#drillNew').click();});
    const un=shuffle(Q.filter(q=>!store.ans[q.id])).slice(0,20).map(q=>q.id); if(!un.length) return; startSession({title:'새 문제 20개',ids:un,instant:true,kind:'drill'});};
  if(store.cur){$('#goResume').onclick=()=>goResume(); $('#dropCur').onclick=()=>confirmBox('지금까지 푼 것만 채점하고 끝낼까요?',()=>{resumeCur();finish();});}
}

function analyzePrev(p){
  if(PTS){
    const sub=SN.map((_,i)=>p[i]), tot=sub.reduce((a,b)=>a+b,0), qp=EX.qpt||2;
    const fails=sub.map((x,i)=>isFail(x,i+1)?i:null).filter(x=>x!==null);
    const pass=!fails.length&&tot>=60;
    const lift=fails.reduce((a,i)=>a+Math.ceil(PTS[i+1]*0.4)-sub[i],0);
    const needPts=Math.max(60-tot,lift);
    const order=SN.map(s=>s-1).sort((a,b)=>sub[a]/PTS[a+1]-sub[b]/PTS[b+1]);
    let msg='';
    if(pass) msg=`이미 합격선이에요(총점 ${tot}). 실수만 줄이면 돼요.`;
    else {
      msg=`총점 ${tot}점이에요. 합격까지 ${needPts}점, 약 ${Math.ceil(needPts/qp)}문제를 더 맞히면 돼요.`;
      if(fails.length) msg+=` ${fails.map(i=>`${i+1}과목(${sub[i]}/${PTS[i+1]}점 → ${Math.ceil(PTS[i+1]*0.4)}점까지 ${Math.ceil((Math.ceil(PTS[i+1]*0.4)-sub[i])/qp)}문제)`).join(', ')}이 과락이라 먼저 올려야 해요.`;
      else msg+=` 과락은 없어요. 배점이 큰 3과목(${PTS[3]}점)에서 올리는 게 제일 빨라요.`;
    }
    return {sub,tot,avg:tot,pass,msg,order};
  }
  const sub=SN.map((_,i)=>p[i]), tot=sub.reduce((a,b)=>a+b,0), avg=Math.round(tot/NS*100)/100;
  const fails=sub.map((x,i)=>x<40?i:null).filter(x=>x!==null);
  const pass=!fails.length&&avg>=60;
  const raised=sub.map(x=>Math.max(x,40));
  const failPts=raised.reduce((a,b)=>a+b,0)-tot;
  const needPts=Math.max(0,60*NS-raised.reduce((a,b)=>a+b,0))+failPts;
  const needQ=Math.ceil(needPts/(100/PER));
  const order=SN.map(s=>s-1).sort((a,b)=>sub[a]-sub[b]);
  let msg='';
  if(pass) msg=`이미 합격선이에요(평균 ${avg}). 실수만 줄이면 돼요.`;
  else {
    msg=`평균 ${avg}점이에요. 합격까지 총 ${needPts}점, 약 ${needQ}문제를 더 맞히면 돼요.`;
    if(fails.length) msg+=` ${fails.map(i=>`${i+1}과목(${sub[i]}점 → 40점까지 ${Math.ceil((40-sub[i])/(100/PER))}문제)`).join(', ')}이 과락이라 먼저 올려야 해요.`;
    else msg+=` 과락은 없어요. 가장 낮은 ${order[0]+1}과목(${sub[order[0]]}점)부터 올리는 게 제일 빨라요.`;
    const low=order.filter(i=>!fails.includes(i)).slice(0,1);
    if(fails.length&&low.length&&sub[low[0]]<60) msg+=` 그다음은 ${low[0]+1}과목(${sub[low[0]]}점)이에요.`;
  }
  return {sub,tot,avg,pass,msg,order};
}
function realList(){
  if(!Array.isArray(store.real)){ store.real=[]; if(store.prev){store.real.push({d:'',sub:store.prev.slice()});} save(); }
  return store.real;
}
function realSorted(){ return realList().map((r,i)=>({r,i})).sort((x,y)=>(y.r.d||'').localeCompare(x.r.d||'')); }
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function realForm(px,title,hint){
  return `<div class="panel confirm"><b>${title}</b>${hint?`<span class="hint">${hint}</span>`:''}
  <label style="font-size:13px;display:flex;flex-direction:column;gap:4px">시험 날짜<input class="search" id="${px}d" type="date" value="${todayStr()}"></label>
  <div class="row">${SN.map(i=>`<label style="flex:1 1 90px;font-size:13px;display:flex;flex-direction:column;gap:4px">${i}과목${PTS?` (${PTS[i]}점 만점)`:''}<input class="search" id="${px}${i}" type="number" inputmode="numeric" min="0" max="${PTS?PTS[i]:100}" step="${PTS?(EX.qpt||2):5}" placeholder="0~${PTS?PTS[i]:100}"></label>`).join('')}</div>
  <button class="btn" id="${px}Save">점수 저장하고 분석</button><span class="hint" id="${px}Err" style="color:var(--bad)" role="status"></span></div>`;
}
function bindRealForm(px,done){
  const sv=$('#'+px+'Save'); if(!sv) return;
  sv.onclick=()=>{
    const v=SN.map(i=>$('#'+px+i).value.trim());
    if(v.some((x,k)=>x===''||isNaN(+x)||+x<0||+x>(PTS?PTS[k+1]:100))){$('#'+px+'Err').textContent=PTS?'과목별 만점('+SN.map(s=>PTS[s]).join('/')+'점) 안에서 점수를 넣어주세요.':'모든 과목에 0~100 사이 점수를 넣어주세요.';return;}
    realList().push({d:$('#'+px+'d').value||'',sub:v.map(Number)}); save(); done();
  };
}
function realCard(r,i,withDel){
  const a=analyzePrev(r.sub);
  return `<div class="card-score"><div class="ttl"><h2>${r.d?esc(r.d):'날짜 없음'} 실제 시험</h2>${withDel?`<button class="iconbtn" data-rdel="${i}">삭제</button>`:''}</div>
  <div class="scroll-x"><table class="scoretbl"><tr>${SN.map(s=>`<th>${s}과목</th>`).join('')}${PTS?'<th>총점</th>':'<th>총점</th><th>평균</th>'}</tr><tr>${a.sub.map((x,i)=>`<td class="${isFail(x,i+1)?'fail':''}">${x}</td>`).join('')}${PTS?`<td>${a.tot}</td>`:`<td>${a.tot}</td><td>${a.avg}</td>`}</tr></table></div>
  <div class="passbox"><span style="font-size:14px">${esc(a.msg)}</span><span class="stamp ${isPart(a)?'n':(a.pass?'p':'f')}">${PL(a)}</span></div></div>`;
}
function prevBlock(){
  const list=realSorted();
  if(!list.length){
    return `<div class="sec">${realForm('pv','실제 시험 점수 넣기 (선택)','시험 보고 받은 점수를 넣으면 합격까지 몇 문제가 더 필요한지, 어느 과목부터 할지 알려줘요. 기록에 저장돼요.')}</div>`;
  }
  const {r}=list[0]; const a=analyzePrev(r.sub);
  return `<div class="sec"><div class="panel confirm"><div class="sech"><b>최근 실제 시험 분석${r.d?` · ${esc(r.d)}`:''}</b><button class="iconbtn" id="pvGo">점수 추가·관리</button></div>
  <div class="scroll-x"><table class="scoretbl"><tr>${SN.map(s=>`<th>${s}과목</th>`).join('')}${PTS?'<th>총점</th>':'<th>총점</th><th>평균</th>'}</tr><tr>${a.sub.map((x,i)=>`<td class="${isFail(x,i+1)?'fail':''}">${x}</td>`).join('')}${PTS?`<td>${a.tot}</td>`:`<td>${a.tot}</td><td>${a.avg}</td>`}</tr></table></div>
  <span style="font-size:14.5px">${esc(a.msg)}</span>
  ${a.pass?'':`<button class="btn ghost" data-drill="${a.order[0]+1}">${a.order[0]+1}과목 ${PER}문제 바로 연습</button>`}</div></div>`;
}
function bindPrev(){
  bindRealForm('pv',()=>renderHome());
  const g=$('#pvGo'); if(g) g.onclick=()=>{tab='rec';view=null;render();window.scrollTo(0,0);};
}
function confirmBox(msg,yes){
  const bg=document.createElement('div'); bg.className='sheetbg center';
  bg.innerHTML=`<div class="sheet confirm"><b>${esc(msg)}</b><div class="row"><button class="btn" id="cy">네</button><button class="btn ghost" id="cn">아니요</button></div></div>`;
  ROOT.appendChild(bg);
  bg.querySelector('#cy').onclick=()=>{bg.remove();yes();}; bg.querySelector('#cn').onclick=()=>bg.remove();
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
}

/* ---------- quiz ---------- */
/* ---------- 시험: 스크롤로 풀기 ---------- */
function qView(){return store.pref.qview||'one';}
/* 시험 중 한 문제씩 <-> CBT 시험지 전환 */
function switchStyle(cbt,i){const c=store.cur;if(!c)return;clearInterval(tick);modal.innerHTML='';
  c.cbt=cbt; if(cbt){c.page=Math.floor(i/10);}else{c.idx=Math.min(i,c.ids.length-1); if(c.kind==='practice') c.instant=true; ROOT.classList.remove('cbton','ppon');}
  if(c.kind==='exam'){ if(cbt){if(curMode()!=='cbt')store.pref.lastMode=curMode();store.pref.mode='cbt';store.pref.examPick='cbt';} else {store.pref.examPick='one';} }
  else if(c.kind==='practice') store.pref.practicePick=cbt?'cbt':'one';
  save(); render(); if(!cbt&&qView()==='scroll') setTimeout(()=>goQ(c.idx),0); else window.scrollTo(0,0);}
function viewToggle(){return `<button class="iconbtn" id="qView" title="보기 방식 바꾸기">${qView()==='scroll'?'1문제씩':'스크롤'}</button>`;}
function bindViewToggle(){const b=$('#qView'); if(b) b.onclick=()=>{store.pref.qview=qView()==='scroll'?'one':'scroll';save();const c=store.cur;render(); if(qView()==='scroll') setTimeout(()=>goQ(c.idx),0); else window.scrollTo(0,0);};}
function goQ(i){const c=store.cur;c.idx=i;save(); if(qView()==='scroll'&&!c.cbt){const el=document.getElementById('qs'+i); if(el){const y=el.getBoundingClientRect().top+window.scrollY-70;window.scrollTo(0,Math.max(0,y));}} else {renderQuiz();window.scrollTo(0,0);}}
function qBlock(c,i){
  const id=c.ids[i], q=QM[id], pick=c.picks[id], shown=c.instant&&pick;
  let h=`<section class="qs ${shown?(pick===q.a?'okq':'noq'):''}" id="qs${i}"><div class="qhead"><span class="qnum tabnum">${i+1}</span>${subjChip(q.s)}<span class="qmeta">${esc(SL(q.set))} ${q.n}번</span>${q.ob?'<span class="obchip">옛 버전 내용</span>':''}${saveBtn(id)}<button class="flagmini ${c.flags[id]?'on':''}" data-flag="${i}" aria-label="체크해 두기">★</button></div>`;
  if(q.full&&q.img) h+=`<img class="qimg" loading="lazy" src="${q.img}" alt="${esc(q.q)}">`;
  else { h+=`<p class="stem">${esc(q.q)}</p>`+imgsHTML(q); }
  h+=`<div class="opts">${q.o.map((o,j)=>{const n=j+1;let cls='';if(shown){if(n===q.a)cls='right';else if(n===pick)cls='wrong';}else if(n===pick)cls='sel';return `<button class="opt ${cls}" data-i="${i}" data-n="${n}" ${shown?'disabled':''}><span class="n">${n}</span><span>${shown&&n===q.a?markFix(q,o):esc(o)}</span></button>`;}).join('')}</div>`;
  if(shown){const ok=pick===q.a; h+=`<div class="verdict ${ok?'ok':'no'}"><div class="vt">${ok?'○ 정답':'✕ 오답'}${ok?'':` <span class="muted" style="font-weight:500;font-size:14px">정답은 ${MK[q.a-1]}번</span>`}</div>${explainHTML(q,pick)}</div>`;}
  return h+`</section>`;
}
function renderQuizScroll(){
  const c=store.cur; if(c.paused) resumeCur();
  const ansd=Object.keys(c.picks).length;
  let h=`<div class="top"><button class="iconbtn" id="qExit" aria-label="나가기">✕ 나가기</button><div class="sp"></div>${c.limit?`<span class="timer" id="timer">${fmt(remaining(c))}</span>`:`<span class="timer up" id="timerUp" title="걸린 시간">${fmt(elapsed(c))}</span>`}${viewToggle()}<button class="iconbtn" id="qToCbt" title="CBT 시험지로 전환">CBT</button><button class="iconbtn" id="qSheet">답안지</button></div>`;
  h+=`<div class="progress sticky"><i id="qProg" style="width:${ansd/c.ids.length*100}%"></i></div><p class="hint" style="margin:0 0 10px">${esc(SL(c.title))} · <span id="qAns">${ansd}</span>/${c.ids.length}문항 답함 · 쭉 내리면서 풀어요</p>`;
  h+=`<div class="qlist">${c.ids.map((_,i)=>qBlock(c,i)).join('')}</div>`;
  h+=`<div class="qsubmit"><button class="btn" id="qDone">제출하고 채점하기</button></div><div style="height:24px"></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const upd=()=>{const a=Object.keys(c.picks).length;$('#qAns').textContent=a;$('#qProg').style.width=(a/c.ids.length*100)+'%';};
  const bindBlock=root=>{
    root.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,n=+b.dataset.n,id=c.ids[i];
      if(c.instant){ if(c.picks[id]) return; c.picks[id]=n; record(id,n);} else c.picks[id]=n;
      c.qsId=id; tickQ(c,id);
      c.idx=i; save(); const old=document.getElementById('qs'+i); old.outerHTML=qBlock(c,i); const nw=document.getElementById('qs'+i); bindBlock(nw); bindMore(); upd();});
    root.querySelectorAll('[data-flag]').forEach(b=>b.onclick=()=>{const i=+b.dataset.flag,id=c.ids[i];c.flags[id]=!c.flags[id];save();b.classList.toggle('on',!!c.flags[id]);});
  };
  bindBlock(app);
  $('#qDone').onclick=submitAsk;
  $('#qSheet').onclick=showSheet;
  bindViewToggle();
  $('#qExit').onclick=()=>{pauseCur();modal.innerHTML='';tab='home';render();};
  {const b=$('#qToCbt'); if(b) b.onclick=()=>switchStyle(true,c.idx||0);}
  if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){c.idx=+e.target.id.slice(2);}});},{rootMargin:'-40% 0px -55% 0px'});app.querySelectorAll('.qs').forEach(s=>io.observe(s));}
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);t.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';finish();}},1000);}
  else {tick=setInterval(()=>{const t=$('#timerUp');if(t)t.textContent=fmt(elapsed(c));},1000);}
}

function renderQuiz(){
  const c=store.cur; if(c.paused) resumeCur();
  const id=c.ids[c.idx], q=QM[id]; const pick=c.picks[id];
  if(c.qsId!==id) tickQ(c,id);
  const peekNow=!!c.peek&&!pick;
  const shown = (c.instant && pick) || peekNow || (c.peek&&pick);
  const ansd=Object.keys(c.picks).length;
  let h=`<div class="top"><button class="iconbtn" id="qExit" aria-label="나가기">✕ 나가기</button><div class="sp"></div>${c.limit?`<span class="timer" id="timer">${fmt(remaining(c))}</span>`:`<span class="timer up" id="timerUp" title="걸린 시간">${fmt(elapsed(c))}</span>`}${viewToggle()}<button class="iconbtn" id="qToCbt" title="CBT 시험지로 전환">CBT</button><button class="iconbtn" id="qSheet">답안지</button></div>`;
  h+=`<div class="progress"><i style="width:${ansd/c.ids.length*100}%"></i></div>`;
  h+=`<div class="qhead"><span class="qnum tabnum">${c.idx+1}<span class="muted" style="font-size:15px">/${c.ids.length}</span></span>${subjChip(q.s)}<span class="qmeta">${esc(SL(q.set))} ${q.n}번</span>${q.ob?'<span class="obchip">옛 버전 내용</span>':''}</div>
  <div class="qtools"><button class="tog ${c.peek?'on':''}" id="qPeek" aria-pressed="${!!c.peek}">정답모드 ${c.peek?'켜짐':'꺼짐'}</button>${saveBtn(id)}<button class="tog" id="qInfo">문제 정보</button></div>`;
  if(q.full && q.img){ h+=`<img class="qimg" src="${q.img}" alt="${esc(q.q)}">`; }
  else { h+=`<p class="stem">${esc(q.q)}</p>`+imgsHTML(q); }
  h+=`<div class="opts">${q.o.map((o,i)=>{const n=i+1;let cls='';if(shown){if(n===q.a)cls='right';else if(n===pick)cls='wrong';}else if(n===pick)cls='sel';return `<button class="opt ${cls}" data-n="${n}" ${shown?'disabled':''}><span class="n">${n}</span><span>${shown&&n===q.a?markFix(q,o):esc(o)}</span></button>`;}).join('')}</div>`;
  if(shown&&!pick){h+=`<div class="verdict"><div class="vt">정답은 ${MK[q.a-1]}번 <span class="muted" style="font-weight:500;font-size:13px">정답모드 · 채점에 안 들어가요</span></div>${explainHTML(q,0)}</div>`;}
  else if(shown){const ok=pick===q.a; h+=`<div class="verdict ${ok?'ok':'no'}"><div class="vt">${ok?'○ 정답':'✕ 오답'}${ok?'':` <span class="muted" style="font-weight:500;font-size:14px">정답은 ${MK[q.a-1]}번</span>`}</div>${explainHTML(q,pick)}</div>`;}
  const last=c.idx===c.ids.length-1;
  h+=`<div class="qnav"><button class="btn ghost flag ${c.flags[id]?'on':''}" id="qFlag" title="나중에 다시 보기" aria-label="체크해 두기">★</button><button class="btn ghost" id="qPrev" ${c.idx===0?'disabled':''}>이전</button>${last?`<button class="btn" id="qDone">제출하기</button>`:`<button class="btn" id="qNext">다음</button>`}</div><div style="height:24px"></div>`;
  app.innerHTML=h;
  modal.innerHTML='';
  $('#qPeek').onclick=()=>{c.peek=!c.peek;save();renderQuiz();};
  $('#qInfo').onclick=()=>infoBox(id);
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    const n=+b.dataset.n;
    if(c.instant){ if(c.picks[id]) return; c.picks[id]=n; record(id,n); save(); renderQuiz(); const v=app.querySelector('.verdict'); if(v){const r=v.getBoundingClientRect(); if(r.top>innerHeight-120) window.scrollBy(0,r.top-innerHeight+160);} }
    else { c.picks[id]=n; save(); renderQuiz(); }
  });
  $('#qPrev').onclick=()=>{c.idx--;save();renderQuiz();window.scrollTo(0,0);};
  const nx=$('#qNext'); if(nx) nx.onclick=()=>{c.idx++;save();renderQuiz();window.scrollTo(0,0);};
  const dn=$('#qDone'); if(dn) dn.onclick=submitAsk;
  $('#qFlag').onclick=()=>{c.flags[id]=!c.flags[id];save();renderQuiz();};
  $('#qSheet').onclick=showSheet; bindViewToggle();
  $('#qExit').onclick=()=>{pauseCur();modal.innerHTML='';tab='home';render();};
  {const b=$('#qToCbt'); if(b) b.onclick=()=>switchStyle(true,c.idx||0);}
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);t.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';finish();}},1000);}
  else {tick=setInterval(()=>{const t=$('#timerUp');if(t)t.textContent=fmt(elapsed(c));},1000);}
}
/* ---------- CBT 실전 화면 ---------- */
function cbtPages(c){const pp=c.pp||2;return Math.ceil(c.ids.length/pp);}
function cbtGo(c,i){const pp=c.pp||2;c.page=Math.floor(i/pp);c.idx=i;save();renderCBT();const el=document.getElementById('cq'+i);if(el){const y=el.getBoundingClientRect().top+window.scrollY-90;window.scrollTo(0,Math.max(0,y));}else window.scrollTo(0,0);}
function cbtOmr(c){
  return `<div class="cbt-omr">${c.ids.map((id,i)=>{const p=c.picks[id];const pp=c.pp||2;const cur=Math.floor(i/pp)===c.page;return `<div class="r ${cur?'cur':''}"><b data-go="${i}">${i+1}</b>${[1,2,3,4].map(n=>`<button data-om="${i}" data-n="${n}" class="${p===n?'on':''}" aria-label="${i+1}번 ${n}">${n}</button>`).join('')}</div>`;}).join('')}</div>`;
}
/* ---------- CBT 시험지형 (2단 기출 시험지 + 답안지) ---------- */
function cbtStyle(){return 'paper';}
/* 가답안: 우클릭 · 길게 누르기 · 가답안 펜 버튼(폰·아이패드) — 파란 번호로 표시하고, 정답을 체크하면 지워져요 */
function tentHas(c,id,n){return !!(c.tent&&c.tent[id]&&c.tent[id].includes(n));}
function tentToggle(c,id,n){c.tent=c.tent||{};if(c.picks[id])delete c.picks[id];const a=c.tent[id]||[];const k=a.indexOf(n);if(k>=0)a.splice(k,1);else a.push(n);if(a.length)c.tent[id]=a;else delete c.tent[id];}
function bindTent(list,fn){list.forEach(b=>{let t=null,sx=0,sy=0,st=0,moved=false,done=false;
  const fire=()=>{if(done)return;done=true;clearTimeout(t);fn(b);if(navigator.vibrate)try{navigator.vibrate(15);}catch(_){}b._skip=true;setTimeout(()=>{b._skip=false;},900);};
  /* PC 오른쪽 클릭 · 안드로이드 길게 누르기 */
  b.addEventListener('contextmenu',e=>{e.preventDefault();if(st&&Date.now()-st<2500){fire();return;}fn(b);});
  /* 폰·아이패드 길게 누르기: 0.45초 지나면 칠하고, 화면이 동작을 취소해도 손 뗄 때 한 번 더 확인 */
  b.addEventListener('touchstart',e=>{if(e.touches.length>1)return;const p=e.touches[0];sx=p.clientX;sy=p.clientY;st=Date.now();moved=false;done=false;clearTimeout(t);t=setTimeout(fire,450);},{passive:true});
  b.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.abs(p.clientX-sx)>14||Math.abs(p.clientY-sy)>14){moved=true;clearTimeout(t);}},{passive:true});
  const end=()=>{clearTimeout(t);if(!moved&&!done&&st&&Date.now()-st>=450)fire();};
  b.addEventListener('touchend',e=>{end();if(done&&e.cancelable)e.preventDefault();});
  b.addEventListener('touchcancel',end,{passive:true});
  b.addEventListener('selectstart',e=>e.preventDefault());});}
function penBtn(c,cls){return `<button class="penbtn ${cls||''} ${c.pen?'on':''}" id="penBtn" aria-pressed="${!!c.pen}" title="가답안 펜: 켜면 누르는 번호가 파란 가답안으로 칠해져요">✏️ 가답안${c.pen?' 켜짐':''}</button>`;}
function renderPaper(){
  const c=store.cur; if(c.paused) resumeCur();
  const PS=10, np=Math.ceil(c.ids.length/PS); if(c.page==null||c.page>=np) c.page=0;
  const left=c.ids.filter(id=>!c.picks[id]).length;
  const from=c.page*PS, list=c.ids.slice(from,from+PS);
  const subjFirst={}; c.ids.forEach((id,i)=>{const s=QM[id].s; if(subjFirst[s]==null) subjFirst[s]=i;});
  const el=()=>{const s=Math.floor(elapsed(c));return `${Math.floor(s/60)}분 ${String(s%60).padStart(2,'0')}초`;};
  let h=`<div class="pp"><header class="pp-h"><div class="pp-l"><button class="pp-brand" id="ppExit" title="홈으로">${esc(EX.brand)}</button><button class="pp-sw" id="ppToOne">한 문제씩<span class="swl">으로 전환</span></button>${penBtn(c,'pp-pen')}</div>
  <h1>${esc(EX.name.replace(' 필기',''))} : ${esc(SL(c.title))}</h1>
  <div class="pp-r"><span class="pp-time">경과시간 : <b id="ppEl">${el()}</b>${c.limit?` <small>(남은 <i id="timer">${fmt(remaining(c))}</i>)</small>`:''}</span>
  <select id="ppSubj" aria-label="과목으로 이동">${SN.filter(s=>subjFirst[s]!=null).map(s=>`<option value="${subjFirst[s]}" ${QM[c.ids[from]].s===s?'selected':''}>${s}과목 : ${esc(SUBJ[s])}(${c.ids.filter(id=>QM[id].s===s).length}문항)</option>`).join('')}</select>
</div></header>
  <div class="pp-body"><main class="pp-paper">${list.map((id,k)=>{const i=from+k,q=QM[id],p=c.picks[id];
    const head=subjFirst[q.s]===i?`<div class="pp-subj">${q.s}과목 : ${esc(SUBJ[q.s])}</div>`:'';
    const stem=q.full&&q.img?`<div class="pp-qt"><span>${i+1}.</span></div>${imgsHTML(q,'pp-img')}`:`<div class="pp-qt"><span>${i+1}.</span><span>${esc(q.q)}</span></div>${imgsHTML(q,'pp-img')}`;
    return `${head}<section class="pp-q" id="pq${i}">${stem}<ol>${q.o.map((o,j)=>`<li><button data-pq="${i}" data-n="${j+1}" class="${p===j+1?'on':''}${tentHas(c,id,j+1)?' tn':''}"><span class="m">${MK[j]}</span><span>${esc(o)}</span></button></li>`).join('')}</ol></section>`;}).join('')}</main>
  <aside class="pp-sheet"><h2>답 안 지</h2><p class="pp-tip"><i></i>누르기 1번 정답 · 2번 가답안 · 3번 지움<br>우클릭 · 길게 누르기 · ✏️ 버튼도 가답안</p><div class="pp-omr">${c.ids.map((id,i)=>`${i&&i%5===0?'<hr>':''}<div class="pr ${Math.floor(i/PS)===c.page?'cur':''}"><b data-pgo="${i}">${String(i+1).padStart(2,'0')}.</b>${QM[id].o.map((_,k)=>k+1).map(n=>`<button data-pom="${i}" data-n="${n}" class="${c.picks[id]===n?'on':''}${tentHas(c,id,n)?' tn':''}" aria-label="${i+1}번 ${n}">${MK[n-1]}</button>`).join('')}</div>`).join('')}</div></aside></div>
  <footer class="pp-f"><button id="ppPrev" ${c.page===0?'disabled':''}>◀ 이전</button><span class="pp-pg">- ${c.page+1} -</span><button id="ppNext" ${c.page>=np-1?'disabled':''}>다음 ▶</button>
  <span class="pp-left">남은문항수 : <b id="ppLeft">${left}</b></span><button class="pp-omrbtn" id="ppOmr">답안지</button><button class="pp-sub" id="ppSub">채점하기</button></footer></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const go=i=>{c.page=Math.floor(i/PS);save();renderPaper();const e=document.getElementById('pq'+i);if(e)window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-80);else window.scrollTo(0,0);};
  const paint=(i,id)=>{document.querySelectorAll(`[data-pq="${i}"],[data-pom="${i}"]`).forEach(b=>{b.classList.toggle('on',+b.dataset.n===c.picks[id]);b.classList.toggle('tn',tentHas(c,id,+b.dataset.n));});$('#ppLeft').textContent=c.ids.filter(x=>!c.picks[x]).length;};
  const mark=(i,n,keep)=>{const id=c.ids[i];c.qsId=id;tickQ(c,id);c.picks[id]=c.picks[id]===n&&!keep?undefined:n;if(c.picks[id]===undefined)delete c.picks[id];else if(c.tent&&c.tent[id])delete c.tent[id];save();paint(i,id);};
  const tent=(i,n)=>{const id=c.ids[i];c.qsId=id;tentToggle(c,id,n);save();paint(i,id);};
  bindTent(app.querySelectorAll('[data-pq],[data-pom]'),b=>tent(+(b.dataset.pq??b.dataset.pom),+b.dataset.n));
  app.querySelectorAll('[data-pq]').forEach(b=>b.onclick=()=>{if(b._skip){b._skip=false;return;}if(c.pen)return tent(+b.dataset.pq,+b.dataset.n);cyc(+b.dataset.pq,+b.dataset.n);});
  app.querySelectorAll('[data-pom]').forEach(b=>b.onclick=()=>{if(b._skip){b._skip=false;return;}const i=+b.dataset.pom;if(c.pen)tent(i,+b.dataset.n);else cyc(i,+b.dataset.n);if(Math.floor(i/PS)!==c.page)go(i);});
  /* 같은 번호 누르기: 1번 = 정답(검정) → 2번 = 가답안(파랑) → 3번 = 지우기 */
  function cyc(i,n){const id=c.ids[i];c._ts=c._ts||{};
    if(c.picks[id]===n){const k=(c._ts[id]||[]).filter(x=>x!==n);delete c._ts[id];if(k.length){c.tent=c.tent||{};c.tent[id]=k;}tent(i,n);}
    else if(tentHas(c,id,n)){delete c._ts[id];tent(i,n);}
    else{c._ts[id]=(c.tent&&c.tent[id]||[]).slice();mark(i,n,true);}}
  $('#penBtn').onclick=()=>{c.pen=!c.pen;save();const y=window.scrollY;renderPaper();window.scrollTo(0,y);};
  app.querySelectorAll('[data-pgo]').forEach(b=>b.onclick=()=>go(+b.dataset.pgo));
  $('#ppSubj').onchange=e=>go(+e.target.value);
  $('#ppPrev').onclick=()=>{c.page--;save();renderPaper();window.scrollTo(0,0);};
  $('#ppNext').onclick=()=>{c.page++;save();renderPaper();window.scrollTo(0,0);};
  $('#ppExit').onclick=()=>{pauseCur();ROOT.classList.remove('cbton','ppon');tab='home';render();window.scrollTo(0,0);};
  $('#ppOmr').onclick=()=>{const s=$('.pp-sheet');s.classList.toggle('open');};
  $('#ppToOne').onclick=()=>switchStyle(false,c.page*PS);
  $('#ppSub').onclick=()=>submitFlow(i=>go(i),()=>{ROOT.classList.remove('cbton','ppon');finish();});
  const cur=app.querySelector('.pp-omr .pr.cur'); if(cur){const box=app.querySelector('.pp-omr');box.scrollTop=cur.offsetTop-box.offsetTop-40;}
  tick=setInterval(()=>{const e=$('#ppEl');if(e)e.textContent=el();if(c.limit){const r=remaining(c);const t=$('#timer');if(t)t.textContent=fmt(r);if(r<=0){clearInterval(tick);document.querySelectorAll('.sheetbg').forEach(x=>x.remove());ROOT.classList.remove('cbton','ppon');finish();}}},1000);
}
function renderCBT(){
  const c=store.cur; if(c.paused) resumeCur();
  const pp=c.pp||2, fs=c.fs||1, np=cbtPages(c); if(c.page>=np) c.page=np-1; if(!c.page) c.page=c.page||0;
  const left=c.ids.filter(id=>!c.picks[id]).length;
  const from=c.page*pp, list=c.ids.slice(from,from+pp);
  let h=`<div class="cbt" style="--fs:${fs}"><div class="cbt-h"><div class="tt"><button id="cExit2" style="float:right;background:none;border:1px solid rgba(255,255,255,.5);color:#fff;border-radius:4px;font-size:11px;padding:3px 7px">나가기</button>${esc(EX.name)}<small>${esc(SL(c.title))} · CBT 연습</small></div>
  <div class="grp">글자크기 ${[[1,'100'],[1.25,'150'],[1.5,'200']].map(([v,l])=>`<button data-fs="${v}" class="${fs===v?'on':''}">${l}%</button>`).join('')}</div>
  <div class="grp">화면배치 ${[1,2,3].map(v=>`<button data-pp="${v}" class="${pp===v?'on':''}">${v}문제</button>`).join('')}</div>
  <div class="cnt"><span>전체 문제 수 <b>${c.ids.length}</b></span><span>안 푼 문제 수 <b id="cLeft">${left}</b></span></div>
  <div class="clock ${c.limit&&remaining(c)<300?'low':''}" id="cClock">제한 시간 ${Math.round((c.limit||LIMIT)/60)}분 · 남은 시간<b id="timer">${c.limit?fmt(remaining(c)):'--:--'}</b></div></div>
  <div class="cbt-body"><div class="cbt-main">${list.map((id,k)=>{const i=from+k,q=QM[id],p=c.picks[id];
    const stem=q.full&&q.img?`<img src="${q.img}" alt="${esc(q.q)}">`:`<div class="qt"><span class="no">${i+1}.</span><span>${esc(q.q)}</span></div>${imgsHTML(q,'')}`;
    return `<div class="cbt-q" id="cq${i}">${q.full&&q.img?`<div class="qt"><span class="no">${i+1}.</span><span></span></div>`:''}${stem}<ol>${q.o.map((o,j)=>`<li><button data-q="${i}" data-n="${j+1}" class="${p===j+1?'on':''}"><span class="m">${j+1}</span><span>${esc(o)}</span></button></li>`).join('')}</ol></div>`;}).join('')}</div>
  <aside class="cbt-side"><h3>답안 표기란</h3>${cbtOmr(c)}</aside></div>
  <div class="cbt-f"><button id="cExit">나가기</button><button id="cCalc">계산기</button><button id="cToPaper">시험지형</button><span class="sp"></span><button id="cPrev" ${c.page===0?'disabled':''}>◀ 이전</button><span class="cbt-pg">${c.page+1}/${np}</span><button id="cNext" ${c.page>=np-1?'disabled':''}>다음 ▶</button><span class="sp"></span><span class="mclock" id="mClock">${c.limit?fmt(remaining(c)):''}</span><button id="cLeftBtn">안 푼 문제</button><button class="omrbtn" id="cOmr">답안 표기란</button><button class="sub" id="cSubmit">답안 제출</button></div></div>`;
  app.innerHTML=h; modal.innerHTML='';
  const mark=(i,n)=>{const id=c.ids[i];c.qsId=id;tickQ(c,id);c.picks[id]=n;c.idx=i;save();const y=window.scrollY;renderCBT();window.scrollTo(0,y);};
  app.querySelectorAll('.cbt-main [data-q]').forEach(b=>b.onclick=()=>mark(+b.dataset.q,+b.dataset.n));
  app.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{const i=+b.dataset.om;const pp2=c.pp||2;const same=Math.floor(i/pp2)===c.page;c.picks[c.ids[i]]=+b.dataset.n;save();if(same){const y=window.scrollY;renderCBT();window.scrollTo(0,y);}else cbtGo(c,i);});
  app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>cbtGo(c,+b.dataset.go));
  app.querySelectorAll('[data-fs]').forEach(b=>b.onclick=()=>{c.fs=+b.dataset.fs;save();renderCBT();});
  app.querySelectorAll('[data-pp]').forEach(b=>b.onclick=()=>{const first=c.page*(c.pp||2);c.pp=+b.dataset.pp;c.page=Math.floor(first/c.pp);save();renderCBT();window.scrollTo(0,0);});
  $('#cPrev').onclick=()=>{c.page--;save();renderCBT();window.scrollTo(0,0);};
  $('#cNext').onclick=()=>{c.page++;save();renderCBT();window.scrollTo(0,0);};
  $('#cExit').onclick=$('#cExit2').onclick=()=>{pauseCur();ROOT.classList.remove('cbton');tab='home';render();window.scrollTo(0,0);};
  $('#cCalc').onclick=cbtCalc;
  $('#cToPaper').onclick=()=>{store.pref.cbtStyle='paper';c.page=0;save();render();window.scrollTo(0,0);};
  $('#cOmr').onclick=()=>{const bg=document.createElement('div');bg.className='sheetbg';bg.innerHTML=`<div class="cbt-sheet cbt"><div class="cbt-side" style="display:flex;width:auto;position:static;max-height:none;border:0"><h3>답안 표기란 <span style="float:right;cursor:pointer" id="omClose">닫기 ✕</span></h3>${cbtOmr(c)}</div></div>`;ROOT.appendChild(bg);
    bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#omClose').onclick=()=>bg.remove();
    bg.querySelectorAll('[data-om]').forEach(b=>b.onclick=()=>{const i=+b.dataset.om;c.picks[c.ids[i]]=+b.dataset.n;save();b.parentNode.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));const l=$('#cLeft');if(l)l.textContent=c.ids.filter(id=>!c.picks[id]).length;});
    bg.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{bg.remove();cbtGo(c,+b.dataset.go);});
    const cur=bg.querySelector('.r.cur'); if(cur) cur.scrollIntoView({block:'center'});};
  $('#cLeftBtn').onclick=()=>{const L=c.ids.map((id,i)=>c.picks[id]?null:i).filter(x=>x!==null);
    const bg=document.createElement('div');bg.className='sheetbg';bg.innerHTML=`<div class="sheet"><div class="sech"><h2>안 푼 문제 ${L.length}개</h2><button class="iconbtn" id="lfC">닫기</button></div>${L.length?`<div class="omr">${L.map(i=>`<button data-i="${i}">${i+1}</button>`).join('')}</div><p class="hint">번호를 누르면 그 문제로 가요.</p>`:'<p>모든 문제에 답을 표기했어요.</p>'}</div>`;ROOT.appendChild(bg);
    bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#lfC').onclick=()=>bg.remove();
    bg.querySelectorAll('[data-i]').forEach(b=>b.onclick=()=>{bg.remove();cbtGo(c,+b.dataset.i);});};
  $('#cSubmit').onclick=()=>{const l=c.ids.filter(id=>!c.picks[id]).length;
    confirmBox(l?`안 푼 문제가 ${l}개 있습니다. 답안을 제출하시겠습니까?`:'답안을 제출하시겠습니까?',()=>confirmBox('제출하면 답안을 수정할 수 없습니다. 정말 제출할까요?',()=>{ROOT.classList.remove('cbton');finish();}));};
  if(c.limit){tick=setInterval(()=>{const r=remaining(c);const t=$('#timer');if(t){t.textContent=fmt(r);$('#cClock').classList.toggle('low',r<300);}const mc=$('#mClock');if(mc){mc.textContent=fmt(r);mc.classList.toggle('low',r<300);}if(r<=0){clearInterval(tick);modal.innerHTML='';document.querySelectorAll('.sheetbg').forEach(x=>x.remove());ROOT.classList.remove('cbton');finish();}},1000);}
}
function cbtCalc(){
  let ex='';const bg=document.createElement('div');bg.className='sheetbg';bg.style.alignItems='center';
  const keys=['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+','(',')','C','←'];
  bg.innerHTML=`<div class="calc"><div class="sech"><b>계산기</b><button class="iconbtn" id="kc">닫기</button></div><div class="scr" id="ks">0</div><div class="k">${keys.map(k=>`<button data-k="${k}">${k==='*'?'×':k==='/'?'÷':k}</button>`).join('')}</div></div>`;
  ROOT.appendChild(bg);const sc=bg.querySelector('#ks');
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#kc').onclick=()=>bg.remove();
  bg.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{const k=b.dataset.k;
    if(k==='C')ex='';else if(k==='←')ex=ex.slice(0,-1);
    else if(k==='='){try{if(/^[0-9+\-*/().\s]+$/.test(ex)){const v=Function('return ('+ex+')')();ex=String(Math.round(v*1e10)/1e10);}}catch(e){ex='오류';}}
    else {if(ex==='오류')ex='';ex+=k;}
    sc.textContent=ex||'0';});
}

function chartStrip(text,label){
  const C=window.CHARTS, P=window.CHART_PATTERNS; if(!C||!P||!/차트/.test(text)) return '';
  let t=text; const found=[];
  P.forEach(([k,re])=>{const r=new RegExp(re,'g'); let m; while((m=r.exec(t))){found.push([m.index,k]);} t=t.replace(new RegExp(re,'g'),s=>' '.repeat(s.length));});
  const ks=[...new Set(found.sort((a,b)=>a[0]-b[0]).map(x=>x[1]))];
  if(!ks.length) return '';
  return `<div class="chartbox"><span class="lbl">${label||'그림으로 보는 차트'}</span><div class="cs">${ks.map(k=>`<figure>${C[k].svg}<figcaption><b>${k} 차트</b>${esc(C[k].tip)}</figcaption></figure>`).join('')}</div></div>`;
}
function qText(q){return q.q+' '+q.o.join(' ')+' '+q.e;}
function explainHTML(q,pick){
  let h='';
  if(pick && pick!==q.a) h+=`<div class="mine"><span class="x">내 답 <b>${MK[pick-1]}</b> ${esc(q.o[pick-1]).slice(0,60)}${q.o[pick-1].length>60?'…':''}</span></div>`;
  h+=fixBlock(q);
  h+=`<div class="why"><span class="lbl">왜 ${MK[q.a-1]}번인가</span>${q.eimg?`<img class="qimg" src="${q.eimg}" alt="해설">`:gLink(esc(q.e))}</div>`;
  h+=tipHTML(q);
  h+=chartStrip(qText(q));
  h+=histLine(q.id);
  return h;
}
function submitAsk(){ submitFlow(i=>{modal.innerHTML='';goQ(i);},()=>finish()); }
/* 제출: 안 푼 문제가 있으면 번호 목록을 보여 주고 그 문제로 이동 (시험모드는 다 풀어야 제출, 연습모드는 그냥 제출도 가능) */
function submitFlow(goTo,done){
  const c=store.cur; const left=c.ids.map((id,i)=>c.picks[id]?-1:i).filter(i=>i>=0);
  if(!left.length) return confirmBox('제출하고 채점할까요?',done);
  const pr=c.kind!=='exam', tn=i=>!!(c.tent&&c.tent[c.ids[i]]&&c.tent[c.ids[i]].length);
  const bg=document.createElement('div'); bg.className='sheetbg center';
  bg.innerHTML=`<div class="sheet confirm leftbox"><b>안 푼 문제가 ${left.length}개 있어요</b>${left.some(tn)?'<span class="hint" style="color:#2F6FD6">파란 번호 = 가답안만 칠한 문제 (답 미체크)</span>':''}<span class="hint">${pr?'번호를 누르면 그 문제로 가요. 연습모드는 그냥 제출할 수도 있어요.':'번호를 누르면 그 문제로 가요. 모두 풀어야 제출할 수 있어요.'}</span>
  <div class="leftnums">${left.slice(0,60).map(i=>`<button data-lgo="${i}" class="${tn(i)?'tn':''}">${i+1}</button>`).join('')}${left.length>60?`<span class="muted">외 ${left.length-60}개</span>`:''}</div>
  <div class="row"><button class="btn" id="lGo">안 푼 문제로 이동</button>${pr?'<button class="btn ghost" id="lSub">그냥 제출하기</button>':''}</div><button class="btn ghost" id="lX">닫기</button></div>`;
  ROOT.appendChild(bg);
  const go=i=>{bg.remove();goTo(i);};
  bg.querySelectorAll('[data-lgo]').forEach(b=>b.onclick=()=>go(+b.dataset.lgo));
  bg.querySelector('#lGo').onclick=()=>go(left[0]);
  const ls=bg.querySelector('#lSub'); if(ls) ls.onclick=()=>{bg.remove();done();};
  bg.querySelector('#lX').onclick=()=>bg.remove(); bg.onclick=e=>{if(e.target===bg)bg.remove();};
}
function showSheet(){
  const c=store.cur;
  const cells=c.ids.map((id,i)=>{const p=c.picks[id];let cls='';if(p){cls=c.instant?(p===QM[id].a?'r':'w'):'ans';} if(i===c.idx)cls+=' cur'; if(c.flags[id])cls+=' fl'; return `<button class="${cls}" data-i="${i}">${i+1}</button>`;}).join('');
  const bg=document.createElement('div'); bg.className='sheetbg';
  bg.innerHTML=`<div class="sheet"><div class="sech"><h2>답안지</h2><button class="iconbtn" id="shClose">닫기</button></div><div class="legend">${c.instant?'<span><i style="background:var(--ok)"></i>정답</span><span><i style="background:var(--bad)"></i>오답</span>':'<span><i style="background:var(--accent)"></i>답함</span>'}<span><i style="background:var(--warn)"></i>★ 체크</span></div><div class="omr">${cells}</div><button class="btn" id="shSubmit">제출하고 채점하기</button></div>`;
  ROOT.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
  bg.querySelector('#shClose').onclick=()=>bg.remove();
  bg.querySelectorAll('.omr button').forEach(b=>b.onclick=()=>{bg.remove();goQ(+b.dataset.i);});
  bg.querySelector('#shSubmit').onclick=()=>{bg.remove();submitAsk();};
}

/* ---------- result ---------- */
function showResult(res){view={type:'result',res};tab='home';modal.innerHTML='';render();window.scrollTo(0,0);}
function scoreCard(res){
  const d=new Date(res.date);
  return `<div class="card-score"><div class="ttl"><h2>${esc(SL(res.title))} 채점내역</h2><span class="muted" style="font-size:12.5px">${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} · ${Math.floor(res.dur/60)}분 ${res.dur%60}초</span></div>
  <div class="scroll-x"><table class="scoretbl"><tr>${SN.map(s=>`<th>${s}과목</th>`).join('')}${PTS?'<th>총점</th>':'<th>총점</th><th>평균</th>'}</tr>
  <tr>${res.sub.map((x,i)=>`<td class="${isFail(x,i+1)?'fail':''}">${x===null?'-':x}</td>`).join('')}${PTS?`<td>${res.avg}</td>`:`<td>${res.tot}</td><td>${res.avg}</td>`}</tr></table></div>
  <div class="passbox"><div><div class="avg tabnum">${res.avg}<small>점 ${AVGN} · ${res.correct}/${res.n} 정답</small></div></div><span class="stamp ${isPart(res)?'n':(res.pass?'p':'f')}">${PL(res)}</span></div></div>`;
}
function renderResult(res){
  const wrong=res.ids.filter(id=>(!res.part||res.picks[id])&&res.picks[id]!==QM[id].a);
  const fails=res.sub.map((x,i)=>isFail(x,i+1)?`${i+1}과목`:null).filter(Boolean);
  let adv='';
  if(isPart(res)) adv='이 회차는 일부 과목만 있어서 합격 판정 대신 과목 점수로 봐요: '+res.sub.map((x,i)=>x===null?'':`${i+1}과목 ${x}/${PTS?PTS[i+1]:100}점`).filter(Boolean).join(', ')+'.'; else
  if(res.pass) adv='합격선 통과! 틀린 문제만 한 번 더 보고 다른 회차로 확인해 보세요.';
  else if(fails.length) adv=`${fails.join(', ')}이 과락(${PTS?'40%':'40점'} 미만)이에요. 해당 과목 오답부터 다시 풀어보세요.`;
  else adv=PTS?`과락은 없어요. 총점 ${60-res.avg}점, ${Math.ceil((60-res.avg)/(EX.qpt||2))}문제 정도만 더 맞히면 합격이에요.`:`과락은 없어요. 평균 ${Math.ceil((60-res.avg)*NS/(100/PER))}문제 정도만 더 맞히면 합격이에요.`;
  const qt=res.qt||{}; const tsum=Object.values(qt).reduce((a,b)=>a+b,0);
  let h=topbar()+`<div class="sec"><div class="tiles"><div><span>정답 수</span><b>${res.correct}/${res.n}</b></div><div><span>${PTS?'총점':'평균 점수'}</span><b>${res.avg}</b></div><div><span>소요 시간</span><b>${fmt(res.dur)}</b></div></div>${scoreCard(res)}<p class="hint" style="font-size:14px;color:var(--ink2)">${adv}</p>
  <div class="row"><button class="btn bad" id="rWrong" ${wrong.length?'':'disabled'}>틀린 ${wrong.length}문제 바로 다시 풀기</button><button class="btn ghost" id="rHome">처음으로</button></div></div>`+p20ResultBanner(res);
  h+=`<div class="sec"><div class="sech"><h2>틀린 문제 (${wrong.length})</h2><span class="muted" style="font-size:12px">눌러서 해설 보기</span></div>${wrong.map(id=>{const q=QM[id];const p=res.picks[id];return `<details class="grp"><summary><span style="font-weight:500;font-size:14px;display:flex;gap:8px"><span class="no tabnum" style="color:var(--bad);font-family:var(--f-mono)">${res.ids.indexOf(id)+1}</span>${esc(q.q.slice(0,48))}${q.q.length>48?'…':''}</span><span class="c">${p?MK[p-1]:'미응답'}→${MK[q.a-1]}</span></summary><div class="body">${noteBody(q,p)}</div></details>`;}).join('')||'<div class="empty">다 맞혔어요!</div>'}</div>`;
  h+=`<div class="sec"><details class="grp"><summary><span>문항별 결과 · 걸린 시간</span><span class="c">${res.n}문항</span></summary><div class="body"><div class="scroll-x"><table class="hist qres"><tr><th>문제</th><th>과목</th><th>시간</th><th>내 답</th><th>결과</th></tr>${res.ids.map((id,i)=>{const q=QM[id];const p=res.picks[id];const ok=p===q.a;return `<tr><td>${i+1}번</td><td>${q.s}</td><td>${qt[id]?fmt(qt[id]):'-'}</td><td>${p?MK[p-1]:'-'}</td><td>${p?(ok?'<b class="ok">○</b>':'<b class="no">✕</b>'):'<span class="muted">−</span>'}</td></tr>`;}).join('')}</table></div>${tsum?`<p class="hint">문항 평균 ${fmt(tsum/Math.max(1,Object.keys(qt).length))}</p>`:''}</div></details></div>`;
  app.innerHTML=h;
  $('#rHome').onclick=()=>{view=null;render();window.scrollTo(0,0);};
  const rp=$('#rP20'); if(rp) rp.onclick=()=>{p20Open=null;view={type:'p20'};tab='home';render();window.scrollTo(0,0);};
  const rw=$('#rWrong'); if(rw) rw.onclick=()=>{view=null;startSession({title:'방금 틀린 문제',ids:shuffle(wrong),instant:true,kind:'wrong'});};
}
function noteBody(q,p){
  let h='';
  if(q.full&&q.img) h+=`<img class="qimg" src="${q.img}" alt="">`; else {h+=`<div class="note q" style="border:0;padding:0">${esc(q.q)}</div>`; h+=imgsHTML(q);}
  h+=`<div class="opts">${q.o.map((o,i)=>{const n=i+1;const cls=n===q.a?'right':(n===p?'wrong':'');return `<div class="opt ${cls}" style="padding:9px 10px;font-size:14px"><span class="n">${n}</span><span>${n===q.a?markFix(q,o):esc(o)}</span></div>`;}).join('')}</div>`;
  h+=`<div class="why"><span class="lbl">해설</span>${q.eimg?`<img class="qimg" src="${q.eimg}" alt="해설">`:gLink(esc(q.e))}</div>`+tipHTML(q)+chartStrip(qText(q));
  return h;
}

/* ---------- notes ---------- */
let noteFilter='open';
function renderNotes(){
  const all=wrongIds(); const ids=noteFilter==='open'?all.filter(isOpenWrong):all;
  let h=topbar()+`<div class="sec"><div class="sech"><h2>내 오답 노트</h2></div>
  <div class="seg" id="nSeg"><button data-v="open" class="${noteFilter==='open'?'on':''}">아직 못 맞힌 것 (${all.filter(isOpenWrong).length})</button><button data-v="all" class="${noteFilter==='all'?'on':''}">틀렸던 것 전부 (${all.length})</button></div>
  <p class="hint">틀린 문제는 주제별로 모여요. 다시 풀어서 맞히면 ‘아직 못 맞힌 것’에서 빠져요.</p>
  ${ids.length?`<button class="btn bad" id="nRetry">이 목록 ${ids.length}문제 다시 풀기</button>`:''}</div>`;
  if(!ids.length){app.innerHTML=h+`<div class="empty">${all.length?'모두 다시 맞혔어요. 잘했어요!':'아직 틀린 문제가 없어요. 모의고사를 풀면 여기에 쌓여요.'}</div>`;bindNotes(ids);return;}
  SN.forEach(s=>{
    const sids=ids.filter(id=>QM[id].s===s); if(!sids.length) return;
    const groups={}; sids.forEach(id=>{const k=QM[id].sec;(groups[k]=groups[k]||[]).push(id);});
    const order=Object.keys(groups).sort((a,b)=>groups[b].length-groups[a].length);
    h+=`<div class="sec"><div class="sech"><h2>${s}과목 ${SUBJ[s]}</h2><span class="muted" style="font-size:13px">${sids.length}문제</span></div>`;
    order.forEach(k=>{const sec=S[k];h+=`<details class="grp"><summary><span>${esc(sec.t)}</span><span class="c">${groups[k].length}문제</span></summary><div class="body">
      <div class="tip"><span class="lbl">이 주제 핵심</span>${sec.items.slice().sort((a,b)=>b.f-a.f).slice(0,3).map(it=>`• ${esc(it.t)}`).join('<br>')}</div>
      ${groups[k].map(id=>{const q=QM[id],r=store.ans[id];return `<div class="note"><div class="meta">${esc(SL(q.set))} ${q.n}번 · 틀린 횟수 ${r.w}${r.last==='r'?' · <span class="ok">다시 맞힘</span>':''}</div>${noteBody(q,r.last==='w'?r.pick:null)}${window.PM_SHELL&&PM_SHELL.canAsk&&PM_SHELL.canAsk()?`<button class="iconbtn askbtn" data-ask="${esc(id)}">💬 패스메이트에 묻기</button>`:''}</div>`;}).join('')}
      <button class="btn ghost" data-retry="${k}">이 주제만 다시 풀기</button></div></details>`;});
    h+=`</div>`;
  });
  app.innerHTML=h; bindNotes(ids);
}
function bindNotes(ids){
  app.querySelectorAll('#nSeg button').forEach(b=>b.onclick=()=>{noteFilter=b.dataset.v;renderNotes();});
  const r=$('#nRetry'); if(r) r.onclick=()=>go(ids);
  app.querySelectorAll('[data-retry]').forEach(b=>b.onclick=()=>go(ids.filter(id=>String(QM[id].sec)===b.dataset.retry)));
  function go(list){ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go(list);}); startSession({title:'오답 다시 풀기',ids:shuffle(list),instant:true,kind:'wrong'});}
}

/* ---------- summary ---------- */
let sumSubj=1, sumQ='', sumHot=false, sumFlip=false, sumChips=false;
const PDFS=EX.pdfs||{};
async function exportPdf(kind,btn){
  const f=PDFS[kind]; const old=btn.textContent; btn.disabled=true; btn.textContent='준비 중…';
  const msg=t=>{const m=$('#pdfMsg'); if(m) m.textContent=t;};
  try{
    let dl=null;
    try{ if(window.claude&&window.claude.use) dl=await window.claude.use('downloads'); }catch(e){}
    let blob=null;
    try{ const r=await fetch(f.url); if(r.ok) blob=await r.blob(); }catch(e){}
    if(dl&&blob){
      try{ await dl.save({filename:f.name,data:blob}); msg('저장했어요. 다운로드 폴더(폰은 파일 앱)에서 열면 돼요.'); }
      catch(e){ msg(e&&e.code==='declined'?'저장을 취소했어요.':'여기서는 저장이 안 돼요. 잠시 뒤 다시 눌러보세요.'); }
    } else {
      const a=document.createElement('a'); a.href=blob?URL.createObjectURL(blob):f.url; a.download=f.name; if(!blob){a.target='_blank'; a.rel='noopener';}
      document.body.appendChild(a); a.click(); a.remove();
      msg('PDF를 내려받았어요. 안 열리면 한 번 더 눌러주세요.');
    }
  } finally { btn.disabled=false; btn.textContent=old; }
}
function renderSum(){
  const wcount={}; wrongIds().filter(isOpenWrong).forEach(id=>{const k=QM[id].sec;wcount[k]=(wcount[k]||0)+1;});
  const qcount={}; Q.forEach(q=>{if(!q.ob&&q.sec!=null) qcount[q.sec]=(qcount[q.sec]||0)+1;});
  const ql=sumQ.trim().toLowerCase();
  const rx=ql?new RegExp(ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'):null;
  const hl=t=>{let e=esc(t);if(rx)e=e.replace(rx,m=>`<span class="hl">${m}</span>`);return e;};
  const all=S.map((s,i)=>({s,i})).filter(x=>x.s.s===sumSubj).sort((a,b)=>(b.s.first?1:0)-(a.s.first?1:0));
  const numOf={}; SN.forEach(sj=>S.map((s,i)=>({s,i})).filter(x=>x.s.s===sj&&!x.s.first).forEach((x,k)=>numOf[x.i]=`${sj}-${String(k+1).padStart(2,'0')}`)); S.forEach((s,i)=>{if(s.first)numOf[i]='암기';});
  const txt=s=>[s.t,s.lead||'',s.tip||'',...(s.table?s.table.r.flat():[]),...(s.kv||[]).flat(),...s.items.map(it=>it.t)].join(' ').toLowerCase();
  let list=all;
  if(ql) list=S.map((s,i)=>({s,i})).filter(x=>txt(x.s).includes(ql));
  if(sumHot) list=list.filter(x=>x.s.items.some(it=>it.f>=3));
  const weak=Object.keys(wcount).map(Number).filter(k=>S[k].s===sumSubj).sort((a,b)=>wcount[b]-wcount[a]);
  const card=({s,i})=>{
    const hot=new Set(s.hot||[]); const star=k=>hot.has(k)?'<span class="star" title="자주 나옴">★</span>':'';
    let b=`<article class="scard ${wcount[i]?'weak':''}" id="sec${i}"><header><span class="sno">${numOf[i]}</span><h3>${hl(s.t)}</h3>${wcount[i]?`<span class="my">내 오답 ${wcount[i]}</span>`:''}</header>`;
    if(s.lead) b+=`<p class="slead">${hl(s.lead)}</p>`;
    if(s.table) b+=`<div class="stbl"><table><thead><tr>${s.table.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${s.table.r.map(r=>`<tr>${r.map((c,j)=>j?`<td>${hl(c)}</td>`:`<th scope="row">${hl(c)}${star(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    if(s.kv&&s.kv.length) b+=`<dl class="skv">${s.kv.map(([k,v])=>`<dt>${hl(k)}${star(k)}</dt><dd>${hl(v)}</dd>`).join('')}</dl>`;
    if(!s.table&&!(s.kv&&s.kv.length)) b+=`<ul class="sraw">${s.items.map(it=>`<li>${hl(it.t)}</li>`).join('')}</ul>`;
    if(s.gallery==='charts'&&window.CHARTS){const C=window.CHARTS;const order=['세로 막대형','가로 막대형','꺾은선형','영역형','원형','도넛형','분산형','거품형','주식형','표면형','방사형','혼합형','원형 대 원형','원형 대 가로 막대형','히스토그램','상자 수염','폭포','깔때기','트리맵','선버스트'].filter(k=>C[k]);
      b+=`<div class="cgal"><div class="cgal-h">차트 종류 한눈에 <span>${order.length}가지</span></div><div class="cgal-g">${order.map(k=>`<figure>${C[k].svg}<figcaption><b>${esc(k)}</b>${esc(C[k].tip)}</figcaption></figure>`).join('')}</div></div>`;}
    if(s.tip) b+=`<div class="stip"><b>암기</b><span>${hl(s.tip)}</span></div>`;
    if(G.length){const gi=gFind(txt(s)===''?'':[s.t,s.lead||'',s.tip||'',...(s.table?s.table.r.flat():[]),...(s.kv||[]).flat(),...s.items.map(it=>it.t)].join(' ')).slice(0,14); if(gi.length) b+=`<div class="sgl"><b>용어</b>${gi.map(i=>`<button type="button" class="gchip" data-g="${i}">${esc(G[i].w)}</button>`).join('')}</div>`;}
    if(!s.gallery) b+=chartStrip(s.t+' 차트 '+s.items.map(it=>it.t).join(' '),'그림으로 보는 차트');
    b+=`<details class="sorig"><summary>${esc(EX.itemsLabel||'기출 문장 원문')} ${s.items.length}개</summary><ul>${s.items.map(it=>`<li>${hl(it.t)}${it.f>=2?`<span class="freq">${it.f}회</span>`:''}</li>`).join('')}</ul></details>`;
    if(qcount[i]) b+=`<button class="sgo" data-sgo="${i}">이 주제 문제 풀기 (${qcount[i]}문제) →</button>`;
    return b+`</article>`;
  };
  const body=list.map(card).join('');
  let h=topbar()+`<div class="sec spage"><h1 class="stitle">요약본</h1><p class="ssub">급할 때 빠르게 훑어보는 정리예요. 차근차근 이해하며 공부하려면 <button class="linkbtn" id="toConcept">개념 학습</button>으로 가세요.</p>
  <div class="stabs ${NS>3?'many':''}" role="tablist" style="grid-template-columns:repeat(${NS},1fr)">${SN.map(s=>`<button role="tab" aria-selected="${sumSubj===s}" data-v="${s}" class="${sumSubj===s?'on':''}"><small>SUBJECT ${s}</small>${SUBJ[s]}</button>`).join('')}</div>
  <div class="schips ${sumChips?'open':''}" id="sChips">${all.map(({s,i})=>`<button data-jump="${i}" class="${wcount[i]?'w':''}">${esc(s.t)}</button>`).join('')}</div>
  <button class="smore" id="sChipT">${sumChips?'주제 접기 ▴':`주제 ${all.length}개 모두 보기 ▾`}</button>
  <div class="stools"><input class="search" id="sQ" type="search" placeholder="${esc(EX.sumSearch||'검색 (예: 배열 수식, 기본키, IPv6)')}" value="${esc(sumQ)}">
  <div class="row"><button class="tog ${sumHot?'on':''}" id="sHotT">★ 자주 나온 주제만</button><button class="tog ${sumFlip?'on':''}" id="sFlipT">한 장씩 넘기기</button><button class="tog" id="sFlash">플래시 카드로 외우기</button>${G.length?'<button class="tog" id="sGloss">용어 사전</button>':''}${PDFS.top?'<button class="tog" id="pdfTop">PDF 빈출 TOP</button>':''}${PDFS.full?`<button class="tog" id="pdfFull">${PDFS.top?'PDF 전체':'요약본 PDF 저장'}</button>`:''}</div><span class="hint" id="pdfMsg" role="status"></span></div>
  ${weak.length&&!ql?`<div class="sweak"><b>내가 약한 주제</b>${weak.slice(0,8).map(k=>`<button data-jump="${k}">${esc(S[k].t)} · ${wcount[k]}</button>`).join('')}</div>`:''}</div>`;
  h+= sumFlip&&body ? `<div class="sec"><div class="flipbar"><span>옆으로 넘기세요</span><span class="tabnum" id="flipPos">1 / ${list.length}</span></div><div class="flip" id="flip">${body}</div></div>` : `<div class="sec scards">${body||'<div class="empty">검색 결과가 없어요.</div>'}</div>`;
  h+=`<p class="hint" style="padding:0 2px 20px">${esc(EX.sumNote||'★는 기출에 3번 이상 나온 내용이에요. 카드 아래 ‘기출 문장 원문’에서 실제 출제 문장을 볼 수 있어요.')}</p>`;
  app.innerHTML=h;
  app.querySelectorAll('.stabs button').forEach(b=>b.onclick=()=>{sumSubj=+b.dataset.v;renderSum();window.scrollTo(0,0);});
  $('#sHotT').onclick=()=>{sumHot=!sumHot;renderSum();};
  $('#sFlipT').onclick=()=>{sumFlip=!sumFlip;renderSum();};
  $('#sFlash').onclick=()=>openView('flash');
  const sg=$('#sGloss'); if(sg) sg.onclick=()=>openView('gloss');
  const tc=$('#toConcept'); if(tc) tc.onclick=()=>{tab='concept';view=null;render();window.scrollTo(0,0);};
  $('#sChipT').onclick=()=>{sumChips=!sumChips;const y=window.scrollY;renderSum();window.scrollTo(0,y);};
  if($('#pdfTop'))$('#pdfTop').onclick=e=>exportPdf('top',e.currentTarget); if($('#pdfFull'))$('#pdfFull').onclick=e=>exportPdf('full',e.currentTarget);
  const fl=$('#flip'); if(fl) fl.onscroll=()=>{const w=fl.firstElementChild?fl.firstElementChild.offsetWidth+12:1;const p=$('#flipPos');if(p)p.textContent=`${Math.round(fl.scrollLeft/w)+1} / ${fl.children.length}`;};
  const qi=$('#sQ'); qi.oninput=()=>{sumQ=qi.value;const pos=qi.selectionStart;renderSum();const n=$('#sQ');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
  app.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>{const el=document.getElementById('sec'+b.dataset.jump);if(!el)return; if(sumFlip){el.scrollIntoView({block:'nearest',inline:'start'});} else {const y=el.getBoundingClientRect().top+window.scrollY-12;window.scrollTo(0,y);}});
  app.querySelectorAll('[data-sgo]').forEach(b=>b.onclick=()=>{const k=+b.dataset.sgo;const ids=shuffle(Q.filter(q=>q.sec===k&&!q.ob).map(q=>q.id)).slice(0,20);
    const go=()=>startSession({title:`주제 연습 · ${S[k].t}`,ids,instant:true,kind:'drill'});
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();});
}


/* ---------- concept (개념 학습) — 한능검 1급 마스터의 개념 학습 방식 ---------- */
let conSubj=1, conUnit=null;
function conDone(){if(!store.concept) store.concept={}; return store.concept;}
function conQs(u){const set=new Set(u.sec||[]); return Q.filter(q=>!q.ob&&set.has(q.sec));}
function conAcc(u){let r=0,n=0; conQs(u).forEach(q=>{const a=store.ans[q.id]; if(a){n++; if(a.last==='r') r++;}}); return n?Math.round(r/n*100):null;}
function conNo(u){const k=C.filter(x=>x.s===u.s).indexOf(u); return `${u.s}-${String(k+1).padStart(2,'0')}`;}
function renderConcept(){
  if(!C.length){app.innerHTML=topbar()+`<div class="sec spage"><h1 class="stitle">개념 학습</h1><div class="empty">이 자격증은 아직 개념 학습 자료가 없어요. <b>요약본</b>과 문제풀기로 공부해 주세요.</div></div>`;return;}
  if(conUnit!=null&&C[conUnit]) return renderConceptUnit(conUnit);
  const done=conDone(); const all=C.map((u,i)=>({u,i})); const subs=SN.filter(s=>C.some(u=>u.s===s));
  if(!subs.includes(conSubj)) conSubj=subs[0];
  const nd=C.filter(u=>done[u.id]).length, pct=Math.round(nd/C.length*100);
  const list=all.filter(x=>x.u.s===conSubj);
  let h=topbar()+`<div class="sec spage"><h1 class="stitle">개념 학습</h1><p class="ssub">단원별로 차근차근 이해하며 공부해요. 시험이 코앞이라 급하면 <button class="linkbtn" id="toSum">요약본</button>을 보세요.</p>
  <div class="cprog"><div class="cprog-t"><b>학습 완료 ${nd} / ${C.length} 단원</b><span>${pct}%</span></div><div class="cbar"><i style="width:${pct}%"></i></div></div>
  ${subs.length>1?`<div class="stabs ${subs.length>3?'many':''}" role="tablist" style="grid-template-columns:repeat(${subs.length},1fr)">${subs.map(s=>{const us=C.filter(u=>u.s===s), d=us.filter(u=>done[u.id]).length;return `<button role="tab" aria-selected="${conSubj===s}" data-v="${s}" class="${conSubj===s?'on':''}"><small>SUBJECT ${s} · ${d}/${us.length}</small>${SUBJ[s]}</button>`;}).join('')}</div>`:''}</div>
  <div class="sec clist">${list.map(({u,i})=>{const acc=conAcc(u), n=conQs(u).length;
    return `<button class="cunit ${done[u.id]?'done':''}" data-u="${i}"><span class="cno">${conNo(u)}</span><span class="cinfo"><b>${esc(u.t)}</b><span>${esc(u.lead||'')}</span><small>개념 ${u.cards.length}개${n?` · 관련 문제 ${n}`:''}${acc!=null?` · 정답률 ${acc}%`:''}</small></span><span class="cchk" aria-label="${done[u.id]?'학습 완료':'아직'}">${done[u.id]?'✓':''}</span></button>`;}).join('')}</div>`;
  app.innerHTML=h;
  app.querySelectorAll('.stabs button').forEach(b=>b.onclick=()=>{conSubj=+b.dataset.v;renderConcept();});
  $('#toSum').onclick=()=>{tab='sum';view=null;render();window.scrollTo(0,0);};
  app.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{conUnit=+b.dataset.u;renderConcept();window.scrollTo(0,0);});
}
function renderConceptUnit(i){
  const u=C[i], done=conDone(), qs=conQs(u), acc=conAcc(u);
  const same=C.map((x,k)=>({x,k})); const prev=same[i-1], next=same[i+1];
  let h=topbar()+`<div class="sec spage cunitp"><button class="cback" id="cBack">← 단원 목록</button>
  <div class="ceye">${NS>1?`SUBJECT ${u.s} · ${esc(SUBJ[u.s])} · `:''}${conNo(u)}</div><h1 class="stitle">${esc(u.t)}</h1>${u.lead?`<p class="ssub">${esc(u.lead)}</p>`:''}</div>
  <div class="sec ccards">${u.cards.map((c,k)=>`<article class="ccard"><div class="ck">개념 ${k+1}</div><h3>${esc(c.h)}</h3><p>${gLink(esc(c.p))}</p></article>`).join('')}</div>`;
  if(u.flow&&u.flow.steps&&u.flow.steps.length) h+=`<div class="sec"><section class="cflow"><h3>${esc(u.flow.t||'흐름으로 보기')}</h3><ol>${u.flow.steps.map(([a,b])=>`<li><span class="fy">${esc(a)}</span><span class="fe">${esc(b)}</span></li>`).join('')}</ol></section></div>`;
  if(u.kw&&u.kw.length) h+=`<div class="sec"><section class="ckw"><h3>꼭 기억할 말</h3><div>${u.kw.map(k=>`<span>${esc(k)}</span>`).join('')}</div></section></div>`;
  h+=`<div class="sec cacts"><button class="btn ${done[u.id]?'ghost':'okb'}" id="cDone">${done[u.id]?'✓ 학습 완료됨':'학습 완료 표시'}</button>
  ${qs.length?`<button class="btn" id="cGo">이 단원 문제 풀기 (${Math.min(20,qs.length)}문제)${acc!=null?` · 정답률 ${acc}%`:''} →</button>`:''}
  ${(u.sec||[]).length?`<button class="btn ghost" id="cSum">요약본에서 보기</button>`:''}</div>
  <nav class="sec cnav">${prev?`<button data-u="${prev.k}"><small>← 이전 단원</small>${esc(prev.x.t)}</button>`:'<span></span>'}${next?`<button data-u="${next.k}" class="nx"><small>다음 단원 →</small>${esc(next.x.t)}</button>`:'<span></span>'}</nav>`;
  app.innerHTML=h;
  $('#cBack').onclick=()=>{conUnit=null;conSubj=u.s;renderConcept();window.scrollTo(0,0);};
  $('#cDone').onclick=()=>{if(done[u.id]) delete done[u.id]; else done[u.id]=Date.now(); save(); renderConceptUnit(i);};
  const g=$('#cGo'); if(g) g.onclick=()=>{const ids=shuffle(qs.map(q=>q.id)).slice(0,20);
    const go=()=>startSession({title:`단원 연습 · ${u.t}`,ids,instant:true,kind:'drill'});
    if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();};
  const sm=$('#cSum'); if(sm) sm.onclick=()=>{const k=u.sec[0]; sumSubj=S[k]?S[k].s:u.s; sumQ=''; tab='sum'; view=null; render(); setTimeout(()=>{const el=document.getElementById('sec'+k); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-12);},30);};
  app.querySelectorAll('.cnav [data-u]').forEach(b=>b.onclick=()=>{conUnit=+b.dataset.u;conSubj=C[conUnit].s;renderConcept();window.scrollTo(0,0);});
}

/* ---------- cram (벼락치기) ---------- */
let cramSet=null, cramRound='', cramPos=0, cramSec=null;
function cramView(){return store.pref.cview||'scroll';}
function cramSrcOpts(){
  const yrs=[...new Set(SETS.map(s=>s.slice(0,4)).filter(y=>/^\d{4}$/.test(y)))].sort().reverse();
  const o=[['all','전체 문제'],...EX.cramSrc.map(x=>[x.v,x.l]),...yrs.map(y=>['Y'+y,`${y}년 기출`]),['R','🎲 랜덤 시험지']];
  return o.map(([v,l])=>`<option value="${v}" ${cramSrc===v?'selected':''}>${l}</option>`).join('');
}
let cramSubj=0, cramSrc='all', cramMine=false, cramShown=20, cramOrder=null;
function cramList(){
  if(cramSec!=null){let L=Q.filter(q=>q.sec===cramSec); if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0); return L.sort((a,b)=>((store.ans[b.id]||{}).w||0)-((store.ans[a.id]||{}).w||0));}
  if(cramSrc==='R'){const r=randList().find(x=>x.no===cramSet)||randList()[0]; if(!r) return []; cramSet=r.no; let L=r.ids.map(id=>QM[id]).filter(Boolean).filter(q=>!cramSubj||q.s===cramSubj); if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0); if(cramOrder){const pos={};cramOrder.forEach((id,i)=>pos[id]=i);L=L.slice().sort((a,b)=>(pos[a.id]??1e9)-(pos[b.id]??1e9));} return L;}
  let L=Q.filter(q=>(!cramSubj||q.s===cramSubj)&&(cramSrc==='all'||(cramSrc[0]==='Y'?(cramRound?q.set===cramRound:q.set.startsWith(cramSrc.slice(1))):(EX.cramSrc.find(x=>x.v===cramSrc)||{f:()=>true}).f(q))));
  if(cramMine) L=L.filter(q=>store.ans[q.id]&&store.ans[q.id].w>0);
  if(cramOrder){const pos={};cramOrder.forEach((id,i)=>pos[id]=i);L=L.slice().sort((a,b)=>(pos[a.id]??1e9)-(pos[b.id]??1e9));}
  return L;
}
function cramCard(q){
  const neg=!!(q.fx||q.neg);
  const opts=q.o.map((o,i)=>{const n=i+1, ok=n===q.a;
    if(neg){ return ok? `<li class="fix"><span class="ic">✕</span><span><span class="tx2">${MK[i]} ${markFix(q,o)}</span></span></li>` : `<li class="t"><span class="ic">✓</span><span class="tx">${MK[i]} ${esc(o)}</span></li>`; }
    return ok? `<li class="t key"><span class="ic">✓</span><span class="tx">${MK[i]} ${esc(o)}</span></li>` : `<li class="f"><span class="ic">✕</span><span class="tx">${MK[i]} ${esc(o)}</span></li>`;
  }).join('');
  const img = imgsHTML(q);
  const qtext = q.full&&q.img ? img : `<div class="q">${esc(q.q)}</div>${img}`;
  const e = q.eimg ? `<img class="qimg" loading="lazy" src="${q.eimg}" alt="해설">` : `<div class="more">${gLink(esc(q.e))}</div><button type="button" data-more>더 보기</button>`;
  return `<div class="cramcard"><div class="meta"><span class="chip s${q.s}">${q.s}과목</span>${esc(SL(q.set))} ${q.n}번 ${q.ob?'<span class="obchip">옛 버전</span> ':''}${neg?'<span class="neg">틀린 것 찾기</span>':'<span class="pos">맞는 것 찾기</span>'}${saveBtn(q.id)}</div>
  ${qtext}<ul class="facts">${opts}</ul>
  <div class="fixnote"><b>${neg?'해설':'정답 이유'}</b> ${e}</div>${tipHTML(q)}</div>`;
}
const cramAns={};
function cramSolve(q){
  const p=cramAns[q.id];
  if(p){ // 푼 뒤: 정답 표시 카드 + 내 답
    const ok=p===q.a;
    return `<div class="csolve ${ok?'csok':'csno'}"><div class="vt">${ok?'○ 정답':'✕ 오답'} <span class="muted">내 답 ${MK[p-1]} · 정답 ${MK[q.a-1]}</span><button class="iconbtn" data-cretry="${esc(q.id)}">다시 풀기</button></div>${cramCard(q)}</div>`;
  }
  const img=imgsHTML(q); const qtext=q.full&&q.img?img:`<div class="q">${esc(q.q)}</div>${img}`;
  return `<div class="cramcard"><div class="meta"><span class="chip s${q.s}">${q.s}과목</span>${esc(SL(q.set))} ${q.n}번 ${saveBtn(q.id)}</div>${qtext}
  <div class="opts">${q.o.map((o,i)=>`<button class="opt" data-cpick="${i+1}"><span class="n">${i+1}</span><span>${esc(o)}</span></button>`).join('')}</div>
  <p class="hint">답을 고르면 정답과 틀린 부분 고친 내용, 해설이 나와요.</p></div>`;
}
/* ---------- 벼락치기 CBT 시험지형 (정답 표시) ---------- */
let cpPage=0;
function renderCramPaper(){
  const L=cramList(); const PS=10, np=Math.max(1,Math.ceil(L.length/PS)); if(cpPage>=np) cpPage=np-1; if(cpPage<0) cpPage=0;
  ROOT.classList.add('ppon'); nav.hidden=true;
  const from=cpPage*PS, list=L.slice(from,from+PS);
  const srcName=(()=>{const o=document.createElement('div');o.innerHTML=`<select>${cramSrcOpts()}</select>`;const s=o.querySelector('option[selected]');return s?s.textContent:'전체 문제';})();
  let h=`<div class="pp cp"><header class="pp-h"><div class="pp-l"><button class="pp-brand" id="cpHome" title="홈으로">${esc(EX.brand)}</button><button class="pp-sw" id="cpExit">← 벼락치기 목록으로</button></div>
  <h1>${esc(EX.name.replace(' 필기',''))} : 벼락치기 정답 시험지</h1>
  <div class="pp-r"><span class="pp-time">${esc(srcName)}${cramSubj?` · ${cramSubj}과목`:''}${cramMine?' · 내가 틀린 문제':''}</span><span class="pm">${L.length}문제 · 정답에 ● 표시</span></div></header>
  <div class="pp-body"><main class="pp-paper">${list.map((q,k)=>{const i=from+k;const neg=!!(q.fx||q.neg);
    const stem=q.full&&q.img?`<div class="pp-qt"><span>${i+1}.</span></div>${imgsHTML(q,'pp-img')}`:`<div class="pp-qt"><span>${i+1}.</span><span>${esc(q.q)}</span></div>${imgsHTML(q,'pp-img')}`;
    return `<section class="pp-q" id="pq${i}"><div class="cp-meta">${esc(SL(q.set))} ${q.n}번 · ${q.s}과목${neg?' · <b>틀린 것 찾기</b>':''}</div>${stem}<ol>${q.o.map((o,j)=>`<li><div class="cp-o ${j+1===q.a?'on':''}"><span class="m">${MK[j]}</span><span>${j+1===q.a?markFix(q,o):esc(o)}</span></div></li>`).join('')}</ol>
    <details class="cp-e"><summary>해설 보기</summary><div>${q.eimg?`<img class="pp-img" src="${q.eimg}" alt="해설">`:gLink(esc(q.e))}</div></details></section>`;}).join('')||'<p>해당하는 문제가 없어요.</p>'}</main>
  <aside class="pp-sheet"><h2>정 답 표</h2><div class="pp-omr">${L.map((q,i)=>`${i&&i%5===0?'<hr>':''}<div class="pr ${Math.floor(i/PS)===cpPage?'cur':''}"><b data-pgo="${i}">${String(i+1).padStart(2,'0')}.</b>${[1,2,3,4].map(n=>`<span class="${q.a===n?'on':''}">${MK[n-1]}</span>`).join('')}</div>`).join('')}</div></aside></div>
  <footer class="pp-f"><button id="cpPrev" ${cpPage===0?'disabled':''}>◀ 이전</button><span class="pp-pg">- ${cpPage+1} / ${np} -</span><button id="cpNext" ${cpPage>=np-1?'disabled':''}>다음 ▶</button><button class="pp-omrbtn" id="ppOmr">정답표</button></footer></div>`;
  app.innerHTML=h;
  const go=i=>{cpPage=Math.floor(i/PS);renderCramPaper();const e=document.getElementById('pq'+i);if(e)window.scrollTo(0,e.getBoundingClientRect().top+window.scrollY-80);};
  app.querySelectorAll('[data-pgo]').forEach(b=>b.onclick=()=>go(+b.dataset.pgo));
  $('#cpPrev').onclick=()=>{cpPage--;renderCramPaper();window.scrollTo(0,0);};
  $('#cpNext').onclick=()=>{cpPage++;renderCramPaper();window.scrollTo(0,0);};
  $('#ppOmr').onclick=()=>$('.pp-sheet').classList.toggle('open');
  $('#cpHome').onclick=()=>{store.pref.cview='scroll';save();ROOT.classList.remove('ppon');nav.hidden=false;tab='home';render();window.scrollTo(0,0);};
  $('#cpExit').onclick=()=>{store.pref.cview='scroll';save();ROOT.classList.remove('ppon');nav.hidden=false;renderCram();window.scrollTo(0,0);};
  const cur=app.querySelector('.pp-omr .pr.cur'); if(cur){const box=app.querySelector('.pp-omr');box.scrollTop=cur.offsetTop-box.offsetTop-40;}
}
function cramRec(){
  if(cramSec!=null) return `<div class="sec"><div class="panel recp"><b>주제: ${esc(S[cramSec].t)}</b><span class="hint">이 주제 문제만 모아 보는 중이에요. 내가 틀린 문제가 먼저 나와요.</span><button class="iconbtn" id="cRecX">전체 문제로 돌아가기</button></div></div>`;
  const ow=wrongIds(); if(!ow.length) return '';
  const open=ow.filter(isOpenWrong).length; const bySub=SN.map(s=>ow.filter(id=>QM[id].s===s).length);
  const wt=weakTopics().filter(w=>w.p<70).slice(0,3);
  return `<div class="sec"><div class="panel recp ${cramMine?'on':''}"><b>추천 · 내가 틀린 문제부터 보기</b><span class="hint">틀렸던 문제 ${ow.length}개${open?` (아직 못 맞힌 것 ${open}개)`:''}를 정답이 표시된 채로 먼저 훑어보세요. 시험 직전엔 이게 제일 효과적이에요.</span>
  <div class="row">${cramMine?`<button class="btn ghost" id="cRecOff">전체 문제 보기</button>`:`<button class="btn" id="cRecOn">틀린 문제 ${ow.length}개 보기</button>`}</div>
  <div class="recchips">${SN.map((s,i)=>bySub[i]?`<button data-recs="${s}">${s}과목 ${bySub[i]}</button>`:'').join('')}${wt.map(w=>`<button data-recsec="${w.k}">약한 주제 · ${esc(S[w.k].t)} ${w.p}%</button>`).join('')}</div></div></div>`;
}
function renderCram(){
  if(cramView()==='paper') return renderCramPaper();
  ROOT.classList.remove('ppon'); nav.hidden=false;
  const L=cramList(); const shown=L.slice(0,cramShown);
  let h=topbar()+`<div class="sec"><div class="panel confirm"><b>벼락치기 · 정답만 보며 훑기</b><span class="hint">문제를 풀지 않고 정답이 표시된 채로 넘겨봐요. ✓는 맞는 내용, ✕는 틀린 내용이에요. ‘틀린 것 찾기’ 문제는 ✕ 보기에서 <span class="wr">빨간 줄</span>이 틀린 부분, <span class="cr">초록 글씨</span>가 바르게 고친 내용이에요.</span><div class="row">${PDFS.cram?`<button class="btn ghost" id="cPdf">정답노트 PDF 저장${EX.cramPdfNote?' ('+EX.cramPdfNote+')':''}</button>`:''}</div><span class="hint" id="pdfMsg" role="status"></span></div></div>
  ${cramRec()}
  <div class="crambar ${cramView()==='one'?'nost':''}"><div class="seg" id="cSubj">${[0,...SN].map(s=>`<button data-v="${s}" class="${cramSubj===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  <div class="csel"><select id="cSrcSel" aria-label="문제 출처">${cramSrcOpts()}</select>${/^Y/.test(cramSrc)?`<select id="cRound" aria-label="회차">${['',...SETS.filter(s=>s.startsWith(cramSrc.slice(1))).sort()].map(s=>`<option value="${esc(s)}" ${cramRound===s?'selected':''}>${s?esc(s.slice(5).replace('.','월 ').replace(' 기출','일 시험')):'그해 전체 회차'}</option>`).join('')}</select>`:''}</div>
  ${cramSrc==='R'?`<div class="rpick">${randList().length?`<select id="cRset" aria-label="랜덤 시험지 고르기">${randList().map(r=>`<option value="${r.no}" ${r.no===cramSet?'selected':''}>${esc(r.t)} · ${RSRC[r.src].t}</option>`).join('')}</select>`:'<span class="hint">아직 만든 랜덤 시험지가 없어요.</span>'}<button class="iconbtn" id="cRnew">🎲 새로 뽑기</button>${randList().length?'<button class="iconbtn" id="cRgo">이 시험지 풀기</button>':''}</div>`:''}
  <div class="vseg" id="cvSeg"><span>보기</span><button data-v="scroll" class="${cramView()==='scroll'?'on':''}">스크롤로 쭉</button><button data-v="paper" class="${cramView()==='paper'?'on':''}">CBT 시험지로 보기</button><button data-v="one" class="${cramView()==='one'?'on':''}">한 문제씩 풀고 확인</button></div>
  <div class="cramcount"><span><label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" id="cMine" ${cramMine?'checked':''}> 내가 틀린 문제만</label></span><span><span class="tabnum">${L.length}</span>문제 · <button class="iconbtn" id="cShuf" style="padding:3px 8px">${cramOrder?'순서대로':'섞기'}</button></span></div></div>
  ${cramView()==='one'?(L.length?(()=>{if(cramPos>=L.length)cramPos=L.length-1;if(cramPos<0)cramPos=0;return `<div class="sec cone"><div class="conebar"><button class="btn ghost" id="cPrev" ${cramPos===0?'disabled':''}>◀ 이전</button><label class="cpos"><input id="cJump" type="number" min="1" max="${L.length}" value="${cramPos+1}" inputmode="numeric"> / ${L.length}</label><button class="btn" id="cNext" ${cramPos>=L.length-1?'disabled':''}>다음 ▶</button></div><div id="cOneCard">${cramSolve(L[cramPos])}</div><p class="hint" style="text-align:center">옆으로 밀어도 넘어가요</p></div>`;})():'<div class="empty">해당하는 문제가 없어요.</div>'):
  `<div class="sec">${shown.map(cramCard).join('')||'<div class="empty">해당하는 문제가 없어요.</div>'}${L.length>cramShown?`<button class="btn ghost" id="cMore">다음 20문제 더 보기 (${cramShown}/${L.length})</button>`:''}</div>`}`;
  app.innerHTML=h;
  const re=()=>{cramShown=20;cramPos=0;renderCram();window.scrollTo(0,0);};
  const ro=$('#cRecOn'); if(ro) ro.onclick=()=>{cramMine=true;cramSrc='all';cramSubj=0;cramSec=null;re();};
  const rf=$('#cRecOff'); if(rf) rf.onclick=()=>{cramMine=false;re();};
  const rx=$('#cRecX'); if(rx) rx.onclick=()=>{cramSec=null;re();};
  app.querySelectorAll('[data-recs]').forEach(b=>b.onclick=()=>{cramMine=true;cramSrc='all';cramSec=null;cramSubj=+b.dataset.recs;re();});
  app.querySelectorAll('[data-recsec]').forEach(b=>b.onclick=()=>{cramSec=+b.dataset.recsec;cramMine=false;re();});
  app.querySelectorAll('#cvSeg button').forEach(b=>b.onclick=()=>{store.pref.cview=b.dataset.v;save();re();});
  if(cramView()==='one'&&L.length){
    const go=k=>{cramPos=Math.max(0,Math.min(L.length-1,k));const y=window.scrollY;renderCram();window.scrollTo(0,Math.min(y,($('.cone')?$('.cone').getBoundingClientRect().top+window.scrollY-120:0)));};
    $('#cPrev').onclick=()=>go(cramPos-1); $('#cNext').onclick=()=>go(cramPos+1);
    $('#cJump').onchange=e=>go((+e.target.value||1)-1);
    const card=$('#cOneCard'); let sx=null,sy=null;
    card.querySelectorAll('[data-cpick]').forEach(b=>b.onclick=()=>{const q=L[cramPos];const n=+b.dataset.cpick;cramAns[q.id]=n;record(q.id,n);save();card.innerHTML=cramSolve(q);bindMore();bindRetry();});
    function bindRetry(){card.querySelectorAll('[data-cretry]').forEach(b=>b.onclick=()=>{delete cramAns[b.dataset.cretry];renderCram();});}
    bindRetry();
    card.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY;},{passive:true});
    card.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5)go(cramPos+(dx<0?1:-1));},{passive:true});
    document.onkeydown=e=>{if(tab!=='cram'||cramView()!=='one'||e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='ArrowRight')go(cramPos+1);if(e.key==='ArrowLeft')go(cramPos-1);};
  }
  app.querySelectorAll('#cSubj button').forEach(b=>b.onclick=()=>{cramSubj=+b.dataset.v;re();});
  $('#cSrcSel').onchange=e=>{cramSrc=e.target.value;cramRound='';re();};
  const cr=$('#cRound'); if(cr) cr.onchange=e=>{cramRound=e.target.value;re();};
  $('#cMine').onchange=e=>{cramMine=e.target.checked;re();};
  const rs=$('#cRset'); if(rs) rs.onchange=()=>{cramSet=+rs.value;re();};
  const rn=$('#cRnew'); if(rn) rn.onclick=()=>{cramSet=makeRandom(rsrc()).no;re();};
  const rg=$('#cRgo'); if(rg) rg.onclick=()=>{const r=randList().find(x=>x.no===cramSet); if(!r) return; const go=()=>startExam({title:r.t,ids:r.ids}); if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;go();}); go();};
  $('#cShuf').onclick=()=>{cramOrder=cramOrder?null:shuffle(Q.map(q=>q.id));re();};
  if($('#cPdf'))$('#cPdf').onclick=e=>exportPdf('cram',e.currentTarget);
  bindMore();
  const m=$('#cMore'); if(m){ m.onclick=()=>{cramShown+=20;const y=window.scrollY;renderCram();window.scrollTo(0,y);};
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){io.disconnect();m.click();}},{rootMargin:'600px'});io.observe(m);} }
}
function bindMore(){app.querySelectorAll('[data-more]').forEach(b=>b.onclick=()=>{const f=b.closest('.fixnote');f.classList.toggle('open');b.textContent=f.classList.contains('open')?'접기':'더 보기';});}

/* ---------- records ---------- */
function renderRec(){
  const rl=realSorted();
  let h=topbar()+`<div class="sec" id="anaSec"><div class="sech"><h2>나의 학습 분석</h2><button class="iconbtn" id="goCustom">맞춤학습 →</button></div>${anaCharts()}</div><div class="sec">${ddayForm()}</div>
  <div class="sec"><div class="sech"><h2>내 실제 시험 점수</h2><span class="muted" style="font-size:12px">${rl.length}회</span></div>`;
  if(rl.length>1){
    h+=`<div class="panel scroll-x"><table class="hist"><tr><th>날짜</th>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>${AVGN}</th><th>결과</th></tr>${rl.map(({r})=>{const a=analyzePrev(r.sub);return `<tr><td>${esc(r.d||'-')}</td>${r.sub.map((x,k)=>`<td class="${isFail(x,k+1)?'no':''}">${x}</td>`).join('')}<td><b>${a.avg}</b></td><td class=\"${isPart(a)?'':(a.pass?'ok':'no')}\">${PL(a)}</td></tr>`;}).join('')}</table></div>`;
  }
  h+=rl.map(({r,i})=>realCard(r,i,true)).join('');
  h+=realForm('rv',rl.length?'실제 시험 점수 추가':'실제 시험 점수 넣기','시험 보고 받은 과목별 점수를 넣으면 합격까지 남은 문제 수를 알려줘요.');
  h+=`</div><div class="sec"><div class="sech"><h2>앱 모의고사 기록</h2></div>`;
  if(!store.hist.length) h+=`<div class="empty">아직 모의고사 기록이 없어요. 한 번 풀어보세요.</div>`;
  else {
    h+=scoreCard(store.hist[0]);
    h+=`<div class="panel scroll-x"><table class="hist"><tr><th>시험</th>${SN.map(s=>`<th>${s}과목</th>`).join('')}<th>${AVGN}</th><th>결과</th></tr>${store.hist.map((r,i)=>`<tr data-h="${i}" style="cursor:pointer"><td>${esc(SL(r.title))}${r.kind==='practice'?' <small class="muted">연습</small>':''}</td>${r.sub.map((x,k)=>`<td class="${isFail(x,k+1)?'no':''}">${x===null?'-':x}</td>`).join('')}<td><b>${r.avg}</b></td><td class=\"${isPart(r)?'':(r.pass?'ok':'no')}\">${PL(r)}</td></tr>`).join('')}</table></div><p class="hint">줄을 누르면 그 시험의 틀린 문제를 볼 수 있어요.</p>`;
  }
  h+=`</div>
  <div class="sec"><button class="btn ghost" id="reset">모의고사 기록·오답노트 지우기</button><p class="hint">실제 시험 점수는 지워지지 않아요. 기록은 이 기기의 브라우저에만 저장돼요. 휴대폰과 컴퓨터 기록은 따로예요.</p></div>`;
  app.innerHTML=h;
  app.querySelectorAll('[data-h]').forEach(tr=>tr.onclick=()=>showResult(store.hist[+tr.dataset.h]));
  bindDday(()=>renderRec()); $('#goCustom').onclick=()=>openView('custom');
  bindRealForm('rv',()=>{renderRec();});
  app.querySelectorAll('[data-rdel]').forEach(b=>b.onclick=()=>confirmBox('이 시험 점수를 지울까요?',()=>{realList().splice(+b.dataset.rdel,1);save();renderRec();}));
  $('#reset').onclick=()=>confirmBox('푼 기록과 오답노트를 모두 지울까요? 되돌릴 수 없어요.',()=>{store={ans:{},hist:[],cur:null,pref:store.pref,prev:null,real:store.real||[],rand:store.rand||[],saved:store.saved||{}};save();render();});
}

/* ================= 추가 기능 (HAE) ================= */
const ICON={
 subj:'<path d="M5 4h14v16H5z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
 rand:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.3"/><circle cx="15" cy="15" r="1.3"/><circle cx="15" cy="9" r="1.3"/><circle cx="9" cy="15" r="1.3"/>',
 custom:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1"/>',
 today:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M9 3v4M15 3v4"/><path d="M10 14l2 2 3-3"/>',
 flash:'<rect x="3" y="7" width="13" height="13" rx="2"/><path d="M8 4h11a2 2 0 0 1 2 2v11"/>',
 notes:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 12l6 6M15 12l-6 6"/>',
 saved:'<path d="M7 3h10v18l-5-4-5 4z"/>',
 search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
 score:'<path d="M5 20V10M12 20V4M19 20v-7"/>',
 chart:'<path d="M4 19h16"/><path d="M5 15l4-5 4 3 6-7"/>'
};
const ico=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
function dayKey(t){const d=t?new Date(t):new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function logAnswer(id,ok){
  store.day=store.day||{}; const d=dayKey(); const v=store.day[d]||[0,0]; ok?v[0]++:v[1]++; store.day[d]=v;
  store.log=(store.log||[]); store.log.push([id,ok?1:0]); if(store.log.length>400) store.log=store.log.slice(-400);
}
function streak(){const D=store.day||{};let n=0;const t=new Date();for(;;){const k=dayKey(t);if(D[k]&&D[k][0]+D[k][1]>0){n++;t.setDate(t.getDate()-1);}else break;}return n;}
/* D-day */
function dday(){const d=store.pref&&store.pref.examDate; if(!d) return null; const a=new Date(d+'T00:00:00'), b=new Date(dayKey()+'T00:00:00'); return Math.round((a-b)/864e5);}
function ddayChip(){const n=dday(); if(n===null) return ''; return `<span class="dday" title="시험일 ${esc(store.pref.examDate)}">${n>0?'D-'+n:n===0?'D-DAY':'D+'+(-n)}</span>`;}
/* 저장한 문제 */
function isSaved(id){return !!(store.saved&&store.saved[id]);}
function toggleSaved(id){store.saved=store.saved||{}; if(store.saved[id]) delete store.saved[id]; else store.saved[id]=Date.now(); save(); return isSaved(id);}
function saveBtn(id){return `<button class="savebtn ${isSaved(id)?'on':''}" data-save="${esc(id)}" aria-label="문제 저장" title="문제 저장">${ico('saved')}<span>${isSaved(id)?'저장됨':'저장'}</span></button>`;}
document.addEventListener('click',e=>{if(!LIVE()) return; const b=e.target.closest('[data-save]'); if(!b) return; e.stopPropagation(); const on=toggleSaved(b.dataset.save); document.querySelectorAll(`[data-save="${CSS.escape(b.dataset.save)}"]`).forEach(x=>{x.classList.toggle('on',on);const s=x.querySelector('span');if(s)s.textContent=on?'저장됨':'저장';});},true);
document.addEventListener('click',e=>{if(!LIVE()) return; const b=e.target.closest('[data-ask]'); if(!b) return; e.stopPropagation(); const o=ORIG[b.dataset.ask]; if(!o) return; PM_SHELL.ask({q:o.q,passage:o.passage||'',o:o.o.slice(),a:o.a,e:o.e||'',src:SL(o.set)+' '+o.n+'번',s:SUBJ[o.s]||''});},true);
/* 풀이 이력 */
function histLine(id){const r=store.ans[id]; if(!r) return ''; const n=r.r+r.w; return `<div class="qhist">내 기록 · 이 문제 ${n}번 풀어 ${r.r}번 맞힘 · 최근 ${r.last==='r'?'<b class="ok">○</b>':'<b class="no">✕</b>'}${r.t?` (${new Date(r.t).getMonth()+1}/${new Date(r.t).getDate()})`:''}</div>`;}
/* 문제 정보 */
function infoBox(id){
  const q=QM[id]; const sec=S[q.sec]; const r=store.ans[id];
  const bg=document.createElement('div'); bg.className='sheetbg';
  bg.innerHTML=`<div class="sheet"><div class="sech"><h2>문제 정보</h2><button class="iconbtn" id="ifC">닫기</button></div>
  <dl class="skv"><dt>출처</dt><dd>${esc(SL(q.set))} ${q.n}번</dd><dt>과목</dt><dd>${q.s}과목 ${esc(SUBJ[q.s])}</dd>
  ${sec?`<dt>관련 요약</dt><dd>${esc(sec.t)}</dd>`:''}${q.g>1?`<dt>반복 출제</dt><dd>비슷한 문제가 ${q.g}개 회차에 나옴</dd>`:''}
  <dt>내 기록</dt><dd>${r?`${r.r+r.w}번 풀어 ${r.r}번 맞힘`:'아직 안 풂'}</dd><dt>저장</dt><dd>${isSaved(id)?'저장한 문제':'—'}</dd></dl>
  <div class="row" style="gap:8px;flex-wrap:wrap">${sec?`<button class="btn ghost" id="ifSum">이 주제 요약본 보기</button>`:''}${window.PM_SHELL&&PM_SHELL.canAsk&&PM_SHELL.canAsk()?`<button class="btn ghost" id="ifAsk">💬 패스메이트에 묻기</button>`:''}</div></div>`;
  ROOT.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();}; bg.querySelector('#ifC').onclick=()=>bg.remove();
  const ak=bg.querySelector('#ifAsk'); if(ak) ak.onclick=()=>{bg.remove(); if(store.cur&&tab==='quiz') pauseCur(); const o=ORIG[id]; PM_SHELL.ask({q:o.q,passage:o.passage||'',o:o.o.slice(),a:o.a,e:o.e||'',src:SL(o.set)+' '+o.n+'번',s:SUBJ[o.s]||''});};
  const g=bg.querySelector('#ifSum'); if(g) g.onclick=()=>{bg.remove(); if(store.cur&&tab==='quiz') pauseCur(); sumSubj=q.s; sumQ=''; tab='sum'; view=null; render(); setTimeout(()=>{const el=document.getElementById('sec'+q.sec); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-12);},30);};
}
/* 문항별 시간 */
function tickQ(c,newId){const now=Date.now(); if(c.qsId&&c.qsAt){c.qt=c.qt||{}; c.qt[c.qsId]=(c.qt[c.qsId]||0)+Math.min(600,(now-c.qsAt)/1000);} c.qsId=newId||null; c.qsAt=now;}
/* 시작 도우미 */
function startGuard(fn){ if(store.cur) return confirmBox('풀던 시험이 사라져요. 새로 시작할까요?',()=>{store.cur=null;fn();}); fn(); }
function openView(type,extra){view=Object.assign({type},extra||{}); if(type==='analysis'){tab='rec';view=null;render();setTimeout(()=>{const el=$('#anaSec'); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-10);},20);return;} tab='home'; render(); window.scrollTo(0,0);}
function subTop(title){return topbar()+`<div class="subhead"><button class="iconbtn" id="vBack">← 뒤로</button><h1>${title}</h1></div>`;}
function bindBack(){const b=$('#vBack'); if(b) b.onclick=()=>{view=null;render();window.scrollTo(0,0);};}

/* 홈 메뉴 */
/* ---------- 20시간 합격 코스 (HAE) ----------
   어느 자격증이든 같은 방식으로 자동으로 짜요.
   1) 진단 20문제로 과목별 실력 재기 → 제일 약한(과락 위험) 과목부터 순서 정하기
   2) 과목마다 기출에 자주 나온 단원만 골라(기출의 70% 안팎) 묶음 단계로: 핵심 카드 → 기출 드릴 → 통과 체크(8/10)
   3) 마지막에 실전 리허설 (진짜 시험 문항 수·시간)
   합격 예측: 단원별 정답률(안 푼 단원은 반반으로 가정)을 기출 출제 비율로 가중해서 과목별 예상 정답 수를 계산 */
const P20S=Array.isArray(S)?S:[];
const P20PTS=(typeof PTS!=='undefined'&&PTS)||null;
const P20N=s=>(typeof perOf==='function'?perOf(s):PER);
const P20_TOTN=SN.reduce((a,s)=>a+P20N(s),0);
const P20_HASG=Q.some(q=>/기출/.test(q.set));
const P20_ISG=q=>!q.ob&&(P20_HASG?/기출/.test(q.set):!/모의|예상|추가/.test(q.set));
const P20_FREQ=(()=>{const f={}; Q.forEach(q=>{if(q.sec!=null&&P20_ISG(q)) f[q.sec]=(f[q.sec]||0)+1;}); return f;})();
const P20_SECQ=(()=>{const f={}; Q.forEach(q=>{if(q.sec!=null&&!q.ob) f[q.sec]=(f[q.sec]||0)+1;}); return f;})();
const PASSLINE={}, TARGET={}; SN.forEach(s=>{const n=P20N(s); PASSLINE[s]=NS>1?Math.ceil(n*0.4):0; TARGET[s]=Math.min(n,Math.max(PASSLINE[s]+2,Math.round(n*0.66)));});
const P20_RATE=EX.p20Pass||(EX.key==='kh'?0.8:0.6); // 한능검은 1급(80점) 기준
const P20_TOT=Math.ceil(P20_TOTN*P20_RATE);
const P20_CIRC='①②③④⑤⑥⑦⑧⑨⑩';
const P20_CALCRE=/구하|계산|값은|값을|얼마|몇\s*[a-zA-Z가-힣㎡㎥%]*\s*(인가|이상|이하|정도)/;
/* 단계 만들기 */
const P20_SUBJ=(()=>{ const out={}; const H=17;
  SN.forEach(s=>{
    const n=P20N(s), hs=H*n/P20_TOTN;
    let secs=[]; P20S.forEach((x,k)=>{ if(x&&x.s===s&&P20_SECQ[String(k)]&&!/^기타\s*\(/.test(x.t||'')) secs.push(String(k)); });
    const fq=k=>P20_FREQ[k]||0, useF=secs.some(k=>fq(k)>0), w=k=>useF?fq(k):(P20_SECQ[k]||0);
    secs.sort((a,b)=>w(b)-w(a)||(+a)-(+b));
    const tot=secs.reduce((a,k)=>a+w(k),0); const keep=[], skip=[]; let cum=0;
    const kWant=NS===1?8:Math.max(2,Math.round(9*n/P20_TOTN)), cap=kWant*9;
    secs.forEach(k=>{ if(w(k)>0&&keep.length<cap&&(cum<tot*0.72||keep.length<2)){keep.push(k);cum+=w(k);} else skip.push(k); });
    const kk=Math.max(1,Math.min(kWant,keep.length)), per=Math.ceil(keep.length/kk);
    const groups=[]; for(let i=0;i<keep.length;i+=per) groups.push(keep.slice(i,i+per));
    if(!groups.length){ const nq=Q.filter(q=>q.s===s&&!q.ob).length; if(nq) return out[s]={hs,skip:[],tot:0,useF:false,cov:1,stages:[{id:`s${s}-0`,s,h:hs,secs:['all'+s],top:null,t:`${NS>1?s+'과목 ':''}전체 문제`,desc:`이 자격증은 단원 정보가 없어서 ${NS>1?s+'과목 ':''}문제 전체로 연습해요.`,calc:false}]}; return out[s]={hs,skip:[],tot:0,useF:false,cov:1,stages:[]}; }
    out[s]={hs,skip,tot,useF,cov:tot?cum/tot:1,stages:groups.map((g,i)=>{
      const fs=g.reduce((a,k)=>a+w(k),0), pct=tot?Math.round(fs/tot*100):0;
      const top=g.slice(0,2).map(k=>P20S[+k].t), more=g.length>2?` 외 ${g.length-2}`:'';
      return {id:`s${s}-${i}`, s, h:hs/groups.length, secs:g.slice(), top:g[0],
        t:`${NS>1?s+'과목 ':''}${P20_CIRC[i]||i+1} ${top.join(' · ')}${more}`,
        desc:`${useF?`기출 ${fs}문제`:`문제 ${fs}개`}가 이 ${g.length}개 단원에서 나왔어요${NS>1?` (${s}과목 기출의 ${pct}%)`:` (전체의 ${pct}%)`}. 제일 많이 나온 곳은 ‘${P20S[+g[0]].t}’${useF?` (${fq(g[0])}문제)`:''}예요.`,
        calc:!!EX.calc&&Q.filter(q=>g.includes(String(q.sec))&&P20_CALCRE.test(q.q)).length>=4};
    })};
  });
  return out; })();
const P20_COV=Math.round(SN.reduce((a,s)=>a+P20_SUBJ[s].cov*P20N(s),0)/P20_TOTN*100);
const P20_DIAG={id:'d',h:1,s:0,t:'진단 테스트',type:'diag'}, P20_MOCK={id:'x',h:2,s:0,t:'실전 리허설',type:'mock'};
function p20(){ if(!store.p20) store.p20={st:{},time:0}; return store.p20; }
function p20Order(){ const P=p20(); let o=(P.ord&&P.ord.length===NS)?P.ord.slice():SN.slice(); if(P.first&&o.includes(P.first)) o=[P.first].concat(o.filter(s=>s!==P.first)); return o; }
function p20List(){ return [P20_DIAG].concat(...p20Order().map(s=>P20_SUBJ[s].stages),[P20_MOCK]); }
function p20Find(id){ return p20List().find(x=>x.id===id); }
function inSec(q,k){ return k.slice(0,3)==='all'?q.s===+k.slice(3):String(q.sec)===k; }
function secPool(secs){ const ks=secs.map(String); return Q.filter(q=>!q.ob&&ks.some(k=>inSec(q,k))); }
function p20SecAcc(secs){ let r=0,n=0; secPool(secs).forEach(q=>{const a=store.ans[q.id]; if(a&&a.last){n++; if(a.last==='r') r++;}}); return {r,n,p:n?Math.round(r/n*100):null}; }
function predict(){
  const out={sub:{},c:0,seen:0,pass:false,fail:[]};
  SN.forEach(s=>{
    let secs=Object.keys(P20_SECQ).filter(k=>P20S[+k]&&P20S[+k].s===s); if(!secs.length) secs=['all'+s]; let wsum=0, acc=0;
    secs.forEach(k=>{const w=(P20_FREQ[k]||0)+0.5; let r=0,n=0; secPool([k]).forEach(q=>{const a=store.ans[q.id]; if(a&&a.last){n++; if(a.last==='r') r++;}}); out.seen+=n; acc+=w*(r+1)/(n+2); wsum+=w;});
    const p=wsum?acc/wsum:0.5, c=Math.round(P20N(s)*p);
    out.sub[s]={c,p:Math.round(p*100)}; out.c+=c; if(c<PASSLINE[s]) out.fail.push(s);
  });
  out.score=P20PTS?out.c*(EX.qpt||2):Math.round(out.c/P20_TOTN*100);
  out.need=Math.max(P20_TOT-out.c, out.fail.reduce((a,s)=>a+PASSLINE[s]-out.sub[s].c,0), 0);
  out.pass=out.c>=P20_TOT&&!out.fail.length;
  return out;
}
function p20Done(st){ const r=p20().st[st.id]||{}; return st.type?!!r.done:!!r.pass; }
function p20Next(){ return p20List().find(st=>!p20Done(st)); }
function p20Hours(){ return Math.round(p20List().filter(p20Done).reduce((a,st)=>a+st.h,0)*2)/2; }
function fmtH(sec){ const m=Math.round(sec/60); return m<60?`${m}분`:`${Math.floor(m/60)}시간 ${m%60?m%60+'분':''}`.trim(); }
function hrTxt(h){ const r=Math.round(h*2)/2; return (r%1?r.toFixed(1):r)+'시간'; }
function predHTML(pr,compact){
  return `<div class="pred ${compact?'sm':''}">${SN.map(s=>{const x=pr.sub[s], n=P20N(s), f=x.c<PASSLINE[s], line=NS>1?PASSLINE[s]:P20_TOT;
    return `<div class="pr-row ${f?'f':''}"><span class="pr-l">${NS>1?s+'과목':'예상 정답'} <small>${esc(SUBJ[s])}</small></span><div class="pr-bar"><i style="width:${Math.round(x.c/n*100)}%"></i><em style="left:${line/n*100}%" title="${NS>1?'과락선':'합격선'}"></em><u style="left:${TARGET[s]/n*100}%" title="목표"></u></div><b class="tabnum">${x.c}<small>/${n}</small></b></div>`;}).join('')}
  <div class="pr-sum"><span>예상 ${P20PTS?'점수':'평균'} <b class="tabnum">${pr.score}점</b></span>${pr.pass?'<span class="ok">합격권</span>':`<span class="bad">${pr.fail.length?pr.fail.map(s=>s+'과목').join('·')+' 과락 위험':''}${pr.fail.length&&pr.need?' · ':''}${pr.need?pr.need+'문제 더':''}</span>`}</div></div>`;
}
function p20Weak(){ const o=p20Order(); return NS>1?o[0]:0; }
function p20HomeCard(){
  const nx=p20Next(), hrs=p20Hours(), pr=predict(), P=p20();
  return `<div class="sec"><button class="p20card" id="p20Go"><div class="p20-h"><b>20시간 합격 코스</b><span class="tabnum">${hrs}/20시간</span></div>
  <div class="p20-bar"><i style="width:${Math.min(100,hrs/20*100)}%"></i></div>
  <span class="p20-next">${nx?`다음: ${esc(nx.t)}`:'코스 완주! 실전 리허설을 한 번 더 풀어 보세요'}</span>
  ${pr.seen?predHTML(pr,true):`<span class="p20-sub">${NS>1?'약한 과목 과락부터 막는 순서로 짜요':'자주 나온 시대·주제부터 짜요'} · 진단 테스트로 시작</span>`}
  <span class="p20-cta">${nx?(P.st[nx.id]?'이어서 하기':'시작하기'):'코스 보기'} →</span></button></div>`;
}
function stageCards(st){ if(!st.secs.some(k=>P20S[+k])) return '<p class="hint">이 단계는 요약 카드가 없어요. 바로 기출 드릴로 가요.</p>'; return st.secs.map(k=>{const s=P20S[+k]; if(!s) return '';
  const hot=new Set(s.hot||[]); const star=x=>hot.has(x)?'<span class="star" title="자주 나옴">★</span>':'';
  let b=`<article class="scard"><header><h3>${esc(s.t)}</h3>${P20_FREQ[k]?`<span class="my" style="background:var(--accent-soft);color:var(--ink2)">기출 ${P20_FREQ[k]}문제</span>`:''}</header>`;
  if(s.lead) b+=`<p class="slead">${esc(s.lead)}</p>`;
  if(s.table) b+=`<div class="stbl"><table><thead><tr>${s.table.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>${s.table.r.map(r=>`<tr>${r.map((c,j)=>j?`<td>${esc(c)}</td>`:`<th scope="row">${esc(c)}${star(c)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  if(s.kv&&s.kv.length) b+=`<dl class="skv">${s.kv.map(([a,v])=>`<dt>${esc(a)}${star(a)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>`;
  if((!s.table&&!(s.kv&&s.kv.length))&&s.items) { const its=s.items.slice().sort((a,b)=>(b.f||0)-(a.f||0)).slice(0,10); b+=`<ul class="sraw">${its.map(it=>`<li>${esc(it.t)}${it.f>=3?' <span class="star" title="자주 나옴">★</span>':''}</li>`).join('')}</ul>`; }
  if(s.tip) b+=`<div class="stip"><b>암기</b><span>${esc(s.tip)}</span></div>`;
  return b+'</article>';}).join(''); }
function stageIds(st,kind){
  const pool=secPool(st.secs);
  const ow=q=>isOpenWrong(q.id), un=q=>!store.ans[q.id];
  if(kind==='drill'){ // 기출 먼저: 안 푼 기출 → 틀린 기출 → 안 푼 나머지 → 나머지 (자주 나온 단원일수록 많이)
    const a=shuffle(pool.filter(q=>P20_ISG(q)&&un(q))), b=shuffle(pool.filter(q=>P20_ISG(q)&&ow(q))), c=shuffle(pool.filter(q=>!P20_ISG(q)&&un(q))), d=shuffle(pool.filter(q=>!a.includes(q)&&!b.includes(q)&&!c.includes(q)));
    return a.concat(b,c,d).slice(0,20).map(q=>q.id); }
  if(kind==='check'){ // 통과 체크 10문제: 틀린 것 + 아직 안 본 것 먼저, 단원 고르게
    const by={}; st.secs.forEach(k=>by[k]=shuffle(pool.filter(q=>inSec(q,k))).sort((x,y)=>(ow(y)?2:un(y)?1:0)-(ow(x)?2:un(x)?1:0)));
    const ord=st.secs.slice().sort((a,b)=>(P20_FREQ[b]||0)-(P20_FREQ[a]||0)); const ids=[]; let g=0;
    while(ids.length<10&&g++<200){ for(const k of ord){ const q=by[k].shift(); if(q&&!ids.includes(q.id)) ids.push(q.id); if(ids.length>=10) break; } if(ord.every(k=>!by[k].length)) break; }
    return ids; }
  if(kind==='wrong') return shuffle(pool.filter(ow)).map(q=>q.id);
  return [];
}
function p20Pick(pool,n){ const un=shuffle(pool.filter(q=>!store.ans[q.id])), rest=shuffle(pool.filter(q=>store.ans[q.id])); return un.concat(rest).slice(0,n); }
function diagN(s){ return NS===1?20:Math.max(3,Math.round(20*P20N(s)/P20_TOTN)); }
function diagIds(){ return SN.flatMap(s=>{const all=Q.filter(q=>q.s===s&&!q.ob); let a=p20Pick(all.filter(P20_ISG),diagN(s)); if(a.length<diagN(s)) a=a.concat(p20Pick(all.filter(q=>!a.includes(q)),diagN(s)-a.length)); return a.map(q=>q.id);}); }
function mockIds(){ return SN.flatMap(s=>{const all=Q.filter(q=>q.s===s&&!q.ob); let a=p20Pick(all.filter(P20_ISG),P20N(s)); if(a.length<P20N(s)) a=a.concat(p20Pick(all.filter(q=>!a.includes(q)),P20N(s)-a.length)); return a.map(q=>q.id);}); }
function p20Start(st,kind){
  let ids, opt;
  if(st.type==='diag'){ ids=diagIds(); opt={title:'20시간 코스 · 진단 테스트',ids,instant:true,kind:'drill'}; }
  else if(st.type==='mock'){ ids=mockIds(); opt={title:'20시간 코스 · 실전 리허설',ids,instant:false,cbt:true,limit:(EX.min||60)*60,kind:'exam'}; }
  else { ids=stageIds(st,kind); if(!ids.length) return; opt={title:`20시간 코스 · ${st.t} · ${kind==='check'?'통과 체크':kind==='wrong'?'틀린 것 다시':'기출 드릴'}`,ids,instant:true,kind:kind==='wrong'?'wrong':'drill'}; }
  startGuard(()=>{ startSession(opt); store.cur.p20={st:st.id,k:kind||st.type}; save(); });
}
/* finish()에서 불러요: 결과를 코스 기록에 남기기 */
function p20Record(c,res){
  if(!c.p20) return; const P=p20(), r=P.st[c.p20.st]=P.st[c.p20.st]||{}; const k=c.p20.k;
  const n=res.n||c.ids.length, ok=res.correct; P.time=(P.time||0)+(res.dur||0); r.time=(r.time||0)+(res.dur||0); r.at=Date.now();
  if(k==='drill'){ r.drill=Math.max(r.drill||0,Math.round(ok/n*100)); r.dr=true; }
  if(k==='check'){ const p=Math.round(ok/n*100); r.best=Math.max(r.best||0,p); r.tries=(r.tries||0)+1; if(p>=80) r.pass=true; }
  if(k==='diag'||k==='mock'){ r.done=true; r.score=res.avg; r.ok=res.pass;
    r.okc=SN.map(s=>res.ids.filter(id=>QM[id].s===s&&res.picks[id]===QM[id].a).length); r.nq=SN.map(s=>res.ids.filter(id=>QM[id].s===s).length);
    if(k==='diag'&&NS>1){ const m=s=>(r.okc[s-1]/Math.max(1,r.nq[s-1]))-PASSLINE[s]/P20N(s); P.ord=SN.slice().sort((a,b)=>m(a)-m(b)||a-b); } }
  res.p20={st:c.p20.st,k,p:Math.round(ok/n*100)};
}
let p20Open=null;
function renderP20(){
  const P=p20(), pr=predict(), nx=p20Next(), hrs=p20Hours(), L=p20List();
  if(p20Open==null) p20Open=nx?nx.id:null;
  const strat=NS>1
    ?`${esc(EX.short)}는 <b>${P20_TOTN}문제 중 ${P20_TOT}개</b>만 맞히면 돼요. 단, 과목마다 <b>${SN.map(s=>PASSLINE[s]).join('·')}개</b> 이상 맞혀야 과락이 아니에요. 몇 문제 차이로 떨어지는 건 거의 다 <b>한 과목 과락</b> 때문이라, 제일 약한 과목부터 막고 기출에 자주 나온 단원만 골라(기출의 약 ${P20_COV}%가 여기서 나와요) 20시간에 끝내요. 고른 단원을 80% 맞히면 나머지는 반만 맞혀도 합격선이에요.`
    :`${esc(EX.short)}는 <b>${P20_TOTN}문제 중 ${P20_TOT}개</b>(${Math.round(P20_RATE*100)}%) 이상이 목표예요${EX.key==='kh'?' (심화 1급 = 80점 이상, 60점이면 3급)':''}. 자주 나온 시대·주제만 골라(문제의 약 ${P20_COV}%) 20시간에 끝내요.`;
  const ord=p20Order();
  let h=subTop('20시간 합격 코스')+`<div class="sec"><div class="panel confirm p20top"><b>이번엔 몇 문제 차이로 떨어지지 않게</b>
  <span class="hint">${strat}</span>
  <div class="p20-bar big"><i style="width:${Math.min(100,hrs/20*100)}%"></i></div><span class="hint tabnum">코스 진행 ${hrs}/20시간 · 실제로 푼 시간 ${fmtH(P.time||0)}</span>
  ${NS>1?`<div class="p20weak"><span>제일 약한 과목</span><div class="seg">${SN.map(s=>`<button class="${p20Weak()===s?'on':''}" data-weak="${s}">${s}과목</button>`).join('')}</div></div><span class="hint">${P.first?'고른 과목을 제일 먼저 해요.':P.ord?'진단 결과로 약한 과목 순서를 정했어요. 직접 골라도 돼요.':'진단 테스트를 풀면 약한 과목 순서를 자동으로 정해요. 이미 알면 직접 골라도 돼요.'}</span>`:''}</div></div>
  <div class="sec"><div class="panel confirm"><b>지금 실력이면 몇 점? (합격 예측)</b><span class="hint">${pr.seen?`푼 문제 ${pr.seen}개를 기출 출제 비율로 계산했어요. 빨간 선은 ${NS>1?'과락선':'합격선'}, 점선은 목표예요.`:'아직 푼 문제가 없어서 반반으로 가정했어요. 진단 테스트를 풀면 내 실력으로 바뀌어요.'}</span>${predHTML(pr)}</div></div>
  <div class="sec"><ol class="p20list">${L.map((st,i)=>{const r=P.st[st.id]||{}, done=p20Done(st), open=p20Open===st.id, cur=nx&&nx.id===st.id;
    const acc=st.secs?p20SecAcc(st.secs):null;
    const res=r.okc?`${r.nq.reduce((a,x)=>a+x,0)}문제 중 ${r.okc.reduce((a,x)=>a+x,0)}개 정답${NS>1?' · '+r.okc.map((x,j)=>`${j+1}과목 ${x}/${r.nq[j]}`).join(' · '):''}`:'';
    let meta=st.type==='diag'?(r.done?res:`약 1시간 · ${SN.map(diagN).reduce((a,b)=>a+b,0)}문제`):st.type==='mock'?(r.done?`${res} ${r.ok?'· 합격선 통과':'· 한 번 더'}`:`약 2시간 · ${EX.min||60}분 타이머`):`약 ${hrTxt(st.h)} · 단원 ${st.secs.length}개${acc&&acc.n?` · 정답률 ${acc.p}%`:''}${r.best!=null?` · 체크 최고 ${r.best}%`:''}`;
    let body='';
    if(open){
      if(st.type==='diag'){ body+=`<p class="p20-desc">기출 ${SN.map(diagN).reduce((a,b)=>a+b,0)}문제로 지금 실력을 재요${NS>1?` (${SN.map(s=>`${s}과목 ${diagN(s)}`).join(' · ')})`:''}. 틀려도 괜찮아요, 코스가 약한 곳부터 보여 줘요.</p><div class="row"><button class="btn" data-p20="${st.id}" data-k="diag">${r.done?'다시 진단하기':'진단 테스트 시작'}</button></div>`; }
      else if(st.type==='mock'){ body+=`<p class="p20-desc">${P20_TOTN}문제 ${EX.min||60}분, 진짜 시험처럼 CBT 시험지로 풀어요. ${NS>1?'과락 없이 ':''}${P20_TOT}개 이상이면 시험 볼 준비 끝.</p><div class="row"><button class="btn" data-p20="${st.id}" data-k="mock">${r.done?'리허설 한 번 더 (새 문제)':`실전 리허설 시작`}</button></div><p class="hint">기출 중 안 푼 것부터 과목 비율대로 뽑아요.</p>`; }
      else {
        const pool=secPool(st.secs), wr=pool.filter(q=>isOpenWrong(q.id)).length;
        body+=`<p class="p20-desc">${esc(st.desc)}</p><div class="p20steps"><div class="${r.cards?'ok':''}"><span>1</span><b>핵심 카드</b><small>${st.secs.length}장 · 15~30분</small></div><div class="${r.dr?'ok':''}"><span>2</span><b>기출 드릴</b><small>${Math.min(20,pool.length)}문제 · 바로 채점</small></div><div class="${r.pass?'ok':''}"><span>3</span><b>통과 체크</b><small>10문제 · 8개↑ 통과</small></div></div>
        <div class="row p20btns"><button class="btn ghost" data-p20="${st.id}" data-k="cards">① 핵심 카드</button><button class="btn ${r.dr?'ghost':''}" data-p20="${st.id}" data-k="drill">② 기출 드릴</button><button class="btn ${r.dr&&!r.pass?'':'ghost'}" data-p20="${st.id}" data-k="check">③ 통과 체크</button></div>
        ${wr?`<div class="row"><button class="btn bad" data-p20="${st.id}" data-k="wrong">이 단계 틀린 ${wr}문제 다시</button></div>`:''}
        ${st.calc?`<a class="calcgo" href="${EX.calc.url}"><b>계산 특훈</b><span>${esc(EX.calc.d)}</span><i aria-hidden="true">→</i></a>`:''}
        ${r.tries&&!r.pass?`<p class="hint">통과 체크는 문제가 매번 바뀌어요. 틀린 것 다시 → 핵심 카드 한 번 더 → 다시 체크하면 금방 넘어가요.</p>`:''}`;
      }
    }
    return `<li class="p20st ${done?'done':''} ${cur?'cur':''} ${open?'open':''}"><button class="p20-head" data-open="${st.id}"><span class="dot">${done?'✓':i+1}</span><span class="p20-t"><b>${esc(st.t)}</b><small>${meta}</small></span>${st.s&&NS>1?`<span class="chip s${st.s}">${st.s}과목</span>`:'<span></span>'}</button>${open?`<div class="p20-body">${body}</div>`:''}</li>`;}).join('')}</ol>
  ${(()=>{const sk=SN.flatMap(s=>P20_SUBJ[s].skip.filter(k=>P20_FREQ[k]||!P20_SUBJ[s].useF).map(k=>P20S[+k].t)); return sk.length?`<details class="p20skip"><summary>코스에서 뺀 단원 ${sk.length}개 (기출에 거의 안 나와요)</summary><p class="hint">${sk.map(esc).join(' · ')}</p><p class="hint">시간이 남으면 요약에서 한 번만 훑어보세요.</p></details>`:'';})()}</div>`;
  const P20LOCK=!!(window.PM_SHELL&&window.PM_SHELL.guest&&window.PM_SHELL.guest());
  if(view.cards&&P20LOCK){ h=subTop(`핵심 카드`)+`<div class="sec"><div class="panel confirm"><b>게스트는 핵심 카드를 볼 수 없어요</b><span class="hint">회원가입하면 바로 열려요. 기출 드릴·통과 체크는 게스트도 할 수 있어요.</span><div class="row"><button class="btn ghost" id="p20Back">코스로</button></div></div></div>`; }
  else if(view.cards){ const st=p20Find(view.cards); h=subTop(`핵심 카드`)+`<div class="sec"><div class="panel confirm"><b>${esc(st.t)}</b><span class="hint">시험에 나오는 것만 모았어요. 다 읽었으면 아래 버튼으로 바로 기출 드릴을 풀어요.</span></div></div><div class="sec scards">${stageCards(st)}</div><div class="sec"><div class="row"><button class="btn" data-p20="${st.id}" data-k="drill">다 읽었어요 → 기출 드릴</button><button class="btn ghost" id="p20Back">코스로</button></div></div>`; }
  app.innerHTML=h; bindBack();
  if(view.cards){ const go=()=>{view={type:'p20'};render();window.scrollTo(0,0);}; const b=$('#vBack'); if(b) b.onclick=go; const pb=$('#p20Back'); if(pb) pb.onclick=go; }
  app.querySelectorAll('[data-weak]').forEach(b=>b.onclick=()=>{const s=+b.dataset.weak; P.first=P.first===s?null:s; save(); const y=window.scrollY; renderP20(); window.scrollTo(0,y);});
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>{p20Open=p20Open===b.dataset.open?'':b.dataset.open;const y=window.scrollY;renderP20();window.scrollTo(0,y);});
  app.querySelectorAll('[data-p20]').forEach(b=>b.onclick=()=>{const st=p20Find(b.dataset.p20), k=b.dataset.k; if(!st) return;
    if(k==='cards'){ const r=P.st[st.id]=P.st[st.id]||{}; r.cards=true; save(); view={type:'p20',cards:st.id}; render(); window.scrollTo(0,0); return; }
    p20Start(st,k);});
}
function p20ResultBanner(res){
  if(!res.p20) return ''; const st=p20Find(res.p20.st); if(!st) return ''; const r=p20().st[st.id]||{}; const k=res.p20.k;
  let msg='';
  if(k==='check') msg=r.pass&&res.p20.p>=80?`통과! ${esc(st.t)} 끝. 다음 단계로 가요.`:`${res.p20.p}% — 8개 이상이면 통과예요. 틀린 것만 다시 보고 한 번 더!`;
  else if(k==='drill') msg=`기출 드릴 ${res.p20.p}% · 이제 통과 체크(10문제)로 확인해요.`;
  else if(k==='diag') msg=NS>1&&p20().ord?`진단 끝! 제일 약한 ${p20Order()[0]}과목부터 하도록 코스 순서를 바꿨어요.`:'진단 끝! 코스 화면에 내 예상 점수가 나왔어요.';
  else if(k==='mock') msg=res.pass?'리허설 합격선 통과! 이대로 시험 보러 가요.':'아직 합격선 아래예요. 코스에서 정답률 낮은 단계를 다시 보세요.';
  else msg='코스 기록에 저장했어요.';
  return `<div class="sec"><div class="panel p20res"><b>20시간 합격 코스</b><span>${msg}</span><button class="btn" id="rP20">코스로 돌아가기 →</button></div></div>`;
}

function menuGrid(){
  const M=[['subj','과목별 풀이','drillSec'],['rand','랜덤 모의고사','randSec'],['custom','맞춤학습','v:custom'],['today','오늘의 문제','v:today'],['flash','플래시 카드','v:flash'],
           ['notes','오답노트','t:notes'],['saved','저장한 문제','v:saved'],['search','문제 검색','v:search'],['score','시험 성적','t:rec'],['chart','학습 분석','v:analysis']];
  return `<div class="mgrid">${M.map(([k,l,go])=>`<button data-go="${go}">${ico(k)}<span>${l}</span></button>`).join('')}</div>${G.length?`<button type="button" class="calcgo glgo" data-go="v:gloss"><b>용어 사전</b><span>모르는 말 ${G.length}개 풀이 · 문제·해설 속 밑줄 친 말을 누르면 바로 뜻</span><i aria-hidden="true">→</i></button>`:''}${EX.calc?`<a class="calcgo" href="${EX.calc.url}"><b>계산 특훈</b><span>${esc(EX.calc.d)}</span><i aria-hidden="true">→</i></a>`:''}`;
}
function bindMenu(){
  app.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{const g=b.dataset.go;
    if(g.startsWith('v:')) return openView(g.slice(2));
    if(g.startsWith('t:')){tab=g.slice(2);view=null;render();window.scrollTo(0,0);return;}
    const el=document.getElementById(g); if(el) window.scrollTo(0,el.getBoundingClientRect().top+window.scrollY-10);});
}
/* 진행 중인 회차 */
function setProgress(s){const ids=Q.filter(q=>q.set===s).map(q=>q.id); const done=ids.filter(id=>store.ans[id]).length; const times=store.hist.filter(h=>h.title===s).length; return {n:ids.length,done,times,p:ids.length?Math.round(done/ids.length*100):0};}
function ring(p,sz){sz=sz||44;const r=sz/2-4,c=2*Math.PI*r;return `<svg class="ring" width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}" aria-label="${p}%"><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="4"/><circle cx="${sz/2}" cy="${sz/2}" r="${r}" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${c*p/100} ${c}" transform="rotate(-90 ${sz/2} ${sz/2})"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="${sz*0.26}" font-weight="700" fill="var(--ink)">${p}%</text></svg>`;}
function progressBlock(){
  const act={}; Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id]; if(q) act[q.set]=Math.max(act[q.set]||0,r.t||0);});
  const L=Object.keys(act).filter(s=>{const p=setProgress(s);return p.done>0&&!(EX.hide&&EX.hide(s));}).sort((a,b)=>act[b]-act[a]).slice(0,8);
  if(!L.length) return '';
  return `<div class="sec"><div class="sech"><h2>${esc(EX.progLabel||'진행 중인 회차별 기출')}</h2></div><div class="pcards">${L.map(s=>{const p=setProgress(s);return `<div class="pcard"><div class="ph"><div><b>${esc(SL(s))}</b><span class="pm">${p.times?`${p.times}회 완료 · `:''}푼 문제 ${p.done} / 전체 ${p.n}</span>${(()=>{const h=store.hist.find(x=>x.title===s);return h?`<span class="pm">최근 ${h.avg}점${h.kind==='practice'?' (연습)':''} · ${PL(h)}</span>`:'';})()}</div>${ring(p.p)}</div><div class="row2"><button class="iconbtn" data-pset="${esc(s)}" data-m="practice">연습모드</button><button class="iconbtn" data-pset="${esc(s)}" data-m="exam">시험모드</button></div></div>`;}).join('')}</div></div>`;
}
function bindProgress(){
  app.querySelectorAll('[data-pset]').forEach(b=>b.onclick=()=>{const s=b.dataset.pset;const all=Q.filter(q=>q.set===s).sort((a,b)=>a.n-b.n);
    if(b.dataset.m==='practice'){const ids=all.filter(q=>!store.ans[q.id]).concat(all.filter(q=>store.ans[q.id])).map(q=>q.id); startGuard(()=>startExam({title:s,ids},true));}
    else startGuard(()=>startExam({title:s,ids:all.map(q=>q.id)}));});
}
/* 오늘의 문제 */
function seedRand(str){let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return()=>{h^=h<<13;h^=h>>>17;h^=h<<5;return ((h>>>0)%100000)/100000;};}
const TODAY_N=5;
function todaySet(){ // 하루 5문제 · 과목별로 고르게 (안 풀어 본 문제 먼저)
  const d=dayKey(); if(store.today&&store.today.d===d&&store.today.v===2) return store.today;
  const rnd=seedRand(EX.key+d+(store.pref&&store.pref.seed||'')); const sh=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
  const bySub={}; SN.forEach(s=>{const pool=Q.filter(q=>!q.ob&&q.s===s); bySub[s]=sh(pool.filter(q=>!store.ans[q.id])).concat(sh(pool.filter(q=>store.ans[q.id])));});
  const start=Math.floor(rnd()*NS); const ids=[]; let k=0, guard=0;
  while(ids.length<TODAY_N&&guard++<500){const s=SN[(start+k)%NS]; k++; const nx=bySub[s].shift(); if(nx&&!ids.includes(nx.id)) ids.push(nx.id); if(SN.every(x=>!bySub[x].length)) break;}
  store.today={d,ids,v:2,kept:false}; save(); return store.today;
}
function renderToday(){
  const SH=window.PM_SHELL||{};
  if(SH.attended&&!SH.attended()){
    const g=SH.guest&&SH.guest();
    app.innerHTML=subTop('오늘의 문제')+`<div class="sec"><div class="panel confirm today-lock"><div class="tl-ic" aria-hidden="true">🍀</div><b>출석 체크하면 오늘의 문제 ${TODAY_N}개가 열려요</b><span class="hint">${g?'게스트는 출석할 수 없어요. 회원가입하면 매일 출석하고 클로버 이파리를 모을 수 있어요.':'출석할 때마다 클로버 이파리 1장을 받아요. 이파리 4장이 모이면 네잎클로버가 돼요.'}</span>${g?'':`<button class="btn" id="tAtt">출석 체크하고 열기</button>`}</div></div>`;
    bindBack(); const a=$('#tAtt'); if(a) a.onclick=()=>{SH.attend(); renderToday();};
    return;
  }
  const T=todaySet(); const did=id=>{const r=store.ans[id];return r&&r.t&&dayKey(r.t)===T.d&&!r.kept;};
  const done=T.ids.filter(did); const ok=done.filter(id=>store.ans[id].last==='r').length; const left=T.ids.length-done.length;
  const cv=SH.clover?SH.clover():{four:0,part:0};
  let h=subTop('오늘의 문제')+`<div class="sec"><div class="panel confirm"><b>${T.d.slice(5).replace('-','월 ')}일 · ${T.ids.length}문제</b><span class="hint">출석한 날에만 열려요. 과목별로 고르게 골랐어요. <b>오늘 안 푼 문제는 내일 사라져요.</b></span>
  <div class="tstats"><div><b>${done.length}/${T.ids.length}</b><span>오늘 푼 문제</span></div><div><b>${ok}</b><span>맞힌 문제</span></div><div><b>${streak()}일</b><span>연속 공부</span></div></div>
  <button class="btn" id="tGo">${!left?'다시 풀기':done.length?'이어서 풀기':'오늘의 문제 풀기'}</button></div></div>
  <div class="sec"><div class="panel today-keep"><div class="row"><b>🍀 네잎클로버로 보관하기</b><span class="clv-mini">🍀 ${cv.four}개 · 이파리 ${cv.part}/4</span></div>
  <span class="hint">${T.kept?'오늘 문제를 보관했어요. [저장한 문제]에서 언제든 다시 풀 수 있고, 안 푼 문제는 오답노트에도 들어갔어요.':`네잎클로버 1개를 쓰면 오늘 ${T.ids.length}문제를 풀지 않아도 [저장한 문제]에 보관하고, 안 푼 문제는 오답노트에도 넣어 둬요.`}</span>
  ${T.kept?'':`<button class="btn ghost" id="tKeep"${cv.four?'':' disabled'}>${cv.four?'네잎클로버 1개로 보관':'네잎클로버가 없어요 (이파리 4장 필요)'}</button>`}</div></div>
  <div class="sec">${T.ids.map(id=>{const q=QM[id];const r=store.ans[id];const dd=did(id);return `<div class="qrow"><span class="no">${dd?(r.last==='r'?'<b class="ok">○</b>':'<b class="no">✕</b>'):(r&&r.kept?'🍀':'·')}</span><span class="tx">${esc(q.q)}</span><span class="cnt">${NS>1?q.s+'과목':''}</span></div>`;}).join('')}</div>`;
  app.innerHTML=h; bindBack();
  $('#tGo').onclick=()=>{const ids=!left?T.ids:T.ids.filter(id=>!done.includes(id)); startGuard(()=>startSession({title:'오늘의 문제',ids,instant:true,kind:'drill'}));};
  const kp=$('#tKeep'); if(kp) kp.onclick=()=>confirmBox(`네잎클로버 1개를 써서 오늘 ${T.ids.length}문제를 보관할까요?`,()=>{
    if(!SH.spendFour||!SH.spendFour()) return renderToday();
    const now=Date.now(); store.saved=store.saved||{};
    T.ids.forEach(id=>{store.saved[id]=store.saved[id]||now; if(!store.ans[id]) store.ans[id]={w:1,r:0,last:'w',kept:1,t:now};});
    T.kept=true; save(); renderToday();
  });
}
/* 저장한 문제 */
function renderSaved(){
  const ids=Object.keys(store.saved||{}).filter(id=>QM[id]).sort((a,b)=>store.saved[b]-store.saved[a]);
  let h=subTop('저장한 문제')+`<div class="sec"><p class="hint">문제 화면·벼락치기·오답노트에서 ‘저장’을 누른 문제가 모여요.</p>${ids.length?`<button class="btn" id="svGo">저장한 ${ids.length}문제 풀기</button>`:''}</div>
  <div class="sec">${ids.map(id=>cramCard(QM[id])).join('')||'<div class="empty">아직 저장한 문제가 없어요.</div>'}</div>`;
  app.innerHTML=h; bindBack(); bindMore();
  const g=$('#svGo'); if(g) g.onclick=()=>startGuard(()=>startSession({title:'저장한 문제',ids:shuffle(ids),instant:true,kind:'drill'}));
}
/* 문제 검색 */
let srchQ='', srchS=0;
function renderSearch(){
  const ql=srchQ.trim().toLowerCase();
  const L=ql.length<2?[]:Q.filter(q=>(!srchS||q.s===srchS)&&(q.q+' '+q.o.join(' ')+' '+(q.e||'')+' '+SL(q.set)).toLowerCase().includes(ql));
  let h=subTop('문제 검색')+`<div class="sec"><input class="search" id="srQ" type="search" placeholder="${esc(EX.qSearch||'두 글자 이상 (예: 정규화, VLOOKUP, 철근)')}" value="${esc(srchQ)}">
  <div class="seg" id="srS">${[0,...SN].map(s=>`<button data-v="${s}" class="${srchS===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  ${ql.length>=2?`<div class="cramcount"><span>${L.length}문제 찾음${L.length>40?' · 앞 40개만 보여요':''}</span>${L.length?`<button class="iconbtn" id="srGo">찾은 문제 풀기</button>`:''}</div>`:'<p class="hint">문제·보기·해설에서 찾아요.</p>'}</div>
  <div class="sec">${L.slice(0,40).map(cramCard).join('')}</div>`;
  app.innerHTML=h; bindBack(); bindMore();
  if(ql){const rx=new RegExp(ql.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'); app.querySelectorAll('.scards,.sec .cramcard .q,.sec .cramcard .tx,.sec .cramcard .tx2').forEach(el=>{if(el.children.length===0) el.innerHTML=el.innerHTML.replace(rx,m=>`<span class="hl">${m}</span>`);});}
  const qi=$('#srQ'); qi.oninput=()=>{srchQ=qi.value;const pos=qi.selectionStart;renderSearch();const n=$('#srQ');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
  app.querySelectorAll('#srS button').forEach(b=>b.onclick=()=>{srchS=+b.dataset.v;renderSearch();});
  const g=$('#srGo'); if(g) g.onclick=()=>startGuard(()=>startSession({title:`검색: ${srchQ}`,ids:shuffle(L.map(q=>q.id)).slice(0,60),instant:true,kind:'drill'}));
}
/* 취약점 분석 · 맞춤학습 */
function subjAcc(){const a={};SN.forEach(s=>a[s]=[0,0]); (store.log||[]).slice(-100).forEach(([id,ok])=>{const q=QM[id]; if(q){a[q.s][1]++; if(ok)a[q.s][0]++;}}); return a;}
function secAcc(){const a={}; Object.entries(store.ans).forEach(([id,r])=>{const q=QM[id]; if(!q||q.sec==null) return; const v=a[q.sec]||[0,0]; v[0]+=r.r; v[1]+=r.r+r.w; a[q.sec]=v;}); return a;}
function radar(vals,labels,sz){
  sz=sz||260; const cx=sz/2, cy=sz/2+6, R=sz*0.32, n=vals.length; const pt=(i,f)=>{const a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*R*f, cy+Math.sin(a)*R*f];};
  let g=''; [0.25,0.5,0.75,1].forEach(f=>{g+=`<polygon points="${vals.map((_,i)=>pt(i,f).join(',')).join(' ')}" fill="none" stroke="var(--line)" stroke-width="1"/>`;});
  vals.forEach((_,i)=>{const [x,y]=pt(i,1);g+=`<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="var(--line)"/>`;});
  g+=`<polygon points="${vals.map((v,i)=>pt(i,Math.max(.03,v/100)).join(',')).join(' ')}" fill="var(--ink)" fill-opacity=".14" stroke="var(--ink)" stroke-width="2"/>`;
  vals.forEach((v,i)=>{const [x,y]=pt(i,Math.max(.03,v/100));g+=`<circle cx="${x}" cy="${y}" r="3.5" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"/>`;});
  labels.forEach((l,i)=>{const [x,y]=pt(i,1.28);g+=`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="11.5" fill="var(--ink2)">${esc(l)}</text><text x="${x}" y="${y+14}" text-anchor="middle" font-size="11" font-weight="700" fill="var(--ink)">${vals[i]}%</text>`;});
  return `<svg class="radar" viewBox="-50 -6 ${sz+100} ${sz+24}" role="img" aria-label="과목별 정답률">${g}</svg>`;
}
function weakTopics(){const A=secAcc(); return Object.entries(A).filter(([k,v])=>v[1]>=2&&S[k]).map(([k,v])=>({k:+k,p:Math.round(v[0]/v[1]*100),n:v[1]})).sort((a,b)=>a.p-b.p||b.n-a.n);}
function renderCustom(){
  const sa=subjAcc(); const tot=SN.reduce((a,s)=>a+sa[s][1],0);
  const vals=SN.map(s=>sa[s][1]?Math.round(sa[s][0]/sa[s][1]*100):0);
  const wt=weakTopics().filter(w=>w.p<80).slice(0,4);
  store.road=store.road||{};
  let steps=wt.length?wt:SN.map(s=>({s,p:vals[s-1]})).sort((a,b)=>a.p-b.p).slice(0,4).map(x=>({subj:x.s,p:x.p}));
  let h=subTop('맞춤학습')+`<div class="sec"><div class="panel confirm"><b>취약점 분석</b><span class="hint">${tot?`최근 푼 ${tot}문제 기준 과목별 정답률이에요.`:'아직 푼 문제가 없어요. 문제를 풀면 과목별 정답률이 그려져요.'}</span>${radar(vals,SN.map(s=>SUBJ[s]))}</div></div>
  <div class="sec"><div class="panel confirm"><b>학습 로드맵</b><span class="hint">${wt.length?'정답률이 낮은 주제부터 차례로 10문제씩 풀어요. 70% 이상 맞히면 체크돼요.':'주제별 기록이 쌓이기 전이라 정답률 낮은 과목부터 시작해요.'}</span>
  <ol class="road">${steps.map((w,i)=>{const key=w.k!=null?'s'+w.k:'p'+w.subj; const done=store.road[key]; const name=w.k!=null?S[w.k].t:`${w.subj}과목 ${SUBJ[w.subj]}`;return `<li class="${done?'done':''}"><span class="dot">${done?'✓':i+1}</span><div><b>${esc(name)}</b><span>${w.k!=null?`${SUBJ[S[w.k].s]} · 내 정답률 ${w.p}%`:`정답률 ${w.p}%`}</span></div><button class="iconbtn" data-road="${key}">${done?'다시':'10문제'}</button></li>`;}).join('')}</ol></div></div>`;
  app.innerHTML=h; bindBack();
  app.querySelectorAll('[data-road]').forEach(b=>b.onclick=()=>{const key=b.dataset.road; const pool=key[0]==='s'?Q.filter(q=>q.sec===+key.slice(1)&&!q.ob):Q.filter(q=>q.s===+key.slice(1)&&!q.ob);
    const wr=shuffle(pool.filter(q=>isOpenWrong(q.id))), un=shuffle(pool.filter(q=>!store.ans[q.id])), rest=shuffle(pool.filter(q=>store.ans[q.id]&&!isOpenWrong(q.id)));
    const ids=wr.concat(un,rest).slice(0,10).map(q=>q.id); startGuard(()=>startSession({title:'맞춤학습',ids,instant:true,kind:'drill',road:key}));});
}
/* 학습 분석 차트 */
function anaCharts(){
  const D=store.day||{}; const keys=Object.keys(D).sort().slice(-10);
  if(!keys.length) return `<div class="empty">문제를 풀면 날짜별 정답률과 푼 문제 수가 그려져요.</div>`;
  const W=320,H=150,pl=30,pr=10,pt=12,pb=28, iw=W-pl-pr, ih=H-pt-pb, n=keys.length, x=i=>pl+(n===1?iw/2:i*iw/(n-1));
  const lbl=keys.map(k=>k.slice(5).replace('-','/'));
  const acc=keys.map(k=>{const v=D[k];return Math.round(v[0]/(v[0]+v[1])*100);});
  const y1=v=>pt+ih-(v/100)*ih;
  let a=`<svg viewBox="0 0 ${W} ${H}" class="achart" role="img" aria-label="날짜별 정답률">`;
  [0,20,40,60,80,100].forEach(v=>{a+=`<line x1="${pl}" x2="${W-pr}" y1="${y1(v)}" y2="${y1(v)}" stroke="var(--line)" stroke-width="${v===60?1.4:.8}" ${v===60?'stroke-dasharray="4 3"':''}/><text x="${pl-6}" y="${y1(v)}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="var(--ink3)">${v}</text>`;});
  a+=`<polyline points="${acc.map((v,i)=>x(i)+','+y1(v)).join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2"/>`;
  acc.forEach((v,i)=>{a+=`<circle cx="${x(i)}" cy="${y1(v)}" r="3.2" fill="var(--paper)" stroke="var(--ink)" stroke-width="2"><title>${lbl[i]} ${v}%</title></circle>`;});
  lbl.forEach((l,i)=>{a+=`<text x="${x(i)}" y="${H-10}" font-size="9" text-anchor="middle" fill="var(--ink3)">${l}</text>`;}); a+='</svg>';
  const mx=Math.max(...keys.map(k=>D[k][0]+D[k][1])); const top=Math.max(10,Math.ceil(mx/10)*10); const y2=v=>pt+ih-(v/top)*ih; const bw=Math.min(22,iw/n*0.55);
  let b=`<svg viewBox="0 0 ${W} ${H}" class="achart" role="img" aria-label="날짜별 푼 문제 수">`;
  [0,.25,.5,.75,1].forEach(f=>{const v=Math.round(top*f);b+=`<line x1="${pl}" x2="${W-pr}" y1="${y2(v)}" y2="${y2(v)}" stroke="var(--line)" stroke-width=".8"/><text x="${pl-6}" y="${y2(v)}" font-size="9" text-anchor="end" dominant-baseline="middle" fill="var(--ink3)">${v}</text>`;});
  keys.forEach((k,i)=>{const [r,w]=D[k];const cx=x(i);b+=`<rect x="${cx-bw/2}" y="${y2(r+w)}" width="${bw}" height="${y2(0)-y2(w)}" fill="var(--bad)" opacity=".55"><title>${lbl[i]} 틀림 ${w}</title></rect><rect x="${cx-bw/2}" y="${y2(r)}" width="${bw}" height="${y2(0)-y2(r)}" fill="var(--ok)" opacity=".8"><title>${lbl[i]} 맞음 ${r}</title></rect><text x="${cx}" y="${y2(r+w)-4}" font-size="9" text-anchor="middle" fill="var(--ink2)">${r+w}</text>`;});
  lbl.forEach((l,i)=>{b+=`<text x="${x(i)}" y="${H-10}" font-size="9" text-anchor="middle" fill="var(--ink3)">${l}</text>`;}); b+='</svg>';
  const T=keys.reduce((s,k)=>[s[0]+D[k][0],s[1]+D[k][1]],[0,0]); const all=Object.values(D).reduce((s,v)=>[s[0]+v[0],s[1]+v[1]],[0,0]);
  return `<div class="tstats"><div><b>${all[0]+all[1]}</b><span>전체 푼 문제</span></div><div><b>${all[0]+all[1]?Math.round(all[0]/(all[0]+all[1])*100):0}%</b><span>전체 정답률</span></div><div><b>${Object.keys(D).length}일</b><span>공부한 날</span></div><div><b>${streak()}일</b><span>연속</span></div></div>
  <div class="panel"><div class="chd"><b>정답률</b><span>점선 60%</span></div>${a}</div>
  <div class="panel"><div class="chd"><b>푼 문제 수</b><span><i class="lg ok"></i>맞음 <i class="lg no"></i>틀림</span></div>${b}<p class="hint">* 공부한 날 기준, 최근 10일</p></div>`;
}
/* 플래시 카드 */
let fl=null;
function flashDeck(subj,hot){
  const D=[];
  S.forEach((s,i)=>{ if(subj&&s.s!==subj) return; const H=new Set(s.hot||[]);
    const push=(f,b,isHot)=>{ if(hot&&!isHot) return; D.push({f,b,t:s.t,s:s.s,i}); };
    if(s.table) s.table.r.forEach(r=>push(r[0],s.table.h.slice(1).map((h,j)=>`${h}: ${r[j+1]}`).join('\n'),H.has(r[0])));
    if(s.kv) s.kv.forEach(([k,v])=>push(k,v,H.has(k)));
    if(!s.table&&!s.kv) s.items.forEach(it=>{const m=it.t.match(/^(.{2,28}?)\s*(?::|=|：|→)\s*(.+)$/); if(m) push(m[1],m[2],it.f>=3); else push(s.t+' — 빈칸 채우기',it.t,it.f>=3);});
  });
  return D;
}
/* 용어 사전 화면 */
let glQ='', glS=0, glMine=false, glShown=60, glCard=null;
function glList(){ const ql=glQ.trim().toLowerCase();
  let L=G.map((g,i)=>({g,i})).filter(({g})=>(!glS||g.s===glS)&&(!glMine||store.gs&&store.gs[gKey(g)]));
  if(ql) L=L.filter(({g})=>[g.w,g.en||'',...(g.k||[]),g.d,g.x||''].join(' ').toLowerCase().includes(ql));
  return L.sort((a,b)=>a.g.w.localeCompare(b.g.w,'ko')); }
function renderGloss(){
  const L=glList(); const subs=[...new Set(G.map(g=>g.s).filter(Boolean))].sort();
  let h=subTop('용어 사전')+`<div class="sec"><p class="hint">처음 보는 말을 쉬운 말로 풀었어요. 문제·해설·요약본에서 <span class="gterm" style="pointer-events:none">밑줄 친 말</span>을 누르면 여기 뜻이 바로 떠요.</p>
  <input class="search" id="glQ" type="search" placeholder="용어 찾기 (뜻으로도 찾아져요)" value="${esc(glQ)}">
  ${NS>1&&subs.length>1?`<div class="seg" id="glS">${[0,...SN].map(s=>`<button data-v="${s}" class="${glS===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>`:''}
  <div class="row gltools"><button class="tog ${glMine?'on':''}" id="glMine">★ 외울 용어만 (${Object.keys(store.gs||{}).length})</button><button class="tog" id="glCardT">카드로 외우기</button></div>
  <div class="cramcount"><span>${L.length}개</span></div></div>`;
  if(glCard){ const d=glCard; const cur=d.deck[d.i];
    if(!cur){ h+=`<div class="sec"><div class="panel confirm"><b>${d.deck.length}개 다 봤어요</b><span class="hint">알아요 ${d.ok} · 다시 볼래요 ${d.no}</span><div class="row"><button class="btn" id="glAgain">${d.miss.length?`모르는 ${d.miss.length}개만 다시`:'처음부터 다시'}</button><button class="btn ghost" id="glEnd">목록으로</button></div></div></div>`; }
    else { const g=G[cur]; h+=`<div class="sec"><div class="flipbar"><span>카드를 누르면 뜻이 보여요</span><span class="tabnum">${d.i+1} / ${d.deck.length}</span></div>
      <button type="button" class="glflip ${d.flip?'on':''}" id="glFlip">${d.flip?gCard(g,cur):`<b>${esc(g.w)}</b>${g.en?`<span class="gen">${esc(g.en)}</span>`:''}<span class="hint">무슨 뜻일까요?</span>`}</button>
      <div class="row glbtns"><button class="btn ghost" id="glNo">다시 볼래요</button><button class="btn" id="glOk">알아요</button></div><button class="btn ghost" id="glEnd">카드 그만 보기</button></div>`; }
  } else {
    h+=`<div class="sec gl">${L.slice(0,glShown).map(({g,i})=>{const n=gQs(g).length; return `<div class="glitem">${gCard(g,i)}<div class="glact"><button class="iconbtn ${gSaved(i)?'on':''}" data-gs="${i}">${gSaved(i)?'★ 외울 용어':'☆ 외울 용어'}</button>${n?`<button class="iconbtn" data-gq="${i}">관련 문제 ${n}개 풀기</button>`:''}</div></div>`;}).join('')||'<div class="empty">찾는 용어가 없어요.</div>'}
    ${L.length>glShown?`<button class="btn ghost" id="glMore">더 보기 (${L.length-glShown}개 남음)</button>`:''}</div>`;
  }
  app.innerHTML=h; bindBack();
  const qi=$('#glQ'); qi.oninput=()=>{glQ=qi.value;glShown=60;const pos=qi.selectionStart;renderGloss();const n=$('#glQ');n.focus();try{n.setSelectionRange(pos,pos);}catch(e){}};
  app.querySelectorAll('#glS button').forEach(b=>b.onclick=()=>{glS=+b.dataset.v;glShown=60;glCard=null;renderGloss();});
  $('#glMine').onclick=()=>{glMine=!glMine;glShown=60;glCard=null;renderGloss();};
  $('#glCardT').onclick=()=>{const deck=shuffle(L.map(x=>x.i)); if(!deck.length) return; glCard={deck,i:0,flip:false,ok:0,no:0,miss:[]}; renderGloss(); window.scrollTo(0,0);};
  const mo=$('#glMore'); if(mo) mo.onclick=()=>{glShown+=60;const y=window.scrollY;renderGloss();window.scrollTo(0,y);};
  app.querySelectorAll('[data-gs]').forEach(b=>b.onclick=()=>{gToggle(+b.dataset.gs);const y=window.scrollY;renderGloss();window.scrollTo(0,y);});
  app.querySelectorAll('[data-gq]').forEach(b=>b.onclick=()=>gDrill(G[+b.dataset.gq]));
  const d=glCard;
  if(d){ const fl=$('#glFlip'); if(fl) fl.onclick=()=>{d.flip=!d.flip;renderGloss();};
    const nx=ok=>{const cur=d.deck[d.i]; if(ok)d.ok++; else {d.no++; d.miss.push(cur);} d.i++; d.flip=false; renderGloss();};
    const o=$('#glOk'); if(o) o.onclick=()=>nx(true); const n=$('#glNo'); if(n) n.onclick=()=>nx(false);
    const a=$('#glAgain'); if(a) a.onclick=()=>{const deck=d.miss.length?shuffle(d.miss):shuffle(d.deck); glCard={deck,i:0,flip:false,ok:0,no:0,miss:[]}; renderGloss();};
    app.querySelectorAll('#glEnd').forEach(b=>b.onclick=()=>{glCard=null;renderGloss();}); }
}
function renderFlash(){
  if(!fl||fl.ex!==EX.key){fl={ex:EX.key,subj:0,hot:false,deck:null,i:0,ok:0,no:0,miss:[],flip:false};}
  if(!fl.deck){fl.deck=shuffle(flashDeck(fl.subj,fl.hot));fl.i=0;fl.ok=0;fl.no=0;fl.miss=[];fl.flip=false;}
  const N=fl.deck.length, c=fl.deck[fl.i];
  let h=subTop('플래시 카드')+`<div class="sec"><div class="seg" id="fS">${[0,...SN].map(s=>`<button data-v="${s}" class="${fl.subj===s?'on':''}">${s?s+'과목':'전체'}</button>`).join('')}</div>
  <div class="vseg"><button id="fHot" class="${fl.hot?'on':''}">★ 자주 나온 것만</button><button id="fNew">새로 섞기</button></div></div>`;
  if(!N){h+=`<div class="empty">카드가 없어요.</div>`;}
  else if(fl.i>=N){h+=`<div class="sec"><div class="panel confirm" style="text-align:center"><b>한 바퀴 끝!</b><div class="tstats"><div><b>${fl.ok}</b><span>알았어요</span></div><div><b>${fl.no}</b><span>몰랐어요</span></div></div>${fl.miss.length?`<button class="btn" id="fMiss">모른 ${fl.miss.length}장만 다시</button>`:''}<button class="btn ghost" id="fAgain">처음부터 다시</button></div></div>`;}
  else {h+=`<div class="sec"><div class="fbar"><span>${fl.i+1}/${N}</span><div class="progress"><i style="width:${(fl.i)/N*100}%"></i></div></div>
  <button class="fcard ${fl.flip?'turned':''}" id="fCard" aria-label="카드 뒤집기"><span class="ft">${esc(SUBJ[c.s]||'')} · ${esc(c.t)}</span>${fl.flip?`<span class="fb">${esc(c.b).replace(/\n/g,'<br>')}</span><span class="fq">${esc(c.f)}</span>`:`<span class="ff">${esc(c.f)}</span><span class="fh">눌러서 뒤집기</span>`}</button>
  <div class="frow"><button class="fno" id="fNo">✕ <span>${fl.no}</span></button><button class="fok" id="fOk"><span>${fl.ok}</span> ○</button></div><p class="hint" style="text-align:center">뒤집어서 확인하고, 알았으면 ○ 몰랐으면 ✕</p></div>`;}
  app.innerHTML=h; bindBack();
  app.querySelectorAll('#fS button').forEach(b=>b.onclick=()=>{fl.subj=+b.dataset.v;fl.deck=null;renderFlash();});
  $('#fHot').onclick=()=>{fl.hot=!fl.hot;fl.deck=null;renderFlash();}; $('#fNew').onclick=()=>{fl.deck=null;renderFlash();};
  const fc=$('#fCard'); if(fc) fc.onclick=()=>{fl.flip=!fl.flip;renderFlash();};
  const nx=ok=>{if(ok)fl.ok++;else{fl.no++;fl.miss.push(fl.deck[fl.i]);} fl.i++; fl.flip=false; renderFlash();};
  const a=$('#fOk'),b=$('#fNo'); if(a)a.onclick=()=>nx(true); if(b)b.onclick=()=>nx(false);
  const m=$('#fMiss'); if(m) m.onclick=()=>{fl.deck=shuffle(fl.miss);fl.i=0;fl.ok=0;fl.no=0;fl.miss=[];renderFlash();};
  const ag=$('#fAgain'); if(ag) ag.onclick=()=>{fl.deck=null;renderFlash();};
  if(fc){let sx=null;fc.addEventListener('touchstart',e=>{sx=e.touches[0].clientX;},{passive:true});fc.addEventListener('touchend',e=>{if(sx===null)return;const dx=e.changedTouches[0].clientX-sx;sx=null;if(Math.abs(dx)>70){e.preventDefault();nx(dx>0);}},{passive:false});}
}
/* D-day 설정 */
function ddayForm(){return `<div class="panel confirm" id="ddayP"><b>시험일 (D-day)</b><div class="row" style="align-items:center"><input class="search" type="date" id="ddIn" value="${esc(store.pref.examDate||'')}" style="flex:1"><button class="iconbtn" id="ddSave">저장</button>${store.pref.examDate?'<button class="iconbtn" id="ddDel">지우기</button>':''}</div><span class="hint">정하면 위쪽에 D-day가 보여요.</span></div>`;}
function bindDday(re){const s=$('#ddSave'); if(s) s.onclick=()=>{store.pref.examDate=$('#ddIn').value||null;save();re();}; const d=$('#ddDel'); if(d) d.onclick=()=>{store.pref.examDate=null;save();re();};}

if(store.cur){pauseCur();}
render();
document.addEventListener('visibilitychange',()=>{ if(LIVE() && document.hidden && store.cur && tab==='quiz') save(); });
ROOT.pmTab=()=>(tab==='quiz'?'home':tab);
ROOT.pmStop=()=>{try{if(store.cur&&tab==='quiz') pauseCur();}catch(e){} clearInterval(tick); save();};
};
