import React from 'react';
import { LucideIcon, Scissors, Hammer, Wrench, CheckCircle, Sofa } from 'lucide-react';
import { STAGE_CONFIG } from '@/components/view-orders/data';
import { Stage } from '@/components/view-orders/types';

// --- Type Definitions ---

interface ProductionPipelineProps {
  data: Partial<Record<string, number>>;
}

const STAGE_ICONS: Record<Stage, LucideIcon> = {
  carpentry: Hammer,
  webbing: Wrench,
  marking_cutting: Scissors,
  stitching: Sofa,
  cladding: Sofa,
  final_qc: CheckCircle,
};

// Create a reverse mapping from label to Stage key
const stageLabelToKey: Record<string, Stage> = Object.entries(STAGE_CONFIG).reduce((acc, [key, value]) => {
  acc[value.label] = key as Stage;
  return acc;
}, {} as Record<string, Stage>);

// Production Pipeline Component
const ProductionPipeline: React.FC<ProductionPipelineProps> = ({ data }) => {
  const pipelineData = Object.entries(data).map(([stageLabel, count]) => {
    const stageKey = stageLabelToKey[stageLabel];
    return {
      stage: stageLabel,
      count,
      Icon: STAGE_ICONS[stageKey],
      color: STAGE_CONFIG[stageKey]?.color, // Use optional chaining in case stageKey is not found
    };
  });
  
  const totalInPipeline = pipelineData.reduce((sum, item) => sum + (item.count || 0), 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md h-full">
      <h3 className="text-xl font-bold text-gray-900 mb-4">Production Pipeline</h3>
      <div className="space-y-3">
        {pipelineData.map((item) => (
          <div key={item.stage} className="flex items-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100 mr-4">
              {item.Icon && <item.Icon className="h-5 w-5 text-gray-600" />}
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <p className="font-semibold text-gray-700">{item.stage}</p>
                <p className="text-sm font-bold text-gray-800">{item.count} units</p>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className="bg-blue-500" style={{ width: `${((item.count || 0) / totalInPipeline) * 100}%`, height: '100%', borderRadius: '9999px', backgroundColor: item.color }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductionPipeline;
