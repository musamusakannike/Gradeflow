"use client";

import { FiBook, FiBookOpen, FiCalendar, FiLink, FiUsers } from "react-icons/fi";
import { Panel, SectionHeader } from "./ui";
import { TeachersPanel } from "./teachers-panel";
import { ClassesPanel } from "./classes-panel";
import { SubjectsPanel } from "./subjects-panel";
import { AssignmentsPanel } from "./assignments-panel";
import { SessionsPanel } from "./sessions-panel";

export function AcademicsScreen() {
  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Academic structure"
        title="Academics"
        copy="Manage teachers, classes, subjects, and subject-teacher assignments for your school."
      />

      <div className="grid gap-4">
        <Panel
          icon={FiUsers}
          title="Teachers"
          description="Add and manage teacher accounts for your school."
          defaultOpen={true}
        >
          <TeachersPanel />
        </Panel>

        <Panel
          icon={FiBook}
          title="Classes"
          description="Create and organise classes, set capacity, and manage per-class subjects."
          defaultOpen={false}
        >
          <ClassesPanel />
        </Panel>

        <Panel
          icon={FiBookOpen}
          title="Subjects"
          description="Manage the school-wide subject catalog with codes and active status."
          defaultOpen={false}
        >
          <SubjectsPanel />
        </Panel>

        <Panel
          icon={FiLink}
          title="Assignments"
          description="Connect teachers to subjects and classes for each academic session."
          defaultOpen={false}
        >
          <AssignmentsPanel />
        </Panel>

        <Panel
          icon={FiCalendar}
          title="Sessions & Terms"
          description="Create academic sessions and manage term dates and current status."
          defaultOpen={false}
        >
          <SessionsPanel />
        </Panel>
      </div>
    </div>
  );
}
