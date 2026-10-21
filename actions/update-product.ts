// actions/update-product.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authorize, ROLES } from '@/lib/auth';
import { IMAGE_BUCKET, newImagePath, type ImageFolder } from '@/lib/storage';

// Helper to convert empty strings/invalid numbers to null
const getNullIfEmpty = (value: FormDataEntryValue | null) => (value === null || value === '' || value === 'null' ? null : value);
const getNumberOrNull = (value: FormDataEntryValue | null) => {
    const str = getNullIfEmpty(value);
    if (str === null) return null;
    const num = Number(str);
    return isNaN(num) ? null : num;
}

type ImageChange = {
    path: string | null;      // value to store on the product
    obsolete: string | null;  // previous file to delete once the update succeeded
};

/**
 * Works out the new image for one field: a newly uploaded file, an explicit
 * removal (the form sends 'null'), or the existing image unchanged. New files
 * are uploaded here; old files are only deleted after the database update.
 */
async function resolveImageChange(
    supabase: SupabaseClient,
    formData: FormData,
    fileField: string,
    folder: ImageFolder,
    currentPath: string | null,
    uploaded: string[]
): Promise<ImageChange> {
    const file = formData.get(fileField);
    if (file instanceof File && file.size > 0) {
        const path = newImagePath(folder, file.name);
        const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
        if (error) throw new Error(`Image upload failed: ${error.message}`);
        uploaded.push(path);
        return { path, obsolete: currentPath };
    }
    if (formData.get(`${fileField}_from_form`) === 'null') {
        return { path: null, obsolete: currentPath };
    }
    return { path: currentPath, obsolete: null };
}

export async function updateProductAction(formData: FormData) {
    const auth = await authorize(ROLES.SALES);
    if (!auth.ok) return { success: false, message: auth.message };
    const supabase = auth.supabase;

    const productType = formData.get('product_type');
    const id = parseInt(String(formData.get('id') ?? ''), 10);

    if (productType !== 'sofa' && productType !== 'bed') {
        return { success: false, message: 'Missing or invalid product type.' };
    }
    if (isNaN(id)) {
        return { success: false, message: 'Invalid product ID.' };
    }

    const modelName = getNullIfEmpty(formData.get('model_name'));
    if (!modelName) {
        return { success: false, message: 'Model name is required.' };
    }

    const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';
    const uploaded: string[] = [];

    try {
        const { data: currentProduct, error: fetchError } = await supabase
            .from(tableName)
            .select('reference_image_url, measurement_drawing_url')
            .eq('id', id)
            .single();

        if (fetchError || !currentProduct) {
            return { success: false, message: 'Product not found.' };
        }

        const reference = await resolveImageChange(supabase, formData, 'reference_image_file', 'reference', currentProduct.reference_image_url, uploaded);
        const measurement = await resolveImageChange(supabase, formData, 'measurement_image_file', 'measurement', currentProduct.measurement_drawing_url, uploaded);

        const common = {
            model_name: modelName,
            description: getNullIfEmpty(formData.get('description')),
            total_width: getNumberOrNull(formData.get('total_width')),
            total_depth: getNumberOrNull(formData.get('total_depth')),
            total_height: getNumberOrNull(formData.get('total_height')),
            upholstery: getNullIfEmpty(formData.get('upholstery')),
            upholstery_color: getNullIfEmpty(formData.get('upholstery_color')),
            polish_color: getNullIfEmpty(formData.get('polish_color')),
            polish_finish: getNullIfEmpty(formData.get('polish_finish')),
            reference_image_url: reference.path,
            measurement_drawing_url: measurement.path,
        };

        const updateData = productType === 'sofa'
            ? {
                ...common,
                model_family_configuration: getNullIfEmpty(formData.get('model_family_configuration')),
                "2_seater_length": getNumberOrNull(formData.get('2_seater_length')),
                "1_seater_length": getNumberOrNull(formData.get('1_seater_length')),
                recliner_mechanism_mode: getNullIfEmpty(formData.get('recliner_mechanism_mode')),
                recliner_mechanism_flip: getNullIfEmpty(formData.get('recliner_mechanism_flip')),
                headrest_mode: getNullIfEmpty(formData.get('headrest_mode')) ?? 'fixed',
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
                chester_option: getNullIfEmpty(formData.get('chester_option')) ?? 'no_chester',
                armrest_panels: getNullIfEmpty(formData.get('armrest_panels')),
                wood_to_floor: formData.get('wood_to_floor') === 'true',
                seat_height: getNumberOrNull(formData.get('seat_height')),
                seat_depth: getNumberOrNull(formData.get('seat_depth')),
                seat_width: getNumberOrNull(formData.get('seat_width')),
                armrest_width: getNumberOrNull(formData.get('armrest_width')),
                armrest_depth: getNumberOrNull(formData.get('armrest_depth')),
            }
            : {
                ...common,
                bed_size: getNullIfEmpty(formData.get('bed_size')),
                customized_mattress_size: getNullIfEmpty(formData.get('customized_mattress_size')),
                headboard_type: getNullIfEmpty(formData.get('headboard_type')),
                storage_option: getNullIfEmpty(formData.get('storage_option')),
                bed_portion: getNullIfEmpty(formData.get('bed_portion')),
            };

        const { error } = await supabase
            .from(tableName)
            .update(updateData)
            .eq('id', id);
        if (error) throw error;

        // The product now points at the new files; the replaced ones can go.
        const obsolete = [reference.obsolete, measurement.obsolete].filter((path): path is string => !!path);
        if (obsolete.length > 0) {
            const { error: removeError } = await supabase.storage.from(IMAGE_BUCKET).remove(obsolete);
            if (removeError) console.error('Failed to remove replaced images:', removeError);
        }

        revalidatePath('/products');

        const signedUrl = async (path: string | null) => {
            if (!path) return null;
            const { data } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, 3600);
            return data?.signedUrl ?? null;
        };

        return {
            success: true,
            message: 'Product updated successfully!',
            newReferenceImageUrl: await signedUrl(reference.path),
            newMeasurementImageUrl: await signedUrl(measurement.path),
        };

    } catch (error: unknown) {
        console.error('Error updating product:', error);
        if (uploaded.length > 0) {
            await supabase.storage.from(IMAGE_BUCKET).remove(uploaded);
        }
        const code = (error as { code?: string })?.code;
        if (code === '23505') {
            return { success: false, message: `A ${productType} with this model name already exists.` };
        }
        if (code === '23514' || code === '23502') {
            return { success: false, message: 'Some product details are missing or invalid.' };
        }
        return { success: false, message: error instanceof Error ? error.message : 'Failed to update product.' };
    }
}
