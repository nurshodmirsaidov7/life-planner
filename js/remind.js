"use strict";
// ---------- Daily reminder: settings, notification permission and this device's push token ----------
// The hourly job in .github/workflows/reminders.yml reads users/{uid}.rem (synced settings) and
// users/{uid}.devices (one push token per device) and sends a nudge for whatever is still undone.
const VAPID="BGIAs0S6eTxNj9hiyhGF-A94TuhfokYXXE5Fq94Jx4yq4cohA9UwBN1e3V_cIHntNrDR1qfM0adwZZ3i3COQGlM";   // public key: Firebase → Project settings → Cloud Messaging → Web Push certificates
const REM_WHAT=[["tasks","Tasks left"],["food","Food"],["work","Workout (training days)"],["study","Study"]];
const DEVICE="trackme-device",PUSHED="trackme-pushed";
const deviceId=()=>{let d=localStorage.getItem(DEVICE);if(!d){d=uid()+uid();localStorage.setItem(DEVICE,d)}return d};
const pushOk=()=>"Notification" in window&&"serviceWorker" in navigator&&"PushManager" in window&&location.protocol==="https:"&&!!VAPID&&!!(window.firebase&&firebase.messaging);
const pushedHere=()=>localStorage.getItem(PUSHED)===(user&&user.uid);

function remindTile(){
  if(!user)return"";
  const r=S.rem,perm="Notification" in window?Notification.permission:"default";
  const note=!pushOk()?T("Notifications aren't available here. On iPhone, add TrackMe to the Home Screen first.")
    :perm==="denied"?T("Notifications are blocked for TrackMe. Allow them in your phone's settings, then try again."):"";
  return tile(`<h2><span>${ic("bell","s")} ${T("Daily reminder")}</span><label class="switch"><input type="checkbox" data-c="remOn" aria-label="${T("Daily reminder")}" ${r.on?"checked":""} ${pushOk()?"":"disabled"}><span></span></label></h2>
  <p class="lb" style="margin-top:0">${T("One evening nudge, only for what you haven't done yet today.")}</p>
  ${r.on?`<label class="fl"><span>${T("Time")}</span><select data-c="remH">${[...Array(24).keys()].map(h=>opt(h,pad(h)+":00",h===r.h)).join("")}</select></label>
  <div class="fl"><span>${T("Remind me about")}</span><div class="chipset">${REM_WHAT.map(([k,l])=>`<label><input type="checkbox" data-c="remWhat" value="${k}" ${r.what.includes(k)?"checked":""}><span>${T(l)}</span></label>`).join("")}</div></div>
  <div class="f">${pushOk()&&!pushedHere()?`<button class="btn p" data-a="remHere">${ic("bell","s")} ${T("Also notify this device")}</button>`:""}<button class="btn" data-a="remTest">${T("Send a test notification")}</button></div>`:""}
  ${note?`<p class="lb">${note}</p>`:""}`);
}

// Ask for permission, then store this device's push token in the account.
async function registerDevice(){
  if(await Notification.requestPermission()!=="granted"){toast(T("Notifications weren't allowed."));return false}
  const token=await firebase.messaging().getToken({vapidKey:VAPID,serviceWorkerRegistration:await navigator.serviceWorker.ready});
  await uref().set({devices:{[deviceId()]:{t:token,at:Date.now()}}},{merge:true});
  localStorage.setItem(PUSHED,user.uid);return true;
}
async function enableRem(){
  try{
    if(!await registerDevice()){render();return}
    Object.assign(S.rem,{on:true,tz:Intl.DateTimeFormat().resolvedOptions().timeZone||"Asia/Tashkent",lang:LANG});
    save();render();toast(T("Reminder on: every day at {h}",{h:pad(S.rem.h)+":00"}));
  }catch(e){console.warn(e);toast(T("Couldn't turn on notifications. Try again."));render()}
}
// Forget this device's token (on sign-out), so a signed-out phone gets no reminders.
async function dropDevice(){
  if(!pushedHere())return;localStorage.removeItem(PUSHED);
  try{await uref().update(new firebase.firestore.FieldPath("devices",deviceId()),firebase.firestore.FieldValue.delete());await firebase.messaging().deleteToken()}catch(e){}
}
// Tokens can change; keep this device's entry current whenever the app starts signed in.
async function remindRefresh(){
  if(!pushOk()||!pushedHere()||Notification.permission!=="granted")return;
  try{const t=await firebase.messaging().getToken({vapidKey:VAPID,serviceWorkerRegistration:await navigator.serviceWorker.ready});
    await uref().set({devices:{[deviceId()]:{t,at:Date.now()}}},{merge:true})}catch(e){console.warn(e)}
}

C.remOn=el=>{if(el.checked)enableRem();else{S.rem.on=false;save();render();toast(T("Reminder off"))}return false};
C.remH=el=>{S.rem.h=+el.value;Object.assign(S.rem,{tz:Intl.DateTimeFormat().resolvedOptions().timeZone||S.rem.tz,lang:LANG})};
C.remWhat=el=>{S.rem.what=[...el.closest(".chipset").querySelectorAll("input:checked")].map(i=>i.value)};
A.remHere=async()=>{try{if(await registerDevice())toast(T("This device will get reminders too"))}catch(e){console.warn(e);toast(T("Couldn't turn on notifications. Try again."))}render();return false};
A.remTest=async()=>{
  if(Notification.permission!=="granted"){toast(T("Notifications weren't allowed."));return false}
  (await navigator.serviceWorker.ready).showNotification(T("Evening check-in"),{body:T("This is how your reminder will look."),icon:"icon-192.png",tag:"trackme-test"});
  return false};
