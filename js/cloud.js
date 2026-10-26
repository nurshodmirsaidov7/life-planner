"use strict";
// ---------- Accounts and sync (Firebase) ----------
// The app always starts from localStorage, so it opens instantly and works offline.
// Firestore keeps devices in step: users/{uid} holds settings, users/{uid}/lists/{name}.items.{id} holds each entry,
// so edits to different entries on two devices never overwrite each other. Offline writes are queued by Firestore.
const FB_CFG={apiKey:"AIzaSyCqv1Z5miWaGEbKh2G3uPERgBndAIqwPnM",authDomain:"trackme-3c801.firebaseapp.com",projectId:"trackme-3c801",
  storageBucket:"trackme-3c801.firebasestorage.app",messagingSenderId:"553547445654",appId:"1:553547445654:web:2340fc367e8d000f7859b7"};
const OWNER="trackme-uid",DIRTY="trackme-dirty";
const PRIVACY_URL="https://nurshodmirsaidov7.github.io/privacy.html?lang=";   // the page picks the language from the end of this link
// Local testing against the Firebase emulator: http://127.0.0.1:PORT/?emu=1
const EMU=/^(localhost|127\.0\.0\.1)$/.test(location.hostname)&&/[?&]emu=1/.test(location.search);
const SETF=Object.keys(blank()).filter(k=>!LISTS.includes(k));
let db=null,user=null,authReady=false,base=null,unsub=[],sync="off",remote=null,pendingApply=false,amode="in",inFlight=0;

const enc=x=>JSON.stringify(x);
function snapOf(s){const b={lists:{},set:{}};LISTS.forEach(l=>{const m=b.lists[l]={};s[l].forEach(x=>m[x.id]=enc(x))});SETF.forEach(k=>b.set[k]=enc(s[k]));return b}
function fromRemote(set,lists){
  const o=blank();SETF.forEach(k=>{if(set&&set[k]!==undefined)o[k]=set[k]});
  LISTS.forEach(l=>{o[l]=Object.values(lists[l]||{}).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0)});
  return norm(o);
}
const uref=()=>db.collection("users").doc(user.uid);
const hasLocalData=()=>LISTS.some(l=>S[l].length);
// Sign-in is required once Firebase is available; until auth answers, a device that was signed in keeps working.
const needAuth=()=>!!db&&!user&&(authReady||!localStorage.getItem(OWNER));

function cloudInit(){
  if(!window.firebase)return;   // library missing: the app keeps working on this device only
  firebase.initializeApp(EMU?{...FB_CFG,projectId:"demo-trackme"}:FB_CFG);
  const auth=firebase.auth();db=firebase.firestore();
  if(EMU){auth.useEmulator("http://127.0.0.1:9099");db.useEmulator("127.0.0.1",8080)}
  db.enablePersistence({synchronizeTabs:true}).catch(()=>{});
  auth.languageCode=LANG;
  auth.getRedirectResult().catch(authErr);
  auth.onAuthStateChanged(u=>{authReady=true;
    if(u){if(!user||user.uid!==u.uid)startSync(u)}
    else{stopSync();render()}});
}

function setSync(s){sync=s;const el=$("#sync");if(el)el.textContent=syncText()}
function syncText(){
  if(sync==="saving")return navigator.onLine?T("Syncing…"):T("Offline. Changes will sync when you're online.");
  return {synced:T("All changes synced"),error:T("Sync problem. Your data is still saved on this phone."),off:""}[sync]||"";
}
addEventListener("online",()=>setSync(sync));addEventListener("offline",()=>setSync(sync));

// Called by save(): send only what changed since the last known server state.
function cloudPush(){
  if(!db)return;
  if(!user){if(localStorage.getItem(OWNER))localStorage.setItem(DIRTY,"1");return}
  if(!base)return;
  const now=snapOf(S),FV=firebase.firestore.FieldValue,FP=firebase.firestore.FieldPath,batch=db.batch();let n=0;
  const sf=[];SETF.forEach(k=>{if(now.set[k]!==base.set[k])sf.push(new FP(k),JSON.parse(now.set[k]))});
  if(sf.length){batch.set(uref(),{},{merge:true});batch.update(uref(),...sf);n++}
  LISTS.forEach(l=>{const a=now.lists[l],b=base.lists[l]||{},up=[],ref=uref().collection("lists").doc(l);
    for(const id in a)if(a[id]!==b[id])up.push(new FP("items",id),JSON.parse(a[id]));   // whole entry replaced
    for(const id in b)if(!(id in a))up.push(new FP("items",id),FV.delete());
    if(up.length){batch.set(ref,{},{merge:true});batch.update(ref,...up);n++}});
  base=now;
  if(!n){if(!inFlight&&sync==="saving")setSync("synced");return}   // nothing to send: already in step
  inFlight++;setSync("saving");
  batch.commit().then(()=>{inFlight--;if(!inFlight&&sync!=="error")setSync("synced")},e=>{inFlight--;setSync("error");syncErr(e)});
}

async function startSync(u){
  user=u;setSync("saving");
  const owner=localStorage.getItem(OWNER);let R=null,has=false;
  try{
    const[sd,ls]=await Promise.all([uref().get(),uref().collection("lists").get()]);
    has=sd.exists||!ls.empty;
    if(has)R=fromRemote(sd.data(),Object.fromEntries(ls.docs.map(d=>[d.id,(d.data()||{}).items||{}])));
  }catch(e){
    if(owner!==u.uid){setSync("error");user=null;await firebase.auth().signOut().catch(()=>{});
      if(e&&e.code==="permission-denied")syncErr(e);else toast(T("Connect to the internet to sign in."));render();return}
    // same account, offline with no cache yet: keep using this device's data; the listeners catch up later
  }
  if(!has){base={lists:{},set:{}};if(owner&&owner!==u.uid)S=blank()}   // new account: this device's data is uploaded
  else{
    base=snapOf(R);
    if(owner===u.uid)S=localStorage.getItem(DIRTY)?merge(R,S):R;     // changes made before sign-in finished are kept
    else if(!owner)S=merge(R,S);                                       // first sign-in here: combine both
    else S=R;                                                          // this device belonged to another account
  }
  if(!S.name&&u.displayName)S.name=u.displayName.split(" ")[0];
  localStorage.setItem(OWNER,u.uid);localStorage.removeItem(DIRTY);
  setLang(S.lang);localizeDefaults();
  save();subscribe();render();
  if(!S.onb&&!$("#sheet").open)openWelcome();
}
function subscribe(){
  remote={set:null,lists:{}};let gs=false,gl=false;
  unsub.push(uref().onSnapshot(d=>{remote.set=d.data()||{};gs=true;if(gl)applyRemote()},syncErr));
  unsub.push(uref().collection("lists").onSnapshot(q=>{q.docChanges().forEach(c=>{if(c.type==="removed")delete remote.lists[c.doc.id];else remote.lists[c.doc.id]=(c.doc.data()||{}).items||{}});
    gl=true;if(gs)applyRemote()},syncErr));
}
const busy=()=>$("#sheet").open||$("#dlg").open||/^(INPUT|TEXTAREA|SELECT)$/.test((document.activeElement||{}).tagName||"");
function applyRemote(){
  const R=fromRemote(remote.set,remote.lists),nb=snapOf(R);base=nb;
  if(enc(snapOf(S))===enc(nb))return;   // only our own writes echoing back
  S=R;try{localStorage.setItem(STORE,enc(S))}catch(e){}
  if(busy()){pendingApply=true;return}   // don't redraw under someone who is typing
  setLang(S.lang);render();
}
function flushApply(){if(pendingApply&&!busy()){pendingApply=false;setLang(S.lang);render()}}
$("#sheet").addEventListener("close",()=>setTimeout(flushApply));
$("#dlg").addEventListener("close",()=>setTimeout(flushApply));
document.addEventListener("focusout",()=>setTimeout(flushApply,50));
function stopSync(){unsub.forEach(f=>f());unsub=[];base=null;user=null;remote=null;setSync("off")}

// ---------- sign-in screen ----------
const GOOGLE_G=`<svg class="ic" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`;
function authView(){
  const up=amode==="up",local=hasLocalData()&&!localStorage.getItem(OWNER);
  return `<div class="auth"><img src="icon-192.png" alt="" width="72" height="72" class="alogo"><h1>TrackMe</h1>
  <p class="lb">${T("Plan your days and track your money, workouts, food and learning, all in one place.")}</p>
  <select data-c="pref" data-k="lang" aria-label="Language" class="alang">${opt("",T("Same as my phone"),!S.lang)}${LANGS.map(([c,l])=>opt(c,l,S.lang===c)).join("")}</select>
  ${!navigator.onLine?tile(T("Connect to the internet to sign in."),"t"):""}
  ${local?tile(`${ic("check","s")} ${T("Your data on this phone will be saved to your account when you sign in.")}`,"t"):""}
  <button class="btn w gbtn" data-a="gsign">${GOOGLE_G} ${T("Continue with Google")}</button>
  <div class="or"><span>${T("or")}</span></div>
  <div data-form><label class="fl"><span>${T("Email")}</span><input name="em" type="email" inputmode="email" autocomplete="email" autocapitalize="off"></label>
  <label class="fl"><span>${T("Password")}</span><input name="pw" type="password" autocomplete="${up?"new-password":"current-password"}" ${up?'minlength="6"':""}></label>
  <button class="btn p w" data-a="esign">${up?T("Create account"):T("Sign in")}</button></div>
  <div class="f" style="margin-top:10px;justify-content:center"><button class="btn ghost x" data-a="amode">${up?T("I already have an account"):T("Create an account")}</button>${up?"":`<button class="btn ghost x" data-a="reset">${T("Forgot password?")}</button>`}</div>
  <p class="lb" style="margin-top:18px">${T("Your data is private to your account and syncs between your devices. You can delete your account and all data anytime in Settings.")}
  <a href="${PRIVACY_URL}${LANG}" target="_blank" rel="noopener" style="color:inherit">${T("Privacy policy")}</a></p></div>`;
}
const AUTH_ERR={"auth/invalid-email":"That email doesn't look right.","auth/invalid-credential":"Wrong email or password.","auth/wrong-password":"Wrong email or password.",
  "auth/user-not-found":"Wrong email or password.","auth/invalid-login-credentials":"Wrong email or password.","auth/email-already-in-use":"An account with this email already exists. Sign in instead.",
  "auth/weak-password":"Use at least 6 characters for the password.","auth/missing-password":"Enter your password.","auth/network-request-failed":"No internet connection. Try again when you're online.",
  "auth/too-many-requests":"Too many attempts. Wait a bit and try again.","auth/popup-closed-by-user":"","auth/cancelled-popup-request":"","auth/user-cancelled":"",
  "auth/unauthorized-domain":"This address isn't allowed to sign in yet. Add it in Firebase under Authentication → Settings → Authorized domains.",
  "auth/operation-not-allowed":"This sign-in method isn't turned on in Firebase yet.","auth/account-exists-with-different-credential":"This email already uses another sign-in method. Try Google or email instead."};
function authErr(e){const m=AUTH_ERR[e&&e.code];if(m==="")return;console.warn(e);toast(m?T(m):T("Couldn't sign in. Try again."))}
function syncErr(e){console.warn(e);if(e&&e.code==="permission-denied")toast(T("Sync is blocked: the Firestore security rules aren't published yet."))}
const gProvider=()=>new firebase.auth.GoogleAuthProvider();

A.amode=()=>{amode=amode==="up"?"in":"up"};
A.gsign=async()=>{
  try{await firebase.auth().signInWithPopup(gProvider())}
  catch(e){if(e.code==="auth/popup-blocked"||e.code==="auth/operation-not-supported-in-this-environment")firebase.auth().signInWithRedirect(gProvider()).catch(authErr);else authErr(e)}
  return false};
A.esign=async(b,f,F)=>{const em=F.v("em"),pw=F.el("pw").value;if(!em){toast(T("Enter your email."));return false}if(!pw){toast(T("Enter your password."));return false}
  b.disabled=true;
  try{amode==="up"?await firebase.auth().createUserWithEmailAndPassword(em,pw):await firebase.auth().signInWithEmailAndPassword(em,pw)}catch(e){authErr(e)}
  b.disabled=false;return false};
A.reset=async()=>{const em=($("[name=em]")||{}).value||"";if(!em.trim()){toast(T("Enter your email first, then tap “Forgot password?”."));return false}
  try{await firebase.auth().sendPasswordResetEmail(em.trim());toast(T("Password reset email sent. Check your inbox."))}catch(e){authErr(e)}return false};

// ---------- account actions ----------
function accountTile(){
  if(!user)return"";
  return tile(`<h2>${T("Account")}</h2><div class="rw" style="border:0"><span class="ci">${ic("user","s")}</span><span class="g">${esc(user.displayName||user.email||"")}<div class="meta">${esc(user.displayName?user.email||"":"")}</div></span></div>
  <p class="lb" id="sync" style="margin-top:0">${syncText()}</p>
  <div class="f"><button class="btn" data-a="signout">${T("Sign out")}</button><button class="btn" data-a="delacct">${ic("trash","s")} ${T("Delete account")}</button></div>`);
}
// Wait (briefly) for queued changes to reach the server before data leaves this device.
const flushed=()=>Promise.race([db.waitForPendingWrites().then(()=>true),new Promise(r=>setTimeout(()=>r(false),6000))]);
async function wipeDevice(){localStorage.removeItem(STORE);localStorage.removeItem(OWNER);localStorage.removeItem(DIRTY);try{await db.terminate();await db.clearPersistence()}catch(e){}location.reload()}
A.signout=async()=>{
  if(!await ask(`<h2>${T("Sign out?")}</h2><p class="lb">${T("Your data stays in your account. It will be removed from this device until you sign in again.")}</p>`,[["y",T("Sign out")],["",T("Cancel")]]))return false;
  if(!await flushed()&&!await ask(`<h2>${T("Some changes haven't synced")}</h2><p class="lb">${T("Connect to the internet so they reach your account, or sign out anyway and lose them.")}</p>`,[["",T("Cancel")],["y",T("Sign out anyway")]]))return false;
  stopSync();await firebase.auth().signOut();await wipeDevice();return false};
A.delacct=async()=>{
  if(!await ask(`<h2>${T("Delete your account?")}</h2><p>${T("This permanently deletes your account and all your TrackMe data on every device. It can't be undone.")}</p><p class="lb">${T("Tip: export a backup first in Settings → Backup.")}</p>`,[["",T("Cancel")],["y",T("Delete forever")]]))return false;
  try{
    if(user.providerData.some(p=>p.providerId==="google.com"))await user.reauthenticateWithPopup(gProvider());
    else{const pw=await askPassword();if(pw==null)return false;await user.reauthenticateWithCredential(firebase.auth.EmailAuthProvider.credential(user.email,pw))}
    const r=uref(),ls=await r.collection("lists").get(),b=db.batch();ls.forEach(d=>b.delete(d.ref));b.delete(r);
    stopSyncKeepUser();await b.commit();await firebase.auth().currentUser.delete();
    toast(T("Account deleted"));await wipeDevice();
  }catch(e){if(e.code==="auth/requires-recent-login")toast(T("For safety, sign out, sign in again, then delete your account."));else authErr(e)}
  return false};
function stopSyncKeepUser(){unsub.forEach(f=>f());unsub=[];base=null}
function askPassword(){return new Promise(res=>{const d=$("#dlg");
  d.innerHTML=`<h2>${T("Confirm it's you")}</h2><label class="fl"><span>${T("Password")}</span><input type="password" id="rpw" autocomplete="current-password"></label><div class="f"><button class="btn" value="">${T("Cancel")}</button><button class="btn p" value="y">${T("Continue")}</button></div>`;
  d.querySelectorAll("button").forEach(b=>b.onclick=()=>{const v=$("#rpw").value;d.close();res(b.value?v:null)});d.oncancel=()=>res(null);d.showModal();setTimeout(()=>$("#rpw").focus(),50)})}
