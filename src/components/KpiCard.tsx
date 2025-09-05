// src/components/KpiCard.tsx
import React from "react";

type Props = {
  title: string;
  value: number | string;
};

export default function KpiCard({ title, value }: Props) {
  return (
    <div
      className="
        h-24 md:h-28
        rounded-xl
        border border-white/5
        bg-slate-800/60
        shadow-sm
        transition
        hover:shadow-md hover:bg-slate-800
      "
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
