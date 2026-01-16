import React from 'react';
import { ArrowUpRight, LucideIcon } from 'lucide-react';

// --- Type Definitions ---

export interface KpiCardProps {
  title: string;
  value: string;
  change?: string;
  Icon: LucideIcon;
  color: string;
  bgColor: string;
}

// KPI Card Component
const KpiCard: React.FC<KpiCardProps> = ({ title, value, change, Icon, color, bgColor }) => (
  <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${bgColor}`}>
        <Icon className={`h-6 w-6 ${color}`} />
      </div>
    </div>
    {change && (
      <div className="flex items-center mt-4 text-sm">
        <span className={`flex items-center ${change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
          <ArrowUpRight size={16} className={!change.startsWith('+') ? 'rotate-90' : ''} />
          {change}
        </span>
        <span className="text-gray-500 ml-2">vs. last period</span>
      </div>
    )}
  </div>
);

export default KpiCard;
