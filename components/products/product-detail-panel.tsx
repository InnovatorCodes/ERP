'use client';

import { Product } from '@/types/products';
import { X, Package, Settings, Sofa, Bed, Ruler, Paintbrush } from 'lucide-react';
import Image from 'next/image';

const formatValue = (value: string | number | boolean | undefined | null) => {
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

const DetailItem = ({ Icon, label, value }: { Icon: React.ElementType, label: string; value: string | number | boolean | undefined | null }) => {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start text-sm">
        <Icon className="h-4 w-4 text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex flex-col">
            <span className="text-gray-500">{label}</span>
            <span className="text-gray-900 font-medium">{String(value)}</span>
        </div>
    </div>
  );
};

const ImagePreview = ({ label, imageUrl }: { label: string; imageUrl: string | File | null | undefined }) => {
    if (!imageUrl) return null;

    const getImageUrl = () => {
        if (typeof imageUrl === 'string') {
            return imageUrl;
        }
        if (imageUrl instanceof File) {
            return URL.createObjectURL(imageUrl);
        }
        return '/placeholder.png';
    };

    return (
        <div className="space-y-2">
            <span className="text-sm text-gray-500">{label}</span>
            <div className="relative w-full h-48 rounded-lg overflow-hidden">
                <Image src={getImageUrl()} alt={label} layout="fill" objectFit="contain" className="bg-gray-100" />
            </div>
        </div>
    );
};

export default function ProductDetailPanel({ product, onClose }: ProductDetailPanelProps) {
  if (!product) return null;

  const productType = 'bed_size' in product ? 'bed' : 'sofa';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
                <div className="ml-4">
                    <h3 className="text-2xl font-bold text-gray-900">{product.model_name}</h3>
                    <p className="text-gray-500 capitalize">{productType}</p>
                </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-6 w-6" />
            </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 space-y-6">
            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">General Information</h4>
                <div className="space-y-4">
                    <DetailItem Icon={Package} label="Description" value={product.description} />
                    <ImagePreview label="Reference Image" imageUrl={product.reference_image_url} />
                    <ImagePreview label="Measurement Drawing" imageUrl={product.measurement_drawing_url} />
                </div>
            </div>

            {productType === 'sofa' && (
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Sofa Configuration</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem Icon={Sofa} label="Model Family" value={formatValue(product.model_family_configuration)} />
                        <DetailItem Icon={Ruler} label="2 Seater Length" value={product['2_seater_length']} />
                        <DetailItem Icon={Ruler} label="1 Seater Length" value={product['1_seater_length']} />
                        <DetailItem Icon={Settings} label="Recliner Mechanism" value={formatValue(product.recliner_mechanism_mode)} />
                        <DetailItem Icon={Settings} label="Recliner Flip" value={formatValue(product.recliner_mechanism_flip)} />
                        <DetailItem Icon={Settings} label="Wood to Floor" value={typeof product.wood_to_floor === 'boolean' ? (product.wood_to_floor ? 'Wood' : 'Metal') : product.wood_to_floor} />
                        <DetailItem Icon={Settings} label="Headrest Mode" value={formatValue(product.headrest_mode)} />
                        <DetailItem Icon={Settings} label="Cup Holder" value={formatValue(product.cup_holder)} />
                        <DetailItem Icon={Settings} label="Daybed Headrest" value={formatValue(product.daybed_headrest_mode)} />
                        <DetailItem Icon={Settings} label="Daybed Position" value={formatValue(product.daybed_position)} />
                        <DetailItem Icon={Settings} label="Storage Side" value={formatValue(product.storage_side)} />
                        <DetailItem Icon={Settings} label="Snack Swivel Tray" value={typeof product.snack_swivel_tray === 'boolean' ? (product.snack_swivel_tray ? 'Yes' : 'No') : product.snack_swivel_tray} />
                        <DetailItem Icon={Settings} label="Armrest Storage" value={typeof product.armrest_storage === 'boolean' ? (product.armrest_storage ? 'Yes' : 'No') : product.armrest_storage} />
                    </div>
                </div>
            )}

            {productType === 'bed' && (
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bed Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <DetailItem Icon={Bed} label="Bed Size" value={product.bed_size} />
                        <DetailItem Icon={Ruler} label="Custom Mattress Size" value={product.customized_mattress_size} />
                        <DetailItem Icon={Bed} label="Headboard Type" value={formatValue(product.headboard_type)} />
                        <DetailItem Icon={Bed} label="Storage Option" value={formatValue(product.storage_option)} />
                        <DetailItem Icon={Bed} label="Bed Portion" value={formatValue(product.bed_portion)} />
                    </div>
                </div>
            )}

            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Dimensions (in.)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem Icon={Ruler} label="Total Width" value={product.total_width} />
                    <DetailItem Icon={Ruler} label="Total Depth" value={product.total_depth} />
                    <DetailItem Icon={Ruler} label="Total Height" value={product.total_height} />
                    {productType === 'sofa' && (
                    <>
                        <DetailItem Icon={Ruler} label="Seat Height" value={product.seat_height} />
                        <DetailItem Icon={Ruler} label="Seat Depth" value={product.seat_depth} />
                        <DetailItem Icon={Ruler} label="Seat Width" value={product.seat_width} />
                        <DetailItem Icon={Ruler} label="Armrest Width" value={product.armrest_width} />
                        <DetailItem Icon={Ruler} label="Armrest Depth" value={product.armrest_depth} />
                    </>
                    )}
                </div>
            </div>

            <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Upholstery & Finish</h4>
                <div className="grid grid-cols-2 gap-4">
                    <DetailItem Icon={Paintbrush} label="Upholstery" value={formatValue(product.upholstery)} />
                    <DetailItem Icon={Paintbrush} label="Upholstery Color" value={product.upholstery_color} />
                    <DetailItem Icon={Paintbrush} label="Polish Color" value={product.polish_color} />
                    <DetailItem Icon={Paintbrush} label="Polish Finish" value={formatValue(product.polish_finish)} />
                </div>
            </div>
        </div>
    </div>
  );
}
