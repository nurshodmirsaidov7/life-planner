"use strict";
// ---------- helpers ----------
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const key=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
const dt=k=>{const[y,m,d]=k.split("-").map(Number);return new Date(y,m-1,d)};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
const mon=d=>addD(new Date(d.getFullYear(),d.getMonth(),d.getDate()),-((d.getDay()+6)%7));
const wd=w=>[...Array(7)].map((_,i)=>addD(w,i));
const monthDays=d=>{const n=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();return[...Array(n)].map((_,i)=>new Date(d.getFullYear(),d.getMonth(),i+1))};
const inR=(k,D)=>k>=key(D[0])&&k<=key(D[D.length-1]);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const sh=(d,o)=>fmtDate(d,o);
const isDay=k=>typeof k==="string"&&/^\d{4}-\d\d-\d\d$/.test(k);
const today=()=>key(new Date());
const wdi=k=>(dt(k).getDay()+6)%7;
const sum=(a,f)=>a.reduce((s,x)=>s+(typeof f==="function"?f(x):+x[f]||0),0);
const r1=n=>Math.round(n*10)/10;
const num=v=>Math.max(0,parseFloat(String(v).replace(",","."))||0);
let DN=[],DNL=[];   // weekday names in the current language, filled by setLang()
const dayLbl=d=>`${DN[(d.getDay()+6)%7]} ${d.getDate()} ${sh(d,{month:"short"})}`;
const hm=m=>{m=Math.round(m);const u=T("m"),h=T("h");if(m<60)return m+u;const x=Math.floor(m/60);return x+h+(m%60?" "+m%60+u:"")};
const arr=x=>Array.isArray(x)?x:[];
const str=x=>String(x??"");

// ---------- constants ----------
const CATS=[["Food","tools-kitchen-2"],["Transport","bus"],["Study","school"],["Bills","receipt"],["Shopping","shopping-bag"],["Fun","device-gamepad-2"],["Other","dots"]];
const DEF_EX=[{id:"pu",name:"Pull-ups",on:true},{id:"di",name:"Dips",on:true},{id:"ps",name:"Push-ups",on:true}];
const DEF_LIFTS=["Bench press","Incline dumbbell press","Squat","Deadlift","Overhead press","Barbell row","Lat pulldown","Biceps curl","Triceps pushdown","Lateral raise"].map((n,i)=>({id:"l"+i,name:n,on:true}));
const MEALS=[["b","Breakfast","coffee"],["l","Lunch","bowl"],["d","Dinner","moon"],["s","Snacks","cookie"]];
// Approximate values (USDA-style). per = amount the numbers refer to.
const DEF_FOODS=[["Chicken breast, cooked",100,"g",165,31,0,3.6],["Rice, cooked",100,"g",130,2.7,28,0.3],["Egg",1,"pc",72,6.3,0.4,4.8],["Tvorog (cottage cheese 5%)",100,"g",121,17,3,5],["Greek yogurt 2%",100,"g",73,10,3.9,2],["Potato, boiled",100,"g",87,1.9,20,0.1],["Cucumber",100,"g",15,0.7,3.6,0.1],["Milk 2.5%",100,"ml",52,2.9,4.7,2.5],["Banana",1,"pc",105,1.3,27,0.4],["Oats, dry",100,"g",389,16.9,66,6.9],["White bread",100,"g",265,9,49,3.2],["Cola",100,"ml",42,0,10.6,0]]
  .map((f,i)=>({id:"f"+i,name:f[0],per:f[1],unit:f[2],kcal:f[3],p:f[4],c:f[5],f:f[6]}));
const STORE="life-planner";
const LISTS=["tasks","goals","rec","exp","wo","runs","sets","meals","weights","learn","study"];
const DEF_BODY={sex:"m",age:0,h:0,act:1.55,goal:"keep",kcal:0,prot:0};
const COL={today:"var(--c-today)",money:"var(--c-money)",work:"var(--c-work)",food:"var(--c-food)",learn:"var(--c-learn)"};

function blank(){return{v:5,tasks:[],goals:[],rec:[],exp:[],ex:DEF_EX.map(e=>({...e})),wo:[],runs:[],lifts:DEF_LIFTS.map(e=>({...e})),sets:[],
  split:["","","","","","",""],foods:DEF_FOODS.map(f=>({...f})),meals:[],weights:[],body:{...DEF_BODY},learn:[],study:[],
  budget:0,cur:"UZS",goal:2,theme:"auto",lastExport:null,name:"",onb:false,studyGoal:60,lang:"",rem:{...DEF_REM,what:[...DEF_REM.what]}}}
const DEF_REM={on:false,h:21,tz:"",lang:"",what:["tasks","food","work","study"]};

// Accepts every backup format so far: v2/v3 phone versions and the old laptop planner.
function norm(d){
  if(!d||typeof d!=="object"||!(d.tasks||d.exp||d.wo||d.runs||d.learn||d.meals))throw new Error("bad");
  const o=blank();
  const flat=(x,f)=>Array.isArray(x)?x:Object.entries(x||{}).flatMap(([k,a])=>arr(a).map(i=>f(k,i)));
  o.tasks=flat(d.tasks,(k,t)=>({id:t.id,d:k,t:t.t,x:t.d})).map(t=>({id:str(t.id)||uid(),d:t.d,t:str(t.t),x:!!t.x,p:!!t.p,tm:str(t.tm),rid:str(t.rid),lid:str(t.lid),lu:+t.lu||0}));
  o.goals=arr(d.goals).map(g=>({id:str(g.id)||uid(),d:g.d,t:str(g.t),x:!!g.x}));
  o.rec=arr(d.rec).map(r=>({id:str(r.id)||uid(),t:str(r.t),days:arr(r.days).map(Number).filter(n=>n>=0&&n<7),tm:str(r.tm),p:!!r.p,lid:str(r.lid),lu:+r.lu||0,start:isDay(r.start)?r.start:today(),skip:arr(r.skip).filter(isDay)}));
  o.exp=flat(d.exp,(k,e)=>({...e,d:k})).map(e=>({id:str(e.id)||uid(),d:e.d,n:str(e.n),a:+e.a||0,c:CATS.some(c=>c[0]===e.c)?e.c:"Other"}));
  if(arr(d.ex).length)o.ex=d.ex.map(e=>({id:str(e.id),name:str(e.name||e.id),on:e.on!==false}));
  o.wo=arr(d.wo).map(w=>{let r=w.r;if(!r){r={};["pu","di","ps"].forEach(k=>{if(+w[k])r[k]=+w[k]})}
    const c={};Object.entries(r).forEach(([k,v])=>{if(+v)c[k]=+v});return{id:str(w.id)||uid(),d:w.d,r:c,n:str(w.n)}});
  o.wo.forEach(w=>Object.keys(w.r).forEach(k=>{if(!o.ex.some(e=>e.id===k))o.ex.push({id:k,name:k,on:false})}));
  o.runs=arr(d.runs).map(r=>({id:str(r.id)||uid(),d:r.d,km:+r.km||0,min:+r.min||0,n:str(r.n)}));
  if(arr(d.lifts).length)o.lifts=d.lifts.map(l=>({id:str(l.id),name:str(l.name),on:l.on!==false}));
  o.sets=arr(d.sets).map(s=>({id:str(s.id)||uid(),d:s.d,lift:str(s.lift),kg:+s.kg||0,reps:+s.reps||0}));
  o.sets.forEach(s=>{if(!o.lifts.some(l=>l.id===s.lift))o.lifts.push({id:s.lift,name:s.lift,on:false})});
  if(arr(d.split).length===7)o.split=d.split.map(str);
  if(arr(d.foods).length)o.foods=d.foods.map(f=>({id:str(f.id)||uid(),name:str(f.name),per:+f.per||100,unit:str(f.unit)||"g",kcal:+f.kcal||0,p:+f.p||0,c:+f.c||0,f:+f.f||0}));
  o.meals=arr(d.meals).map(m=>({id:str(m.id)||uid(),d:m.d,m:MEALS.some(x=>x[0]===m.m)?m.m:"s",name:str(m.name),q:+m.q||0,unit:str(m.unit),kcal:+m.kcal||0,p:+m.p||0,c:+m.c||0,f:+m.f||0}));
  o.weights=arr(d.weights).map(w=>({id:str(w.id)||uid(),d:w.d,kg:+w.kg||0})).filter(w=>w.kg);
  if(d.body&&typeof d.body==="object")o.body={...DEF_BODY,...d.body};
  o.learn=arr(d.learn).map((l,i)=>({id:str(l.id)||uid(),name:str(l.name),type:["course","book","topic"].includes(l.type)?l.type:"course",st:["now","next","done"].includes(l.st)?l.st:"now",
    unit:str(l.unit)||"units",total:+l.total||0,base:+l.base||0,c:Number.isInteger(l.c)?l.c:i%8,note:str(l.note),fin:isDay(l.fin)?l.fin:"",auto:!!l.auto}));
  o.study=arr(d.study).map(s=>({id:str(s.id)||uid(),d:s.d,item:str(s.item),min:+s.min||0,units:+s.units||0,note:str(s.note),src:str(s.src)}));
  ["tasks","goals","exp","wo","runs","sets","meals","weights","study"].forEach(l=>o[l]=o[l].filter(x=>isDay(x.d)));
  ["budget","goal","studyGoal"].forEach(k=>{if(d[k]!=null)o[k]=Math.max(0,+d[k]||0)});
  if(d.cur==="USD"||d.cur==="UZS")o.cur=d.cur;
  if(["auto","light","dark"].includes(d.theme))o.theme=d.theme;
  o.lastExport=d.lastExport||null;o.name=str(d.name).slice(0,40);o.onb=!!d.onb;o.lang=LANGS.some(l=>l[0]===d.lang)?d.lang:"";
  if(d.rem&&typeof d.rem==="object"){const r=d.rem;o.rem={on:!!r.on,h:Math.min(23,Math.max(0,parseInt(r.h,10)||0)),tz:str(r.tz),lang:str(r.lang),
    what:arr(r.what).filter(w=>DEF_REM.what.includes(w))}}
  return o;
}
function merge(a,b){
  const o={...a},by=(x,y)=>{const m=new Map(x.map(i=>[i.id,i]));y.forEach(i=>m.set(i.id,i));return[...m.values()]};
  LISTS.forEach(l=>o[l]=by(a[l],b[l]));
  ["ex","lifts","foods"].forEach(l=>{const m=new Map(a[l].map(i=>[i.id,i]));b[l].forEach(i=>{if(!m.has(i.id))m.set(i.id,i)});o[l]=[...m.values()]});
  if(!a.split.some(Boolean))o.split=b.split;
  if(!a.body.age&&b.body.age)o.body=b.body;
  if(!a.name)o.name=b.name;
  return o;
}

// ---------- state ----------
let S=blank();
function save(){try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){toast(T("Couldn't save. Storage is full or blocked"))}
  if(typeof cloudPush==="function")cloudPush()}
try{const r=localStorage.getItem(STORE);if(r)S=norm(JSON.parse(r))}catch(e){}
// Built-in exercise and food names follow the language, unless the user renamed them.
function localizeDefaults(){
  [[S.ex,DEF_EX],[S.lifts,DEF_LIFTS],[S.foods,DEF_FOODS]].forEach(([list,defs])=>defs.forEach(d=>{const x=list.find(i=>i.id===d.id);
    if(x&&[d.name,I18N.uz[d.name],I18N.ru[d.name]].includes(x.name))x.name=T(d.name)}));
}
setLang(S.lang);localizeDefaults();
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

const money=n=>S.cur==="USD"?"$"+n.toFixed(2):Math.round(n).toLocaleString("en-US").replace(/,/g," ")+" "+T("so'm");
const moneyS=n=>{if(S.cur==="USD")return"$"+(n>=1000?r1(n/1000)+"k":Math.round(n));return n>=1e6?r1(n/1e6)+"M":n>=1000?Math.round(n/1000)+"k":String(Math.round(n))};

// ---------- app shell state ----------
const V={},A={},C={};        // views, click actions and change/input handlers, filled by the feature files
let tab="today",cur=new Date(new Date().setHours(0,0,0,0)),anim=true;
const mode={plan:"day",spend:"week",fit:"work",wlog:"reps"};
const wkD=()=>wd(mon(cur));

// ---------- UI pieces ----------
const tile=(h,cls="",at="")=>`<section class="tile ${cls}" ${at}>${h}</section>`;
const bar=(p,over,color)=>`<div class="bar ${over?"over":""}" ${color?`style="--bc:${color}"`:""}><i style="width:${Math.max(0,Math.min(100,p))}%"></i></div>`;
const seg=(act,items,on)=>`<div class="seg" role="tablist">${items.map(([v,l])=>`<button data-a="${act}" data-v="${v}" class="${v===on?"on":""}" role="tab" aria-selected="${v===on}">${l}</button>`).join("")}</div>`;
const opt=(v,l,sel)=>`<option value="${esc(v)}" ${sel?"selected":""}>${esc(l)}</option>`;
const dayChecks=(sel=[])=>`<div class="chipset">${DN.map((n,i)=>`<label><input type="checkbox" name="rd" value="${i}" ${sel.includes(i)?"checked":""}><span>${n}</span></label>`).join("")}</div>`;
const fire=n=>n>=2?`<span class="badge fire">${ic("flame","s")} ${n}</span>`:"";

// Concentric progress rings, outermost first. items: [{p:0..1, color}]
function rings(items,size=132){
  const R=[52,40,28,16];
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" class="rings" role="img" aria-label="${T("Progress rings")}">${items.map((it,i)=>{
    const r=R[i],c=2*Math.PI*r,p=Math.min(1,Math.max(0,it.p||0)),len=(c*p).toFixed(1);
    return `<circle cx="60" cy="60" r="${r}" class="rt" style="stroke:${it.color}"/>${p>0?`<circle cx="60" cy="60" r="${r}" class="ra" style="stroke:${it.color};--len:${len}" stroke-dasharray="${len} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/>`:""}`}).join("")}</svg>`;
}
function ring1(p,color,big,small,size=110,label=""){
  const r=50,c=2*Math.PI*r;p=Math.min(1,Math.max(0,p||0));const len=(c*p).toFixed(1);
  return `<svg viewBox="0 0 120 120" width="${size}" height="${size}" class="rings" role="img" aria-label="${esc(label||big+" "+small)}"><circle cx="60" cy="60" r="${r}" class="rt" style="stroke:${color};stroke-width:10"/>
  ${p>0?`<circle cx="60" cy="60" r="${r}" class="ra" style="stroke:${color};stroke-width:10;--len:${len}" stroke-dasharray="${len} ${c.toFixed(1)}" transform="rotate(-90 60 60)"/>`:""}
  <text x="60" y="${small?62:68}" class="rb">${big}</text>${small?`<text x="60" y="80" class="rs">${small}</text>`:""}</svg>`;
}
// Days in a row (ending today, or yesterday if today has nothing yet) that are in the set.
function streak(days){let n=0,d=new Date();if(!days.has(key(d)))d=addD(d,-1);while(days.has(key(d))){n++;d=addD(d,-1)}return n}
function weekStreak(days){const w=new Set([...days].map(k=>key(mon(dt(k)))));let n=0,d=mon(new Date());if(!w.has(key(d)))d=addD(d,-7);while(w.has(key(d))){n++;d=addD(d,-7)}return n}

// Page header with optional date navigation (kind: day | week | month).
function head(title,{sub="",nav=null,right=""}={}){
  const s=nav?`<button class="pn" data-a="nav" data-n="-1" aria-label="${T("Previous")}">${ic("chevron-left","s")}</button><button class="pl" data-a="pick" title="${T("Pick a date")}">${navLabel(nav)}</button><button class="pn" data-a="nav" data-n="1" aria-label="${T("Next")}">${ic("chevron-right","s")}</button>${hasToday(nav)?"":`<button class="lk" data-a="now">${T("Today")}</button>`}`:esc(sub);
  return `<header class="hd"><div><div class="sub">${s}</div><h1>${title}</h1></div><div class="hr">${right}<button class="ib" data-a="tab" data-t="set" aria-label="${T("Settings")}">${ic("settings")}</button></div></header>`;
}
function navLabel(k){
  if(k==="day"){const t=key(cur)===today();return t?T("Today")+", "+cur.getDate()+" "+sh(cur,{month:"short"}):sh(cur,{weekday:"short",day:"numeric",month:"short"})+(cur.getFullYear()!==new Date().getFullYear()?" "+cur.getFullYear():"")}
  if(k==="month")return sh(cur,{month:"long",year:"numeric"});
  const D=wkD(),a=D[0],b=D[6];
  return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${sh(b,{month:"short"})}`:`${sh(a,{day:"numeric",month:"short"})} – ${sh(b,{day:"numeric",month:"short"})}`;
}
function hasToday(k){const t=today();if(k==="day")return key(cur)===t;if(k==="month")return t.slice(0,7)===key(cur).slice(0,7);return inR(t,wkD())}

// ---------- toast + undo ----------
let tt,undoSnap=null;
function toast(m,act){const t=$("#toast");t.innerHTML=`<span>${esc(m)}</span>`;
  if(act){const b=document.createElement("button");b.textContent=act.label;b.onclick=()=>{t.classList.remove("on");act.fn()};t.appendChild(b)}
  t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),act?5000:2600)}
const snap=()=>{undoSnap=JSON.stringify(S)};   // call before a destructive change
const undoToast=m=>toast(m,{label:T("Undo"),fn:()=>{if(!undoSnap)return;S=norm(JSON.parse(undoSnap));undoSnap=null;save();render();toast(T("Restored"))}});
function ask(html,btns){return new Promise(res=>{const d=$("#dlg");
  d.innerHTML=html+`<div class="f">${btns.map((b,i)=>`<button class="btn ${i===0?"p":""}" value="${b[0]}">${b[1]}</button>`).join("")}</div>`;
  d.querySelectorAll("button").forEach(b=>b.onclick=()=>{d.close();res(b.value)});d.oncancel=()=>res(null);d.showModal()})}

// Bottom sheet: fn returns its HTML; it re-renders together with the page.
let sheetFn=null;
function sheet(title,fn){sheetFn=fn;$("#sh-t").textContent=title;$("#sh-b").innerHTML=fn();const s=$("#sheet");if(!s.open)s.showModal();$("#sh-b").scrollTop=0;
  const f=$("#sh-b [autofocus]");if(f)setTimeout(()=>f.focus(),60)}
function closeSheet(){sheetFn=null;const s=$("#sheet");if(s.open)s.close()}
$("#sheet").addEventListener("close",()=>sheetFn=null);
$("#sheet").addEventListener("click",e=>{if(e.target===e.currentTarget)closeSheet()});

// ---------- charts (Chart.js) ----------
// Categorical palette (validated light/dark steps); colour follows the entity, never its rank.
const PAL_L=["#2a78d6","#eb6834","#1baf7a","#eda100","#e87ba4","#008300","#6250d6","#e34948"];
const PAL_D=["#3987e5","#d95926","#199e70","#c98500","#d55181","#008300","#9085e9","#e66767"];
const dark=()=>S.theme==="dark"||(S.theme!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
const pal=i=>(dark()?PAL_D:PAL_L)[((i%8)+8)%8];
const css=v=>getComputedStyle(document.body).getPropertyValue(v).trim();
let CQ=[],charts=[];
function chart(cfg,h=190){const id="ch"+CQ.length;CQ.push([id,cfg]);return `<div class="chart" style="height:${h}px"><canvas id="${id}" role="img" aria-label="${esc(cfg.label||"Chart")}"></canvas></div>`}
function drawCharts(){
  charts.forEach(c=>c.destroy());charts=[];
  if(window.Chart){
    Chart.defaults.font.family='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    Chart.defaults.color=css("--mute");
    CQ.forEach(([id,cfg])=>{const el=document.getElementById(id);if(el)charts.push(new Chart(el,cfg.make()))});
  }
  CQ=[];
}
const accent=()=>css("--acc")||"#1D9E75";
function baseOpts(o){
  const grid=css("--grid"),bg=css("--bg");
  return{responsive:true,maintainAspectRatio:false,animation:anim?{duration:500}:false,interaction:{mode:"index",intersect:false},layout:{padding:{top:4}},
    plugins:{legend:{display:!!o.legend,position:"bottom",labels:{boxWidth:10,boxHeight:10,useBorderRadius:true,borderRadius:3,padding:12}},
      tooltip:{backgroundColor:css("--ink"),titleColor:bg,bodyColor:bg,footerColor:bg,padding:10,cornerRadius:10,boxPadding:4,
        filter:i=>i.raw!==null&&(o.stacked?i.raw>0:true),callbacks:{label:c=>` ${c.dataset.label}: ${o.fmt?o.fmt(c.raw,c):c.raw}`,footer:o.footer||(()=>"")}}},
    scales:{x:{stacked:!!o.stacked,grid:{display:false},border:{display:false},ticks:{maxRotation:0,autoSkipPadding:8}},
      y:{stacked:!!o.stacked,beginAtZero:o.zero!==false,grid:{color:grid},border:{display:false},ticks:{maxTicksLimit:4,callback:v=>o.tick?o.tick(v):v}}}};
}
// bars(labels,[{label,data,color}],{stacked,line:{label,data},fmt,tick,legend})
function bars(labels,sets,o={}){
  return{label:o.label,make:()=>{
    const bg=css("--tile");
    const ds=sets.map(s=>({type:"bar",label:s.label,data:s.data,backgroundColor:s.color||accent(),borderRadius:o.stacked?3:6,borderSkipped:o.stacked?false:"start",
      borderColor:bg,borderWidth:o.stacked?{top:2,bottom:0,left:0,right:0}:0,maxBarThickness:30,categoryPercentage:.8,barPercentage:.9}));
    if(o.line)ds.push({type:"line",label:o.line.label,data:o.line.data,borderColor:css("--mute"),borderDash:[5,4],borderWidth:1.5,pointRadius:0,pointHoverRadius:0,fill:false,order:-1});
    return{type:"bar",data:{labels,datasets:ds},options:baseOpts(o)};
  }};
}
function lines(labels,sets,o={}){
  return{label:o.label,make:()=>({type:"line",data:{labels,datasets:sets.map(s=>({label:s.label,data:s.data,borderColor:s.color||accent(),backgroundColor:s.color||accent(),borderWidth:2.5,
    pointRadius:labels.length>20?2:4,pointHoverRadius:6,pointBorderColor:css("--tile"),pointBorderWidth:2,tension:.3,spanGaps:true}))},options:baseOpts(o)})};
}

// ---------- rendering ----------
function navKind(){const n=V[tab].nav;return typeof n==="function"?n():n||null}
const NAV=[["today","home","Today"],["spend","wallet","Money"],null,["fit","heartbeat","Fitness"],["learn","book","Learn"]];
function render(){
  const t=tab==="fit"?mode.fit:tab;document.body.dataset.t=t;
  if($("#tabs").dataset.lang!==LANG){$("#tabs").dataset.lang=LANG;
    $("#tabs").innerHTML=NAV.map(n=>n?`<button data-a="tab" data-t="${n[0]}">${ic(n[1])}<span>${T(n[2])}</span></button>`:`<button data-a="add" class="fab" aria-label="${T("Add")}">${ic("plus")}</button>`).join("");
    $("#sh-x").setAttribute("aria-label",T("Close"));document.title="TrackMe"}
  if(S.theme==="auto")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=S.theme;
  $$("#tabs button[data-t]").forEach(b=>b.classList.toggle("on",b.dataset.t===tab));
  document.body.classList.toggle("anim",anim);
  const gate=typeof needAuth==="function"&&needAuth();document.body.classList.toggle("authing",gate);
  CQ=[];
  $("#main").innerHTML=gate?authView():V[tab].render();
  drawCharts();anim=false;
  if(sheetFn&&$("#sheet").open)$("#sh-b").innerHTML=sheetFn();
}
