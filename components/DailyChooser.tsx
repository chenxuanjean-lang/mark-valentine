"use client";

import { useEffect, useMemo, useState } from "react";

type Interaction = {
  option_id: string;
  title: string;
  interaction_type: "choice" | "input";
  payload: any;
  response_map: any;
};

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function DailyChooser({ items }: { items: Interaction[] }) {
  const [picked, setPicked] = useState<Interaction | null>(null);
  const [answer, setAnswer] = useState("");
  const [reply, setReply] = useState<string | null>(null);

  const key = useMemo(() => `daily_done_${todayISO()}`, []);
  const [alreadyDone, setAlreadyDone] = useState(false);

  useEffect(() => {
    try {
      setAlreadyDone(window.localStorage.getItem(key) === "1");
    } catch {}
  }, [key]);

  const options = useMemo(() => {
    if (!picked) return [];
    if (picked.interaction_type !== "choice") return [];
    return Array.isArray(picked.payload) ? picked.payload : [];
  }, [picked]);

  const finish = (text: string) => {
    setReply(text);
    try {
      window.localStorage.setItem(key, "1");
      setAlreadyDone(true);
    } catch {}
  };

  const submitChoice = (v: string) => {
    const map = picked?.response_map || {};
    finish(String(map[v] || map["default"] || "我收到啦。"));
  };

  const submitInput = () => {
    const map = picked?.response_map || {};
    finish(String(map["default"] || "我看到你写的了。谢谢你。"));
  };

  const reset = () => {
    setPicked(null);
    setAnswer("");
    setReply(null);
    try {
      window.localStorage.removeItem(key);
      setAlreadyDone(false);
    } catch {}
  };

  // 没配到今天的3个选项
  if (!items || items.length === 0) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="text-sm text-neutral-500">Daily</div>
        <div className="mt-2 text-lg font-medium">今天还没配置三选一</div>
        <div className="mt-3 text-neutral-600">
          去 Google Sheet 的 <span className="font-medium">DailyMenu</span> 填今天的 3 行 option_id，
          并在 <span className="font-medium">DailyInteraction</span> 里配置对应内容。
        </div>
      </div>
    );
  }

  // 已完成：显示结果
  if (alreadyDone && reply) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="text-sm text-neutral-500">Daily</div>
        <div className="mt-2 text-lg font-medium">已完成</div>
        <div className="mt-4 rounded-2xl bg-white/70 border border-black/5 p-4 text-neutral-700 leading-relaxed">
          {reply}
        </div>
        <button
          className="mt-5 text-sm text-neutral-500 underline underline-offset-4"
          onClick={reset}
        >
          （测试用）重置今天
        </button>
      </div>
    );
  }

  // 已完成但没结果（比如刷新了）：给提示
  if (alreadyDone && !reply) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="text-sm text-neutral-500">Daily</div>
        <div className="mt-2 text-lg font-medium">今天已经做过啦</div>
        <div className="mt-3 text-neutral-600">
          明天会有新的三选一。
        </div>
        <button
          className="mt-5 text-sm text-neutral-500 underline underline-offset-4"
          onClick={reset}
        >
          （测试用）重置今天
        </button>
      </div>
    );
  }

  // 未选择：三张卡
  if (!picked) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="text-sm text-neutral-500">Daily</div>
        <div className="mt-2 text-lg font-medium">今天想做什么？</div>
        <div className="mt-4 grid gap-3">
          {items.slice(0, 3).map((it) => (
            <button
              key={it.option_id}
              className="rounded-2xl border border-black/5 bg-white/70 px-4 py-3 text-left shadow-sm hover:bg-white transition"
              onClick={() => setPicked(it)}
            >
              <div className="text-neutral-800">{it.title}</div>
              <div className="mt-1 text-xs text-neutral-500">
                {it.interaction_type === "choice" ? "点一下试试！" : "写一句话"}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 进入互动页面
  return (
    <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="text-sm text-neutral-500">Daily</div>
      <div className="mt-2 text-lg font-medium">{picked.title}</div>

      {picked.interaction_type === "choice" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((op: any) => (
            <button
              key={String(op)}
              className="rounded-full border border-black/5 bg-white/70 px-4 py-2 text-sm text-neutral-700 hover:bg-white transition"
              onClick={() => submitChoice(String(op))}
            >
              {String(op)}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="写一句就好"
            className="w-full min-h-[110px] rounded-2xl border border-black/5 bg-white/70 p-4 text-neutral-700 outline-none focus:ring-2 focus:ring-black/10"
          />
          <button
            className="mt-3 rounded-2xl border border-black/5 bg-white px-4 py-2 text-sm text-neutral-800 shadow-sm hover:shadow transition"
            onClick={submitInput}
          >
            发送
          </button>
        </div>
      )}

      <div className="mt-5 flex gap-4">
        <button
          className="text-sm text-neutral-500 underline underline-offset-4"
          onClick={() => setPicked(null)}
        >
          返回
        </button>
      </div>
    </div>
  );
}
