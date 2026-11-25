/* 건축기사 계산 문제 특훈 — 무한 랜덤 문제 + 단계별 풀이 (작성: HAE)
   유형: 보의 반력·모멘트 / 단면 성질 / 좌굴·세장비 / 처짐 / 철근콘크리트 / 설비 계산 / 건폐율·용적률 */
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
const KEY='arch_calc_v1';
let st={c:{},w:{},streak:0,best:0,guided:true,type:'all'};
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)st=Object.assign(st,s);}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st));}catch(e){}};

const TYPES=[['all','전체 섞기'],['beam','보 반력·모멘트'],['sec','단면 성질'],['buck','좌굴·세장비'],['defl','처짐'],['rc','철근콘크리트'],['env','설비 계산'],['law','건폐율·용적률'],['site','시공 계산']];

/* ---------- 보기 4개 만들기 ---------- */
function choices(correct,wrongs,fmt){
  fmt=fmt||dec; const seen=new Set([fmt(correct)]); const out=[{v:fmt(correct),ok:true}];
  for(const w of wrongs){const t=fmt(w.v);if(!seen.has(t)&&isFinite(w.v)&&w.v>=0){seen.add(t);out.push({v:t,ok:false,why:w.why});}if(out.length===4)break;}
  let k=1;while(out.length<4&&k<200){const f=1+(k%2?1:-1)*0.13*Math.ceil(k/2);const v=Math.abs(correct)>0?correct*Math.max(0.05,f):k*0.1;const t=fmt(v);if(!seen.has(t)){seen.add(t);out.push({v:t,ok:false,why:'계산과 맞지 않는 값이에요.'});}k++;}
  return shuffle(out);
}


const num=(v,d)=>{d=d==null?2:d;const r=Math.round(v*10**d)/10**d;return r.toLocaleString('ko-KR',{maximumFractionDigits:d});};
const U=u=>v=>num(v)+' '+u;
const step=(ask,ans,wrongs,fmt,note)=>({kind:'choice',ask,opts:choices(ans,wrongs,fmt),note});

/* ---------- 유형 1: 보의 반력·휨모멘트 ---------- */
function genBeam(){
  const k=pick(['sp','sp','sw','cp','cw']);
  if(k==='sp'){const L=pick([4,5,6,8,10]);const a=R(1,L-1);const b=L-a;const P=pick([10,12,20,30,40,60]);
    const RA=P*b/L,RB=P*a/L,M=P*a*b/L;const kN=U('kN'),kNm=U('kN·m');
    return {type:'beam',title:'단순보 · 집중하중',q:`길이 ${L}m 단순보의 A점에서 ${a}m 떨어진 곳에 집중하중 P = ${P}kN이 작용할 때, <b>최대 휨모멘트</b>는?`,
      steps:[step('① A점 반력 R<sub>A</sub>는? (B점에 대한 모멘트 평형)',RA,[{v:RB,why:'그건 R<sub>B</sub>예요. A 반력은 하중에서 먼 쪽 거리 b를 곱해요.'.replace(/<[^>]+>/g,'')},{v:P/2,why:'하중이 가운데가 아니면 반씩 나누면 안 돼요.'},{v:P*a/b,why:'L로 나눠야 해요.'}],kN,`R_A = P·b/L = ${P}×${b}/${L} = ${num(RA)}kN`)],
      opts:choices(M,[{v:P*L/4,why:'PL/4는 하중이 정가운데일 때만이에요.'},{v:RA*b,why:'하중점 모멘트는 R_A × a예요.'},{v:P*a,why:'R_A가 아니라 P를 곱했어요.'}],kNm),
      exp:`M_max = 하중점 = R_A × a = P·a·b/L = ${P}×${a}×${b}/${L} = ${num(M)}kN·m`,tip:'단순보 집중하중: M = Pab/L, 가운데면 PL/4'};}
  if(k==='sw'){const L=pick([4,5,6,8,10,12]);const w=pick([2,3,4,5,6,10]);const R0=w*L/2,M=w*L*L/8;
    const ask=pick(['M','V']);
    if(ask==='V') return {type:'beam',title:'단순보 · 등분포하중',q:`길이 ${L}m 단순보 전체에 등분포하중 w = ${w}kN/m이 작용할 때, <b>최대 전단력</b>은?`,steps:[],
      opts:choices(R0,[{v:w*L,why:'전체 하중이에요. 양쪽 지점이 반씩 받아요.'},{v:M,why:'그건 최대 휨모멘트(wL²/8)예요.'},{v:w*L/4,why:'반으로 나눠야 해요.'}],U('kN')),exp:`V_max = 지점 반력 = wL/2 = ${w}×${L}/2 = ${num(R0)}kN`,tip:'등분포 단순보: R = wL/2, M = wL²/8 (가운데)'};
    return {type:'beam',title:'단순보 · 등분포하중',q:`길이 ${L}m 단순보 전체에 등분포하중 w = ${w}kN/m이 작용할 때, <b>최대 휨모멘트</b>는?`,
      steps:[step('① 지점 반력은?',R0,[{v:w*L,why:'전체 하중 wL을 두 지점이 반씩 받아요.'},{v:w*L/4,why:'wL/2예요.'}],U('kN'),`R_A = R_B = wL/2 = ${num(R0)}kN`)],
      opts:choices(M,[{v:w*L*L/2,why:'wL²/2는 캔틸레버 고정단 모멘트예요.'},{v:w*L*L/4,why:'단순보는 wL²/8이에요.'},{v:w*L*L/12,why:'wL²/12는 양단고정보 단부 모멘트예요.'}],U('kN·m')),
      exp:`M_max = wL²/8 = ${w}×${L}²/8 = ${num(M)}kN·m`,tip:'wL²/8(단순) · wL²/2(캔틸레버) · wL²/12(양단고정 단부)'};}
  if(k==='cp'){const L=pick([2,3,4,5]);const P=pick([5,10,15,20]);
    return {type:'beam',title:'캔틸레버 · 집중하중',q:`길이 ${L}m 캔틸레버보의 자유단에 집중하중 P = ${P}kN이 작용할 때, 고정단의 <b>휨모멘트 크기</b>는?`,steps:[],
      opts:choices(P*L,[{v:P*L/2,why:'캔틸레버는 끝 하중 × 전체 길이예요.'},{v:P*L/4,why:'PL/4는 단순보 중앙 하중이에요.'},{v:P,why:'그건 반력(전단력)이에요.'}],U('kN·m')),exp:`M = P × L = ${P}×${L} = ${num(P*L)}kN·m (고정단에서 최대)`,tip:'캔틸레버 끝 집중하중: M = PL, V = P'};}
  const L=pick([2,3,4,5,6]);const w=pick([2,3,4,5,10]);
  return {type:'beam',title:'캔틸레버 · 등분포하중',q:`길이 ${L}m 캔틸레버보 전체에 등분포하중 w = ${w}kN/m이 작용할 때, 고정단의 <b>휨모멘트 크기</b>는?`,
    steps:[step('① 전체 하중(합력)과 작용 위치는?',w*L,[{v:w*L/2,why:'합력은 w × L 전체예요.'},{v:w,why:'길이를 곱해야 해요.'}],U('kN'),`합력 = wL = ${num(w*L)}kN, 고정단에서 L/2 = ${num(L/2)}m 지점에 작용`)],
    opts:choices(w*L*L/2,[{v:w*L*L/8,why:'wL²/8은 단순보예요.'},{v:w*L*L,why:'합력은 L/2 지점에 작용해요.'},{v:w*L/2,why:'그건 단순보 반력이에요.'}],U('kN·m')),
    exp:`M = wL × L/2 = wL²/2 = ${w}×${L}²/2 = ${num(w*L*L/2)}kN·m`,tip:'등분포는 합력(wL)을 가운데에 모아서 계산'};
}

/* ---------- 유형 2: 단면 성질 ---------- */
function genSec(){
  const k=pick(['I','Z','r','sig','circ']);
  const b=pick([100,150,200,250,300]),h=pick([200,300,400,500,600]);const I=b*h**3/12,Z=b*h*h/6;
  const big=v=>{const e=Math.floor(Math.log10(Math.abs(v)));const m=v/10**e;return num(m,3)+'×10^'+e;};
  if(k==='I') return {type:'sec',title:'단면2차모멘트',q:`폭 b = ${b}mm, 높이 h = ${h}mm 직사각형 단면의 도심 축(x축)에 대한 <b>단면2차모멘트</b>는?`,steps:[],
    opts:choices(I,[{v:h*b**3/12,why:'b와 h가 바뀌었어요. 높이 h를 세제곱해요.'},{v:b*h**3/3,why:'bh³/3은 밑변 축에 대한 값이에요.'},{v:Z,why:'그건 단면계수 bh²/6이에요.'}],v=>big(v)+' mm⁴'),
    exp:`I = bh³/12 = ${b}×${h}³/12 = ${big(I)} mm⁴`,tip:'I = bh³/12 (도심), bh³/3 (밑변) · 높이를 세제곱'};
  if(k==='Z') return {type:'sec',title:'단면계수',q:`폭 b = ${b}mm, 높이 h = ${h}mm 직사각형 단면의 <b>단면계수 Z</b>는?`,
    steps:[step('① 단면계수 Z = I / y 에서 y는?',h/2,[{v:h,why:'도심에서 맨 끝까지 거리라 h/2예요.'},{v:b/2,why:'휨축과 수직인 높이 방향이에요.'}],U('mm'),`y = h/2 = ${h/2}mm`)],
    opts:choices(Z,[{v:I,why:'단면2차모멘트에서 멈췄어요.'},{v:b*h*h/12,why:'bh²/6이에요.'},{v:h*b*b/6,why:'b와 h가 바뀌었어요.'}],v=>big(v)+' mm³'),
    exp:`Z = I/(h/2) = bh²/6 = ${b}×${h}²/6 = ${big(Z)} mm³`,tip:'Z = bh²/6, 휨응력 σ = M/Z'};
  if(k==='r'){const r=h/Math.sqrt(12);
    return {type:'sec',title:'단면2차반경',q:`폭 ${b}mm × 높이 ${h}mm 직사각형 단면의 강축에 대한 <b>단면2차반경 r</b>은?`,steps:[step('① 공식은 r = √(I/A). 직사각형이면?',h/Math.sqrt(12),[{v:h/12,why:'루트를 씌워야 해요: h/√12.'},{v:h/Math.sqrt(6),why:'√12예요.'}],U('mm'),'r = √(bh³/12 ÷ bh) = h/√12 ≈ 0.289h')],
      opts:choices(r,[{v:b/Math.sqrt(12),why:'강축이면 높이 h를 써요.'},{v:h/12,why:'루트가 빠졌어요.'},{v:h/2,why:'그건 도심까지 거리예요.'}],U('mm')),exp:`r = h/√12 = ${h}/3.464 ≈ ${num(r)}mm`,tip:'직사각형 r = h/√12, 원형 r = D/4'};}
  if(k==='sig'){const M=pick([10,20,30,40,50])*1e6;const s=M/Z;
    return {type:'sec',title:'휨응력',q:`폭 ${b}mm × 높이 ${h}mm 직사각형 보에 휨모멘트 M = ${M/1e6}kN·m이 작용할 때, <b>최대 휨응력</b>은?`,
      steps:[step('① 단면계수 Z = bh²/6 은?',Z,[{v:I,why:'그건 단면2차모멘트예요.'},{v:b*h*h/12,why:'6으로 나눠요.'}],v=>big(v)+' mm³',`Z = ${big(Z)} mm³`)],
      opts:choices(s,[{v:M/I,why:'I가 아니라 Z로 나눠요(또는 M·y/I).'},{v:s/2,why:'Z 계산을 다시 봐요.'},{v:s*2,why:'Z 계산을 다시 봐요.'}],U('MPa')),
      exp:`σ = M/Z = ${M/1e6}×10⁶ N·mm ÷ ${big(Z)} mm³ ≈ ${num(s)} MPa`,tip:'kN·m → ×10⁶ N·mm, N/mm² = MPa'};}
  const D=pick([100,200,300,400]);const Ic=Math.PI*D**4/64,Zc=Math.PI*D**3/32;const want=pick(['I','Z']);
  return {type:'sec',title:'원형 단면',q:`지름 D = ${D}mm 원형 단면의 <b>${want==='I'?'단면2차모멘트':'단면계수'}</b>는?`,steps:[],
    opts:choices(want==='I'?Ic:Zc,want==='I'?[{v:Math.PI*D**4/32,why:'πD⁴/32는 극단면2차모멘트예요.'},{v:Zc,why:'그건 단면계수예요.'},{v:Math.PI*D**4/16,why:'64로 나눠요.'}]:[{v:Ic,why:'그건 단면2차모멘트예요.'},{v:Math.PI*D**3/16,why:'32로 나눠요.'},{v:Math.PI*D**3/64,why:'πD³/32예요.'}],v=>big(v)+(want==='I'?' mm⁴':' mm³')),
    exp:want==='I'?`I = πD⁴/64 = π×${D}⁴/64 ≈ ${big(Ic)} mm⁴`:`Z = πD³/32 = π×${D}³/32 ≈ ${big(Zc)} mm³`,tip:'원형: I = πD⁴/64, Z = πD³/32, r = D/4'};
}

/* ---------- 유형 3: 좌굴·세장비 ---------- */
const KS=[['양단 힌지',1],['1단 고정 · 1단 자유',2],['양단 고정',0.5],['1단 고정 · 1단 힌지',0.7]];
function genBuck(){
  const k=pick(['K','lam','ratio','pcr']);
  if(k==='K'){const [n,K]=pick(KS);
    return {type:'buck',title:'유효좌굴길이',q:`길이 L인 기둥의 지지 조건이 <b>${n}</b>일 때 유효좌굴길이 계수 K는?`,steps:[],
      opts:shuffle(KS.map(([m,v])=>({v:String(v)+'L'+(v===1?'':''),ok:v===K,why:`${v}L은 ${m}예요.`}))),exp:`${n} → KL = ${K}L`,tip:'자유 2.0 · 힌지 1.0 · 고정+힌지 0.7 · 양단고정 0.5'};}
  if(k==='lam'){const [n,K]=pick(KS);const L=pick([3,4,5,6])*1000;const b=pick([200,300,400]);const r=b/Math.sqrt(12);const lam=K*L/r;
    return {type:'buck',title:'세장비',q:`${b}mm × ${b}mm 정사각형 기둥, 길이 ${L/1000}m, 지지 조건 <b>${n}</b>일 때 <b>세장비 λ</b>는?`,
      steps:[step('① 단면2차반경 r = b/√12 은?',r,[{v:b/12,why:'루트를 씌워요.'},{v:b/2,why:'그건 도심까지 거리예요.'}],U('mm'),`r = ${b}/√12 ≈ ${num(r)}mm`),
             step('② 유효좌굴길이 KL은?',K*L,KS.filter(x=>x[1]!==K).map(([m,v])=>({v:v*L,why:`그건 ${m}예요.`})),U('mm'),`KL = ${K}×${L} = ${num(K*L)}mm`)],
      opts:choices(lam,[{v:L/r,why:'K를 곱하지 않았어요.'},{v:K*L/b,why:'b가 아니라 r로 나눠요.'},{v:lam*2,why:'r을 다시 계산해 봐요.'}],v=>num(v,1)),exp:`λ = KL/r = ${num(K*L)}/${num(r)} ≈ ${num(lam,1)}`,tip:'세장비 λ = KL / r, r = √(I/A)'};}
  if(k==='ratio'){const a=pick(KS),b=pick(KS.filter(x=>x!==a));const rat=(b[1]/a[1])**2;
    return {type:'buck',title:'좌굴하중 비교',q:`같은 재료·단면·길이의 기둥 A(<b>${a[0]}</b>)와 B(<b>${b[0]}</b>)가 있다. A의 좌굴하중은 B의 몇 배인가?`,steps:[],
      opts:choices(rat,[{v:b[1]/a[1],why:'(KL)²에 반비례하니 제곱해야 해요.'},{v:1/rat,why:'반대로 나눴어요. K가 작을수록 좌굴하중이 커요.'},{v:Math.sqrt(rat),why:'제곱이에요.'}],v=>num(v,2)+'배'),
      exp:`P_cr = π²EI/(KL)² → P_A/P_B = (K_B/K_A)² = (${b[1]}/${a[1]})² = ${num(rat,2)}배`,tip:'좌굴하중은 (KL)²에 반비례 · 길이 2배 → 1/4'};}
  const E=200000,b=pick([100,150,200]),L=pick([3,4,5])*1000;const [n,K]=pick(KS);const I=b**4/12;const P=Math.PI**2*E*I/(K*L)**2/1000;
  return {type:'buck',title:'오일러 좌굴하중',q:`정사각형 ${b}mm 강재 기둥, 길이 ${L/1000}m, <b>${n}</b>, E = 200,000MPa일 때 <b>탄성 좌굴하중</b>은?`,
    steps:[step('① I = b⁴/12 는?',I,[{v:b**4/3,why:'도심 축이면 12로 나눠요.'},{v:b**3/12,why:'b⁴예요.'}],v=>num(v/1e6,2)+'×10⁶ mm⁴',`I = ${num(I/1e6,2)}×10⁶ mm⁴`)],
    opts:choices(P,[{v:Math.PI**2*E*I/L**2/1000,why:'K를 빼먹었어요.'},{v:Math.PI*E*I/(K*L)**2/1000,why:'π²이에요.'},{v:P/2,why:'다시 계산해 봐요.'}],U('kN')),
    exp:`P_cr = π²EI/(KL)² = π²×200,000×${num(I/1e6,2)}×10⁶ / (${num(K*L)})² ≈ ${num(P)}kN`,tip:'P_cr = π²EI/(KL)²'};
}

/* ---------- 유형 4: 처짐 ---------- */
const DF=[['단순보 · 중앙 집중하중','PL³/48EI','PL²/16EI',3],['단순보 · 등분포하중','5wL⁴/384EI','wL³/24EI',4],['캔틸레버 · 끝 집중하중','PL³/3EI','PL²/2EI',3],['캔틸레버 · 등분포하중','wL⁴/8EI','wL³/6EI',4]];
function genDefl(){
  const k=pick(['f','f','th','len']);const d=pick(DF);
  if(k==='f') return {type:'defl',title:'처짐 공식',q:`<b>${d[0]}</b>을 받는 보의 최대 처짐은?`,steps:[],opts:shuffle(DF.map(x=>({v:x[1],ok:x===d,why:`${x[1]}은 ${x[0]}이에요.`}))),exp:`${d[0]}: δ = ${d[1]}`,tip:'48·384 단순보, 3·8 캔틸레버'};
  if(k==='th') return {type:'defl',title:'처짐각 공식',q:`<b>${d[0]}</b>을 받는 보의 최대 처짐각은?`,steps:[],opts:shuffle(DF.map(x=>({v:x[2],ok:x===d,why:`${x[2]}은 ${x[0]}이에요.`}))),exp:`${d[0]}: θ = ${d[2]}`,tip:'처짐각은 처짐 공식에서 L 차수가 하나 낮아요'};
  const m=pick([2,3,0.5]);const v=m**d[3];
  return {type:'defl',title:'처짐 비교',q:`<b>${d[0]}</b>을 받는 보에서 다른 조건은 같고 <b>길이만 ${m}배</b>가 되면 최대 처짐은 몇 배?`,steps:[],
    opts:choices(v,[{v:m**(d[3]===3?4:3),why:`이 하중은 L의 ${d[3]}제곱에 비례해요.`},{v:m*m,why:`L의 ${d[3]}제곱이에요.`},{v:m,why:`L의 ${d[3]}제곱이에요.`}],x=>num(x,3)+'배'),
    exp:`δ = ${d[1]} → L의 ${d[3]}제곱에 비례 → ${m}^${d[3]} = ${num(v,3)}배`,tip:'집중하중 L³, 등분포 L⁴ · 춤(h) 2배 → I 8배 → 처짐 1/8'};
}

/* ---------- 유형 5: 철근콘크리트 ---------- */
function genRC(){
  const k=pick(['a','a','vc','mcr','beta']);const fck=pick([21,24,27,30]);
  if(k==='a'){const b=pick([250,300,350,400]),As=pick([1000,1200,1500,1800,2000]),fy=pick([300,400,500]);const a=As*fy/(0.85*fck*b);
    return {type:'rc',title:'등가응력블록 깊이',q:`b = ${b}mm, A<sub>s</sub> = ${As}mm², f<sub>ck</sub> = ${fck}MPa, f<sub>y</sub> = ${fy}MPa인 단철근 직사각형 보의 <b>등가응력블록 깊이 a</b>는?`,
      steps:[step('① 철근 인장력 T = A_s·f_y 는?',As*fy/1000,[{v:As*fck/1000,why:'f_y(철근)를 곱해요.'},{v:0.85*As*fy/1000,why:'0.85는 콘크리트 쪽에만 붙어요.'}],U('kN'),`T = ${As}×${fy} = ${num(As*fy/1000)}kN`)],
      opts:choices(a,[{v:As*fy/(fck*b),why:'0.85를 빼먹었어요.'},{v:a/0.85,why:'그건 중립축 깊이 c(β₁=0.85일 때)예요.'},{v:As*fy/(0.85*fck*b)/2,why:'C = T에서 a를 바로 구해요.'}],U('mm')),
      exp:`C = T → 0.85·f_ck·a·b = A_s·f_y → a = ${As}×${fy}/(0.85×${fck}×${b}) ≈ ${num(a)}mm`,tip:'a = A_s·f_y / (0.85·f_ck·b), c = a/β₁'};}
  if(k==='vc'){const bw=pick([250,300,350,400]),d=pick([450,500,550,600]);const Vc=Math.sqrt(fck)*bw*d/6/1000;
    return {type:'rc',title:'콘크리트 전단강도',q:`b<sub>w</sub> = ${bw}mm, d = ${d}mm, f<sub>ck</sub> = ${fck}MPa, 보통중량콘크리트(λ=1) 보의 <b>공칭 전단강도 V<sub>c</sub></b>는?`,steps:[],
      opts:choices(Vc,[{v:fck*bw*d/6/1000,why:'f_ck에 루트를 씌워요.'},{v:Math.sqrt(fck)*bw*d/3/1000,why:'1/6이에요.'},{v:0.75*Vc,why:'그건 설계 전단강도 φV_c(φ=0.75)예요.'}],U('kN')),
      exp:`V_c = (1/6)·λ·√f_ck·b_w·d = (1/6)×√${fck}×${bw}×${d} ≈ ${num(Vc)}kN`,tip:'V_c = 1/6 λ√f_ck b_w d · 전단 φ = 0.75'};}
  if(k==='mcr'){const b=pick([200,250,300]),h=pick([400,500,600]);const fr=0.63*Math.sqrt(fck);const Ig=b*h**3/12;const M=fr*Ig/(h/2)/1e6;
    return {type:'rc',title:'균열모멘트',q:`${b}×${h}mm 직사각형 보, f<sub>ck</sub> = ${fck}MPa, λ = 1일 때 <b>균열모멘트 M<sub>cr</sub></b>은?`,
      steps:[step('① 파괴계수 f_r = 0.63λ√f_ck 는?',fr,[{v:0.63*fck,why:'루트를 씌워요.'},{v:Math.sqrt(fck),why:'0.63을 곱해요.'}],U('MPa'),`f_r = 0.63×√${fck} ≈ ${num(fr)}MPa`)],
      opts:choices(M,[{v:fr*Ig/h/1e6,why:'y_t는 h/2예요.'},{v:2*M,why:'다시 계산해 봐요.'},{v:Math.sqrt(fck)*Ig/(h/2)/1e6,why:'0.63을 곱해요.'}],U('kN·m')),
      exp:`M_cr = f_r·I_g/y_t = ${num(fr)}×(${b}×${h}³/12)/(${h/2}) ≈ ${num(M)}kN·m`,tip:'M_cr = f_r I_g / y_t, f_r = 0.63λ√f_ck'};}
  return {type:'rc',title:'강도감소계수',q:'다음 중 <b>강도감소계수 φ</b>가 바르게 짝지어진 것은?',steps:[],
    opts:shuffle([{v:'인장지배단면 0.85 · 전단 0.75',ok:true},{v:'인장지배단면 0.75 · 전단 0.85',ok:false,why:'반대예요.'},{v:'나선 압축지배 0.65 · 기타 압축지배 0.70',ok:false,why:'나선 0.70, 기타(띠철근) 0.65예요.'},{v:'무근콘크리트 0.65',ok:false,why:'무근콘크리트는 0.55예요.'}]),
    exp:'φ: 인장지배 0.85, 전단·비틀림 0.75, 압축지배 나선 0.70 / 띠철근 0.65, 무근 0.55, 지압 0.65',tip:'85 인장 · 75 전단 · 70 나선 · 65 띠 · 55 무근'};
}

/* ---------- 유형 6: 설비 계산 ---------- */
function genEnv(){
  const k=pick(['heat','lux','vent','sens']);
  if(k==='heat'){const K=pick([0.3,0.5,1.2,2.0,3.5]),A=pick([10,20,30,40,50]),dt=pick([10,15,20,25,30]);const Q=K*A*dt;
    return {type:'env',title:'관류 열손실',q:`열관류율 K = ${K}W/m²·K, 면적 ${A}m²인 벽체의 실내외 온도차가 ${dt}℃일 때 <b>관류 열량</b>은?`,steps:[],
      opts:choices(Q,[{v:K*A,why:'온도차를 곱해요.'},{v:A*dt/K,why:'K를 곱해요(열저항이면 나눠요).'},{v:Q/1000,why:'단위를 확인해요(W).'}],U('W')),exp:`Q = K·A·Δt = ${K}×${A}×${dt} = ${num(Q)}W`,tip:'Q = K A Δt, K = 1/R(총열저항)'};}
  if(k==='lux'){const A=pick([50,80,100,120,200]),E=pick([300,400,500,600]),F=pick([2000,3000,4000,5000]),Uu=pick([0.5,0.6]),M=pick([0.7,0.8]);const N=E*A/(F*Uu*M);
    return {type:'env',title:'광속법',q:`바닥면적 ${A}m², 평균 조도 ${E}lx, 램프 1개 광속 ${F}lm, 조명률 ${Uu}, 보수율 ${M}일 때 필요한 <b>램프 개수</b>는? (계산값)`,steps:[],
      opts:choices(N,[{v:E*A/(F*Uu),why:'보수율 M으로도 나눠요.'},{v:E*A*Uu*M/F,why:'U·M은 분모예요.'},{v:F*Uu*M/(E*A),why:'뒤집혔어요.'}],v=>num(v,1)+'개'),exp:`N = E·A / (F·U·M) = ${E}×${A}/(${F}×${Uu}×${M}) ≈ ${num(N,1)} → 올림해서 ${Math.ceil(N)}개`,tip:'NFUM = EA (광속법)'};}
  if(k==='vent'){const M=pick([0.017,0.02,0.025]),n=pick([10,20,30,40]),Ci=pick([0.001,0.0015]),Co=0.0003;const Q=M*n/(Ci-Co);
    return {type:'env',title:'필요 환기량',q:`1인당 CO₂ 발생량 ${M}m³/h, 재실자 ${n}명, 실내 CO₂ 허용 농도 ${Ci*1e6}ppm, 외기 농도 300ppm일 때 <b>필요 환기량</b>은?`,
      steps:[step('① 농도 차 C_i − C_o 는?',Ci-Co,[{v:Ci,why:'외기 농도를 빼요.'},{v:Ci+Co,why:'빼야 해요.'}],v=>num(v*1e6,0)+'ppm',`${Ci*1e6} − 300 = ${num((Ci-Co)*1e6,0)}ppm = ${num(Ci-Co,4)}`)],
      opts:choices(Q,[{v:M*n/Ci,why:'외기 농도를 빼야 해요.'},{v:M/(Ci-Co),why:'재실자 수를 곱해요.'},{v:Q/2,why:'다시 계산해 봐요.'}],U('m³/h')),exp:`Q = M/(C_i − C_o) = ${num(M*n,3)}/${num(Ci-Co,4)} ≈ ${num(Q)}m³/h`,tip:'환기량 = 발생량 / (실내 허용 − 외기)'};}
  const Qv=pick([500,1000,1500,2000,3000]),dt=pick([5,8,10,12]);const q=1.2*1.01*Qv*dt/3600;
  return {type:'env',title:'현열 부하',q:`풍량 ${Qv}m³/h의 공기를 ${dt}℃ 가열할 때 필요한 <b>현열량</b>은? (공기 밀도 1.2kg/m³, 비열 1.01kJ/kg·K)`,steps:[],
    opts:choices(q,[{v:1.2*1.01*Qv*dt,why:'m³/h를 초(s)로 바꿔요(÷3600) → kW.'},{v:1.01*Qv*dt/3600,why:'밀도 1.2를 곱해 질량 유량으로 바꿔요.'},{v:q*2,why:'다시 계산해 봐요.'}],U('kW')),
    exp:`q = ρ·c·Q·Δt = 1.2×1.01×${Qv}×${dt}/3600 ≈ ${num(q)}kW`,tip:'현열 q = ρcQΔt (≈0.34 Q Δt W), 잠열 = ρ·Q·Δx·2501'};
}

/* ---------- 유형 7: 건폐율·용적률 ---------- */
function genLaw(){
  const site=pick([200,300,400,500,600,800,1000]);const k=pick(['bcr','far','max']);
  if(k==='bcr'){const ba=Math.round(site*pick([0.4,0.5,0.6,0.7])*R(80,100)/100);const r=ba/site*100;
    return {type:'law',title:'건폐율',q:`대지면적 ${site}m², 건축면적 ${ba}m²인 건축물의 <b>건폐율</b>은?`,steps:[],
      opts:choices(r,[{v:site/ba*100,why:'건축면적 ÷ 대지면적이에요.'},{v:r/2,why:'다시 계산해 봐요.'},{v:100-r,why:'건축면적 비율 그대로예요.'}],v=>num(v,1)+'%'),exp:`건폐율 = 건축면적/대지면적 × 100 = ${ba}/${site} × 100 ≈ ${num(r,1)}%`,tip:'건폐율 = 건축면적 / 대지면적'};}
  if(k==='far'){const fl=R(3,7);const per=Math.round(site*pick([0.4,0.5,0.6]));const base=per;const tot=per*fl;const r=tot/site*100;
    return {type:'law',title:'용적률',q:`대지면적 ${site}m²에 지하 1층(${base}m²), 지상 ${fl}층(각 층 ${per}m²)인 건축물의 <b>용적률</b>은?`,
      steps:[step('① 용적률 계산에 넣는 연면적은? (지하층 면적은 빼요)',tot,[{v:tot+base,why:'지하층 면적은 용적률 연면적에서 빼요.'},{v:per,why:'지상층 전체를 더해요.'}],U('m²'),`지상층 연면적 = ${per}×${fl} = ${tot}m²`)],
      opts:choices(r,[{v:(tot+base)/site*100,why:'지하층을 넣었어요.'},{v:per/site*100,why:'그건 건폐율이에요.'},{v:r/2,why:'다시 계산해 봐요.'}],v=>num(v,1)+'%'),exp:`용적률 = 지상층 연면적/대지면적 × 100 = ${tot}/${site} × 100 = ${num(r,1)}%`,tip:'용적률 연면적에서 빼는 것: 지하층, 지상 주차장(부속), 피난안전구역, 대피공간'};}
  const far=pick([150,200,250,300]);const bcr=pick([50,60]);const mx=site*far/100;
  return {type:'law',title:'최대 연면적',q:`대지면적 ${site}m², 건폐율 ${bcr}%, 용적률 ${far}%일 때 지을 수 있는 지상층 <b>최대 연면적</b>은?`,steps:[],
    opts:choices(mx,[{v:site*bcr/100,why:'그건 최대 건축면적(건폐율)이에요.'},{v:site*(far+bcr)/100,why:'용적률만 써요.'},{v:mx/2,why:'다시 계산해 봐요.'}],U('m²')),exp:`최대 연면적 = 대지면적 × 용적률 = ${site} × ${far}% = ${num(mx)}m²`,tip:'건축면적 ≤ 대지×건폐율, 지상 연면적 ≤ 대지×용적률'};
}


/* ---------- 유형 8: 시공 계산 (토량 환산·벽돌 매수) ---------- */
function genSite(){
  const k=pick(['soil','soil','brick']);
  if(k==='soil'){const V=pick([100,200,300,500,1000]);const L=pick([1.2,1.25,1.3]),Cc=pick([0.85,0.9]);const ask=pick(['L','C']);
    if(ask==='L') return {type:'site',title:'토량 환산 (흐트러진 상태)',q:`자연 상태 흙 ${V}m³를 파내면 <b>흐트러진 상태의 토량</b>은? (L = ${L}, C = ${Cc})`,steps:[],
      opts:choices(V*L,[{v:V*Cc,why:'C는 다져진 상태예요. 흐트러진 상태는 L을 곱해요.'},{v:V/L,why:'자연 → 흐트러짐은 곱해요.'},{v:V*L*Cc,why:'C는 쓰지 않아요.'}],U('m³')),
      exp:`흐트러진 토량 = 자연 토량 × L = ${V} × ${L} = ${num(V*L)}m³`,tip:'L = 흐트러진/자연(>1, 운반량), C = 다져진/자연(<1, 성토량)'};
    const need=V;const nat=need/Cc;
    return {type:'site',title:'토량 환산 (성토에 필요한 흙)',q:`다져진 상태로 ${need}m³를 성토하려면 <b>자연 상태 흙</b>은 얼마나 필요한가? (L = ${L}, C = ${Cc})`,steps:[],
      opts:choices(nat,[{v:need*Cc,why:'다져진 양 ÷ C 로 거꾸로 구해요.'},{v:need*L,why:'L은 흐트러진 상태예요.'},{v:need/Cc*L,why:'그건 운반할 흐트러진 토량이에요.'}],U('m³')),
      exp:`자연 토량 = 다져진 토량 ÷ C = ${need} ÷ ${Cc} ≈ ${num(nat)}m³ (운반량은 여기에 × L = ${num(nat*L)}m³)`,tip:'다져진 → 자연: ÷C, 자연 → 흐트러짐: ×L'};}
  const T=pick([['0.5B',75],['1.0B',149],['1.5B',224],['2.0B',298]]);const A=pick([10,20,30,50,100]);const n=T[1]*A;
  return {type:'site',title:'벽돌 정미량',q:`표준형 벽돌(190×90×57)로 벽면적 ${A}m²를 <b>${T[0]} 쌓기</b> 할 때 벽돌 <b>정미량</b>은? (할증 제외)`,
    steps:[step('① 1m²당 벽돌 매수는?',T[1],[[ '0.5B',75],['1.0B',149],['1.5B',224],['2.0B',298]].filter(x=>x[0]!==T[0]).map(x=>({v:x[1],why:`${x[1]}매는 ${x[0]}이에요.`})),v=>num(v,0)+'매',`${T[0]} = ${T[1]}매/m²`)],
    opts:choices(n,[{v:n*1.03,why:'정미량은 할증(붉은벽돌 3%)을 넣지 않아요.'},{v:n*1.05,why:'할증 제외예요.'},{v:n/2,why:'1m²당 매수를 다시 봐요.'}],v=>num(v,0)+'매'),
    exp:`정미량 = ${T[1]}매/m² × ${A}m² = ${num(n,0)}매 (소요량은 붉은벽돌 3%, 시멘트벽돌 5% 할증)`,tip:'표준형 0.5B 75 · 1.0B 149 · 1.5B 224 · 2.0B 298매/m²'};
}
const GEN={beam:genBeam,sec:genSec,buck:genBuck,defl:genDefl,rc:genRC,env:genEnv,law:genLaw,site:genSite};

/* ---------- 화면 ---------- */
let P=null,si=0,picked=new Set(),done=false,stepLog=[];
function next(){const t=st.type==='all'?pick(Object.keys(GEN)):st.type;P=GEN[t]();si=0;picked=new Set();done=false;stepLog=[];render();window.scrollTo({top:0});}
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
  let h=`<header class="ctop"><a class="back" href="index.html">← 패스메이트</a><div class="brand">계산 특훈<small>건축기사 필기</small></div><div class="cstat"><b>${st.streak}</b><span>연속</span></div></header>
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
