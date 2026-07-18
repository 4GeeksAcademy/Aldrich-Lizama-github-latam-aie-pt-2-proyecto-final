"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
}

export default function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <div className="rounded-xl border border-nexova-border bg-nexova-bg p-4 shadow-sm">
      <div className="text-lg">{icon}</div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-nexova-muted">{label}</div>
    </div>
  );
}