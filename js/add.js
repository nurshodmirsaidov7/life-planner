"use strict";
// ---------- Quick add: the + button. One menu for everything, plus one-tap repeats of recent entries. ----------
const QA=[["task","Task","checkbox","today"],["exp","Expense","wallet","money"],["food","Food","salad","food"],["work","Workout","barbell","work"],["run","Run","run","work"],["study","Study","book","learn"]];
// Date new entries go to: the day being viewed on Today/Food, otherwise today.
const addDay=()=>(tab==="today"&&mode.plan==="day")||(tab==="fit"&&mode.fit==="food")?key(cur):today();

function recentList(){
  const seen=new Set(),ex=[...S.exp].sort((a,b)=>a.d<b.d?1:-1).filter(e=>!seen.has(e.n)&&seen.add(e.n)).slice(0,3);
  const fm=new Set(),fo=[...S.meals].sort((a,b)=>a.d<b.d?1:-1).filter(m=>!fm.has(m.name)&&fm.add(m.name)).slice(0,2);
  return ex.map(e=>`<div class="rw tap" data-a="qr" data-k="exp" data-id="${e.id}"><span class="ci" style="--cc:${COL.money}">${ic(catIcon(e.c),"s")}</span><span class="g">${esc(e.n)}<div class="meta">${esc(e.c)}</div></span><span class="v">${moneyS(e.a)}</span>${ic("plus","s")}</div>`).join("")
    +fo.map(m=>`<div class="rw tap" data-a="qr" data-k="food" data-id="${m.id}"><span class="ci" style="--cc:${COL.food}">${ic("salad","s")}</span><span class="g">${esc(m.name)}<div class="meta">${m.q?r1(m.q)+" "+esc(m.unit):"food"}</div></span><span class="v">${Math.round(m.kcal)} kcal</span>${ic("plus","s")}</div>`).join("");
}
function quickSheet(){
  const r=recentList();
  return `<div class="qgrid">${QA.map(([k,l,i,c])=>`<button data-a="qa" data-k="${k}" style="color:${COL[c]}">${ic(i)}<span style="color:var(--ink)">${l}</span></button>`).join("")}</div>
  ${r?`<div class="lb" style="margin:16px 0 2px">Again today</div>${r}`:""}`;
}
function qform(k){
  const d=addDay();
  if(k==="task")return `<div data-form>${taskFields({t:"",d,tm:"",p:false,lid:"",lu:1})}
    <details><summary>Repeat this task</summary><div style="margin-top:8px">${dayChecks([])}</div></details><button class="btn p w" data-a="qtask" style="margin-top:12px">Add task</button></div>`;
  if(k==="exp")return `<div data-form><label class="fl"><span>What did you buy?</span><input name="n" list="nm" data-i="expn" autofocus placeholder="Metro" autocomplete="off"></label>
    <datalist id="nm">${[...new Set(S.exp.map(e=>e.n))].slice(-80).map(n=>`<option value="${esc(n)}">`).join("")}</datalist>
    <label class="fl"><span>Amount${S.cur==="UZS"?", so'm":", $"}</span><input name="a" type="number" inputmode="decimal" min="0" step="any"></label>
    <div class="fl"><span>Category</span><div class="chipset">${CATS.map((c,i)=>`<label><input type="radio" name="c" value="${c[0]}" ${i===0?"checked":""}><span>${ic(c[1],"s")} ${c[0]}</span></label>`).join("")}</div></div>
    <label class="fl"><span>Date</span><input type="date" name="d" value="${d}"></label><button class="btn p w" data-a="qexp">Add expense</button></div>`;
  if(k==="work"){const m=mode.wlog==="gym"?"gym":"reps";return seg("qwk",[["reps","Reps"],["gym","Gym sets"]],m)+`<div data-form>${workForm(m,d)}</div>`}
  if(k==="run")return `<div data-form>${workForm("run",d)}</div>`;
  return `<div data-form>${studyFields("")}<button class="btn p w" data-a="ladd2">Save session</button></div>`;
}

A.add=()=>{sheet("Add",quickSheet);return false};
A.qa=b=>{const k=b.dataset.k;if(k==="food"){openFood(null,addDay());return false}
  if(k==="work")mode.wlog=mode.wlog==="gym"?"gym":"reps";
  sheet(QA.find(q=>q[0]===k)[1],()=>qform(k));return false};
A.qwk=b=>{mode.wlog=b.dataset.v;$("#sh-b").innerHTML=qform("work");return false};
A.qtask=(b,f,F)=>{const t=F.v("t"),d=F.v("d")||addDay(),days=F.all("rd").map(Number);if(!t){toast("Write the task first");return false}snap();
  const o={t,tm:F.v("tm"),p:F.ck("p"),lid:F.v("lid"),lu:F.v("lid")?F.n("lu")||1:0};
  if(days.length){S.rec.push({id:uid(),...o,days,start:d,skip:[]});ensureRec([dt(d)])}
  else S.tasks.push({id:uid(),d,x:false,rid:"",...o});
  closeSheet();undoToast(days.length?"Repeating task added":d===today()?"Task added":"Task added for "+dayLbl(dt(d)))};
A.qexp=(b,f,F)=>{const n=F.v("n"),a=F.n("a"),d=F.v("d");if(!n||!a||!d){toast("Add what you bought and the amount");return false}snap();
  lastD=d;S.exp.push({id:uid(),d,n,a,c:F.all("c")[0]||"Other"});closeSheet();undoToast(`${money(a)} added`)};
A.qr=b=>{snap();
  if(b.dataset.k==="exp"){const e=S.exp.find(x=>x.id===b.dataset.id);S.exp.push({...e,id:uid(),d:today()});closeSheet();undoToast(`${e.n} · ${money(e.a)} added`)}
  else{const m=S.meals.find(x=>x.id===b.dataset.id);S.meals.push({...m,id:uid(),d:today(),m:mealNow()});closeSheet();undoToast(`${m.name} · ${Math.round(m.kcal)} kcal added`)}};
// Typing a name you used before fills in its last category (and amount, if empty).
C.expn=el=>{const f=el.closest("[data-form]"),n=el.value.trim().toLowerCase(),e=[...S.exp].reverse().find(x=>x.n.toLowerCase()===n);if(!e)return;
  const r=f.querySelector(`[name=c][value="${e.c}"]`);if(r)r.checked=true;const a=f.querySelector("[name=a]");if(!a.value)a.value=e.a};
