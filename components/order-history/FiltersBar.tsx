"use client";

import React, { useState } from "react";
import { Filter, Search, Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ExportButton } from "../export-button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Filters = {
  q: string;
  status: string;
  date_from?: string;
  date_to?: string;
};

type FiltersBarProps = {
  onApplyFilters: (filters: Filters) => void;
  count: number;
};

const STATUSES = [
  "Delivered",
  "carpentry",
  "webbing",
  "marking_cutting",
  "stitching",
  "cladding",
  "final_qc",
];

export default function FiltersBar({ onApplyFilters, count }: FiltersBarProps) {
  const [filters, setFilters] = useState<Filters>({ q: "", status: "" });
  const [date, setDate] = React.useState<DateRange | undefined>();

  const handleApplyFilters = () => {
    onApplyFilters({
      ...filters,
      date_from: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
      date_to: date?.to ? format(date.to, "yyyy-MM-dd") : undefined,
    });
  };

  // This function now applies the filter immediately on search, as per the original logic.
  const handleSearchChange = (q: string) => {
    const newFilters = { ...filters, q };
    setFilters(newFilters);
    onApplyFilters({
      ...newFilters,
      date_from: date?.from ? format(date.from, "yyyy-MM-dd") : undefined,
      date_to: date?.to ? format(date.to, "yyyy-MM-dd") : undefined,
    });
  };

  const setDatePreset = (days: number) => {
    setDate({ from: addDays(new Date(), -days), to: new Date() });
  };

  const handleResetFilters = () => {
    setFilters({ q: "", status: "" });
    setDate(undefined);
    onApplyFilters({ q: "", status: "" });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center gap-3">
      {/* Search Input */}
      <div className="flex-grow flex items-center gap-2 border rounded-lg px-3 py-2">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          value={filters.q}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full text-sm focus:outline-none bg-transparent"
          placeholder="Search order ID, customer, product..."
        />
      </div>

      {/* Main Filters Popover */}
      <ExportButton
        source="order-history"
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
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="grid gap-6">
            {/* Status Filter Section */}
            <div className="grid gap-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={filters.status} onValueChange={(status) => setFilters({ ...filters, status })}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUSES.map((status) => (
                        <SelectItem key={status} value={status} className="capitalize">
                            {status.replace("_", " ")}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Delivery Date Section */}
            <div className="grid gap-2">
              <label className="text-sm font-medium">Delivery Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-full sm:w-[260px] justify-start text-left font-normal", // Adjusted width
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
                  {/* Flex container for presets and calendar */}
                  <div className="flex">
                    {/* Vertical Presets Sidebar */}
                    <div className="flex flex-col space-y-2 border-r p-3">
                        <Button variant="ghost" className="justify-start" size="sm" onClick={() => setDatePreset(7)}>Last 7 Days</Button>
                        <Button variant="ghost" className="justify-start" size="sm" onClick={() => setDatePreset(30)}>Last 30 Days</Button>
                        <Button variant="ghost" className="justify-start" size="sm" onClick={() => setDatePreset(90)}>Last 90 Days</Button>
                    </div>
                    {/* Calendar */}
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
            
            {/* Apply Button */}
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleResetFilters} variant="outline">
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <div className="text-sm text-gray-500">{count} results</div>
    </div>
  );
}
