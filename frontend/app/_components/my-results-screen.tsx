"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiDownload, FiFileText, FiAlertTriangle, FiInfo, FiBook } from "react-icons/fi";
import { api, downloadFile, tokenStore, userStore, ApiError } from "@/lib/api";
import type { AcademicTerm, ResultSummaryFull } from "@/types/gradeflow";
import { Button, SectionHeader, EmptyState, InlineError } from "./ui";

export function MyResultsScreen() {
  const router = useRouter();

  // Reference data
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [selectedTermId, setSelectedTermId] = useState<string>("");

  // Result data
  const [result, setResult] = useState<ResultSummaryFull | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feeGated, setFeeGated] = useState(false);
  const [notReleased, setNotReleased] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Student ID from auth store
  const [studentId, setStudentId] = useState<string>("");

  // Load terms on mount
  useEffect(() => {
    const user = userStore.get();
    if (!user) {
      router.push("/login");
      return;
    }
    setStudentId(user.id);

    api<AcademicTerm[]>("/academic/terms")
      .then((data) => {
        const termList = Array.isArray(data) ? data : [];
        setTerms(termList);
        // Pre-select the current term if available
        const current = termList.find((t) => t.isCurrent);
        if (current) {
          setSelectedTermId(current._id);
        } else if (termList.length > 0) {
          setSelectedTermId(termList[0]._id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          tokenStore.clear();
          router.push("/login");
          return;
        }
        setError("Unable to load results. Please check your connection and try again.");
        setLoading(false);
      });
  }, [router]);

  // Fetch results whenever studentId or selectedTermId changes
  useEffect(() => {
    if (!studentId || !selectedTermId) return;

    setLoading(true);
    setError(null);
    setFeeGated(false);
    setNotReleased(false);
    setResult(null);

    api<ResultSummaryFull>(`/results/student/${studentId}?termId=${selectedTermId}`)
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        if (err instanceof ApiError) {
          if (err.status === 401) {
            tokenStore.clear();
            router.push("/login");
            return;
          }
          if (err.status === 402 || err.message.toLowerCase().includes("fee")) {
            setFeeGated(true);
            return;
          }
          const msg = err.message.toLowerCase();
          if (msg.includes("not released") || msg.includes("release")) {
            setNotReleased(true);
            return;
          }
          setError(err.message);
        } else {
          setError("Unable to load results. Please check your connection and try again.");
        }
      });
  }, [studentId, selectedTermId, router]);

  async function handleDownloadPdf() {
    if (!studentId || !selectedTermId) return;

    const term = terms.find((t) => t._id === selectedTermId);
    const studentCode = result?.student.studentId ?? studentId;
    const termName = term?.name.replace(/\s+/g, "-").toLowerCase() ?? "term";
    const filename = `report-card-${studentCode}-${termName}.pdf`;

    setDownloadingPdf(true);
    try {
      await downloadFile(
        `/results/student/${studentId}/pdf?termId=${selectedTermId}`,
        filename,
      );
      toast.success("PDF download started");
    } catch {
      toast.error("Unable to download PDF. Please try again later.");
    } finally {
      setDownloadingPdf(false);
    }
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid gap-7">
        <SectionHeader eyebrow="Student" title="My Results" />
        <div className="surface rounded-[28px] p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 rounded-xl bg-[rgba(49,92,67,.1)]" />
            <div className="h-4 w-32 rounded-xl bg-[rgba(49,92,67,.07)]" />
            <div className="mt-6 h-48 rounded-2xl bg-[rgba(49,92,67,.07)]" />
          </div>
        </div>
      </div>
    );
  }

  // ── Network / generic error ────────────────────────────────────────────────
  if (error) {
    return (
      <div className="grid gap-7">
        <SectionHeader eyebrow="Student" title="My Results" />
        <div className="surface rounded-[28px] p-5">
          <TermDropdown
            terms={terms}
            selectedTermId={selectedTermId}
            onChange={setSelectedTermId}
          />
          <div className="mt-6">
            <InlineError message={error} />
          </div>
        </div>
      </div>
    );
  }

  // ── Fee gate ───────────────────────────────────────────────────────────────
  if (feeGated) {
    return (
      <div className="grid gap-7">
        <SectionHeader eyebrow="Student" title="My Results" />
        <div className="surface rounded-[28px] p-5">
          <TermDropdown
            terms={terms}
            selectedTermId={selectedTermId}
            onChange={setSelectedTermId}
          />
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[rgba(182,69,69,.08)] p-4">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-xl text-[var(--danger)]" />
            <div>
              <p className="font-semibold text-[var(--danger)]">Results Locked</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Your results are locked. Please pay your school fees to view your results.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Not released ───────────────────────────────────────────────────────────
  if (notReleased) {
    return (
      <div className="grid gap-7">
        <SectionHeader eyebrow="Student" title="My Results" />
        <div className="surface rounded-[28px] p-5">
          <TermDropdown
            terms={terms}
            selectedTermId={selectedTermId}
            onChange={setSelectedTermId}
          />
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[rgba(49,92,67,.07)] p-4">
            <FiInfo className="mt-0.5 shrink-0 text-xl text-[var(--moss)]" />
            <div>
              <p className="font-semibold text-[var(--ink)]">Results Not Yet Released</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                Results for this term have not been released yet.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Success ────────────────────────────────────────────────────────────────
  return (
    <div className="grid gap-7">
      <SectionHeader eyebrow="Student" title="My Results" />

      {/* Term selector + download */}
      <div className="surface rounded-[28px] p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[200px] flex-1">
            <TermDropdown
              terms={terms}
              selectedTermId={selectedTermId}
              onChange={setSelectedTermId}
            />
          </div>
          {result && (
            <Button
              icon={FiDownload}
              variant="secondary"
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
            >
              {downloadingPdf ? "Downloading…" : "Download PDF"}
            </Button>
          )}
        </div>

        {/* Student / term header */}
        {result && (
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 border-t border-[rgba(83,97,87,.12)] pt-5">
            <HeaderItem label="Student" value={result.student.name} />
            <HeaderItem label="Student ID" value={result.student.studentId} />
            <HeaderItem label="Class" value={result.class.name} />
            <HeaderItem label="Term" value={result.term.name} />
          </div>
        )}
      </div>

      {/* Summary stat cards */}
      {result && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <MiniStatCard label="Total Subjects" value={String(result.summary.totalSubjects)} />
          <MiniStatCard label="Total Score" value={String(result.summary.totalScore)} />
          <MiniStatCard
            label="Average"
            value={`${result.summary.averageScore.toFixed(1)}%`}
          />
          <MiniStatCard
            label="Position"
            value={result.summary.position != null ? `${result.summary.position}` : "—"}
          />
          <MiniStatCard
            label="Class Size"
            value={result.summary.classSize != null ? `${result.summary.classSize}` : "—"}
          />
        </div>
      )}

      {/* Results table */}
      {result && result.subjects.length === 0 ? (
        <div className="surface rounded-[28px] p-5">
          <EmptyState icon={FiBook} message="No subjects found for this term." />
        </div>
      ) : result ? (
        <div className="surface rounded-[28px] p-5">
          <h2 className="mb-4 text-xl font-black text-[var(--ink)]">Subject Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[rgba(83,97,87,.12)] text-left text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                  <th className="pb-3 pr-4">Subject</th>
                  <th className="pb-3 pr-4 text-center">Test 1</th>
                  <th className="pb-3 pr-4 text-center">Test 2</th>
                  <th className="pb-3 pr-4 text-center">Exam</th>
                  <th className="pb-3 pr-4 text-center">Total</th>
                  <th className="pb-3 pr-4 text-center">Grade</th>
                  <th className="pb-3 text-center">Remark</th>
                </tr>
              </thead>
              <tbody>
                {result.subjects.map((subject, idx) => (
                  <tr
                    key={subject.code}
                    className={
                      idx % 2 === 0
                        ? "border-b border-[rgba(83,97,87,.07)]"
                        : "border-b border-[rgba(83,97,87,.07)] bg-[rgba(49,92,67,.02)]"
                    }
                  >
                    <td className="py-3 pr-4 font-medium text-[var(--ink)]">
                      <div>{subject.name}</div>
                      <div className="text-xs text-[var(--ink-soft)]">{subject.code}</div>
                    </td>
                    <td className="py-3 pr-4 text-center text-[var(--ink-soft)]">
                      {subject.test1}
                    </td>
                    <td className="py-3 pr-4 text-center text-[var(--ink-soft)]">
                      {subject.test2}
                    </td>
                    <td className="py-3 pr-4 text-center text-[var(--ink-soft)]">
                      {subject.exam}
                    </td>
                    <td className="py-3 pr-4 text-center font-semibold text-[var(--ink)]">
                      {subject.total}
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <GradeBadge grade={subject.grade} />
                    </td>
                    <td className="py-3 text-center text-[var(--ink-soft)]">
                      {subject.remark}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TermDropdown({
  terms,
  selectedTermId,
  onChange,
}: {
  terms: AcademicTerm[];
  selectedTermId: string;
  onChange: (id: string) => void;
}) {
  const disabled = terms.length <= 1;
  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
        Term
      </label>
      <select
        className="field"
        value={selectedTermId}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {terms.length === 0 ? (
          <option value="">No terms available</option>
        ) : (
          terms.map((t) => (
            <option key={t._id} value={t._id}>
              {t.name}
            </option>
          ))
        )}
      </select>
    </div>
  );
}

function HeaderItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">{label}</p>
      <p className="mt-0.5 font-semibold text-[var(--ink)]">{value}</p>
    </div>
  );
}

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
          ? "inline-flex items-center rounded-full bg-[rgba(49,92,67,.1)] px-2.5 py-0.5 text-xs font-bold text-[var(--moss)]"
          : "inline-flex items-center rounded-full bg-[rgba(182,69,69,.1)] px-2.5 py-0.5 text-xs font-bold text-[var(--danger)]"
      }
    >
      {grade}
    </span>
  );
}
