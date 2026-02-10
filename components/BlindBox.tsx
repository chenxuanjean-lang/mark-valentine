"use client";

import { useEffect, useMemo, useState } from "react";

export type BoxRow = {
  date: string; // YYYY-MM-DD
  type: "text" | "image" | "video" | "link";
  title?: string;
  content: string; // text or url
};

export default function BlindBox({
  rows,
  today,
}: {
  rows: BoxRow[];
  today: string; // 由 app/page.tsx 传进来，避免服务端/客户端“今天”不一致导致 hydration
}) {
  const todayRow = useMemo(() => {
    return rows.find((r) => String(r.date).slice(0, 10) === today) || null;
  }, [rows, today]);

  // localStorage 相关：必须在 useEffect 里读，避免 hydration mismatch
  const key = `blindbox_opened_${today}`;
  const [alreadyOpened, setAlreadyOpened] = useState(false);
  const [openedNow, setOpenedNow] = useState(false);

  useEffect(() => {
    try {
      setAlreadyOpened(window.localStorage.getItem(key) === "1");
    } catch {
      setAlreadyOpened(false);
    }
  }, [key]);

  const open = () => {
    if (!todayRow) return;
    setOpenedNow(true);
    try {
      window.localStorage.setItem(key, "1");
      setAlreadyOpened(true);
    } catch {}
  };

  const reset = () => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
    setOpenedNow(false);
    setAlreadyOpened(false);
  };

  if (!todayRow) {
    return (
      <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
        <div className="text-sm text-neutral-500">Blind Box</div>
        <div className="mt-2 text-lg font-medium">今天没有盲盒</div>
        <div className="mt-3 text-neutral-600">
          去 Google Sheet 的 <span className="font-medium">BlindBox</span> 表为今天加一条。
        </div>
      </div>
    );
  }

  const showContent = openedNow || alreadyOpened;

  return (
    <div className="rounded-3xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur">
      <div className="text-sm text-neutral-500">Blind Box</div>
      <div className="mt-2 text-lg font-medium">{todayRow.title || "今天的小惊喜"}</div>

      {!showContent ? (
        <button
          className="mt-5 w-full rounded-3xl border border-black/5 bg-white px-6 py-10 text-neutral-800 shadow-sm hover:shadow transition"
          onClick={open}
        >
          <div className="text-sm text-neutral-500">Tap to open</div>
          <div className="mt-2 text-2xl">🎁</div>
        </button>
      ) : (
        <div className="mt-5">{renderObject(todayRow)}</div>
      )}

      {alreadyOpened && !openedNow && (
        <div className="mt-4 text-sm text-neutral-500">
          你今天已经开过盲盒啦（本机记录）。
        </div>
      )}

      <button
        className="mt-5 text-xs text-neutral-400 underline underline-offset-4"
        onClick={reset}
      >
        （测试用）重置今天盲盒
      </button>
    </div>
  );
}

/* ---------------------- Renderers (拟物 UI) ---------------------- */

function renderObject(row: BoxRow) {
  const t = String(row.type).toLowerCase();
  if (t === "text") return <StickyNote text={row.content} />;
  if (t === "image") return <PolaroidFrame url={row.content} />;
  if (t === "video") return <FilmFrameVideo videoUrl={row.content} />;
  if (t === "link") return <LinkCard url={row.content} />;
  return <StickyNote text={row.content} />;
}

/** —— 纸条 —— **/
function StickyNote({ text }: { text: string }) {
  return (
    <div className="relative rounded-3xl border border-black/10 bg-[#fff8dc] p-6 shadow-sm overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(#000_1px,transparent_1px)] [background-size:14px_14px]" />
      <div className="pointer-events-none absolute -top-6 -right-10 h-24 w-48 rotate-12 bg-white/60 blur-xl" />

      <div className="mb-2 text-xs text-neutral-500">a little note</div>
      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-neutral-800">
        {text}
      </div>
    </div>
  );
}

/** —— 拍立得 —— **/
function PolaroidFrame({ url }: { url: string }) {
  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="rounded-[28px] border border-black/10 bg-white shadow-sm overflow-hidden">
        {/* 相纸：上图下留白 */}
        <div className="p-4">
          <div className="rounded-2xl overflow-hidden border border-black/5 bg-neutral-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="photo"
              referrerPolicy="no-referrer"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
        <div className="px-5 pb-6">
          <div className="h-9" />
          <div className="text-xs text-neutral-400">polaroid</div>
        </div>
      </div>
    </div>
  );
}

/** —— 链接：简洁展示 —— **/
function LinkCard({ url }: { url: string }) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white shadow-sm p-5">
      <div className="text-xs text-neutral-500 mb-2">link</div>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl border border-black/5 bg-neutral-50 px-4 py-4 hover:bg-neutral-100 transition"
      >
        <div className="text-sm text-neutral-800">打开链接</div>
        <div className="mt-1 text-xs text-neutral-500 break-all">{url}</div>
      </a>
    </div>
  );
}

/** —— 电影胶片：封面 + 点击弹窗播放 —— **/
function FilmFrameVideo({ videoUrl }: { videoUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left rounded-3xl border border-black/10 bg-neutral-900 shadow-sm overflow-hidden"
      >
        {/* 胶片孔 */}
        <div className="flex justify-between px-4 py-3">
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-sm bg-neutral-700/80" />
            ))}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-sm bg-neutral-700/80" />
            ))}
          </div>
        </div>

        {/* 封面区域：用 video 首帧预览 */}
        <div className="px-4 pb-4">
          <div className="relative rounded-2xl overflow-hidden bg-black">
            <video
              src={videoUrl}
              className="w-full aspect-video object-cover opacity-90"
              preload="metadata"
              muted
              playsInline
            />
            <div className="absolute inset-0 grid place-items-center">
              <div className="rounded-full bg-white/85 px-5 py-3 text-sm text-neutral-900 shadow-sm">
                ▶ 播放
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-neutral-300">film</div>
        </div>
      </button>

      {/* 弹窗播放器 */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm p-6"
          onClick={() => setOpen(false)}
        >
          <div
            className="mx-auto w-full max-w-[780px] rounded-3xl bg-neutral-900 border border-white/10 shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <div className="text-sm text-neutral-200">Now playing</div>
              <button
                className="text-sm text-neutral-300 hover:text-white"
                onClick={() => setOpen(false)}
              >
                关闭
              </button>
            </div>
            <div className="p-4">
              <video
                src={videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full rounded-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
