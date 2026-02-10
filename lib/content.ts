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

export function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export async function fetchContent(): Promise<ContentBundle> {
  const url = process.env.NEXT_PUBLIC_CONTENT_URL!;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch content: ${res.status}`);
  return res.json();
}
