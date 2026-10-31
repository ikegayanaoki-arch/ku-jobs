const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
class Element { constructor(){this.children=[];this.innerHTML='';this.attrs={};} replaceChildren(...children){this.children=children;} setAttribute(k,v){this.attrs[k]=v;} }
const elements={}; const document={getElementById:id=>elements[id]??=new Element(),createElement:()=>new Element()};
const ctx=vm.createContext({window:{},document});
vm.runInContext(fs.readFileSync('employment_data.js','utf8'),ctx);
vm.runInContext(fs.readFileSync('app.js','utf8'),ctx);
const merged=vm.runInContext(`aggregate([{destinations:['ＮＴＴデータ','NTTデータ','企業A']},{destinations:['NTTデータ','企業B']}])`,ctx);
assert.equal(merged.length,3);assert.equal(merged.find(e=>e.name==='NTTデータ').records.length,2);
assert.equal(merged[0].name,'NTTデータ');
for(let i=1;i<merged.length;i++)assert(merged[i-1].records.length>=merged[i].records.length);
assert.equal((elements.results.innerHTML.match(/class="merged-list"/g)||[]).length,1);
assert(!elements.results.innerHTML.includes('class="card"'));
const before=elements['result-count'].textContent;
elements.years.children.find(b=>b.textContent==='すべて').onclick();
assert.notEqual(elements['result-count'].textContent,before);
assert.equal((elements.results.innerHTML.match(/class="merged-list"/g)||[]).length,1);
elements.degrees.children.find(b=>b.textContent==='学府博士').onclick();
elements.graduates.children.find(b=>b.textContent==='工学府').onclick();
assert(elements.results.innerHTML.includes('2013年度'));
assert(elements.results.innerHTML.includes('2025年度'));
assert.equal((elements.results.innerHTML.match(/class="merged-list"/g)||[]).length,1);
elements.years.children.find(b=>b.textContent==='2025').onclick();
elements.graduates.children.find(b=>b.textContent==='工学府').onclick();
elements.graduates.children.find(b=>b.textContent==='人文科学府').onclick();
assert(elements.results.innerHTML.includes('この条件の就職先は公開されていません'));
assert(elements.results.innerHTML.includes('少人数のため非公開'));
elements.reset.onclick();assert.equal(elements['result-count'].textContent,before);
const selectedUnits=()=>Array.from(vm.runInContext('state.faculties',ctx));
// Multiple units in both groups form a union; year and degree stay independent.
for(const name of ['工学部','理学部'])elements.faculties.children.find(b=>b.textContent===name).onclick();
for(const name of ['工学府','理学府'])elements.graduates.children.find(b=>b.textContent===name).onclick();
assert.deepEqual(selectedUnits(),['工学部','理学部','工学府','理学府']);
for(const name of selectedUnits())assert(elements['active-filters'].innerHTML.includes(name));
const expected=vm.runInContext("aggregate(data.filter(r=>r.year===2025&&state.faculties.includes(r.faculty))).length",ctx);
assert.equal(elements['result-count'].textContent,`${expected.toLocaleString()} 件`);
elements.degrees.children.find(b=>b.textContent==='学府博士').onclick();
elements.years.children.find(b=>b.textContent==='2013').onclick();
assert.deepEqual(selectedUnits(),['工学部','理学部','工学府','理学府']);
assert.equal(vm.runInContext('state.degree',ctx),'博士');
elements.faculties.children.find(b=>b.textContent==='工学部').onclick();
assert.deepEqual(selectedUnits(),['理学部','工学府','理学府']);
elements.faculties.children.find(b=>b.textContent==='選択解除').onclick();
assert.deepEqual(selectedUnits(),['工学府','理学府']);
assert.equal(vm.runInContext('state.year',ctx),'2013');
assert.equal(vm.runInContext('state.degree',ctx),'博士');
elements.faculties.children.find(b=>b.textContent==='すべて選択').onclick();
assert(selectedUnits().includes('工学府')&&selectedUnits().includes('理学府')&&selectedUnits().includes('文学部'));
elements.faculties.children.find(b=>b.textContent==='選択解除').onclick();
elements.graduates.children.find(b=>b.textContent==='選択解除').onclick();
assert.equal(selectedUnits().length,0);
elements.reset.onclick();assert.equal(elements['result-count'].textContent,before);

// Visual summaries retain the selected conditions and reflect course counts.
assert(elements['active-filters'].innerHTML.includes('2025年度'));
assert(elements['active-filters'].innerHTML.includes('すべての課程'));
assert(elements['active-filters'].innerHTML.includes('すべての学部・学府'));
assert(elements.results.innerHTML.includes('掲載件数（降順）'));
for(const course of ['undergrad','masters','doctoral']) {
 assert(elements.results.innerHTML.includes(`degree-${course}`));
 assert.equal(elements.degrees.children.find(b=>b.attrs['data-degree']===course).attrs['aria-pressed'],'false');
}
const tracks=[...elements.results.innerHTML.matchAll(/class="bar-track"[^>]*>(.*?)<\/span><span class="source-count"/g)];
assert(tracks.length>0);
const totalWidth=t=>[...t.matchAll(/width:([0-9.]+)%/g)].reduce((sum,m)=>sum+Number(m[1]),0);
assert(Math.abs(totalWidth(tracks[0][1])-100)<0.001);
for(const track of tracks)assert(totalWidth(track[1])>0&&totalWidth(track[1])<=100.001);
elements.degrees.children.find(b=>b.textContent==='学府修士').onclick();
assert(elements['active-filters'].innerHTML.includes('degree-masters'));
assert.equal(elements.degrees.children.find(b=>b.textContent==='学府修士').attrs['aria-pressed'],'true');
elements.reset.onclick();

const records=ctx.window.EMPLOYMENT_DATA;
assert.equal(records.length,579);
for(const r of records){assert(Array.isArray(r.destinations)); assert(r.pdf.startsWith('https://www.kyushu-u.ac.jp/f/'));assert(!r.pdf.includes('%25'));if(r.private)assert.equal(r.destinations.length,0);}
const index=fs.readFileSync('index.html','utf8');assert(!index.includes('id="search"'));assert(!index.includes('class="stats"'));
console.log('PASS: aggregation, width normalization, deduplication, provenance, all-year / degree / faculty filters, private records, reset, removed UI.');
