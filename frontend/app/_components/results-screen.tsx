"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { FiDownload, FiEye, FiLock, FiSend, FiUnlock } from "react-icons/fi";
import { api, downloadFile } from "@/lib/api";
import { resultRows } from "@/lib/demo-data";
import { Button, SectionHeader } from "./ui";

export function ResultsScreen() {
  const [status, setStatus] = useState<Record<string, unknown> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  async function lifecycle(action: "compile" | "release" | "unrelease", form: HTMLFormElement) {
    const data = new FormData(form);
    try {
      const response = await api<Record<string, unknown>>(`/results/${action}`, {
        method: "POST",
        body: JSON.stringify({
          classId: data.get("classId"),
          termId: data.get("termId"),
        }),
      });
      setStatus(response);
      toast.success(`Result ${action}d`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Could not ${action}`);
    }
  }

  async function downloadPdf(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    try {
      await downloadFile(
        `/results/student/${data.get("studentId")}/pdf?termId=${data.get("termId")}`,
        "report-card.pdf",
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
            lifecycle("compile", event.currentTarget);
          }}
        >
          <h2 className="text-2xl font-black">Class result lifecycle</h2>
          <div className="mt-5 grid gap-4">
            <input className="field" name="classId" placeholder="Class ID ObjectId" required />
            <input className="field" name="termId" placeholder="Term ID ObjectId" required />
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <Button icon={FiLock}>Compile</Button>
            <Button type="button" variant="secondary" icon={FiSend} onClick={(event) => lifecycle("release", event.currentTarget.closest("form")!)}>
              Release
            </Button>
            <Button type="button" variant="danger" icon={FiUnlock} onClick={(event) => lifecycle("unrelease", event.currentTarget.closest("form")!)}>
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
          <input className="field" name="studentId" placeholder="Student ID ObjectId" required />
          <input className="field" name="termId" placeholder="Term ID ObjectId" required />
          <Button icon={FiDownload}>Download</Button>
        </div>
      </form>
    </div>
  );
}
