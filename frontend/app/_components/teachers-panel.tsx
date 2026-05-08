"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiEdit, FiRefreshCw, FiUserCheck, FiUsers, FiUserX } from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { mapApiErrorToFieldError, validateTeacherForm } from "@/lib/admin-forms";
import type { Teacher } from "@/types/gradeflow";
import { Button, EmptyState, InlineError, Pagination } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Teacher["status"] }) {
  const styles: Record<Teacher["status"], string> = {
    active:
      "bg-[rgba(49,92,67,.12)] text-moss border border-[rgba(49,92,67,.2)]",
    inactive:
      "bg-[rgba(83,97,87,.1)] text-ink-soft border border-[rgba(83,97,87,.18)]",
    suspended:
      "bg-[rgba(182,69,69,.1)] text-danger border border-[rgba(182,69,69,.2)]",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// EditTeacherModal
// ---------------------------------------------------------------------------

interface EditTeacherModalProps {
  teacher: Teacher;
  onClose: () => void;
  onSaved: (updated: Teacher) => void;
}

function EditTeacherModal({ teacher, onClose, onSaved }: EditTeacherModalProps) {
  const [firstName, setFirstName] = useState(teacher.firstName);
  const [lastName, setLastName] = useState(teacher.lastName);
  const [email, setEmail] = useState(teacher.email);
  const [phone, setPhone] = useState(teacher.phone ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function clearFieldError(field: string) {
    setFormError((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);

    const errors = validateTeacherForm({ firstName, lastName, email, phone });
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      if (errors.firstName) firstNameRef.current?.focus();
      else if (errors.lastName) lastNameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<Teacher>(`/staff/${teacher.id}`, {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, email, ...(phone ? { phone } : {}) }),
      });
      toast.success(`${firstName} ${lastName} updated successfully`);
      onSaved(updated);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const fieldErrors = mapApiErrorToFieldError({ status: error.status, message: error.message });
        setFormError(fieldErrors);
        if (fieldErrors.email) emailRef.current?.focus();
      } else {
        setApiError(
          error instanceof Error ? error.message : "Could not update teacher. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-teacher-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="surface w-full max-w-lg rounded-[28px] p-6 mx-4">
        <h2 id="edit-teacher-title" className="text-xl font-black text-ink">
          Edit Teacher
        </h2>

        {apiError && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--danger)]">
            <FiAlertCircle className="shrink-0" />
            {apiError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* First Name */}
            <div>
              <label htmlFor="edit-teacher-firstName" className="mb-1.5 block text-sm font-semibold text-ink">
                First Name <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                ref={firstNameRef}
                id="edit-teacher-firstName"
                type="text"
                className="field w-full"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); clearFieldError("firstName"); }}
                aria-describedby={formError.firstName ? "edit-teacher-firstName-error" : undefined}
                aria-invalid={!!formError.firstName}
                autoComplete="given-name"
                disabled={submitting}
              />
              <InlineError id="edit-teacher-firstName-error" message={formError.firstName} />
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="edit-teacher-lastName" className="mb-1.5 block text-sm font-semibold text-ink">
                Last Name <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                ref={lastNameRef}
                id="edit-teacher-lastName"
                type="text"
                className="field w-full"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); clearFieldError("lastName"); }}
                aria-describedby={formError.lastName ? "edit-teacher-lastName-error" : undefined}
                aria-invalid={!!formError.lastName}
                autoComplete="family-name"
                disabled={submitting}
              />
              <InlineError id="edit-teacher-lastName-error" message={formError.lastName} />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="edit-teacher-email" className="mb-1.5 block text-sm font-semibold text-ink">
                Email Address <span aria-hidden="true" className="text-danger">*</span>
              </label>
              <input
                ref={emailRef}
                id="edit-teacher-email"
                type="email"
                className="field w-full"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                aria-describedby={formError.email ? "edit-teacher-email-error" : undefined}
                aria-invalid={!!formError.email}
                autoComplete="email"
                disabled={submitting}
              />
              <InlineError id="edit-teacher-email-error" message={formError.email} />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="edit-teacher-phone" className="mb-1.5 block text-sm font-semibold text-ink">
                Phone <span className="text-xs font-normal text-ink-soft">(optional)</span>
              </label>
              <input
                id="edit-teacher-phone"
                type="tel"
                className="field w-full"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                disabled={submitting}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="secondary" disabled={submitting} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TeacherList
// ---------------------------------------------------------------------------

function TeacherList({
  teachers,
  loading,
  onEdit,
  onDeactivate,
}: {
  teachers: Teacher[];
  loading: boolean;
  onEdit: (teacher: Teacher) => void;
  onDeactivate: (teacher: Teacher) => void;
}) {
  if (loading) {
    return (
      <div className="mt-6 grid gap-2" aria-busy="true" aria-label="Loading teachers">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl bg-[rgba(83,97,87,.08)]"
          />
        ))}
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="mt-6">
        <EmptyState icon={FiUsers} message="No teachers yet. Add one using the form above." />
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[640px] border-separate border-spacing-y-2 text-left">
        <thead className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id} className="bg-[rgba(255,253,247,.68)]">
              <td className="rounded-l-2xl px-4 py-3 font-semibold text-ink">
                {teacher.firstName} {teacher.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-ink-soft">{teacher.email}</td>
              <td className="px-4 py-3 text-sm text-ink-soft">
                {teacher.phone ?? "—"}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={teacher.status} />
              </td>
              <td className="rounded-r-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={FiEdit}
                    className="!min-h-8 !px-2.5 !py-1 text-xs"
                    onClick={() => onEdit(teacher)}
                    aria-label={`Edit ${teacher.firstName} ${teacher.lastName}`}
                  >
                    Edit
                  </Button>
                  {teacher.status === "active" && (
                    <Button
                      type="button"
                      variant="danger"
                      icon={FiUserX}
                      className="!min-h-8 !px-2.5 !py-1 text-xs"
                      onClick={() => onDeactivate(teacher)}
                      aria-label={`Deactivate ${teacher.firstName} ${teacher.lastName}`}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateTeacherForm
// ---------------------------------------------------------------------------

interface CreateTeacherFormProps {
  onCreated: (teacher: Teacher) => void;
}

function CreateTeacherForm({ onCreated }: CreateTeacherFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});

  // Refs for focusing first error field
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  function clearFieldError(field: string) {
    setFormError((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = { firstName, lastName, email, phone };
    const errors = validateTeacherForm(formData);

    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      // Focus first error field
      if (errors.firstName) firstNameRef.current?.focus();
      else if (errors.lastName) lastNameRef.current?.focus();
      else if (errors.email) emailRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const newTeacher = await api<Teacher>("/staff", {
        method: "POST",
        body: JSON.stringify({ firstName, lastName, email, phone, role: "teacher" }),
      });

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setFormError({});

      toast.success(`Teacher ${firstName} ${lastName} added successfully`);
      onCreated(newTeacher);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const fieldErrors = mapApiErrorToFieldError({ status: error.status, message: error.message });
        setFormError(fieldErrors);
        if (fieldErrors.email) emailRef.current?.focus();
      } else {
        toast.error(
          error instanceof Error ? error.message : "Could not create teacher. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-base font-bold text-ink">Add a teacher</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label
            htmlFor="teacher-firstName"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            First Name <span aria-hidden="true" className="text-danger">*</span>
          </label>
          <input
            ref={firstNameRef}
            id="teacher-firstName"
            type="text"
            className="field w-full"
            value={firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              clearFieldError("firstName");
            }}
            aria-describedby={formError.firstName ? "teacher-firstName-error" : undefined}
            aria-invalid={!!formError.firstName}
            autoComplete="given-name"
            disabled={submitting}
          />
          <InlineError id="teacher-firstName-error" message={formError.firstName} />
        </div>

        {/* Last Name */}
        <div>
          <label
            htmlFor="teacher-lastName"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Last Name <span aria-hidden="true" className="text-danger">*</span>
          </label>
          <input
            ref={lastNameRef}
            id="teacher-lastName"
            type="text"
            className="field w-full"
            value={lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              clearFieldError("lastName");
            }}
            aria-describedby={formError.lastName ? "teacher-lastName-error" : undefined}
            aria-invalid={!!formError.lastName}
            autoComplete="family-name"
            disabled={submitting}
          />
          <InlineError id="teacher-lastName-error" message={formError.lastName} />
        </div>

        {/* Email */}
        <div>
          <label
            htmlFor="teacher-email"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Email Address <span aria-hidden="true" className="text-danger">*</span>
          </label>
          <input
            ref={emailRef}
            id="teacher-email"
            type="email"
            className="field w-full"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearFieldError("email");
            }}
            aria-describedby={formError.email ? "teacher-email-error" : undefined}
            aria-invalid={!!formError.email}
            autoComplete="email"
            disabled={submitting}
          />
          <InlineError id="teacher-email-error" message={formError.email} />
        </div>

        {/* Phone */}
        <div>
          <label
            htmlFor="teacher-phone"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Phone{" "}
            <span className="text-xs font-normal text-ink-soft">(optional)</span>
          </label>
          <input
            id="teacher-phone"
            type="tel"
            className="field w-full"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              clearFieldError("phone");
            }}
            autoComplete="tel"
            disabled={submitting}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" icon={FiUserCheck} disabled={submitting}>
          {submitting ? "Adding…" : "Add Teacher"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// TeachersPanel
// ---------------------------------------------------------------------------

export function TeachersPanel() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 50;

  // Edit / deactivate state
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deactivatingTeacher, setDeactivatingTeacher] = useState<Teacher | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function fetchTeachers(page = 1) {
    setLoading(true);
    setFetchError(null);
    try {
      const payload = await api<{ 
        staff: Teacher[], 
        total: number, 
        page: number, 
        totalPages: number 
      }>(`/staff?role=teacher&page=${page}&limit=${ITEMS_PER_PAGE}`);
      
      setTeachers(Array.isArray(payload.staff) ? payload.staff : []);
      setCurrentPage(payload.page || 1);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || 0);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Could not load teachers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers(currentPage);
  }, [currentPage]);

  function handleTeacherCreated(teacher: Teacher) {
    setTeachers((prev) => [teacher, ...prev]);
  }

  function handleTeacherSaved(updated: Teacher) {
    setTeachers((prev) =>
      prev.map((t) => (t.id === updated.id ? updated : t)),
    );
    setEditingTeacher(null);
  }

  async function handleDeactivateConfirm() {
    if (!deactivatingTeacher) return;
    setDeactivating(true);
    try {
      await api(`/staff/${deactivatingTeacher.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "inactive" }),
      });
      toast.success(`${deactivatingTeacher.firstName} ${deactivatingTeacher.lastName} has been deactivated`);
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === deactivatingTeacher.id ? { ...t, status: "inactive" } : t,
        ),
      );
      setDeactivatingTeacher(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not deactivate teacher. Please try again.",
      );
    } finally {
      setDeactivating(false);
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FiAlertCircle className="text-3xl text-danger" />
        <p className="text-sm text-ink-soft">{fetchError}</p>
        <Button variant="secondary" icon={FiRefreshCw} onClick={() => fetchTeachers(1)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateTeacherForm onCreated={handleTeacherCreated} />
      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-ink-soft">
          {loading ? "Loading teachers…" : `${totalItems} teacher${totalItems === 1 ? "" : "s"}`}
        </p>
        <TeacherList
          teachers={teachers}
          loading={loading}
          onEdit={setEditingTeacher}
          onDeactivate={setDeactivatingTeacher}
        />
        
        {!loading && teachers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {/* Edit modal */}
      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          onClose={() => setEditingTeacher(null)}
          onSaved={handleTeacherSaved}
        />
      )}

      {/* Deactivate confirm dialog */}
      {deactivatingTeacher && (
        <ConfirmDialog
          title="Deactivate Teacher"
          message={`Are you sure you want to deactivate ${deactivatingTeacher.firstName} ${deactivatingTeacher.lastName}? They will no longer be able to log in.`}
          confirmLabel="Deactivate"
          variant="danger"
          loading={deactivating}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivatingTeacher(null)}
        />
      )}
    </div>
  );
}
