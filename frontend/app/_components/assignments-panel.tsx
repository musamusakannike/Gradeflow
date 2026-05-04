"use client";

import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCheckSquare,
  FiRefreshCw,
  FiSquare,
  FiTrash2,
  FiUsers,
} from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { validateAssignmentForm } from "@/lib/admin-forms";
import type { Assignment, SchoolClass, Subject, Teacher } from "@/types/gradeflow";
import { Button, EmptyState, InlineError } from "./ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getTeacherFullName(teacher: Teacher): string {
  return `${teacher.firstName} ${teacher.lastName}`;
}

// ---------------------------------------------------------------------------
// CheckboxList — reusable multi-select checkbox list
// ---------------------------------------------------------------------------

interface CheckboxListProps {
  id: string;
  items: Array<{ id: string; label: string }>;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
  errorId?: string;
}

function CheckboxList({
  id,
  items,
  selectedIds,
  onChange,
  disabled,
  emptyMessage,
  errorId,
}: CheckboxListProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-soft)] italic">
        {emptyMessage ?? "No items available."}
      </p>
    );
  }

  function toggle(itemId: string) {
    if (selectedIds.includes(itemId)) {
      onChange(selectedIds.filter((i) => i !== itemId));
    } else {
      onChange([...selectedIds, itemId]);
    }
  }

  return (
    <ul
      role="group"
      aria-labelledby={id}
      aria-describedby={errorId}
      className="max-h-48 overflow-y-auto rounded-2xl border border-[rgba(83,97,87,.18)] bg-[rgba(255,253,247,.5)] divide-y divide-[rgba(83,97,87,.08)]"
    >
      {items.map((item) => {
        const checked = selectedIds.includes(item.id);
        return (
          <li key={item.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                disabled
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-[rgba(49,92,67,.05)]"
              }`}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={checked}
                onChange={() => !disabled && toggle(item.id)}
                disabled={disabled}
              />
              {checked ? (
                <FiCheckSquare className="shrink-0 text-base text-[var(--moss)]" />
              ) : (
                <FiSquare className="shrink-0 text-base text-[var(--ink-soft)]" />
              )}
              <span className={checked ? "font-semibold text-[var(--ink)]" : "text-[var(--ink-soft)]"}>
                {item.label}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// AssignmentList
// ---------------------------------------------------------------------------

interface AssignmentListProps {
  assignments: Assignment[];
  loading: boolean;
  removingId: string | null;
  onRemove: (assignment: Assignment) => void;
}

function AssignmentList({
  assignments,
  loading,
  removingId,
  onRemove,
}: AssignmentListProps) {
  if (loading) {
    return (
      <div
        className="mt-4 grid gap-2"
        aria-busy="true"
        aria-label="Loading assignments"
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

  if (assignments.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState
          icon={FiUsers}
          message="No assignments yet. Create one using the form above."
        />
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-left">
        <thead className="text-xs uppercase tracking-[0.16em] text-[var(--ink-soft)]">
          <tr>
            <th className="px-4 py-2">Teacher</th>
            <th className="px-4 py-2">Class</th>
            <th className="px-4 py-2">Subject</th>
            <th className="px-4 py-2 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => {
            const isRemoving = removingId === assignment.id;
            const teacherName = assignment.teacher
              ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
              : "—";
            const className = assignment.class?.name ?? "—";
            const subjectName = assignment.subject?.name ?? "—";

            return (
              <tr
                key={assignment.id}
                className={`bg-[rgba(255,253,247,.68)] transition-opacity ${isRemoving ? "opacity-50" : ""}`}
              >
                <td className="rounded-l-2xl px-4 py-3 font-semibold text-[var(--ink)]">
                  {teacherName}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--ink-soft)]">
                  {className}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--ink-soft)]">
                  {subjectName}
                </td>
                <td className="rounded-r-2xl px-4 py-3 text-right">
                  <Button
                    variant="danger"
                    icon={FiTrash2}
                    disabled={isRemoving}
                    onClick={() => onRemove(assignment)}
                    aria-label={`Remove assignment: ${teacherName} — ${subjectName}`}
                  >
                    {isRemoving ? "Removing…" : "Remove"}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CreateAssignmentForm
// ---------------------------------------------------------------------------

interface CreateAssignmentFormProps {
  teachers: Teacher[];
  classes: SchoolClass[];
  subjects: Subject[];
  currentSessionId: string | null;
  onCreated: (newAssignments: Assignment[]) => void;
}

function CreateAssignmentForm({
  teachers,
  classes,
  subjects,
  currentSessionId,
  onCreated,
}: CreateAssignmentFormProps) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<Record<string, string>>({});

  // Refs for focus management on validation failure
  const classRef = useRef<HTMLSelectElement>(null);
  const teachersErrorRef = useRef<HTMLParagraphElement>(null);
  const subjectsErrorRef = useRef<HTMLParagraphElement>(null);

  // Filter subjects by selected class — since Subject doesn't have classId,
  // we show all subjects when a class is selected (the backend handles the
  // actual class-subject relationship via ClassSubject records).
  const availableSubjects = selectedClassId ? subjects : [];

  const teacherItems = teachers.map((t) => ({
    id: t.id,
    label: getTeacherFullName(t),
  }));

  const subjectItems = availableSubjects.map((s) => ({
    id: s.id,
    label: s.name,
  }));

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

    const errors = validateAssignmentForm({
      teacherIds: selectedTeacherIds,
      subjectIds: selectedSubjectIds,
      classId: selectedClassId,
    });

    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      // Focus first error field
      if (errors.classId) classRef.current?.focus();
      else if (errors.teacherIds) teachersErrorRef.current?.focus();
      else if (errors.subjectIds) subjectsErrorRef.current?.focus();
      return;
    }

    setSubmitting(true);
    setFormError({});

    const newAssignments: Assignment[] = [];
    let hadConflict = false;
    let hadError = false;

    try {
      // Create one assignment per teacherId × subjectId combination
      for (const teacherId of selectedTeacherIds) {
        for (const subjectId of selectedSubjectIds) {
          try {
            const assignment = await api<Assignment>("/subjects/assign", {
              method: "POST",
              body: JSON.stringify({
                classId: selectedClassId,
                subjectId,
                teacherId,
                sessionId: currentSessionId,
              }),
            });
            newAssignments.push(assignment);
          } catch (error) {
            if (error instanceof ApiError && error.status === 409) {
              hadConflict = true;
            } else {
              hadError = true;
            }
          }
        }
      }

      if (newAssignments.length > 0) {
        // Build success message with teacher and subject names
        const teacherNames = selectedTeacherIds
          .map((id) => {
            const t = teachers.find((t) => t.id === id);
            return t ? getTeacherFullName(t) : id;
          })
          .join(", ");
        const subjectNames = selectedSubjectIds
          .map((id) => {
            const s = subjects.find((s) => s.id === id);
            return s ? s.name : id;
          })
          .join(", ");

        toast.success(
          `Assigned ${subjectNames} to ${teacherNames}`,
        );

        // Reset form selections
        setSelectedClassId("");
        setSelectedTeacherIds([]);
        setSelectedSubjectIds([]);
        setFormError({});

        onCreated(newAssignments);
      }

      if (hadConflict) {
        setFormError({
          assignment:
            "Some assignments already exist and were skipped. Others were created successfully.",
        });
      }

      if (hadError && newAssignments.length === 0) {
        toast.error("Could not create assignments. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <h3 className="text-base font-bold text-[var(--ink)]">
        Create an assignment
      </h3>

      {/* No current session warning */}
      {!currentSessionId && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-2xl border border-[rgba(182,69,69,.2)] bg-[rgba(182,69,69,.06)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
          No active academic session found. Please create a current session
          before making assignments.
        </div>
      )}

      {/* Form-level error (409 conflict) */}
      {formError.assignment && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-2xl border border-[rgba(182,69,69,.2)] bg-[rgba(182,69,69,.06)] px-4 py-3 text-sm text-[var(--danger)]"
        >
          <FiAlertCircle className="mt-0.5 shrink-0 text-base" />
          {formError.assignment}
        </div>
      )}

      <div className="mt-4 grid gap-5 sm:grid-cols-3">
        {/* Class selector */}
        <div>
          <label
            htmlFor="assignment-class"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Class{" "}
            <span aria-hidden="true" className="text-[var(--danger)]">
              *
            </span>
          </label>
          <select
            ref={classRef}
            id="assignment-class"
            className="field w-full"
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSubjectIds([]);
              clearFieldError("classId");
            }}
            aria-describedby={
              formError.classId ? "assignment-class-error" : undefined
            }
            aria-invalid={!!formError.classId}
            disabled={submitting}
          >
            <option value="">Select a class…</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
          <InlineError id="assignment-class-error" message={formError.classId} />
        </div>

        {/* Teacher multi-select */}
        <div>
          <p
            id="assignment-teachers-label"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Teacher(s){" "}
            <span aria-hidden="true" className="text-[var(--danger)]">
              *
            </span>
          </p>
          <CheckboxList
            id="assignment-teachers-label"
            items={teacherItems}
            selectedIds={selectedTeacherIds}
            onChange={(ids) => {
              setSelectedTeacherIds(ids);
              clearFieldError("teacherIds");
            }}
            disabled={submitting}
            emptyMessage="No teachers available."
            errorId={formError.teacherIds ? "assignment-teachers-error" : undefined}
          />
          <InlineError
            ref={teachersErrorRef}
            id="assignment-teachers-error"
            message={formError.teacherIds}
          />
        </div>

        {/* Subject multi-select */}
        <div>
          <p
            id="assignment-subjects-label"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Subject(s){" "}
            <span aria-hidden="true" className="text-[var(--danger)]">
              *
            </span>
          </p>
          {!selectedClassId ? (
            <p className="text-sm text-[var(--ink-soft)] italic">
              Select a class first.
            </p>
          ) : (
            <CheckboxList
              id="assignment-subjects-label"
              items={subjectItems}
              selectedIds={selectedSubjectIds}
              onChange={(ids) => {
                setSelectedSubjectIds(ids);
                clearFieldError("subjectIds");
              }}
              disabled={submitting}
              emptyMessage="No subjects available."
              errorId={formError.subjectIds ? "assignment-subjects-error" : undefined}
            />
          )}
          <InlineError
            ref={subjectsErrorRef}
            id="assignment-subjects-error"
            message={formError.subjectIds}
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="submit"
          icon={FiUsers}
          disabled={submitting || !currentSessionId}
        >
          {submitting ? "Assigning…" : "Create Assignment"}
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// AssignmentsPanel
// ---------------------------------------------------------------------------

interface AcademicSession {
  id: string;
  name: string;
  isCurrent: boolean;
}

export function AssignmentsPanel() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function fetchAll() {
    setLoading(true);
    setFetchError(null);
    try {
      const [assignmentsData, teachersData, classesData, subjectsData, sessionsData] =
        await Promise.all([
          api<Assignment[]>("/subjects/assignments"),
          api<Teacher[]>("/staff?role=teacher"),
          api<SchoolClass[]>("/classes"),
          api<Subject[]>("/subjects"),
          api<AcademicSession[]>("/academic/sessions?isCurrent=true").catch(
            () => [] as AcademicSession[],
          ),
        ]);

      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setTeachers(Array.isArray(teachersData) ? teachersData : []);
      setClasses(Array.isArray(classesData) ? classesData : []);
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

      // Extract current session ID
      const sessions = Array.isArray(sessionsData) ? sessionsData : [];
      const currentSession = sessions.find((s) => s.isCurrent) ?? sessions[0] ?? null;
      setCurrentSessionId(currentSession?.id ?? null);
    } catch (error) {
      setFetchError(
        error instanceof Error
          ? error.message
          : "Could not load assignments data.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function handleAssignmentsCreated(newAssignments: Assignment[]) {
    setAssignments((prev) => [...newAssignments, ...prev]);
  }

  async function handleRemove(assignment: Assignment) {
    const confirmed = window.confirm(
      `Remove assignment for ${
        assignment.teacher
          ? `${assignment.teacher.firstName} ${assignment.teacher.lastName}`
          : "this teacher"
      } — ${assignment.subject?.name ?? "this subject"}?`,
    );
    if (!confirmed) return;

    setRemovingId(assignment.id);
    try {
      await api(`/subjects/assignments/${assignment.id}`, {
        method: "DELETE",
      });
      setAssignments((prev) => prev.filter((a) => a.id !== assignment.id));
      toast.success("Assignment removed.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not remove assignment. Please try again.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FiAlertCircle className="text-3xl text-[var(--danger)]" />
        <p className="text-sm text-[var(--ink-soft)]">{fetchError}</p>
        <Button variant="secondary" icon={FiRefreshCw} onClick={fetchAll}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      <CreateAssignmentForm
        teachers={teachers}
        classes={classes}
        subjects={subjects}
        currentSessionId={currentSessionId}
        onCreated={handleAssignmentsCreated}
      />
      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-[var(--ink-soft)]">
          {loading
            ? "Loading assignments…"
            : `${assignments.length} assignment${assignments.length === 1 ? "" : "s"}`}
        </p>
        <AssignmentList
          assignments={assignments}
          loading={loading}
          removingId={removingId}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
}
