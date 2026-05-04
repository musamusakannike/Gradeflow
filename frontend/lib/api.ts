import type { ApiEnvelope, User } from "@/types/gradeflow";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000/api/v1";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export const tokenStore = {
  get() {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("gradeflow.token");
  },
  set(token: string) {
    window.localStorage.setItem("gradeflow.token", token);
  },
  clear() {
    window.localStorage.removeItem("gradeflow.token");
    window.localStorage.removeItem("gradeflow.user");
  },
};

export const userStore = {
  get(): User | null {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem("gradeflow.user");
    return raw ? (JSON.parse(raw) as User) : null;
  },
  set(user: User) {
    window.localStorage.setItem("gradeflow.user", JSON.stringify(user));
  },
};

type RequestOptions = RequestInit & { token?: string | null };

export async function api<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = options.token ?? tokenStore.get();
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiEnvelope<T>)
    : null;

  if (!response.ok) {
    throw new ApiError(payload?.message || "Request failed", response.status);
  }

  return payload ? payload.data : (undefined as T);
}

export async function downloadFile(path: string, filename: string) {
  const token = tokenStore.get();
  const response = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new ApiError("Download failed", response.status);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(url);
}
