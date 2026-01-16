// components/ProductHeaderActions.tsx
'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import AddProductModal from '@/components/products/add-product-modal';

export default function ProductHeaderActions() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <AddProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <Button onClick={() => setIsModalOpen(true)}>+ Add Product</Button>
    </>
  );
}