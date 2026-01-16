"use client";

import React from "react";

type PaginationProps = {
  page: number;
  totalPages: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
};

export default function Pagination({ page, totalPages, setPage }: PaginationProps) {
  return (
    <div className="flex items-center justify-between p-3 text-sm bg-gray-50 border-t">
      <div>
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(1)}
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          First
        </button>
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          Prev
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          Next
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(totalPages)}
          className="px-2 py-1 border rounded disabled:opacity-40"
        >
          Last
        </button>
      </div>
    </div>
  );
}
