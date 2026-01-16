"use client";

import React from "react";
import {
  CalendarDays,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BadgeDollarSign,
  Ship,
} from "lucide-react";

type TimelineProps = {
  steps: {
    key: string;
    label: string;
    date: string;
  }[];
};

export default function Timeline({ steps = [] }: TimelineProps) {
  const iconFor = (key: string) => {
    if (key === "shipped") return <Truck className="w-4 h-4" />;
    if (key === "delivered") return <CheckCircle2 className="w-4 h-4" />;
    if (key === "cancelled") return <XCircle className="w-4 h-4" />;
    if (key === "returned") return <RotateCcw className="w-4 h-4" />;
    if (key === "refunded") return <BadgeDollarSign className="w-4 h-4" />;
    if (key === "packed") return <Ship className="w-4 h-4" />;
    return <CalendarDays className="w-4 h-4" />;
  };

  return (
    <ol className="relative border-s-2 border-gray-100 ml-2">
      {steps.map((s, i) => (
        <li key={i} className="mb-4 ms-4">
          <span className="absolute -start-3.5 flex items-center justify-center w-7 h-7 rounded-full bg-white border shadow-sm">
            {iconFor(s.key)}
          </span>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium">{s.label}</span>
            <span className="text-gray-400">• {s.date}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}
