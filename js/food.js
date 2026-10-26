"use strict";
// ---------- Fitness › Food: calories & macros, my foods, Open Food Facts search, body weight ----------
const ACT=[[1.2,"Sedentary: desk job, little exercise"],[1.375,"Light: 1–3 workouts a week"],[1.55,"Moderate: 3–5 workouts a week"],[1.725,"Very active: 6–7 workouts a week"],[1.9,"Extra: physical job + training"]];
const GOALS=[["lose","Lose fat (about −0.5 kg/week)",-500],["keep","Keep my weight",0],["gain","Gain muscle slowly",300]];
const MAC=[["p","Protein"],["c","Carbs"],["f","Fat"]];
const latestWeight=()=>{const w=[...S.weights].sort((a,b)=>a.d<b.d?1:-1)[0];return w?w.kg:0};
const mealNow=()=>{const h=new Date().getHours();return h<11?"b":h<16?"l":h<21?"d":"s"};

// Mifflin–St Jeor BMR × activity, adjusted for the goal. Manual overrides win.
function targets(){
  const b=S.body,kg=latestWeight();let bmr=0,tdee=0,kcal=+b.kcal||0;
  if(b.age&&b.h&&kg){bmr=10*kg+6.25*b.h-5*b.age+(b.sex==="f"?-161:5);tdee=bmr*b.act}
  if(!kcal&&tdee)kcal=Math.round((tdee+(GOALS.find(g=>g[0]===b.goal)||GOALS[1])[2])/10)*10;
  if(!kcal)return null;
  const p=+b.prot||(kg?Math.round(kg*(b.goal==="lose"?2:1.8)):Math.round(kcal*.25/4)),f=Math.round(kcal*.27/9),c=Math.max(0,Math.round((kcal-p*4-f*9)/4));
  return{kcal,p,c,f,bmr:Math.round(bmr),tdee:Math.round(tdee)};
}
const fper=f=>`${f.per===1?"1":f.per} ${f.unit}`;
const fsum=f=>`${Math.round(f.kcal)} kcal · P ${r1(f.p)} · C ${r1(f.c)} · F ${r1(f.f)}`;
let fs={m:"b",d:"",q:"",sel:"",mode:"list",online:[],loading:false,err:false},fedit="";
const openMeals=new Set();

function vFood(){
  const k=key(cur),M=S.meals.filter(m=>m.d===k),tg=targets(),t={kcal:sum(M,"kcal"),p:sum(M,"p"),c:sum(M,"c"),f:sum(M,"f")};
  const days=[...Array(14)].map((_,i)=>addD(cur,i-13));
  const kc=bars(days.map(d=>String(d.getDate())),[{label:"Eaten",data:days.map(d=>Math.round(sum(S.meals.filter(m=>m.d===key(d)),"kcal")))}],
    {label:"Calories per day, last 14 days",fmt:v=>v+" kcal",line:tg?{label:"Target",data:days.map(()=>tg.kcal)}:null,footer:it=>dayLbl(days[it[0].dataIndex])});
  const W=[...S.weights].sort((a,b)=>a.d<b.d?-1:1).slice(-30),lw=latestWeight(),old=W.find(w=>w.d>=key(addD(new Date(),-30)));
  const wC=W.length>1?chart(lines(W.map(w=>sh(dt(w.d),{day:"numeric",month:"short"})),[{label:"Weight",data:W.map(w=>w.kg)}],{zero:false,fmt:v=>v+" kg",label:"Body weight"}),150):"";
  const left=tg?tg.kcal-t.kcal:0;
  const meal=([id,name,icn])=>{const x=M.filter(m=>m.m===id),open=openMeals.has(id)&&x.length;
    return `<div class="rw ${x.length?"tap":""}" ${x.length?`data-a="fopen" data-m="${id}"`:""}><span class="ci">${ic(icn,"s")}</span><span class="g">${name}${x.length?`<div class="meta">${x.map(m=>esc(m.name)).join(", ").slice(0,60)}</div>`:""}</span>
    <span class="v">${x.length?Math.round(sum(x,"kcal")):""}</span><button class="ib" data-a="fadd" data-m="${id}" aria-label="Add to ${name}">${ic("plus","s")}</button></div>
    ${open?x.map(m=>`<div class="rw" style="padding-left:42px"><span class="g">${esc(m.name)}<div class="meta">${m.q?r1(m.q)+" "+esc(m.unit)+" · ":""}P ${Math.round(m.p)} g</div></span><span class="v">${Math.round(m.kcal)}</span><button class="ib" data-a="fdel" data-id="${m.id}" aria-label="Delete">${ic("x","s")}</button></div>`).join(""):""}`};
  return `<div class="stack">
  ${tile(`<div class="ringbox">${tg?ring1(t.kcal/tg.kcal,COL.food,left>=0?Math.round(left).toLocaleString("en-US"):"+"+Math.round(-left),left>=0?"kcal left":"kcal over",118,"Calories"):ring1(0,COL.food,Math.round(t.kcal),"kcal eaten",118)}
    <div class="legend">${tg?MAC.map(([m,n],i)=>`<div class="macro"><span>${n}</span>${bar(t[m]/tg[m]*100,false,pal(i))}<span>${Math.round(t[m])}/${tg[m]} g</span></div>`).join("")+`<div class="lb">${Math.round(t.kcal)} of ${tg.kcal} kcal</div>`
      :`<p style="margin:0 0 8px">Set your daily target and the ring counts down what's left.</p><button class="btn sm p" data-a="ftgt">${ic("target","s")} Set target</button>`}</div></div>
    <div class="chipset" style="margin-top:12px">${tg?`<button class="chip" data-a="ftgt">${ic("target","s")} Targets</button>`:""}<button class="chip" data-a="ffoods">${ic("apple","s")} My foods</button><button class="chip" data-a="fcopy">${ic("copy","s")} Copy yesterday</button></div>`)}
  ${tile(MEALS.map(meal).join(""))}
  ${tile(`<h2><span>${ic("scale","s")} Weight</span><span class="lb">${lw?lw+" kg":""}${lw&&old&&old.kg!==lw?` · <span class="${lw<old.kg?"good":""}">${lw-old.kg>0?"+":""}${r1(lw-old.kg)} kg in 30 days</span>`:""}</span></h2>
    <div class="addrow" data-form><input name="kg" type="number" inputmode="decimal" step="0.1" min="20" placeholder="Today's weight, kg" aria-label="Weight in kg"><input type="hidden" name="d" value="${k}"><button class="ib" data-a="wadd" aria-label="Save weight">${ic("check")}</button></div>
    ${wC||'<p class="empty">Weigh yourself now and then to see the trend.</p>'}${W.length?`<details><summary>All weigh-ins</summary>${[...W].reverse().map(w=>`<div class="rw"><span class="g">${dayLbl(dt(w.d))}</span><span class="v">${w.kg} kg</span><button class="ib" data-a="wdel" data-id="${w.id}" aria-label="Delete">${ic("x","s")}</button></div>`).join("")}</details>`:""}`)}
  ${tile(`<h2>Calories, last 14 days</h2>${chart(kc,180)}`)}</div>`;
}

// ---- add-food sheet ----
function useCount(){const u={};S.meals.forEach(m=>u[m.name]=(u[m.name]||0)+1);return u}
function foodList(){
  const q=fs.q.toLowerCase(),u=useCount();
  const mine=S.foods.filter(f=>!q||f.name.toLowerCase().includes(q)).sort((a,b)=>(u[b.name]||0)-(u[a.name]||0)).slice(0,40);
  let h=mine.map(f=>`<div class="fi" data-a="fsel" data-id="${f.id}"><span><b style="font-weight:600">${esc(f.name)}</b><br><small class="mute">per ${fper(f)} · ${fsum(f)}</small></span>${ic("chevron-right","s")}</div>`).join("")||`<div class="empty">No saved food matches “${esc(fs.q)}”.</div>`;
  if(q.length>=2)h+=`<button class="btn w" data-a="fon" style="margin-top:10px">${ic("search","s")} Search online for “${esc(fs.q)}”</button>`;
  if(fs.loading)h+='<p class="lb">Searching Open Food Facts…</p>';
  else if(fs.err)h+="<p class=\"lb\">Online search didn't work. Check your internet, or use Quick add.</p>";
  else if(fs.online.length)h+=`<h3 style="margin:14px 0 0;font-size:14px">Online results <small class="mute">tap to save</small></h3>`+fs.online.map((f,i)=>`<div class="fi" data-a="fsel" data-on="${i}"><span><b style="font-weight:600">${esc(f.name)}</b><br><small class="mute">per 100 g · ${fsum(f)}</small></span>${ic("plus","s")}</div>`).join("");
  return h;
}
const updList=()=>{const l=$("#fl");if(l)l.innerHTML=foodList()};
function foodForm(f,act,label){f=f||{name:"",per:100,unit:"g",kcal:"",p:"",c:"",f:""};
  const n=(k,l)=>`<label class="fl n"><span>${l}</span><input name="${k}" type="number" inputmode="decimal" min="0" step="any" value="${f[k]}"></label>`;
  return `<div data-form data-id="${f.id||""}"><label class="fl"><span>Name</span><input name="name" value="${esc(f.name)}" placeholder="Somsa"></label>
  <div class="f"><label class="fl n"><span>Values per</span><input name="per" type="number" inputmode="decimal" min="0" step="any" value="${f.per}"></label><label class="fl n"><span>Unit</span><select name="unit">${["g","ml","pc","serving"].map(u=>opt(u,u,u===f.unit)).join("")}</select></label></div>
  <div class="f">${n("kcal","Calories")}${n("p","Protein g")}${n("c","Carbs g")}${n("f","Fat g")}</div>
  <p class="lb">Tip: for things like somsa use “1 pc”. For packaged food use the label's “per 100 g”.</p>
  <button class="btn p w" data-a="${act}">${label}</button></div>`;
}
function foodSheet(){
  const tabs=seg("fmeal",MEALS.map(m=>[m[0],m[1]]),fs.m)+seg("fsm",[["list","My foods"],["quick","Quick add"],["new","New food"]],fs.mode);
  if(fs.mode==="quick")return tabs+`<div data-form><label class="fl"><span>What did you eat?</span><input name="name" placeholder="Plov at a café" autofocus></label>
    <div class="f"><label class="fl n"><span>Calories</span><input name="kcal" type="number" inputmode="decimal" min="0"></label><label class="fl n"><span>Protein g (optional)</span><input name="p" type="number" inputmode="decimal" min="0"></label></div>
    <button class="btn p w" data-a="fquick">Add</button></div>`;
  if(fs.mode==="new")return tabs+foodForm(null,"fnew","Save to My foods and add");
  const f=fs.sel&&S.foods.find(x=>x.id===fs.sel);
  if(f)return tabs+`<div data-form><button class="btn sm" data-a="fback">${ic("chevron-left","s")} Back</button><h3 style="margin:12px 0 0">${esc(f.name)}</h3><p class="lb" style="margin-top:2px">per ${fper(f)} · ${fsum(f)}</p>
    <label class="fl"><span>Amount (${esc(f.unit)})</span><input name="q" data-i="fqty" type="number" inputmode="decimal" min="0" step="any" value="${f.per}"></label>
    <p><b id="fprev">${fsum(f)}</b></p><button class="btn p w" data-a="fput">Add to ${MEALS.find(m=>m[0]===fs.m)[1]}</button></div>`;
  return tabs+`<input id="fq" data-i="fq" value="${esc(fs.q)}" placeholder="Search my foods" style="margin-bottom:6px" autocomplete="off" enterkeyhint="search"><div id="fl">${foodList()}</div>`;
}
function openFood(m,d){fs={...fs,m:m||mealNow(),d:d||key(cur),q:"",sel:"",mode:"list",online:[],err:false};sheet("Add food",foodSheet)}
function addMeal(o){snap();S.meals.push({id:uid(),d:fs.d||key(cur),m:fs.m,...o});closeSheet();undoToast(`Added ${Math.round(o.kcal)} kcal`)}
function readFood(F){return{name:F.v("name"),per:F.n("per")||1,unit:F.v("unit")||"g",kcal:F.n("kcal"),p:F.n("p"),c:F.n("c"),f:F.n("f")}}

// ---- targets + my foods sheets ----
function targetSheet(){
  const b=S.body,tg=targets(),n=(k,l,v,st="1")=>`<label class="fl n"><span>${l}</span><input name="${k}" type="number" inputmode="decimal" min="0" step="${st}" value="${v||""}"></label>`;
  return `<div data-form><div class="f"><label class="fl n"><span>Sex</span><select name="sex">${opt("m","Male",b.sex==="m")}${opt("f","Female",b.sex==="f")}</select></label>${n("age","Age",b.age)}</div>
  <div class="f">${n("h","Height, cm",b.h)}${n("kg","Weight, kg",latestWeight(),"0.1")}</div>
  <label class="fl"><span>Activity</span><select name="act">${ACT.map(([v,l])=>opt(v,l,+b.act===v)).join("")}</select></label>
  <label class="fl"><span>Goal</span><select name="goal">${GOALS.map(([v,l])=>opt(v,l,b.goal===v)).join("")}</select></label>
  ${tg&&tg.tdee?tile(`<b>${tg.kcal} kcal a day</b><br><small class="mute">At rest ${tg.bmr} kcal · with activity ${tg.tdee} kcal · goal ${tg.kcal-tg.tdee>0?"+":""}${tg.kcal-tg.tdee}<br>Protein ${tg.p} g · Carbs ${tg.c} g · Fat ${tg.f} g</small>`,"t","style=\"margin-bottom:10px\""):""}
  <details><summary>Set my own numbers instead</summary><div class="f" style="margin-top:8px">${n("kcal","Calories / day",b.kcal)}${n("prot","Protein g / day",b.prot)}</div><small class="mute">Leave empty to use the calculation.</small></details>
  <button class="btn p w" data-a="tgsave" style="margin-top:12px">Save</button>
  <p class="lb">Uses the Mifflin–St Jeor formula. Protein is about 1.8 g per kg (2 g when losing fat). It's an estimate: if your weight doesn't move as planned after 2–3 weeks, adjust by 100–200 kcal.</p></div>`;
}
function foodsSheet(){
  if(fedit){const f=S.foods.find(x=>x.id===fedit);return `<button class="btn sm" data-a="fe" data-id="">${ic("chevron-left","s")} Back</button><div style="margin-top:12px">`+foodForm(f,"fsave","Save changes")+"</div>"}
  return `<p class="lb" style="margin-top:0">${plural(S.foods.length,"saved food")}. Values are approximate. Tap one to edit it.</p>`+S.foods.map(f=>`<div class="rw"><span class="g tap" data-a="fe" data-id="${f.id}"><b style="font-weight:600">${esc(f.name)}</b><div class="meta">per ${fper(f)} · ${fsum(f)}</div></span><button class="ib" data-a="fx" data-id="${f.id}" aria-label="Delete">${ic("trash","s")}</button></div>`).join("");
}

A.fopen=(b,f,F,e)=>{if(e.target.closest("button"))return false;const m=b.dataset.m;openMeals.has(m)?openMeals.delete(m):openMeals.add(m)};
A.fadd=b=>{openFood(b.dataset.m);return false};
A.fmeal=b=>{fs.m=b.dataset.v;$("#sh-b").innerHTML=foodSheet();return false};
A.fsm=b=>{fs.mode=b.dataset.v;fs.sel="";$("#sh-b").innerHTML=foodSheet();return false};
A.fback=()=>{fs.sel="";$("#sh-b").innerHTML=foodSheet();return false};
A.fsel=b=>{
  if(b.dataset.on!=null){const o=fs.online[+b.dataset.on],ex=S.foods.find(f=>f.name===o.name);
    if(ex)fs.sel=ex.id;else{const f={id:uid(),...o};S.foods.push(f);fs.sel=f.id;save();toast("Saved to My foods")}}
  else fs.sel=b.dataset.id;
  $("#sh-b").innerHTML=foodSheet();const q=$("#sh-b [name=q]");q&&q.select();return false};
A.fon=async()=>{fs.loading=true;fs.err=false;fs.online=[];updList();
  try{const r=await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(fs.q)}&search_simple=1&action=process&json=1&page_size=20&fields=product_name,brands,nutriments`);
    const j=await r.json();
    fs.online=arr(j.products).filter(p=>p.product_name&&p.nutriments&&p.nutriments["energy-kcal_100g"]!=null).slice(0,15).map(p=>({name:p.product_name.trim()+(p.brands?" ("+p.brands.split(",")[0].trim()+")":""),per:100,unit:"g",
      kcal:Math.round(+p.nutriments["energy-kcal_100g"]),p:r1(+p.nutriments.proteins_100g||0),c:r1(+p.nutriments.carbohydrates_100g||0),f:r1(+p.nutriments.fat_100g||0)}));
    if(!fs.online.length)toast("Nothing found online");
  }catch(e){fs.err=true}
  fs.loading=false;updList();return false};
A.fput=(b,f,F)=>{const fd=S.foods.find(x=>x.id===fs.sel),q=F.n("q");if(!fd||!q)return false;const k=q/fd.per;
  addMeal({name:fd.name,q,unit:fd.unit,kcal:Math.round(fd.kcal*k),p:r1(fd.p*k),c:r1(fd.c*k),f:r1(fd.f*k)})};
A.fquick=(b,f,F)=>{if(!F.v("name")||!F.n("kcal")){toast("Add a name and calories");return false}addMeal({name:F.v("name"),q:0,unit:"",kcal:F.n("kcal"),p:F.n("p"),c:0,f:0})};
A.fnew=(b,f,F)=>{const o=readFood(F);if(!o.name||!o.kcal){toast("Add a name and calories");return false}
  const fd={id:uid(),...o};S.foods.push(fd);fs.mode="list";fs.sel=fd.id;save();$("#sh-b").innerHTML=foodSheet();toast("Saved. Now set the amount");return false};
A.fdel=b=>{snap();S.meals=S.meals.filter(m=>m.id!==b.dataset.id);undoToast("Removed")};
A.fcopy=()=>{const k=key(cur),y=S.meals.filter(m=>m.d===key(addD(cur,-1)));if(!y.length){toast("Nothing logged yesterday");return false}
  snap();y.forEach(m=>S.meals.push({...m,id:uid(),d:k}));undoToast(`Copied ${plural(y.length,"item")} from yesterday`)};
A.ftgt=()=>{sheet("Daily targets",targetSheet);return false};
A.tgsave=(b,f,F)=>{Object.assign(S.body,{sex:F.v("sex"),age:F.n("age"),h:F.n("h"),act:+F.v("act"),goal:F.v("goal"),kcal:F.n("kcal"),prot:F.n("prot")});
  const kg=F.n("kg");if(kg&&kg!==latestWeight()){S.weights=S.weights.filter(w=>w.d!==today());S.weights.push({id:uid(),d:today(),kg})}
  const t=targets();toast(t?`Target: ${t.kcal} kcal, ${t.p} g protein`:"Saved. Fill in age, height and weight for a target")};
A.ffoods=()=>{fedit="";sheet("My foods",foodsSheet);return false};
A.fe=b=>{fedit=b.dataset.id;$("#sh-b").innerHTML=foodsSheet();return false};
A.fsave=(b,f,F)=>{const fd=S.foods.find(x=>x.id===f.dataset.id),o=readFood(F);if(!fd||!o.name)return false;Object.assign(fd,o);fedit="";toast("Food updated")};
A.fx=b=>{snap();S.foods=S.foods.filter(f=>f.id!==b.dataset.id);undoToast("Food deleted")};
A.wadd=(b,f,F)=>{const kg=F.n("kg"),d=F.v("d");if(!kg||kg<20||!d){toast("Enter your weight in kg");return false}
  S.weights=S.weights.filter(w=>w.d!==d);S.weights.push({id:uid(),d,kg});toast("Weight saved")};
A.wdel=b=>{snap();S.weights=S.weights.filter(w=>w.id!==b.dataset.id);undoToast("Weigh-in deleted")};
C.fq=el=>{fs.q=el.value;fs.online=[];fs.err=false;updList()};
C.fqty=el=>{const f=S.foods.find(x=>x.id===fs.sel),k=num(el.value)/f.per;$("#fprev").textContent=fsum({kcal:f.kcal*k,p:f.p*k,c:f.c*k,f:f.f*k})};
