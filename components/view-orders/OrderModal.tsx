"use client";
import React, { useState } from "react";
import { ArrowLeft, CalendarClock, ChevronDown, ChevronUp, Loader2, User } from "lucide-react";
import { Node } from "@xyflow/react";
import { Order, Priority, CheckItem } from "./types";
import { Product } from "@/types/products";
import { PRIORITY_CONFIG } from "./data";
import { StageBadges } from "./badges";
import getProductDetails from "@/actions/get-product-details";
import ProductDetails from "./ProductDetails";
import Diagram from "./production-flow";
import { getChecklistForStage } from "@/actions/get-checklist-for-stage";
import { Checklist } from "./Checklist";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { SegmentedControl } from "../ui/segmented-control";
import { cn, formatDisplayDate, isOverdue } from "@/lib/utils";

type NodeData = {
  label: string;
  status: 'pending' | 'active' | 'completed';
};

interface OrderModalProps {
  order: Order;
  onClose: () => void;
  onPriorityChange: (orderId: string, priority: Priority) => void;
}

type View = 'details' | 'flow' | 'checklist';

const OrderModal: React.FC<OrderModalProps> = ({
  order,
  onClose,
  onPriorityChange,
}) => {
  const [productDetails, setProductDetails] = useState<Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isLoadingChecklist, setIsLoadingChecklist] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [view, setView] = useState<View>('details');
  const [checklistData, setChecklistData] = useState<CheckItem[]>([]);
  const [selectedStage, setSelectedStage] = useState<{ id: string; name: string } | null>(null);

  const overdue = order.stage !== "delivered" && isOverdue(order.dueDate);

  const handleNodeClick = async (node: Node<NodeData>) => {
    setIsLoadingChecklist(true);
    try {
      const checklist = await getChecklistForStage(Number(order.id), parseInt(node.id, 10));
      setChecklistData(checklist);
      setSelectedStage({ id: node.id, name: node.data.label });
      setView('checklist');
    } catch (error) {
      console.error('Failed to fetch checklist:', error);
    } finally {
      setIsLoadingChecklist(false);
    }
  };

  const toggleProductDetails = async () => {
    if (showProductDetails) {
      setShowProductDetails(false);
      return;
    }
    setIsLoadingProduct(true);
    const details = await getProductDetails(order.productId, order.productType);
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
    setIsLoadingProduct(false);
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("flex max-h-[90vh] flex-col gap-0 p-0", view === 'details' ? "sm:max-w-3xl" : "sm:max-w-5xl")}>
        <DialogHeader className="space-y-1 border-b p-6 pr-12 text-left">
          <DialogTitle className="text-xl">
            #{order.id} · {order.product}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <User className="size-3.5" /> {order.customer}
          </DialogDescription>
          {view !== 'checklist' && (
            <SegmentedControl
              aria-label="Order view"
              value={view}
              onChange={setView}
              options={[
                { value: 'details', label: 'Details' },
                { value: 'flow', label: 'Production flow' },
              ]}
              className="mt-3 w-full sm:w-80"
            />
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          {view === 'details' && (
            <div className="space-y-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border p-4">
                  <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Due date</dt>
                  <dd className={cn("mt-1 flex items-center gap-1.5 font-medium", overdue ? "text-destructive" : "text-foreground")}>
                    <CalendarClock className="size-4" />
                    {formatDisplayDate(order.dueDate)}
                    {overdue && <span className="text-xs font-normal">(overdue)</span>}
                  </dd>
                </div>
                <div className="rounded-lg border p-4">
                  <dt className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Priority</dt>
                  <dd>
                    <Select
                      value={String(order.priority)}
                      onValueChange={(value) => onPriorityChange(order.id, Number(value) as Priority)}
                    >
                      <SelectTrigger className="h-8 w-full" aria-label="Priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(PRIORITY_CONFIG) as unknown as Priority[])
                          .sort((a, b) => Number(b) - Number(a))
                          .map((p) => (
                            <SelectItem key={p} value={String(p)}>{PRIORITY_CONFIG[p].label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </dd>
                </div>
                <div className="rounded-lg border p-4">
                  <dt className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">Stage</dt>
                  <dd><StageBadges stages={order.stage} /></dd>
                </div>
              </dl>

              <section className="rounded-lg border">
                <button
                  type="button"
                  onClick={toggleProductDetails}
                  disabled={isLoadingProduct}
                  aria-expanded={showProductDetails}
                  className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span>
                    <span className="block font-medium text-foreground">Product specification</span>
                    <span className="block text-sm capitalize text-muted-foreground">{order.productType} · {order.product}</span>
                  </span>
                  {isLoadingProduct
                    ? <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    : showProductDetails ? <ChevronUp className="size-4 text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
                </button>
                {showProductDetails && productDetails && (
                  <div className="border-t p-4">
                    <ProductDetails
                      details={productDetails}
                      productType={order.productType}
                      orderItemId={Number(order.id)}
                      onProductUpdate={(updatedProduct) => setProductDetails(updatedProduct)}
                    />
                  </div>
                )}
                {productError && (
                  <p className="border-t p-4 text-sm text-destructive">{productError}</p>
                )}
              </section>
            </div>
          )}

          {view === 'flow' && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Click an active stage to open its quality checklist.
                {isLoadingChecklist && <Loader2 className="ml-2 inline size-4 animate-spin" />}
              </p>
              <div className="relative h-[55vh] overflow-hidden rounded-lg border">
                <Diagram orderItemId={Number(order.id)} onNodeClick={handleNodeClick} />
              </div>
            </div>
          )}

          {view === 'checklist' && selectedStage && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-foreground">Checklist · {selectedStage.name}</h3>
                <Button variant="outline" size="sm" onClick={() => setView('flow')}>
                  <ArrowLeft /> Back to flow
                </Button>
              </div>
              <Checklist
                checklist={checklistData}
                orderItemId={Number(order.id)}
                stageName={selectedStage.name}
                stageId={parseInt(selectedStage.id, 10)}
                onProceed={() => setView('flow')}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;
