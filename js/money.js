"use strict";
// ---------- Money: budget ring, spending charts, purchases ----------
let lastD=null;   // remembers the date last used in an add form
const dflt=P=>{if(lastD&&inR(lastD,P))return lastD;const t=today();return inR(t,P)?t:key(P[0])};
const catIdx=c=>Math.max(0,CATS.findIndex(x=>x[0]===c));
const catColor=c=>pal(catIdx(c));
const catIcon=c=>CATS[catIdx(c)][1];
const expRow=e=>`<div class="rw"><span class="ci" style="--cc:${catColor(e.c)}">${ic(catIcon(e.c),"s")}</span><span class="g">${esc(e.n)}<div class="meta">${esc(e.c)}</div></span><span class="v">${money(e.a)}</span><button class="ib" data-a="de" data-id="${e.id}" aria-label="Delete">${ic("x","s")}</button></div>`;

V.spend={title:"Money",nav:()=>mode.spend,render(){
  const isM=mode.spend==="month",P=isM?monthDays(cur):wkD(),tk=today();
  const E=S.exp.filter(e=>inR(e.d,P)),tot=sum(E,"a"),by={};E.forEach(e=>by[e.c]=(by[e.c]||0)+e.a);
  const el=P.filter(d=>key(d)<=tk).length||P.length,bud=S.budget?S.budget*P.length/7:0,left=bud-tot;
  const cats=Object.entries(by).sort((a,b)=>b[1]-a[1]),mx=Math.max(1,...Object.values(by));
  const daily=bars(P.map(d=>isM?String(d.getDate()):DN[(d.getDay()+6)%7][0]),[{label:"Spent",data:P.map(d=>sum(E.filter(e=>e.d===key(d)),"a"))}],
    {label:"Spending per day",fmt:v=>money(v),tick:moneyS,line:S.budget?{label:"Daily budget",data:P.map(()=>S.budget/7)}:null,footer:it=>dayLbl(P[it[0].dataIndex])});
  const ms=[...Array(6)].map((_,i)=>new Date(cur.getFullYear(),cur.getMonth()-5+i,1));
  const trend=bars(ms.map(m=>sh(m,{month:"short"})),[{label:"Spent",data:ms.map(m=>{const k=key(m).slice(0,7);return sum(S.exp.filter(e=>e.d.startsWith(k)),"a")})}],
    {label:"Spending per month",fmt:v=>money(v),tick:moneyS,line:S.budget?{label:"Monthly budget",data:ms.map(m=>S.budget*monthDays(m).length/7)}:null});
  const list=[...P].reverse().map(d=>{const k=key(d),x=E.filter(e=>e.d===k);if(!x.length)return"";
    return `<div class="rw" style="min-height:0;padding-top:12px"><b class="g" style="font-size:13px">${dayLbl(d)}</b><span class="lb">${money(sum(x,"a"))}</span></div>`+x.map(expRow).join("")}).join("");
  return head("Money",{nav:mode.spend})+seg("smode",[["week","Week"],["month","Month"]],mode.spend)+`<div class="stack">
  ${tile(`<div class="ringbox">${bud?ring1(tot/bud,COL.money,Math.round(tot/bud*100)+"%","of budget",112,"Budget used"):ring1(0,COL.money,moneyS(tot),"spent",112)}
    <div class="legend"><div class="lb">Spent ${isM?"this month":"this week"}</div><div class="big">${money(tot)}</div>
    ${bud?`<div class="${left<0?"bad":"good"}" style="font-size:14px;font-weight:600;margin-top:2px">${left<0?money(-left)+" over budget":money(left)+" left"}</div>`:`<button class="btn ghost" data-a="tab" data-t="set" style="padding-left:0">Set a weekly budget</button>`}
    <div class="lb" style="margin-top:6px">${money(tot/el)} a day on average</div></div></div>`)}
  ${tile(`<h2>Per day</h2>${chart(daily,180)}`)}
  ${tile(`<h2>By category</h2>${cats.map(([c,v])=>`<div class="cat"><span class="ci" style="--cc:${catColor(c)}">${ic(catIcon(c),"s")}</span><span>${esc(c)}</span>${bar(v/mx*100,false,catColor(c))}<span class="v">${moneyS(v)} <small class="mute">${Math.round(v/tot*100)}%</small></span></div>`).join("")||'<div class="empty">Tap + to log your first purchase.</div>'}`)}
  ${tile(`<h2>Purchases</h2>${list||'<div class="empty">No purchases in this period.</div>'}`)}
  ${tile(`<h2>Last 6 months</h2>${chart(trend,170)}`)}</div>`;
}};

A.smode=b=>{mode.spend=b.dataset.v;anim=true};
A.de=b=>{snap();S.exp=S.exp.filter(x=>x.id!==b.dataset.id);undoToast("Purchase deleted")};
