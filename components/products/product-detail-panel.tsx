'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { Product } from '@/types/products';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const formatValue = (value: string | number | boolean | undefined | null) => {
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value !== 'string') return value;
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

interface ProductDetailPanelProps {
  product: Product | null;
  onClose: () => void;
}

type Detail = { label: string; value: string | number | boolean | undefined | null };

const DetailGrid = ({ title, items }: { title: string; items: Detail[] }) => {
  const visible = items.filter((item) => item.value !== null && item.value !== undefined && item.value !== '');
  if (visible.length === 0) return null;
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {visible.map((item) => (
          <div key={item.label} className="min-w-0">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="break-words font-medium text-foreground">{String(formatValue(item.value))}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
};

const ImagePreview = ({ label, imageUrl }: { label: string; imageUrl: string | null | undefined }) => {
  if (!imageUrl) return null;
  return (
    <figure className="space-y-1.5">
      <figcaption className="text-xs text-muted-foreground">{label}</figcaption>
      <div className="relative h-44 w-full overflow-hidden rounded-lg border bg-muted">
        <Image src={imageUrl} alt={label} fill sizes="384px" className="object-contain" />
      </div>
    </figure>
  );
};

export default function ProductDetailPanel({ product, onClose }: ProductDetailPanelProps) {
  if (!product) return null;

  const productType = 'bed_size' in product ? 'bed' : 'sofa';

  return (
    <div className="flex max-h-[calc(100vh-3rem)] flex-col rounded-xl border bg-card shadow-sm">
      <div className="flex items-start justify-between gap-3 border-b p-5">
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{product.model_name}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="capitalize">{productType}</Badge>
            {product.customization && <Badge variant="accent">Customised</Badge>}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close product details">
          <X />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}

        <div className="space-y-3">
          <ImagePreview label="Reference image" imageUrl={product.reference_image_url} />
          <ImagePreview label="Measurement drawing" imageUrl={product.measurement_drawing_url} />
        </div>

        {productType === 'sofa' && (
          <DetailGrid title="Configuration" items={[
            { label: 'Model family', value: product.model_family_configuration?.toUpperCase() },
            { label: '2 seater length', value: product['2_seater_length'] },
            { label: '1 seater length', value: product['1_seater_length'] },
            { label: 'Recliner', value: product.recliner_mechanism_mode },
            { label: 'Recliner flip', value: product.recliner_mechanism_flip },
            { label: 'Wood to floor', value: typeof product.wood_to_floor === 'boolean' ? (product.wood_to_floor ? 'Wood' : 'Metal') : null },
            { label: 'Headrest', value: product.headrest_mode },
            { label: 'Cup holder', value: product.cup_holder },
            { label: 'Daybed headrest', value: product.daybed_headrest_mode },
            { label: 'Daybed position', value: product.daybed_position?.toUpperCase() },
            { label: 'Storage side', value: product.storage_side },
            { label: 'Snack swivel tray', value: product.snack_swivel_tray },
            { label: 'Armrest storage', value: product.armrest_storage },
            { label: 'Belt', value: product.belt_details },
            { label: 'Legs', value: product.leg_type },
            { label: 'Chester', value: product.chester_option },
          ]} />
        )}

        {productType === 'bed' && (
          <DetailGrid title="Bed" items={[
            { label: 'Bed size', value: product.bed_size },
            { label: 'Custom mattress size', value: product.customized_mattress_size },
            { label: 'Headboard', value: product.headboard_type },
            { label: 'Storage', value: product.storage_option },
            { label: 'Bed portion', value: product.bed_portion },
          ]} />
        )}

        <DetailGrid title="Dimensions (in)" items={[
          { label: 'Width', value: product.total_width },
          { label: 'Depth', value: product.total_depth },
          { label: 'Height', value: product.total_height },
          ...(productType === 'sofa' ? [
            { label: 'Seat height', value: product.seat_height },
            { label: 'Seat depth', value: product.seat_depth },
            { label: 'Seat width', value: product.seat_width },
            { label: 'Armrest width', value: product.armrest_width },
            { label: 'Armrest depth', value: product.armrest_depth },
          ] : []),
        ]} />

        <DetailGrid title="Upholstery & finish" items={[
          { label: 'Upholstery', value: product.upholstery },
          { label: 'Upholstery colour', value: product.upholstery_color },
          { label: 'Polish colour', value: product.polish_color },
          { label: 'Polish finish', value: product.polish_finish },
        ]} />
      </div>
    </div>
  );
}
