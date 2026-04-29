"use client";

import toast from "react-hot-toast";
import { FiBookOpen, FiCalendar, FiLayers, FiPlus, FiUserCheck } from "react-icons/fi";
import { api } from "@/lib/api";
import { Button, SectionHeader } from "./ui";

export function AcademicsScreen() {
  async function createSession(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/academic/sessions", {
        method: "POST",
        body: JSON.stringify({
          startYear: Number(form.get("startYear")),
          isCurrent: form.get("isCurrent") === "on",
        }),
      });
      toast.success("Session and terms created");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create session");
    }
  }

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Academic structure"
        title="The timetable spine of the school."
        copy="Create sessions and terms, arrange classes, assign class teachers, and wire subjects to teachers."
      />

      <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <form onSubmit={createSession} className="surface rounded-[28px] p-5">
          <FiCalendar className="text-3xl text-[var(--moss)]" />
          <h2 className="mt-5 text-2xl font-black">Create academic session</h2>
          <p className="mt-2 text-[var(--ink-soft)]">
            The backend automatically prepares first, second, and third term.
          </p>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">
              Start year
              <input className="field" name="startYear" type="number" min="2000" placeholder="2026" required />
            </label>
            <label className="flex items-center gap-3 text-sm font-bold">
              <input name="isCurrent" type="checkbox" className="size-5 accent-[var(--moss)]" />
              Set as current session
            </label>
          </div>
          <Button className="mt-6 w-full" icon={FiPlus}>Create session</Button>
        </form>

        <section className="grid gap-4 md:grid-cols-2">
          {[
            [FiLayers, "Classes", "Create JSS/SS classes, capacity, section, and class teacher."],
            [FiBookOpen, "Subjects", "Build a school subject catalog with codes and active status."],
            [FiUserCheck, "Assignments", "Connect class + subject + teacher for each academic session."],
            [FiCalendar, "Terms", "Set current term and edit start/end dates as the calendar shifts."],
          ].map(([Icon, title, copy]) => {
            const CardIcon = Icon as typeof FiLayers;
            return (
              <div key={title as string} className="surface rounded-[28px] p-5">
                <CardIcon className="text-3xl text-[var(--clay)]" />
                <h3 className="mt-6 text-xl font-black">{title as string}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-soft)]">{copy as string}</p>
                <Button variant="secondary" className="mt-5 w-full">Open</Button>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}
