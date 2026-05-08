"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiEdit2,
  FiRefreshCw,
  FiSend,
  FiUser,
  FiUsers,
} from "react-icons/fi";
import { api, ApiError, tokenStore } from "@/lib/api";
import { validateStudentForm, validateTransferForm } from "@/lib/admin-forms";
import type {
  FeeStatusEntry,
  FeeStatusResponse,
  ResultSummaryFull,
  SchoolClass,
  StudentDetail,
} from "@/types/gradeflow";
import { Button, EmptyState, InlineError } from "./ui";

// ---------------------------------------------------------------------------
// EditStudentModal — pre-filled edit modal calling PATCH /students/:id
// ---------------------------------------------------------------------------

interface EditStudentModalProps {
  student: StudentDetail;
  onClose: () => void;
  onSaved: (updated: StudentDetail) => void;
}

function EditStudentModal({ student, onClose, onSaved }: EditStudentModalProps) {
  const [firstName, setFirstName] = useState(student.user?.firstName ?? "");
  const [lastName, setLastName] = useState(student.user?.lastName ?? "");
  const [email, setEmail] = useState(student.user?.email ?? "");
  const [gender, setGender] = useState(student.gender ?? "");
  const [classId, setClassId] = useState(student.class?._id ?? "");
  const [guardianName, setGuardianName] = useState(student.parentName ?? "");
  const [guardianPhone, setGuardianPhone] = useState(student.parentPhone ?? "");
  const [guardianEmail, setGuardianEmail] = useState(student.parentEmail ?? "");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    api<SchoolClass[]>("/classes")
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, []);

  function clearFieldError(field: string) {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateStudentForm({
      firstName,
      lastName,
      gender,
      classId,
      guardianName,
      guardianPhone,
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<StudentDetail>(`/students/${student._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          gender,
          classId,
          guardianName,
          guardianPhone,
          guardianEmail,
        }),
      });
      toast.success("Student updated");
      onSaved(updated);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update student.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={onClose}
    >
      <div
        className="surface w-full max-w-lg rounded-[28px] p-6 mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black text-ink">Edit student</h2>
        <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-firstName" className="mb-1.5 block text-sm font-semibold text-ink">
                First Name <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                id="edit-firstName"
                type="text"
                className="field w-full"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                aria-describedby={formErrors.firstName ? "edit-firstName-error" : undefined}
                aria-invalid={!!formErrors.firstName}
                disabled={submitting}
              />
              <InlineError id="edit-firstName-error" message={formErrors.firstName} />
            </div>
            <div>
              <label htmlFor="edit-lastName" className="mb-1.5 block text-sm font-semibold text-ink">
                Last Name <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                id="edit-lastName"
                type="text"
                className="field w-full"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
                aria-describedby={formErrors.lastName ? "edit-lastName-error" : undefined}
                aria-invalid={!!formErrors.lastName}
                disabled={submitting}
              />
              <InlineError id="edit-lastName-error" message={formErrors.lastName} />
            </div>
          </div>

          <div>
            <label htmlFor="edit-email" className="mb-1.5 block text-sm font-semibold text-ink">
              Email <span className="text-xs font-normal text-ink-soft">(optional)</span>
            </label>
            <input
              id="edit-email"
              type="email"
              className="field w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-gender" className="mb-1.5 block text-sm font-semibold text-ink">
                Gender <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <select
                id="edit-gender"
                className="field w-full"
                value={gender}
                onChange={(e) => { setGender(e.target.value); clearFieldError("gender"); }}
                aria-describedby={formErrors.gender ? "edit-gender-error" : undefined}
                aria-invalid={!!formErrors.gender}
                disabled={submitting}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <InlineError id="edit-gender-error" message={formErrors.gender} />
            </div>
            <div>
              <label htmlFor="edit-classId" className="mb-1.5 block text-sm font-semibold text-ink">
                Class <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <select
                id="edit-classId"
                className="field w-full"
                value={classId}
                onChange={(e) => { setClassId(e.target.value); clearFieldError("classId"); }}
                aria-describedby={formErrors.classId ? "edit-classId-error" : undefined}
                aria-invalid={!!formErrors.classId}
                disabled={submitting}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <InlineError id="edit-classId-error" message={formErrors.classId} />
            </div>
          </div>

          <div>
            <label htmlFor="edit-guardianName" className="mb-1.5 block text-sm font-semibold text-ink">
              Guardian Name <span aria-hidden="true" className="text-danger">*</span>
            </label>
            <input
              id="edit-guardianName"
              type="text"
              className="field w-full"
              value={guardianName}
              onChange={(e) => { setGuardianName(e.target.value); clearFieldError("guardianName"); }}
              aria-describedby={formErrors.guardianName ? "edit-guardianName-error" : undefined}
              aria-invalid={!!formErrors.guardianName}
              disabled={submitting}
            />
            <InlineError id="edit-guardianName-error" message={formErrors.guardianName} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="edit-guardianPhone" className="mb-1.5 block text-sm font-semibold text-ink">
                Guardian Phone <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                id="edit-guardianPhone"
                type="tel"
                className="field w-full"
                value={guardianPhone}
                onChange={(e) => { setGuardianPhone(e.target.value); clearFieldError("guardianPhone"); }}
                aria-describedby={formErrors.guardianPhone ? "edit-guardianPhone-error" : undefined}
                aria-invalid={!!formErrors.guardianPhone}
                disabled={submitting}
              />
              <InlineError id="edit-guardianPhone-error" message={formErrors.guardianPhone} />
            </div>
            <div>
              <label htmlFor="edit-guardianEmail" className="mb-1.5 block text-sm font-semibold text-ink">
                Guardian Email <span className="text-xs font-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="edit-guardianEmail"
                type="email"
                className="field w-full"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" icon={FiEdit2} disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransferModal — class selection dropdown, calls POST /students/:id/transfer
// ---------------------------------------------------------------------------

interface TransferModalProps {
  studentId: string;
  studentName: string;
  currentClassName: string;
  onClose: () => void;
  onTransferred: (newClassName: string) => void;
}

function TransferModal({
  studentId,
  studentName,
  currentClassName,
  onClose,
  onTransferred,
}: TransferModalProps) {
  const [transferClassId, setTransferClassId] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  useEffect(() => {
    api<SchoolClass[]>("/classes")
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => undefined);
  }, []);

  async function handleConfirm() {
    const errors = validateTransferForm({ classId: transferClassId });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      await api(`/students/${studentId}/transfer`, {
        method: "POST",
        body: JSON.stringify({ classId: transferClassId }),
      });
      const selectedClass = classes.find((c) => c.id === transferClassId);
      toast.success("Student transferred");
      onTransferred(selectedClass?.name ?? "Unassigned");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not transfer student.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={onClose}
    >
      <div
        className="surface w-full max-w-lg rounded-[28px] p-6 mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-black text-ink">Transfer {studentName}</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Current class: <span className="font-semibold">{currentClassName}</span>
        </p>

        <div className="mt-5">
          <label htmlFor="detail-transfer-classId" className="mb-1.5 block text-sm font-semibold text-ink">
            New Class <span aria-hidden="true" className="text-danger">*</span>
          </label>
          <select
            id="detail-transfer-classId"
            className="field w-full"
            value={transferClassId}
            onChange={(e) => {
              setTransferClassId(e.target.value);
              setFormErrors({});
            }}
            aria-describedby={formErrors.classId ? "detail-transfer-classId-error" : undefined}
            aria-invalid={!!formErrors.classId}
            disabled={submitting}
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <InlineError id="detail-transfer-classId-error" message={formErrors.classId} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Transferring…" : "Confirm Transfer"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper utilities
// ---------------------------------------------------------------------------

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);
}

function FeeStatusBadge({ status }: { status: FeeStatusEntry["status"] }) {
  const styles: Record<FeeStatusEntry["status"], string> = {
    paid: "bg-green-100 text-green-800",
    partial: "bg-yellow-100 text-yellow-800",
    unpaid: "bg-red-100 text-red-800",
  };
  const labels: Record<FeeStatusEntry["status"], string> = {
    paid: "Paid",
    partial: "Partial",
    unpaid: "Unpaid",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-2 border-b border-[rgba(83,97,87,.08)] last:border-0">
      <span className="text-sm text-ink-soft">{label}</span>
      <span className="text-sm font-semibold text-ink">{value || "—"}</span>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="grid gap-3 animate-pulse" aria-busy="true" aria-label="Loading">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-8 rounded-xl bg-[rgba(83,97,87,.08)]" />
      ))}
    </div>
  );
}

function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <FiAlertCircle className="text-2xl text-danger" />
      <p className="text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" icon={FiRefreshCw} onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StudentDetailScreen — main component (Tasks 10.2, 10.3, 10.4)
// ---------------------------------------------------------------------------

interface StudentDetailScreenProps {
  id: string;
}

export function StudentDetailScreen({ id }: StudentDetailScreenProps) {
  const router = useRouter();

  // --- Student state (independent) ---
  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);

  // --- Fee status state (independent) ---
  const [feeStatus, setFeeStatus] = useState<FeeStatusResponse | null>(null);
  const [feeLoading, setFeeLoading] = useState(true);
  const [feeError, setFeeError] = useState<string | null>(null);

  // --- Results state (independent) ---
  const [result, setResult] = useState<ResultSummaryFull | null>(null);
  const [resultLoading, setResultLoading] = useState(true);
  const [resultError, setResultError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);

  // --- Modal state ---
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Fetch helpers — each section is independent
  // ---------------------------------------------------------------------------

  const fetchStudent = useCallback(async () => {
    setStudentLoading(true);
    setStudentError(null);
    try {
      const data = await api<StudentDetail>(`/students/${id}`);
      setStudent(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStore.clear();
        router.push("/login");
        return;
      }
      setStudentError("Unable to load student details");
    } finally {
      setStudentLoading(false);
    }
  }, [id, router]);

  const fetchFeeStatus = useCallback(async () => {
    setFeeLoading(true);
    setFeeError(null);
    try {
      const data = await api<FeeStatusResponse>(`/finance/fee-status?studentId=${id}`);
      setFeeStatus(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStore.clear();
        router.push("/login");
        return;
      }
      setFeeError("Unable to load fee status");
    } finally {
      setFeeLoading(false);
    }
  }, [id, router]);

  const fetchResults = useCallback(async () => {
    setResultLoading(true);
    setResultError(null);
    setNoResults(false);
    try {
      const data = await api<ResultSummaryFull>(`/results/student/${id}`);
      if (!data || !data.subjects || data.subjects.length === 0) {
        setNoResults(true);
      } else {
        setResult(data);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        tokenStore.clear();
        router.push("/login");
        return;
      }
      // 404 or no results released yet
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        setNoResults(true);
      } else {
        setResultError("Unable to load results summary");
      }
    } finally {
      setResultLoading(false);
    }
  }, [id, router]);

  // Fire all three fetches in parallel on mount
  useEffect(() => {
    fetchStudent();
    fetchFeeStatus();
    fetchResults();
  }, [fetchStudent, fetchFeeStatus, fetchResults]);

  // ---------------------------------------------------------------------------
  // Derived values
  // ---------------------------------------------------------------------------

  const studentName = student
    ? `${student.user?.firstName ?? ""} ${student.user?.lastName ?? ""}`.trim() || student.studentId
    : "Student";

  const currentClassName = student?.class?.name ?? "Unassigned";

  // ---------------------------------------------------------------------------
  // Full-page error state (only when student itself fails to load)
  // ---------------------------------------------------------------------------

  if (!studentLoading && studentError) {
    return (
      <div className="grid gap-7">
        <div className="flex items-center gap-3">
          <Button variant="ghost" icon={FiArrowLeft} onClick={() => router.push("/students")}>
            Back
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <FiAlertCircle className="text-4xl text-danger" />
          <p className="text-sm text-ink-soft">{studentError}</p>
          <Button variant="secondary" icon={FiRefreshCw} onClick={fetchStudent}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="grid gap-6">
      {/* Back button */}
      <div>
        <Button variant="ghost" icon={FiArrowLeft} onClick={() => router.push("/students")}>
          Back to Students
        </Button>
      </div>

      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          {studentLoading ? (
            <div className="h-9 w-48 animate-pulse rounded-xl bg-[rgba(83,97,87,.08)]" />
          ) : (
            <>
              <h1 className="text-3xl font-black text-ink">{studentName}</h1>
              {student?.studentId && (
                <span className="inline-flex items-center rounded-full border border-[rgba(49,92,67,.18)] bg-[rgba(255,253,247,.62)] px-3 py-1 text-xs font-bold text-[var(--moss)]">
                  {student.studentId}
                </span>
              )}
            </>
          )}
        </div>
        {!studentLoading && student && (
          <div className="flex gap-2">
            <Button variant="secondary" icon={FiEdit2} onClick={() => setEditOpen(true)}>
              Edit
            </Button>
            <Button variant="ghost" icon={FiSend} onClick={() => setTransferOpen(true)}>
              Transfer
            </Button>
          </div>
        )}
      </div>

      {/* Two-column grid: left (personal + guardian) | right (class/status + results) */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---- LEFT COLUMN ---- */}
        <div className="grid gap-5 content-start">
          {/* Personal info card */}
          <div className="surface rounded-[28px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiUser className="text-[var(--moss)]" />
              <h2 className="font-bold text-ink">Personal Information</h2>
            </div>
            {studentLoading ? (
              <SectionSkeleton />
            ) : student ? (
              <div>
                <InfoRow label="Full Name" value={studentName} />
                <InfoRow label="Student ID" value={student.studentId} />
                <InfoRow label="Email" value={student.user?.email} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Date of Birth" value={formatDate(student.dateOfBirth)} />
                <InfoRow label="Address" value={student.address} />
              </div>
            ) : null}
          </div>

          {/* Guardian info card */}
          <div className="surface rounded-[28px] p-5">
            <div className="flex items-center gap-2 mb-4">
              <FiUsers className="text-[var(--moss)]" />
              <h2 className="font-bold text-ink">Guardian Information</h2>
            </div>
            {studentLoading ? (
              <SectionSkeleton />
            ) : student ? (
              <div>
                <InfoRow label="Guardian Name" value={student.parentName} />
                <InfoRow label="Phone" value={student.parentPhone} />
                <InfoRow label="Email" value={student.parentEmail} />
              </div>
            ) : null}
          </div>
        </div>

        {/* ---- RIGHT COLUMN ---- */}
        <div className="grid gap-5 content-start">
          {/* Class + enrollment status card */}
          <div className="surface rounded-[28px] p-5">
            <h2 className="font-bold text-ink mb-4">Enrollment</h2>
            {studentLoading ? (
              <SectionSkeleton />
            ) : student ? (
              <div>
                <InfoRow label="Current Class" value={currentClassName} />
                <InfoRow
                  label="Status"
                  value={student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : undefined}
                />
                <InfoRow label="Account Status" value={student.user?.status} />
              </div>
            ) : null}
          </div>

          {/* Results summary card */}
          <div className="surface rounded-[28px] p-5">
            <h2 className="font-bold text-ink mb-4">Latest Results</h2>
            {resultLoading ? (
              <SectionSkeleton />
            ) : resultError ? (
              <SectionError message={resultError} onRetry={fetchResults} />
            ) : noResults || !result ? (
              <EmptyState icon={FiUser} message="No results available yet" />
            ) : (
              <div>
                {result.term?.name && (
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--clay)] mb-3">
                    {result.term.name}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-2xl bg-[rgba(49,92,67,.06)] p-3 text-center">
                    <p className="text-2xl font-black text-ink">
                      {result.summary.averageScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-ink-soft mt-1">Average</p>
                  </div>
                  <div className="rounded-2xl bg-[rgba(49,92,67,.06)] p-3 text-center">
                    <p className="text-2xl font-black text-ink">
                      {result.summary.position ?? "—"}
                    </p>
                    <p className="text-xs text-ink-soft mt-1">Position</p>
                  </div>
                  <div className="rounded-2xl bg-[rgba(49,92,67,.06)] p-3 text-center">
                    <p className="text-2xl font-black text-ink">
                      {result.summary.totalSubjects}
                    </p>
                    <p className="text-xs text-ink-soft mt-1">Subjects</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full-width: Fee status table */}
      <div className="surface rounded-[28px] p-5">
        <h2 className="font-bold text-ink mb-4">Fee Status</h2>
        {feeLoading ? (
          <SectionSkeleton />
        ) : feeError ? (
          <SectionError message={feeError} onRetry={fetchFeeStatus} />
        ) : !feeStatus || feeStatus.feeStatuses.length === 0 ? (
          <EmptyState icon={FiUser} message="No fee records found." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-separate border-spacing-y-2 text-left">
              <thead className="text-xs uppercase tracking-[0.16em] text-ink-soft">
                <tr>
                  <th className="px-4 py-2">Term</th>
                  <th className="px-4 py-2 text-right">Expected</th>
                  <th className="px-4 py-2 text-right">Paid</th>
                  <th className="px-4 py-2 text-right">Balance</th>
                  <th className="px-4 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {feeStatus.feeStatuses.map((entry) => (
                  <tr key={entry.termId} className="bg-[rgba(255,253,247,.68)]">
                    <td className="rounded-l-2xl px-4 py-3 font-semibold text-ink">
                      {entry.termName}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {formatCurrency(entry.amountExpected)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-soft">
                      {formatCurrency(entry.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-ink">
                      {formatCurrency(entry.balance)}
                    </td>
                    <td className="rounded-r-2xl px-4 py-3 text-center">
                      <FeeStatusBadge status={entry.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {editOpen && student && (
        <EditStudentModal
          student={student}
          onClose={() => setEditOpen(false)}
          onSaved={(updated) => {
            setStudent(updated);
            setEditOpen(false);
          }}
        />
      )}
      {transferOpen && student && (
        <TransferModal
          studentId={student._id}
          studentName={studentName}
          currentClassName={currentClassName}
          onClose={() => setTransferOpen(false)}
          onTransferred={(newClassName) => {
            setStudent((prev) =>
              prev
                ? {
                    ...prev,
                    class: prev.class
                      ? { ...prev.class, name: newClassName }
                      : { _id: "", name: newClassName, level: 0 },
                  }
                : prev,
            );
          }}
        />
      )}
    </div>
  );
}
