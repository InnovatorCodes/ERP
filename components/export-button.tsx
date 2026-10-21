"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportModal } from "./export-modal";
import { toast } from "sonner";

interface ExportButtonProps {
  source: string;
  columns: { key: string; label: string }[];
  productType?: 'sofa' | 'bed';
  /** The screen's current search/filters/sort, so the file matches what is shown. */
  params?: Record<string, string | undefined>;
}

export function ExportButton({ source, columns, productType, params }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (selectedColumns: string[], format: "csv" | "xlsx") => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ format, columns: selectedColumns.join(',') });
      if (productType) query.set('productType', productType);
      for (const [key, value] of Object.entries(params ?? {})) {
        if (value) query.set(key, value);
      }

      const response = await fetch(`/api/export-${source}?${query}`);
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? 'Failed to export data.');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${source}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(error instanceof Error ? error.message : "Failed to export data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ExportModal columns={columns} onExport={handleExport}>
      <Button disabled={loading}>
        {loading ? "Exporting..." : "Export"}
      </Button>
    </ExportModal>
  );
}
