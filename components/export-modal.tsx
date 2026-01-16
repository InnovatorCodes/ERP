"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ExportModalProps {
  columns: { key: string; label: string }[];
  onExport: (selectedColumns: string[], format: "csv" | "xlsx") => void;
  children: React.ReactNode;
}

export function ExportModal({
  columns,
  onExport,
  children,
}: ExportModalProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map((c) => c.key)
  );

  const handleToggleColumn = (columnKey: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnKey)
        ? prev.filter((key) => key !== columnKey)
        : [...prev, columnKey]
    );
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Columns to Export</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          {columns.map((column) => (
            <div key={column.key} className="flex items-center space-x-2">
              <Checkbox
                id={column.key}
                checked={selectedColumns.includes(column.key)}
                onCheckedChange={() => handleToggleColumn(column.key)}
              />
              <label
                htmlFor={column.key}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {column.label}
              </label>
            </div>
          ))}
        </div>
        <div className="flex justify-end space-x-2">
          <Button
            onClick={() => onExport(selectedColumns, "csv")}
            disabled={selectedColumns.length === 0}
          >
            Export to CSV
          </Button>
          <Button
            onClick={() => onExport(selectedColumns, "xlsx")}
            disabled={selectedColumns.length === 0}
          >
            Export to XLSX
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
