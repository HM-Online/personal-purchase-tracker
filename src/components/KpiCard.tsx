// src/components/KpiCard.tsx
import React from "react";

type Props = {
  title: string;
  value?: number | string; // can be undefined while loading
  onClick?: () => void;    // optional click handler
  active?: boolean;        // highlight when active
};

export default function KpiCard({ title, value, onClick, active = false }: Props) {
  const interactive = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      className={[
        "h-24 md:h-28 rounded-xl border shadow-sm transition",
        // modern dark
        "bg-neutral-900/70 border-neutral-800",
        // hover glow
        "hover:bg-neutral-900 hover:shadow-[0_0_10px] hover:shadow-cyan-500/30",
        // active ring/glow
        active ? "ring-2 ring-cyan-500/60 shadow-[0_0_12px] shadow-cyan-500/30" : "",
        interactive ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
      role={interactive ? "button" : undefined}
      aria-pressed={interactive ? active : undefined}
      tabIndex={interactive ? 0 : -1}
      onKeyDown={(e) => {
        if (!interactive) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div className="h-full flex flex-col items-center justify-center gap-1 px-4 text-center">
        <div className="text-[12px] uppercase tracking-wide text-neutral-400">
          {title}
        </div>
        <div className="text-3xl md:text-4xl font-semibold leading-none tabular-nums text-white">
          {value}
        </div>
      </div>
    </div>
  );
}
