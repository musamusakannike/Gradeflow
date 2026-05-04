"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { FiBookOpen, FiCreditCard, FiFileText, FiUsers } from "react-icons/fi";
import { api } from "@/lib/api";
import { classPerformance } from "@/lib/demo-data";
import { DashboardSummary } from "@/types/gradeflow";
import { SectionHeader, StatCard } from "./ui";

export function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    api<DashboardSummary>("/dashboard")
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load dashboard data");
        setLoading(false);
      });
  }, []);

  const sessionName = summary?.currentSession?.name ?? "No active session";
  const termName = summary?.currentTerm?.name ?? "No active term";

  const statCards = [
    {
      icon: FiUsers,
      label: "Active students",
      value: summary ? summary.counts.students.toString() : "—",
      delta: sessionName,
    },
    {
      icon: FiCreditCard,
      label: "Outstanding fees",
      value: summary ? summary.counts.unpaidFees.toString() : "—",
      delta: termName,
    },
    {
      icon: FiFileText,
      label: "Released results",
      value: summary ? summary.counts.releasedResults.toString() : "—",
      delta: termName,
    },
    {
      icon: FiBookOpen,
      label: "Staff members",
      value: summary ? summary.counts.staff.toString() : "—",
      delta: "Total staff",
    },
  ];

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Today"
        title="A quiet control room for the school term."
        copy="Track enrollment, fee friction, result release work, and class performance from one place."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[rgba(83,97,87,.08)] rounded-[var(--radius)] h-[120px]"
              />
            ))
          : statCards.map((card) => (
              <StatCard
                key={card.label}
                icon={card.icon}
                label={card.label}
                value={card.value}
                delta={card.delta}
              />
            ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="surface rounded-[28px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--clay)]">
                Class pulse
              </p>
              <h2 className="mt-1 text-2xl font-black">
                Performance against fee clearance
                {summary?.currentTerm ? ` — ${summary.currentTerm.name}` : ""}
                {summary?.currentSession ? `, ${summary.currentSession.name}` : ""}
              </h2>
            </div>
            <span className="rounded-full bg-[rgba(49,92,67,.1)] px-3 py-1 text-sm font-bold text-[var(--moss)]">
              {summary?.currentSession?.name ?? "No active session"}
            </span>
          </div>
          <div className="mt-6 h-[330px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={classPerformance}>
                  <defs>
                    <linearGradient id="avg" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#315c43" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#315c43" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid rgba(83,97,87,.16)",
                      background: "#fffaf0",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="average"
                    stroke="#315c43"
                    fill="url(#avg)"
                    strokeWidth={3}
                  />
                  <Area
                    type="monotone"
                    dataKey="paid"
                    stroke="#d8a23a"
                    fill="transparent"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </section>
        <section className="surface rounded-[28px] p-5">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-[var(--clay)]">
            API snapshot
          </p>
          <pre className="mt-4 max-h-[330px] overflow-auto rounded-2xl bg-[var(--night)] p-4 text-xs leading-6 text-[var(--paper)]">
            {JSON.stringify(
              summary || { mode: "preview", hint: "Sign in to load live /dashboard data." },
              null,
              2,
            )}
          </pre>
        </section>
      </div>
    </div>
  );
}
