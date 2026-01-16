"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ExportModal } from "./export-modal";

interface ExportButtonProps {
  source: string;
  columns: { key: string; label: string }[];
  productType?: 'sofa' | 'bed';
}

export function ExportButton({ source, columns, productType }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async (selectedColumns: string[], format: "csv" | "xlsx") => {
    setLoading(true);
    try {
      let url = `/api/export-${source}?format=${format}&columns=${selectedColumns.join(',')}`;
      if (productType) {
        url += `&productType=${productType}`;
      }
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to export data');
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
      // You might want to show a toast notification here
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
