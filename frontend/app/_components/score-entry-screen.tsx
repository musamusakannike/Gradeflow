"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit,
  FiRefreshCw,
  FiSave,
  FiUsers,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { validateScoreSelectionForm } from "@/lib/admin-forms";
import type { AcademicTerm, ClassSubjectOption, ScoreRow } from "@/types/gradeflow";
import { Button, EmptyState, InlineError, SectionHeader } from "./ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SubjectScoreResponse {
  scores: Array<{
    student: { id: string; name: string; studentId: string };
    test1: number;
    test2: number;
    exam: number;
    total: number;
    grade: string;
    remark: string;
  }>;
  stats: {
    totalStudents: number;
    highestScore: number;
    lowestScore: number;
    averageScore: number;
    passRate: number;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function validateScore(value: number, max: number): string | null {
  if (!Number.isInteger(value)) return "Must be a whole number";
  if (value < 0 || value > max) return `Must be between 0 and ${max}`;
  return null;
}

export function computeGrade(total: number): string {
  if (total >= 70) return "A";
  if (total >= 65) return "B+";
  if (total >= 60) return "B";
  if (total >= 55) return "C+";
  if (total >= 50) return "C";
  if (total >= 45) return "D";
  if (total >= 40) return "E";
  return "F";
}

// ---------------------------------------------------------------------------
// ScoreEntryScreen
// ---------------------------------------------------------------------------

export function ScoreEntryScreen() {
  const [assignments, setAssignments] = useState<ClassSubjectOption[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [metaError, setMetaError] = useState<string | null>(null);

  // Selection state
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [selectionErrors, setSelectionErrors] = useState<Record<string, string>>({});

  // Score table state
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([]);
  const [loadingScores, setLoadingScores] = useState(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);
  const [stats, setStats] = useState<SubjectScoreResponse["stats"] | null>(null);

  // Saving state
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  const [savedRows, setSavedRows] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  // Validation error state: keyed by studentId
  const [scoreErrors, setScoreErrors] = useState<
    Record<string, { test1?: string; test2?: string; exam?: string }>
  >({});

  // Load assignments and terms on mount
  useEffect(() => {
    setLoadingMeta(true);
    setMetaError(null);

    Promise.all([
      api<{ assignments: ClassSubjectOption[] }>("/subjects/assignments"),
      api<AcademicTerm[]>("/academic/terms"),
    ])
      .then(([assignmentsPayload, termsData]) => {
        const list = (assignmentsPayload as any).assignments || assignmentsPayload;
        setAssignments(Array.isArray(list) ? list : []);
        setTerms(Array.isArray(termsData) ? termsData : []);

        // Auto-select current term
        const currentTerm = (Array.isArray(termsData) ? termsData : []).find(
          (t) => t.isCurrent,
        );
        if (currentTerm) setSelectedTermId(currentTerm._id);
      })
      .catch((error) => {
        setMetaError(error instanceof Error ? error.message : "Could not load data");
      })
      .finally(() => setLoadingMeta(false));
  }, []);

  // Load scores when selection changes
  const loadScores = useCallback(async () => {
    const errors = validateScoreSelectionForm({
      classSubjectId: selectedAssignmentId,
      termId: selectedTermId,
    });
    if (Object.keys(errors).length > 0) {
      setSelectionErrors(errors);
      return;
    }
    setSelectionErrors({});
    setLoadingScores(true);
    setScoresLoaded(false);
    setSavedRows(new Set());

    try {
      const data = await api<SubjectScoreResponse>(
        `/scores/subject/${selectedAssignmentId}?termId=${selectedTermId}`,
      );

      setStats(data.stats);

      if (data.scores.length === 0) {
        // No scores yet — we need to load students for this class
        const assignment = assignments.find((a) => a._id === selectedAssignmentId);
        const classId =
          typeof assignment?.classId === "object"
            ? (assignment.classId as { _id: string })._id
            : assignment?.classId;

        if (classId) {
          const studentsPayload = await api<{
            students: Array<{
              _id: string;
              studentId: string;
              user?: { firstName?: string; lastName?: string };
            }>;
          }>(`/students?classId=${classId}&limit=200`);

          const students = (studentsPayload as any).students || studentsPayload;
          setScoreRows(
            (Array.isArray(students) ? students : []).map((s: any) => ({
              studentId: s._id,
              studentName:
                `${s.user?.firstName || ""} ${s.user?.lastName || ""}`.trim() ||
                s.studentId,
              studentCode: s.studentId,
              test1: 0,
              test2: 0,
              exam: 0,
            })),
          );
        } else {
          setScoreRows([]);
        }
      } else {
        setScoreRows(
          data.scores.map((s) => ({
            studentId: s.student.id,
            studentName: s.student.name,
            studentCode: s.student.studentId,
            test1: s.test1,
            test2: s.test2,
            exam: s.exam,
            total: s.total,
            grade: s.grade,
            remark: s.remark,
          })),
        );
      }
      setScoresLoaded(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not load scores");
    } finally {
      setLoadingScores(false);
    }
  }, [selectedAssignmentId, selectedTermId, assignments]);

  // Update a single score field
  function updateScore(
    studentId: string,
    field: "test1" | "test2" | "exam",
    value: string,
  ) {
    const num = value === "" ? 0 : Number(value);
    setScoreRows((prev) =>
      prev.map((row) =>
        row.studentId === studentId ? { ...row, [field]: num } : row,
      ),
    );
    // Clear saved state for this row when editing
    setSavedRows((prev) => {
      const next = new Set(prev);
      next.delete(studentId);
      return next;
    });
    // Run validation for the changed field
    const max = field === "exam" ? 60 : 20;
    const error = validateScore(num, max);
    setScoreErrors((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: error ?? undefined,
      },
    }));
  }

  // Save a single student's score
  async function saveScore(row: ScoreRow) {
    // Abort if there are active validation errors for this row
    const rowErrors = scoreErrors[row.studentId];
    if (rowErrors && Object.values(rowErrors).some(Boolean)) {
      toast.error("Fix validation errors before saving.");
      return;
    }
    setSavingRows((prev) => new Set(prev).add(row.studentId));
    try {
      await api("/scores", {
        method: "POST",
        body: JSON.stringify({
          studentId: row.studentId,
          classSubjectId: selectedAssignmentId,
          termId: selectedTermId,
          test1: row.test1,
          test2: row.test2,
          exam: row.exam,
        }),
      });
      setSavedRows((prev) => new Set(prev).add(row.studentId));
      toast.success(`Score saved for ${row.studentName}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save score");
    } finally {
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(row.studentId);
        return next;
      });
    }
  }

  // Save all scores at once
  async function saveAllScores() {
    if (scoreRows.length === 0) return;
    // Abort if any row has active validation errors
    const hasErrors = Object.values(scoreErrors).some((rowErr) =>
      Object.values(rowErr).some(Boolean),
    );
    if (hasErrors) {
      toast.error("Fix all validation errors before saving.");
      return;
    }
    setBulkSaving(true);
    try {
      const result = await api<{ updated: number; created: number; errors: string[] }>(
        "/scores/bulk",
        {
          method: "POST",
          body: JSON.stringify({
            classSubjectId: selectedAssignmentId,
            termId: selectedTermId,
            scores: scoreRows.map((row) => ({
              studentId: row.studentId,
              test1: row.test1,
              test2: row.test2,
              exam: row.exam,
            })),
          }),
        },
      );

      const allIds = new Set(scoreRows.map((r) => r.studentId));
      setSavedRows(allIds);

      if (result.errors.length > 0) {
        toast.error(`Saved with ${result.errors.length} error(s). Check console.`);
        console.error("Bulk save errors:", result.errors);
      } else {
        toast.success(
          `Saved ${result.created + result.updated} scores (${result.created} new, ${result.updated} updated)`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save scores");
    } finally {
      setBulkSaving(false);
    }
  }

  // Get display label for an assignment
  function getAssignmentLabel(a: ClassSubjectOption): string {
    const subjectName =
      typeof a.subjectId === "object"
        ? (a.subjectId as { name: string }).name
        : a.subject?.name || "Unknown Subject";
    const className =
      typeof a.classId === "object"
        ? (a.classId as { name: string }).name
        : a.class?.name || "Unknown Class";
    return `${subjectName} — ${className}`;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (metaError) {
    return (
      <div className="grid gap-7">
        <SectionHeader
          eyebrow="Score entry"
          title="Enter student scores"
          copy="Select a subject and term to enter test and exam scores."
        />
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <FiAlertCircle className="text-3xl text-[var(--danger)]" />
          <p className="text-sm text-[var(--ink-soft)]">{metaError}</p>
          <Button
            variant="secondary"
            icon={FiRefreshCw}
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Score entry"
        title="Enter student scores"
        copy="Select a subject assignment and term, then enter test 1, test 2, and exam scores for each student."
      />

      {/* Selection panel */}
      <div className="surface rounded-[28px] p-5">
        <h2 className="text-xl font-black">Select subject and term</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <label
              htmlFor="assignment-select"
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            >
              Subject assignment
            </label>
            {loadingMeta ? (
              <div className="animate-pulse h-11 rounded-[14px] bg-[rgba(83,97,87,.08)]" />
            ) : (
              <select
                id="assignment-select"
                className="field w-full"
                value={selectedAssignmentId}
                onChange={(e) => {
                  setSelectedAssignmentId(e.target.value);
                  setSelectionErrors((prev) => ({ ...prev, classSubjectId: "" }));
                  setScoresLoaded(false);
                  setScoreRows([]);
                }}
              >
                <option value="">Select a subject…</option>
                {assignments.map((a) => (
                  <option key={a._id} value={a._id}>
                    {getAssignmentLabel(a)}
                  </option>
                ))}
              </select>
            )}
            <InlineError message={selectionErrors.classSubjectId} />
          </div>

          <div>
            <label
              htmlFor="term-select"
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            >
              Term
            </label>
            {loadingMeta ? (
              <div className="animate-pulse h-11 rounded-[14px] bg-[rgba(83,97,87,.08)]" />
            ) : (
              <select
                id="term-select"
                className="field w-full"
                value={selectedTermId}
                onChange={(e) => {
                  setSelectedTermId(e.target.value);
                  setSelectionErrors((prev) => ({ ...prev, termId: "" }));
                  setScoresLoaded(false);
                  setScoreRows([]);
                }}
              >
                <option value="">Select a term…</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
            <InlineError message={selectionErrors.termId} />
          </div>

          <div className="flex items-end">
            <Button
              icon={FiEdit}
              onClick={loadScores}
              disabled={loadingScores || loadingMeta}
            >
              {loadingScores ? "Loading…" : "Load scores"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {scoresLoaded && stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: "Students", value: stats.totalStudents },
            { label: "Highest", value: stats.highestScore },
            { label: "Lowest", value: stats.lowestScore },
            { label: "Average", value: stats.averageScore },
            { label: "Pass rate", value: `${stats.passRate}%` },
          ].map((item) => (
            <div
              key={item.label}
              className="surface rounded-2xl p-4 text-center"
            >
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--ink-soft)]">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--ink)]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Score table */}
      {scoresLoaded && (
        <div className="surface rounded-[28px] p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black">Student scores</h2>
              <p className="mt-0.5 text-sm text-[var(--ink-soft)]">
                Test 1 and Test 2: max 20 each. Exam: max 60. Total: max 100.
              </p>
            </div>
            <Button
              icon={bulkSaving ? FiRefreshCw : FiSave}
              onClick={saveAllScores}
              disabled={bulkSaving || scoreRows.length === 0}
            >
              {bulkSaving ? "Saving all…" : "Save all scores"}
            </Button>
          </div>

          {scoreRows.length === 0 ? (
            <EmptyState
              icon={FiUsers}
              message="No students found in this class. Add students first."
            />
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[700px] border-separate border-spacing-y-2 text-left">
                <thead className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2 text-center">Test 1 (20)</th>
                    <th className="px-4 py-2 text-center">Test 2 (20)</th>
                    <th className="px-4 py-2 text-center">Exam (60)</th>
                    <th className="px-4 py-2 text-center">Total</th>
                    <th className="px-4 py-2 text-center">Grade</th>
                    <th className="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {scoreRows.map((row) => {
                    const total = row.test1 + row.test2 + row.exam;
                    const isSaving = savingRows.has(row.studentId);
                    const isSaved = savedRows.has(row.studentId);

                    return (
                      <tr
                        key={row.studentId}
                        className="bg-[rgba(255,253,247,.68)]"
                      >
                        <td className="rounded-l-2xl px-4 py-3">
                          <p className="font-black">{row.studentName}</p>
                          <p className="text-xs text-[var(--ink-soft)]">
                            {row.studentCode}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            className="field w-20 text-center"
                            value={row.test1}
                            onChange={(e) =>
                              updateScore(row.studentId, "test1", e.target.value)
                            }
                          />
                          <InlineError message={scoreErrors[row.studentId]?.test1} />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={20}
                            className="field w-20 text-center"
                            value={row.test2}
                            onChange={(e) =>
                              updateScore(row.studentId, "test2", e.target.value)
                            }
                          />
                          <InlineError message={scoreErrors[row.studentId]?.test2} />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            min={0}
                            max={60}
                            className="field w-20 text-center"
                            value={row.exam}
                            onChange={(e) =>
                              updateScore(row.studentId, "exam", e.target.value)
                            }
                          />
                          <InlineError message={scoreErrors[row.studentId]?.exam} />
                        </td>
                        <td className="px-4 py-3 text-center font-black">
                          {total}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              total >= 70
                                ? "bg-[rgba(49,92,67,.12)] text-[var(--moss)]"
                                : total >= 60
                                  ? "bg-[rgba(130,180,100,.15)] text-[rgba(80,130,60,1)]"
                                  : total >= 50
                                    ? "bg-[rgba(83,97,87,.1)] text-[var(--ink)]"
                                    : total >= 40
                                      ? "bg-[rgba(216,162,58,.15)] text-[var(--ochre)]"
                                      : "bg-[rgba(182,69,69,.1)] text-[var(--danger)]"
                            }`}
                          >
                            {computeGrade(total)}
                          </span>
                        </td>
                        <td className="rounded-r-2xl px-4 py-3 text-right">
                          {isSaved ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--moss)]">
                              <FiCheckCircle /> Saved
                            </span>
                          ) : (
                            <Button
                              variant="secondary"
                              icon={isSaving ? FiRefreshCw : FiSave}
                              onClick={() => saveScore(row)}
                              disabled={isSaving}
                            >
                              {isSaving ? "Saving…" : "Save"}
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Empty state before loading */}
      {!scoresLoaded && !loadingScores && (
        <div className="surface rounded-[28px] p-10 text-center">
          <FiEdit className="mx-auto text-4xl text-[var(--ink-soft)] opacity-30" />
          <p className="mt-3 text-sm text-[var(--ink-soft)]">
            Select a subject assignment and term above, then click &quot;Load scores&quot; to begin.
          </p>
        </div>
      )}
    </div>
  );
}
