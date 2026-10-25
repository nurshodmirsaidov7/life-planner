"use strict";
// ---------- Money: expenses, budget, charts ----------
let lastD=null;   // remembers the date last used in an add form
const dflt=P=>{if(lastD&&inR(lastD,P))return lastD;const t=today();return inR(t,P)?t:key(P[0])};
const catColor=c=>pal(Math.max(0,CATS.findIndex(x=>x[0]===c)));

V.spend={title:"Money",nav:()=>mode.spend,render(){
  const isM=mode.spend==="month",P=isM?monthDays(cur):wkD(),tk=today();
  const E=S.exp.filter(e=>inR(e.d,P)),tot=sum(E,"a"),by={};
  E.forEach(e=>by[e.c]=(by[e.c]||0)+e.a);
  const el=P.filter(d=>key(d)<=tk).length||P.length,bud=S.budget?S.budget*P.length/7:0,left=bud?bud-tot:null;
  const cats=Object.entries(by).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...Object.values(by));
  const names=[...new Set(S.exp.map(e=>e.n))].slice(-60);
  // charts
  const daily=bars(P.map(d=>isM?String(d.getDate()):DN[(d.getDay()+6)%7]),[{label:"Spent",data:P.map(d=>sum(E.filter(e=>e.d===key(d)),"a")),color:pal(0)}],
    {label:"Spending per day",fmt:v=>money(v),tick:moneyS,line:S.budget?{label:"Daily budget",data:P.map(()=>S.budget/7)}:null,legend:!!S.budget});
  const ms=[...Array(6)].map((_,i)=>new Date(cur.getFullYear(),cur.getMonth()-5+i,1));
  const trend=bars(ms.map(m=>sh(m,{month:"short"})),[{label:"Spent",data:ms.map(m=>{const k=key(m).slice(0,7);return sum(S.exp.filter(e=>e.d.startsWith(k)),"a")}),color:pal(0)}],
    {label:"Spending per month, last 6 months",fmt:v=>money(v),tick:moneyS,line:S.budget?{label:"Monthly budget",data:ms.map(m=>S.budget*monthDays(m).length/7)}:null,legend:!!S.budget});
  const list=[...P].reverse().map(d=>{const k=key(d),x=E.filter(e=>e.d===k);if(!x.length)return"";
    return `<div class="dh"><span>${dayLbl(d)}</span><span>${money(sum(x,"a"))}</span></div>`+x.map(e=>`<div class="row"><span class="g"><i class="dot" style="background:${catColor(e.c)}"></i>${esc(e.n)} <small class="mute">${esc(e.c)}</small></span><span class="a">${money(e.a)}</span><button class="ib" data-a="de" data-id="${e.id}" aria-label="Delete">✕</button></div>`).join("")}).join("");
  return seg("smode",[["week","Week"],["month","Month"]],mode.spend)+`
  <div class="stats">${stat(isM?"Spent this month":"Spent this week",money(tot),plural(E.length,"purchase"))}${stat("Daily average",money(tot/el),"over "+plural(el,"day"))}
  ${stat("Budget left",left===null?"—":money(left),bud?"of "+money(bud)+(left<0?" · over!":""):"Set a weekly budget in Settings")}${stat("Top category",cats.length?esc(cats[0][0]):"—",cats.length?money(cats[0][1])+" · "+Math.round(cats[0][1]/tot*100)+"%":"")}</div>
  <div class="card soft mb" data-form><h2>Add an expense</h2><div class="f"><input name="n" class="w" list="nm" placeholder="What did you buy?" enterkeyhint="next" autocomplete="off">
  <input name="a" class="n" type="number" inputmode="decimal" min="0" step="any" placeholder="Amount"><select name="c" aria-label="Category">${CATS.map(c=>opt(c[0],c[1]+" "+c[0])).join("")}</select>
  <input type="date" name="d" value="${dflt(P)}" aria-label="Date"><button class="p x" data-a="ae">Add</button></div><datalist id="nm">${names.map(n=>`<option value="${esc(n)}">`).join("")}</datalist></div>
  <div class="two"><div class="card"><h2>Spending per day</h2>${chart(daily,220)}</div>
  <div class="card"><h2>By category</h2>${bud?bar(tot/bud*100,tot>bud)+`<p class="mute" style="margin:4px 0 10px"><small>${Math.round(tot/bud*100)}% of budget used</small></p>`:""}
  ${cats.map(([c,v])=>`<div class="cat"><span><i class="dot" style="background:${catColor(c)}"></i>${esc(c)}</span>${bar(v/mx*100,false,catColor(c))}<span>${money(v)} <small class="mute">${Math.round(v/tot*100)}%</small></span></div>`).join("")||'<div class="empty">Nothing yet.</div>'}</div></div>
  <div class="two"><div class="card"><h2>Last 6 months</h2>${chart(trend,220)}</div>
  <div class="card"><h2>${isM?"This month":"This week"}</h2>${list||'<div class="empty">No spending logged.</div>'}</div></div>`;
}};

A.smode=b=>{mode.spend=b.dataset.v};
A.ae=(b,f,F)=>{if(!F.v("n")||!F.n("a")||!F.v("d")){toast("Add a name and an amount");return false}
  lastD=F.v("d");S.exp.push({id:uid(),d:F.v("d"),n:F.v("n"),a:F.n("a"),c:F.v("c")});toast("Added "+money(F.n("a")));return "[name=n]"};
A.de=b=>{S.exp=S.exp.filter(x=>x.id!==b.dataset.id)};
