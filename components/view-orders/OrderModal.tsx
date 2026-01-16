"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Order, Priority, CheckItem } from "./types";
import { Product } from "@/types/products";
import { PRIORITY_CONFIG } from "./data";
import { icons } from "./icons";
import getProductDetails from "@/actions/get-product-details";
import ProductDetails from "./ProductDetails";
import Diagram from "./production-flow";
import { getChecklistForStage } from "@/actions/get-checklist-for-stage";
import { Checklist } from "./Checklist";
import { Button } from "../ui/button";
import { Node } from "@xyflow/react";

type NodeData = {
  label: string;
  status: 'pending' | 'active' | 'completed';
};

interface OrderModalProps {
  order: Order;
  onClose: () => void;
  onPriorityChange: (orderId: string, priority: Priority) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({
  order,
  onClose,
  onPriorityChange,
}) => {
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false); // New state to control visibility
  const [view, setView] = useState<'details' | 'flow' | 'checklist'>('details');
  const [checklistData, setChecklistData] = useState<CheckItem[]>([]);
  const [selectedStage, setSelectedStage] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleNodeClick = async (node: Node<NodeData>) => {
    setIsLoading(true);
    try {
      const checklist = await getChecklistForStage(
        Number(order.id),
        parseInt(node.id, 10)
      );
      setChecklistData(checklist);
      setSelectedStage({ id: node.id, name: node.data.label });
      setView('checklist');
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      suppressHydrationWarning
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`bg-white rounded-2xl shadow-2xl w-full ${view === 'checklist' ? 'max-w-6xl' : 'max-w-4xl'} text-black border border-gray-200 flex flex-col max-h-[90vh] transition-all duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {view !== 'checklist' && (
          <div className="p-6 border-b border-gray-200 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-black">
                {order.id} - <span className="text-red-600">{order.product}</span>
              </h2>
              <p className="text-sm text-gray-600">{order.customer}</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-black">
              <icons.close />
            </button>
          </div>
        )}

        <div className="p-6 flex-grow overflow-y-auto">
          <AnimatePresence mode="wait">
            {view === 'flow' && (
              <motion.div
                key="diagram"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                className="h-[60vh]"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-red-600">
                    Production Flow
                  </h3>
                  <button
                    onClick={() => setView('details')}
                    className="text-sm text-gray-600 hover:text-red-600 flex items-center gap-1 ml-auto"
                  >
                    &larr; Back to Details
                  </button>
                </div>
                <div className="w-full h-full bg-white relative overflow-hidden">
                  <Diagram
                    orderItemId={Number(order.id)}
                    onNodeClick={handleNodeClick}
                  />
                </div>
              </motion.div>
            )}

            {view === 'checklist' && selectedStage && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col h-full"
              >
                <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-2xl">
                  <div className="flex justify-end">
                    <button onClick={onClose} className="text-gray-500 hover:text-black">
                      <icons.close />
                    </button>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-black">
                        {order.id} - <span className="text-red-600">{order.product}</span>
                      </h2>
                      <p className="text-sm text-gray-600">{order.customer}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => setView('flow')} variant="outline">
                        &larr; Back to Flow
                      </Button>
                      <Button onClick={() => setView('details')} variant="outline">
                        &larr; Back to Details
                      </Button>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Checklist for {selectedStage.name}</h3>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                  <Checklist
                    checklist={checklistData}
                    orderItemId={Number(order.id)}
                    stageName={selectedStage.name}
                    stageId={parseInt(selectedStage.id, 10)}
                    onProceed={() => setView('flow')}
                  />
                </div>
              </motion.div>
            )}

            {view === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4 text-sm">
                    <h3 className="text-lg font-semibold text-black mb-2">
                      Order Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4 bg-gray-100/50 p-4 rounded-lg">
                      <div>
                        <span className="font-semibold text-gray-600 block">
                          Customer
                        </span>
                        <p>{order.customer}</p>
                      </div>
                      <div>
                        <button
                          onClick={async () => {
                            if (showProductDetails) {
                              setShowProductDetails(false);
                            } else {
                              setIsLoading(true);
                              const details = await getProductDetails(
                                order.productId,
                                order.productType
                              );
                              if (details.errors) {
                                const errorMessage = (details.errors as { database?: string[] }).database?.[0] ||
                                  Object.values(details.errors).flat()[0] ||
                                  'Failed to fetch product details.';
                                setProductError(errorMessage);
                                setProductDetails(null);
                                setShowProductDetails(false);
                              } else {
                                setProductDetails(details.data);
                                setProductError(null);
                                setShowProductDetails(true);
                              }
                              setIsLoading(false);
                            }
                          }}
                          className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                          disabled={isLoading}
                        >
                          {isLoading
                            ? "Loading..."
                            : showProductDetails
                            ? "Collapse Details"
                            : "View Details"}
                        </button>
                      </div>
                      {showProductDetails && productDetails && (
                        <div className="col-span-2 mt-4">
                          <ProductDetails
                            details={productDetails}
                            productType={order.productType}
                            orderItemId={Number(order.id)}
                            onProductUpdate={(updatedProduct) => setProductDetails(updatedProduct)}
                          />
                        </div>
                      )}
                      {productError && (
                        <div className="col-span-2 mt-4 text-red-500">
                              {productError}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-black mb-2">
                          Status & Priority
                        </h3>
                        <div className="bg-gray-100/50 p-4 rounded-lg space-y-4">
                          <div>
                            <span className="font-semibold text-gray-600 block">
                              Due Date
                            </span>
                            <p
                              className={`${
                                new Date(order.dueDate) < new Date()
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {new Date(order.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="font-semibold text-gray-600 block mb-1">
                              Priority
                            </label>
                            <select
                              value={order.priority}
                              onChange={(e) =>
                                onPriorityChange(
                                  order.id,
                                  Number(e.target.value) as Priority
                                )
                              }
                              className="w-full bg-gray-200 border border-gray-300 rounded-md p-2 focus:ring-red-500 focus:border-red-500"
                            >
                              {Object.keys(PRIORITY_CONFIG).map((p) => (
                                <option key={p} value={p}>
                                  {p}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50/30 rounded-b-2xl">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  {/* Stage progress bar remains the same */}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setView('flow')}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-100 hover:bg-red-200 transition-colors"
                  >
                    View Flow
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      );
    };

export default OrderModal;
