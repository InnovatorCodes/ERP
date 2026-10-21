// actions/add-product.ts
'use server';

import { revalidatePath } from 'next/cache';
import { authorize, ROLES } from '@/lib/auth';
import { IMAGE_BUCKET, newImagePath, type ImageFolder } from '@/lib/storage';

// Helper to convert empty strings/invalid numbers to null
const getNullIfEmpty = (value: FormDataEntryValue | null) => (value === '' || value === 'null' ? null : value);
const getNumberOrNull = (value: FormDataEntryValue | null) => {
    const str = getNullIfEmpty(value);
    if (str === null) return null;
    const num = Number(str);
    return isNaN(num) ? null : num;
}

const getNumberOrZero = (value: FormDataEntryValue | null) => {
    const str = getNullIfEmpty(value);
    if (str === null) return 0;
    const num = Number(str);
    return isNaN(num) ? 0 : num;
};

export async function addProductAction(formData: FormData) {
  const auth = await authorize(ROLES.SALES);
  if (!auth.ok) return { success: false, message: auth.message };
  const supabase = auth.supabase;

  const productType = formData.get('product_type');
  const modelName = String(formData.get('model_name') ?? '').trim();

  if (productType !== 'sofa' && productType !== 'bed') {
    return { success: false, message: 'Invalid product type specified.' };
  }
  if (!modelName) {
    return { success: false, message: 'Model name is required.' };
  }

  // Images uploaded in this request, removed again if the product isn't saved.
  const uploaded: string[] = [];
  const uploadImage = async (field: string, folder: ImageFolder) => {
    const file = formData.get(field);
    if (!(file instanceof File) || file.size === 0) return null;
    const path = newImagePath(folder, file.name);
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw new Error(`Failed to upload the ${folder} image: ${error.message}`);
    uploaded.push(path);
    return path;
  };

  try {
    // The database's unique index on lower(model_name) also rejects duplicates.
    const referenceImageUrl = await uploadImage('reference_image_url', 'reference');
    const measurementDrawingUrl = await uploadImage('measurement_drawing_url', 'measurement');

    if (productType === 'sofa') {
      const sofaData = {
        // General
        model_name: modelName,
        description: getNullIfEmpty(formData.get('description')),
        reference_image_url: referenceImageUrl,
        measurement_drawing_url: measurementDrawingUrl,
        // Sofa Configuration
        model_family_configuration: getNullIfEmpty(formData.get('model_family_configuration')),
        "2_seater_length": getNumberOrZero(formData.get('2_seater_length')),
        "1_seater_length": getNumberOrZero(formData.get('1_seater_length')),
        // Mechanism
        recliner_mechanism_mode: getNullIfEmpty(formData.get('recliner_mechanism_mode')),
        recliner_mechanism_flip: getNullIfEmpty(formData.get('recliner_mechanism_flip')),
        headrest_mode: getNullIfEmpty(formData.get('headrest_mode')),
        cup_holder: getNullIfEmpty(formData.get('cup_holder')),
        daybed_headrest_mode: getNullIfEmpty(formData.get('daybed_headrest_mode')),
        daybed_position: getNullIfEmpty(formData.get('daybed_position')),
        storage_side: getNullIfEmpty(formData.get('storage_side')),
        snack_swivel_tray: formData.get('snack_swivel_tray') === 'true',
        armrest_storage: formData.get('armrest_storage') === 'true',
        // Comfort
        foam_density_seating: getNumberOrNull(formData.get('foam_density_seating')),
        foam_density_backrest: getNumberOrNull(formData.get('foam_density_backrest')),
        belt_details: getNullIfEmpty(formData.get('belt_details')),
        // Legs & Finishes
        leg_type: getNullIfEmpty(formData.get('leg_type')),
        pvd_color: getNullIfEmpty(formData.get('pvd_color')),
        chester_option: getNullIfEmpty(formData.get('chester_option')),
        armrest_panels: getNullIfEmpty(formData.get('armrest_panels')),
        wood_to_floor: formData.get('wood_to_floor') === 'true',
        // Dimensions
        total_width: getNumberOrNull(formData.get('total_width')),
        total_depth: getNumberOrNull(formData.get('total_depth')),
        total_height: getNumberOrNull(formData.get('total_height')),
        seat_height: getNumberOrNull(formData.get('seat_height')),
        seat_depth: getNumberOrNull(formData.get('seat_depth')),
        seat_width: getNumberOrNull(formData.get('seat_width')),
        armrest_width: getNumberOrNull(formData.get('armrest_width')),
        armrest_depth: getNumberOrNull(formData.get('armrest_depth')),
        // Upholstery & Finish
        upholstery: getNullIfEmpty(formData.get('upholstery')),
        upholstery_color: getNullIfEmpty(formData.get('upholstery_color')),
        polish_color: getNullIfEmpty(formData.get('polish_color')),
        polish_finish: getNullIfEmpty(formData.get('polish_finish')),
        customization: false,
      };
      
      const { error } = await supabase.from('sofa_products').insert([sofaData]);
      if (error) throw error;

    } else {
      const bedData = {
        model_name: modelName,
        description: getNullIfEmpty(formData.get('description')),
        reference_image_url: referenceImageUrl,
        measurement_drawing_url: measurementDrawingUrl,
        bed_size: getNullIfEmpty(formData.get('bed_size')),
        customized_mattress_size: getNullIfEmpty(formData.get('customized_mattress_size')),
        headboard_type: getNullIfEmpty(formData.get('headboard_type')),
        storage_option: getNullIfEmpty(formData.get('storage_option')),
        bed_portion: getNullIfEmpty(formData.get('bed_portion')),
        total_width: getNumberOrNull(formData.get('total_width')),
        total_depth: getNumberOrNull(formData.get('total_depth')),
        total_height: getNumberOrNull(formData.get('total_height')),
        upholstery: getNullIfEmpty(formData.get('upholstery')),
        upholstery_color: getNullIfEmpty(formData.get('upholstery_color')),
        polish_color: getNullIfEmpty(formData.get('polish_color')),
        polish_finish: getNullIfEmpty(formData.get('polish_finish')),
        customization: false,
      };

      const { error } = await supabase.from('bed_products').insert([bedData]);
      if (error) throw error;
    }

    revalidatePath('/products');
    return { success: true, message: 'Product added successfully!' };

  } catch (error: unknown) {
    console.error('Error adding product:', error);
    if (uploaded.length > 0) {
      await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);
    }
    const code = (error as { code?: string })?.code;
    if (code === '23505') {
      return { success: false, message: `A ${productType} with the model name "${modelName}" already exists.` };
    }
    if (code === '23514' || code === '23502') {
      return { success: false, message: 'Some product details are missing or invalid.' };
    }
    return { success: false, message: error instanceof Error ? error.message : 'Failed to add product.' };
  }
}
