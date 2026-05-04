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
