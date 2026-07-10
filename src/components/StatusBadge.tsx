import React from 'react';

interface StatusBadgeProps {
  value: string;
  colorMap: Record<string, string>;
  labelMap?: Record<string, string>;
}

export default function StatusBadge({ value, colorMap, labelMap }: StatusBadgeProps) {
  const color = colorMap[value] ?? 'bg-slate-100 text-slate-600';
  const label = labelMap?.[value] ?? value;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}