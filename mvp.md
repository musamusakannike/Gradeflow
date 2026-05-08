# GradeFlow MVP Gap Analysis

### What's Already Done

**Server — essentially feature-complete:**
- Auth (JWT, Google OAuth, password reset, multi-tenancy)
- Academic structure (sessions, terms, classes, subjects, assignments)
- Staff & student management (full CRUD, bulk create, parent linking)
- Score entry (single + bulk, teacher authorization, lock guard)
- Result lifecycle (compile → release → unrelease, fee-gate, PDF generation)
- Finance (manual fee status, Paystack integration, webhooks, stats)
- Dashboard stats, school profile, notifications (email + push)

**Frontend — admin side is solid:**
- Login / register school
- Dashboard with live stats
- Students screen (add, transfer, status, parent link)
- Academics screen (teachers, classes, subjects, assignments, sessions/terms)
- Results screen (compile/release/unrelease, PDF download)
- Finance screen (fee status management, term stats)
- Settings screen (school profile)

---

### What's Missing for MVP

These are the gaps, ordered by priority:

**P0 — Core user flows (blocking MVP)**

1. **Teacher score entry UI** — The most critical gap. Backend has `/scores` and `/scores/bulk` fully built, but there's zero frontend for teachers to enter test1, test2, exam marks. This is the heart of the system.

2. **Student result viewing screen** — Students need a page to log in and see their results (or the "pay your fees" gate). Backend supports it at `GET /results/student/:id` with fee-check built in.

**P1 — Role-based experience (important for usability)**

3. **Role-based navigation/dashboards** — Currently every role sees the same admin nav. Teachers should land on score entry; students should land on their results; bursars on finance. The sidebar needs to conditionally render based on `user.role`.

4. **Class analytics UI** — The "Analytics" button on the Results screen is a stub. Backend has `GET /results/class/:classId/analytics` with pass rates, averages, highest/lowest. Wire it up.

5. **Class broadsheet view** — `GET /results/class/:classId` (full class results table) has no frontend.

**P2 — Polish (nice to have for MVP)**

6. **Bulk student CSV upload** — Button exists in Students screen but is a stub. Backend has `POST /students/bulk`.
7. **Replace demo chart data** — Dashboard and Results charts use hardcoded `demo-data.ts`. Wire to real API.
8. **Edit/deactivate for teachers, classes, subjects** — Only create + list exists in the UI.
9. **Student detail page** — No drill-down from the student list.
10. **Grading scale customization** in Settings.

---

### Recommended Build Order

```
Phase 1 (P0 — unblocks the core loop):
  1. Score entry screen (teacher view) — select class → subject → term → enter marks per student
  2. Student result page — /my-results or /results/[studentId] with fee-gate message

Phase 2 (P1 — makes it role-aware):
  3. Role-based nav (hide admin sections from teachers/students/bursars)
  4. Class analytics modal/page wired to real API
  5. Class broadsheet table

Phase 3 (P2 — polish):
  6. Bulk student upload
  7. Real chart data
  8. Edit flows for teachers/classes/subjects
```
