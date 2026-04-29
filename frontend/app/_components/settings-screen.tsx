"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FiSave, FiSettings } from "react-icons/fi";
import { api } from "@/lib/api";
import { Button, SectionHeader } from "./ui";

export function SettingsScreen() {
  const [school, setSchool] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    api<Record<string, any>>("/school/me").then(setSchool).catch(() => undefined);
  }, []);

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
    </div>
  );
}
