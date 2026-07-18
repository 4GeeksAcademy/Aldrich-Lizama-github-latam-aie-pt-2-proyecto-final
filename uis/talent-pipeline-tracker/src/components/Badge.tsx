"use client";

interface BadgeProps {
  label: string;
  className?: string;
}

export default function Badge({ label, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
}