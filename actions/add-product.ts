// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';

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
  const supabase = await createClient()

  const productType = formData.get('product_type');
  const modelName = formData.get('model_name') as string;

  // Check if model name already exists
  const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';
  const { data: existingProduct, error: fetchError } = await supabase
    .from(tableName)
    .select('id')
    .eq('model_name', modelName)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') { // Ignore 'No rows found' error
    throw fetchError;
  }
  if (existingProduct) {
    return { success: false, message: `A product with the model name "${modelName}" already exists.` };
  }

  try {
    const referenceImageFile = formData.get('reference_image_url') as File;
    const measurementDrawingFile = formData.get('measurement_drawing_url') as File;
    let referenceImageUrl = null;
    let measurementDrawingUrl = null;

    if (referenceImageFile && referenceImageFile.size > 0) {
      const referenceFileName = `${Date.now()}-${referenceImageFile.name}`;
      const referenceFilePath = `reference/${referenceFileName}`;
      const { data: refData, error: refError } = await supabase.storage
        .from('order-images')
        .upload(referenceFilePath, referenceImageFile);
      if (refError) throw new Error(`Failed to upload reference image: ${refError.message}`);
      referenceImageUrl = refData.path;
    }

    if (measurementDrawingFile && measurementDrawingFile.size > 0) {
      const measurementFileName = `${Date.now()}-${measurementDrawingFile.name}`;
      const measurementFilePath = `measurement/${measurementFileName}`;
      const { data: measData, error: measError } = await supabase.storage
        .from('order-images')
        .upload(measurementFilePath, measurementDrawingFile);
      if (measError) throw new Error(`Failed to upload measurement drawing: ${measError.message}`);
      measurementDrawingUrl = measData.path;
    }

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

    } else if (productType === 'bed') {
      const bedData = {
        model_name: formData.get('model_name'),
        description: getNullIfEmpty(formData.get('description')),
        reference_image_url: referenceImageUrl,
        measurement_drawing_url: measurementDrawingUrl,
        bed_size: getNullIfEmpty(formData.get('bed_size')),
        customized_mattress_size: getNullIfEmpty(formData.get('customized_mattress_size')),
        headboard_type: getNullIfEmpty(formData.get('headboard_type')),
        storage_option: getNullIfEmpty(formData.get('storage_option')),
        upholstery: getNullIfEmpty(formData.get('upholstery')),
        upholstery_color: getNullIfEmpty(formData.get('upholstery_color')),
        polish_color: getNullIfEmpty(formData.get('polish_color')),
        polish_finish: getNullIfEmpty(formData.get('polish_finish')),
        customization: false,
      };

      const { error } = await supabase.from('bed_products').insert([bedData]);
      if (error) throw error;

    } else {
        throw new Error('Invalid product type specified.');
    }
    
    revalidatePath('/products');
    return { success: true, message: 'Product added successfully!' };

  } catch (error: unknown) {
    console.error('Error adding product:', error);
    let message = 'Failed to add product';
    if (error instanceof Error) {
      message = `Failed to add product: ${error.message}`;
    }
    return { success: false, message };
  }
}
