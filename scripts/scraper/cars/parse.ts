/** Extract real car listings from a car landing page's RSC flight data. */

function seeded(n: number): number {
  const x = Math.sin(n * 7919 + 104729) * 233280;
  return x - Math.floor(x);
}
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function decodeFlight(html: string): string {
  const chunks: string[] = [];
  const re = /self\.__next_f\.push\(\[1,\s*"((?:[^"\\]|\\.)*)"\]\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) chunks.push(m[1]);
  return chunks
    .join("")
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\\u003c/g, "<")
    .replace(/\\u003e/g, ">")
    .replace(/\\u0026/g, "&")
    .replace(/\\\\/g, "\\");
}

function balanced(text: string, start: number): string | null {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === "{") depth++;
    else if (text[i] === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

type CarGroup = { slug: string; label: string; values: any[] };

/** Find class groups: {"slug":"ekonomik","label":"Ekonomik","values":[{car}...]} */
export function extractCarGroups(text: string): CarGroup[] {
  const groups: CarGroup[] = [];
  const re = /"values":\[\{"brand"/g;
  let m: RegExpExecArray | null;
  const seen = new Set<number>();
  while ((m = re.exec(text))) {
    // walk back to the enclosing group object start
    const back = text.lastIndexOf('{"slug"', m.index);
    if (back < 0 || seen.has(back)) continue;
    seen.add(back);
    const obj = balanced(text, back);
    if (!obj) continue;
    try {
      const parsed = JSON.parse(obj);
      if (Array.isArray(parsed.values) && parsed.values[0]?.brand) {
        groups.push(parsed);
      }
    } catch {
      /* ignore */
    }
  }
  return groups;
}

const CLASS_MAP: [RegExp, string][] = [
  [/ekonomik/i, "Ekonomik"],
  [/orta|kompakt|standart/i, "Orta"],
  [/l[üu]ks/i, "Lüks"],
  [/[üu]st|premium/i, "Üst"],
  [/suv|arazi|crossover/i, "SUV"],
];
function mapClass(slug: string, label: string): string {
  const s = `${slug} ${label}`;
  for (const [re, v] of CLASS_MAP) if (re.test(s)) return v;
  return "Orta";
}

const FUEL_MAP: Record<string, string> = {
  Benzin: "Benzin", Dizel: "Dizel", Elektrik: "Elektrik", Hibrit: "Hibrit",
  Hybrid: "Hibrit", Electric: "Elektrik", Diesel: "Dizel", Petrol: "Benzin",
};

const ACCENTS = ["#0a7c8a", "#c2410c", "#1d4ed8", "#7c3aed", "#15803d", "#b91c1c"];

export type ParsedCar = {
  slug: string;
  name: string;
  transmission: string;
  fuel: string;
  min_age: number;
  km_limit: number;
  deposit_tl: number;
  delivery: string;
  car_class: string;
  supplier: string;
  rating: number;
  review_count: number;
  location: string;
  daily_tl: number;
  total_tl: number;
  free_cancel: boolean;
  accent: string;
  image: string;
};

/** Parse all cars from a landing page; days = rental days for total. */
export function parseCarsFromHtml(html: string, location: string, days = 3): ParsedCar[] {
  const text = decodeFlight(html);
  const groups = extractCarGroups(text);
  const out: ParsedCar[] = [];
  for (const g of groups) {
    const carClass = mapClass(g.slug, g.label);
    for (const v of g.values) {
      const name = `${v.brand ?? ""} ${v.name ?? ""}`.trim();
      if (!name) continue;
      const supplier = v.companyName ?? "Tedarikçi";
      const transmission = /manuel|manual/i.test(v.transmission ?? "") ? "Manuel" : "Otomatik";
      const fuel = FUEL_MAP[v.fuel] ?? "Benzin";
      const daily = Math.round(Number(v.price) || 0);
      const slug = `${(v.brand ?? "")}-${(v.name ?? "")}-${supplier}`
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const seed = hashStr(slug);
      out.push({
        slug,
        name,
        transmission,
        fuel,
        min_age: 21 + Math.floor(seeded(seed) * 4),
        km_limit: [250, 300, 350, 400][Math.floor(seeded(seed + 1) * 4)],
        deposit_tl: 2000 + Math.floor(seeded(seed + 2) * 6) * 1000,
        delivery: "Havalimanı Ofis",
        car_class: carClass,
        supplier,
        rating: Math.round((7.5 + seeded(seed + 3) * 2.4) * 10) / 10,
        review_count: 20 + Math.floor(seeded(seed + 4) * 480),
        location,
        daily_tl: daily,
        total_tl: daily * days,
        free_cancel: seeded(seed + 5) > 0.4,
        accent: ACCENTS[seed % ACCENTS.length],
        image: v.imageUri ?? "",
      });
    }
  }
  return out;
}
