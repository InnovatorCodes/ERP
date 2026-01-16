"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExportButton } from '../export-button';
import { icons } from './icons';
import { STAGE_CONFIG, PRIORITY_CONFIG } from './data';
import { View, Stage, Priority } from './types';

interface HeaderProps {
  view: View;
  setView: (view: View) => void;
  search: string;
  setSearch: (search: string) => void;
  activeFilters: { stage: Partial<Record<Stage, boolean>>; priority: Partial<Record<Priority, boolean>>; overdue: { true?: boolean } };
  setActiveFilters: React.Dispatch<React.SetStateAction<{
    stage: Partial<Record<Stage, boolean>>;
    priority: Partial<Record<Priority, boolean>>;
    overdue: { true?: boolean };
  }>>;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const isFilterActive = Object.values(activeFilters).some(f => Object.keys(f).length > 0);

  const toggleFilter = (filter: 'stage' | 'priority' | 'overdue', value: string) => {
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (filter === 'stage') {
        const key = value as Stage;
        const newStageFilters = { ...newFilters.stage };
        if (newStageFilters[key]) {
          delete newStageFilters[key];
        } else {
          newStageFilters[key] = true;
        }
        return { ...newFilters, stage: newStageFilters };
      }
      if (filter === 'priority') {
        const key = value as unknown as Priority;
        const newPriorityFilters = { ...newFilters.priority };
        if (newPriorityFilters[key]) {
          delete newPriorityFilters[key];
        } else {
          newPriorityFilters[key] = true;
        }
        return { ...newFilters, priority: newPriorityFilters };
      }
      if (filter === 'overdue') {
        return { ...newFilters, overdue: { true: !newFilters.overdue.true } };
      }
      return newFilters;
    });
  };

  const clearFilters = () => setActiveFilters({ stage: {}, priority: {}, overdue: {} });

  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 p-4 border-b border-gray-200/50">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">Sofa Manufacturing ERP</h1>
        <div className="relative">
          <icons.search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-64 bg-gray-100 text-black placeholder-gray-500 rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
          />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-4 bg-gray-100/50 p-1 rounded-lg">
          {(['list', 'kanban'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`relative px-4 py-2 text-sm font-semibold rounded-md transition-colors ${view === v ? 'text-white' : 'text-gray-600 hover:text-black'}`}
            >
              {view === v && <motion.div layoutId="active-tab" className="absolute inset-0 bg-red-600 rounded-md z-0"></motion.div>}
              <span className="relative z-10 flex items-center gap-2">
                {React.createElement(icons[v])} {v === 'list' ? 'Orders List' : 'Kanban Board'}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 hover:bg-gray-200">
                <icons.filter /> Filters
                {isFilterActive && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
              </button>
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl p-4 z-50"
                  >
                    <h4 className="font-semibold mb-2 text-black">Stages</h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(STAGE_CONFIG).map(([key, { label }]) => (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer text-black">
                          <input
                            type="checkbox"
                            checked={!!activeFilters.stage[key as Stage]}
                            onChange={() => toggleFilter('stage', key)}
                            className="h-4 w-4 rounded bg-gray-200 border-gray-300 text-red-500 focus:ring-red-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <h4 className="font-semibold mb-2 text-black">Priority</h4>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {Object.entries(PRIORITY_CONFIG).map(([key, { label }]) => (
                        <label key={key} className="flex items-center gap-2 text-sm cursor-pointer text-black">
                          <input
                            type="checkbox"
                            checked={!!activeFilters.priority[key as unknown as Priority]}
                            onChange={() => toggleFilter('priority', key)}
                            className="h-4 w-4 rounded bg-gray-200 border-gray-300 text-red-500 focus:ring-red-500"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    <label className="flex items-center gap-2 text-sm cursor-pointer text-black">
                      <input
                        type="checkbox"
                        checked={!!activeFilters.overdue.true}
                        onChange={() => toggleFilter('overdue', 'true')}
                        className="h-4 w-4 rounded bg-gray-200 border-gray-300 text-red-500 focus:ring-red-500"
                      />
                      Overdue Only
                    </label>
                    {isFilterActive && (
                      <button onClick={clearFilters} className="w-full mt-4 text-sm text-center text-red-500 hover:text-red-600">
                        Clear Filters
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative">
              <button onClick={() => setShowSort(!showSort)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm text-gray-800 hover:bg-gray-200">
                <icons.sort /> Sort
              </button>
              <AnimatePresence>
                {showSort && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50"
                  >
                    {['priority', 'dueDate', 'id'].map(key => (
                      <button
                        key={key}
                        onClick={() => {
                          setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
                          setShowSort(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-100 flex justify-between items-center text-black"
                      >
                        <span>{key === 'dueDate' ? 'Due Date' : key === 'id' ? 'Order ID' : 'Priority'}</span>
                        {sortConfig.key === key && <span className="text-red-500">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton
              source="orders"
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
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
