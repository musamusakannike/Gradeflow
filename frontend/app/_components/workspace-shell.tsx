"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiBarChart2,
  FiBookOpen,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiUserCheck,
  FiUsers,
  FiX,
} from "react-icons/fi";
import clsx from "clsx";
import { tokenStore, userStore } from "@/lib/api";
import { tap } from "@/lib/haptics";
import { Button } from "./ui";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: FiGrid },
  { href: "/students", label: "Students", icon: FiUsers },
  { href: "/academics", label: "Academics", icon: FiBookOpen },
  { href: "/results", label: "Results", icon: FiBarChart2 },
  { href: "/finance", label: "Finance", icon: FiCreditCard },
  { href: "/settings", label: "Settings", icon: FiSettings },
];

export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(userStore.get());

  useEffect(() => {
    setUser(userStore.get());
  }, []);

  function logout() {
    tap();
    tokenStore.clear();
    router.push("/login");
  }

  const sidebar = (
    <aside className="flex h-full flex-col bg-[var(--night)] p-4 text-[var(--paper)]">
      <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[var(--paper)] font-black text-[var(--night)]">
          G
        </span>
        <span>
          <span className="block font-display text-xl font-black">GradeFlow</span>
          <span className="text-xs text-white/45">school operations</span>
        </span>
      </Link>

      <nav className="mt-8 grid gap-1">
        {nav.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                tap(5);
                setOpen(false);
              }}
              className={clsx(
                "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold transition",
                active
                  ? "bg-[var(--paper)] text-[var(--night)]"
                  : "text-white/62 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="text-lg" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-3xl border border-white/10 bg-white/[0.055] p-4">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-[var(--ochre)] text-[var(--night)]">
            <FiUserCheck />
          </div>
          <div className="min-w-0">
            <p className="truncate font-black">
              {user ? `${user.firstName} ${user.lastName}` : "Demo user"}
            </p>
            <p className="truncate text-xs text-white/48">
              {user?.role?.replace("_", " ") || "preview mode"}
            </p>
          </div>
        </div>
        <Button variant="ghost" icon={FiLogOut} className="mt-4 w-full text-white/70 hover:bg-white/10" onClick={logout}>
          Sign out
        </Button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[290px_1fr]">
      <div className="hidden lg:block">{sidebar}</div>
      <div className="lg:hidden">
        <div className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-[rgba(83,97,87,.16)] bg-[rgba(245,242,233,.86)] px-4 py-3 backdrop-blur-xl">
          <Link href="/dashboard" className="font-display text-xl font-black">
            GradeFlow
          </Link>
          <button
            className="grid size-11 place-items-center rounded-2xl bg-[var(--ink)] text-[var(--paper)]"
            onClick={() => setOpen(true)}
          >
            <FiMenu />
          </button>
        </div>
        {open ? (
          <div className="fixed inset-0 z-50 bg-black/40">
            <div className="h-full w-[86vw] max-w-[330px]">
              <button
                className="absolute right-4 top-4 grid size-11 place-items-center rounded-2xl bg-[var(--paper)]"
                onClick={() => setOpen(false)}
              >
                <FiX />
              </button>
              {sidebar}
            </div>
          </div>
        ) : null}
      </div>
      <main className="min-w-0 px-4 pb-10 pt-20 md:px-7 lg:px-10 lg:pt-8">
        {children}
      </main>
    </div>
  );
}
