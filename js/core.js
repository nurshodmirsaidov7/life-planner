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
const sh=(d,o)=>d.toLocaleDateString("en-GB",o);
const isDay=k=>typeof k==="string"&&/^\d{4}-\d\d-\d\d$/.test(k);
const today=()=>key(new Date());
const wdi=k=>(dt(k).getDay()+6)%7;
const sum=(a,f)=>a.reduce((s,x)=>s+(typeof f==="function"?f(x):+x[f]||0),0);
const r1=n=>Math.round(n*10)/10;
const num=v=>Math.max(0,parseFloat(String(v).replace(",","."))||0);
const DN=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],DNL=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const dayLbl=d=>`${DN[(d.getDay()+6)%7]} ${d.getDate()} ${sh(d,{month:"short"})}`;
const hm=m=>{m=Math.round(m);if(m<60)return m+"m";const h=Math.floor(m/60);return h+"h"+(m%60?" "+m%60+"m":"")};
const plural=(n,w)=>`${n} ${w}${n===1?"":"s"}`;
const arr=x=>Array.isArray(x)?x:[];
const str=x=>String(x??"");

// ---------- constants ----------
const CATS=[["Food","🍽️"],["Transport","🚌"],["Study","📚"],["Bills","🧾"],["Shopping","🛍️"],["Fun","🎮"],["Other","•"]];
const DEF_EX=[{id:"pu",name:"Pull-ups",on:true},{id:"di",name:"Dips",on:true},{id:"ps",name:"Push-ups",on:true}];
const DEF_LIFTS=["Bench press","Incline dumbbell press","Squat","Deadlift","Overhead press","Barbell row","Lat pulldown","Biceps curl","Triceps pushdown","Lateral raise"].map((n,i)=>({id:"l"+i,name:n,on:true}));
const MEALS=[["b","Breakfast","🍳"],["l","Lunch","🍲"],["d","Dinner","🍽️"],["s","Snacks","🍎"]];
// Approximate values (USDA-style). per = amount the numbers refer to.
const DEF_FOODS=[["Chicken breast, cooked",100,"g",165,31,0,3.6],["Rice, cooked",100,"g",130,2.7,28,0.3],["Egg",1,"pc",72,6.3,0.4,4.8],["Tvorog (cottage cheese 5%)",100,"g",121,17,3,5],["Greek yogurt 2%",100,"g",73,10,3.9,2],["Potato, boiled",100,"g",87,1.9,20,0.1],["Cucumber",100,"g",15,0.7,3.6,0.1],["Milk 2.5%",100,"ml",52,2.9,4.7,2.5],["Banana",1,"pc",105,1.3,27,0.4],["Oats, dry",100,"g",389,16.9,66,6.9],["White bread",100,"g",265,9,49,3.2],["Cola",100,"ml",42,0,10.6,0]]
  .map((f,i)=>({id:"f"+i,name:f[0],per:f[1],unit:f[2],kcal:f[3],p:f[4],c:f[5],f:f[6]}));
const STORE="life-planner";
const LISTS=["tasks","goals","rec","exp","wo","runs","sets","meals","weights","learn","study"];
const DEF_BODY={sex:"m",age:0,h:0,act:1.55,goal:"keep",kcal:0,prot:0};

function blank(){return{v:4,tasks:[],goals:[],rec:[],exp:[],ex:DEF_EX.map(e=>({...e})),wo:[],runs:[],lifts:DEF_LIFTS.map(e=>({...e})),sets:[],
  split:["","","","","","",""],foods:DEF_FOODS.map(f=>({...f})),meals:[],weights:[],body:{...DEF_BODY},learn:[],study:[],
  budget:0,cur:"UZS",goal:2,theme:"auto",lastExport:null}}

// Accepts every backup format so far: this version, the first phone version, and the old laptop planner.
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
  ["budget","goal"].forEach(k=>{if(d[k]!=null)o[k]=Math.max(0,+d[k]||0)});
  if(d.cur==="USD"||d.cur==="UZS")o.cur=d.cur;
  if(["auto","light","dark"].includes(d.theme))o.theme=d.theme;
  o.lastExport=d.lastExport||null;
  return o;
}
function merge(a,b){
  const o={...a},by=(x,y)=>{const m=new Map(x.map(i=>[i.id,i]));y.forEach(i=>m.set(i.id,i));return[...m.values()]};
  LISTS.forEach(l=>o[l]=by(a[l],b[l]));
  ["ex","lifts","foods"].forEach(l=>{const m=new Map(a[l].map(i=>[i.id,i]));b[l].forEach(i=>{if(!m.has(i.id))m.set(i.id,i)});o[l]=[...m.values()]});
  if(!a.split.some(Boolean))o.split=b.split;
  if(!a.body.age&&b.body.age)o.body=b.body;
  return o;
}

// ---------- state ----------
let S=blank();
function save(){try{localStorage.setItem(STORE,JSON.stringify(S))}catch(e){toast("Couldn't save: storage is full or blocked")}}
try{const r=localStorage.getItem(STORE);if(r)S=norm(JSON.parse(r))}catch(e){}
try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}

const money=n=>S.cur==="USD"?"$"+n.toFixed(2):Math.round(n).toLocaleString("en-US").replace(/,/g," ")+" so'm";
const moneyS=n=>{if(S.cur==="USD")return"$"+(n>=1000?r1(n/1000)+"k":Math.round(n));return n>=1e6?r1(n/1e6)+"M":n>=1000?Math.round(n/1000)+"k":String(Math.round(n))};

// ---------- app shell state ----------
const V={},A={},C={};        // views, click actions and change handlers, filled by the feature files
let tab="plan",cur=new Date(new Date().setHours(0,0,0,0));
const mode={plan:"day",spend:"week",wlog:"reps"};
const wkD=()=>wd(mon(cur));

// ---------- UI pieces ----------
const stat=(l,v,s)=>`<div class="st"><small>${l}</small><b>${v}</b><i>${s||"&nbsp;"}</i></div>`;
const bar=(p,over,color)=>`<div class="bar ${over?"over":""}"><i style="width:${Math.max(0,Math.min(100,p))}%;${color&&!over?"background:"+color:""}"></i></div>`;
const seg=(act,items,on)=>`<div class="seg">${items.map(([v,l])=>`<button data-a="${act}" data-v="${v}" class="${v===on?"on":""}">${l}</button>`).join("")}</div>`;
const opt=(v,l,sel)=>`<option value="${esc(v)}" ${sel?"selected":""}>${esc(l)}</option>`;
const dayChecks=(sel=[])=>`<div class="dchips">${DN.map((n,i)=>`<label class="dchip"><input type="checkbox" name="rd" value="${i}" ${sel.includes(i)?"checked":""}><span>${n}</span></label>`).join("")}</div>`;

let tt;function toast(m){const t=$("#toast");t.textContent=m;t.onclick=null;t.classList.add("on");clearTimeout(tt);tt=setTimeout(()=>t.classList.remove("on"),2600)}
function ask(html,btns){return new Promise(res=>{const d=$("#dlg");
  d.innerHTML=html+`<div class="btns">${btns.map((b,i)=>`<button class="${i===0?"p":""}" value="${b[0]}">${b[1]}</button>`).join("")}</div>`;
  d.querySelectorAll("button").forEach(b=>b.onclick=()=>{d.close();res(b.value)});d.oncancel=()=>res(null);d.showModal()})}

// Bottom sheet: fn returns its HTML; it re-renders together with the page.
let sheetFn=null;
function sheet(title,fn){sheetFn=fn;$("#sh-t").textContent=title;$("#sh-b").innerHTML=fn();const s=$("#sheet");if(!s.open)s.showModal();$("#sh-b").scrollTop=0;
  const f=$("#sh-b input:not([type=checkbox]):not([type=date])");if(f&&matchMedia("(min-width:760px)").matches)f.focus()}
function closeSheet(){sheetFn=null;const s=$("#sheet");if(s.open)s.close()}
$("#sheet").addEventListener("close",()=>sheetFn=null);
$("#sheet").addEventListener("click",e=>{if(e.target===e.currentTarget)closeSheet()});

// ---------- charts (Chart.js) ----------
// Categorical palette (validated light/dark steps); colour follows the entity, never its rank.
const PAL_L=["#2a78d6","#eb6834","#1baf7a","#eda100","#e87ba4","#008300","#6250d6","#e34948"];
const PAL_D=["#3987e5","#d95926","#199e70","#c98500","#d55181","#008300","#9085e9","#e66767"];
const dark=()=>S.theme==="dark"||(S.theme!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);
const pal=i=>(dark()?PAL_D:PAL_L)[((i%8)+8)%8];
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
let CQ=[],charts=[];
function chart(cfg,h=210){const id="ch"+CQ.length;CQ.push([id,cfg]);return `<div class="chart" style="height:${h}px"><canvas id="${id}" role="img" aria-label="${esc(cfg.label||"Chart")}"></canvas></div>`}
function drawCharts(){
  charts.forEach(c=>c.destroy());charts=[];
  if(window.Chart){
    Chart.defaults.font.family='system-ui,-apple-system,"Segoe UI",Roboto,sans-serif';
    Chart.defaults.color=dark()?"#9b9a93":"#6d6c66";
    CQ.forEach(([id,cfg])=>{const el=document.getElementById(id);if(el)charts.push(new Chart(el,cfg.make()))});
  }
  CQ=[];
}
function baseOpts(o){
  const grid=css("--grid"),surface=css("--card");
  return{responsive:true,maintainAspectRatio:false,animation:{duration:250},interaction:{mode:"index",intersect:false},
    layout:{padding:{top:4}},
    plugins:{legend:{display:!!o.legend,position:"bottom",labels:{boxWidth:10,boxHeight:10,useBorderRadius:true,borderRadius:2,padding:12}},
      tooltip:{backgroundColor:dark()?"#ecebe6":"#1c1c1a",titleColor:surface,bodyColor:surface,padding:9,boxPadding:4,
        filter:i=>i.raw!==null&&(o.stacked?i.raw>0:true),
        callbacks:{label:c=>` ${c.dataset.label}: ${o.fmt?o.fmt(c.raw,c):c.raw}`,footer:o.footer||(()=>"")}}},
    scales:{x:{stacked:!!o.stacked,grid:{display:false},border:{color:grid},ticks:{maxRotation:0,autoSkipPadding:8}},
      y:{stacked:!!o.stacked,beginAtZero:o.zero!==false,grid:{color:grid},border:{display:false},ticks:{maxTicksLimit:5,callback:v=>o.tick?o.tick(v):v}}}};
}
// bars(labels,[{label,data,color}],{stacked,line:{label,data,color},fmt,tick,legend})
function bars(labels,sets,o={}){
  return{label:o.label,make:()=>{
    const surface=css("--card");
    const ds=sets.map(s=>({type:"bar",label:s.label,data:s.data,backgroundColor:s.color,borderRadius:o.stacked?2:4,borderSkipped:o.stacked?false:"start",
      borderColor:surface,borderWidth:o.stacked?{top:2,bottom:0,left:0,right:0}:0,maxBarThickness:34,categoryPercentage:.8,barPercentage:.9}));
    if(o.line)ds.push({type:"line",label:o.line.label,data:o.line.data,borderColor:o.line.color||css("--mute"),borderDash:[6,4],borderWidth:2,pointRadius:0,pointHoverRadius:0,fill:false,order:-1});
    return{type:"bar",data:{labels,datasets:ds},options:baseOpts(o)};
  }};
}
function lines(labels,sets,o={}){
  return{label:o.label,make:()=>({type:"line",data:{labels,datasets:sets.map(s=>({label:s.label,data:s.data,borderColor:s.color,backgroundColor:s.color,borderWidth:2,
    pointRadius:labels.length>20?2:4,pointHoverRadius:6,pointBorderColor:css("--card"),pointBorderWidth:2,tension:.25,spanGaps:true}))},options:baseOpts(o)})};
}

// ---------- rendering ----------
function navKind(){const n=V[tab].nav;return typeof n==="function"?n():n||null}
function navLabel(k){
  if(k==="day"){const t=key(cur)===today();return(t?"Today · ":"")+(t?"":DN[(cur.getDay()+6)%7]+" ")+cur.getDate()+" "+sh(cur,{month:"short"})+(cur.getFullYear()!==new Date().getFullYear()?" "+cur.getFullYear():"")}
  if(k==="month")return sh(cur,{month:"long",year:"numeric"});
  const D=wkD(),a=D[0],b=D[6];
  return a.getMonth()===b.getMonth()?`${a.getDate()}–${b.getDate()} ${sh(b,{month:"short",year:"numeric"})}`:`${sh(a,{day:"numeric",month:"short"})} – ${sh(b,{day:"numeric",month:"short",year:"numeric"})}`;
}
function hasToday(k){const t=today();if(k==="day")return key(cur)===t;if(k==="month")return t.slice(0,7)===key(cur).slice(0,7);return inR(t,wkD())}
function render(){
  document.body.dataset.t=tab;
  if(S.theme==="auto")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=S.theme;
  const k=navKind();
  document.body.classList.toggle("nonav",!k);
  $("#wknav").style.display=k?"":"none";
  $("#htitle").textContent=V[tab].title;
  if(k){$("#range").textContent=navLabel(k);$("#today").style.display=hasToday(k)?"none":""}
  $$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.t===tab));
  CQ=[];
  $("#main").innerHTML=V[tab].render();
  drawCharts();
  if(sheetFn&&$("#sheet").open)$("#sh-b").innerHTML=sheetFn();
}
