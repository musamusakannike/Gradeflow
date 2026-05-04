"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiBook,
  FiBookOpen,
  FiRefreshCw,
} from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { mapApiErrorToFieldError, validateSubjectForm } from "@/lib/admin-forms";
import type { Subject } from "@/types/gradeflow";
import { Button, EmptyState, InlineError } from "./ui";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        isActive
          ? "border border-[rgba(49,92,67,.2)] bg-[rgba(49,92,67,.12)] text-[var(--moss)]"
          : "border border-[rgba(83,97,87,.18)] bg-[rgba(83,97,87,.1)] text-[var(--ink-soft)]"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// SubjectList
// ---------------------------------------------------------------------------

function SubjectList({
  subjects,
  loading,
}: {
  subjects: Subject[];
  loading: boolean;
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
      <table className="w-full min-w-[480px] border-separate border-spacing-y-2 text-left">
        <thead className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Code</th>
            <th className="px-4 py-2">Description</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((subject) => (
            <tr key={subject.id} className="bg-[rgba(255,253,247,.68)]">
              <td className="rounded-l-2xl px-4 py-3 font-semibold text-[var(--ink)]">
                {subject.name}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-[var(--ink-soft)]">
                {subject.code}
              </td>
              <td className="px-4 py-3 text-sm text-[var(--ink-soft)]">
                {subject.description ?? "—"}
              </td>
              <td className="rounded-r-2xl px-4 py-3">
                <ActiveBadge isActive={subject.isActive} />
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
      <h3 className="text-base font-bold text-[var(--ink)]">Add a subject</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* Subject Name */}
        <div>
          <label
            htmlFor="subject-catalog-name"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Subject Name{" "}
            <span aria-hidden="true" className="text-[var(--danger)]">
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
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Description{" "}
            <span className="text-xs font-normal text-[var(--ink-soft)]">
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

  async function fetchSubjects() {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api<Subject[]>("/subjects");
      setSubjects(Array.isArray(data) ? data : []);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Could not load subjects.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSubjects();
  }, []);

  function handleSubjectCreated(subject: Subject) {
    setSubjects((prev) => [subject, ...prev]);
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FiAlertCircle className="text-3xl text-[var(--danger)]" />
        <p className="text-sm text-[var(--ink-soft)]">{fetchError}</p>
        <Button variant="secondary" icon={FiRefreshCw} onClick={fetchSubjects}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateSubjectForm onCreated={handleSubjectCreated} />
      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-[var(--ink-soft)]">
          {loading
            ? "Loading subjects…"
            : `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`}
        </p>
        <SubjectList subjects={subjects} loading={loading} />
      </div>
    </div>
  );
}
