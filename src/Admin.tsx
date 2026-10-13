import { useEffect, useState, FormEvent } from "react";
import { sb, Project, Settings, DEFAULTS, getSettings, uploadImage, waDigits } from "./lib";
import { PLATFORMS } from "./socials";

const BLANK: Project = { slug: "", title: "", description: "", category: "", cover_url: "", details: "", external_url: "", featured: false, sort_order: 0, status: "draft" };
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export default function Admin() {
  const [st, setSt] = useState<"load" | "out" | "denied" | "in">("load");
  const check = async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return setSt("out");
    const { data } = await sb.rpc("is_admin");
    setSt(data === true ? "in" : "denied");
  };
  useEffect(() => {
    check();
    const { data } = sb.auth.onAuthStateChange(() => { setTimeout(check, 0); });
    return () => data.subscription.unsubscribe();
  }, []);
  if (st === "load") return <div className="adm"><p role="status">جارٍ التحقق…</p></div>;
  if (st === "out") return <Login />;
  if (st === "denied") return <div className="adm box"><h1>لا تملك صلاحية الإدارة</h1><p>هذا الحساب غير مضاف إلى جدول المدراء.</p><button className="btn s" onClick={() => sb.auth.signOut()}>تسجيل الخروج</button></div>;
  return <Dash />;
}

function Login() {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); setErr(""); setBusy(true);
    const f = new FormData(e.currentTarget);
    const { error } = await sb.auth.signInWithPassword({ email: String(f.get("email")), password: String(f.get("password")) });
    setBusy(false); if (error) setErr("تعذّر تسجيل الدخول. تحقق من البريد وكلمة المرور.");
  };
  return (
    <div className="adm box"><h1>دخول الإدارة</h1>
      <form onSubmit={go}>
        <label>البريد الإلكتروني<input name="email" type="email" dir="ltr" required autoComplete="username" /></label>
        <label>كلمة المرور<input name="password" type="password" dir="ltr" required autoComplete="current-password" /></label>
        {err && <p role="alert" className="err">⚠ {err}</p>}
        <button className="btn p" disabled={busy}>{busy ? "جارٍ الدخول…" : "دخول"}</button>
      </form><a href="#/">← العودة إلى الموقع</a></div>
  );
}

function Dash() {
  const [tab, setTab] = useState<"home" | "projects" | "settings">("home");
  const [list, setList] = useState<Project[]>([]);
  const [edit, setEdit] = useState<Project | null>(null);
  const [msg, setMsg] = useState("");
  const load = async () => {
    const { data, error } = await sb.from("projects").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) setMsg("⚠ فشل تحميل المشاريع: " + error.message); else setList(data as Project[]);
  };
  useEffect(() => { load(); }, []);
  const pubN = list.filter(p => p.status === "published").length;
  const del = async (p: Project) => {
    if (!confirm(`حذف المشروع «${p.title}» نهائيًا؟`)) return;
    const { error } = await sb.from("projects").delete().eq("id", p.id!);
    setMsg(error ? "⚠ فشل الحذف: " + error.message : "تم الحذف."); load();
  };
  return (
    <div className="adm lay">
      <aside><strong>لوحة التحكم</strong>
        {(["home", "projects", "settings"] as const).map(t => <button key={t} aria-current={tab === t} onClick={() => { setTab(t); setEdit(null); setMsg(""); }}>
          {{ home: "الملخص", projects: "المشاريع", settings: "إعدادات الموقع" }[t]}</button>)}
        <a href="#/" target="_blank" rel="noopener noreferrer">عرض الموقع (رابط خارجي)</a>
        <button onClick={() => sb.auth.signOut()}>تسجيل الخروج</button></aside>
      <section>
        {msg && <p role="status" className="note">{msg}</p>}
        {tab === "home" && <><h1>الملخص</h1><p>منشور: <b>{pubN}</b> — مسودات: <b>{list.length - pubN}</b></p></>}
        {tab === "projects" && !edit && <>
          <h1>المشاريع</h1><button className="btn p" onClick={() => setEdit({ ...BLANK })}>+ مشروع جديد</button>
          {list.length === 0 ? <p>لا توجد مشاريع بعد.</p> :
            <table><thead><tr><th>العنوان</th><th>الحالة</th><th>الترتيب</th><th></th></tr></thead><tbody>
              {list.map(p => <tr key={p.id}><td>{p.title}{p.featured && " ★"}</td><td>{p.status === "published" ? "منشور" : "مسودة"}</td><td>{p.sort_order}</td>
                <td><button className="btn s" onClick={() => setEdit(p)}>تعديل</button> <button className="btn s" onClick={() => del(p)}>حذف</button></td></tr>)}
            </tbody></table>}</>}
        {tab === "projects" && edit && <Form p={edit} onDone={(m) => { setEdit(null); setMsg(m); load(); }} onCancel={() => setEdit(null)} />}
        {tab === "settings" && <SettingsForm setMsg={setMsg} />}
      </section>
    </div>
  );
}

function Form({ p, onDone, onCancel }: { p: Project; onDone: (m: string) => void; onCancel: () => void }) {
  const [v, setV] = useState<Project>(p); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const set = (k: keyof Project, x: unknown) => setV({ ...v, [k]: x });
  const up = async (file?: File) => {
    if (!file) return; setErr("");
    try { set("cover_url", await uploadImage(file)); } catch (e: any) { setErr(e.message); }
  };
  const submit = async (e: FormEvent, status: "draft" | "published") => {
    e.preventDefault(); setErr("");
    if (!v.title.trim()) return setErr("العنوان مطلوب.");
    if (status === "published" && !v.cover_url) return setErr("أضف صورة رئيسية قبل النشر.");
    setBusy(true);
    const row = { ...v, status, slug: v.slug.trim() || "p-" + Date.now(), updated_at: new Date().toISOString() };
    const { error } = v.id ? await sb.from("projects").update(row).eq("id", v.id) : await sb.from("projects").insert(row);
    setBusy(false);
    if (error) return setErr("فشل الحفظ (بياناتك ما زالت هنا): " + error.message);
    onDone(status === "published" ? "تم النشر." : "تم حفظ المسودة.");
  };
  return (
    <form onSubmit={e => submit(e, "draft")}><h1>{v.id ? "تعديل مشروع" : "مشروع جديد"}</h1>
      <label>العنوان<input value={v.title} onChange={e => set("title", e.target.value)} required /></label>
      <label>المعرّف في الرابط (إنجليزي، اختياري)<input dir="ltr" value={v.slug} onChange={e => set("slug", e.target.value.replace(/[^a-z0-9-]/gi, "-").toLowerCase())} /></label>
      <label>التصنيف<input value={v.category || ""} onChange={e => set("category", e.target.value)} /></label>
      <label>وصف موجز<textarea value={v.description || ""} onChange={e => set("description", e.target.value)} /></label>
      <label>تفاصيل المشروع<textarea value={v.details || ""} onChange={e => set("details", e.target.value)} /></label>
      <label>رابط خارجي (اختياري)<input dir="ltr" type="url" value={v.external_url || ""} onChange={e => set("external_url", e.target.value)} /></label>
      <label>الصورة الرئيسية<input type="file" accept={TYPES.join(",")} onChange={e => up(e.target.files?.[0])} /></label>
      {v.cover_url && <img className="prev" src={v.cover_url} alt="معاينة الصورة الرئيسية" />}
      <label>الترتيب (الأصغر أولًا)<input type="number" value={v.sort_order} onChange={e => set("sort_order", Number(e.target.value))} /></label>
      <label className="chk"><input type="checkbox" checked={v.featured} onChange={e => set("featured", e.target.checked)} /> مشروع مميز (يظهر في الصفحة الرئيسية، حتى مشروعين)</label>
      {err && <p role="alert" className="err">⚠ {err}</p>}
      <div className="row"><button className="btn s" disabled={busy}>حفظ كمسودة</button>
        <button type="button" className="btn p" disabled={busy} onClick={e => submit(e, "published")}>نشر</button>
        <button type="button" className="btn s" onClick={onCancel}>إلغاء</button></div></form>
  );
}

function SettingsForm({ setMsg }: { setMsg: (m: string) => void }) {
  const [s, setS] = useState<Settings>(DEFAULTS); const [ok, setOk] = useState(false);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { getSettings().then(x => { setS(x); setOk(true); }); }, []);
  const soc = (k: string, v: string) => setS({ ...s, socials: { ...s.socials, [k]: v } });
  const photo = async (file?: File) => {
    if (!file) return; setErr("");
    try { const url = await uploadImage(file); setS({ ...s, photoUrl: url }); setMsg("تم رفع الصورة. اضغط «حفظ» لاعتمادها في الموقع."); }
    catch (e: any) { setErr(e.message); }
  };
  const save = async (e: FormEvent) => {
    e.preventDefault(); setErr("");
    const email = s.email.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setErr("صيغة البريد الإلكتروني غير صحيحة.");
    const wa = waDigits(s.whatsapp);
    if (wa && (wa.length < 8 || wa.length > 15)) return setErr("رقم الواتساب غير صحيح. اكتبه مع رمز الدولة، مثل 00967XXXXXXXXX.");
    const socials: Record<string, string> = {};
    for (const [k, v] of Object.entries(s.socials)) {
      const u = (v || "").trim(); if (!u) continue;
      if (!/^https?:\/\//i.test(u)) return setErr(`رابط ${PLATFORMS.find(p => p.key === k)?.label} يجب أن يبدأ بـ https://`);
      socials[k] = u;
    }
    setBusy(true);
    const { error } = await sb.from("site_settings").upsert({ key: "site", value: { ...s, email, whatsapp: wa, socials }, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) return setErr("فشل الحفظ: " + error.message);
    setMsg("تم حفظ الإعدادات.");
  };
  if (!ok) return <p role="status">جارٍ التحميل…</p>;
  return (
    <form onSubmit={save}><h1>إعدادات الموقع</h1>
      <h2>الصورة الشخصية</h2>
      {s.photoUrl ? <img className="ph-prev" src={s.photoUrl} alt="معاينة الصورة الشخصية" /> : <p>لا توجد صورة بعد.</p>}
      <label>رفع صورة جديدة أو استبدال الحالية<input type="file" accept={TYPES.join(",")} onChange={e => photo(e.target.files?.[0])} /></label>
      {s.photoUrl && <button type="button" className="btn s" onClick={() => setS({ ...s, photoUrl: "" })}>إزالة الصورة</button>}
      <h2>النصوص</h2>
      <label>العبارة الافتتاحية<input value={s.heroLead} onChange={e => setS({ ...s, heroLead: e.target.value })} /></label>
      <label>النبذة الشخصية<textarea value={s.aboutText} onChange={e => setS({ ...s, aboutText: e.target.value })} /></label>
      <h2>التواصل</h2>
      <label>رقم الواتساب (لزر «تواصل معي»، مع رمز الدولة)<input dir="ltr" inputMode="tel" placeholder="00967XXXXXXXXX" value={s.whatsapp} onChange={e => setS({ ...s, whatsapp: e.target.value })} /></label>
      <label>البريد الإلكتروني (يظهر أسفل الموقع)<input dir="ltr" type="email" value={s.email} onChange={e => setS({ ...s, email: e.target.value })} /></label>
      <p>الصق رابط حسابك فقط. الحقول الفارغة لا تظهر في الموقع.</p>
      <div className="grid2">{PLATFORMS.map(({ key, label, Icon }) =>
        <label key={key}><span><Icon aria-hidden="true" /> {label}</span><input dir="ltr" type="url" placeholder="https://" value={s.socials[key] || ""} onChange={e => soc(key, e.target.value)} /></label>)}</div>
      {err && <p role="alert" className="err">⚠ {err}</p>}
      <button className="btn p" disabled={busy}>{busy ? "جارٍ الحفظ…" : "حفظ"}</button></form>
  );
}
