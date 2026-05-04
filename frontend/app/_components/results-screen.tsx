"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiDownload, FiEye, FiLock, FiSend, FiUnlock } from "react-icons/fi";
import { api, downloadFile } from "@/lib/api";
import { resultRows } from "@/lib/demo-data";
import {
  validateResultsLifecycleForm,
  validatePdfDownloadForm,
  generatePdfFilename,
} from "@/lib/admin-forms";
import { AcademicTerm, SchoolClass, StudentOption } from "@/types/gradeflow";
import { Button, InlineError, SectionHeader } from "./ui";

export function ResultsScreen() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [mounted, setMounted] = useState(false);

  // Shared reference data
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<AcademicTerm[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);

  // Lifecycle form state
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedTermId, setSelectedTermId] = useState("");
  const [lifecycleErrors, setLifecycleErrors] = useState<Record<string, string>>({});

  // PDF download form state
  const [pdfStudentId, setPdfStudentId] = useState("");
  const [pdfTermId, setPdfTermId] = useState("");
  const [pdfErrors, setPdfErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
    Promise.all([
      api<SchoolClass[]>("/classes"),
      api<AcademicTerm[]>("/academic/terms"),
      api<{ students: Array<{ _id: string; studentId: string; user?: { firstName?: string; lastName?: string } }> }>("/students"),
    ])
      .then(([classesData, termsData, studentsData]) => {
        setClasses(classesData);
        setTerms(termsData);
        setStudents(
          studentsData.students.map((s) => ({
            _id: s._id,
            studentId: s.studentId,
            displayName: `${s.user?.firstName || ""} ${s.user?.lastName || ""} (${s.studentId})`.trim(),
          })),
        );
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Could not load reference data");
      });
  }, []);

  async function lifecycle(action: "compile" | "release" | "unrelease") {
    const errors = validateResultsLifecycleForm({
      classId: selectedClassId,
      termId: selectedTermId,
    });
    if (Object.keys(errors).length > 0) {
      setLifecycleErrors(errors);
      return;
    }
    try {
      const response = await api<Record<string, unknown>>(`/results/${action}`, {
        method: "POST",
        body: JSON.stringify({ classId: selectedClassId, termId: selectedTermId }),
      });
      setStatus(response);
      toast.success(`Result ${action}d`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Could not ${action}`);
    }
  }

  async function downloadPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validatePdfDownloadForm({
      studentId: pdfStudentId,
      termId: pdfTermId,
    });
    if (Object.keys(errors).length > 0) {
      setPdfErrors(errors);
      return;
    }
    const student = students.find((s) => s._id === pdfStudentId);
    const term = terms.find((t) => t._id === pdfTermId);
    const filename =
      student && term ? generatePdfFilename(student.studentId, term.name) : "report-card.pdf";
    try {
      await downloadFile(
        `/results/student/${pdfStudentId}/pdf?termId=${pdfTermId}`,
        filename,
      );
      toast.success("PDF download started");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not download PDF");
    }
  }

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Assessment"
        title="Compile, lock, release, and explain results."
        copy="Teachers can enter scores until release. Students and parents see results only when fees are paid and release is live."
      />
      <div className="grid gap-5 xl:grid-cols-[.92fr_1.08fr]">
        <form
          className="surface rounded-[28px] p-5"
          onSubmit={(event) => {
            event.preventDefault();
            lifecycle("compile");
          }}
        >
          <h2 className="text-2xl font-black">Class result lifecycle</h2>
          <div className="mt-5 grid gap-4">
            <div>
              <select
                className="field"
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setLifecycleErrors((prev) => ({ ...prev, classId: "" }));
                }}
              >
                <option value="">Select a class…</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <InlineError message={lifecycleErrors.classId} />
            </div>
            <div>
              <select
                className="field"
                value={selectedTermId}
                onChange={(e) => {
                  setSelectedTermId(e.target.value);
                  setLifecycleErrors((prev) => ({ ...prev, termId: "" }));
                }}
              >
                <option value="">Select a term…</option>
                {terms.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <InlineError message={lifecycleErrors.termId} />
            </div>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button icon={FiLock}>Compile</Button>
            <Button
              type="button"
              variant="secondary"
              icon={FiSend}
              onClick={() => lifecycle("release")}
            >
              Release
            </Button>
            <Button
              type="button"
              variant="danger"
              icon={FiUnlock}
              onClick={() => lifecycle("unrelease")}
            >
              Unrelease
            </Button>
          </div>
          <pre className="mt-5 max-h-52 overflow-auto rounded-2xl bg-[var(--night)] p-4 text-xs text-[var(--paper)]">
            {JSON.stringify(status || { status: "waiting for action" }, null, 2)}
          </pre>
        </form>

        <section className="surface rounded-[28px] p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black">Subject spread</h2>
            <Button variant="secondary" icon={FiEye}>Analytics</Button>
          </div>
          <div className="mt-5 h-[280px]">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={resultRows}>
                  <XAxis dataKey="subject" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="total" fill="#315c43" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </section>
      </div>

      <form onSubmit={downloadPdf} className="surface rounded-[28px] p-5">
        <h2 className="text-2xl font-black">Download report card PDF</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <div>
            <select
              className="field"
              value={pdfStudentId}
              onChange={(e) => {
                setPdfStudentId(e.target.value);
                setPdfErrors((prev) => ({ ...prev, studentId: "" }));
              }}
            >
              <option value="">Select a student…</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.displayName}
                </option>
              ))}
            </select>
            <InlineError message={pdfErrors.studentId} />
          </div>
          <div>
            <select
              className="field"
              value={pdfTermId}
              onChange={(e) => {
                setPdfTermId(e.target.value);
                setPdfErrors((prev) => ({ ...prev, termId: "" }));
              }}
            >
              <option value="">Select a term…</option>
              {terms.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name}
                </option>
              ))}
            </select>
            <InlineError message={pdfErrors.termId} />
          </div>
          <Button icon={FiDownload}>Download</Button>
        </div>
      </form>
    </div>
  );
}
