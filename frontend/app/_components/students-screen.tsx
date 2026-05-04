"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiLink,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiSend,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { validateStudentForm, validateTransferForm } from "@/lib/admin-forms";
import type { SchoolClass } from "@/types/gradeflow";
import { Button, EmptyState, InlineError, SectionHeader } from "./ui";

// ---------------------------------------------------------------------------
// Row type
// ---------------------------------------------------------------------------

type StudentRow = {
  id: string;
  name: string;
  studentId: string;
  className: string;
  status: string;
  fee: string;
  average: number;
};

// ---------------------------------------------------------------------------
// AddStudentModal
// ---------------------------------------------------------------------------

interface AddStudentModalProps {
  onClose: () => void;
  onCreated: (student: StudentRow) => void;
}

function AddStudentModal({ onClose, onCreated }: AddStudentModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("");
  const [classId, setClassId] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
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
      const newStudent = await api<any>("/students", {
        method: "POST",
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

      const selectedClass = classes.find((c) => c.id === classId);
      const row: StudentRow = {
        id: newStudent._id ?? newStudent.id ?? "",
        name: `${firstName} ${lastName}`.trim(),
        studentId: newStudent.studentId ?? "",
        className: selectedClass?.name ?? "Unassigned",
        status: newStudent.status ?? "active",
        fee: "Check",
        average: 0,
      };

      toast.success("Student enrolled");
      onCreated(row);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not enroll student.");
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
        <h2 className="text-xl font-black text-[var(--ink)]">Add a student</h2>
        <form onSubmit={handleSubmit} noValidate className="mt-5 grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <label
                htmlFor="add-firstName"
                className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              >
                First Name <span aria-hidden="true" className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="add-firstName"
                type="text"
                className="field w-full"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                aria-describedby={formErrors.firstName ? "add-firstName-error" : undefined}
                aria-invalid={!!formErrors.firstName}
                disabled={submitting}
              />
              <InlineError id="add-firstName-error" message={formErrors.firstName} />
            </div>

            {/* Last Name */}
            <div>
              <label
                htmlFor="add-lastName"
                className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              >
                Last Name <span aria-hidden="true" className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="add-lastName"
                type="text"
                className="field w-full"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
                aria-describedby={formErrors.lastName ? "add-lastName-error" : undefined}
                aria-invalid={!!formErrors.lastName}
                disabled={submitting}
              />
              <InlineError id="add-lastName-error" message={formErrors.lastName} />
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="add-email"
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            >
              Email{" "}
              <span className="text-xs font-normal text-[var(--ink-soft)]">(optional)</span>
            </label>
            <input
              id="add-email"
              type="email"
              className="field w-full"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Gender */}
            <div>
              <label
                htmlFor="add-gender"
                className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              >
                Gender <span aria-hidden="true" className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="add-gender"
                className="field w-full"
                value={gender}
                onChange={(e) => { setGender(e.target.value); clearFieldError("gender"); }}
                aria-describedby={formErrors.gender ? "add-gender-error" : undefined}
                aria-invalid={!!formErrors.gender}
                disabled={submitting}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <InlineError id="add-gender-error" message={formErrors.gender} />
            </div>

            {/* Class */}
            <div>
              <label
                htmlFor="add-classId"
                className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              >
                Class <span aria-hidden="true" className="text-[var(--danger)]">*</span>
              </label>
              <select
                id="add-classId"
                className="field w-full"
                value={classId}
                onChange={(e) => { setClassId(e.target.value); clearFieldError("classId"); }}
                aria-describedby={formErrors.classId ? "add-classId-error" : undefined}
                aria-invalid={!!formErrors.classId}
                disabled={submitting}
              >
                <option value="">Select class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <InlineError id="add-classId-error" message={formErrors.classId} />
            </div>
          </div>

          {/* Guardian Name */}
          <div>
            <label
              htmlFor="add-guardianName"
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            >
              Guardian Name <span aria-hidden="true" className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="add-guardianName"
              type="text"
              className="field w-full"
              value={guardianName}
              onChange={(e) => { setGuardianName(e.target.value); clearFieldError("guardianName"); }}
              aria-describedby={formErrors.guardianName ? "add-guardianName-error" : undefined}
              aria-invalid={!!formErrors.guardianName}
              disabled={submitting}
            />
            <InlineError id="add-guardianName-error" message={formErrors.guardianName} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Guardian Phone */}
            <div>
              <label
                htmlFor="add-guardianPhone"
                className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              >
                Guardian Phone <span aria-hidden="true" className="text-[var(--danger)]">*</span>
              </label>
              <input
                id="add-guardianPhone"
                type="tel"
                className="field w-full"
                value={guardianPhone}
                onChange={(e) => { setGuardianPhone(e.target.value); clearFieldError("guardianPhone"); }}
                aria-describedby={formErrors.guardianPhone ? "add-guardianPhone-error" : undefined}
                aria-invalid={!!formErrors.guardianPhone}
                disabled={submitting}
              />
              <InlineError id="add-guardianPhone-error" message={formErrors.guardianPhone} />
            </div>

            {/* Guardian Email */}
            <div>
              <label
                htmlFor="add-guardianEmail"
                className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
              >
                Guardian Email{" "}
                <span className="text-xs font-normal text-[var(--ink-soft)]">(optional)</span>
              </label>
              <input
                id="add-guardianEmail"
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
            <Button type="submit" icon={FiUserPlus} disabled={submitting}>
              {submitting ? "Enrolling…" : "Enroll Student"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TransferModal
// ---------------------------------------------------------------------------

interface TransferModalProps {
  student: StudentRow;
  onClose: () => void;
  onTransferred: (studentId: string, newClassName: string) => void;
}

function TransferModal({ student, onClose, onTransferred }: TransferModalProps) {
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
      await api(`/students/${student.id}/transfer`, {
        method: "POST",
        body: JSON.stringify({ classId: transferClassId }),
      });

      const selectedClass = classes.find((c) => c.id === transferClassId);
      toast.success("Student transferred");
      onTransferred(student.id, selectedClass?.name ?? "Unassigned");
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
        <h2 className="text-xl font-black text-[var(--ink)]">Transfer {student.name}</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Current class: <span className="font-semibold">{student.className}</span>
        </p>

        <div className="mt-5">
          <label
            htmlFor="transfer-classId"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            New Class <span aria-hidden="true" className="text-[var(--danger)]">*</span>
          </label>
          <select
            id="transfer-classId"
            className="field w-full"
            value={transferClassId}
            onChange={(e) => {
              setTransferClassId(e.target.value);
              setFormErrors({});
            }}
            aria-describedby={formErrors.classId ? "transfer-classId-error" : undefined}
            aria-invalid={!!formErrors.classId}
            disabled={submitting}
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <InlineError id="transfer-classId-error" message={formErrors.classId} />
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
// StatusModal
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "graduated", label: "Graduated" },
  { value: "transferred", label: "Transferred" },
  { value: "expelled", label: "Expelled" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

interface StatusModalProps {
  student: StudentRow;
  onClose: () => void;
  onUpdated: (studentId: string, newStatus: string) => void;
}

function StatusModal({ student, onClose, onUpdated }: StatusModalProps) {
  const [newStatus, setNewStatus] = useState(student.status);
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await api(`/students/${student.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      toast.success("Student status updated");
      onUpdated(student.id, newStatus);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update status.");
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
        <h2 className="text-xl font-black text-[var(--ink)]">
          Update status for {student.name}
        </h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Current status: <span className="font-semibold capitalize">{student.status}</span>
        </p>

        <div className="mt-5">
          <label
            htmlFor="status-select"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            New Status
          </label>
          <select
            id="status-select"
            className="field w-full"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            disabled={submitting}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? "Updating…" : "Update Status"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// StudentsScreen
// ---------------------------------------------------------------------------

export function StudentsScreen() {
  const [query, setQuery] = useState("");
  const [liveRows, setLiveRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Modal state
  const [addOpen, setAddOpen] = useState(false);
  const [transferStudent, setTransferStudent] = useState<StudentRow | null>(null);
  const [statusStudent, setStatusStudent] = useState<StudentRow | null>(null);

  const rows = useMemo(
    () =>
      liveRows.filter((student) =>
        `${student.name} ${student.studentId} ${student.className}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [liveRows, query],
  );

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const payload = await api<{ students: any[] }>("/students");
      if (!Array.isArray(payload.students)) {
        setLiveRows([]);
        return;
      }
      setLiveRows(
        payload.students.map((item: any) => ({
          id: item._id,
          name: `${item.user?.firstName || ""} ${item.user?.lastName || ""}`.trim() || item.studentId,
          studentId: item.studentId,
          className: item.class?.name || "Unassigned",
          status: item.status,
          fee: "Check",
          average: 0,
        })),
      );
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "Could not load students.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  async function linkParent(id: string) {
    try {
      await api(`/students/${id}/parent-account`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      toast.success("Parent account linked");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not link parent");
    }
  }

  function handleStudentCreated(student: StudentRow) {
    setLiveRows((prev) => [student, ...prev]);
  }

  function handleTransferred(studentId: string, newClassName: string) {
    setLiveRows((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, className: newClassName } : s)),
    );
  }

  function handleStatusUpdated(studentId: string, newStatus: string) {
    setLiveRows((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status: newStatus } : s)),
    );
  }

  // Retry UI
  if (fetchError) {
    return (
      <div className="grid gap-7">
        <SectionHeader
          eyebrow="Student lifecycle"
          title="Enrollment without spreadsheet fog."
          copy="Create students, link parents, transfer classes, and keep status changes visible."
        />
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <FiAlertCircle className="text-3xl text-[var(--danger)]" />
          <p className="text-sm text-[var(--ink-soft)]">{fetchError}</p>
          <Button variant="secondary" icon={FiRefreshCw} onClick={fetchStudents}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <SectionHeader
          eyebrow="Student lifecycle"
          title="Enrollment without spreadsheet fog."
          copy="Create students, link parents, transfer classes, and keep status changes visible."
        />
        <div className="flex gap-2">
          <Button icon={FiUserPlus} onClick={() => setAddOpen(true)}>Add student</Button>
          <Button variant="secondary" icon={FiSend}>Bulk upload</Button>
        </div>
      </div>

      <div className="surface rounded-[28px] p-4">
        <div className="relative">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="field pl-11"
            placeholder="Search by name, student ID, or class"
          />
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="grid gap-2" aria-busy="true" aria-label="Loading students">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse h-16 rounded-2xl bg-[rgba(83,97,87,.08)]"
                />
              ))}
            </div>
          ) : liveRows.length === 0 ? (
            <EmptyState icon={FiUsers} message="No students enrolled yet." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-separate border-spacing-y-2 text-left">
                <thead className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
                  <tr>
                    <th className="px-4 py-2">Student</th>
                    <th className="px-4 py-2">Class</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Fee</th>
                    <th className="px-4 py-2">Average</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((student) => (
                    <tr key={student.id} className="bg-[rgba(255,253,247,.68)]">
                      <td className="rounded-l-2xl px-4 py-4">
                        <p className="font-black">{student.name}</p>
                        <p className="text-sm text-[var(--ink-soft)]">{student.studentId}</p>
                      </td>
                      <td className="px-4 py-4 font-bold">{student.className}</td>
                      <td className="px-4 py-4 capitalize">{student.status}</td>
                      <td className="px-4 py-4">{student.fee}</td>
                      <td className="px-4 py-4 font-black">{student.average}%</td>
                      <td className="rounded-r-2xl px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="secondary"
                            icon={FiLink}
                            onClick={() => linkParent(student.id)}
                          >
                            Parent
                          </Button>
                          <Button
                            variant="ghost"
                            icon={FiPlus}
                            onClick={() => setTransferStudent(student)}
                          >
                            Transfer
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setStatusStudent(student)}
                          >
                            Status
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {addOpen && (
        <AddStudentModal
          onClose={() => setAddOpen(false)}
          onCreated={handleStudentCreated}
        />
      )}
      {transferStudent && (
        <TransferModal
          student={transferStudent}
          onClose={() => setTransferStudent(null)}
          onTransferred={handleTransferred}
        />
      )}
      {statusStudent && (
        <StatusModal
          student={statusStudent}
          onClose={() => setStatusStudent(null)}
          onUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
}
