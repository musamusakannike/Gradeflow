"use client";

import { useEffect, useRef, useState } from "react";
import { FiDownload, FiUpload, FiX } from "react-icons/fi";
import { api, ApiError } from "@/lib/api";
import { Button, InlineError } from "./ui";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BulkUploadModalProps {
  onClose: () => void;
  onUploaded: () => void;
}

interface BulkUploadResult {
  created: number;
  updated: number;
  errors: number;
}

interface RowError {
  row: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REQUIRED_HEADERS = [
  "firstName",
  "lastName",
  "email",
  "gender",
  "classId",
  "guardianName",
  "guardianPhone",
  "guardianEmail",
] as const;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_ROWS = 1000;

const SAMPLE_CSV_CONTENT =
  "firstName,lastName,email,gender,classId,guardianName,guardianPhone,guardianEmail\n" +
  "John,Doe,john.doe@example.com,Male,CLASS_ID_HERE,Jane Doe,08012345678,jane@example.com\n";

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

// ---------------------------------------------------------------------------
// Client-side validation
// ---------------------------------------------------------------------------

interface ValidationResult {
  /** Hard errors that block upload */
  errors: string[];
  /** Soft warnings that allow proceed */
  warnings: string[];
  /** Parsed rows (only populated when there are no hard errors) */
  rows: Record<string, string>[];
}

function validateCsv(file: File, text: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. File size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push("File size exceeds 5MB limit");
    return { errors, warnings, rows: [] };
  }

  // 2. File extension
  if (!file.name.toLowerCase().endsWith(".csv")) {
    errors.push("Only .csv files are accepted");
    return { errors, warnings, rows: [] };
  }

  const lines = text.trim().split("\n");
  if (lines.length === 0 || lines[0].trim() === "") {
    errors.push("CSV file is empty");
    return { errors, warnings, rows: [] };
  }

  // 3. Header validation (order-independent)
  const fileHeaders = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !fileHeaders.includes(h));
  if (missingHeaders.length > 0) {
    errors.push(`CSV file is missing required headers: ${missingHeaders.join(", ")}`);
    return { errors, warnings, rows: [] };
  }

  // 4. Row count
  const dataLines = lines.slice(1).filter((l) => l.trim() !== "");
  if (dataLines.length === 0) {
    errors.push("CSV file is empty");
    return { errors, warnings, rows: [] };
  }
  if (dataLines.length > MAX_ROWS) {
    errors.push(`CSV file exceeds maximum of ${MAX_ROWS} students`);
    return { errors, warnings, rows: [] };
  }

  // Parse rows
  const rows = parseCsv(text);

  // 5. Duplicate email warning
  const emailToRows: Record<string, number[]> = {};
  rows.forEach((row, idx) => {
    const email = row["email"]?.trim().toLowerCase();
    if (email) {
      if (!emailToRows[email]) emailToRows[email] = [];
      emailToRows[email].push(idx + 2); // +2: 1-indexed + skip header row
    }
  });
  const duplicateRowNumbers: number[] = [];
  for (const rowNums of Object.values(emailToRows)) {
    if (rowNums.length > 1) {
      duplicateRowNumbers.push(...rowNums);
    }
  }
  if (duplicateRowNumbers.length > 0) {
    const sorted = [...new Set(duplicateRowNumbers)].sort((a, b) => a - b);
    warnings.push(`Duplicate emails found in rows: ${sorted.join(", ")}`);
  }

  return { errors, warnings, rows };
}

// ---------------------------------------------------------------------------
// BulkUploadModal
// ---------------------------------------------------------------------------

export function BulkUploadModal({ onClose, onUploaded }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<BulkUploadResult | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  // Auto-close after success
  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => {
        onUploaded();
        onClose();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [result, onClose, onUploaded]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setFile(selected);
    setParseErrors([]);
    setParseWarnings([]);
    setUploadError(null);
    setRowErrors([]);
    setResult(null);
    setDuplicateWarning(null);

    if (!selected) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const { errors, warnings } = validateCsv(selected, text);
      setParseErrors(errors);
      setParseWarnings(warnings);
      if (warnings.length > 0) {
        setDuplicateWarning(warnings[0]);
      }
    };
    reader.readAsText(selected);
  }

  async function handleUpload() {
    if (!file) return;

    setUploadError(null);
    setRowErrors([]);
    setResult(null);

    // Re-read and validate before upload
    const text = await file.text();
    const { errors, warnings, rows } = validateCsv(file, text);

    if (errors.length > 0) {
      setParseErrors(errors);
      return;
    }

    if (warnings.length > 0) {
      setParseWarnings(warnings);
      setDuplicateWarning(warnings[0]);
    }

    setUploading(true);
    try {
      const data = await api<BulkUploadResult>("/students/bulk", {
        method: "POST",
        body: JSON.stringify({ students: rows }),
      });
      setResult(data);
    } catch (err) {
      if (err instanceof ApiError) {
        // Try to parse per-row errors from the message
        // The API may return a message like "Row 2: invalid email; Row 5: missing classId"
        const rowErrorPattern = /Row (\d+):\s*([^;]+)/g;
        const message = err.message ?? "";
        const matches = [...message.matchAll(rowErrorPattern)];
        if (matches.length > 0) {
          setRowErrors(
            matches.map((m) => ({ row: parseInt(m[1], 10), message: m[2].trim() })),
          );
        } else {
          setUploadError(err.message || "Upload failed. Please try again.");
        }
      } else {
        setUploadError("Upload failed due to network error. Please try again.");
      }
    } finally {
      setUploading(false);
    }
  }

  function handleDownloadSample() {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "gradeflow-students-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const canUpload = !!file && parseErrors.length === 0 && !uploading && !result;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Bulk upload students"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,.4)]"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        className="surface w-full max-w-lg rounded-[28px] p-6 mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-[var(--ink)]">Bulk Upload Students</h2>
          <Button
            type="button"
            variant="ghost"
            icon={FiX}
            aria-label="Close bulk upload"
            onClick={onClose}
          />
        </div>

        {/* Sample CSV section */}
        <div className="mt-5 rounded-2xl border border-[rgba(83,97,87,.15)] bg-[rgba(49,92,67,.04)] p-4">
          <p className="text-sm font-semibold text-[var(--ink)]">Required CSV format</p>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            Your CSV must include these 8 headers (order does not matter):
          </p>
          <div className="mt-2 overflow-x-auto rounded-xl bg-[rgba(83,97,87,.08)] px-3 py-2">
            <code className="whitespace-nowrap text-xs text-[var(--ink)]">
              firstName, lastName, email, gender, classId, guardianName, guardianPhone,
              guardianEmail
            </code>
          </div>
          <Button
            type="button"
            variant="secondary"
            icon={FiDownload}
            className="mt-3 text-xs"
            onClick={handleDownloadSample}
          >
            Download sample CSV
          </Button>
        </div>

        {/* File input */}
        <div className="mt-5">
          <label
            htmlFor="bulk-csv-file"
            className="mb-1.5 block text-sm font-semibold text-[var(--ink)]"
          >
            Select CSV file
          </label>
          <input
            ref={fileInputRef}
            id="bulk-csv-file"
            type="file"
            accept=".csv"
            className="field w-full cursor-pointer file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[rgba(49,92,67,.1)] file:px-3 file:py-1 file:text-xs file:font-semibold file:text-[var(--moss)]"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && parseErrors.length === 0 && !result && (
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              {file.name} — {(file.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>

        {/* Parse errors */}
        {parseErrors.map((err, i) => (
          <InlineError key={i} message={err} />
        ))}

        {/* Duplicate warning (soft — allow proceed) */}
        {duplicateWarning && parseErrors.length === 0 && (
          <div className="mt-3 rounded-xl border border-[rgba(182,140,0,.3)] bg-[rgba(182,140,0,.08)] px-4 py-3">
            <p className="text-xs font-semibold text-[rgba(140,100,0,1)]">
              ⚠ {duplicateWarning}
            </p>
            <p className="mt-0.5 text-xs text-[rgba(140,100,0,.8)]">
              You can still proceed — duplicates will be handled by the server.
            </p>
          </div>
        )}

        {/* Upload error */}
        {uploadError && (
          <div className="mt-3 rounded-xl border border-[rgba(182,69,69,.25)] bg-[rgba(182,69,69,.07)] px-4 py-3">
            <p className="text-sm font-medium text-[var(--danger)]">{uploadError}</p>
          </div>
        )}

        {/* Per-row API errors */}
        {rowErrors.length > 0 && (
          <div className="mt-3 rounded-xl border border-[rgba(182,69,69,.25)] bg-[rgba(182,69,69,.07)] px-4 py-3">
            <p className="mb-2 text-sm font-semibold text-[var(--danger)]">
              Upload completed with errors:
            </p>
            <ul className="space-y-1">
              {rowErrors.map((re) => (
                <li key={re.row} className="text-xs text-[var(--danger)]">
                  Row {re.row}: {re.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success message */}
        {result && (
          <div className="mt-3 rounded-xl border border-[rgba(49,92,67,.25)] bg-[rgba(49,92,67,.07)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--moss)]">
              Successfully created {result.created} student
              {result.created !== 1 ? "s" : ""}, updated {result.updated} student
              {result.updated !== 1 ? "s" : ""}, {result.errors} error
              {result.errors !== 1 ? "s" : ""}
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-soft)]">Closing automatically…</p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button
            type="button"
            icon={FiUpload}
            onClick={handleUpload}
            disabled={!canUpload}
          >
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </div>
      </div>
    </div>
  );
}
