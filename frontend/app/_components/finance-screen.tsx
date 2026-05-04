"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiCheckCircle, FiCreditCard, FiDollarSign } from "react-icons/fi";
import { api } from "@/lib/api";
import { validateFeeStatusForm } from "@/lib/admin-forms";
import { AcademicTerm, FeeStats, StudentOption } from "@/types/gradeflow";
import { Button, InlineError, SectionHeader, StatCard } from "./ui";

export function FinanceScreen() {
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [currentTermId, setCurrentTermId] = useState<string | null>(null);
  const [stats, setStats] = useState<FeeStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Student search
  const [studentQuery, setStudentQuery] = useState("");
  const [studentSuggestions, setStudentSuggestions] = useState<StudentOption[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentOption | null>(null);

  // Term dropdown
  const [selectedTermId, setSelectedTermId] = useState("");

  // Form errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Debounce ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    api<AcademicTerm[]>("/academic/terms")
      .then((termsData) => {
        setTerms(termsData);
        const currentTerm = termsData.find((t) => t.isCurrent);
        if (currentTerm) {
          setCurrentTermId(currentTerm._id);
          setSelectedTermId(currentTerm._id);
          return api<FeeStats>(`/finance/stats/${currentTerm._id}`);
        }
        setStatsLoading(false);
        return null;
      })
      .then((statsData) => {
        if (statsData) {
          setStats(statsData);
          setStatsLoading(false);
        }
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load finance data");
        setStatsLoading(false);
      });
  }, []);

  // Debounced student search
  useEffect(() => {
    if (!studentQuery.trim() || selectedStudent) {
      setStudentSuggestions([]);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api<{ students: Array<{ _id: string; studentId: string; user?: { firstName?: string; lastName?: string } }> }>(
        `/students?search=${encodeURIComponent(studentQuery)}`,
      )
        .then((data) => {
          setStudentSuggestions(
            data.students.map((s) => ({
              _id: s._id,
              studentId: s.studentId,
              displayName: `${s.user?.firstName || ""} ${s.user?.lastName || ""} (${s.studentId})`.trim(),
            })),
          );
        })
        .catch(() => {
          setStudentSuggestions([]);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [studentQuery, selectedStudent]);

  const currentTerm = terms.find((t) => t._id === currentTermId);

  async function setFee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);

    const errors = validateFeeStatusForm({
      studentId: selectedStudent?._id,
      termId: selectedTermId,
      amountExpected: form.get("amountExpected") as string,
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await api("/finance/fee-status", {
        method: "POST",
        body: JSON.stringify({
          studentId: selectedStudent!._id,
          termId: selectedTermId,
          amountExpected: Number(form.get("amountExpected")),
          amountPaid: Number(form.get("amountPaid") || 0),
          notes: form.get("notes"),
        }),
      });
      toast.success("Fee status updated");
      // Reset form
      setSelectedStudent(null);
      setStudentQuery("");
      setSelectedTermId(currentTermId ?? "");
      setFormErrors({});
      (event.target as HTMLFormElement).reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update fee");
    }
  }

  const collectedPct =
    stats && stats.totalExpected > 0
      ? `${Math.round((stats.totalCollected / stats.totalExpected) * 100)}%`
      : "—";

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Bursary"
        title="Fees decide result visibility."
        copy="Record manual payments, initialize Paystack payments, and keep result access honest."
      />

      {/* Stats section */}
      {!statsLoading && !currentTermId ? (
        <div
          role="alert"
          className="rounded-2xl border border-[rgba(182,69,69,.2)] bg-[rgba(182,69,69,.06)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          No current term is set. Go to Academics → Sessions to set one.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {statsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse bg-[rgba(83,97,87,.08)] rounded-[var(--radius)] h-[120px]"
              />
            ))
          ) : (
            <>
              <StatCard
                icon={FiDollarSign}
                label="Expected"
                value={stats ? `₦${(stats.totalExpected / 1000000).toFixed(1)}m` : "—"}
                delta={currentTerm?.name ?? "No active term"}
              />
              <StatCard
                icon={FiCheckCircle}
                label="Collected"
                value={stats ? `₦${(stats.totalCollected / 1000000).toFixed(1)}m` : "—"}
                delta={collectedPct}
              />
              <StatCard
                icon={FiCreditCard}
                label="Pending payments"
                value={stats ? stats.outstandingCount.toString() : "—"}
                delta="students with balance"
              />
            </>
          )}
        </div>
      )}

      <form onSubmit={setFee} className="surface rounded-[28px] p-5">
        <h2 className="text-2xl font-black">Manual fee status</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {/* Student search */}
          <div className="relative">
            <input
              className="field w-full"
              placeholder="Search student by name…"
              value={studentQuery}
              onChange={(e) => {
                setStudentQuery(e.target.value);
                setSelectedStudent(null);
                setFormErrors((prev) => ({ ...prev, studentId: "" }));
              }}
            />
            {studentSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-2xl border border-[rgba(83,97,87,.18)] bg-[var(--paper)] shadow-lg">
                {studentSuggestions.map((s) => (
                  <li key={s._id}>
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-[rgba(49,92,67,.06)]"
                      onClick={() => {
                        setSelectedStudent(s);
                        setStudentQuery(s.displayName);
                        setStudentSuggestions([]);
                      }}
                    >
                      {s.displayName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <InlineError message={formErrors.studentId} />
          </div>

          {/* Term dropdown */}
          <div>
            <select
              className="field"
              value={selectedTermId}
              onChange={(e) => {
                setSelectedTermId(e.target.value);
                setFormErrors((prev) => ({ ...prev, termId: "" }));
              }}
            >
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <InlineError message={formErrors.termId} />
          </div>

          <input
            className="field"
            name="amountExpected"
            type="number"
            placeholder="Expected"
            required
          />
          <input className="field" name="amountPaid" type="number" placeholder="Paid" />
          <input className="field" name="notes" placeholder="Notes" />
        </div>
        <InlineError message={formErrors.amountExpected} />
        <Button className="mt-5" icon={FiCheckCircle}>Update status</Button>
      </form>
    </div>
  );
}
