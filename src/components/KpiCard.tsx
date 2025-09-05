// src/components/KpiCard.tsx
import React from "react";

type Props = {
  title: string;
  value?: number | string; // can be undefined while loading
  onClick?: () => void;    // optional click handler to filter lists
};

export default function KpiCard({ title, value, onClick }: Props) {
  const interactive = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
      className={[
        "h-24 md:h-28 rounded-xl border border-white/5 bg-slate-800/60 shadow-sm transition",
        "hover:shadow-[0_0_10px] hover:shadow-accent-primary/40 hover:bg-slate-800",
        interactive ? "cursor-pointer" : "cursor-default",
      ].join(" ")}
      role={interactive ? "button" : undefined}
      aria-pressed={interactive ? undefined : undefined}
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
        <div className="text-[12px] uppercase tracking-wide text-slate-300/80">
          {title}
        </div>
        <div className="text-3xl md:text-4xl font-semibold leading-none tabular-nums text-white">
          {value}
        </div>
      </div>
    </div>
  );
}
