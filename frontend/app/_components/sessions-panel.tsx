"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiAlertCircle,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiRefreshCw,
} from "react-icons/fi";
import { api } from "@/lib/api";
import { validateSessionForm, validateTermForm } from "@/lib/admin-forms";
import type { AcademicSession, AcademicTerm } from "@/types/gradeflow";
import { Button, EmptyState, InlineError } from "./ui";

// ---------------------------------------------------------------------------
// TermRow
// ---------------------------------------------------------------------------

interface TermRowProps {
  term: AcademicTerm;
  sessionId: string;
  onSetCurrent: (termId: string) => void;
  onUpdated: (updated: AcademicTerm) => void;
}

function TermRow({ term, sessionId, onSetCurrent, onUpdated }: TermRowProps) {
  const [startDate, setStartDate] = useState(term.startDate ?? "");
  const [endDate, setEndDate] = useState(term.endDate ?? "");
  const [formError, setFormError] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [settingCurrent, setSettingCurrent] = useState(false);

  // Keep local date state in sync if parent updates the term
  useEffect(() => {
    setStartDate(term.startDate ?? "");
    setEndDate(term.endDate ?? "");
  }, [term.startDate, term.endDate]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateTermForm({ startDate, endDate });
    if (Object.keys(errors).length > 0) {
      setFormError(errors);
      return;
    }
    setSaving(true);
    try {
      const updated = await api<AcademicTerm>(`/academic/terms/${term._id}`, {
        method: "PATCH",
        body: JSON.stringify({ startDate, endDate }),
      });
      setFormError({});
      onUpdated(updated);
      toast.success("Term dates saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save term dates.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetCurrent() {
    setSettingCurrent(true);
    try {
      await api<AcademicTerm>(`/academic/terms/${term._id}/current`, {
        method: "PATCH",
      });
      onSetCurrent(term._id);
      toast.success(`${term.name} set as current term`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not set current term.");
    } finally {
      setSettingCurrent(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[rgba(83,97,87,.05)] p-4">
      {/* Term header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[var(--ink)]">{term.name}</span>
        {term.isCurrent && (
          <span className="inline-flex items-center rounded-full bg-[rgba(49,92,67,.12)] px-2.5 py-0.5 text-xs font-semibold text-[var(--moss)] border border-[rgba(49,92,67,.2)]">
            Current
          </span>
        )}
        {!term.isCurrent && (
          <Button
            variant="ghost"
            className="text-xs"
            onClick={handleSetCurrent}
            disabled={settingCurrent}
          >
            {settingCurrent ? "Setting…" : "Set as Current"}
          </Button>
        )}
      </div>

      {/* Date edit form */}
      <form onSubmit={handleSave} noValidate className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label
            htmlFor={`term-start-${term._id}`}
            className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]"
          >
            Start Date
          </label>
          <input
            id={`term-start-${term._id}`}
            type="date"
            className="field w-full"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setFormError((prev) => {
                const next = { ...prev };
                delete next.startDate;
                return next;
              });
            }}
            disabled={saving}
          />
          <InlineError message={formError.startDate} />
        </div>

        <div>
          <label
            htmlFor={`term-end-${term._id}`}
            className="mb-1 block text-xs font-semibold text-[var(--ink-soft)]"
          >
            End Date
          </label>
          <input
            id={`term-end-${term._id}`}
            type="date"
            className="field w-full"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setFormError((prev) => {
                const next = { ...prev };
                delete next.endDate;
                return next;
              });
            }}
            disabled={saving}
          />
          <InlineError message={formError.endDate} />
        </div>

        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" variant="secondary" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TermList
// ---------------------------------------------------------------------------

interface TermListProps {
  sessionId: string;
  terms: AcademicTerm[] | undefined;
  loading: boolean;
  onSetCurrent: (termId: string) => void;
  onTermUpdated: (updated: AcademicTerm) => void;
}

function TermList({ sessionId, terms, loading, onSetCurrent, onTermUpdated }: TermListProps) {
  if (loading) {
    return (
      <div className="mt-3 grid gap-2" aria-busy="true" aria-label="Loading terms">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-[rgba(83,97,87,.08)]" />
        ))}
      </div>
    );
  }

  if (!terms || terms.length === 0) {
    return (
      <p className="mt-3 text-sm text-[var(--ink-soft)]">No terms found for this session.</p>
    );
  }

  return (
    <div className="mt-3 grid gap-3">
      {terms.map((term) => (
        <TermRow
          key={term._id}
          term={term}
          sessionId={sessionId}
          onSetCurrent={onSetCurrent}
          onUpdated={onTermUpdated}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionRow
// ---------------------------------------------------------------------------

interface SessionRowProps {
  session: AcademicSession;
  expanded: boolean;
  terms: AcademicTerm[] | undefined;
  termsLoading: boolean;
  onToggleExpand: () => void;
  onSetCurrent: (sessionId: string) => void;
  onSetTermCurrent: (sessionId: string, termId: string) => void;
  onTermUpdated: (sessionId: string, updated: AcademicTerm) => void;
}

function SessionRow({
  session,
  expanded,
  terms,
  termsLoading,
  onToggleExpand,
  onSetCurrent,
  onSetTermCurrent,
  onTermUpdated,
}: SessionRowProps) {
  const [settingCurrent, setSettingCurrent] = useState(false);

  async function handleSetCurrent() {
    setSettingCurrent(true);
    try {
      await api<AcademicSession>(`/academic/sessions/${session._id}/current`, {
        method: "PATCH",
      });
      onSetCurrent(session._id);
      toast.success(`${session.name} set as current session`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not set current session.");
    } finally {
      setSettingCurrent(false);
    }
  }

  return (
    <div className="rounded-2xl bg-[rgba(255,253,247,.68)] border border-[rgba(83,97,87,.1)]">
      {/* Session header row */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <span className="flex-1 font-semibold text-[var(--ink)]">{session.name}</span>

        {session.isCurrent && (
          <span className="inline-flex items-center rounded-full bg-[rgba(49,92,67,.12)] px-2.5 py-0.5 text-xs font-semibold text-[var(--moss)] border border-[rgba(49,92,67,.2)]">
            Current
          </span>
        )}

        {!session.isCurrent && (
          <Button
            variant="ghost"
            className="text-xs"
            onClick={handleSetCurrent}
            disabled={settingCurrent}
          >
            {settingCurrent ? "Setting…" : "Set as Current"}
          </Button>
        )}

        <button
          type="button"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse terms" : "Expand terms"}
          onClick={onToggleExpand}
          className="focus-ring pressable grid size-8 place-items-center rounded-xl text-[var(--ink-soft)] hover:bg-[rgba(49,92,67,.08)]"
        >
          {expanded ? <FiChevronUp className="text-base" /> : <FiChevronDown className="text-base" />}
        </button>
      </div>

      {/* Expanded terms */}
      {expanded && (
        <div className="border-t border-[rgba(83,97,87,.1)] px-4 pb-4">
          <TermList
            sessionId={session._id}
            terms={terms}
            loading={termsLoading}
            onSetCurrent={(termId) => onSetTermCurrent(session._id, termId)}
            onTermUpdated={(updated) => onTermUpdated(session._id, updated)}
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionList
// ---------------------------------------------------------------------------

interface SessionListProps {
  sessions: AcademicSession[];
  loading: boolean;
  expandedSessionId: string | null;
  sessionTerms: Record<string, AcademicTerm[]>;
  termsLoadingFor: string | null;
  onToggleExpand: (sessionId: string) => void;
  onSetCurrent: (sessionId: string) => void;
  onSetTermCurrent: (sessionId: string, termId: string) => void;
  onTermUpdated: (sessionId: string, updated: AcademicTerm) => void;
}

function SessionList({
  sessions,
  loading,
  expandedSessionId,
  sessionTerms,
  termsLoadingFor,
  onToggleExpand,
  onSetCurrent,
  onSetTermCurrent,
  onTermUpdated,
}: SessionListProps) {
  if (loading) {
    return (
      <div className="mt-4 grid gap-2" aria-busy="true" aria-label="Loading sessions">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded-2xl bg-[rgba(83,97,87,.08)]" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="mt-4">
        <EmptyState icon={FiCalendar} message="No sessions yet. Create one above." />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {sessions.map((session) => (
        <SessionRow
          key={session._id}
          session={session}
          expanded={expandedSessionId === session._id}
          terms={sessionTerms[session._id]}
          termsLoading={termsLoadingFor === session._id}
          onToggleExpand={() => onToggleExpand(session._id)}
          onSetCurrent={onSetCurrent}
          onSetTermCurrent={onSetTermCurrent}
          onTermUpdated={onTermUpdated}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SessionsPanel
// ---------------------------------------------------------------------------

export function SessionsPanel() {
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [startYear, setStartYear] = useState("");
  const [sessionFormError, setSessionFormError] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionTerms, setSessionTerms] = useState<Record<string, AcademicTerm[]>>({});
  const [termsLoadingFor, setTermsLoadingFor] = useState<string | null>(null);

  async function fetchSessions() {
    setLoading(true);
    setFetchError(null);
    try {
      const data = await api<AcademicSession[]>("/academic/sessions");
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a, b) => b.startYear - a.startYear,
      );
      setSessions(sorted);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Could not load sessions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  async function handleCreateSession(e: React.FormEvent) {
    e.preventDefault();
    const errors = validateSessionForm({ startYear });
    if (Object.keys(errors).length > 0) {
      setSessionFormError(errors);
      return;
    }

    setSubmitting(true);
    try {
      const newSession = await api<AcademicSession>("/academic/sessions", {
        method: "POST",
        body: JSON.stringify({ startYear: Number(startYear), isCurrent: false }),
      });
      setSessions((prev) =>
        [newSession, ...prev].sort((a, b) => b.startYear - a.startYear),
      );
      setStartYear("");
      setSessionFormError({});
      toast.success("Session created");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create session.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleExpand(sessionId: string) {
    if (expandedSessionId === sessionId) {
      setExpandedSessionId(null);
      return;
    }

    setExpandedSessionId(sessionId);

    // Lazy-load terms if not already fetched
    if (!sessionTerms[sessionId]) {
      setTermsLoadingFor(sessionId);
      try {
        const terms = await api<AcademicTerm[]>(
          `/academic/terms?sessionId=${sessionId}`,
        );
        setSessionTerms((prev) => ({
          ...prev,
          [sessionId]: Array.isArray(terms) ? terms : [],
        }));
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Could not load terms.",
        );
        setSessionTerms((prev) => ({ ...prev, [sessionId]: [] }));
      } finally {
        setTermsLoadingFor(null);
      }
    }
  }

  function handleSetSessionCurrent(sessionId: string) {
    setSessions((prev) =>
      prev.map((s) => ({ ...s, isCurrent: s._id === sessionId })),
    );
  }

  function handleSetTermCurrent(sessionId: string, termId: string) {
    setSessionTerms((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] ?? []).map((t) => ({
        ...t,
        isCurrent: t._id === termId,
      })),
    }));
  }

  function handleTermUpdated(sessionId: string, updated: AcademicTerm) {
    setSessionTerms((prev) => ({
      ...prev,
      [sessionId]: (prev[sessionId] ?? []).map((t) =>
        t._id === updated._id ? updated : t,
      ),
    }));
  }

  if (fetchError) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <FiAlertCircle className="text-3xl text-[var(--danger)]" />
        <p className="text-sm text-[var(--ink-soft)]">{fetchError}</p>
        <Button variant="secondary" icon={FiRefreshCw} onClick={fetchSessions}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Create Session Form */}
      <form onSubmit={handleCreateSession} noValidate>
        <h3 className="text-base font-bold text-[var(--ink)]">Create a session</h3>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div className="min-w-[160px]">
            <label
              htmlFor="session-startYear"
              className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
            >
              Start Year <span aria-hidden="true" className="text-[var(--danger)]">*</span>
            </label>
            <input
              id="session-startYear"
              type="number"
              min="2000"
              max="2100"
              className="field w-full"
              value={startYear}
              onChange={(e) => {
                setStartYear(e.target.value);
                setSessionFormError((prev) => {
                  const next = { ...prev };
                  delete next.startYear;
                  return next;
                });
              }}
              aria-describedby={sessionFormError.startYear ? "session-startYear-error" : undefined}
              aria-invalid={!!sessionFormError.startYear}
              disabled={submitting}
              placeholder="e.g. 2024"
            />
            <InlineError id="session-startYear-error" message={sessionFormError.startYear} />
          </div>

          <Button type="submit" icon={FiCalendar} disabled={submitting}>
            {submitting ? "Creating…" : "Create Session"}
          </Button>
        </div>
      </form>

      {/* Session List */}
      <div className="mt-6 border-t border-[rgba(83,97,87,.12)] pt-4">
        <p className="text-sm font-semibold text-[var(--ink-soft)]">
          {loading
            ? "Loading sessions…"
            : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
        </p>
        <SessionList
          sessions={sessions}
          loading={loading}
          expandedSessionId={expandedSessionId}
          sessionTerms={sessionTerms}
          termsLoadingFor={termsLoadingFor}
          onToggleExpand={handleToggleExpand}
          onSetCurrent={handleSetSessionCurrent}
          onSetTermCurrent={handleSetTermCurrent}
          onTermUpdated={handleTermUpdated}
        />
      </div>
    </div>
  );
}
