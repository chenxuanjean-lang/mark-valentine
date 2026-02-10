import DailyChooser from "../components/DailyChooser";
import PetFloof from "../components/PetFloof";
import BlindBox from "../components/BlindBox";
import { configToMap, fetchContent, todayISO } from "../lib/content";
import { Solar } from "lunar-javascript";

function safeJson(v: any) {
  if (v == null || v === "") return {};
  if (typeof v === "object") return v;
  const s = String(v).trim();
  try {
    return JSON.parse(s);
  } catch {
    return s;
  }
}

function toBoxType(v: any): "text" | "link" | "image" | "video" {
  const t = String(v || "").toLowerCase().trim();
  if (t === "text" || t === "link" || t === "image" || t === "video") return t;
  return "text"; // 不认识的都当成文字盲盒
}


function formatCNDate(iso: string) {
  const [yy, mm, dd] = iso.split("-").map(Number);
  const solar = Solar.fromYmd(yy, mm, dd);
  const lunar = solar.getLunar();

  const weekMap = ["日", "一", "二", "三", "四", "五", "六"];
  const weekday = weekMap[solar.getWeek()]; // 0-6

  // 农历中文：正/二/三...月，初一/初二.../十五...
  const lunarMonth = lunar.getMonthInChinese(); // e.g. "正"
  const lunarDay = lunar.getDayInChinese();     // e.g. "初一" / "十五"
  const jieqi = lunar.getJieQi();               // 24节气当天才有值，否则为 ""

  // 初一/十五标记（真实农历日）
  const lunarDayNum = lunar.getDay(); // 1-30
  const special =
    lunarDayNum === 1 ? "（初一）" : lunarDayNum === 15 ? "（十五）" : "";

  // 组合展示
  const base = `今天是${yy}年${mm}月${dd}日，星期${weekday}`;
  const lunarStr = `农历${lunarMonth}月${lunarDay}${special}`;
  const jieqiStr = jieqi ? `，节气${jieqi}` : "";

  return `${base}，${lunarStr}${jieqiStr}`;
}



export default async function Home() {
  const bundle = await fetchContent();
  const cfg = configToMap(bundle.Config || []);

  const today = todayISO();
  const animal = bundle.AnimalTalk || [];

  const normalizeISO = (v: any) => {
    if (!v) return "";
    // already looks like YYYY-MM-DD
    const s = String(v).trim();
    const m = s.match(/\d{4}-\d{2}-\d{2}/);
    if (m) return m[0];

    // try Date parsing (e.g., "Sun Feb 08 2026 ...")
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const mo = String(d.getMonth() + 1).padStart(2, "0");
      const da = String(d.getDate()).padStart(2, "0");
      return `${y}-${mo}-${da}`;
    }
    return "";
  };

  const todays = animal
    .filter((r: any) => String(r.type).toLowerCase() === "daily")
    .filter((r: any) => normalizeISO(r.start_date) === today)
    .map((r: any) => String(r.text));


  const fallback = animal
    .filter((r: any) => String(r.type).toLowerCase() === "fallback")
    .map((r: any) => String(r.text));

    const lines = todays.length ? todays : (fallback.length ? fallback : ["怎么啦bb👀"]);

    const menu = bundle.DailyMenu || [];
    const inter = bundle.DailyInteraction || [];
  
    const todaysOptionIds = menu
      .filter((r: any) => String(r.date).slice(0, 10) === today)
      .map((r: any) => String(r.option_id));
  
    const byId = new Map<string, any>(inter.map((r: any) => [String(r.option_id), r]));
  
    const dailyItems = todaysOptionIds
      .map((id: string) => byId.get(id))
      .filter(Boolean)
      .slice(0, 3)
      .map((r: any) => ({
        option_id: String(r.option_id),
        title: String(r.title || "今天的小互动"),
        interaction_type: String(r.interaction_type || "choice").toLowerCase(),
        payload: safeJson(r.payload),
        response_map: safeJson(r.response_map),
      }));
  

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#fbf7f2] to-white text-neutral-800">
      <div className="mx-auto max-w-[980px] px-6 py-16">
        <div className="mb-10">
          <div className="text-sm text-neutral-500">
            {formatCNDate(today)}
          </div>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            又是喜欢你的一天！！啵啵啵～
          </h1>

          <p className="mt-3 max-w-xl text-neutral-600 leading-relaxed">
            vibe coding 了一下，送给你💖
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="mt-2 text-lg font-medium"><DailyChooser items={dailyItems as any} />
            </div>
          </div>

          <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
            <div className="mt-2 text-lg font-medium">
            <BlindBox
              today={today}
              rows={(bundle.BlindBox || []).map((r: any) => ({
                date: String(r.date),
                type: toBoxType(r.type),
                title: r.title ? String(r.title) : "",
                content: String(r.content),
              }))}
            />


            </div>
            <div className="mt-3 text-neutral-600">
              会变成纸条/拍立得/电视/屏幕。
            </div>
          </div>
        </div>
      </div>

      <PetFloof
      skinUrl={cfg["pet_skin_url"]}
      name={cfg["pet_name"] || "静静子"}
      lines={lines}
      />
    </main>
  );
}
