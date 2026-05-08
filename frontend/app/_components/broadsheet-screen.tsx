"use client";

import { useEffect, useState } from "react";
import { FiDownload, FiGrid, FiUsers } from "react-icons/fi";
import { api, ApiError, tokenStore } from "@/lib/api";
import { useRouter } from "next/navigation";
import type { AcademicTerm, ClassBroadsheet, ResultSummaryFull, SchoolClass } from "@/types/gradeflow";
import { Button, EmptyState, InlineError, SectionHeader } from "./ui";

// ---------------------------------------------------------------------------
// Position calculation — standard competition ranking (1, 1, 3, 4…)
// ---------------------------------------------------------------------------

function assignPositions(results: ResultSummaryFull[]): Map<string, number> {
  const sorted = [...results].sort(
    (a, b) => b.summary.averageScore - a.summary.averageScore,
  );
  const positions = new Map<string, number>();
  let pos = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].summary.averageScore < sorted[i - 1].summary.averageScore) {
      pos = i + 1;
    }
    positions.set(sorted[i].student.id, pos);
  }
  return positions;
}

// ---------------------------------------------------------------------------
// Top-3 row class helper
// ---------------------------------------------------------------------------

function getRowHighlightClass(position: number): string {
  if (position === 1) return "border-l-4 border-[#FFD700] bg-[rgba(255,215,0,.06)]";
  if (position === 2) return "border-l-4 border-[#C0C0C0] bg-[rgba(192,192,192,.06)]";
  if (position === 3) return "border-l-4 border-[#CD7F32] bg-[rgba(205,127,50,.06)]";
  return "";
}

// ---------------------------------------------------------------------------
// CSV export
// ---------------------------------------------------------------------------

function exportToCsv(
  broadsheet: ClassBroadsheet,
  subjectNames: string[],
  positions: Map<string, number>,
  className: string,
  termName: string,
) {
  const headers = [
    "Student",
    "ID",
    ...subjectNames.flatMap((s) => [
      `${s} T1`,
      `${s} T2`,
      `${s} Exam`,
      `${s} Total`,
      `${s} Grade`,
    ]),
    "Average",
    "Position",
  ];

  const rows = broadsheet.results.map((r) => {
    const subjectCells = subjectNames.flatMap((name) => {
      const subj = r.subjects.find((s) => s.name === name);
      if (!subj) return ["—", "—", "—", "—", "—"];
      return [
        subj.test1 != null ? String(subj.test1) : "—",
        subj.test2 != null ? String(subj.test2) : "—",
        subj.exam != null ? String(subj.exam) : "—",
        subj.total != null ? String(subj.total) : "—",
        subj.grade ?? "—",
      ];
    });
    const pos = positions.get(r.student.id);
    return [
      r.student.name,
      r.student.studentId,
      ...subjectCells,
      r.summary.averageScore.toFixed(2),
      pos != null ? String(pos) : "—",
    ];
  });

  const csvContent = [headers, ...rows]
    .map((row) =>
      row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `broadsheet-${className.replace(/\s+/g, "-").toLowerCase()}-${termName.replace(/\s+/g, "-").toLowerCase()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BroadsheetScreen() {
  const router = useRouter();

  // Reference data
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);

  // Selection
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");

  // Broadsheet data
  const [broadsheet, setBroadsheet] = useState<ClassBroadsheet | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [refLoading, setRefLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load classes and terms on mount
  useEffect(() => {
    setRefLoading(true);
    Promise.all([
      api<SchoolClass[]>("/classes"),
      api<AcademicTerm[]>("/academic/terms"),
    ])
      .then(([classesPayload, termsData]) => {
        const classesList = (classesPayload as any).classes ?? classesPayload;
        setClasses(Array.isArray(classesList) ? classesList : []);
        setTerms(Array.isArray(termsData) ? termsData : []);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
          router.push("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load reference data");
      })
      .finally(() => setRefLoading(false));
  }, [router]);

  // Fetch broadsheet when both class and term are selected
  useEffect(() => {
    if (!selectedClassId || !selectedTermId) {
      setBroadsheet(null);
      return;
    }

    setLoading(true);
    setError(null);
    setBroadsheet(null);

    api<ClassBroadsheet>(`/results/class/${selectedClassId}?termId=${selectedTermId}`)
      .then((data) => {
        setBroadsheet(data);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
          router.push("/login");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load broadsheet");
      })
      .finally(() => setLoading(false));
  }, [selectedClassId, selectedTermId, router]);

  // Derive subject names from the first result that has subjects
  const subjectNames: string[] = broadsheet
    ? Array.from(
        new Set(
          broadsheet.results.flatMap((r) => r.subjects.map((s) => s.name)),
        ),
      )
    : [];

  // Compute positions
  const positions = broadsheet ? assignPositions(broadsheet.results) : new Map<string, number>();

  // Sort results by average descending for display
  const sortedResults = broadsheet
    ? [...broadsheet.results].sort(
        (a, b) => b.summary.averageScore - a.summary.averageScore,
      )
    : [];

  const selectedClass = classes.find((c) => c.id === selectedClassId);
  const selectedTerm = terms.find((t) => t._id === selectedTermId);

  function handleExport() {
    if (!broadsheet || !selectedClass || !selectedTerm) return;
    exportToCsv(broadsheet, subjectNames, positions, selectedClass.name, selectedTerm.name);
  }

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Reports"
        title="Class Broadsheet"
        copy="View and export a full class result sheet with subject scores, averages, and rankings."
      />

      {/* Selectors */}
      <div className="surface rounded-[28px] p-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
              Class
            </label>
            <select
              className="field"
              value={selectedClassId}
              disabled={refLoading || loading}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Select a class…</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
              Term
            </label>
            <select
              className="field"
              value={selectedTermId}
              disabled={refLoading || loading}
              onChange={(e) => setSelectedTermId(e.target.value)}
            >
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="secondary"
              icon={FiDownload}
              disabled={!broadsheet || loading || sortedResults.length === 0}
              onClick={handleExport}
            >
              Download CSV
            </Button>
          </div>
        </div>

        {/* API error */}
        {error && (
          <div className="mt-4">
            <InlineError message={error} />
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="surface rounded-[28px] p-5">
          <div className="animate-pulse space-y-3">
            <div className="h-5 w-48 rounded-xl bg-[rgba(49,92,67,.1)]" />
            <div className="h-4 w-full rounded-xl bg-[rgba(49,92,67,.07)]" />
            <div className="h-4 w-full rounded-xl bg-[rgba(49,92,67,.07)]" />
            <div className="h-4 w-3/4 rounded-xl bg-[rgba(49,92,67,.07)]" />
          </div>
        </div>
      )}

      {/* Prompt to select */}
      {!loading && !error && !broadsheet && (selectedClassId === "" || selectedTermId === "") && (
        <div className="surface rounded-[28px] p-5">
          <EmptyState
            icon={FiGrid}
            message="Select a class and term above to view the broadsheet."
          />
        </div>
      )}

      {/* Empty — no students */}
      {!loading && !error && broadsheet && sortedResults.length === 0 && (
        <div className="surface rounded-[28px] p-5">
          <EmptyState icon={FiUsers} message="No students found in this class." />
        </div>
      )}

      {/* Broadsheet table */}
      {!loading && !error && broadsheet && sortedResults.length > 0 && (
        <>
          {/* Class stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <MiniStatCard
              label="Total Students"
              value={String(broadsheet.classStats.totalStudents)}
            />
            <MiniStatCard
              label="Highest Average"
              value={broadsheet.classStats.highestAverage.toFixed(1)}
            />
            <MiniStatCard
              label="Lowest Average"
              value={broadsheet.classStats.lowestAverage.toFixed(1)}
            />
            <MiniStatCard
              label="Class Average"
              value={broadsheet.classStats.classAverage.toFixed(1)}
            />
          </div>

          {/* Table */}
          <div className="surface rounded-[28px] p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-black text-[var(--ink)]">
                {selectedClass?.name} — {selectedTerm?.name}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(83,97,87,.12)] text-left text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                    {/* Fixed left */}
                    <th className="min-w-[160px] pb-3 pr-4">Student</th>
                    <th className="min-w-[100px] pb-3 pr-4">Student ID</th>

                    {/* Dynamic subject columns */}
                    {subjectNames.map((name) => (
                      <th
                        key={name}
                        colSpan={5}
                        className="pb-3 pr-2 text-center"
                      >
                        {name}
                      </th>
                    ))}

                    {/* Fixed right */}
                    <th className="min-w-[80px] pb-3 pr-4 text-center">Average</th>
                    <th className="min-w-[80px] pb-3 text-center">Position</th>
                  </tr>

                  {/* Sub-header for subject columns */}
                  {subjectNames.length > 0 && (
                    <tr className="border-b border-[rgba(83,97,87,.08)] text-xs text-[var(--ink-soft)]">
                      {/* Fixed left placeholders */}
                      <th className="pb-2 pr-4" />
                      <th className="pb-2 pr-4" />

                      {subjectNames.map((name) => (
                        <>
                          <th key={`${name}-t1`} className="pb-2 pr-1 text-center font-medium">
                            T1
                          </th>
                          <th key={`${name}-t2`} className="pb-2 pr-1 text-center font-medium">
                            T2
                          </th>
                          <th key={`${name}-ex`} className="pb-2 pr-1 text-center font-medium">
                            Exam
                          </th>
                          <th key={`${name}-tot`} className="pb-2 pr-1 text-center font-medium">
                            Total
                          </th>
                          <th key={`${name}-gr`} className="pb-2 pr-2 text-center font-medium">
                            Grade
                          </th>
                        </>
                      ))}

                      {/* Fixed right placeholders */}
                      <th className="pb-2 pr-4" />
                      <th className="pb-2" />
                    </tr>
                  )}
                </thead>

                <tbody>
                  {sortedResults.map((result) => {
                    const pos = positions.get(result.student.id) ?? 0;
                    const highlightClass = getRowHighlightClass(pos);

                    return (
                      <tr
                        key={result.student.id}
                        className={`border-b border-[rgba(83,97,87,.07)] ${highlightClass}`}
                      >
                        {/* Student name */}
                        <td className="py-3 pr-4 font-medium text-[var(--ink)]">
                          {result.student.name}
                        </td>

                        {/* Student ID */}
                        <td className="py-3 pr-4 text-[var(--ink-soft)]">
                          {result.student.studentId}
                        </td>

                        {/* Subject scores */}
                        {subjectNames.map((name) => {
                          const subj = result.subjects.find((s) => s.name === name);
                          return (
                            <>
                              <td
                                key={`${result.student.id}-${name}-t1`}
                                className="py-3 pr-1 text-center text-[var(--ink-soft)]"
                              >
                                {subj?.test1 != null ? subj.test1 : "—"}
                              </td>
                              <td
                                key={`${result.student.id}-${name}-t2`}
                                className="py-3 pr-1 text-center text-[var(--ink-soft)]"
                              >
                                {subj?.test2 != null ? subj.test2 : "—"}
                              </td>
                              <td
                                key={`${result.student.id}-${name}-ex`}
                                className="py-3 pr-1 text-center text-[var(--ink-soft)]"
                              >
                                {subj?.exam != null ? subj.exam : "—"}
                              </td>
                              <td
                                key={`${result.student.id}-${name}-tot`}
                                className="py-3 pr-1 text-center font-semibold text-[var(--ink)]"
                              >
                                {subj?.total != null ? subj.total : "—"}
                              </td>
                              <td
                                key={`${result.student.id}-${name}-gr`}
                                className="py-3 pr-2 text-center"
                              >
                                {subj?.grade != null ? (
                                  <GradeBadge grade={subj.grade} />
                                ) : (
                                  <span className="text-[var(--ink-soft)]">—</span>
                                )}
                              </td>
                            </>
                          );
                        })}

                        {/* Average */}
                        <td className="py-3 pr-4 text-center font-semibold text-[var(--ink)]">
                          {result.summary.averageScore.toFixed(2)}
                        </td>

                        {/* Position */}
                        <td className="py-3 text-center">
                          <PositionBadge position={pos} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Footer row */}
                <tfoot>
                  <tr className="border-t-2 border-[rgba(83,97,87,.2)] bg-[rgba(49,92,67,.04)] text-xs font-bold text-[var(--ink-soft)]">
                    <td className="py-3 pr-4 text-[var(--ink)]">
                      {broadsheet.classStats.totalStudents} students
                    </td>
                    <td className="py-3 pr-4" />

                    {/* Empty cells for subject columns */}
                    {subjectNames.flatMap((name) => [
                      <td key={`foot-${name}-t1`} className="py-3 pr-1" />,
                      <td key={`foot-${name}-t2`} className="py-3 pr-1" />,
                      <td key={`foot-${name}-ex`} className="py-3 pr-1" />,
                      <td key={`foot-${name}-tot`} className="py-3 pr-1" />,
                      <td key={`foot-${name}-gr`} className="py-3 pr-2" />,
                    ])}

                    <td className="py-3 pr-4 text-center text-[var(--ink)]">
                      <div className="text-[10px] text-[var(--ink-soft)]">Class avg</div>
                      <div className="font-black text-[var(--ink)]">
                        {broadsheet.classStats.classAverage.toFixed(1)}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <div className="text-[10px] text-[var(--ink-soft)]">
                        Hi {broadsheet.classStats.highestAverage.toFixed(1)} / Lo{" "}
                        {broadsheet.classStats.lowestAverage.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MiniStatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface rounded-2xl p-4 text-center">
      <p className="text-2xl font-black text-[var(--ink)]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[var(--ink-soft)]">{label}</p>
    </div>
  );
}

function GradeBadge({ grade }: { grade: string }) {
  const isPass = !["F", "E"].includes(grade);
  return (
    <span
      className={
        isPass
          ? "inline-flex items-center rounded-full bg-[rgba(49,92,67,.1)] px-2 py-0.5 text-xs font-bold text-[var(--moss)]"
          : "inline-flex items-center rounded-full bg-[rgba(182,69,69,.1)] px-2 py-0.5 text-xs font-bold text-[var(--danger)]"
      }
    >
      {grade}
    </span>
  );
}

function PositionBadge({ position }: { position: number }) {
  if (position === 1) {
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(255,215,0,.18)] px-2.5 py-0.5 text-xs font-black text-[#9a7c00]">
        🥇 1st
      </span>
    );
  }
  if (position === 2) {
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(192,192,192,.2)] px-2.5 py-0.5 text-xs font-black text-[#666]">
        🥈 2nd
      </span>
    );
  }
  if (position === 3) {
    return (
      <span className="inline-flex items-center rounded-full bg-[rgba(205,127,50,.15)] px-2.5 py-0.5 text-xs font-black text-[#7a4a10]">
        🥉 3rd
      </span>
    );
  }
  return (
    <span className="text-sm font-semibold text-[var(--ink-soft)]">{position}</span>
  );
}
