"use client";

import React from "react";

type KPIProps = {
  title: string;
  value: string | number;
};

export default function KPI({ title, value }: KPIProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4">
      <div className="text-xs text-gray-500">{title}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
