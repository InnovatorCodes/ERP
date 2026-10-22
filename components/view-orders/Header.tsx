"use client";
import React from 'react';
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Columns3, List, SlidersHorizontal } from 'lucide-react';
import { ExportButton } from '../export-button';
import { STAGE_CONFIG, PRIORITY_CONFIG } from './data';
import { View, Stage, Priority } from './types';
import { PageHeader } from '@/components/ui/page-header';
import { SearchInput } from '@/components/ui/search-input';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Filters = {
  stage: Partial<Record<Stage, boolean>>;
  priority: Partial<Record<Priority, boolean>>;
  overdue: { true?: boolean };
};

interface HeaderProps {
  view: View;
  setView: (view: View) => void;
  search: string;
  setSearch: (search: string) => void;
  activeFilters: Filters;
  setActiveFilters: React.Dispatch<React.SetStateAction<Filters>>;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
}

const SORT_OPTIONS = [
  { key: 'priority', label: 'Priority' },
  { key: 'dueDate', label: 'Due date' },
  { key: 'id', label: 'Order ID' },
];

const CheckboxRow = ({ id, label, checked, onChange, dot }: { id: string; label: string; checked: boolean; onChange: () => void; dot?: string }) => (
  <label htmlFor={id} className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-muted">
    <Checkbox id={id} checked={checked} onCheckedChange={onChange} />
    {dot && <span className="size-2 rounded-full" style={{ backgroundColor: dot }} />}
    {label}
  </label>
);

const Header: React.FC<HeaderProps> = ({
  view,
  setView,
  search,
  setSearch,
  activeFilters,
  setActiveFilters,
  sortConfig,
  setSortConfig,
}) => {
  const activeFilterCount =
    Object.keys(activeFilters.stage).length + Object.keys(activeFilters.priority).length + (activeFilters.overdue.true ? 1 : 0);

  const toggleFilter = (filter: 'stage' | 'priority' | 'overdue', value: string) => {
    setActiveFilters(prev => {
      if (filter === 'overdue') {
        return { ...prev, overdue: prev.overdue.true ? {} : { true: true } };
      }
      const group = { ...prev[filter] } as Record<string, boolean>;
      if (group[value]) delete group[value];
      else group[value] = true;
      return { ...prev, [filter]: group };
    });
  };

  const clearFilters = () => setActiveFilters({ stage: {}, priority: {}, overdue: {} });

  return (
    <div className="mb-6">
      <PageHeader title="Production" description="Track every order item through the workshop.">
        <ExportButton
          source="orders"
          params={{
            q: search,
            filters: JSON.stringify(activeFilters),
            sortKey: sortConfig.key,
            sortDir: sortConfig.direction,
          }}
          columns={[
            { key: 'priority', label: 'Priority' },
            { key: 'order_id', label: 'Order ID' },
            { key: 'product_name', label: 'Product' },
            { key: 'product_type', label: 'Product Type' },
            { key: 'customer_name', label: 'Customer' },
            { key: 'due_date', label: 'Due Date' },
            { key: 'stage_name', label: 'Stage' },
          ]}
        />
      </PageHeader>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SegmentedControl
          aria-label="Layout"
          value={view}
          onChange={setView}
          options={[
            { value: 'list', label: 'List', icon: List },
            { value: 'kanban', label: 'Board', icon: Columns3 },
          ]}
        />
        <SearchInput
          placeholder="Search by order ID, customer or product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-card">
                <SlidersHorizontal /> Filters
                {activeFilterCount > 0 && <Badge className="px-1.5">{activeFilterCount}</Badge>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stage</p>
                  <div className="grid grid-cols-2 gap-x-2">
                    {Object.entries(STAGE_CONFIG).map(([key, { label, color }]) => (
                      <CheckboxRow
                        key={key}
                        id={`filter-stage-${key}`}
                        label={label}
                        dot={color}
                        checked={!!activeFilters.stage[key as Stage]}
                        onChange={() => toggleFilter('stage', key)}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Priority</p>
                  <div className="grid grid-cols-2 gap-x-2">
                    {(Object.keys(PRIORITY_CONFIG) as unknown as Priority[]).map((key) => (
                      <CheckboxRow
                        key={key}
                        id={`filter-priority-${key}`}
                        label={PRIORITY_CONFIG[key].label}
                        checked={!!activeFilters.priority[key]}
                        onChange={() => toggleFilter('priority', String(key))}
                      />
                    ))}
                  </div>
                </div>
                <div className="border-t pt-3">
                  <CheckboxRow
                    id="filter-overdue"
                    label="Overdue only"
                    checked={!!activeFilters.overdue.true}
                    onChange={() => toggleFilter('overdue', 'true')}
                  />
                </div>
                {activeFilterCount > 0 && (
                  <Button variant="ghost" size="sm" className="w-full" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={sortConfig.key}
            onValueChange={(key) => setSortConfig({ key, direction: sortConfig.direction })}
          >
            <SelectTrigger className="w-36 bg-card" aria-label="Sort by">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="bg-card"
            onClick={() => setSortConfig({ key: sortConfig.key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}
            aria-label={sortConfig.direction === 'asc' ? 'Sorted ascending; switch to descending' : 'Sorted descending; switch to ascending'}
            title={sortConfig.direction === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortConfig.direction === 'asc' ? <ArrowUpNarrowWide /> : <ArrowDownWideNarrow />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;
