// src/components/KpiCard.tsx
import React from "react";

type Props = {
  title: string;
  value?: number | string;
  onClick?: () => void;
  active?: boolean;
  /** optional icon to display above the title */
  icon?: React.ReactNode;
};

export default function KpiCard({ title, value, onClick, active = false, icon }: Props) {
  const interactive = typeof onClick === "function";

  return (
    <div
      onClick={onClick}
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
      className={[
        // glass / floating card
        "relative rounded-2xl border shadow-md transition",
        "border-white/10 bg-white/5 backdrop-blur-xl",
        // subtle hover glow
        "hover:shadow-[0_0_24px] hover:shadow-cyan-500/20",
        interactive ? "cursor-pointer" : "cursor-default",
        active ? "ring-2 ring-cyan-400/60 shadow-[0_0_24px] shadow-cyan-500/30" : "",
        "px-5 py-5 md:py-6 h-full",
      ].join(" ")}
    >
      <div className="flex items-center gap-4">
        {/* Icon pill */}
        {icon && (
          <div className={[
            "flex h-11 w-11 items-center justify-center rounded-xl",
            "bg-gradient-to-br from-cyan-400/20 to-cyan-500/10",
            "border border-white/10 text-cyan-300 shrink-0",
          ].join(" ")}>
            {icon}
          </div>
        )}

        <div className="flex-1">
          <div className="text-[12px] uppercase tracking-wide text-neutral-300/80">
            {title}
          </div>
          <div className="mt-1 text-3xl md:text-4xl font-semibold leading-none tabular-nums text-white">
            {value ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
