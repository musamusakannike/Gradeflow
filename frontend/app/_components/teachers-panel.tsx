"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FiAlertCircle, FiRefreshCw, FiUserCheck, FiUsers } from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { mapApiErrorToFieldError, validateTeacherForm } from "@/lib/admin-forms";
import type { Teacher } from "@/types/gradeflow";
import { Button, EmptyState, InlineError } from "./ui";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: Teacher["status"] }) {
  const styles: Record<Teacher["status"], string> = {
    active:
      "bg-[rgba(49,92,67,.12)] text-[var(--moss)] border border-[rgba(49,92,67,.2)]",
    inactive:
      "bg-[rgba(83,97,87,.1)] text-[var(--ink-soft)] border border-[rgba(83,97,87,.18)]",
    suspended:
      "bg-[rgba(182,69,69,.1)] text-[var(--danger)] border border-[rgba(182,69,69,.2)]",
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
// TeacherList
// ---------------------------------------------------------------------------

function TeacherList({
  teachers,
  loading,
}: {
  teachers: Teacher[];
  loading: boolean;
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
      <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
        <thead className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          <tr>
            <th className="px-4 py-2">Name</th>
            <th className="px-4 py-2">Email</th>
            <th className="px-4 py-2">Phone</th>
            <th className="px-4 py-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((teacher) => (
            <tr key={teacher.id} className="bg-[rgba(255,253,247,.68)]">
              <td className="rounded-l-2xl px-4 py-3 font-semibold text-[var(--ink)]">
                {teacher.firstName} {teacher.lastName}
              </td>
              <td className="px-4 py-3 text-sm text-[var(--ink-soft)]">{teacher.email}</td>
              <td className="px-4 py-3 text-sm text-[var(--ink-soft)]">
                {teacher.phone ?? "—"}
              </td>
              <td className="rounded-r-2xl px-4 py-3">
                <StatusBadge status={teacher.status} />
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
      <h3 className="text-base font-bold text-[var(--ink)]">Add a teacher</h3>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {/* First Name */}
        <div>
          <label
            htmlFor="teacher-firstName"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            First Name <span aria-hidden="true" className="text-[var(--danger)]">*</span>
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
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Last Name <span aria-hidden="true" className="text-[var(--danger)]">*</span>
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
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Email Address <span aria-hidden="true" className="text-[var(--danger)]">*</span>
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
            <span className="text-xs font-normal text-[var(--ink-soft)]">(optional)</span>
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

  async function fetchTeachers() {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api<Teacher[]>("/staff?role=teacher");
      setTeachers(Array.isArray(data) ? data : []);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Could not load teachers.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTeachers();
  }, []);

  function handleTeacherCreated(teacher: Teacher) {
    setTeachers((prev) => [teacher, ...prev]);
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FiAlertCircle className="text-3xl text-[var(--danger)]" />
        <p className="text-sm text-[var(--ink-soft)]">{fetchError}</p>
        <Button variant="secondary" icon={FiRefreshCw} onClick={fetchTeachers}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateTeacherForm onCreated={handleTeacherCreated} />
      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-[var(--ink-soft)]">
          {loading ? "Loading teachers…" : `${teachers.length} teacher${teachers.length === 1 ? "" : "s"}`}
        </p>
        <TeacherList teachers={teachers} loading={loading} />
      </div>
    </div>
  );
}
