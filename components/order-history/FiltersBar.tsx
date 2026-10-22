"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ExportButton } from "../export-button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export type Filters = {
  q: string;
  status: string;
  date_from?: string;
  date_to?: string;
};

type FiltersBarProps = {
  onApplyFilters: (filters: Filters) => void;
  /** Applied filters and sort, passed to the export so it matches the table. */
  exportParams: Record<string, string | undefined>;
};

// Order history only lists delivered orders, so the only filters are text
// search and the delivery date range.
export default function FiltersBar({ onApplyFilters, exportParams }: FiltersBarProps) {
  const [q, setQ] = useState("");
  const [date, setDate] = React.useState<DateRange | undefined>();

  const buildFilters = (search: string, range: DateRange | undefined): Filters => ({
    q: search,
    status: "",
    date_from: range?.from ? format(range.from, "yyyy-MM-dd") : undefined,
    date_to: range?.to ? format(range.to, "yyyy-MM-dd") : undefined,
  });

  const handleSearchChange = (value: string) => {
    setQ(value);
    onApplyFilters(buildFilters(value, date));
  };

  const setDatePreset = (days: number) => {
    setDate({ from: addDays(new Date(), -days), to: new Date() });
  };

  const handleResetFilters = () => {
    setQ("");
    setDate(undefined);
    onApplyFilters(buildFilters("", undefined));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput
        value={q}
        onChange={(e) => handleSearchChange(e.target.value)}
        placeholder="Search by order ID, customer or product..."
        className="flex-1"
      />

      <ExportButton
        source="order-history"
        params={exportParams}
        columns={[
          { key: 'order_id', label: 'Order ID' },
          { key: 'product_name', label: 'Product Name' },
          { key: 'customer_name', label: 'Customer' },
          { key: 'order_date', label: 'Order Date' },
          { key: 'due_date', label: 'Due Date' },
          { key: 'delivery_date', label: 'Delivery Date' },
          { key: 'status', label: 'Status' },
        ]}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="bg-card">
            <CalendarIcon />
            {date?.from ? 'Delivery dates set' : 'Delivery dates'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="grid gap-6">
            {/* Delivery Date Section */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Delivery Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[260px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="flex">
                    <div className="flex flex-col space-y-2 border-r p-3">
                        <Button variant="ghost" className="justify-start" size="sm" onClick={() => setDatePreset(7)}>Last 7 Days</Button>
                        <Button variant="ghost" className="justify-start" size="sm" onClick={() => setDatePreset(30)}>Last 30 Days</Button>
                        <Button variant="ghost" className="justify-start" size="sm" onClick={() => setDatePreset(90)}>Last 90 Days</Button>
                    </div>
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={setDate}
                      numberOfMonths={2}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleResetFilters} variant="outline">
                Reset
              </Button>
              <Button onClick={() => onApplyFilters(buildFilters(q, date))}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
