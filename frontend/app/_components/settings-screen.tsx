"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiSave, FiSettings, FiTrash2 } from "react-icons/fi";
import { api } from "@/lib/api";
import { Button, InlineError, SectionHeader } from "./ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface GradeRow {
  min: number;
  max: number;
  grade: string;
  remark: string;
}

// ---------------------------------------------------------------------------
// Default grading scale
// ---------------------------------------------------------------------------

const DEFAULT_GRADES: GradeRow[] = [
  { min: 70, max: 100, grade: "A", remark: "Excellent" },
  { min: 60, max: 69,  grade: "B", remark: "Very Good" },
  { min: 50, max: 59,  grade: "C", remark: "Good" },
  { min: 45, max: 49,  grade: "D", remark: "Pass" },
  { min: 40, max: 44,  grade: "E", remark: "Weak Pass" },
  { min: 0,  max: 39,  grade: "F", remark: "Fail" },
];

// ---------------------------------------------------------------------------
// Validation helper
// ---------------------------------------------------------------------------

function validateGradeRows(
  rows: GradeRow[],
): Record<number, Partial<Record<keyof GradeRow, string>>> {
  const errors: Record<number, Partial<Record<keyof GradeRow, string>>> = {};
  rows.forEach((row, i) => {
    const rowErrors: Partial<Record<keyof GradeRow, string>> = {};
    if (!Number.isInteger(row.min) || row.min < 0 || row.min > 100)
      rowErrors.min = "Must be an integer 0–100";
    if (!Number.isInteger(row.max) || row.max < 0 || row.max > 100)
      rowErrors.max = "Must be an integer 0–100";
    if (Number.isInteger(row.min) && Number.isInteger(row.max) && row.min >= row.max)
      rowErrors.min = "Min must be less than max";
    if (row.grade.length > 5) rowErrors.grade = "Max 5 characters";
    if (row.remark.length > 50) rowErrors.remark = "Max 50 characters";
    // Check overlap with other rows
    rows.forEach((other, j) => {
      if (
        i !== j &&
        Number.isInteger(row.min) &&
        Number.isInteger(row.max) &&
        Number.isInteger(other.min) &&
        Number.isInteger(other.max)
      ) {
        if (row.min < other.max && row.max > other.min) {
          rowErrors.min = rowErrors.min || "Range overlaps with another row";
        }
      }
    });
    if (Object.keys(rowErrors).length > 0) errors[i] = rowErrors;
  });
  return errors;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SettingsScreen() {
  const [school, setSchool] = useState<Record<string, any> | null>(null);

  // Grading scale state
  const [gradingMode, setGradingMode] = useState<"default" | "custom">("default");
  const [customGrades, setCustomGrades] = useState<GradeRow[]>([]);
  const [gradeErrors, setGradeErrors] = useState<
    Record<number, Partial<Record<keyof GradeRow, string>>>
  >({});
  const [gradeSaving, setGradeSaving] = useState(false);

  useEffect(() => {
    api<Record<string, any>>("/school/me")
      .then((data) => {
        setSchool(data);
        if (data?.settings?.gradingScale === "custom" && data?.settings?.customGrades) {
          setGradingMode("custom");
          setCustomGrades(data.settings.customGrades);
        }
      })
      .catch(() => undefined);
  }, []);

  // ---------------------------------------------------------------------------
  // Grading scale helpers
  // ---------------------------------------------------------------------------

  function updateGradeRow(index: number, field: keyof GradeRow, value: string) {
    const updated = customGrades.map((row, i) => {
      if (i !== index) return row;
      if (field === "min" || field === "max") {
        const parsed = value === "" ? NaN : Number(value);
        return { ...row, [field]: Number.isInteger(parsed) ? parsed : parsed };
      }
      return { ...row, [field]: value };
    });
    setCustomGrades(updated);
    setGradeErrors(validateGradeRows(updated));
  }

  function addGradeRow() {
    if (customGrades.length >= 20) return;
    const updated = [...customGrades, { min: 0, max: 0, grade: "", remark: "" }];
    setCustomGrades(updated);
    setGradeErrors(validateGradeRows(updated));
  }

  function removeGradeRow(index: number) {
    const updated = customGrades.filter((_, i) => i !== index);
    setCustomGrades(updated);
    setGradeErrors(validateGradeRows(updated));
  }

  async function saveGradingScale() {
    const errors = validateGradeRows(customGrades);
    if (Object.keys(errors).length > 0) {
      setGradeErrors(errors);
      return;
    }
    setGradeSaving(true);
    try {
      await api("/school/me", {
        method: "PATCH",
        body: JSON.stringify({
          settings: { gradingScale: "custom", customGrades },
        }),
      });
      toast.success("Grading scale saved successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save grading scale");
    } finally {
      setGradeSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // School profile save
  // ---------------------------------------------------------------------------

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      const response = await api<Record<string, any>>("/school/me", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          phone: form.get("phone"),
          address: form.get("address"),
          city: form.get("city"),
          state: form.get("state"),
          motto: form.get("motto"),
          logo: form.get("logo") || null,
          settings: {
            maxStudentsPerClass: Number(form.get("maxStudentsPerClass") || 50),
            resultReleaseMode: form.get("resultReleaseMode"),
          },
        }),
      });
      setSchool(response);
      toast.success("School settings saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    }
  }

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="School profile"
        title="Make the tenant feel like the school."
        copy="Update identity, result release mode, and operating defaults from one clean panel."
      />
      <form onSubmit={save} className="surface rounded-[28px] p-5">
        <FiSettings className="text-3xl text-[var(--moss)]" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ["name", "School name"],
            ["email", "Email"],
            ["phone", "Phone"],
            ["address", "Address"],
            ["city", "City"],
            ["state", "State"],
            ["motto", "Motto"],
            ["logo", "Logo URL"],
            ["maxStudentsPerClass", "Max students per class"],
          ].map(([name, label]) => (
            <label key={name} className="grid gap-2 text-sm font-bold">
              {label}
              <input
                className="field"
                name={name}
                type={name === "email" ? "email" : name === "maxStudentsPerClass" ? "number" : "text"}
                defaultValue={
                  name === "maxStudentsPerClass"
                    ? school?.settings?.maxStudentsPerClass
                    : school?.[name] || ""
                }
              />
            </label>
          ))}
          <label className="grid gap-2 text-sm font-bold">
            Result release mode
            <select className="field" name="resultReleaseMode" defaultValue={school?.settings?.resultReleaseMode || "automatic"}>
              <option value="automatic">Automatic</option>
              <option value="manual">Manual</option>
            </select>
          </label>
        </div>
        <Button className="mt-6" icon={FiSave}>Save settings</Button>
      </form>

      {/* ------------------------------------------------------------------ */}
      {/* Grading Scale section                                               */}
      {/* ------------------------------------------------------------------ */}
      <section className="surface rounded-[28px] p-5">
        <h2 className="text-2xl font-black">Grading Scale</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Define how scores map to grade labels and remarks.
        </p>

        {gradingMode === "default" ? (
          /* ---- Default mode ---- */
          <div className="mt-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(83,97,87,.12)] text-left text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                    <th className="pb-2 pr-4">Grade</th>
                    <th className="pb-2 pr-4">Min</th>
                    <th className="pb-2 pr-4">Max</th>
                    <th className="pb-2">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_GRADES.map((row) => (
                    <tr
                      key={row.grade}
                      className="border-b border-[rgba(83,97,87,.07)] last:border-0"
                    >
                      <td className="py-2 pr-4 font-bold text-[var(--moss)]">{row.grade}</td>
                      <td className="py-2 pr-4">{row.min}</td>
                      <td className="py-2 pr-4">{row.max}</td>
                      <td className="py-2 text-[var(--ink-soft)]">{row.remark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                setGradingMode("custom");
                if (customGrades.length === 0) {
                  const initial = DEFAULT_GRADES.map((r) => ({ ...r }));
                  setCustomGrades(initial);
                  setGradeErrors(validateGradeRows(initial));
                }
              }}
            >
              Use custom grading scale
            </Button>
          </div>
        ) : (
          /* ---- Custom mode ---- */
          <div className="mt-5">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[rgba(83,97,87,.12)] text-left text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
                    <th className="pb-2 pr-3">Min</th>
                    <th className="pb-2 pr-3">Max</th>
                    <th className="pb-2 pr-3">Grade</th>
                    <th className="pb-2 pr-3">Remark</th>
                    <th className="pb-2" />
                  </tr>
                </thead>
                <tbody>
                  {customGrades.map((row, i) => (
                    <tr key={i} className="align-top">
                      {/* Min */}
                      <td className="py-2 pr-3">
                        <input
                          className="field w-full"
                          type="number"
                          min={0}
                          max={100}
                          value={row.min}
                          onChange={(e) => updateGradeRow(i, "min", e.target.value)}
                        />
                        <InlineError message={gradeErrors[i]?.min} />
                      </td>
                      {/* Max */}
                      <td className="py-2 pr-3">
                        <input
                          className="field w-full"
                          type="number"
                          min={0}
                          max={100}
                          value={row.max}
                          onChange={(e) => updateGradeRow(i, "max", e.target.value)}
                        />
                        <InlineError message={gradeErrors[i]?.max} />
                      </td>
                      {/* Grade label */}
                      <td className="py-2 pr-3">
                        <input
                          className="field w-full"
                          type="text"
                          maxLength={5}
                          value={row.grade}
                          onChange={(e) => updateGradeRow(i, "grade", e.target.value)}
                        />
                        <InlineError message={gradeErrors[i]?.grade} />
                      </td>
                      {/* Remark */}
                      <td className="py-2 pr-3">
                        <input
                          className="field w-full"
                          type="text"
                          maxLength={50}
                          value={row.remark}
                          onChange={(e) => updateGradeRow(i, "remark", e.target.value)}
                        />
                        <InlineError message={gradeErrors[i]?.remark} />
                      </td>
                      {/* Remove */}
                      <td className="py-2">
                        <button
                          type="button"
                          aria-label="Remove row"
                          onClick={() => removeGradeRow(i)}
                          className="pressable grid size-9 place-items-center rounded-xl text-[var(--danger)] hover:bg-[rgba(182,69,69,.08)]"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="ghost"
                icon={FiPlus}
                disabled={customGrades.length >= 20}
                onClick={addGradeRow}
              >
                Add row
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setGradingMode("default");
                  setCustomGrades([]);
                  setGradeErrors({});
                }}
              >
                Use default grading scale
              </Button>
              <Button
                icon={FiSave}
                disabled={gradeSaving || Object.keys(gradeErrors).length > 0}
                onClick={saveGradingScale}
              >
                {gradeSaving ? "Saving…" : "Save grading scale"}
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
