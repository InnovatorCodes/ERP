import React, { useMemo, useEffect, useState, } from 'react';
import { getOrderItemStageStatus } from '@/actions/get-order-item-stage-status';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  Handle,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FiLock } from 'react-icons/fi';

// --- Type Definitions ---
type NodeStatus = 'pending' | 'active' | 'completed';

type OrderItemStage = {
  stage: string;
  status: NodeStatus;
};

type NodeData = {
  label: string;
  status: NodeStatus;
};

// --- Status-based Styling ---
const statusStyles: Record<NodeStatus, React.CSSProperties> = {
  pending: {
    background: '#F3F4F6', // gray-100
    border: '1px solid #D1D5DB', // gray-300
    color: '#6B7280', // gray-500
    cursor: 'not-allowed',
  },
  active: {
    background: '#DBEAFE', // blue-100
    border: '1px solid #60A5FA', // blue-400
    color: '#1E40AF', // blue-800
    cursor: 'pointer',
  },
  completed: {
    background: '#D1FAE5', // green-100
    border: '1px solid #34D399', // green-400
    color: '#065F46', // green-800
    cursor: 'pointer',
  },
};

const baseNodeStyle: React.CSSProperties = {
  width: 180,
  padding: 20,
  fontSize: '18px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  transition: 'background-color 0.3s, border-color 0.3s',
};

// --- Custom Node Component ---
const CustomNode = ({ data }: { data: NodeData }) => {
  const nodeStyle = useMemo(() => ({
    ...baseNodeStyle,
    ...statusStyles[data.status],
  }), [data.status]);

  return (
    <div style={nodeStyle}>
      {data.status === 'pending' && <FiLock />}
      <span>{data.label}</span>
      <Handle type="target" position={Position.Left} isConnectable={false} />
      <Handle type="source" position={Position.Right} isConnectable={false} />
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// --- Static Layout Definitions ---
const initialNodes: Node<NodeData>[] = [
    { id: '1', type: 'custom', data: { label: 'Carpentry', status: 'pending' }, position: { x: 25, y: 5 } },
    { id: '2', type: 'custom', data: { label: 'Marking and Cutting', status: 'pending' }, position: { x: 25, y: 150 } },
    { id: '3', type: 'custom', data: { label: 'Sewing', status: 'pending' }, position: { x: 250, y: 150 } },
    { id: '4', type: 'custom', data: { label: 'Cladding', status: 'pending' }, position: { x: 475, y: 75 } },
    { id: '5', type: 'custom', data: { label: 'Final QC', status: 'pending' }, position: { x: 700, y: 75 } },
    { id: '6', type: 'custom', data: { label: 'Packing and Loading', status: 'pending' }, position: { x: 925, y: 75 } },
];

const initialEdges: Edge[] = [
  { id: 'e1-4', source: '1', target: '4', type: 'smoothstep' },
  { id: 'e2-3', source: '2', target: '3', type: 'smoothstep' },
  { id: 'e3-4', source: '3', target: '4', type: 'smoothstep' },
  { id: 'e4-5', source: '4', target: '5', type: 'smoothstep' },
  { id: 'e5-6', source: '5', target: '6', type: 'smoothstep' },
];

// --- Loading Spinner ---
const Spinner = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-20">
    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
  </div>
);

// --- Main Diagram Component ---
export default function Diagram({
  orderItemId,
  onNodeClick,
}: {
  orderItemId: number;
  onNodeClick: (node: Node<NodeData>) => void;
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAndUpdateStages() {
      setLoading(true);
      const stages: OrderItemStage[] = await getOrderItemStageStatus(orderItemId);
      const statusMap = new Map(stages.map(s => [s.stage, s.status]));

      // Create the new nodes based on the fetched statuses
      const newNodes = initialNodes.map((node) => {
        const stageName = node.data.label;
        const newStatus = statusMap.get(stageName) as NodeStatus | undefined;
        const statusToApply = newStatus || 'pending'; // Default to 'pending' if status is not found
        return {
          ...node,
          data: {
            ...node.data,
            status: statusToApply,
          },
          selectable: statusToApply !== 'pending', // Only selectable if not pending
        };
      });

      // Create the new edges based on the NEW node statuses
      const newEdges = initialEdges.map((edge) => {
        const sourceNode = newNodes.find(n => n.id === edge.source);
        const isCompleted = sourceNode?.data.status === 'completed';
        return {
          ...edge,
          style: {
            stroke: isCompleted ? '#10B981' : '#D1D5DB', // green-500 or gray-300
            strokeWidth: 2,
          },
          animated: isCompleted,
        };
      });

      // Set both states at the same time
      setNodes(newNodes);
      setEdges(newEdges);
      setLoading(false);
    }

    if (orderItemId) {
      fetchAndUpdateStages();
    }
    // The dependency array only needs orderItemId, as the setters are stable
  }, [orderItemId, setNodes, setEdges]);

  const handleNodeClick = (event: React.MouseEvent, node: Node<NodeData>) => {
    if (node.data.status === 'active') {
      onNodeClick(node);
    }
  };

  return (
    <>
      {loading && <Spinner />}
      <div className="w-full h-full font-sans relative overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-gradient-to-br from-gray-50 to-gray-100"
          proOptions={{ hideAttribution: true }}
          panOnDrag={false}
          zoomOnScroll={false}
          zoomOnDoubleClick={false}
        />
      </div>
    </>
  );
}
