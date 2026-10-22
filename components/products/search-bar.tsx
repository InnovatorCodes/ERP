"use client";

import { useState, useEffect, useRef } from "react";
import { SearchInput } from "@/components/ui/search-input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  className?: string;
}

/** Product search box; reports the query 300 ms after typing stops. */
export function SearchBar({ onSearch, className }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    const handler = setTimeout(() => onSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery, onSearch]);

  return (
    <SearchInput
      placeholder="Search by model name..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className={className}
    />
  );
}
