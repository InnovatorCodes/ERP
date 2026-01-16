"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (query: string) => void;
  productType: "sofa" | "bed";
  filters?: Record<string, string>;
}

export function SearchBar({
  onSearch,
  productType,
  filters,
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const handler = setTimeout(() => {
      onSearch(searchQuery);
    }, 300); // 300ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery, onSearch, productType, filters]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="relative">
      <Input
        type="text"
        placeholder="Search by model name or ID..."
        value={searchQuery}
        onChange={handleInputChange}
      />
    </div>
  );
}
