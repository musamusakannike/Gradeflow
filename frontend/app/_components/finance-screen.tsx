"use client";

import toast from "react-hot-toast";
import { FiCheckCircle, FiCreditCard, FiDollarSign } from "react-icons/fi";
import { Button, SectionHeader, StatCard } from "./ui";
import { api } from "@/lib/api";

export function FinanceScreen() {
  async function setFee(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api("/finance/fee-status", {
        method: "POST",
        body: JSON.stringify({
          studentId: form.get("studentId"),
          termId: form.get("termId"),
          amountExpected: Number(form.get("amountExpected")),
          amountPaid: Number(form.get("amountPaid") || 0),
          notes: form.get("notes"),
        }),
      });
      toast.success("Fee status updated");
      event.currentTarget.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update fee");
    }
  }

  return (
    <div className="grid gap-7">
      <SectionHeader
        eyebrow="Bursary"
        title="Fees decide result visibility."
        copy="Record manual payments, initialize Paystack payments, and keep result access honest."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard icon={FiDollarSign} label="Expected" value="₦24.1m" delta="current term" />
        <StatCard icon={FiCheckCircle} label="Collected" value="₦18.7m" delta="77.6%" />
        <StatCard icon={FiCreditCard} label="Pending payments" value="29" delta="Paystack queue" />
      </div>
      <form onSubmit={setFee} className="surface rounded-[28px] p-5">
        <h2 className="text-2xl font-black">Manual fee status</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input className="field" name="studentId" placeholder="Student ID ObjectId" required />
          <input className="field" name="termId" placeholder="Term ID ObjectId" required />
          <input className="field" name="amountExpected" type="number" placeholder="Expected" required />
          <input className="field" name="amountPaid" type="number" placeholder="Paid" />
          <input className="field" name="notes" placeholder="Notes" />
        </div>
        <Button className="mt-5" icon={FiCheckCircle}>Update status</Button>
      </form>
    </div>
  );
}
