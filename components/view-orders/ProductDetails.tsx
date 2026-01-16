'use client';
import React, { useState, useEffect } from 'react';
import { formatReadableDate } from '@/lib/utils';
import { ImageUploadDisplayField } from '../place-order/image-upload-display-field';
import { Button } from '../ui/button';
import { Product } from '@/types/products';
import { updateProductAction } from '@/actions/update-product';
import { toast } from 'sonner';
import { InputField, ToggleGroupField, ComboboxField, TextAreaField } from '../place-order/product-fields';

interface ProductDetailsProps {
  details: Product;
  productType: 'sofa' | 'bed';
  orderItemId: number;
  onProductUpdate: (updatedProduct: Product) => void;
}

const formatLabel = (key: string) => {
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const ProductDetails: React.FC<ProductDetailsProps> = ({ details, productType, onProductUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState(details);
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [measurementImageFile, setMeasurementImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditedDetails(details);
    setReferenceImageFile(null);
    setMeasurementImageFile(null);
  }, [details]);

  const handleProductChange = <K extends keyof Product>(field: K, value: Product[K]) => {
    setEditedDetails(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    const formData = new FormData();

    // Append product details
    Object.entries(editedDetails).forEach(([key, value]) => {
      if (key !== 'reference_image_url' && key !== 'measurement_drawing_url') {
        formData.append(key, String(value));
      }
    });

    formData.append('id', String(editedDetails.id));
    formData.append('product_type', productType);

    // Append image files and their current URLs (or 'null' if removed)
    if (referenceImageFile) {
      formData.append('reference_image_file', referenceImageFile);
    } else {
      formData.append('reference_image_url_from_form', editedDetails.reference_image_url || 'null');
    }

    if (measurementImageFile) {
      formData.append('measurement_image_file', measurementImageFile);
    } else {
      formData.append('measurement_drawing_url_from_form', editedDetails.measurement_drawing_url || 'null');
    }

    try {
      const result = await updateProductAction(formData);
      if (result.success) {
        toast.success(result.message);
        setIsEditing(false);
        // Re-fetch product details to get updated URLs and data
        // This will trigger the useEffect to update editedDetails
        onProductUpdate({
          ...editedDetails,
          reference_image_url: result.newReferenceImageUrl || editedDetails.reference_image_url,
          measurement_drawing_url: result.newMeasurementImageUrl || editedDetails.measurement_drawing_url,
        });
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Failed to save product details:', error);
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditedDetails(details); // Revert to original details
    setReferenceImageFile(null);
    setMeasurementImageFile(null);
    setIsEditing(false);
  };

  const isDateKey = (key: string) => key.toLowerCase().includes('date') || key.toLowerCase().includes('at');

  const getOptionsForField = (key: string) => {
    switch (key) {
      case 'model_family_configuration':
        return [
          { value: '1 str', label: '1 STR' }, { value: '2 str', label: '2 STR' }, { value: '3 str', label: '3 STR' },
          { value: '3+2 str', label: '3+2 STR' }, { value: '3+daybed', label: '3+Daybed' }, { value: '2+daybed', label: '2+Daybed' },
          { value: '3+cnr+3', label: '3+CNR+3' }, { value: '3+cnr+2', label: '3+CNR+2' }, { value: '2+cnr+2', label: '2+CNR+2' },
          { value: '3+cnr+1', label: '3+CNR+1' }, { value: '2+cnr+1', label: '2+CNR+1' }, { value: '3+2+1', label: '3+2+1' },
        ];
      case 'recliner_mechanism_mode':
        return [{value: 'manual', label: 'Manual'}, {value: 'motorized_single', label: 'Motorized Single'}, {value: 'motorized_double', label: 'Motorized Double'}];
      case 'recliner_mechanism_flip':
        return [{value: 'single_flip', label: 'Single Flip'}, {value: 'double_flip', label: 'Double Flip'}, {value: 'double_motor_with_headrest', label: 'Double Motor with Headrest'}];
      case 'wood_to_floor':
        return [{value: true, label: 'Wood'}, {value: false, label: 'Metal'}];
      case 'headrest_mode':
        return [{value: 'manual', label: 'Manual'}, {value: 'motorized', label: 'Motorized'}];
      case 'cup_holder':
        return [{value: 'normal_push_back', label: 'Normal Push Back'}, {value: 'chiller_cup', label: 'Chiller Cup'}];
      case 'snack_swivel_tray':
        return [{value: true, label: 'Yes'}, {value: false, label: 'No'}];
      case 'daybed_headrest_mode':
        return [{value: 'manual', label: 'Manual'}, {value: 'motorized', label: 'Motorized'}];
      case 'daybed_position':
        return [{value: 'rhs', label: 'RHS'}, {value: 'lhs', label: 'LHS'}];
      case 'armrest_storage':
        return [{value: true, label: 'Yes'}, {value: false, label: 'No'}];
      case 'storage_side':
        return [{value: 'rhs_arm', label: 'RHS Arm'}, {value: 'lhs_arm', label: 'LHS Arm'}, {value: 'both_arm', label: 'Both Arms'}];
      case 'belt_details':
        return [{value: 'elastic_belt', label: 'Elastic Belt'}, {value: 'zig_zag_spring', label: 'Zig Zag Spring'}, {value: 'pocket_spring', label: 'Pocket Spring'}];
      case 'leg_type':
        return [{value: 'wood', label: 'Wood'}, {value: 'pvd', label: 'PVD'}, {value: 'ss', label: 'SS'}];
      case 'chester_option':
        return [{value: 'with_button', label: 'With Button'}, {value: 'without_button', label: 'Without Button'}];
      case 'polish_finish':
        return [{value: 'matt_finish', label: 'Matt Finish'}, {value: 'glossy_finish', label: 'Glossy Finish'}];
      case 'upholstery':
        return [
          {value: 'fabric', label: 'Fabric'}, {value: 'pu', label: 'PU'}, {value: 'leather_bloom', label: 'Leather Bloom'},
          {value: 'leather_floater', label: 'Leather Floater'}, {value: 'leather_floater_max', label: 'Leather Floater Max'},
          {value: 'leather_platinum_max', label: 'Leather Platinum Max'}, {value: 'leather_european_nappa', label: 'Leather European Nappa'},
          {value: 'leather_smoothy_nappa', label: 'Leather Smoothy Nappa'}, {value: 'pu_leather', label: 'PU Leather'}
        ];
      case 'bed_size':
        return [{value: 'king', label: 'King'}, {value: 'queen', label: 'Queen'}, {value: 'customized', label: 'Customized'}];
      case 'headboard_type':
        return [{value: 'medium_back_4ft', label: 'Medium Back 4ft'}, {value: 'high_back_4_5ft', label: 'High Back 4.5ft'}];
      case 'storage_option':
        return [{value: 'hydraulic', label: 'Hydraulic'}, {value: 'channel', label: 'Channel'}, {value: 'motorised', label: 'Motorised'}, {value: 'without_storage', label: 'Without Storage'}];
      case 'bed_portion':
        return [{value: 'single', label: 'Single'}, {value: 'double', label: 'Double'}];
      default:
        return null;
    }
  };

  const renderField = (key: string, value: unknown) => {
    const label = formatLabel(key);
    const fieldName = key as keyof Product;

    // Always display 'created_at' and 'product_type' as text
    if (key === 'created_at' || key === 'product_type') {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-600">{label}</span>
          <span className="text-gray-800">
            {isDateKey(key) && typeof value === 'string'
              ? formatReadableDate(value)
              : String(value)}
          </span>
        </div>
      );
    }

    // Handle 'id' specifically: disabled InputField when editing, span otherwise
    if (key === 'id') {
      if (isEditing) {
        return (
          <InputField
            label={label}
            name={key}
            value={String(value)}
            disabled={true}
            hideLabel={true} // Hide label when editing
          />
        );
      } else {
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-600">{label}</span>
            <span className="text-gray-800">
              {String(value)}
            </span>
          </div>
        );
      }
    }

    // Handle 'customization' field specifically
    if (key === 'customization') {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-600">{label}</span>
          <span className="text-gray-800">
            {value ? 'Yes' : 'No'}
          </span>
        </div>
      );
    }

    // Image URLs are handled by ImageUploadDisplayField
    if (key === 'reference_image_url' || key === 'measurement_drawing_url') {
      return null;
    }

    // If not editing, display as plain text with label
    if (!isEditing) {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-600">{label}</span>
          <span className="text-gray-800">
            {isDateKey(key) && typeof value === 'string'
              ? formatReadableDate(value)
              : typeof value === 'boolean'
              ? value ? 'Yes' : 'No'
              : String(value || 'N/A')}
          </span>
        </div>
      );
    }

    // Render editable fields using custom components
    const options = getOptionsForField(key);

    if (options) {
      // ToggleGroupField for boolean or specific string enums
      if (options.every(opt => typeof opt.value === 'boolean')) {
        return (
          <ToggleGroupField
            label={label}
            name={key}
            value={editedDetails[fieldName] as boolean | undefined}
            onValueChange={(val) => handleProductChange(fieldName, val)}
            options={options as {value: boolean, label: string}[]}
            disabled={isLoading}
            hideLabel={true} // Hide label when editing
          />
        );
      } else {
        // ComboboxField for string enums with many options
        return (
          <ComboboxField
            label={label}
            name={key}
            value={editedDetails[fieldName] as string | undefined}
            onValueChange={(val) => handleProductChange(fieldName, val)}
            options={options as {value: string, label: string}[]}
            placeholder={`Select ${label}`}
            disabled={isLoading}
            hideLabel={true} // Hide label when editing
          />
        );
      }
    }

    const originalValueType = typeof details[fieldName];

    if (originalValueType === 'number') {
      return (
        <InputField
          label={label}
          name={key}
          type="number"
          value={String(editedDetails[fieldName] ?? '')}
          onChange={(e) => handleProductChange(fieldName, parseFloat(e.target.value) || null)}
          disabled={isLoading}
          hideLabel={true} // Hide label when editing
        />
      );
    }

    if (key === 'description') {
      return (
        <TextAreaField
          label={label}
          name={key}
          value={String(editedDetails[fieldName] ?? '')}
          onChange={(e) => handleProductChange(fieldName, e.target.value)}
          disabled={isLoading}
          hideLabel={true} // Hide label when editing
        />
      );
    }

    // Default to InputField for other string types
    return (
      <InputField
        label={label}
        name={key}
        type="text"
        value={String(editedDetails[fieldName] ?? '')}
        onChange={(e) => handleProductChange(fieldName, e.target.value)}
        disabled={isLoading}
        hideLabel={true} // Hide label when editing
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold text-lg">{productType} Details</h4>
        <Button onClick={() => (isEditing ? handleCancel() : setIsEditing(true))} disabled={isLoading}>
          {isLoading ? 'Loading...' : isEditing ? 'Cancel' : 'Edit'}
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        {Object.entries(editedDetails).map(([key, value]) => (
          <div key={key} className="flex flex-col">
            {renderField(key, value)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <ImageUploadDisplayField
          label="Reference Image"
          name="reference_image_file"
          dbImageUrl={details.reference_image_url}
          file={referenceImageFile}
          onFileChange={setReferenceImageFile}
          disabled={!isEditing || isLoading}
        />
        <ImageUploadDisplayField
          label="Measurement Drawing"
          name="measurement_image_file"
          dbImageUrl={details.measurement_drawing_url}
          file={measurementImageFile}
          onFileChange={setMeasurementImageFile}
          disabled={!isEditing || isLoading}
        />
      </div>
      {isEditing && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
