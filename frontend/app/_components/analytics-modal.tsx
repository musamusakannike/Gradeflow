"use client";

import { useEffect, useRef, useState } from "react";
import { FiBarChart2, FiX } from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { AcademicTerm, ClassAnalytics, SchoolClass } from "@/types/gradeflow";
import { Button, EmptyState, InlineError } from "./ui";

interface AnalyticsModalProps {
  onClose: () => void;
  classes: SchoolClass[];
  terms: AcademicTerm[];
  initialClassId?: string;
  initialTermId?: string;
}

export function AnalyticsModal({
  onClose,
  classes,
  terms,
  initialClassId,
  initialTermId,
}: AnalyticsModalProps) {
  const [selectedClassId, setSelectedClassId] = useState(initialClassId ?? "");
  const [selectedTermId, setSelectedTermId] = useState(initialTermId ?? "");
  const [analytics, setAnalytics] = useState<ClassAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [empty, setEmpty] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Auto-fetch when both IDs are pre-selected on open
  useEffect(() => {
    if (initialClassId && initialTermId) {
      fetchAnalytics(initialClassId, initialTermId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchAnalytics(classId: string, termId: string) {
    if (!classId || !termId) {
      setValidationError("Please select both a class and a term");
      return;
    }
    setValidationError(null);
    setError(null);
    setEmpty(false);
    setAnalytics(null);
    setLoading(true);
    try {
      const data = await api<ClassAnalytics>(
        `/results/class/${classId}/analytics?termId=${termId}`,
      );
      if (!data || data.totals.totalScores === 0) {
        setEmpty(true);
      } else {
        setAnalytics(data);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setEmpty(true);
      } else {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleFetch() {
    fetchAnalytics(selectedClassId, selectedTermId);
  }

  return (
    /* Overlay — tabIndex allows focus trap on the container */
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Class analytics"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="surface w-full max-w-3xl rounded-[28px] p-6 mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-[var(--ink)]">Class Analytics</h2>
          <Button
            type="button"
            variant="ghost"
            icon={FiX}
            aria-label="Close analytics"
            onClick={onClose}
          />
        </div>

        {/* Selectors */}
        <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <select
            className="field"
            value={selectedClassId}
            disabled={loading}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setValidationError(null);
            }}
          >
            <option value="">Select a class…</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="field"
            value={selectedTermId}
            disabled={loading}
            onChange={(e) => {
              setSelectedTermId(e.target.value);
              setValidationError(null);
            }}
          >
            <option value="">Select a term…</option>
            {terms.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </select>

          <Button type="button" onClick={handleFetch} disabled={loading}>
            {loading ? "Loading…" : "View"}
          </Button>
        </div>

        {/* Validation error */}
        <InlineError message={validationError ?? undefined} />

        {/* API error */}
        {error && (
          <p className="mt-3 text-sm font-medium text-[var(--danger)]">{error}</p>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="mt-8 flex justify-center">
            <span className="text-sm text-[var(--ink-soft)]">Loading analytics…</span>
          </div>
        )}

        {/* Empty state */}
        {!loading && empty && (
          <div className="mt-8">
            <EmptyState
              icon={FiBarChart2}
              message="No results found for this class and term"
            />
          </div>
        )}

        {/* Analytics content */}
        {!loading && analytics && (
          <div className="mt-6 grid gap-6">
            {/* Overall stat cards */}
            <div>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                Overall
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Scores" value={String(analytics.totals.totalScores)} />
                <StatCard
                  label="Average"
                  value={analytics.totals.averageScore.toFixed(2)}
                />
                <StatCard
                  label="Highest"
                  value={String(analytics.totals.highestScore)}
                />
                <StatCard
                  label="Lowest"
                  value={String(analytics.totals.lowestScore)}
                />
                <StatCard label="Pass Count" value={String(analytics.totals.passCount)} />
                <StatCard label="Fail Count" value={String(analytics.totals.failCount)} />
                <StatCard
                  label="Pass Rate"
                  value={`${analytics.totals.passRate.toFixed(1)}%`}
                />
              </div>
            </div>

            {/* Per-subject table */}
            {analytics.bySubject.length > 0 && (
              <div>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                  By Subject
                </h3>
                <div className="overflow-x-auto rounded-2xl border border-[rgba(83,97,87,.12)]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[rgba(83,97,87,.12)] bg-[rgba(49,92,67,.04)]">
                        <th className="px-4 py-3 text-left font-semibold text-[var(--ink)]">
                          Subject
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-[var(--ink)]">
                          Code
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-[var(--ink)]">
                          Average
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-[var(--ink)]">
                          Highest
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-[var(--ink)]">
                          Lowest
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-[var(--ink)]">
                          Pass Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.bySubject.map((row, i) => (
                        <tr
                          key={`${row.code}-${i}`}
                          className="border-b border-[rgba(83,97,87,.08)] last:border-0 hover:bg-[rgba(49,92,67,.03)]"
                        >
                          <td className="px-4 py-3 font-medium text-[var(--ink)]">
                            {row.subject}
                          </td>
                          <td className="px-4 py-3 text-[var(--ink-soft)]">{row.code}</td>
                          <td className="px-4 py-3 text-right text-[var(--ink)]">
                            {row.averageScore.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--ink)]">
                            {row.highestScore}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--ink)]">
                            {row.lowestScore}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--ink)]">
                            {row.passRate.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small internal stat card — only used inside this modal
// ---------------------------------------------------------------------------

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-2xl p-4 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-soft)]">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black text-[var(--ink)]">{value}</p>
    </div>
  );
}
