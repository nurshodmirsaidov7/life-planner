// TrackMe daily reminders. Runs hourly on GitHub Actions (.github/workflows/reminders.yml).
// For every user with the reminder on whose local hour matches, look at today's entries and send one
// push listing only what's still undone. If everything is done, nothing is sent.
//
// Env: FIREBASE_SERVICE_ACCOUNT (JSON, from the repo secret), TEST=true (send now to everyone with the
// reminder on, ignoring hour and progress), DRY_RUN=true (print instead of sending),
// FIRESTORE_EMULATOR_HOST (local testing against the emulator, project demo-trackme).
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore, FieldPath, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const TEST = process.env.TEST === "true", DRY = process.env.DRY_RUN === "true";
const APP_URL = "https://nurshodmirsaidov7.github.io/life-planner/";
if (process.env.FIRESTORE_EMULATOR_HOST) initializeApp({ projectId: "demo-trackme" });
else initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}")) });
const db = getFirestore();

const TEXT = {
  en: { title: "Evening check-in", lead: "Still to do today: ", tasks: n => n === 1 ? "1 task" : `${n} tasks`, food: "log your food",
        work: s => s ? `your ${s} workout` : "your workout", study: "some study time", test: "Test reminder: this is how TrackMe will nudge you." },
  uz: { title: "Kechki eslatma", lead: "Bugun hali qolgan: ", tasks: n => `${n} ta vazifa`, food: "ovqatni yozish",
        work: s => s ? `${s} mashgʻuloti` : "mashgʻulot", study: "biroz oʻqish", test: "Sinov eslatmasi: TrackMe sizga shunday eslatadi." },
  ru: { title: "Вечернее напоминание", lead: "Сегодня ещё осталось: ", tasks: n => `задачи: ${n}`, food: "записать еду",
        work: s => s ? `тренировка «${s}»` : "тренировка", study: "немного поучиться", test: "Тестовое напоминание: так TrackMe будет вам напоминать." },
};
const WD = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

// Today's date, hour and weekday (0 = Monday) in the user's timezone.
export function localNow(tz, at = new Date()) {
  let parts;
  try { parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23", weekday: "short" }).formatToParts(at); }
  catch { return localNow("Asia/Tashkent", at); }
  const p = Object.fromEntries(parts.map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour, wd: WD[p.weekday] };
}

// What's still undone today, as message fragments in the user's language.
export function missing(u, L, now, t) {
  const r = u.rem || {}, what = r.what || [], out = [], k = now.date;
  if (what.includes("tasks")) {
    const today = L.tasks.filter(x => x.d === k);
    // repeating tasks that haven't been opened in the app today don't exist as tasks yet
    const recLeft = L.rec.filter(x => (x.days || []).includes(now.wd) && k >= (x.start || "") && !(x.skip || []).includes(k) && !today.some(y => y.rid === x.id)).length;
    const left = today.filter(x => !x.x).length + recLeft;
    if (left) out.push(t.tasks(left));
  }
  if (what.includes("food") && !L.meals.some(x => x.d === k)) out.push(t.food);
  const split = (u.split || [])[now.wd] || "";
  if (what.includes("work") && split && ![...L.wo, ...L.sets, ...L.runs].some(x => x.d === k)) out.push(t.work(split));
  if (what.includes("study") && (u.studyGoal ?? 60) > 0 && !L.study.some(x => x.d === k)) out.push(t.study);
  return out;
}

async function lists(ref) {
  const L = {};
  for (const n of ["tasks", "rec", "meals", "wo", "sets", "runs", "study"]) {
    const d = await ref.collection("lists").doc(n).get();
    L[n] = Object.values((d.data() || {}).items || {});
  }
  return L;
}

async function main() {
  const users = await db.collection("users").where("rem.on", "==", true).get();
  let sent = 0, skipped = 0;
  for (const doc of users.docs) {
    const u = doc.data(), r = u.rem || {}, now = localNow(r.tz || "Asia/Tashkent");
    const stamp = `${now.date}T${now.hour}`;
    if (!TEST && (now.hour !== +r.h || u.remLast === stamp)) { skipped++; continue; }   // not their hour, or already done this hour
    const devices = Object.entries(u.devices || {}).filter(([, v]) => v && v.t);
    if (!devices.length) { skipped++; continue; }
    const t = TEXT[r.lang] || TEXT[u.lang] || TEXT.en;
    const parts = TEST ? [] : missing(u, await lists(doc.ref), now, t);
    if (!TEST && !parts.length) { await doc.ref.update({ remLast: stamp }); skipped++; continue; }
    const body = TEST ? t.test : t.lead + parts.join(", ") + ".";
    for (const [id, dev] of devices) {
      if (DRY) { console.log(`[dry run] ${doc.id} → ${id}: ${t.title} | ${body}`); sent++; continue; }
      try {
        await getMessaging().send({ token: dev.t, data: { title: t.title, body, url: APP_URL }, webpush: { headers: { Urgency: "high", TTL: "7200" } } });
        sent++;
      } catch (e) {
        const gone = ["messaging/registration-token-not-registered", "messaging/invalid-registration-token", "messaging/invalid-argument"].includes(e.code);
        console.log(`send failed for ${doc.id}/${id}: ${e.code}${gone ? " (removing device)" : ""}`);
        if (gone) await doc.ref.update(new FieldPath("devices", id), FieldValue.delete());
      }
    }
    if (!TEST) await doc.ref.update({ remLast: stamp });
  }
  console.log(`reminders: ${users.size} with reminder on, ${sent} sent, ${skipped} skipped`);
}

await main();
