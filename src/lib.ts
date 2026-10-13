import { createClient } from "@supabase/supabase-js";
export const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
export type Project = {
  id?: string; slug: string; title: string; description: string | null; category: string | null;
  cover_url: string | null; details: string | null; external_url: string | null;
  featured: boolean; sort_order: number; status: "draft" | "published";
};
export type Settings = { aboutText: string; heroLead: string; email: string; whatsapp: string; photoUrl: string; socials: Record<string, string> };
export const DEFAULTS: Settings = {
  aboutText: "أنا زكريا باحاج، مهتم بالتصميم الجرافيكي وبناء تجارب بصرية تعبّر عن الأفكار بوضوح وشخصية. أعمل على تطوير أسلوبي الإبداعي، وأسعى إلى تقديم تصاميم تجمع بين الفكرة الجيدة والتنفيذ المتقن.",
  heroLead: "أحوّل الأفكار إلى تجارب بصرية لها شخصية.",
  email: "", whatsapp: "967772419694", photoUrl: "", socials: {},
};
export async function getSettings(): Promise<Settings> {
  const { data } = await sb.from("site_settings").select("value").eq("key", "site").maybeSingle();
  const v = { ...DEFAULTS, ...((data?.value as object) || {}) } as Settings;
  if (!v.socials || Array.isArray(v.socials)) v.socials = {};
  return v;
}

export const IMG_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export async function uploadImage(file: File): Promise<string> {
  if (!IMG_TYPES.includes(file.type)) throw new Error("نوع الملف غير مدعوم (JPG/PNG/WebP/AVIF).");
  if (file.size > 5 * 1024 * 1024) throw new Error("حجم الصورة يتجاوز 5MB.");
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.type.split("/")[1]}`;
  const { error } = await sb.storage.from("portfolio").upload(name, file, { contentType: file.type });
  if (error) throw new Error("فشل رفع الصورة: " + error.message);
  return sb.storage.from("portfolio").getPublicUrl(name).data.publicUrl;
}

export const waDigits = (n: string) => n.replace(/\D/g, "").replace(/^00/, "");
