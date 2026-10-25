"use strict";
// ---------- Learning: courses, books, topics; progress, study time, links from Plan ----------
const TYPES=[["course","Course","🎓"],["book","Book","📖"],["topic","Topic","💡"]];
const STATUS=[["now","Learning now"],["next","Up next"],["done","Finished"]];
const UNITS=["units","lessons","chapters","pages","weeks","videos","problems","modules"];
let lfilter="all",ledit="";
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
  if(l.st!=="done"&&l.total&&ldone(l)>=l.total){l.st="done";l.fin=today();l.auto=true;toast(`🎉 You finished ${l.name}!`)}
  else if(l.st==="done"&&l.auto&&ldone(l)<l.total){l.st="now";l.fin="";l.auto=false}   // undo only an automatic finish
}

function lrow(l){
  const d=ldone(l),p=lpct(l),m=lmin(l);
  return `<div class="li"><h3><span class="tt" data-a="le" data-id="${l.id}">${ticon(l.type)} ${esc(l.name)}</span>
  ${l.st==="now"?`<button class="sm" data-a="l1" data-id="${l.id}" title="Add 1 ${esc(l.unit)}">+1</button>`:l.st==="next"?`<button class="sm" data-a="lst" data-id="${l.id}">Start</button>`:""}</h3>
  ${l.total?`<div style="margin-top:6px">${bar(p,false,pal(l.c))}</div>`:""}
  <div class="meta"><span>${l.total?`${r1(d)} / ${l.total} ${esc(l.unit)} · <b style="color:var(--ink)">${Math.round(p)}%</b>`:`${r1(d)} ${esc(l.unit)} done · <a href="#" data-a="le" data-id="${l.id}">set a total</a>`}</span>
  <span>${m?"⏱ "+hm(m):""}${l.st==="done"&&l.fin?" · finished "+sh(dt(l.fin),{day:"numeric",month:"short",year:"numeric"}):""}</span></div>
  ${l.note?`<small class="mute">${esc(l.note)}</small>`:""}</div>`;
}

V.learn={title:"Learning",nav:null,render(){
  const L=S.learn.filter(l=>lfilter==="all"||l.type===lfilter),T=new Date(),W=wd(mon(T)),mk=today().slice(0,7);
  const by=st=>L.filter(l=>l.st===st);
  const wkMin=sum(S.study.filter(s=>inR(s.d,W)),"min"),mMin=sum(S.study.filter(s=>s.d.startsWith(mk)),"min");
  // study time per week, top 4 subjects + Other
  const wks=[...Array(8)].map((_,i)=>addD(mon(T),-7*(7-i))),from=key(wks[0]);
  const recent=S.study.filter(s=>s.d>=from&&s.min),tot={};recent.forEach(s=>tot[s.item]=(tot[s.item]||0)+s.min);
  const top=Object.entries(tot).sort((a,b)=>b[1]-a[1]).slice(0,4).map(x=>x[0]);
  const series=top.map(id=>{const l=litem(id)||{name:"Deleted",c:7};return{label:l.name,color:pal(l.c),f:s=>s.item===id}});
  if(Object.keys(tot).length>4)series.push({label:"Other",color:css("--mute"),f:s=>!top.includes(s.item)});
  const timeC=bars(wks.map(w=>sh(w,{day:"numeric",month:"short"})),series.map(x=>({label:x.label,color:x.color,data:wks.map(w=>r1(sum(recent.filter(s=>inR(s.d,wd(w))&&x.f(s)),"min")/60))})),
    {stacked:true,legend:series.length>1,fmt:v=>v+" h",tick:v=>v+"h",label:"Study hours per week by subject"});
  const m30=S.study.filter(s=>s.d>=key(addD(T,-29))&&s.min),t30={};m30.forEach(s=>t30[s.item]=(t30[s.item]||0)+s.min);
  const t30L=Object.entries(t30).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...Object.values(t30));
  const sess=[...S.study].sort((a,b)=>a.d<b.d?1:a.d>b.d?-1:0).slice(0,12);
  const logItems=S.learn.filter(l=>l.st!=="done");
  return seg("lf",[["all","All"],["course","Courses"],["book","Books"],["topic","Topics"]],lfilter)+`
  <div class="stats">${stat("Learning now",S.learn.filter(l=>l.st==="now").length,S.learn.filter(l=>l.st==="next").length+" up next")}${stat("This week",hm(wkMin),"study time")}
  ${stat("This month",hm(mMin),"study time")}${stat("Finished",S.learn.filter(l=>l.st==="done").length,"courses, books & topics")}</div>
  <div class="two"><div class="card"><h2><span>📚 Learning now</span><button class="sm p" data-a="ladd">+ Add</button></h2>${by("now").map(lrow).join("")||'<div class="empty">Nothing in progress. Add a course, book or topic.</div>'}</div>
  <div class="card soft" data-form><h2>Log study</h2>${logItems.length?`<label class="fl"><span>What did you study?</span><select name="item">${logItems.map(l=>opt(l.id,ticon(l.type)+" "+l.name)).join("")}</select></label>
  <div class="f"><label class="fl n"><span>Minutes</span><input name="min" type="number" inputmode="numeric" min="0" placeholder="45"></label><label class="fl n"><span>Units done</span><input name="units" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></label><label class="fl"><span>Date</span><input type="date" name="d" value="${today()}"></label></div>
  <input name="note" placeholder="Note (optional), e.g. Chapter 3: variance" style="width:100%"><button class="p" data-a="ladd2" style="width:100%;margin-top:8px">Save session</button>
  <p class="mute" style="margin-bottom:0"><small>Tip: link a Plan task to a course and ticking it adds progress automatically.</small></p>`:'<div class="empty">Add something you are learning first.</div>'}</div></div>
  <div class="two"><div class="card"><h2>Study time per week</h2>${recent.length?chart(timeC,220):'<div class="empty">Log study sessions with minutes to see this chart.</div>'}</div>
  <div class="card"><h2>Time by subject <small class="mute">last 30 days</small></h2>${t30L.map(([id,m])=>{const l=litem(id)||{name:"Deleted",c:7};return `<div class="cat"><span><i class="dot" style="background:${pal(l.c)}"></i>${esc(l.name)}</span>${bar(m/mx*100,false,pal(l.c))}<span>${hm(m)}</span></div>`}).join("")||'<div class="empty">No study time logged yet.</div>'}</div></div>
  <div class="two"><div class="card"><h2>⏭️ Up next</h2>${by("next").map(lrow).join("")||'<div class="empty">Plan what to learn next. Add an item with status “Up next”.</div>'}</div>
  <div class="card"><h2>✅ Finished</h2>${by("done").map(lrow).join("")||'<div class="empty">Nothing finished yet. Keep going!</div>'}</div></div>
  <div class="card"><h2>Recent sessions</h2>${sess.map(s=>{const l=litem(s.item);return `<div class="row"><span class="g">${l?ticon(l.type)+" "+esc(l.name):"Deleted item"} <small class="mute">${dayLbl(dt(s.d))}${s.units?" · +"+r1(s.units)+" "+esc(l?l.unit:""):""}${s.min?" · "+hm(s.min):""}${s.src?" · from Plan":""}${s.note?" · "+esc(s.note):""}</small></span>${s.src?"":`<button class="ib" data-a="lsd" data-id="${s.id}" aria-label="Delete">✕</button>`}</div>`}).join("")||'<div class="empty">No sessions yet.</div>'}</div>`;
}};

function learnSheet(){
  const l=ledit?litem(ledit):{name:"",type:lfilter==="all"?"course":lfilter,st:"now",unit:"units",total:"",base:"",note:""};
  return `<div data-form><label class="fl"><span>Name</span><input name="name" value="${esc(l.name)}" placeholder="e.g. Khan Academy Statistics"></label>
  <div class="f"><label class="fl"><span>Type</span><select name="type">${TYPES.map(([v,n,i])=>opt(v,i+" "+n,v===l.type)).join("")}</select></label><label class="fl"><span>Status</span><select name="st">${STATUS.map(([v,n])=>opt(v,n,v===l.st)).join("")}</select></label></div>
  <div class="f"><label class="fl n"><span>Total size</span><input name="total" type="number" inputmode="decimal" min="0" step="any" value="${l.total||""}" placeholder="e.g. 12"></label>
  <label class="fl n"><span>Measured in</span><input name="unit" list="lu" value="${esc(l.unit)}"></label><label class="fl n"><span>Done before tracking</span><input name="base" type="number" inputmode="decimal" min="0" step="any" value="${l.base||""}" placeholder="0"></label></div>
  <datalist id="lu">${UNITS.map(u=>`<option value="${u}">`).join("")}</datalist>
  <label class="fl"><span>Note (optional)</span><input name="note" value="${esc(l.note)}" placeholder="Link, author, why it matters…"></label>
  ${ledit?`<p class="mute"><small>Progress: ${r1(ldone(l))} ${esc(l.unit)} done, ${hm(lmin(l))} studied.</small></p>`:""}
  <div class="btns" style="margin-top:10px"><button class="p" data-a="lsave">${ledit?"Save":"Add"}</button>${ledit?'<button data-a="ldel">Delete</button>':""}</div></div>`;
}

A.lf=b=>{lfilter=b.dataset.v};
A.ladd=()=>{ledit="";sheet("Add to learning",learnSheet);return false};
A.le=(b,f,F,e)=>{e.preventDefault();ledit=b.dataset.id;sheet("Edit",learnSheet);return false};
A.lsave=(b,f,F)=>{const name=F.v("name");if(!name){toast("Give it a name");return false}
  const o={name,type:F.v("type"),st:F.v("st"),unit:F.v("unit")||"units",total:F.n("total"),base:F.n("base"),note:F.v("note"),auto:false};
  if(ledit){const l=litem(ledit);if(o.st==="done"&&l.st!=="done")o.fin=today();if(o.st!=="done")o.fin="";Object.assign(l,o)}
  else{const used=S.learn.filter(l=>l.st!=="done").map(l=>l.c),c=[...Array(8).keys()].find(i=>!used.includes(i))??S.learn.length%8;
    S.learn.push({id:uid(),...o,c,fin:o.st==="done"?today():""})}
  closeSheet();toast(ledit?"Saved":"Added")};
A.ldel=async()=>{const l=litem(ledit),n=S.study.filter(s=>s.item===l.id).length;
  if(!await ask(`<h2>Delete “${esc(l.name)}”?</h2><p class="mute">${n?`Its ${plural(n,"study session")} will be deleted too. `:""}Plan tasks stay but are unlinked.</p>`,[["y","Delete"],["","Cancel"]]))return false;
  S.study=S.study.filter(s=>s.item!==l.id);S.tasks.forEach(t=>{if(t.lid===l.id){t.lid="";t.lu=0}});S.rec.forEach(r=>{if(r.lid===l.id){r.lid="";r.lu=0}});S.learn=S.learn.filter(x=>x!==l);closeSheet()};
A.lst=b=>{litem(b.dataset.id).st="now"};
A.l1=b=>{const l=litem(b.dataset.id);S.study.push({id:uid(),d:today(),item:l.id,min:0,units:1,note:"",src:""});checkFinish(l);toast(`+1 ${l.unit}: ${l.name}`)};
A.ladd2=(b,f,F)=>{const l=litem(F.v("item")),min=F.n("min"),units=F.n("units");if(!l||(!min&&!units)){toast("Enter minutes or units done");return false}
  S.study.push({id:uid(),d:F.v("d")||today(),item:l.id,min,units,note:F.v("note"),src:""});if(l.st==="next")l.st="now";checkFinish(l);toast("Session saved")};
A.lsd=b=>{S.study=S.study.filter(s=>s.id!==b.dataset.id);S.learn.forEach(checkFinish)};
