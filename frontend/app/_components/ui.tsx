"use client";

import clsx from "clsx";
import { motion } from "motion/react";
import type { IconType } from "react-icons";
import { tap } from "@/lib/haptics";

export function Button({
  children,
  variant = "primary",
  className,
  icon: Icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconType;
}) {
  return (
    <button
      {...props}
      onClick={(event) => {
        tap();
        props.onClick?.(event);
      }}
      className={clsx(
        "focus-ring pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold",
        variant === "primary" &&
          "bg-[var(--moss)] text-[var(--white)] shadow-[0_16px_36px_rgba(49,92,67,.22)] hover:bg-[#274d38]",
        variant === "secondary" &&
          "border border-[rgba(49,92,67,.25)] bg-[rgba(255,253,247,.7)] text-[var(--moss)] hover:border-[rgba(49,92,67,.42)]",
        variant === "ghost" && "text-[var(--ink-soft)] hover:bg-[rgba(49,92,67,.08)]",
        variant === "danger" &&
          "bg-[rgba(182,69,69,.11)] text-[var(--danger)] hover:bg-[rgba(182,69,69,.16)]",
        className,
      )}
    >
      {Icon ? <Icon className="text-base" /> : null}
      {children}
    </button>
  );
}

export function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: IconType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface rounded-[var(--radius)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--ink-soft)]">{label}</p>
          <p className="mt-2 text-3xl font-black text-[var(--ink)]">{value}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl bg-[rgba(216,162,58,.18)] text-[var(--moss)]">
          <Icon className="text-xl" />
        </div>
      </div>
      <p className="mt-4 text-sm font-semibold text-[var(--teal)]">{delta}</p>
    </motion.div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  copy,
}: {
  eyebrow?: string;
  title: string;
  copy?: string;
}) {
  return (
    <div>
      {eyebrow ? (
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--clay)]">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-display text-3xl font-black leading-tight text-[var(--ink)] md:text-5xl">
        {title}
      </h1>
      {copy ? <p className="mt-3 max-w-2xl text-[var(--ink-soft)]">{copy}</p> : null}
    </div>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[rgba(49,92,67,.18)] bg-[rgba(255,253,247,.62)] px-3 py-1 text-xs font-bold text-[var(--moss)]">
      {children}
    </span>
  );
}
