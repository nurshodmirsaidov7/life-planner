"use strict";
// ---------- Learn: courses, books, topics; progress rings, study time, links from Plan ----------
const TYPES=[["course","Course","school"],["book","Book","book-2"],["topic","Topic","bulb"]];
const STATUS=[["now","Learning now"],["next","Up next"],["done","Finished"]];
const UNITS=["units","lessons","chapters","pages","weeks","videos","problems","modules"];
let lfilter="all",ledit="",lview="";
const litem=id=>S.learn.find(l=>l.id===id);
const ldone=l=>l.base+sum(S.study.filter(s=>s.item===l.id),"units");
const lpct=l=>l.total?Math.min(100,ldone(l)/l.total*100):0;
const lmin=l=>sum(S.study.filter(s=>s.item===l.id),"min");
const ticon=t=>(TYPES.find(x=>x[0]===t)||TYPES[0])[2];

// A Plan task linked to a learning item adds its units when ticked and removes them when unticked.
function syncLearn(t){
  S.study=S.study.filter(s=>s.src!==t.id);
  const l=t.x&&t.lid&&litem(t.lid);
  if(l)S.study.push({id:uid(),d:t.d,item:l.id,min:0,units:t.lu||1,note:t.t,src:t.id});
  S.learn.forEach(checkFinish);
}
function checkFinish(l){
  if(l.st!=="done"&&l.total&&ldone(l)>=l.total){l.st="done";l.fin=today();l.auto=true;toast("🎉 "+T("You finished {x}!",{x:l.name}))}
  else if(l.st==="done"&&l.auto&&ldone(l)<l.total){l.st="now";l.fin="";l.auto=false}   // undo only an automatic finish
}
// Unit names typed by the user stay as typed; the suggested ones are translated.
const lunit=l=>UNITS.includes(l.unit)?T(l.unit):esc(l.unit);
const lprog=l=>l.total?`${r1(ldone(l))} / ${l.total} ${lunit(l)}`:T("{x} done",{x:r1(ldone(l))+" "+lunit(l)});
const lrow=l=>`<div class="rw tap" data-a="lv" data-id="${l.id}"><span class="ci" style="--cc:${pal(l.c)}">${ic(ticon(l.type),"s")}</span><span class="g">${esc(l.name)}${l.total?`<div style="margin-top:5px">${bar(lpct(l),false,pal(l.c))}</div>`:""}<div class="meta">${lprog(l)}${lmin(l)?" · "+hm(lmin(l)):""}${l.st==="done"&&l.fin?" · "+T("finished {d}",{d:sh(dt(l.fin),{day:"numeric",month:"short"})}):""}</div></span>
  ${l.st==="next"?`<button class="btn sm" data-a="lst" data-id="${l.id}">${ic("player-play","s")} ${T("Start")}</button>`:l.total?`<span class="v">${Math.round(lpct(l))}%</span>`:""}</div>`;

V.learn={nav:null,render(){
  const L=S.learn.filter(l=>lfilter==="all"||l.type===lfilter),now0=new Date(),W=wd(mon(now0)),mk=today().slice(0,7);
  const by=st=>L.filter(l=>l.st===st),now=by("now"),cards=now.filter(l=>l.total&&l.type!=="book"),rest=now.filter(l=>!cards.includes(l));
  const wkMin=sum(S.study.filter(s=>inR(s.d,W)),"min"),mMin=sum(S.study.filter(s=>s.d.startsWith(mk)),"min"),stk=streak(new Set(S.study.map(s=>s.d)));
  const wks=[...Array(8)].map((_,i)=>addD(mon(now0),-7*(7-i))),from=key(wks[0]);
  const recent=S.study.filter(s=>s.d>=from&&s.min),tot={};recent.forEach(s=>tot[s.item]=(tot[s.item]||0)+s.min);
  const top=Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
  const series=top.map(id=>{const l=litem(id)||{name:T("Deleted"),c:7};return{label:l.name,color:pal(l.c),f:s=>s.item===id}});
  if(Object.keys(tot).length>4)series.push({label:T("Other"),color:css("--faint"),f:s=>!top.includes(s.item)});
  const timeC=bars(wks.map(w=>sh(w,{day:"numeric",month:"short"})),series.map(x=>({label:x.label,color:x.color,data:wks.map(w=>r1(sum(recent.filter(s=>inR(s.d,wd(w))&&x.f(s)),"min")/60))})),
    {stacked:true,legend:series.length>1,fmt:v=>v+T("h"),tick:v=>v+T("h"),label:T("Study time per week")});
  const sess=[...S.study].sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0).slice(0,12);
  return head(T("Learn"),{sub:T("This week · {a} · this month {b}",{a:hm(wkMin),b:hm(mMin)}),right:fire(stk)})+seg("lf",[["all",T("All")],["course",T("Courses")],["book",T("Books")],["topic",T("Topics")]],lfilter)+`<div class="stack">
  ${cards.length?`<div class="lcards">${cards.map(l=>`<button class="lcard" data-a="lv" data-id="${l.id}">${ring1(lpct(l)/100,pal(l.c),Math.round(lpct(l))+"%","",76,l.name)}<b>${esc(l.name)}</b><span class="lb">${lprog(l)}</span></button>`).join("")}</div>`:""}
  ${tile(`<h2><span>${T("Learning now")}</span><button class="btn sm p" data-a="ladd">${ic("plus","s")} ${T("Add")}</button></h2>${rest.map(lrow).join("")||(cards.length?`<div class="empty">${T("Tap a ring to log progress.")}</div>`:`<div class="empty">${T("Add a course, book or topic you are learning.")}</div>`)}`)}
  ${tile(`<h2>${T("Up next")}</h2>${by("next").map(lrow).join("")||`<div class="empty">${T("Plan what to learn next: add an item with status “Up next”.")}</div>`}`)}
  ${tile(`<h2>${T("Study time per week")}</h2>${recent.length?chart(timeC,190):`<div class="empty">${T("Log study sessions with minutes to see this chart.")}</div>`}`)}
  ${by("done").length?tile(`<h2>${T("Finished")}</h2>${by("done").map(lrow).join("")}`):""}
  ${sess.length?tile(`<details><summary>${T("Recent sessions")}</summary>${sess.map(s=>{const l=litem(s.item);return `<div class="rw"><span class="g">${l?esc(l.name):T("Deleted item")}<div class="meta">${dayLbl(dt(s.d))}${s.units?" · +"+r1(s.units)+" "+(l?lunit(l):""):""}${s.min?" · "+hm(s.min):""}${s.src?" · "+T("from a task"):""}${s.note?" · "+esc(s.note):""}</div></span>${s.src?"":`<button class="ib" data-a="lsd" data-id="${s.id}" aria-label="${T("Delete")}">${ic("x","s")}</button>`}</div>`}).join("")}</details>`):""}
  </div>`;
}};

// Item detail: quick +1, log a session, edit.
function itemSheet(){
  const l=litem(lview);if(!l)return`<div class="empty">${T("Deleted")}</div>`;
  return `<div class="ringbox" style="margin-bottom:12px">${ring1(lpct(l)/100,pal(l.c),l.total?Math.round(lpct(l))+"%":r1(ldone(l)),l.total?"":lunit(l),96)}<div class="legend"><div class="big">${esc(l.name)}</div><div class="lb">${lprog(l)}<br>${T("{x} studied",{x:hm(lmin(l))})}</div></div></div>
  ${l.st!=="done"?`<button class="btn p w" data-a="l1" data-id="${l.id}">${ic("plus","s")} ${T("1 more done")}</button>`:""}
  <div data-form style="margin-top:14px">${studyFields(l.id)}<button class="btn w" data-a="ladd2">${T("Save session")}</button></div>
  <div class="f" style="margin-top:12px"><button class="btn" data-a="le" data-id="${l.id}">${ic("pencil","s")} ${T("Edit")}</button>${l.note?`<span class="lb" style="align-self:center">${esc(l.note)}</span>`:""}</div>`;
}
function studyFields(sel){
  const items=S.learn.filter(l=>l.st!=="done"||l.id===sel);
  if(!items.length)return`<div class="empty">${T("Add something you are learning first.")}</div>`;
  return `${sel?`<input type="hidden" name="item" value="${sel}">`:`<label class="fl"><span>${T("What did you study?")}</span><select name="item">${items.map(l=>opt(l.id,l.name)).join("")}</select></label>`}
  <div class="f"><label class="fl n"><span>${T("Minutes")}</span><input name="min" type="number" inputmode="numeric" min="0" placeholder="45"></label><label class="fl n"><span>${T("Units done")}</span><input name="units" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></label></div>
  <div class="f"><label class="fl"><span>${T("Date")}</span><input type="date" name="d" value="${today()}"></label><label class="fl"><span>${T("Note (optional)")}</span><input name="note" placeholder="${T("Chapter 3: variance")}"></label></div>`;
}
function learnSheet(){
  const l=ledit?litem(ledit):{name:"",type:lfilter==="all"?"course":lfilter,st:"now",unit:"units",total:"",base:"",note:""};
  return `<div data-form><label class="fl"><span>${T("Name")}</span><input name="name" value="${esc(l.name)}" placeholder="${T("Khan Academy Statistics")}" autofocus></label>
  <div class="f"><label class="fl"><span>${T("Type")}</span><select name="type">${TYPES.map(([v,n])=>opt(v,T(n),v===l.type)).join("")}</select></label><label class="fl"><span>${T("Status")}</span><select name="st">${STATUS.map(([v,n])=>opt(v,T(n),v===l.st)).join("")}</select></label></div>
  <div class="f"><label class="fl n"><span>${T("Total size")}</span><input name="total" type="number" inputmode="decimal" min="0" step="any" value="${l.total||""}" placeholder="12"></label>
  <label class="fl n"><span>${T("Measured in")}</span><select name="unit">${UNITS.map(u=>opt(u,T(u),u===l.unit)).join("")}${UNITS.includes(l.unit)?"":opt(l.unit,l.unit,true)}</select></label><label class="fl n"><span>${T("Already done")}</span><input name="base" type="number" inputmode="decimal" min="0" step="any" value="${l.base||""}" placeholder="0"></label></div>
  <label class="fl"><span>${T("Note (optional)")}</span><input name="note" value="${esc(l.note)}" placeholder="${T("Link, author, why it matters")}"></label>
  <button class="btn p w" data-a="lsave">${ledit?T("Save"):T("Add")}</button>${ledit?`<button class="btn w" data-a="ldel" style="margin-top:8px">${ic("trash","s")} ${T("Delete")}</button>`:""}</div>`;
}

A.lf=b=>{lfilter=b.dataset.v;anim=true};
A.lv=(b,f,F,e)=>{if(e&&e.target.closest("[data-a=lst]"))return false;lview=b.dataset.id;sheet(litem(lview).name,itemSheet);return false};
A.ladd=()=>{ledit="";sheet(T("Add to learning"),learnSheet);return false};
A.le=b=>{ledit=b.dataset.id;sheet(T("Edit"),learnSheet);return false};
A.lsave=(b,f,F)=>{const name=F.v("name");if(!name){toast(T("Give it a name"));return false}
  const o={name,type:F.v("type"),st:F.v("st"),unit:F.v("unit")||"units",total:F.n("total"),base:F.n("base"),note:F.v("note"),auto:false};
  if(ledit){const l=litem(ledit);if(o.st==="done"&&l.st!=="done")o.fin=today();if(o.st!=="done")o.fin="";Object.assign(l,o)}
  else{const used=S.learn.filter(l=>l.st!=="done").map(l=>l.c),c=[...Array(8).keys()].find(i=>!used.includes(i))??S.learn.length%8;
    S.learn.push({id:uid(),...o,c,fin:o.st==="done"?today():""})}
  closeSheet();toast(ledit?T("Saved"):T("Added"))};
A.ldel=()=>{const l=litem(ledit);snap();
  S.study=S.study.filter(s=>s.item!==l.id);S.tasks.forEach(t=>{if(t.lid===l.id){t.lid="";t.lu=0}});S.rec.forEach(r=>{if(r.lid===l.id){r.lid="";r.lu=0}});S.learn=S.learn.filter(x=>x!==l);closeSheet();undoToast(T("Deleted {x}",{x:l.name}))};
A.lst=b=>{litem(b.dataset.id).st="now";toast(T("Started"))};
A.l1=b=>{const l=litem(b.dataset.id);S.study.push({id:uid(),d:today(),item:l.id,min:0,units:1,note:"",src:""});checkFinish(l);try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}toast(`+1 ${lunit(l)}: ${l.name}`)};
A.ladd2=(b,f,F)=>{const l=litem(F.v("item")),min=F.n("min"),units=F.n("units");if(!l||(!min&&!units)){toast(T("Enter minutes or units done"));return false}snap();
  S.study.push({id:uid(),d:F.v("d")||today(),item:l.id,min,units,note:F.v("note"),src:""});if(l.st==="next")l.st="now";checkFinish(l);closeSheet();undoToast(T("Session saved"))};
A.lsd=b=>{snap();S.study=S.study.filter(s=>s.id!==b.dataset.id);S.learn.forEach(checkFinish);undoToast(T("Session deleted"))};
