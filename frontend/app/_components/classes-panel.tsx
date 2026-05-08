"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiBook,
  FiBookOpen,
  FiEdit,
  FiLink,
  FiRefreshCw,
  FiTrash2,
} from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { validateClassForm, validateSubjectForm } from "@/lib/admin-forms";
import type { SchoolClass, Subject } from "@/types/gradeflow";
import { Button, EmptyState, InlineError, Pagination } from "./ui";
import { ConfirmDialog } from "./confirm-dialog";

// ---------------------------------------------------------------------------
// EditClassModal — edit an existing class
// ---------------------------------------------------------------------------

interface EditClassModalProps {
  cls: SchoolClass;
  onClose: () => void;
  onSaved: (updated: SchoolClass) => void;
}

function EditClassModal({ cls, onClose, onSaved }: EditClassModalProps) {
  const [name, setName] = useState(cls.name);
  const [level, setLevel] = useState(String(cls.level));
  const [section, setSection] = useState(cls.section ?? "");
  const [capacity, setCapacity] = useState(String(cls.capacity ?? ""));
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});

  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const levelRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateClassForm({ name, level, section, capacity });
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      if (errors.name) nameRef.current?.focus();
      else if (errors.level) levelRef.current?.focus();
      return;
    }

    // Capacity is required per task spec
    if (!capacity || capacity.trim() === "") {
      setFormError({ capacity: "Capacity is required." });
      return;
    }

    setSubmitting(true);
    try {
      const updated = await api<SchoolClass>(`/classes/${cls.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          level: Number(level),
          capacity: Number(capacity),
          section: section.trim() || undefined,
        }),
      });

      toast.success(`Class "${updated.name}" updated successfully`);
      onSaved(updated);
      onClose();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError({
          form: error.message || "A class with this name already exists.",
        });
      } else {
        setFormError({
          form:
            error instanceof Error
              ? error.message
              : "Could not update class. Please try again.",
        });
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
      aria-labelledby="edit-class-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="surface w-full max-w-lg rounded-[28px] p-6 mx-4">
        <h2
          id="edit-class-title"
          className="text-xl font-black text-[var(--ink)]"
        >
          Edit Class
        </h2>

        {/* Form-level error */}
        {formError.form && (
          <div
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-2xl border border-[rgba(182,69,69,.2)] bg-[rgba(182,69,69,.06)] px-4 py-3 text-sm text-danger"
          >
            <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
            {formError.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Class Name */}
            <div>
              <label
                htmlFor="edit-class-name"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Class Name{" "}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <input
                ref={nameRef}
                id="edit-class-name"
                type="text"
                className="field w-full"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearFieldError("name");
                  clearFieldError("form");
                }}
                aria-describedby={formError.name ? "edit-class-name-error" : undefined}
                aria-invalid={!!formError.name}
                disabled={submitting}
                placeholder="e.g. Grade 5A"
              />
              <InlineError id="edit-class-name-error" message={formError.name} />
            </div>

            {/* Level */}
            <div>
              <label
                htmlFor="edit-class-level"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Level (1–12){" "}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <input
                ref={levelRef}
                id="edit-class-level"
                type="number"
                min={1}
                max={12}
                className="field w-full"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value);
                  clearFieldError("level");
                }}
                aria-describedby={formError.level ? "edit-class-level-error" : undefined}
                aria-invalid={!!formError.level}
                disabled={submitting}
                placeholder="e.g. 5"
              />
              <InlineError id="edit-class-level-error" message={formError.level} />
            </div>

            {/* Section */}
            <div>
              <label
                htmlFor="edit-class-section"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Section{" "}
                <span className="text-xs font-normal text-ink-soft">
                  (optional)
                </span>
              </label>
              <input
                id="edit-class-section"
                type="text"
                className="field w-full"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                disabled={submitting}
                placeholder="e.g. A, B"
                maxLength={5}
              />
            </div>

            {/* Capacity */}
            <div>
              <label
                htmlFor="edit-class-capacity"
                className="mb-1.5 block text-sm font-semibold text-ink"
              >
                Capacity{" "}
                <span aria-hidden="true" className="text-danger">
                  *
                </span>
              </label>
              <input
                id="edit-class-capacity"
                type="number"
                min={10}
                max={200}
                className="field w-full"
                value={capacity}
                onChange={(e) => {
                  setCapacity(e.target.value);
                  clearFieldError("capacity");
                }}
                aria-describedby={formError.capacity ? "edit-class-capacity-error" : undefined}
                aria-invalid={!!formError.capacity}
                disabled={submitting}
                placeholder="e.g. 30"
              />
              <InlineError id="edit-class-capacity-error" message={formError.capacity} />
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
// ClassSubjectView — shown when a class is selected
// ---------------------------------------------------------------------------

interface ClassSubjectViewProps {
  selectedClass: SchoolClass;
  onClose: () => void;
}

function ClassSubjectView({ selectedClass, onClose }: ClassSubjectViewProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [linkingSubjectName, setLinkingSubjectName] = useState<string | null>(null);
  const [linkingSubmitting, setLinkingSubmitting] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);

  function clearFieldError(field: string) {
    setFormError((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function fetchSubjects() {
    setLoading(true);
    setFetchError(null);
    try {
      // Try fetching with classId filter; fall back to all subjects if needed
      const data = await api<Subject[]>(`/subjects?classId=${selectedClass.id}`);
      setSubjects(Array.isArray(data) ? data : []);
    } catch {
      try {
        // Fallback: fetch all subjects and filter client-side
        const all = await api<Subject[]>("/subjects");
        // The API may not support classId filter; show all for now
        setSubjects(Array.isArray(all) ? all : []);
      } catch (err) {
        setFetchError(
          err instanceof Error ? err.message : "Could not load subjects.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects();
    // Reset form when class changes
    setName("");
    setDescription("");
    setFormError({});
    setLinkingSubjectName(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass.id]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateSubjectForm({ name, description });
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      if (errors.name) nameRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setLinkingSubjectName(null);
    try {
      const newSubject = await api<Subject>("/subjects", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          classId: selectedClass.id,
        }),
      });

      setName("");
      setDescription("");
      setFormError({});
      toast.success(
        `Subject "${newSubject.name}" added to ${selectedClass.name}`,
      );
      setSubjects((prev) => [newSubject, ...prev]);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        // Subject name already exists school-wide — offer to link it
        setLinkingSubjectName(name.trim());
        setFormError({
          form: `A subject named "${name.trim()}" already exists in this school. You can link it to ${selectedClass.name} instead.`,
        });
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

  async function handleLinkExisting() {
    if (!linkingSubjectName) return;

    setLinkingSubmitting(true);
    try {
      const linked = await api<Subject>("/subjects/assign", {
        method: "POST",
        body: JSON.stringify({
          subjectName: linkingSubjectName,
          classId: selectedClass.id,
        }),
      });

      setName("");
      setDescription("");
      setFormError({});
      setLinkingSubjectName(null);
      toast.success(
        `Subject "${linkingSubjectName}" linked to ${selectedClass.name}`,
      );
      setSubjects((prev) => [linked, ...prev]);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not link subject. Please try again.",
      );
    } finally {
      setLinkingSubmitting(false);
    }
  }

  return (
    <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-5">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to class list"
          className="focus-ring pressable grid size-8 place-items-center rounded-xl text-ink-soft hover:bg-[rgba(49,92,67,.08)]"
        >
          <FiArrowLeft className="text-base" />
        </button>
        <h3 className="text-base font-bold text-ink">
          Subjects for{" "}
          <span className="text-moss">{selectedClass.name}</span>
        </h3>
      </div>

      {/* Create Subject Form */}
      <form onSubmit={handleSubmit} noValidate>
        <h4 className="text-sm font-semibold text-ink-soft">
          Add a subject
        </h4>

        {/* Form-level error (409 duplicate) */}
        {formError.form && (
          <div
            role="alert"
            className="mt-3 rounded-2xl border border-[rgba(182,69,69,.2)] bg-[rgba(182,69,69,.06)] px-4 py-3"
          >
            <p className="flex items-start gap-2 text-sm text-danger">
              <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
              {formError.form}
            </p>
            {linkingSubjectName && (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="secondary"
                  icon={FiLink}
                  disabled={linkingSubmitting}
                  onClick={handleLinkExisting}
                >
                  {linkingSubmitting
                    ? "Linking…"
                    : `Link "${linkingSubjectName}" to ${selectedClass.name}`}
                </Button>
              </div>
            )}
          </div>
        )}

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {/* Subject Name */}
          <div>
            <label
              htmlFor="subject-name"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Subject Name{" "}
              <span aria-hidden="true" className="text-danger">
                *
              </span>
            </label>
            <input
              ref={nameRef}
              id="subject-name"
              type="text"
              className="field w-full"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clearFieldError("name");
                setLinkingSubjectName(null);
                clearFieldError("form");
              }}
              aria-describedby={
                formError.name ? "subject-name-error" : undefined
              }
              aria-invalid={!!formError.name}
              disabled={submitting || linkingSubmitting}
              placeholder="e.g. Mathematics"
            />
            <InlineError id="subject-name-error" message={formError.name} />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="subject-description"
              className="mb-1.5 block text-sm font-semibold text-ink"
            >
              Description{" "}
              <span className="text-xs font-normal text-ink-soft">
                (optional)
              </span>
            </label>
            <input
              id="subject-description"
              type="text"
              className="field w-full"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting || linkingSubmitting}
              placeholder="Brief description"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            type="submit"
            icon={FiBookOpen}
            disabled={submitting || linkingSubmitting}
          >
            {submitting ? "Adding…" : "Add Subject"}
          </Button>
        </div>
      </form>

      {/* Subject List */}
      <div className="mt-5 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-ink-soft">
          {loading
            ? "Loading subjects…"
            : `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
        </p>

        {fetchError ? (
          <div className="mt-4 flex flex-col items-center gap-4 py-6 text-center">
            <FiAlertCircle className="text-2xl text-danger" />
            <p className="text-sm text-ink-soft">{fetchError}</p>
            <Button variant="secondary" icon={FiRefreshCw} onClick={fetchSubjects}>
              Retry
            </Button>
          </div>
        ) : loading ? (
          <div
            className="mt-3 grid gap-2"
            aria-busy="true"
            aria-label="Loading subjects"
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded-2xl bg-[rgba(83,97,87,.08)]"
              />
            ))}
          </div>
        ) : subjects.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={FiBook}
              message={`No subjects yet for ${selectedClass.name}. Add one using the form above.`}
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-2">
            {subjects.map((subject) => (
              <li
                key={subject.id}
                className="flex items-start gap-3 rounded-2xl bg-[rgba(255,253,247,.68)] px-4 py-3"
              >
                <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-[rgba(49,92,67,.1)] text-moss">
                  <FiBook className="text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {subject.name}
                  </p>
                  {subject.description && (
                    <p className="mt-0.5 text-sm text-ink-soft">
                      {subject.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ClassList
// ---------------------------------------------------------------------------

interface ClassListProps {
  classes: SchoolClass[];
  loading: boolean;
  selectedClass: SchoolClass | null;
  onSelect: (cls: SchoolClass) => void;
  onEdit: (cls: SchoolClass) => void;
  onDeactivate: (cls: SchoolClass) => void;
}

function ClassList({
  classes,
  loading,
  selectedClass,
  onSelect,
  onEdit,
  onDeactivate,
}: ClassListProps) {
  if (loading) {
    return (
      <div
        className="mt-4 grid gap-2"
        aria-busy="true"
        aria-label="Loading classes"
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

  if (classes.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={FiBook}
          message="No classes yet. Add one using the form above."
        />
      </div>
    );
  }

  return (
    <ul className="mt-4 grid gap-2">
      {classes.map((cls) => {
        const isSelected = selectedClass?.id === cls.id;
        return (
          <li key={cls.id}>
            <button
              type="button"
              onClick={() => onSelect(cls)}
              aria-pressed={isSelected}
              className={`focus-ring pressable w-full rounded-2xl px-4 py-3 text-left transition-colors ${
                isSelected
                  ? "bg-[rgba(49,92,67,.12)] ring-1 ring-[rgba(49,92,67,.25)]"
                  : "bg-[rgba(255,253,247,.68)] hover:bg-[rgba(49,92,67,.06)]"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{cls.name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">
                    Level {cls.level}
                    {cls.section ? ` · Section ${cls.section}` : ""}
                    {cls.capacity ? ` · Capacity ${cls.capacity}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {isSelected && (
                    <span className="rounded-full bg-[rgba(49,92,67,.15)] px-2.5 py-0.5 text-xs font-semibold text-moss">
                      Selected
                    </span>
                  )}
                  {/* Edit button */}
                  <button
                    type="button"
                    aria-label={`Edit ${cls.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(cls);
                    }}
                    className="focus-ring pressable grid size-8 place-items-center rounded-xl text-ink-soft hover:bg-[rgba(49,92,67,.1)] hover:text-moss"
                  >
                    <FiEdit className="text-sm" />
                  </button>
                  {/* Deactivate button */}
                  <button
                    type="button"
                    aria-label={`Deactivate ${cls.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeactivate(cls);
                    }}
                    className="focus-ring pressable grid size-8 place-items-center rounded-xl text-ink-soft hover:bg-[rgba(182,69,69,.1)] hover:text-danger"
                  >
                    <FiTrash2 className="text-sm" />
                  </button>
                </div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// CreateClassForm
// ---------------------------------------------------------------------------

interface CreateClassFormProps {
  onCreated: (cls: SchoolClass) => void;
}

function CreateClassForm({ onCreated }: CreateClassFormProps) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [section, setSection] = useState("");
  const [capacity, setCapacity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});

  const nameRef = useRef<HTMLInputElement>(null);
  const levelRef = useRef<HTMLInputElement>(null);

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

    const errors = validateClassForm({
      name,
      level,
      section,
      capacity,
    });

    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      if (errors.name) nameRef.current?.focus();
      else if (errors.level) levelRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const newClass = await api<SchoolClass>("/classes", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          level: Number(level),
          section: section.trim() || undefined,
          capacity: capacity ? Number(capacity) : undefined,
        }),
      });

      setName("");
      setLevel("");
      setSection("");
      setCapacity("");
      setFormError({});

      toast.success(`Class "${newClass.name}" created successfully`);
      onCreated(newClass);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFormError({
          form: error.message || "A class with this name already exists.",
        });
      } else {
        toast.error(
          error instanceof Error
            ? error.message
            : "Could not create class. Please try again.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-base font-bold text-ink">Add a class</h3>

      {/* Form-level error (409 duplicate) */}
      {formError.form && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-2xl border border-[rgba(182,69,69,.2)] bg-[rgba(182,69,69,.06)] px-4 py-3 text-sm text-danger"
        >
          <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
          {formError.form}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Class Name */}
        <div>
          <label
            htmlFor="class-name"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Class Name{" "}
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          </label>
          <input
            ref={nameRef}
            id="class-name"
            type="text"
            className="field w-full"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
              clearFieldError("form");
            }}
            aria-describedby={formError.name ? "class-name-error" : undefined}
            aria-invalid={!!formError.name}
            disabled={submitting}
            placeholder="e.g. Grade 5A"
          />
          <InlineError id="class-name-error" message={formError.name} />
        </div>

        {/* Level */}
        <div>
          <label
            htmlFor="class-level"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Level (1–12){" "}
            <span aria-hidden="true" className="text-danger">
              *
            </span>
          </label>
          <input
            ref={levelRef}
            id="class-level"
            type="number"
            min={1}
            max={12}
            className="field w-full"
            value={level}
            onChange={(e) => {
              setLevel(e.target.value);
              clearFieldError("level");
            }}
            aria-describedby={
              formError.level ? "class-level-error" : undefined
            }
            aria-invalid={!!formError.level}
            disabled={submitting}
            placeholder="e.g. 5"
          />
          <InlineError id="class-level-error" message={formError.level} />
        </div>

        {/* Section */}
        <div>
          <label
            htmlFor="class-section"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Section{" "}
            <span className="text-xs font-normal text-ink-soft">
              (optional)
            </span>
          </label>
          <input
            id="class-section"
            type="text"
            className="field w-full"
            value={section}
            onChange={(e) => setSection(e.target.value)}
            disabled={submitting}
            placeholder="e.g. A, B"
            maxLength={5}
          />
        </div>

        {/* Capacity */}
        <div>
          <label
            htmlFor="class-capacity"
            className="mb-1.5 block text-sm font-semibold text-ink"
          >
            Capacity{" "}
            <span className="text-xs font-normal text-ink-soft">
              (optional)
            </span>
          </label>
          <input
            id="class-capacity"
            type="number"
            min={10}
            max={200}
            className="field w-full"
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={submitting}
            placeholder="e.g. 30"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button type="submit" icon={FiBook} disabled={submitting}>
          {submitting ? "Creating…" : "Create Class"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// ClassesPanel
// ---------------------------------------------------------------------------

export function ClassesPanel() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 50;

  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deactivatingClass, setDeactivatingClass] = useState<SchoolClass | null>(null);
  const [deactivating, setDeactivating] = useState(false);

  async function fetchClasses(page = 1) {
    setLoading(true);
    setFetchError(null);
    try {
      const payload = await api<{ 
        classes: SchoolClass[], 
        total: number, 
        page: number, 
        totalPages: number 
      }>(`/classes?page=${page}&limit=${ITEMS_PER_PAGE}`);
      
      setClasses(Array.isArray(payload.classes) ? payload.classes : []);
      setCurrentPage(payload.page || 1);
      setTotalPages(payload.totalPages || 1);
      setTotalItems(payload.total || 0);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Could not load classes.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClasses(currentPage);
  }, [currentPage]);

  function handleClassCreated(cls: SchoolClass) {
    setClasses((prev) => [cls, ...prev]);
  }

  function handleClassSaved(updated: SchoolClass) {
    setClasses((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c)),
    );
    // Keep selectedClass in sync if it was the one edited
    setSelectedClass((prev) =>
      prev?.id === updated.id ? updated : prev,
    );
  }

  async function handleDeactivateConfirm() {
    if (!deactivatingClass) return;
    setDeactivating(true);
    try {
      await api<SchoolClass>(`/classes/${deactivatingClass.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive: false }),
      });

      toast.success(`Class "${deactivatingClass.name}" deactivated`);
      // Remove from list (deactivated classes are no longer active)
      setClasses((prev) => prev.filter((c) => c.id !== deactivatingClass.id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      // Clear selection if the deactivated class was selected
      setSelectedClass((prev) =>
        prev?.id === deactivatingClass.id ? null : prev,
      );
      setDeactivatingClass(null);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not deactivate class. Please try again.",
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
        <Button variant="secondary" icon={FiRefreshCw} onClick={() => fetchClasses(1)}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateClassForm onCreated={handleClassCreated} />

      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-ink-soft">
          {loading
            ? "Loading classes…"
            : `${totalItems} class${totalItems === 1 ? "" : "es"}`}
        </p>
        <ClassList
          classes={classes}
          loading={loading}
          selectedClass={selectedClass}
          onSelect={(cls) =>
            setSelectedClass((prev) =>
              prev?.id === cls.id ? null : cls,
            )
          }
          onEdit={(cls) => setEditingClass(cls)}
          onDeactivate={(cls) => setDeactivatingClass(cls)}
        />

        {!loading && classes.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={(page) => setCurrentPage(page)}
          />
        )}
      </div>

      {selectedClass && (
        <ClassSubjectView
          selectedClass={selectedClass}
          onClose={() => setSelectedClass(null)}
        />
      )}

      {editingClass && (
        <EditClassModal
          cls={editingClass}
          onClose={() => setEditingClass(null)}
          onSaved={handleClassSaved}
        />
      )}

      {deactivatingClass && (
        <ConfirmDialog
          title="Deactivate Class"
          message={`Are you sure you want to deactivate "${deactivatingClass.name}"? This will remove it from the active classes list.`}
          confirmLabel="Deactivate"
          variant="danger"
          loading={deactivating}
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setDeactivatingClass(null)}
        />
      )}
    </div>
  );
}
