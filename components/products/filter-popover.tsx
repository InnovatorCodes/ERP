'use client';

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter } from "lucide-react";

interface FilterPopoverProps {
  onFilterChange: (filters: Record<string, string>) => void;
}

export default function FilterPopover({ onFilterChange }: FilterPopoverProps) {
  const handleModelFamilyChange = (value: string) => {
    onFilterChange({ model_family_configuration: value });
  };

  const handleReclinerModeChange = (value: string) => {
    onFilterChange({ recliner_mechanism_mode: value });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Filters</h4>
            <p className="text-sm text-muted-foreground">
              Filter products by the following criteria.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="modelFamily">Model Family</Label>
              <Select onValueChange={handleModelFamilyChange}>
                <SelectTrigger id="modelFamily" className="col-span-2 h-8">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="1 str">1 Str</SelectItem>
                  <SelectItem value="2 str">2 Str</SelectItem>
                  <SelectItem value="3 str">3 Str</SelectItem>
                  <SelectItem value="3+2 str">3+2 Str</SelectItem>
                  <SelectItem value="3+ daybed">3+ Daybed</SelectItem>
                  <SelectItem value="2+daybed">2+Daybed</SelectItem>
                  <SelectItem value="3+cnr+3">3+Cnr+3</SelectItem>
                  <SelectItem value="3+cnr+2">3+Cnr+2</SelectItem>
                  <SelectItem value="2+cnr+2">2+Cnr+2</SelectItem>
                  <SelectItem value="3+cnr+1">3+Cnr+1</SelectItem>
                  <SelectItem value="2+cnr+1">2+Cnr+1</SelectItem>
                  <SelectItem value="3+2+1">3+2+1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="reclinerMode">Recliner Mode</Label>
              <Select onValueChange={handleReclinerModeChange}>
                <SelectTrigger id="reclinerMode" className="col-span-2 h-8">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="motorized_single">Motorized Single</SelectItem>
                  <SelectItem value="motorized_double">Motorized Double</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
