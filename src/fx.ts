export function initFx() {
  const root = document.documentElement;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  addEventListener("scroll", () => {
    const bar = document.getElementById("bar"); if (!bar) return;
    const h = root.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  }, { passive: true });
  if (reduce) return;
  root.classList.add("fx");
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  const scan = () => document.querySelectorAll(".rv:not(.seen)").forEach(el => { el.classList.add("seen"); io.observe(el); });
  new MutationObserver(scan).observe(document.getElementById("root")!, { childList: true, subtree: true });
  scan();
  if (!matchMedia("(hover:hover)").matches) return;
  document.addEventListener("pointermove", e => {
    const t = e.target as HTMLElement;
    const m = t.closest<HTMLElement>("[data-mag]");
    if (m) { const r = m.getBoundingClientRect(); m.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px,${(e.clientY - r.top - r.height / 2) * 0.3}px)`; }
    const c = t.closest<HTMLElement>("[data-tilt]");
    if (c) { const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; c.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`; }
  });
  document.addEventListener("pointerout", e => {
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-mag],[data-tilt]");
    if (el && !el.contains(e.relatedTarget as Node)) el.style.transform = "";
  });
}
