'use client';

import { SlidersHorizontal } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterPopoverProps {
  filters: Record<string, string>;
  onFilterChange: (filters: Record<string, string>) => void;
}

const MODEL_FAMILIES = ['1 str', '2 str', '3 str', '3+2 str', '3+daybed', '2+daybed', '3+cnr+3', '3+cnr+2', '2+cnr+2', '3+cnr+1', '2+cnr+1', '3+2+1'];
const RECLINER_MODES = [
  { value: 'manual', label: 'Manual' },
  { value: 'motorized_single', label: 'Motorized single' },
  { value: 'motorized_double', label: 'Motorized double' },
];

export default function FilterPopover({ filters, onFilterChange }: FilterPopoverProps) {
  const activeCount = Object.values(filters).filter((value) => value && value !== 'all').length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="bg-card">
          <SlidersHorizontal /> Filters
          {activeCount > 0 && <Badge className="px-1.5">{activeCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="modelFamily">Model family</Label>
          <Select value={filters.model_family_configuration ?? 'all'} onValueChange={(value) => onFilterChange({ model_family_configuration: value })}>
            <SelectTrigger id="modelFamily" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All families</SelectItem>
              {MODEL_FAMILIES.map((family) => (
                <SelectItem key={family} value={family}>{family.toUpperCase()}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reclinerMode">Recliner</Label>
          <Select value={filters.recliner_mechanism_mode ?? 'all'} onValueChange={(value) => onFilterChange({ recliner_mechanism_mode: value })}>
            <SelectTrigger id="reclinerMode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any recliner</SelectItem>
              {RECLINER_MODES.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>{mode.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onFilterChange({ model_family_configuration: 'all', recliner_mechanism_mode: 'all' })}
          >
            Clear filters
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
