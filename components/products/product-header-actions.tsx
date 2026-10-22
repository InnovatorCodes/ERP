'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import AddProductModal from '@/components/products/add-product-modal';

export default function ProductHeaderActions({ onProductsChanged }: { onProductsChanged?: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <AddProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          onProductsChanged?.();
        }}
      />
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus /> Add product
      </Button>
    </>
  );
}
