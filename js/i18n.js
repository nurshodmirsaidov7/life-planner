"use strict";
// ---------- Languages: English source strings are the keys; uz / ru dictionaries live in i18n-dict.js ----------
const LANGS=[["en","English","en-GB"],["uz","Oʻzbekcha","uz-Latn-UZ"],["ru","Русский","ru-RU"]];
const I18N={uz:{},ru:{}};
let LANG="en";
const LOC=()=>(LANGS.find(l=>l[0]===LANG)||LANGS[0])[2];
// T("{n} kcal left",{n:5}) → translated text with values filled in. Missing translations fall back to English.
const T=(s,v)=>{let r=(LANG!=="en"&&I18N[LANG][s])||s;if(v)r=r.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?v[k]:m);return r};
// Counted nouns: English adds "s", Uzbek never changes after a number, Russian has three forms.
const PLW={
  uz:{"day":"kun","set":"set","training day":"mashgʻulot kuni","saved food":"saqlangan taom","item":"ta","logged entry":"yozuv"},
  ru:{"day":["день","дня","дней"],"set":["подход","подхода","подходов"],"training day":["тренировочный день","тренировочных дня","тренировочных дней"],
      "saved food":["сохранённое блюдо","сохранённых блюда","сохранённых блюд"],"item":["позиция","позиции","позиций"],"logged entry":["запись","записи","записей"]}};
function plural(n,w){
  if(LANG==="en")return `${n} ${w}${n===1?"":"s"}`;
  const f=PLW[LANG][w];if(!f)return `${n} ${w}`;
  if(typeof f==="string")return `${n} ${f}`;
  const a=Math.abs(n)%100,b=a%10;return `${n} ${f[b===1&&a!==11?0:b>=2&&b<=4&&(a<12||a>14)?1:2]}`;
}
const cap=s=>s.charAt(0).toLocaleUpperCase(LOC())+s.slice(1);
// Many phones ship without Uzbek date data, so Uzbek names are built in rather than taken from the browser.
const UZ={m:["yanvar","fevral","mart","aprel","may","iyun","iyul","avgust","sentabr","oktabr","noyabr","dekabr"],
  ms:["yan","fev","mar","apr","may","iyn","iyl","avg","sen","okt","noy","dek"],
  w:["Dushanba","Seshanba","Chorshanba","Payshanba","Juma","Shanba","Yakshanba"],ws:["Du","Se","Ch","Pa","Ju","Sh","Ya"]};
function fmtDate(d,o){
  if(LANG!=="uz")return d.toLocaleDateString(LOC(),o);
  const p=[],wi=(d.getDay()+6)%7;
  if(o.weekday)p.push((o.weekday==="long"?UZ.w:UZ.ws)[wi]+(o.day||o.month?",":""));
  if(o.day)p.push(d.getDate());
  if(o.month)p.push((o.month==="long"?UZ.m:UZ.ms)[d.getMonth()]);
  if(o.year)p.push(d.getFullYear());
  return p.join(" ");
}
function setLang(code){
  const nav=(navigator.language||"en").toLowerCase();
  LANG=LANGS.some(l=>l[0]===code)?code:nav.startsWith("ru")?"ru":nav.startsWith("uz")?"uz":"en";
  document.documentElement.lang=LANG;
  const names=fmt=>[...Array(7)].map((_,i)=>cap(new Date(2024,0,1+i).toLocaleDateString(LOC(),{weekday:fmt}).replace(/\.$/,"")));   // 1 Jan 2024 is a Monday
  if(LANG==="uz"){DN=UZ.ws.slice();DNL=UZ.w.slice()}else{DN=names("short");DNL=names("long")}
}
