// components/products/edit-product-modal.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Product } from '@/types/products';
import EditProductForm from './edit-product-form';

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onProductUpdate: () => void;
}

export default function EditProductModal({ isOpen, onClose, product, onProductUpdate }: EditProductModalProps) {
  if (!product) {
    return null;
  }

  // Determine product type. 'bed_size' is a property unique to beds in your schema.
  const productType = 'bed_size' in product ? 'bed' : 'sofa';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product: {product.model_name}</DialogTitle>
          <DialogDescription>
            Make changes to the product details below. Click save when you{"'"}re done.
          </DialogDescription>
        </DialogHeader>
        {/* The form receives the product data and a callback to close the modal */}
        <EditProductForm
          product={product}
          productType={productType}
          onFormSubmit={onProductUpdate}
        />
      </DialogContent>
    </Dialog>
  );
}
