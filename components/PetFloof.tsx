"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Props = {
  skinUrl?: string;
  lines: string[];
  name?: string;
};

function pick<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function PetFloof({ skinUrl, lines, name = "Floof" }: Props) {
  const [bubble, setBubble] = useState<string | null>(null);

  const [anim, setAnim] = useState<"idle" | "hop" | "spin" | "cling">("idle");
  const animTimer = useRef<number | null>(null);

  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const target = useRef<{ x: number; y: number } | null>(null);
  const current = useRef<{ x: number; y: number } | null>(null);
  const rafId = useRef<number | null>(null);

  const pressTimer = useRef<number | null>(null);
  const isPressing = useRef(false);
  const didLongPress = useRef(false);

  const fallbackLines = useMemo(
    () => (lines.length ? lines : ["我在这。", "贴贴。", "今天也辛苦了。"]),
    [lines]
  );

  const showBubble = (forceLine?: string) => {
    const line = forceLine ?? pick(fallbackLines);
    setBubble(line);
    window.setTimeout(() => setBubble(null), 2500);
    // @ts-ignore
    if (navigator?.vibrate) navigator.vibrate(10);
  };

  const triggerAnim = (next: typeof anim, ms: number) => {
    setAnim(next);
    if (animTimer.current) window.clearTimeout(animTimer.current);
    animTimer.current = window.setTimeout(() => setAnim("idle"), ms);
  };

  const pointToXY = (clientX: number, clientY: number) => {
    const x = clamp(clientX - 40, 16, window.innerWidth - 88);
    const y = clamp(clientY - 40, 16, window.innerHeight - 88);
    return { x, y };
  };

  const startFollowLoop = () => {
    if (rafId.current) return;

    const step = () => {
      const t = target.current;
      if (!t) {
        rafId.current = null;
        return;
      }

      if (!current.current) current.current = { ...t };
      const c = current.current;

      const alpha = 0.16; // 调小更软，调大更跟手
      c.x = c.x + (t.x - c.x) * alpha;
      c.y = c.y + (t.y - c.y) * alpha;

      setPos({ x: c.x, y: c.y });
      rafId.current = window.requestAnimationFrame(step);
    };

    rafId.current = window.requestAnimationFrame(step);
  };

  const stopFollowLoop = () => {
    target.current = null;
    current.current = null;
    if (rafId.current) {
      window.cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  const onTap = () => {
    triggerAnim("hop", 420);
    showBubble();
  };

  const onDoubleTap = () => {
    triggerAnim("spin", 520);
    showBubble(pick(["嘿嘿。", "我转给你看。", "贴贴升级。"]));
  };

  const startPress = (clientX: number, clientY: number) => {
    didLongPress.current = false;
    isPressing.current = true;

    pressTimer.current = window.setTimeout(() => {
      if (!isPressing.current) return;

      didLongPress.current = true;
      triggerAnim("cling", 1200);

      const xy = pointToXY(clientX, clientY);
      target.current = xy;
      current.current = { ...xy };
      setPos({ ...xy });

      startFollowLoop();
      showBubble(pick(["我来啦。", "贴贴。", "靠近一点。", "别走。"]));
    }, 350);
  };

  const endPress = () => {
    isPressing.current = false;
    if (pressTimer.current) window.clearTimeout(pressTimer.current);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    startPress(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPressing.current) return;
    if (!didLongPress.current) return;

    const xy = pointToXY(e.clientX, e.clientY);
    target.current = xy;
    startFollowLoop();
  };

  const handlePointerUp = () => {
    endPress();

    if (didLongPress.current) {
      didLongPress.current = false;
      stopFollowLoop();
      return;
    }

    onTap();
  };

  const handlePointerCancel = () => {
    endPress();
    stopFollowLoop();
  };

  useEffect(() => {
    return () => stopFollowLoop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style: React.CSSProperties = pos
    ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" }
    : { right: 80, bottom: 48 };

  return (
    <div className="fixed z-50 select-none" style={style}>
      {bubble && (
        <div className="mb-3 max-w-[240px] rounded-2xl border border-black/5 bg-white/80 px-4 py-3 text-sm text-neutral-700 shadow-sm backdrop-blur">
          <div className="opacity-60 text-xs mb-1">{name}</div>
          <div>{bubble}</div>
        </div>
      )}

      <button
        onDoubleClick={onDoubleTap}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        style={{ touchAction: "none" }}
        className={[
          "group relative h-30 w-30 rounded-full border border-black/5 bg-pink-50 shadow-sm backdrop-blur",
          "active:scale-[0.98] transition-transform select-none",
          anim === "hop" ? "animate-floof-hop" : "",
          anim === "spin" ? "animate-floof-spin" : "",
          anim === "cling" ? "animate-floof-cling" : "",
        ].join(" ")}
        aria-label="pet"
      >
        <div className="absolute inset-0 rounded-full animate-[floof-breathe_3.4s_ease-in-out_infinite] opacity-70" />
        <div className="absolute inset-0 rounded-full opacity-30 group-hover:animate-[floof-wiggle_1.6s_ease-in-out_infinite]" />

        {skinUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={skinUrl}
            alt="静静子"
            className="h-full w-full rounded-full object-contain object-center p-1 transition-transform duration-200 group-hover:scale-[1.03]"
            draggable={false}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="h-full w-full rounded-full flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-neutral-200/70 blur-[0.2px]" />
            <div className="absolute top-8 left-7 h-1.5 w-1.5 rounded-full bg-neutral-700/70" />
            <div className="absolute top-8 right-7 h-1.5 w-1.5 rounded-full bg-neutral-700/70" />
            <div className="absolute top-11 h-1 w-6 rounded-full bg-neutral-700/30" />
          </div>
        )}
      </button>

      <style jsx>{`
        @keyframes floof-breathe {
          0% {
            transform: scale(1);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.03);
            opacity: 0.75;
          }
          100% {
            transform: scale(1);
            opacity: 0.55;
          }
        }
        @keyframes floof-wiggle {
          0%,
          100% {
            transform: rotate(0deg);
          }
          25% {
            transform: rotate(1.2deg);
          }
          75% {
            transform: rotate(-1.2deg);
          }
        }
        @keyframes floof-hop {
          0% {
            transform: translateY(0) scale(1);
          }
          35% {
            transform: translateY(-10px) scale(1.03);
          }
          70% {
            transform: translateY(0) scale(0.99);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        @keyframes floof-spin {
          0% {
            transform: rotate(0deg) scale(1);
          }
          100% {
            transform: rotate(360deg) scale(1);
          }
        }
        @keyframes floof-cling {
          0% {
            transform: scale(1);
          }
          30% {
            transform: scale(1.05);
          }
          60% {
            transform: scale(1.02);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-floof-hop {
          animation: floof-hop 420ms ease-in-out;
        }
        .animate-floof-spin {
          animation: floof-spin 520ms ease-in-out;
        }
        .animate-floof-cling {
          animation: floof-cling 1200ms ease-in-out;
        }
      `}</style>
    </div>
  );
}
