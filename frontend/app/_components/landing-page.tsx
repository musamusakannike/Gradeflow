"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  FiArrowRight,
  FiBarChart2,
  FiBookOpen,
  FiCreditCard,
  FiShield,
  FiUsers,
} from "react-icons/fi";
import { Button, Pill } from "./ui";

const flow = [
  ["01", "Register school", "Create the tenant, admin account, and school profile."],
  ["02", "Build structure", "Sessions, terms, classes, subjects, and teachers."],
  ["03", "Run the term", "Fees, scores, release gates, parent visibility, PDFs."],
];

export function LandingPage() {
  return (
    <main className="overflow-hidden">
      <section className="relative min-h-screen px-5 py-5 md:px-8">
        <nav className="mx-auto flex max-w-7xl items-center justify-between rounded-[22px] border border-[rgba(83,97,87,.16)] bg-[rgba(255,253,247,.62)] px-4 py-3 backdrop-blur-xl">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--paper)]">
              G
            </span>
            <span className="font-display text-xl font-black">GradeFlow</span>
          </Link>
          <div className="hidden items-center gap-7 text-sm font-semibold text-[var(--ink-soft)] md:flex">
            <a href="#flow">Flow</a>
            <a href="#modules">Modules</a>
            <a href="#dashboards">Dashboards</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link href="/register" className="hidden sm:block">
              <Button icon={FiArrowRight}>Start</Button>
            </Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-10 py-16 lg:grid-cols-[1.04fr_.96fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}>
            <Pill>Multi-school academic operations</Pill>
            <h1 className="mt-7 max-w-4xl font-display text-6xl font-black leading-[0.95] text-[var(--ink)] md:text-8xl">
              Results stay locked until the school is ready.
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--ink-soft)]">
              GradeFlow brings school setup, staff, students, fees, score entry,
              release controls, parents, PDFs, and analytics into one careful interface.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/register">
                <Button icon={FiArrowRight} className="w-full sm:w-auto">
                  Register a school
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="secondary" className="w-full sm:w-auto">
                  Preview dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.12 }}
            className="relative min-h-[560px] rounded-[34px] bg-[var(--night)] p-4 text-[var(--paper)] shadow-[0_30px_120px_rgba(24,32,28,.28)]"
          >
            <div className="absolute inset-0 rounded-[34px] opacity-30 [background-image:linear-gradient(rgba(255,250,240,.08)_1px,transparent_1px)] [background-size:100%_28px]" />
            <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--ochre)]">
                  SS2 A Release Desk
                </p>
                <p className="mt-1 text-2xl font-black">First Term 2026</p>
              </div>
              <span className="rounded-full bg-[#d8a23a] px-3 py-1 text-xs font-black text-[var(--night)]">
                Paid gate on
              </span>
            </div>
            <div className="relative mt-5 grid gap-4">
              {[
                ["Scores entered", "814 / 840", "97%"],
                ["Fee cleared", "72 / 86", "84%"],
                ["Parent accounts", "63 linked", "ready"],
              ].map(([label, value, tag]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/[0.055] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/62">{label}</p>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{tag}</span>
                  </div>
                  <p className="mt-3 text-4xl font-black">{value}</p>
                </div>
              ))}
            </div>
            <div className="relative mt-5 rounded-3xl border border-white/10 bg-[#f5f2e9] p-5 text-[var(--ink)]">
              <div className="flex items-center justify-between">
                <p className="font-black">Adaeze Nwosu</p>
                <span className="text-sm font-bold text-[var(--success)]">Released</span>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-2 text-center text-sm">
                {["Math 86", "English 76", "Biology 69", "Econ 81"].map((item) => (
                  <div key={item} className="rounded-2xl bg-white px-2 py-3 font-bold">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="flow" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {flow.map(([step, title, copy]) => (
            <div key={step} className="surface rounded-[28px] p-6">
              <p className="font-display text-5xl font-black text-[var(--clay)]">
                {step}
              </p>
              <h2 className="mt-8 text-2xl font-black">{title}</h2>
              <p className="mt-3 text-[var(--ink-soft)]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="modules" className="bg-[var(--night)] px-5 py-24 text-[var(--paper)] md:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--ochre)]">
            Built for the actual school day
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              [FiUsers, "Students & parents"],
              [FiBookOpen, "Classes & subjects"],
              [FiCreditCard, "Fees & payments"],
              [FiBarChart2, "Results & analytics"],
            ].map(([Icon, label]) => {
              const ModuleIcon = Icon as typeof FiUsers;
              return (
                <div key={label as string} className="rounded-[26px] border border-white/10 bg-white/[0.055] p-6">
                  <ModuleIcon className="text-3xl text-[var(--ochre)]" />
                  <p className="mt-9 text-xl font-black">{label as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="dashboards" className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <div className="surface grid gap-8 rounded-[34px] p-6 md:grid-cols-[.8fr_1.2fr] md:p-10">
          <div>
            <FiShield className="text-4xl text-[var(--moss)]" />
            <h2 className="mt-6 font-display text-4xl font-black">
              Every role gets a different cockpit.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {["School admin", "Teacher", "Bursar", "Student", "Parent"].map((role) => (
              <div key={role} className="rounded-2xl border border-[rgba(83,97,87,.18)] bg-white/45 p-4 font-bold">
                {role}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
