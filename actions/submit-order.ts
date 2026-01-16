// app/actions/submit-order.ts
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { z } from 'zod';
import { zfd } from 'zod-form-data';

// --- Zod Helpers ---

// Handle "true"/"false" strings to boolean
const booleanString = z.preprocess((val) => {
  if (typeof val === 'string') {
    if (val === 'true') return true;
    if (val === 'false') return false;
  }
  return null;
}, z.boolean().nullable().optional());

// Handle strict boolean strings (default false if missing/invalid, for checkboxes/flags)
const checkboxBool = z.preprocess((val) => val === 'true', z.boolean());

// Handle number strings, converting empty/null to null
const numberString = z.preprocess((val) => {
  if (val === '' || val === 'null' || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}, z.number().nullable().optional());

// Handle text strings, converting empty/"null" to null
const textString = z.preprocess((val) => {
  if (val === '' || val === 'null' || val === undefined) return null;
  return String(val);
}, z.string().nullable().optional());

// --- Schema Definition ---

const productSchema = z.object({
  product_type: z.enum(['sofa', 'bed']),
  is_existing_model: checkboxBool,
  is_customization: checkboxBool,
  quantity: z.preprocess((val) => Number(val) || 1, z.number()),
  due_date: textString,

  // References
  sofa_product_id: textString,
  bed_product_id: textString,

  // New Model
  model_name: textString,
  description: textString,

  // Sofa Specific
  model_family_configuration: textString,
  "2_seater_length": numberString,
  "1_seater_length": numberString,
  recliner_mechanism_mode: textString,
  recliner_mechanism_flip: textString,
  wood_to_floor: booleanString, // tri-state: true, false, or null
  headrest_mode: textString,
  cup_holder: textString,
  snack_swivel_tray: checkboxBool,
  daybed_headrest_mode: textString,
  daybed_position: textString,
  armrest_storage: checkboxBool,
  storage_side: textString,
  foam_density_seating: numberString,
  foam_density_backrest: numberString,
  belt_details: textString,
  leg_type: textString,
  pvd_color: textString,
  chester_option: textString,
  armrest_panels: textString,
  polish_color: textString,
  polish_finish: textString,
  upholstery: textString,
  upholstery_color: textString,

  // Dimensions
  total_width: numberString,
  total_depth: numberString,
  total_height: numberString,
  seat_width: numberString,
  seat_depth: numberString,
  seat_height: numberString,
  armrest_width: numberString,
  armrest_depth: numberString,

  // Bed Specific
  bed_size: textString,
  customized_mattress_size: textString,
  headboard_type: textString,
  storage_option: textString,
  bed_portion: textString,
});

// Export inferred type for usage elsewhere
export type ProductItem = z.infer<typeof productSchema> & {
  reference_image_url?: string;
  measurement_drawing_url?: string;
};

interface FormState {
  success: boolean;
  message: string | null;
}

export async function submitOrder(prevState: FormState, formData: FormData) {
  const supabase = await createClient();

  // Basic validation using zfd
  const baseSchema = zfd.formData({
    selectedCustomerId: zfd.text(),
    totalProducts: zfd.numeric().refine((n) => n >= 1, { message: "At least 1 product required" }),
  });

  const parsedBase = baseSchema.safeParse(formData);

  if (!parsedBase.success) {
    return { success: false, message: 'Invalid customer or product count.' };
  }

  const { selectedCustomerId, totalProducts } = parsedBase.data;

  try {
    // Process products in parallel
    const productPromises = Array.from({ length: totalProducts }).map(async (_, i) => {
      const base = `products[${i}]`;

      // 1. Extract raw values for this product index to feed into Zod
      // We manually pick keys because FormData is flat. 
      // This listing is verbose but robust because it feeds into the schema validation.
      const rawData = {
        product_type: formData.get(`${base}.product_type`),
        is_existing_model: formData.get(`${base}.is_existing_model`),
        is_customization: formData.get(`${base}.is_customization`),
        quantity: formData.get(`${base}.quantity`),
        due_date: formData.get(`${base}.due_date`),
        sofa_product_id: formData.get(`${base}.sofa_product_id`),
        bed_product_id: formData.get(`${base}.bed_product_id`),
        model_name: formData.get(`${base}.model_name`),
        description: formData.get(`${base}.description`),
        model_family_configuration: formData.get(`${base}.model_family_configuration`),
        "2_seater_length": formData.get(`${base}.2_seater_length`),
        "1_seater_length": formData.get(`${base}.1_seater_length`),
        recliner_mechanism_mode: formData.get(`${base}.recliner_mechanism_mode`),
        recliner_mechanism_flip: formData.get(`${base}.recliner_mechanism_flip`),
        wood_to_floor: formData.get(`${base}.wood_to_floor`),
        headrest_mode: formData.get(`${base}.headrest_mode`),
        cup_holder: formData.get(`${base}.cup_holder`),
        snack_swivel_tray: formData.get(`${base}.snack_swivel_tray`),
        daybed_headrest_mode: formData.get(`${base}.daybed_headrest_mode`),
        daybed_position: formData.get(`${base}.daybed_position`),
        armrest_storage: formData.get(`${base}.armrest_storage`),
        storage_side: formData.get(`${base}.storage_side`),
        foam_density_seating: formData.get(`${base}.foam_density_seating`),
        foam_density_backrest: formData.get(`${base}.foam_density_backrest`),
        belt_details: formData.get(`${base}.belt_details`),
        leg_type: formData.get(`${base}.leg_type`),
        pvd_color: formData.get(`${base}.pvd_color`),
        chester_option: formData.get(`${base}.chester_option`),
        armrest_panels: formData.get(`${base}.armrest_panels`),
        polish_color: formData.get(`${base}.polish_color`),
        polish_finish: formData.get(`${base}.polish_finish`),
        upholstery: formData.get(`${base}.upholstery`),
        upholstery_color: formData.get(`${base}.upholstery_color`),
        total_width: formData.get(`${base}.total_width`),
        total_depth: formData.get(`${base}.total_depth`),
        total_height: formData.get(`${base}.total_height`),
        seat_width: formData.get(`${base}.seat_width`),
        seat_depth: formData.get(`${base}.seat_depth`),
        seat_height: formData.get(`${base}.seat_height`),
        armrest_width: formData.get(`${base}.armrest_width`),
        armrest_depth: formData.get(`${base}.armrest_depth`),
        bed_size: formData.get(`${base}.bed_size`),
        customized_mattress_size: formData.get(`${base}.customized_mattress_size`),
        headboard_type: formData.get(`${base}.headboard_type`),
        storage_option: formData.get(`${base}.storage_option`),
        bed_portion: formData.get(`${base}.bed_portion`),
      };

      // 2. Validate and Transform
      const product = await productSchema.parseAsync(rawData);

      // 3. Handle File Uploads (Parallel)
      const refImg = formData.get(`${base}.reference_image_url`);
      const drawImg = formData.get(`${base}.measurement_drawing_url`);

      const [refUrl, drawUrl] = await Promise.all([
        uploadFile(supabase, refImg, 'reference', i),
        uploadFile(supabase, drawImg, 'measurement', i),
      ]);

      return {
        ...product,
        reference_image_url: refUrl ?? undefined,
        measurement_drawing_url: drawUrl ?? undefined,
      };
    });

    const products = await Promise.all(productPromises);

    // 4. Submit via RPC
    const { data: orderId, error } = await supabase.rpc('submit_full_order', {
      p_customer_id: parseInt(selectedCustomerId, 10),
      p_products: products,
    });

    if (error) {
      throw new Error(`Failed to submit order via RPC: ${error.message}`);
    }

    revalidatePath(`/place-order`);
    return { success: true, message: `Order #${orderId} created successfully!` };

  } catch (error: unknown) {
    // Zod Error Handling
    if (error instanceof z.ZodError) {
      console.error('Validation Error:', error.flatten());
      return { success: false, message: 'Form validation failed. Please check your inputs.' };
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    console.error('Order submission error:', errorMessage);
    return { success: false, message: errorMessage };
  }
}

// --- Helper for File Uploads ---
async function uploadFile(supabase: any, file: FormDataEntryValue | null, folder: string, index: number): Promise<string | null> {
  if (file instanceof File && file.size > 0) {
    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}_${index}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const filePath = `${folder}/${fileName}`;
    const { data, error } = await supabase.storage.from('order-images').upload(filePath, file);

    if (error) {
      // Log error but maybe don't fail the whole order? 
      // For now, let's throw to be safe as per original logic.
      throw new Error(`Failed to upload ${folder} image: ${error.message}`);
    }
    return data.path;
  } else if (typeof file === 'string' && file !== '') {
    return file;
  }
  return null;
}
