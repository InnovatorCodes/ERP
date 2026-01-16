// actions/update-product.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

// Helper to convert empty strings/invalid numbers to null
const getNullIfEmpty = (value: FormDataEntryValue | null) => (value === '' || value === 'null' ? null : value);
const getNumberOrNull = (value: FormDataEntryValue | null) => {
    const str = getNullIfEmpty(value);
    if (str === null) return null;
    const num = Number(str);
    return isNaN(num) ? null : num;
}

const uploadImage = async (file: File, subfolder: string, existingUrl: string | null, supabase: SupabaseClient<any, "public", any, any, any>) => {
    if (!file) return existingUrl;

    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const originalFileName = file.name.split('.').slice(0, -1).join('.');
    const fileName = `${originalFileName}-${timestamp}.${fileExt}`;
    const filePath = `${subfolder}/${fileName}`; // Store in subfolder

    // Delete existing image if it's different
    if (existingUrl) {
        const oldFileName = existingUrl.split('/').pop();
        // Extract the subfolder from the existing URL to ensure correct path for removal
        const oldSubfolderMatch = existingUrl.match(/\/public\/order-images\/(.*?)\//);
        const oldSubfolder = oldSubfolderMatch ? oldSubfolderMatch[1] : subfolder; // Default to current subfolder if not found

        if (oldFileName && oldFileName !== fileName) {
            await supabase.storage.from('order-images').remove([`${oldSubfolder}/${oldFileName}`]);
        }
    }

    const { data, error } = await supabase.storage
        .from('order-images') // Main bucket name
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Image upload failed: ${error.message}`);
    }

    return filePath; // Return only the file path, not the full URL
};

export async function updateProductAction(formData: FormData) {
    const supabase = await createClient();

    const productType = formData.get('product_type');
    const idValue = formData.get('id');

    if (!idValue || !productType) {
        return { success: false, message: 'Missing product ID or type.' };
    }

    const id = parseInt(String(idValue), 10);

    if (isNaN(id)) {
        return { success: false, message: 'Invalid product ID.' };
    }

    try {
        let updateData: { [key: string]: any } = {};
        const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';

        // Fetch current product details to get existing image URLs
        const { data: currentProduct, error: fetchError } = await supabase
            .from(tableName)
            .select('reference_image_url, measurement_drawing_url')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        const referenceImageFile = formData.get('reference_image_file') as File | null;
        const measurementImageFile = formData.get('measurement_image_file') as File | null;
        const referenceImageUrlFromForm = formData.get('reference_image_file_from_form'); // This will be 'null' if removed
        const measurementImageUrlFromForm = formData.get('measurement_image_file_from_form'); // This will be 'null' if removed

        let newReferenceImageUrl = currentProduct?.reference_image_url || null;
        let newMeasurementImageUrl = currentProduct?.measurement_drawing_url || null;

        // Handle reference image
        if (referenceImageFile && referenceImageFile.size > 0) {
            newReferenceImageUrl = await uploadImage(referenceImageFile, 'reference', currentProduct?.reference_image_url, supabase);
        } else if (referenceImageUrlFromForm === 'null') {
            // If the form explicitly says it's null, and no new file, then remove it
            if (currentProduct?.reference_image_url) {
                const oldFileName = currentProduct.reference_image_url.split('/').pop();
                if (oldFileName) {
                    await supabase.storage.from('order-images').remove([`reference/${oldFileName}`]);
                }
            }
            newReferenceImageUrl = null;
        }
        // If no new file and not explicitly removed, keep existing URL

        // Handle measurement image
        if (measurementImageFile && measurementImageFile.size > 0) {
            newMeasurementImageUrl = await uploadImage(measurementImageFile, 'measurement', currentProduct?.measurement_drawing_url, supabase);
        } else if (measurementImageUrlFromForm === 'null') {
            // If the form explicitly says it's null, and no new file, then remove it
            if (currentProduct?.measurement_drawing_url) {
                const oldFileName = currentProduct.measurement_drawing_url.split('/').pop();
                if (oldFileName) {
                    await supabase.storage.from('order-images').remove([`measurement/${oldFileName}`]);
                }
            }
            newMeasurementImageUrl = null;
        }
        // If no new file and not explicitly removed, keep existing URL

        if (productType === 'sofa') {
            updateData = {
                model_name: formData.get('model_name'),
                model_family_configuration: getNullIfEmpty(formData.get('model_family_configuration')),
                "2_seater_length": getNumberOrNull(formData.get('2_seater_length')) ?? 0,
                "1_seater_length": getNumberOrNull(formData.get('1_seater_length')) ?? 0,
                description: getNullIfEmpty(formData.get('description')),
                recliner_mechanism_mode: getNullIfEmpty(formData.get('recliner_mechanism_mode')),
                recliner_mechanism_flip: getNullIfEmpty(formData.get('recliner_mechanism_flip')),
                headrest_mode: getNullIfEmpty(formData.get('headrest_mode')),
                cup_holder: getNullIfEmpty(formData.get('cup_holder')),
                daybed_headrest_mode: getNullIfEmpty(formData.get('daybed_headrest_mode')),
                daybed_position: getNullIfEmpty(formData.get('daybed_position')),
                storage_side: getNullIfEmpty(formData.get('storage_side')),
                snack_swivel_tray: formData.get('snack_swivel_tray') === 'true',
                armrest_storage: formData.get('armrest_storage') === 'true',
                foam_density_seating: getNumberOrNull(formData.get('foam_density_seating')),
                foam_density_backrest: getNumberOrNull(formData.get('foam_density_backrest')),
                belt_details: getNullIfEmpty(formData.get('belt_details')),
                leg_type: getNullIfEmpty(formData.get('leg_type')),
                pvd_color: getNullIfEmpty(formData.get('pvd_color')),
                chester_option: getNullIfEmpty(formData.get('chester_option')),
                armrest_panels: getNullIfEmpty(formData.get('armrest_panels')),
                wood_to_floor: formData.get('wood_to_floor') === 'true',
                total_width: getNumberOrNull(formData.get('total_width')),
                total_depth: getNumberOrNull(formData.get('total_depth')),
                total_height: getNumberOrNull(formData.get('total_height')),
                seat_height: getNumberOrNull(formData.get('seat_height')),
                seat_depth: getNumberOrNull(formData.get('seat_depth')),
                seat_width: getNumberOrNull(formData.get('seat_width')),
                armrest_width: getNumberOrNull(formData.get('armrest_width')),
                armrest_depth: getNumberOrNull(formData.get('armrest_depth')),
                upholstery: getNullIfEmpty(formData.get('upholstery')),
                upholstery_color: getNullIfEmpty(formData.get('upholstery_color')),
                polish_color: getNullIfEmpty(formData.get('polish_color')),
                polish_finish: getNullIfEmpty(formData.get('polish_finish')),
                reference_image_url: newReferenceImageUrl,
                measurement_drawing_url: newMeasurementImageUrl,
            };
        } else { // bed
            updateData = {
                model_name: formData.get('model_name'),
                description: getNullIfEmpty(formData.get('description')),
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
                reference_image_url: newReferenceImageUrl,
                measurement_drawing_url: newMeasurementImageUrl,
            };
        }

        console.log(updateData)
        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', id);
        if (error) throw error;

        revalidatePath('/products');

        // After updating, get signed URLs for the new paths to return to the client
        let signedReferenceUrl = newReferenceImageUrl;
        if (newReferenceImageUrl && !newReferenceImageUrl.startsWith('http')) {
            const { data } = await supabase.storage.from('order-images').createSignedUrl(newReferenceImageUrl, 3600);
            signedReferenceUrl = data?.signedUrl || null;
        }

        let signedMeasurementUrl = newMeasurementImageUrl;
        if (newMeasurementImageUrl && !newMeasurementImageUrl.startsWith('http')) {
            const { data } = await supabase.storage.from('order-images').createSignedUrl(newMeasurementImageUrl, 3600);
            signedMeasurementUrl = data?.signedUrl || null;
        }

        return {
            success: true,
            message: 'Product updated successfully!',
            newReferenceImageUrl: signedReferenceUrl,
            newMeasurementImageUrl: signedMeasurementUrl,
        };

    } catch (error: unknown) {
        console.error('Error updating product:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { success: false, message: `Failed to update product: ${errorMessage}` };
    }
}
