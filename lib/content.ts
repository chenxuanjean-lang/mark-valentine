export type Row = Record<string, any>;

export type ContentBundle = {
  Config?: Array<{ key: string; value: any }>;
  AnimalTalk?: Row[];
  DailyMenu?: Row[];
  DailyInteraction?: Row[];
  BlindBox?: Row[];
  updated_at?: string;
};

export function configToMap(rows: Array<{ key: string; value: any }> = []) {
  const m: Record<string, string> = {};
  for (const r of rows) m[String(r.key)] = String(r.value ?? "");
  return m;
}

export function todayISO(tz: string = "America/Los_Angeles") {
  // en-CA 的日期格式天然是 YYYY-MM-DD
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return s; // e.g. "2026-02-09"
}


export async function fetchContent(): Promise<ContentBundle> {
  const url = process.env.NEXT_PUBLIC_CONTENT_URL!;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`);
  return res.json();
}
