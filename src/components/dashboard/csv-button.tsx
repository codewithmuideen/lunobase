"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CsvButton({ rows, filename }: { rows: Record<string, unknown>[]; filename: string }) {
  const download = () => {
    if (!rows.length) return;
    const headers = Object.keys(rows[0]);
    const escape = (v: unknown) => {
      const s = String(v ?? "");
      // prevent CSV formula injection in spreadsheet apps
      const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
      return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const csv = [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Button variant="secondary" size="sm" onClick={download} disabled={!rows.length}>
      <Download className="size-4" /> Export CSV
    </Button>
  );
}
