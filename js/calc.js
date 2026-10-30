/* ADsP 계산 문제 특훈 — 무한 랜덤 문제 + 단계별 풀이 (작성: HAE)
   유형: 연관규칙(지지도·신뢰도·향상도) / 오분류표(정밀도·재현율·특이도·정확도·F1) / 공식 고르기 / 지니·기댓값·확률 */
(function(){
'use strict';
const $=s=>document.querySelector(s);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const R=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const frac=(n,d)=>{const g=gcd(n,d)||1;return d/g===1?String(n/g):`${n/g}/${d/g}`;};
const dec=v=>{const r=Math.round(v*100)/100;return String(r);};

/* ---------- 저장 (이 기기에만, 실패해도 동작) ---------- */
const KEY='adsp_calc_v1';
let st={c:{},w:{},streak:0,best:0,guided:true,type:'all'};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)st=Object.assign(st,s);}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}};

const TYPES=[['all','전체 섞기'],['assoc','연관규칙'],['cm','오분류표 계산'],['formula','공식 고르기'],['etc','지니·기댓값·확률']];

/* ---------- 보기 4개 만들기 ---------- */
function choices(correct,wrongs,fmt){
  fmt=fmt||dec; const seen=new Set([fmt(correct)]); const out=[{v:fmt(correct),ok:true}];
  for(const w of wrongs){const t=fmt(w.v);if(!seen.has(t)&&isFinite(w.v)&&w.v>=0){seen.add(t);out.push({v:t,ok:false,why:w.why});}if(out.length===4)break;}
  let k=1;while(out.length<4){const v=Math.max(0.01,correct+(k%2?1:-1)*0.05*Math.ceil(k/2));const t=fmt(v);if(!seen.has(t)){seen.add(t);out.push({v:t,ok:false,why:'계산과 맞지 않는 값이에요.'});}k++;}
  return shuffle(out);
}

/* ---------- 유형 1: 연관규칙 ---------- */
function genAssoc(){
  const items=['A','B','C','D'];const N=R(5,6);let T;
  for(let tries=0;tries<200;tries++){
    T=[];for(let i=0;i<N;i++){let s=items.filter(()=>Math.random()<0.5);if(s.length<2)s=shuffle(items).slice(0,2).sort();T.push(s);}
    const nA=T.filter(t=>t.includes('A')).length,nB=T.filter(t=>t.includes('B')).length,nAB=T.filter(t=>t.includes('A')&&t.includes('B')).length;
    if(nA>=2&&nB>=2&&nAB>=1&&nA<N&&nAB<nA&&nAB<nB)break;
  }
  const [X,Y]=Math.random()<0.5?['A','B']:['B','A'];
  const has=(t,k)=>t.includes(k);
  const nX=T.filter(t=>has(t,X)).length,nY=T.filter(t=>has(t,Y)).length,nXY=T.filter(t=>has(t,X)&&has(t,Y)).length;
  const m=pick(['지지도','신뢰도','신뢰도','향상도']);
  const sup=nXY/N,conf=nXY/nX,rev=nXY/nY,lift=(nXY/N)/((nX/N)*(nY/N));
  let ans,form,last,wr;
  if(m==='지지도'){ans=sup;form=`${X}·${Y} 함께 있는 거래 / 전체 거래 = ${nXY}/${N}`;
    wr=[{v:conf,why:`그건 신뢰도(분모가 ${X} 거래 수)예요.`},{v:nX/N,why:`${X}만 센 비율이에요. ${Y}도 같이 있어야 해요.`},{v:lift,why:'그건 향상도예요.'}];}
  else if(m==='신뢰도'){ans=conf;form=`${X}·${Y} 함께 있는 거래 / ${X} 있는 거래 = ${nXY}/${nX}`;
    wr=[{v:sup,why:'분모를 전체 거래 수로 잡으면 지지도가 돼요. 신뢰도 분모는 앞쪽 품목(조건) 거래 수예요.'},{v:rev,why:`분모를 ${Y} 거래 수로 잡은 값이에요. ${X}→${Y}는 ${X}가 조건이라 ${X} 거래 수로 나눠요.`},{v:(nXY+1)/nX,why:'함께 있는 거래를 하나 더 센 값이에요. 두 품목이 모두 있는 줄만 세요.'}];}
  else{ans=lift;form=`신뢰도 / P(${Y}) = (${nXY}/${nX}) / (${nY}/${N})`;
    wr=[{v:conf,why:'신뢰도에서 멈춘 값이에요. 향상도는 신뢰도를 P(결과 품목)로 한 번 더 나눠요.'},{v:sup,why:'그건 지지도예요.'},{v:sup/(nX/N)/(nY/N)/2,why:'분모 계산이 틀린 값이에요.'}];}
  const steps=[
    {kind:'rows',ask:`① 먼저 <b>${X}</b>가 들어 있는 장바구니를 모두 눌러 고르세요.`,ans:T.map((t,i)=>has(t,X)?i:-1).filter(i=>i>=0),note:`${X} 포함 거래 = ${nX}건`},
    {kind:'rows',ask:`② 그중 <b>${Y}</b>도 함께 들어 있는 장바구니만 남기세요.`,ans:T.map((t,i)=>has(t,X)&&has(t,Y)?i:-1).filter(i=>i>=0),note:`${X}·${Y} 함께 = ${nXY}건`}];
  if(m==='향상도') steps.push({kind:'rows',ask:`③ 이번엔 <b>${Y}</b>가 들어 있는 장바구니를 모두 고르세요. (향상도에는 P(${Y})가 필요해요)`,ans:T.map((t,i)=>has(t,Y)?i:-1).filter(i=>i>=0),note:`${Y} 포함 거래 = ${nY}건`});
  const exp=m==='지지도'?`지지도 = ${form} = ${frac(nXY,N)} ≈ ${dec(ans)}`:m==='신뢰도'?`신뢰도 = ${form} = ${frac(nXY,nX)} ≈ ${dec(ans)}`:`향상도 = ${form} = ${dec(ans)} ${ans>1?'(1보다 크니 양의 관계)':ans<1?'(1보다 작으니 음의 관계)':'(1이면 독립)'}`;
  return {type:'assoc',title:'연관규칙',q:`다음 거래 데이터에서 규칙 <b>${X} → ${Y}</b>의 <b>${m}</b>는?`,
    table:{h:['장바구니','item'],r:T.map((t,i)=>[String(i+1),t.join(', ')])},rowPick:true,
    steps,opts:choices(ans,wr),exp,
    tip:m==='지지도'?'지지도 = 함께 / 전체':m==='신뢰도'?'신뢰도 = 함께 / 앞 품목(조건)':'향상도 = 신뢰도 / P(뒤 품목) · 1이면 독립'};
}

/* ---------- 유형 2: 오분류표 계산 ---------- */
const MET={
  '정밀도':{f:'TP / (TP + FP)',line:'예측 True 세로줄',num:['TP'],den:['TP','FP'],say:'True라고 예측한 것 중 진짜 True'},
  '재현율(민감도)':{f:'TP / (TP + FN)',line:'실제 True 가로줄',num:['TP'],den:['TP','FN'],say:'실제 True 중 잡아낸 비율'},
  '특이도':{f:'TN / (TN + FP)',line:'실제 False 가로줄',num:['TN'],den:['FP','TN'],say:'실제 False 중 False로 맞힌 비율'},
  '정확도':{f:'(TP + TN) / 전체',line:'대각선 / 전체',num:['TP','TN'],den:['TP','FN','FP','TN'],say:'전체 중 맞힌 비율'}
};
function cmCells(){let c;do{c={TP:R(2,9)*10,FN:R(1,9)*10,FP:R(1,9)*10,TN:R(2,9)*10};}while(new Set(Object.values(c)).size<3);return c;}
function cmTable(c,flip){ // flip: 행이 예측값
  return flip?{h:['구분','실제 True','실제 False'],r:[['예측 True',String(c.TP),String(c.FP)],['예측 False',String(c.FN),String(c.TN)]],cells:[['TP','FP'],['FN','TN']],flip}
             :{h:['구분','예측 True','예측 False'],r:[['실제 True',String(c.TP),String(c.FN)],['실제 False',String(c.FP),String(c.TN)]],cells:[['TP','FN'],['FP','TN']],flip};
}
const val=(c,k)=>{const M=MET[k];return M.num.reduce((a,x)=>a+c[x],0)/M.den.reduce((a,x)=>a+c[x],0);};
function genCM(){
  const c=cmCells();const flip=Math.random()<0.3;const tb=cmTable(c,flip);
  const names=Object.keys(MET);const m=pick(names.concat(['F1']));
  if(m==='F1'){
    const p=val(c,'정밀도'),r=val(c,'재현율(민감도)'),f=2*p*r/(p+r);
    const steps=[
      {kind:'choice',ask:'① 정밀도 = TP / (TP + FP) 를 먼저 구해요.',opts:choices(p,[{v:r},{v:val(c,'특이도')},{v:val(c,'정확도')}]),note:`정밀도 = ${c.TP}/(${c.TP}+${c.FP}) ≈ ${dec(p)}`},
      {kind:'choice',ask:'② 재현율 = TP / (TP + FN) 을 구해요.',opts:choices(r,[{v:p},{v:val(c,'특이도')},{v:val(c,'정확도')}]),note:`재현율 = ${c.TP}/(${c.TP}+${c.FN}) ≈ ${dec(r)}`}];
    return {type:'cm',title:'오분류표 · F1',q:'아래 오분류표를 이용하여 계산한 <b>F1-Score</b>는?',table:tb,steps,
      opts:choices(f,[{v:(p+r)/2,why:'산술평균이에요. F1은 조화평균(2pr/(p+r))이에요.'},{v:p,why:'정밀도에서 멈춘 값이에요.'},{v:r,why:'재현율에서 멈춘 값이에요.'},{v:val(c,'정확도'),why:'정확도예요.'}]),
      exp:`정밀도 ${dec(p)}, 재현율 ${dec(r)} → F1 = 2 × ${dec(p)} × ${dec(r)} / (${dec(p)} + ${dec(r)}) ≈ ${dec(f)}`,tip:'F1 = 2 × 정밀도 × 재현율 / (정밀도 + 재현율)'};
  }
  const M=MET[m];const v=val(c,m);
  const wr=names.filter(n=>n!==m).map(n=>({v:val(c,n),why:`그건 ${n}(${MET[n].f})예요.`}));
  const steps=[
    {kind:'choice',ask:`① <b>${m}</b>는 표의 어디를 봐요?`,opts:shuffle(names.map(n=>({v:MET[n].line,ok:n===m,why:`그건 ${n}을 볼 때예요.`}))),note:`${m} → ${M.line} (${M.say})`},
    {kind:'cells',ask:`② 분자에 들어갈 칸을 눌러 고르세요. (${M.num.join(' + ')})`,ans:M.num,note:`분자 = ${M.num.map(k=>k+' '+c[k]).join(' + ')}`}];
  return {type:'cm',title:'오분류표 · '+m,q:`아래 오분류표를 이용하여 구한 <b>${m}</b> 값은?${flip?' <span class="warn">(행이 예측값이에요!)</span>':''}`,table:tb,steps,
    opts:choices(v,wr),exp:`${m} = ${M.f} = ${M.num.map(k=>c[k]).join(' + ')} / (${M.den.map(k=>c[k]).join(' + ')}) = ${frac(M.num.reduce((a,x)=>a+c[x],0),M.den.reduce((a,x)=>a+c[x],0))} ≈ ${dec(v)}`,
    tip:`${m}: ${M.line} · ${M.say}`};
}

/* ---------- 유형 3: 공식 고르기 ---------- */
function genFormula(){
  const names=Object.keys(MET);
  if(Math.random()<0.6){const m=pick(names);
    return {type:'formula',title:'공식 고르기',q:`아래 오분류표에서 <b>${m}</b> 값을 구하는 식을 고르세요.`,
      table:{h:['구분','예측 T','예측 F'],r:[['실제 T','TP','FN'],['실제 F','FP','TN']]},steps:[],
      opts:shuffle(names.map(n=>({v:MET[n].f,ok:n===m,why:`그건 ${n}이에요.`}))),exp:`${m} = ${MET[m].f} → ${MET[m].line}, ${MET[m].say}`,tip:'P/N = 내 예측, T/F = 그 예측이 맞았나'};}
  const m=pick(names.concat(['FPR']));
  if(m==='FPR') return {type:'formula',title:'공식 고르기',q:'다음 식 <b>FP / (FP + TN)</b> 이 나타내는 것은?',steps:[],
    opts:shuffle([{v:'거짓 양성률(FPR) = 1 − 특이도',ok:true},{v:'재현율(민감도)',ok:false,why:'재현율은 TP/(TP+FN)이에요.'},{v:'정밀도',ok:false,why:'정밀도는 TP/(TP+FP)예요.'},{v:'특이도',ok:false,why:'특이도는 TN/(TN+FP)예요. 분자가 TN이에요.'}]),
    exp:'FP/(FP+TN)은 실제 False 중 True로 잘못 본 비율(FPR) = 1 − 특이도. ROC 곡선의 x축이에요.',tip:'ROC: x축 FPR(1−특이도), y축 TPR(민감도)'};
  return {type:'formula',title:'공식 고르기',q:`다음 식 <b>${MET[m].f}</b> 이 나타내는 지표는?`,steps:[],
    opts:shuffle(names.map(n=>({v:n,ok:n===m,why:`${n}은 ${MET[n].f}예요.`}))),exp:`${MET[m].f} = ${m} (${MET[m].say})`,tip:'민감도·특이도는 가로줄, 정밀도는 세로줄'};
}

/* ---------- 유형 4: 지니·기댓값·확률·z ---------- */
function genEtc(){
  const k=pick(['gini','gini','exp','exp','indep','z']);
  if(k==='gini'){const n=pick([4,6,8,10]);let a=R(1,n-1);const b=n-a;const g=1-(a/n)**2-(b/n)**2;
    const seq=shuffle(Array(a).fill('●').concat(Array(b).fill('○'))).join(' ');
    return {type:'etc',title:'지니 지수',q:`다음 집단(● ${a}개, ○ ${b}개)의 <b>지니 지수</b>는?<div class="seq">${seq}</div>`,steps:[
      {kind:'choice',ask:'① ●의 비율 p₁ 은?',opts:choices(a/n,[{v:b/n},{v:a/(n+1)},{v:1/n}],x=>frac(Math.round(x*n),n)),note:`p₁ = ${a}/${n}, p₂ = ${b}/${n}`}],
      opts:choices(g,[{v:1-g,why:'Σp²에서 멈춘 값이에요. 지니는 1에서 빼요.'},{v:(a/n)*(b/n),why:'p₁×p₂ 한 번만 곱한 값이에요.'},{v:0.5,why:'0.5는 반반일 때만 나와요.'}]),
      exp:`지니 = 1 − (${a}/${n})² − (${b}/${n})² = ${dec(g)}`,tip:'지니 = 1 − Σp² · 반반이면 0.5(최대), 한 종류면 0'};}
  if(k==='exp'){let ps;do{const a=R(1,4),b=R(1,4);const c=6-a-b;ps=[a,b,c];}while(ps[2]<1);const xs=[1,2,3];
    const e=xs.reduce((s,x,i)=>s+x*ps[i]/6,0);
    return {type:'etc',title:'기댓값',q:'다음 확률질량함수에서 확률변수 X의 <b>기댓값 E(X)</b>는?',table:{h:['x','1','2','3'],r:[['f(x)',...ps.map(p=>p+'/6')]]},steps:[],
      opts:choices(e,[{v:2,why:'x를 그냥 평균 낸 값이에요. 확률을 곱해야 해요.'},{v:e+1/6,why:'곱셈 하나가 틀렸어요.'},{v:(ps[0]+ps[1]*2+ps[2]*3)/3,why:'6이 아니라 3으로 나눴어요.'}],x=>frac(Math.round(x*6),6)),
      exp:`E(X) = Σ x·f(x) = 1×${ps[0]}/6 + 2×${ps[1]}/6 + 3×${ps[2]}/6 = ${frac(ps[0]+2*ps[1]+3*ps[2],6)}`,tip:'기댓값 = x × 확률을 다 더하기'};}
  if(k==='indep'){const a=pick([0.2,0.3,0.4,0.5]),b=pick([0.2,0.4,0.5,0.6]);
    return {type:'etc',title:'독립 사건',q:`P(A) = ${a}, P(B) = ${b}이고 두 사건 A와 B가 <b>독립</b>일 때 <b>P(B | A)</b>는?`,steps:[],
      opts:choices(b,[{v:a*b,why:'그건 P(A∩B)예요.'},{v:a,why:'그건 P(A)예요.'},{v:a+b,why:'더하면 안 돼요.'}]),
      exp:`독립이면 A가 일어났다는 정보가 B에 영향을 안 줘요 → P(B|A) = P(B) = ${b}`,tip:'독립: P(B|A) = P(B), P(A∩B) = P(A)×P(B)'};}
  const mu=pick([60,70,75,80,85]),sd=pick([4,5,8,10]),z=pick([1.28,1.64,1.96,2.05,2.33]);const x=mu+z*sd;
  return {type:'etc',title:'표준화',q:`시험 성적이 정규분포를 따를 때, 상위 점수를 위한 최저 점수는? (z = ${z}, 평균 = ${mu}, 표준편차 = ${sd})`,steps:[],
    opts:choices(x,[{v:mu-z*sd,why:'상위면 평균에 더해요.'},{v:mu+z,why:'z에 표준편차를 곱해야 해요.'},{v:mu*z/sd+mu/2,why:'공식이 틀렸어요.'}]),
    exp:`X = 평균 + z × 표준편차 = ${mu} + ${z} × ${sd} = ${dec(x)}`,tip:'z = (X − μ)/σ → X = μ + zσ'};
}

const GEN={assoc:genAssoc,cm:genCM,formula:genFormula,etc:genEtc};

/* ---------- 화면 ---------- */
let P=null,si=0,picked=new Set(),done=false,stepLog=[];
function next(){const t=st.type==='all'?pick(['assoc','assoc','cm','cm','formula','etc']):st.type;P=GEN[t]();si=0;picked=new Set();done=false;stepLog=[];render();window.scrollTo({top:0});}
function tableHTML(){
  const T=P.table;if(!T)return '';
  const step=st.guided&&!done?P.steps[si]:null;
  const rowMode=step&&step.kind==='rows',cellMode=step&&step.kind==='cells';
  const hlRows=new Set(),hlCells=new Set();
  stepLog.forEach(l=>{if(l.rows)l.rows.forEach(i=>hlRows.add(i));});
  if(done&&P.type==='assoc'&&P.steps[1])P.steps[1].ans.forEach(i=>hlRows.add(i));
  let h=`<div class="ctbl"><table><thead><tr>${T.h.map(x=>`<th>${esc(x)}</th>`).join('')}</tr></thead><tbody>`;
  T.r.forEach((r,i)=>{
    const on=rowMode&&picked.has(i);
    h+=`<tr class="${rowMode?'pickable':''} ${on?'on':''} ${!on&&hlRows.has(i)?'hl':''}" ${rowMode?`data-row="${i}" tabindex="0"`:''}>`;
    r.forEach((c,j)=>{
      const cell=T.cells&&j>0?T.cells[i][j-1]:null;
      if(cell){const on2=cellMode&&picked.has(cell);h+=`<td class="${cellMode?'pickable':''} ${on2?'on':''}" ${cellMode?`data-cell="${cell}" tabindex="0"`:''}><b>${esc(c)}</b>${done||stepLog.length?`<small>${cell}</small>`:''}</td>`;}
      else h+=j?`<td>${esc(c)}</td>`:`<th scope="row">${esc(c)}</th>`;
    });h+='</tr>';});
  return h+'</tbody></table></div>';
}
function optsHTML(opts,id,locked,sel){
  return `<div class="copts">${opts.map((o,i)=>{let cls='';if(locked){if(o.ok)cls='ok';else if(sel===i)cls='no';}
    return `<button class="copt ${cls}" data-${id}="${i}" ${locked?'disabled':''}><span class="n">${i+1}</span><span>${esc(o.v)}</span></button>`;}).join('')}</div>`;
}
function render(){
  const tot=Object.values(st.c).reduce((a,b)=>a+b,0),wr=Object.values(st.w).reduce((a,b)=>a+b,0);
  let h=`<header class="ctop"><a class="back" href="index.html">← 패스메이트</a><div class="brand">계산 특훈<small>ADsP 3과목</small></div><div class="cstat"><b>${st.streak}</b><span>연속</span></div></header>
  <div class="chips">${TYPES.map(([k,l])=>`<button class="chip ${st.type===k?'on':''}" data-type="${k}">${l}</button>`).join('')}</div>
  <label class="gtog"><input type="checkbox" id="guided" ${st.guided?'checked':''}><span>단계별로 풀기 <small>(세는 순서를 하나씩 확인)</small></span></label>
  <article class="ccard"><div class="ctag">${esc(P.title)}</div><p class="cq">${P.q}</p>${tableHTML()}`;
  const guided=st.guided&&P.steps.length;
  stepLog.forEach(l=>{h+=`<div class="clog">✓ ${l.note}</div>`;});
  if(guided&&si<P.steps.length&&!done){
    const s=P.steps[si];h+=`<div class="cstep"><p>${s.ask}</p>`;
    if(s.kind==='choice') h+=optsHTML(s.opts,'sopt',false);
    else h+=`<button class="btn" id="stepOk">다 골랐어요 (${picked.size}개)</button>`;
    h+=`<p class="cmsg" id="cmsg" role="status"></p></div>`;
  } else {
    h+=`<div class="cfinal"><p>${guided?'③ 이제 계산해서 답을 고르세요.':''}</p>${optsHTML(P.opts,'opt',done,P.sel)}</div>`;
    if(done){const o=P.opts[P.sel];
      h+=`<div class="cexp ${o.ok?'good':'bad'}"><b>${o.ok?'정답이에요!':'아쉬워요.'}</b>${!o.ok&&o.why?`<p>${esc(o.why)}</p>`:''}<p class="f">${esc(P.exp)}</p><div class="ctip">암기 · ${esc(P.tip)}</div></div>
      <button class="btn big" id="nextQ">다음 문제 →</button>`;}
  }
  h+=`</article><p class="cfoot">맞힌 문제 ${tot} · 틀린 문제 ${wr} · 최고 연속 ${st.best}${Object.keys(st.w).length?` · 약한 유형: ${Object.entries(st.w).sort((a,b)=>b[1]-a[1])[0][0]}`:''}</p>`;
  $('#c').innerHTML=h;bind();
}
function bind(){
  document.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{st.type=b.dataset.type;save();next();});
  $('#guided').onchange=e=>{st.guided=e.target.checked;save();render();};
  const tog=(el,key)=>{const k=el.dataset[key];const v=key==='row'?+k:k;picked.has(v)?picked.delete(v):picked.add(v);render();};
  document.querySelectorAll('[data-row]').forEach(el=>{el.onclick=()=>tog(el,'row');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog(el,'row');}};});
  document.querySelectorAll('[data-cell]').forEach(el=>{el.onclick=()=>tog(el,'cell');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();tog(el,'cell');}};});
  const ok=$('#stepOk');if(ok)ok.onclick=()=>{const s=P.steps[si];const want=new Set(s.ans);
    const right=picked.size===want.size&&[...picked].every(x=>want.has(x));
    if(!right){const miss=[...want].filter(x=>!picked.has(x)),extra=[...picked].filter(x=>!want.has(x));
      const nm=x=>typeof x==='number'?(x+1)+'번':x;
      $('#cmsg').innerHTML=`다시 세어 봐요. ${miss.length?`빠진 것: <b>${miss.map(nm).join(', ')}</b> `:''}${extra.length?`잘못 고른 것: <b>${extra.map(nm).join(', ')}</b>`:''}`;$('#cmsg').className='cmsg bad';return;}
    stepLog.push({note:s.note,rows:s.kind==='rows'?[...want]:null});si++;picked=new Set();render();};
  document.querySelectorAll('[data-sopt]').forEach(b=>b.onclick=()=>{const s=P.steps[si];const o=s.opts[+b.dataset.sopt];
    if(!o.ok){$('#cmsg').textContent=o.why||'다시 생각해 봐요.';$('#cmsg').className='cmsg bad';b.classList.add('no');return;}
    stepLog.push({note:s.note});si++;render();});
  document.querySelectorAll('[data-opt]').forEach(b=>b.onclick=()=>{P.sel=+b.dataset.opt;done=true;const ok=P.opts[P.sel].ok;const k=P.title.split(' · ')[0];
    if(ok){st.c[k]=(st.c[k]||0)+1;st.streak++;st.best=Math.max(st.best,st.streak);}else{st.w[k]=(st.w[k]||0)+1;st.streak=0;}save();render();
    const x=$('.cexp');if(x)x.scrollIntoView({block:'nearest',behavior:'smooth'});});
  const n=$('#nextQ');if(n)n.onclick=next;
}
next();
})();
