"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiLink, FiPlus, FiSearch, FiSend, FiUserPlus } from "react-icons/fi";
import { api } from "@/lib/api";
import { students as demoStudents } from "@/lib/demo-data";
import { Button, SectionHeader } from "./ui";

type StudentRow = (typeof demoStudents)[number];

export function StudentsScreen() {
  const [query, setQuery] = useState("");
  const [liveRows, setLiveRows] = useState<StudentRow[]>(demoStudents);
  const rows = useMemo(
    () =>
      liveRows.filter((student) =>
        `${student.name} ${student.studentId} ${student.className}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [liveRows, query],
  );

  useEffect(() => {
    api<{ students: unknown[] }>("/students")
      .then((payload) => {
        if (!Array.isArray(payload.students)) return;
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
      })
      .catch(() => undefined);
  }, []);

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

  return (
    <div className="grid gap-7">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <SectionHeader
          eyebrow="Student lifecycle"
          title="Enrollment without spreadsheet fog."
          copy="Create students, link parents, transfer classes, and keep status changes visible."
        />
        <div className="flex gap-2">
          <Button icon={FiUserPlus}>Add student</Button>
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
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-separate border-spacing-y-2 text-left">
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
                  <td className="px-4 py-4">{student.status}</td>
                  <td className="px-4 py-4">{student.fee}</td>
                  <td className="px-4 py-4 font-black">{student.average}%</td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" icon={FiLink} onClick={() => linkParent(student.id)}>
                        Parent
                      </Button>
                      <Button variant="ghost" icon={FiPlus}>Transfer</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
