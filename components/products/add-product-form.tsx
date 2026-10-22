// components/AddProductForm.tsx
'use client';

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Upload, X } from "lucide-react";
import { useState, useCallback, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { addProductAction } from '@/actions/add-product';
import { Button } from '@/components/ui/button';
import { ToggleGroupField} from '../place-order/product-fields';
import { toast } from 'sonner';
import { SharedSofaDetailsForm } from '../shared/sofa-details-form';
import { SharedBedDetailsForm } from '../shared/bed-details-form';
import { ProductWithFiles } from '@/types/products';

type ProductType = 'sofa' | 'bed';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Adding Product...' : 'Add Product'}
    </Button>
  );
}

interface FileUploadFieldProps {
  label: string
  name: string
  accept?: string
}

export function FileUploadField({ label, name, accept }: FileUploadFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor={name}>{label}</Label>
      <div
        className={cn(
          "relative flex w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed bg-card px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring"
        )}
      >
        <input
          ref={inputRef}
          id={name}
          name={name}
          type="file"
          accept={accept}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={(e) => {
            const file = e.target.files?.[0]
            setFileName(file ? file.name : null)
          }}
        />

        {fileName ? (
          <div className="relative z-10 flex items-center gap-2 text-foreground">
            <Upload className="size-4 text-primary" />
            <span className="max-w-[12rem] truncate">{fileName}</span>
            <button
              type="button"
              aria-label="Remove file"
              onClick={() => {
                setFileName(null)
                if (inputRef.current) inputRef.current.value = ""
              }}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="mb-1 size-6" />
            <span><span className="font-medium text-primary">Click to upload</span> or drag & drop</span>
            <span className="text-xs">{accept?.includes('pdf') ? 'PNG, JPG or PDF' : 'PNG or JPG'}, up to 10 MB</span>
          </div>
        )}
      </div>
    </div>
  )
}


export default function AddProductForm({ onClose }: { onClose: () => void }) {
  const [productType, setProductType] = useState<ProductType>('sofa');
  const [product, setProduct] = useState<ProductWithFiles>({} as ProductWithFiles);
  const formRef = useRef<HTMLFormElement>(null);

  const handleProductChange = useCallback((index: number, field: keyof ProductWithFiles, value: unknown) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  }, []);

  const formAction = async () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    
    // Manually append product state to FormData
    Object.entries(product).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            formData.append(key, String(value));
        }
    });
    formData.set('product_type', productType);

    const result = await addProductAction(formData);
    if (result.success) {
        toast.success(result.message);
        onClose(); // Close modal on success
    } else {
        toast.error(result.message);
    }
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      {/* --- PRODUCT TYPE SELECTOR --- */}
      <ToggleGroupField
        name="product_type"
        label="Product Type"
        value={productType}
        onValueChange={(value) => setProductType(value as ProductType)}
        disabled={false}
        options={[ { label: 'Sofa', value: 'sofa' }, { label: 'Bed', value: 'bed' } ]}
      />
      
      <div className="space-y-4 border-t pt-6">
        {/* --- COMMON FIELDS --- */}
        <h3 className="font-semibold text-foreground">General information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FileUploadField 
              label="Reference Image" 
              name="reference_image_url" 
              accept="image/*" 
            />
            <FileUploadField 
              label="Measurement Drawing" 
              name="measurement_drawing_url" 
              accept="image/*,.pdf" 
            />
        </div>

        {/* --- CONDITIONAL SOFA FIELDS --- */}
        {productType === 'sofa' && (
          <SharedSofaDetailsForm
            index={0}
            product={product}
            handleProductChange={handleProductChange}
            disabled={false}
            baseName=""
          />
        )}

        {/* --- CONDITIONAL BED FIELDS --- */}
        {productType === 'bed' && (
          <SharedBedDetailsForm
            index={0}
            product={product}
            handleProductChange={handleProductChange}
            disabled={false}
            baseName=""
          />
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancel</Button>
        <SubmitButton />
      </div>
    </form>
  );
}
