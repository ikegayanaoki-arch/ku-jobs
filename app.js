'use strict';
const data = window.EMPLOYMENT_DATA;
const state = { year: '2025', degree: '', faculties: [] };
const $ = id => document.getElementById(id);
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm = text => text.normalize('NFKC').toLocaleLowerCase().replace(/\s/g, '');
const unique = list => [...new Set(list)];
const degreeLabel = d => ({'学部':'学部','修士':'学府修士','博士':'学府博士'}[d] || d);
const degreeClass = d => ({'学部':'undergrad','修士':'masters','博士':'doctoral'}[d] || 'all');
const era = year => year >= 2019 ? `令和${year === 2019 ? '元' : year - 2018}年度` : `平成${year - 1988}年度`;
function button(label, key, value) {
 const el = document.createElement('button'); el.type = 'button'; el.textContent = label;
 el.setAttribute('aria-pressed', String(state[key] === value));
 if (key === 'degree' && value) el.setAttribute('data-degree', degreeClass(value));
 el.onclick = () => {
  state[key] = value;
  render();
 };
 return el;
}
function facultyButton(name) {
 const el=document.createElement('button'); el.type='button'; el.textContent=name;
 el.setAttribute('aria-pressed',String(state.faculties.includes(name)));
 el.onclick=()=>{state.faculties=state.faculties.includes(name)?state.faculties.filter(n=>n!==name):[...state.faculties,name];render();};
 return el;
}
function controls() {
 $('years').replaceChildren(button('すべて', 'year', ''), ...unique(data.map(r=>r.year)).sort((a,b)=>b-a).map(y=>button(String(y), 'year', String(y))));
 $('degrees').replaceChildren(...['', '学部', '修士', '博士'].map(d=>button(degreeLabel(d) || 'すべて', 'degree', d)));
 for (const [id, graduate] of [['faculties',false],['graduates',true]]) {
  const names=unique(data.filter(r=>(r.degree !== '学部') === graduate).map(r=>r.faculty));
  const all=document.createElement('button');all.type='button';all.textContent='すべて選択';all.className='group-action';
  all.onclick=()=>{state.faculties=unique([...state.faculties,...names]);render();};
  const clear=document.createElement('button');clear.type='button';clear.textContent='選択解除';clear.className='group-action';
  clear.onclick=()=>{state.faculties=state.faculties.filter(n=>!names.includes(n));render();};
  $(id).replaceChildren(all,clear,...names.map(facultyButton));
 }
}
// Merge only typographical differences; historical company names stay distinct.
function aggregate(records) {
 const merged=new Map();
 for (const r of records) {
  for (const raw of r.destinations) {
   const name=raw.normalize('NFKC').replace(/\s+/g,' ').trim().replace(/\s+等$/,'');
   const key=norm(name);
   if (!key || /^(等|など|ほか)$/.test(key)) continue;
   if (!merged.has(key)) merged.set(key,{name,records:[]});
   const entry=merged.get(key);
   if (!entry.records.includes(r)) entry.records.push(r);
  }
 }
 return [...merged.values()].sort((a,b)=>b.records.length-a.records.length || a.name.localeCompare(b.name,'ja'));
}
function sourceLink(r) {
 return `<a class="provenance" href="${(r.pdf.startsWith('https://') ? esc(r.pdf) : encodeURI(r.pdf))}#page=${r.page}" target="_blank" rel="noopener"><span class="source-year">${r.year}年度</span><span class="badge degree-${degreeClass(r.degree)}">${degreeLabel(r.degree)}</span><span>${esc(r.faculty)}</span><span class="source-arrow" aria-hidden="true">PDF ↗</span></a>`;
}
function render() {
 controls();
 const selected=data.filter(r=>(!state.year||r.year===Number(state.year))&&(!state.degree||r.degree===state.degree)&&(!state.faculties.length||state.faculties.includes(r.faculty))).sort((a,b)=>b.year-a.year);
 const entries=aggregate(selected);
 $('selection').textContent='現在の表示条件';
 $('result-count').textContent=`${entries.length.toLocaleString()} 件`;
 $('active-filters').innerHTML=`<span class="condition"><span class="condition-label">年度</span><strong>${state.year ? `${state.year}年度（${era(Number(state.year))}）` : 'すべての年度'}</strong></span><span class="condition"><span class="condition-label">課程</span><strong class="badge degree-${degreeClass(state.degree)}">${degreeLabel(state.degree) || 'すべての課程'}</strong></span><span class="condition"><span class="condition-label">学部・学府</span><strong>${state.faculties.length?state.faculties.map(n=>`<span class="selected-unit">${esc(n)}</span>`).join(''):'すべての学部・学府'}</strong></span>`;
 const maxCount=entries[0]?.records.length || 1;
 const legend=['学部','修士','博士'].map(d=>`<span class="legend-item"><span class="degree-dot degree-${degreeClass(d)}" aria-hidden="true"></span>${degreeLabel(d)}</span>`).join('');
 const unavailable=selected.filter(r=>!r.hasDestinations);
 $('results').innerHTML=selected.length ? `
  <div class="chart-legend" aria-label="課程の色分け">${legend}</div><div class="merged-list"><div class="list-heading"><span>就職先</span><span>掲載件数（降順）</span></div>
  ${entries.length?entries.map(e=>{
 const counts=['学部','修士','博士'].map(d=>({degree:d,count:e.records.filter(r=>r.degree===d).length}));
 const bars=counts.filter(c=>c.count).map(c=>`<span class="bar-segment degree-${degreeClass(c.degree)}" style="width:${(c.count/maxCount*100).toFixed(4)}%"></span>`).join('');
 const breakdown=counts.filter(c=>c.count).map(c=>`${degreeLabel(c.degree)} ${c.count}件`).join('、');
 return `<details class="destination-row"><summary><span class="destination-name">${esc(e.name)}</span><span class="count-chart"><span class="bar-track" aria-hidden="true">${bars}</span><span class="source-count"><strong>${e.records.length}</strong> 件 <span class="chevron" aria-hidden="true">⌄</span></span><span class="sr-only">掲載件数。内訳：${breakdown}</span></span></summary><div class="provenance-list">${e.records.map(sourceLink).join('')}</div></details>`;}).join(''):'<p class="no-destinations">この条件の就職先は公開されていません。</p>'}</div>
  <div class="list-footnote">同じ名称の掲載先を合算しています。掲載元の件数は就職者数ではありません。</div>
  ${unavailable.length?`<details class="unavailable"><summary>非公開・記載なしの資料（${unavailable.length} 件）</summary>${unavailable.map(r=>`<div class="unavailable-row">${sourceLink(r)}<p>${r.private?'少人数のため非公開':'元資料に就職先の記載なし'}</p></div>`).join('')}</details>`:''}
  <details class="source-documents"><summary>元資料・抽出テキストを確認（${selected.length} 区分）</summary>${selected.map(r=>`<details class="source-record"><summary>${r.year}年度 · ${degreeLabel(r.degree)} · ${esc(r.faculty)}</summary>${sourceLink(r)}${r.transcribed?'<p class="card-note">この年度は画像から転記しています。表記は元PDFでも確認してください。</p>':''}<pre>${esc(r.source)}</pre></details>`).join('')}</details>
 ` : '<div class="empty">該当する資料がありません。<br>年度・課程・学部・学府を変更してください。</div>';
}
$('reset').onclick=()=>{Object.assign(state,{year:'2025',degree:'',faculties:[]});render();};
render();
