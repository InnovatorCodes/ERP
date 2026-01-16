// components/products/edit-product-form.tsx
'use client';

import { useState, useTransition, useCallback, useRef } from 'react';
import { Product, ProductWithFiles } from '@/types/products';
import { updateProductAction } from '@/actions/update-product';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ImageUploadDisplayField } from '../place-order/image-upload-display-field';
import { SharedSofaDetailsForm } from '../shared/sofa-details-form';
import { SharedBedDetailsForm } from '../shared/bed-details-form';
import { InputField } from '../place-order/product-fields';

interface EditProductFormProps {
  product: Product;
  productType: 'sofa' | 'bed';
  onFormSubmit: () => void;
}

export default function EditProductForm({ product: initialProduct, productType, onFormSubmit }: EditProductFormProps) {
  const [isPending, startTransition] = useTransition();
  const [product, setProduct] = useState<ProductWithFiles>(initialProduct);
  const formRef = useRef<HTMLFormElement>(null);

  const handleProductChange = useCallback((index: number, field: keyof ProductWithFiles, value: unknown) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProduct(prev => ({ ...prev, [name]: value }));
  };

  const clientAction = async (formData: FormData) => {
    Object.entries(product).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.set(key, String(value));
      }
    });

    startTransition(async () => {
      const result = await updateProductAction(formData);
      if (result.success) {
        toast.success(result.message);
        onFormSubmit();
      } else {
        toast.error(`Error: ${result.message}`);
      }
    });
  };

  return (
    <form ref={formRef} action={clientAction} className="space-y-6">
      <input type="hidden" name="id" value={product.id} />
      <input type="hidden" name="product_type" value={productType} />

      <div className="space-y-4 border-t pt-6">
        <h3 className="text-lg font-semibold col-span-full">General Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField name="model_name" label="Model Name" value={product.model_name || ''} onChange={handleInputChange} placeholder="e.g., Elegance Sofa" />
          <div>
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</Label>
            <Textarea id="description" name="description" value={product.description || ''} onChange={handleInputChange} placeholder="A brief description of the product" className="h-24" />
          </div>
          <ImageUploadDisplayField
            label="Reference Image"
            name="reference_image_file"
            dbImageUrl={typeof product.reference_image_url === 'string' ? product.reference_image_url : undefined}
            file={product.reference_image_url instanceof File ? product.reference_image_url : null}
            onFileChange={(file) => handleProductChange(0, 'reference_image_url', file)}
            disabled={isPending}
          />
          <ImageUploadDisplayField
            label="Measurement Drawing"
            name="measurement_image_file"
            dbImageUrl={typeof product.measurement_drawing_url === 'string' ? product.measurement_drawing_url : undefined}
            file={product.measurement_drawing_url instanceof File ? product.measurement_drawing_url : null}
            onFileChange={(file) => handleProductChange(0, 'measurement_drawing_url', file)}
            disabled={isPending}
          />
        </div>

        {productType === 'sofa' && (
          <SharedSofaDetailsForm
            index={0}
            product={product}
            handleProductChange={handleProductChange}
            disabled={isPending}
            baseName=""
          />
        )}

        {productType === 'bed' && (
          <SharedBedDetailsForm
            index={0}
            product={product}
            handleProductChange={handleProductChange}
            disabled={isPending}
            baseName=""
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
        <Button type="button" variant="ghost" onClick={onFormSubmit} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
