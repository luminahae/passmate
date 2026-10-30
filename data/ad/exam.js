// 시험 설정 - 데이터분석 준전문가(ADsP) 필기 (HAE)
window.EXAM={
 key:'ad', name:'데이터분석 준전문가(ADsP) 필기', short:'ADsP', brand:'ADsP 특훈', brandSub:'DATA ANALYTICS SEMI-PROFESSIONAL · WRITTEN',
 subj:['','데이터 이해','데이터 분석 기획','데이터 분석'],
 per:10, perS:[0,10,10,30], pts:[0,20,20,60], qpt:2, min:90, store:'passmate_ad_v1', cbtOrg:'한국데이터산업진흥원', examDate:'2026-10-31',
 autoNeg:true,
 isMain:s=>/기출$|^최신 경향/.test(s),
 hide:s=>s==='추가 문제',
 setLabel:s=>({'2023.02.26 기출':'2023년 제36회 기출','2023.05.20 기출':'2023년 제37회 기출','2023.08.19 기출':'2023년 제38회 기출','2025.02.22 기출':'2025년 제44회 기출','2025.05.24 기출':'2025년 제45회 기출','2026.02.07 기출':'2026년 제48회 기출 (3과목)'})[s]||s,
 mainLabel:'복원 기출 · 최신 경향 실전 모의고사',
 oldLabel:'자체 제작 예상 모의고사', oldFlat:true,
 oldNote:'출제 범위를 기준으로 새로 만든 예상문제예요. 기출을 다 풀었으면 여기서 실력을 더 다져 보세요.',
 poolName:'문제',
 ruleHTML:'<p>합격 기준: 총점 60점 이상 + 과목별 40% 이상(과락 없음). 1과목 10 · 2과목 10 · 3과목 30, 모두 50문항이고 한 문항 2점이에요.</p><div class="rule"><div><b>8·8·24↑</b><span>과목별 과락선</span></div><div><b>60↑</b><span>총점 합격선</span></div><div><b>2점</b><span>문항당 배점</span></div></div>',
 rand:{G:{t:'기출만',d:'복원 기출 36·37·38·44·45·48회 280문항 (48회는 3과목만)',f:q=>q.id[0]==='G'},P:{t:'기출+실전',d:'복원 기출 + 최신 경향 실전 모의고사',f:q=>q.id[0]==='G'||q.id[0]==='P'},A:{t:'전체',d:'모든 문제',f:()=>true}},
 cramSrc:[{v:'G',l:'복원 기출 전체',f:q=>q.id[0]==='G'},{v:'P',l:'최신 경향 실전 모의고사',f:q=>q.id[0]==='P'},{v:'M',l:'예상 모의고사 전체',f:q=>q.id[0]==='A'}].concat([1,2,3,4,5].map(i=>({v:'S'+i,l:'예상 모의고사 '+i+'회',f:q=>q.set==='모의고사 '+i+'회'}))),
 statLine:Q=>`(복원 기출 ${Q.filter(q=>q.id[0]==='G').length} + 최신 경향 실전 ${Q.filter(q=>q.id[0]==='P').length} + 예상 모의고사 ${Q.filter(q=>q.id[0]==='A'&&q.set!=='추가 문제').length} + 추가 ${Q.filter(q=>q.set==='추가 문제').length})`,
 progLabel:'진행 중인 회차',
 itemsLabel:'한 줄씩 보기',
 sumNote:'★는 시험에 자주 나오는 핵심이에요(출제 경향 기준). 핵심요약과 예상문제는 출제 범위를 기준으로 새로 만든 자료예요.',
 sumSearch:'검색 (예: 향상도, 표출화, VIF)',
 qSearch:'두 글자 이상 (예: 정밀도, CRISP-DM, 차분)',
 pdfs:{full:{url:'pdf/adsp-summary.pdf',name:'adsp-summary.pdf'}}
};
