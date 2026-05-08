"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiBook,
  FiBookOpen,
  FiEdit,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { mapApiErrorToFieldError, validateSubjectForm } from "@/lib/admin-forms";
import type { Subject } from "@/types/gradeflow";
import { Button, EmptyState, InlineError, Pagination } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        isActive
          ? "border border-[rgba(49,92,67,.2)] bg-[rgba(49,92,67,.12)] text-moss"
          : "border border-[rgba(83,97,87,.18)] bg-[rgba(83,97,87,.1)] text-ink-soft"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// EditSubjectModal
// ---------------------------------------------------------------------------

interface EditSubjectModalProps {
  subject: Subject;
  onClose: () => void;
  onSaved: (updated: Subject) => void;
}

function EditSubjectModal({ subject, onClose, onSaved }: EditSubjectModalProps) {
  const [name, setName] = useState(subject.name);
  const [code, setCode] = useState(subject.code);
  const [description, setDescription] = useState(subject.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const codeRef = useRef<HTMLInputElement>(null);

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

  function validateEditForm(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!name || name.trim().length < 2) {
      errors.name = "Subject name must be at least 2 characters.";
    }
    if (!code || code.trim().length === 0) {
      errors.code = "Subject code is required.";
    }
    return errors;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);

    const errors = validateEditForm();
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      if (errors.name) nameRef.current?.focus();
      else if (errors.code) codeRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<Subject>(`/subjects/${subject.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
        }),
      });
      toast.success(`Subject "${updated.name}" updated successfully`);
      onSaved(updated);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const fieldErrors = mapApiErrorToFieldError({
          status: error.status,
          message: error.message,
        });
        setFormError(fieldErrors);
        if (fieldErrors.name) nameRef.current?.focus();
      } else {
        setApiError(
          error instanceof Error
            ? error.message
            : "Could not update subject. Please try again.",
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
      aria-labelledby="edit-subject-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="surface w-full max-w-lg rounded-[28px] p-6 mx-4">
        <h2 id="edit-subject-title" className="text-xl font-black text-ink">
          Edit Subject
        </h2>

        {apiError && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[var(--danger)]"
          >
            <FiAlertCircle className="shrink-0" />
            {apiError}
          </p>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Subject Name */}
            <div>
              <label
                htmlFor="edit-subject-name"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Subject Name{" "}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <input
                ref={nameRef}
                id="edit-subject-name"
                type="text"
                className="field w-full"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                }}
                aria-describedby={
                  formError.name ? "edit-subject-name-error" : undefined
                }
                aria-invalid={!!formError.name}
                disabled={submitting}
              />
              <InlineError id="edit-subject-name-error" message={formError.name} />
            </div>

            {/* Subject Code */}
            <div>
              <label
                htmlFor="edit-subject-code"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Code{" "}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <input
                ref={codeRef}
                id="edit-subject-code"
                type="text"
                className="field w-full font-mono"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  clearFieldError("code");
                }}
                aria-describedby={
                  formError.code ? "edit-subject-code-error" : undefined
                }
                aria-invalid={!!formError.code}
                disabled={submitting}
              />
              <InlineError id="edit-subject-code-error" message={formError.code} />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label
                htmlFor="edit-subject-description"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Description{" "}
                <span className="text-xs font-normal text-ink-soft">
                  (optional)
                </span>
              </label>
              <input
                id="edit-subject-description"
                type="text"
                className="field w-full"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                placeholder="Brief description"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={onClose}
            >
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
// SubjectList
// ---------------------------------------------------------------------------

function SubjectList({
  subjects,
  loading,
  onEdit,
  onDeactivate,
}: {
  subjects: Subject[];
  loading: boolean;
  onEdit: (subject: Subject) => void;
  onDeactivate: (subject: Subject) => void;
}) {
  if (loading) {
    return (
      <div
        className="mt-4 grid gap-2"
        aria-busy="true"
        aria-label="Loading subjects"
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded-2xl bg-[rgba(83,97,87,.08)]"
          />
        ))}
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={FiBook}
          message="No subjects yet. Add one using the form above."
        />
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
        <thead className="text-xs uppercase tracking-[0.16em] text-ink-soft">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Code</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.id} className="bg-[rgba(255,253,247,.68)]">
              <td className="rounded-l-2xl px-4 py-3 font-semibold text-ink">
                {subject.name}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-ink-soft">
                {subject.code}
              </td>
              <td className="px-4 py-3 text-sm text-ink-soft">
                {subject.description ?? "—"}
              </td>
              <td className="px-4 py-3">
                <ActiveBadge isActive={subject.isActive} />
              </td>
              <td className="rounded-r-2xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    icon={FiEdit}
                    className="!min-h-8 !px-2.5 !py-1 text-xs"
                    onClick={() => onEdit(subject)}
                    aria-label={`Edit ${subject.name}`}
                  >
                    Edit
                  </Button>
                  {subject.isActive && (
                    <Button
                      type="button"
                      variant="danger"
                      icon={FiTrash2}
                      className="!min-h-8 !px-2.5 !py-1 text-xs"
                      onClick={() => onDeactivate(subject)}
                      aria-label={`Deactivate ${subject.name}`}
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
// CreateSubjectForm
// ---------------------------------------------------------------------------

interface CreateSubjectFormProps {
  onCreated: (subject: Subject) => void;
}

function CreateSubjectForm({ onCreated }: CreateSubjectFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);

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

    const errors = validateSubjectForm({ name, description });
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      if (errors.name) nameRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const newSubject = await api<Subject>("/subjects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });

      // Reset form
      setName("");
      setDescription("");
      setFormError({});

      toast.success(`Subject "${newSubject.name}" added successfully`);
      onCreated(newSubject);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        const fieldErrors = mapApiErrorToFieldError({
          status: error.status,
          message: error.message,
        });
        // If no specific field mapped, show on name field
        const nameError =
          fieldErrors.name ||
          error.message ||
          "A subject with this name already exists.";
        setFormError({ name: nameError });
        nameRef.current?.focus();
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not create subject. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-base font-bold text-ink">Add a subject</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Subject Name */}
        <div>
          <label
            htmlFor="subject-catalog-name"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Subject Name{" "}
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          </label>
          <input
            ref={nameRef}
            id="subject-catalog-name"
            type="text"
            className="field w-full"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            aria-describedby={
              formError.name ? "subject-catalog-name-error" : undefined
            }
            aria-invalid={!!formError.name}
            disabled={submitting}
            placeholder="e.g. Mathematics"
          />
          <InlineError
            id="subject-catalog-name-error"
            message={formError.name}
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="subject-catalog-description"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Description{" "}
            <span className="text-xs font-normal text-ink-soft">
              (optional)
            </span>
          </label>
          <input
            id="subject-catalog-description"
            type="text"
            className="field w-full"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder="Brief description"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" icon={FiBookOpen} disabled={submitting}>
          {submitting ? "Adding…" : "Add Subject"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// SubjectsPanel
// ---------------------------------------------------------------------------

export function SubjectsPanel() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 50;

  // Edit / deactivate state
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deactivatingSubject, setDeactivatingSubject] = useState<Subject | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function fetchSubjects(page = 1) {
    setLoading(true);
    setFetchError(null);
    try {
      const payload = await api<{
        subjects: Subject[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/subjects?page=${page}&limit=${ITEMS_PER_PAGE}`);

      setSubjects(Array.isArray(payload.subjects) ? payload.subjects : []);
      setCurrentPage(payload.page || 1);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || 0);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Could not load subjects.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects(currentPage);
  }, [currentPage]);

  function handleSubjectCreated(subject: Subject) {
    setSubjects((prev) => [subject, ...prev]);
  }

  function handleSubjectSaved(updated: Subject) {
    setSubjects((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s)),
    );
    setEditingSubject(null);
  }

  async function handleDeactivateConfirm() {
    if (!deactivatingSubject) return;
    setDeactivating(true);
    try {
      await api(`/subjects/${deactivatingSubject.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });
      toast.success(`"${deactivatingSubject.name}" has been deactivated`);
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === deactivatingSubject.id ? { ...s, isActive: false } : s,
        ),
      );
      setDeactivatingSubject(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not deactivate subject. Please try again.",
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
        <Button variant="secondary" icon={FiRefreshCw} onClick={() => fetchSubjects(1)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateSubjectForm onCreated={handleSubjectCreated} />
      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-ink-soft">
          {loading
            ? "Loading subjects…"
            : `${totalItems} subject${totalItems === 1 ? "" : "s"}`}
        </p>
        <SubjectList
          subjects={subjects}
          loading={loading}
          onEdit={setEditingSubject}
          onDeactivate={setDeactivatingSubject}
        />

        {!loading && subjects.length > 0 && (
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
      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSaved={handleSubjectSaved}
        />
      )}

      {/* Deactivate confirm dialog */}
      {deactivatingSubject && (
        <ConfirmDialog
          title="Deactivate Subject"
          message={`Are you sure you want to deactivate "${deactivatingSubject.name}"? It will no longer be available for assignment.`}
          confirmLabel="Deactivate"
          variant="danger"
          loading={deactivating}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivatingSubject(null)}
        />
      )}
    </div>
  );
}
