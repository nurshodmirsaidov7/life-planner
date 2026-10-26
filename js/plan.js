"use strict";
// ---------- Today: rings, tasks (day / week / month), weekly goals, repeating tasks ----------
const task=id=>S.tasks.find(t=>t.id===id);
const tsort=a=>[...a].sort((x,y)=>{const a1=x.tm||"~",b1=y.tm||"~";return a1<b1?-1:a1>b1?1:(y.p-x.p)});
const recDays=d=>{const s=[...d].sort().join("");return s==="0123456"?T("Every day"):s==="01234"?T("Weekdays"):s==="56"?T("Weekends"):d.slice().sort().map(i=>DN[i]).join(", ")};
const trainedOn=k=>S.wo.some(w=>w.d===k)||S.sets.some(s=>s.d===k)||S.runs.some(r=>r.d===k);
let popId="";

// Repeating tasks become real tasks the first time a day that matches them is shown.
function ensureRec(D){
  let ch=false;
  D.forEach(d=>{const k=key(d),w=(d.getDay()+6)%7;
    S.rec.forEach(r=>{if(r.days.includes(w)&&k>=r.start&&!r.skip.includes(k)&&!S.tasks.some(t=>t.rid===r.id&&t.d===k)){
      S.tasks.push({id:uid(),d:k,t:r.t,x:false,p:r.p,tm:r.tm,rid:r.id,lid:r.lid,lu:r.lu});ch=true}})});
  if(ch)save();
}
function skipRec(t){const r=t.rid&&S.rec.find(x=>x.id===t.rid);if(r&&!r.skip.includes(t.d))r.skip.push(t.d)}

// Task row: tap the box to finish, tap the text to edit, swipe right = done, swipe left = tomorrow.
function trow(t){
  const L=t.lid&&S.learn.find(l=>l.id===t.lid);
  const meta=[t.p?ic("star","s")+" "+T("Important"):"",t.rid?ic("repeat","s")+" "+T("Repeats"):"",L?ic("book","s")+" "+esc(L.name)+(t.lu?" +"+t.lu:""):""].filter(Boolean).join(" · ");
  return `<div class="sw" data-r="tg" data-l="mv" data-id="${t.id}"><div class="sw-bg"><span class="bl">${ic("check","s")} ${t.x?T("Not done"):T("Done")}</span><span class="br">${T("Tomorrow")} ${ic("arrow-forward-up","s")}</span></div>
  <div class="sw-fg"><div class="rw ${t.x?"done":""}"><button class="cb ${t.x?"on":""} ${popId===t.id?"pop":""}" data-a="tg" data-id="${t.id}" aria-label="${t.x?T("Mark as not done"):T("Mark as done")}" aria-pressed="${t.x}">${ic("check")}</button>
  <div class="g tap" data-a="te" data-id="${t.id}"><span class="tt">${esc(t.t)}</span>${meta?`<div class="meta">${meta}</div>`:""}</div>${t.tm?`<span class="meta">${t.tm}</span>`:""}</div></div></div>`;
}
const addRow=k=>`<div class="addrow" data-form data-k="${k}"><input name="t" placeholder="${T("Add a task")}" enterkeyhint="done" aria-label="${T("New task")}"><button class="ib" data-a="at" aria-label="${T("Add task")}">${ic("plus")}</button></div>`;
function learnFields(lid,lu){
  const L=S.learn.filter(l=>l.st!=="done"||l.id===lid);
  if(!L.length)return"";
  return `<div class="f"><label class="fl" style="flex:2 1 170px"><span>${T("Counts toward learning")}</span><select name="lid">${opt("",T("Not linked"),!lid)}${L.map(l=>opt(l.id,l.name,l.id===lid)).join("")}</select></label>
  <label class="fl n"><span>${T("Units when done")}</span><input name="lu" type="number" inputmode="decimal" min="0" step="any" value="${lu||1}"></label></div>`;
}
function goalsTile(){
  const w=key(mon(cur)),G=S.goals.filter(g=>g.d===w);
  return tile(`<h2><span>${ic("target","s")} ${T("Goals this week")}</span><span class="lb">${G.filter(g=>g.x).length}/${G.length}</span></h2>
  ${G.map(g=>`<div class="rw ${g.x?"done":""}"><button class="cb ${g.x?"on":""}" data-a="gt" data-id="${g.id}" aria-label="${T("Toggle goal")}" aria-pressed="${g.x}">${ic("check")}</button><span class="g"><span class="tt">${esc(g.t)}</span></span><button class="ib" data-a="gd" data-id="${g.id}" aria-label="${T("Delete goal")}">${ic("x","s")}</button></div>`).join("")||`<div class="empty">${T("What do you want to get done this week?")}</div>`}
  <div class="addrow" data-form data-w="${w}"><input name="g" placeholder="${T("Add a goal for the week")}" enterkeyhint="done" aria-label="${T("New goal")}"><button class="ib" data-a="ag" aria-label="${T("Add goal")}">${ic("plus")}</button></div>`);
}
const dayTotals=k=>({sp:sum(S.exp.filter(e=>e.d===k),"a"),kc:sum(S.meals.filter(m=>m.d===k),"kcal"),st:sum(S.study.filter(s=>s.d===k),"min")});
const greet=()=>{const h=new Date().getHours();return T(h<5?"Good night":h<12?"Good morning":h<18?"Good afternoon":"Good evening")+(S.name?", "+esc(S.name):"")};
const taskStreak=()=>streak(new Set(S.tasks.filter(t=>t.x).map(t=>t.d)));
const pseg=on=>seg("pmode",[["day",T("Day")],["week",T("Week")],["month",T("Month")]],on);

function vDay(){
  const k=key(cur);ensureRec([cur]);
  const T0=tsort(S.tasks.filter(t=>t.d===k)),done=T0.filter(t=>t.x).length,x=dayTotals(k),tg=targets(),split=S.split[wdi(k)];
  const D=wd(mon(cur)),trained=D.filter(d=>trainedOn(key(d))).length,planned=S.split.filter(Boolean).length||3,sg=S.studyGoal||60;
  const R=[{p:T0.length?done/T0.length:0,color:COL.today,l:T("Tasks"),v:`${done}/${T0.length}`,go:"today"},
    {p:tg?x.kc/tg.kcal:0,color:COL.food,l:T("Food"),v:tg?Math.round(x.kc/tg.kcal*100)+"%":Math.round(x.kc)+" "+T("kcal"),go:"food"},
    {p:trained/planned,color:COL.work,l:T("Workout"),v:T("{a}/{b} days",{a:trained,b:planned}),go:"work"},
    {p:x.st/sg,color:COL.learn,l:T("Study"),v:hm(x.st),go:"learn"}];
  const isT=k===today();
  return head(isT?greet():DNL[wdi(k)],{nav:"day",right:fire(taskStreak())})+pseg("day")+`<div class="stack">
  ${tile(`<div class="ringbox">${rings(R,128)}<div class="legend">${R.map(r=>`<div class="rw tap" data-a="go" data-go="${r.go}"><span class="dot" style="background:${r.color}"></span><span class="g">${r.l}</span><span class="v">${r.v}</span></div>`).join("")}</div></div>`)}
  <div class="grid2">${tile(`<div class="lb">${ic("wallet","s")} ${T("Spent")}</div><div class="big">${moneyS(x.sp)}${S.cur==="UZS"?` <small class="mute">${T("so'm")}</small>`:""}</div>`,"t tap",'data-a="tab" data-t="spend"')}
  ${tile(`<div class="lb">${ic("barbell","s")} ${T("Workout")}</div><div class="big">${split?esc(split):T("Rest day")}</div>`,"t tap",'data-a="go" data-go="work"')}</div>
  ${tile(`<h2><span>${T("Tasks")}</span><span style="display:flex;gap:2px;align-items:center"><span class="lb">${done}/${T0.length}</span><button class="ib" data-a="rec" aria-label="${T("Repeating tasks")}" title="${T("Repeating tasks")}">${ic("repeat","s")}</button></span></h2>
  ${T0.map(trow).join("")||`<div class="empty">${T("Nothing planned yet. Add your first task.")}</div>`}${addRow(k)}`)}
  ${goalsTile()}${backupNudge()}</div>`;
}

function vWeek(){
  const D=wkD(),tk=today();ensureRec(D);
  const W=S.tasks.filter(t=>inR(t.d,D)),done=W.filter(t=>t.x).length;
  let h=head(T("This week"),{nav:"week",right:fire(taskStreak())})+pseg("week")+`<div class="stack">
  <div class="grid2">${tile(`<div class="lb">${T("Tasks done")}</div><div class="big">${done}/${W.length}</div>`,"t")}${tile(`<div class="lb">${T("Spent")}</div><div class="big">${moneyS(sum(S.exp.filter(e=>inR(e.d,D)),"a"))}</div>`,"t")}
  ${tile(`<div class="lb">${T("Workout days")}</div><div class="big">${D.filter(d=>trainedOn(key(d))).length}</div>`,"t")}${tile(`<div class="lb">${T("Study")}</div><div class="big">${hm(sum(S.study.filter(s=>inR(s.d,D)),"min"))}</div>`,"t")}</div>
  ${goalsTile()}`;
  D.forEach((d,i)=>{const k=key(d),t=tsort(S.tasks.filter(x=>x.d===k)),dn=t.filter(x=>x.x).length;
    h+=tile(`<h2><span class="tap" data-a="cal" data-k="${k}" style="display:flex;align-items:center;gap:10px">${ring1(t.length?dn/t.length:0,COL.today,"","",30,"")}<span>${DN[i]} ${d.getDate()} ${sh(d,{month:"short"})}${k===tk?` <span class="badge">${T("Today")}</span>`:""}<br><small class="mute" style="font-weight:500">${S.split[i]?esc(S.split[i]):T("Rest")}</small></span></span><span class="lb">${t.length?dn+"/"+t.length:""}</span></h2>
    ${t.map(trow).join("")}${addRow(k)}`)});
  return h+"</div>";
}

function vMonth(){
  const M=monthDays(cur),tk=today(),mk=key(cur).slice(0,7);ensureRec(M);
  const cells=[];for(let d=mon(M[0]);d<=addD(mon(M[M.length-1]),6);d=addD(d,1))cells.push(d);
  const MT=S.tasks.filter(t=>t.d.startsWith(mk)),done=MT.filter(t=>t.x).length;let perfect=0;
  const c=cells.map(d=>{const k=key(d),D=S.tasks.filter(t=>t.d===k),x=D.filter(t=>t.x).length,p=D.length?x/D.length:0,inM=k.startsWith(mk);
    if(inM&&D.length&&x===D.length)perfect++;
    const bg=D.length&&x?`background:color-mix(in srgb,var(--c-today) ${Math.round(18+72*p)}%,var(--bg));${p>=.55?"color:#fff;":""}`:"";
    return `<button data-a="cal" data-k="${k}" class="${inM?"":"out"} ${k===tk?"now":""}" style="${bg}" aria-label="${dayLbl(d)}: ${T("{a} of {b} tasks done",{a:x,b:D.length})}"><span>${d.getDate()}</span><small>${D.length?x+"/"+D.length:""}</small></button>`}).join("");
  const sw=p=>`<span class="dot" style="background:color-mix(in srgb,var(--c-today) ${Math.round(18+72*p)}%,var(--bg))"></span>`;
  return head(cap(sh(cur,{month:"long"})),{nav:"month",right:fire(taskStreak())})+pseg("month")+`<div class="stack">
  <div class="grid2">${tile(`<div class="lb">${T("Tasks done")}</div><div class="big">${done}/${MT.length} <small class="mute">${MT.length?Math.round(done/MT.length*100)+"%":""}</small></div>`,"t")}${tile(`<div class="lb">${T("Perfect days")}</div><div class="big">${perfect}</div>`,"t")}</div>
  ${tile(`<div class="cal">${DN.map(n=>`<div class="h">${n[0]}</div>`).join("")}${c}</div><div class="lgn">${sw(.15)} ${T("few")} ${sw(.5)} ${T("half")} ${sw(1)} ${T("all done")} · ${T("tap a day to open it")}</div>`)}</div>`;
}

function recSheet(){
  return `${S.rec.map(r=>{const L=r.lid&&S.learn.find(l=>l.id===r.lid);return `<div class="rw"><span class="g">${r.p?ic("star","s")+" ":""}${esc(r.t)}<div class="meta">${recDays(r.days)}${r.tm?" · "+r.tm:""}${L?" · "+esc(L.name):""}</div></span><button class="ib" data-a="rdel" data-id="${r.id}" aria-label="${T("Stop repeating")}">${ic("trash","s")}</button></div>`}).join("")||`<div class="empty">${T("Tasks you do regularly, like \"Leetcode 2 problems\", can appear on their own.")}</div>`}
  <div data-form style="margin-top:16px">${taskFields({t:"",tm:"",p:false,lid:"",lu:1},[0,1,2,3,4])}<button class="btn p w" data-a="radd">${T("Add repeating task")}</button></div>`;
}
// Shared task form fields; days!==null shows the repeat picker.
function taskFields(t,days=null){
  return `<label class="fl"><span>${T("Task")}</span><input name="t" value="${esc(t.t)}" placeholder="${T("Leetcode 2 problems")}" autofocus></label>
  ${days?`<div class="fl"><span>${T("Repeats on")}</span>${dayChecks(days)}<div class="f" style="margin-top:6px"><button class="btn sm x" data-a="rq" data-v="0123456">${T("Every day")}</button><button class="btn sm x" data-a="rq" data-v="01234">${T("Weekdays")}</button><button class="btn sm x" data-a="rq" data-v="56">${T("Weekends")}</button></div></div>`:""}
  <div class="f">${t.d!==undefined?`<label class="fl"><span>${T("Date")}</span><input type="date" name="d" value="${t.d}"></label>`:""}<label class="fl"><span>${T("Time (optional)")}</span><input type="time" name="tm" value="${t.tm}"></label></div>
  <div class="chipset fl"><label><input type="checkbox" name="p" ${t.p?"checked":""}><span>${ic("star","s")} ${T("Important")}</span></label></div>${learnFields(t.lid,t.lu)}`;
}
function taskSheet(id){
  const t=task(id);if(!t)return`<div class="empty">${T("This task was deleted.")}</div>`;
  return `<div data-form data-id="${id}">${taskFields(t)}${t.rid?`<p class="lb">${T("This is one day of a repeating task. Changes apply to this day only.")}</p>`:""}
  <button class="btn p w" data-a="tsave">${T("Save")}</button><div class="f"><button class="btn" data-a="mv" data-id="${id}">${ic("arrow-forward-up","s")} ${T("Tomorrow")}</button><button class="btn" data-a="dt" data-id="${id}">${ic("trash","s")} ${T("Delete")}</button></div></div>`;
}

V.today={nav:()=>mode.plan,render:()=>mode.plan==="day"?vDay():mode.plan==="week"?vWeek():vMonth()};

A.pmode=b=>{mode.plan=b.dataset.v;anim=true};
A.go=b=>{const g=b.dataset.go;if(g==="today")return false;if(g==="learn")tab="learn";else{tab="fit";mode.fit=g}anim=true;scrollTo(0,0)};
A.cal=b=>{cur=dt(b.dataset.k);mode.plan="day";anim=true;scrollTo(0,0)};
A.tg=b=>{const t=task(b.dataset.id);if(!t)return false;t.x=!t.x;syncLearn(t);
  if(t.x){popId=t.id;try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}setTimeout(()=>popId="",400)}};
A.mv=b=>{const t=task(b.dataset.id);snap();skipRec(t);t.d=key(addD(dt(t.d),1));syncLearn(t);closeSheet();undoToast(T("Moved to {d}",{d:dayLbl(dt(t.d))}))};
A.dt=b=>{const t=task(b.dataset.id);if(!t)return;snap();skipRec(t);S.tasks=S.tasks.filter(x=>x!==t);S.study=S.study.filter(s=>s.src!==t.id);closeSheet();undoToast(T("Task deleted"))};
A.at=(b,f,F)=>{const t=F.v("t");if(!t)return false;S.tasks.push({id:uid(),d:f.dataset.k,t,x:false,p:false,tm:"",rid:"",lid:"",lu:0});return `[data-k="${f.dataset.k}"] [name=t]`};
A.te=b=>{const id=b.dataset.id;sheet(T("Edit task"),()=>taskSheet(id));return false};
A.tsave=(b,f,F)=>{const t=task(f.dataset.id);if(!t||!F.v("t"))return false;
  if(F.v("d")&&F.v("d")!==t.d){skipRec(t);t.d=F.v("d")}
  Object.assign(t,{t:F.v("t"),tm:F.v("tm"),p:F.ck("p"),lid:F.v("lid"),lu:F.v("lid")?F.n("lu")||1:0});syncLearn(t);closeSheet();toast(T("Saved"))};
A.ag=(b,f,F)=>{const t=F.v("g");if(!t)return false;S.goals.push({id:uid(),d:f.dataset.w,t,x:false});return `[data-w] [name=g]`};
A.gt=b=>{const g=S.goals.find(x=>x.id===b.dataset.id);g.x=!g.x};
A.gd=b=>{snap();S.goals=S.goals.filter(x=>x.id!==b.dataset.id);undoToast(T("Goal deleted"))};
A.rec=()=>{sheet(T("Repeating tasks"),recSheet);return false};
A.rq=(b,f)=>{f.querySelectorAll("[name=rd]").forEach(i=>i.checked=b.dataset.v.includes(i.value));return false};
A.radd=(b,f,F)=>{const t=F.v("t"),days=F.all("rd").map(Number);
  if(!t||!days.length){toast(T("Add a task name and pick at least one day"));return false}
  S.rec.push({id:uid(),t,days,tm:F.v("tm"),p:F.ck("p"),lid:F.v("lid"),lu:F.v("lid")?F.n("lu")||1:0,start:today(),skip:[]});toast(T("Repeating task added"))};
A.rdel=b=>{const r=S.rec.find(x=>x.id===b.dataset.id),t=today();snap();
  S.tasks=S.tasks.filter(x=>!(x.rid===r.id&&!x.x&&x.d>=t));S.tasks.forEach(x=>{if(x.rid===r.id)x.rid=""});S.rec=S.rec.filter(x=>x!==r);undoToast(T("Stopped repeating"))};
