"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { FiArrowLeft, FiArrowRight, FiLock, FiMail } from "react-icons/fi";
import { api, tokenStore, userStore } from "@/lib/api";
import type { User } from "@/types/gradeflow";
import { Button } from "./ui";

type LoginResponse = {
  user: User;
  tokens: { accessToken: string };
};

export function AuthFrame({
  mode,
}: {
  mode: "login" | "register";
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[.92fr_1.08fr]">
      <section className="hidden bg-[var(--night)] p-8 text-[var(--paper)] lg:block">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/70">
          <FiArrowLeft /> Back to GradeFlow
        </Link>
        <div className="flex h-full flex-col justify-center">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-[var(--ochre)]">
            {mode === "login" ? "Welcome back" : "School onboarding"}
          </p>
          <h1 className="mt-6 max-w-xl font-display text-6xl font-black leading-none">
            {mode === "login"
              ? "Step into the day’s school ledger."
              : "Open a clean operating room for your school."}
          </h1>
          <div className="mt-10 grid max-w-lg gap-3">
            {["Tenant-aware access", "Fee-gated results", "Teacher score lanes"].map(
              (item) => (
                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.055] p-4 font-bold">
                  {item}
                </div>
              ),
            )}
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-xl">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-[var(--ink-soft)] lg:hidden">
            <FiArrowLeft /> Back
          </Link>
          {mode === "login" ? <LoginForm /> : <RegisterForm />}
        </div>
      </section>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await api<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      tokenStore.set(response.tokens.accessToken);
      userStore.set(response.user);
      toast.success("Signed in");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface rounded-[30px] p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--clay)]">
        Secure sign in
      </p>
      <h1 className="mt-3 font-display text-4xl font-black">Continue to GradeFlow</h1>
      <div className="mt-8 grid gap-4">
        <label className="grid gap-2 text-sm font-bold">
          Email
          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
            <input className="field pl-11" name="email" type="email" required />
          </div>
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Password
          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]" />
            <input className="field pl-11" name="password" type="password" required />
          </div>
        </label>
      </div>
      <Button className="mt-7 w-full" icon={FiArrowRight} disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <p className="mt-5 text-center text-sm text-[var(--ink-soft)]">
        New school?{" "}
        <Link href="/register" className="font-black text-[var(--moss)]">
          Register here
        </Link>
      </p>
    </form>
  );
}

function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await api<LoginResponse>("/auth/register-school", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      tokenStore.set(response.tokens.accessToken);
      userStore.set(response.user);
      toast.success("School registered");
      router.push("/dashboard");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="surface rounded-[30px] p-6 md:p-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-[var(--clay)]">
        Create school
      </p>
      <h1 className="mt-3 font-display text-4xl font-black">Register your school</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {[
          ["schoolName", "School name"],
          ["schoolCode", "School code"],
          ["schoolEmail", "School email"],
          ["schoolPhone", "School phone"],
          ["schoolAddress", "Address"],
          ["city", "City"],
          ["state", "State"],
          ["adminFirstName", "Admin first name"],
          ["adminLastName", "Admin last name"],
          ["adminEmail", "Admin email"],
          ["adminPassword", "Admin password"],
        ].map(([name, label]) => (
          <label key={name} className="grid gap-2 text-sm font-bold">
            {label}
            <input
              className="field"
              name={name}
              type={name.includes("Password") ? "password" : name.includes("Email") ? "email" : "text"}
              required={name !== "schoolCode"}
            />
          </label>
        ))}
      </div>
      <Button className="mt-7 w-full" icon={FiArrowRight} disabled={loading}>
        {loading ? "Creating school..." : "Create school"}
      </Button>
    </form>
  );
}
