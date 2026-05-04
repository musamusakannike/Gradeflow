/**
 * Pure validation and utility functions for admin management forms.
 * No React dependencies — fully testable with Vitest.
 */

// ---------------------------------------------------------------------------
// Teacher form
// ---------------------------------------------------------------------------

export function validateTeacherForm(
  data: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  if (!data.email || data.email.trim() === "") {
    errors.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Class form
// ---------------------------------------------------------------------------

export function validateClassForm(
  data: Partial<{
    name: string;
    level: number | string;
    section: string;
    capacity: number | string;
  }>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || String(data.name).trim().length < 2) {
    errors.name = "Class name must be at least 2 characters.";
  }

  const level = Number(data.level);
  if (data.level === undefined || data.level === null || data.level === "") {
    errors.level = "Level is required.";
  } else if (!Number.isFinite(level) || level < 1 || level > 12) {
    errors.level = "Level must be a number between 1 and 12.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Subject form
// ---------------------------------------------------------------------------

export function validateSubjectForm(
  data: Partial<{
    name: string;
    description: string;
  }>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 2) {
    errors.name = "Subject name must be at least 2 characters.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Assignment form
// ---------------------------------------------------------------------------

export function validateAssignmentForm(
  data: Partial<{
    teacherIds: string[];
    subjectIds: string[];
    classId: string;
  }>,
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.teacherIds || data.teacherIds.length === 0) {
    errors.teacherIds = "Please select at least one teacher.";
  }

  if (!data.subjectIds || data.subjectIds.length === 0) {
    errors.subjectIds = "Please select at least one subject.";
  }

  if (!data.classId || data.classId.trim() === "") {
    errors.classId = "Please select a class.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Subject filter utility
// ---------------------------------------------------------------------------

export function filterSubjectsByClass(
  subjects: Array<{ id: string; classId?: string; [key: string]: unknown }>,
  classId: string,
): Array<{ id: string; classId?: string; [key: string]: unknown }> {
  return subjects.filter((subject) => subject.classId === classId);
}

// ---------------------------------------------------------------------------
// API error → field error mapper
// ---------------------------------------------------------------------------

export function mapApiErrorToFieldError(error: {
  status?: number;
  message?: string;
}): Record<string, string> {
  if (error.status !== 409 || !error.message) {
    return {};
  }

  const msg = error.message.toLowerCase();

  if (msg.includes("email")) {
    return { email: error.message };
  }

  if (msg.includes("assignment")) {
    return { assignment: error.message };
  }

  if (msg.includes("name")) {
    return { name: error.message };
  }

  return {};
}

// ---------------------------------------------------------------------------
// Session form
// ---------------------------------------------------------------------------

export function validateSessionForm(data: {
  startYear: string | number;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  const raw = String(data.startYear ?? "").trim();
  if (raw === "") {
    errors.startYear = "Start year is required.";
  } else {
    const year = Number(raw);
    if (!Number.isFinite(year) || isNaN(year) || raw !== String(Math.floor(year))) {
      errors.startYear = "Start year must be a whole number.";
    } else if (year < 2000 || year > 2100) {
      errors.startYear = "Start year must be between 2000 and 2100.";
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Term form
// ---------------------------------------------------------------------------

export function validateTermForm(data: {
  startDate: string;
  endDate: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.startDate || data.startDate.trim() === "") {
    errors.startDate = "Start date is required.";
  }

  if (!data.endDate || data.endDate.trim() === "") {
    errors.endDate = "End date is required.";
  } else if (data.startDate && data.startDate.trim() !== "" && data.endDate < data.startDate) {
    errors.endDate = "End date must not be earlier than start date.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Student enrollment form
// ---------------------------------------------------------------------------

export function validateStudentForm(data: {
  firstName?: string;
  lastName?: string;
  gender?: string;
  classId?: string;
  guardianName?: string;
  guardianPhone?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = "First name must be at least 2 characters.";
  }

  if (!data.lastName || data.lastName.trim().length < 2) {
    errors.lastName = "Last name must be at least 2 characters.";
  }

  if (!data.gender || data.gender.trim() === "") {
    errors.gender = "Gender is required.";
  }

  if (!data.classId || data.classId.trim() === "") {
    errors.classId = "Class is required.";
  }

  if (!data.guardianName || data.guardianName.trim().length < 2) {
    errors.guardianName = "Guardian name must be at least 2 characters.";
  }

  if (!data.guardianPhone || data.guardianPhone.trim() === "") {
    errors.guardianPhone = "Guardian phone is required.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Student transfer form
// ---------------------------------------------------------------------------

export function validateTransferForm(data: {
  classId?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.classId || data.classId.trim() === "") {
    errors.classId = "Please select a class.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Results lifecycle form (compile / release / unrelease)
// ---------------------------------------------------------------------------

export function validateResultsLifecycleForm(data: {
  classId?: string;
  termId?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.classId || data.classId.trim() === "") {
    errors.classId = "Please select a class.";
  }

  if (!data.termId || data.termId.trim() === "") {
    errors.termId = "Please select a term.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// PDF download form
// ---------------------------------------------------------------------------

export function validatePdfDownloadForm(data: {
  studentId?: string;
  termId?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.studentId || data.studentId.trim() === "") {
    errors.studentId = "Please select a student.";
  }

  if (!data.termId || data.termId.trim() === "") {
    errors.termId = "Please select a term.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Fee status form
// ---------------------------------------------------------------------------

export function validateFeeStatusForm(data: {
  studentId?: string;
  termId?: string;
  amountExpected?: number | string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.studentId || String(data.studentId).trim() === "") {
    errors.studentId = "Please select a student.";
  }

  if (!data.termId || String(data.termId).trim() === "") {
    errors.termId = "Please select a term.";
  }

  const amount = Number(data.amountExpected);
  if (data.amountExpected === undefined || data.amountExpected === null || String(data.amountExpected).trim() === "") {
    errors.amountExpected = "Amount expected is required.";
  } else if (!Number.isFinite(amount) || amount <= 0) {
    errors.amountExpected = "Amount expected must be a positive number.";
  }

  return errors;
}

// ---------------------------------------------------------------------------
// PDF filename generation
// ---------------------------------------------------------------------------

export function generatePdfFilename(studentId: string, termName: string): string {
  const sanitizedStudentId = studentId.replace(/[/\s]+/g, "-");
  const sanitizedTermName = termName.replace(/[/\s]+/g, "-");
  return `${sanitizedStudentId}-${sanitizedTermName}.pdf`.toLowerCase();
}

// ---------------------------------------------------------------------------
// Student search filter
// ---------------------------------------------------------------------------

export function filterStudents(
  rows: Array<{ name: string; studentId: string; className: string }>,
  query: string,
): Array<{ name: string; studentId: string; className: string }> {
  if (!query || query.trim() === "") {
    return rows;
  }
  const q = query.toLowerCase();
  return rows.filter(
    (row) =>
      row.name.toLowerCase().includes(q) ||
      row.studentId.toLowerCase().includes(q) ||
      row.className.toLowerCase().includes(q),
  );
}
