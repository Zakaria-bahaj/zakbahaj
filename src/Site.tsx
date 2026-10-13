import { useEffect, useRef, useState } from "react";
import { sb, Project, Settings, DEFAULTS, getSettings, waDigits } from "./lib";
import { PLATFORMS } from "./socials";

const save = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* ignore */ } };

function useProjects() {
  const [list, setList] = useState<Project[]>([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState("");
  useEffect(() => {
    (async () => {
      const { data, error } = await sb.from("projects").select("*").eq("status", "published")
        .order("sort_order").order("created_at", { ascending: false });
      if (error) setErr("تعذّر تحميل الأعمال حاليًا. حاول تحديث الصفحة."); else setList((data as Project[]) || []);
      setLoading(false);
    })();
  }, []);
  return { list, loading, err };
}

function Item({ p }: { p: Project }) {
  const inner = <>
    {p.cover_url && <figure><img src={p.cover_url} alt={p.title} loading="lazy" /></figure>}
    <small>{p.category}</small><h3>{p.title}</h3>{p.description && <p>{p.description}</p>}</>;
  return p.external_url
    ? <a className="item" data-tilt href={p.external_url} target="_blank" rel="noopener noreferrer">{inner}<span className="sr">(رابط خارجي)</span></a>
    : <div className="item" data-tilt>{inner}</div>;
}

function Grid({ list, loading, err }: { list: Project[]; loading: boolean; err: string }) {
  if (loading) return <p role="status">جارٍ التحميل…</p>;
  if (err) return <p role="alert">{err}</p>;
  if (!list.length) return (
    <div className="card" data-tilt><strong>الأعمال قيد التجهيز.</strong>
      <span>سيُعرض هنا مختارات من مشاريعي قريبًا. إن كان لديك فكرة أو مشروع، يسعدني أن نتحدث.</span>
      <a className="btn p" data-mag href="#contact" onClick={goContact}>ابدأ محادثة</a></div>);
  return <div className="grid">{list.map(p => <Item key={p.id} p={p} />)}</div>;
}

function goContact(e: React.MouseEvent) { e.preventDefault(); document.getElementById("contact")?.scrollIntoView(); }

function Home({ s }: { s: Settings }) {
  const { list, loading, err } = useProjects();
  const feat = list.filter(p => p.featured);
  const top = (feat.length ? feat : list).slice(0, 2);
  const hero = useRef<HTMLElement>(null);
  const spot = (e: React.PointerEvent) => {
    const el = hero.current; if (!el) return; const r = el.getBoundingClientRect();
    el.style.setProperty("--x", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--y", ((e.clientY - r.top) / r.height) * 100 + "%");
  };
  return <>
    <section className="hero" ref={hero} onPointerMove={spot}>
      <div className="spot" aria-hidden="true" /><div className="ring" aria-hidden="true" /><div className="ring r2" aria-hidden="true" />
      <span className="tag">مصمم جرافيك</span>
      <h1>زكريا <span>باحاج</span></h1>
      <div className="latin" lang="en" dir="ltr">ZAKARIA BAHAJ</div>
      <p className="lead">{s.heroLead}</p>
      <div className="cta"><a className="btn p" data-mag href="#/work">شاهد الأعمال</a>{waDigits(s.whatsapp)
        ? <a className="btn s" data-mag href={`https://wa.me/${waDigits(s.whatsapp)}`} target="_blank" rel="noopener noreferrer">تواصل معي<span className="sr"> (واتساب، رابط خارجي)</span></a>
        : <a className="btn s" data-mag href="#contact" onClick={goContact}>تواصل معي</a>}</div>
    </section>
    <div className="marq" aria-hidden="true"><div>{Array(8).fill(0).map((_, i) => <span key={i}>ZAKARIA BAHAJ<b>✦</b>GRAPHIC DESIGNER<b>✦</b></span>)}</div></div>

    <section id="about" className="alt" aria-labelledby="about-h">
      <span className="tag rv">01 — نبذة</span>
      <h2 id="about-h" className="rv">عنّي</h2>
      <div className="about rv"><p>{s.aboutText}</p>
        {s.photoUrl
          ? <div className="portrait has"><img src={s.photoUrl} alt="صورة زكريا باحاج" /></div>
          : <div className="portrait" role="img" aria-label="مساحة محجوزة لصورة شخصية">مكان الصورة الشخصية</div>}</div>
    </section>

    <section aria-labelledby="top-h">
      <span className="tag rv">02 — أهم الأعمال</span>
      <h2 id="top-h" className="rv">من أعمالي</h2>
      <Grid list={top} loading={loading} err={err} />
      {list.length > 0 && <a className="btn s more" data-mag href="#/work">كل الأعمال ←</a>}
    </section>
  </>;
}

function Works() {
  const { list, loading, err } = useProjects();
  return (
    <section aria-labelledby="w-h">
      <span className="tag">أعمالي</span>
      <h1 id="w-h" className="ph">كل الأعمال</h1>
      <Grid list={list} loading={loading} err={err} />
    </section>
  );
}

function Contact({ s }: { s: Settings }) {
  const icons = PLATFORMS.filter(p => s.socials[p.key]);
  return (
    <section id="contact" className="alt" aria-labelledby="c-h">
      <span className="tag rv">تواصل</span>
      <h2 id="c-h" className="rv">لنبدأ مشروعًا،<br />أو نناقش فرصة.</h2>
      {s.email && <a className="btn p" data-mag href={`mailto:${s.email}`} dir="ltr">{s.email}</a>}
      {icons.length > 0 && <ul className="icons">{icons.map(({ key, label, Icon }) =>
        <li key={key}><a className="ico" href={s.socials[key]} target="_blank" rel="noopener noreferrer" aria-label={`${label} (رابط خارجي)`} title={label}><Icon aria-hidden="true" /></a></li>)}</ul>}
      {!s.email && icons.length === 0 && <p>وسائل التواصل ستُضاف قريبًا.</p>}
    </section>
  );
}

export default function Site({ path }: { path: string }) {
  const [s, setS] = useState<Settings>(DEFAULTS);
  useEffect(() => { getSettings().then(setS).catch(() => { /* keep defaults */ }); }, []);
  useEffect(() => {
    if (path === "/about") requestAnimationFrame(() => document.getElementById("about")?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [path]);
  const toggle = () => {
    const r = document.documentElement, t = r.dataset.theme === "dark" ? "light" : "dark";
    r.dataset.theme = t; save("zb-theme", t);
  };
  const cur = (p: string) => (path === p || (p === "/" && path === "/about") ? "page" : undefined);
  return <>
    <button className="skip" onClick={() => { const m = document.getElementById("main"); m?.focus(); m?.scrollIntoView(); }}>تخطَّ إلى المحتوى</button>
    <div id="bar" aria-hidden="true" />
    <header className="nav">
      <a className="logo" href="#/">زكريا<i>.</i>باحاج</a>
      <nav aria-label="التنقل الرئيسي"><ul>
        <li><a href="#/" aria-current={path === "/" ? "page" : undefined}>الرئيسية</a></li>
        <li><a href="#/work" aria-current={cur("/work")}>أعمالي</a></li>
        <li><a href="#/about">عنّي</a></li>
        <li><a href="#contact" onClick={goContact}>التواصل</a></li>
      </ul></nav>
      <button id="theme" aria-label="تبديل الوضع الفاتح والمظلم" onClick={toggle}>◐</button>
    </header>
    <main id="main" tabIndex={-1}>{path === "/work" ? <Works /> : <Home s={s} />}</main>
    <Contact s={s} />
    <footer><span>© {new Date().getFullYear()} زكريا باحاج</span></footer>
  </>;
}
