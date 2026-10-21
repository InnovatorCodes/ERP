// app/actions/submit-order.ts
'use server';

import { revalidatePath } from 'next/cache';
import { authorize, ROLES, userFacingDbError } from '@/lib/auth';
import { z } from 'zod';
import { zfd } from 'zod-form-data';
import type { SupabaseClient } from '@supabase/supabase-js';
import { IMAGE_BUCKET, newImagePath, storagePathFromSignedUrl, type ImageFolder } from '@/lib/storage';

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

// Handle text strings, converting missing/empty/"null" to null
const textString = z.preprocess((val) => {
  if (val === null || val === undefined) return null;
  const text = String(val).trim();
  return text === '' || text === 'null' ? null : text;
}, z.string().nullable().optional());

// --- Schema Definition ---

const productSchema = z.object({
  product_type: z.enum(['sofa', 'bed']),
  is_existing_model: checkboxBool,
  is_customization: checkboxBool,
  quantity: z.preprocess(
    (val) => (val === null || val === '' ? 1 : Number(val)),
    z.number({ invalid_type_error: 'Quantity must be a number.' }).int().min(1, 'Quantity must be at least 1.').max(1000, 'Quantity cannot exceed 1000.')
  ),
  due_date: z.preprocess(
    (val) => (typeof val === 'string' ? val : ''),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Every product needs a due date.')
  ),

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
}).superRefine((product, ctx) => {
  const productId = product.product_type === 'sofa' ? product.sofa_product_id : product.bed_product_id;

  if (!product.is_existing_model && !product.is_customization) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Each item must be an existing model, or have Customize turned on to describe a new one.' });
    return;
  }
  if (product.is_existing_model && !productId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Select the existing model for each item.' });
  }
  if (product.is_customization && !product.model_name) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'New and customised products need a model name.' });
  }
  if (product.is_customization && product.product_type === 'sofa' && !product.model_family_configuration) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'New and customised sofas need a model family configuration.' });
  }
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
  const auth = await authorize(ROLES.SALES);
  if (!auth.ok) return { success: false, message: auth.message };
  const supabase = auth.supabase;

  // Basic validation using zfd
  const baseSchema = zfd.formData({
    selectedCustomerId: zfd.text(),
    totalProducts: zfd.numeric().refine((n) => Number.isInteger(n) && n >= 1 && n <= 50, { message: "Between 1 and 50 products required" }),
  });

  const parsedBase = baseSchema.safeParse(formData);

  if (!parsedBase.success) {
    return { success: false, message: 'Invalid customer or product count.' };
  }

  const { selectedCustomerId, totalProducts } = parsedBase.data;

  // Paths uploaded or copied during this request, removed again if the order fails.
  const createdImagePaths: string[] = [];

  try {
    // 1. Validate every product before touching storage.
    const parsedProducts = Array.from({ length: totalProducts }).map((_, i) => {
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

      return { base, product: productSchema.parse(rawData) };
    });

    // 2. Images, only for items that create a new product row. A new upload
    //    wins; otherwise a customised copy gets its own copy of the original
    //    model's image, so editing either product never breaks the other.
    const settled = await Promise.allSettled(parsedProducts.map(async ({ base, product }) => {
      if (product.is_existing_model && !product.is_customization) {
        return product;
      }
      const [referenceImage, measurementDrawing] = await Promise.all([
        resolveImage(supabase, formData, `${base}.reference_image_url`, 'reference', createdImagePaths),
        resolveImage(supabase, formData, `${base}.measurement_drawing_url`, 'measurement', createdImagePaths),
      ]);
      return {
        ...product,
        reference_image_url: referenceImage ?? undefined,
        measurement_drawing_url: measurementDrawing ?? undefined,
      };
    }));

    const failure = settled.find((result) => result.status === 'rejected');
    if (failure) throw failure.reason;
    const products = settled.map((result) => (result as PromiseFulfilledResult<ProductItem>).value);

    // 3. Create the order, its items and any new products in one transaction.
    const { data: orderId, error } = await supabase.rpc('submit_full_order', {
      p_customer_id: parseInt(selectedCustomerId, 10),
      p_products: products,
    });

    if (error) {
      console.error('submit_full_order failed:', error);
      await removeImages(supabase, createdImagePaths);
      return { success: false, message: userFacingDbError(error, 'Failed to place the order. Please check the product details.') };
    }

    revalidatePath(`/place-order`);
    return { success: true, message: `Order #${orderId} created successfully!` };

  } catch (error: unknown) {
    await removeImages(supabase, createdImagePaths);

    if (error instanceof z.ZodError) {
      console.error('Validation Error:', error.flatten());
      return { success: false, message: error.issues[0]?.message ?? 'Form validation failed. Please check your inputs.' };
    }

    console.error('Order submission error:', error);
    return { success: false, message: error instanceof Error ? error.message : 'An unexpected error occurred.' };
  }
}

// --- Image helpers ---

async function resolveImage(
  supabase: SupabaseClient,
  formData: FormData,
  fieldName: string,
  folder: ImageFolder,
  createdPaths: string[]
): Promise<string | null> {
  const file = formData.get(fieldName);
  if (file instanceof File && file.size > 0) {
    const path = newImagePath(folder, file.name);
    const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw new Error(`Failed to upload the ${folder} image: ${error.message}`);
    createdPaths.push(path);
    return path;
  }

  // ImageUploadDisplayField sends the image the item already had (a signed URL)
  // in "<field>_from_form", or 'null' if the user removed it.
  const existingPath = storagePathFromSignedUrl(formData.get(`${fieldName}_from_form`));
  if (existingPath) {
    const path = newImagePath(folder, existingPath);
    const { error } = await supabase.storage.from(IMAGE_BUCKET).copy(existingPath, path);
    if (error) throw new Error(`Failed to copy the ${folder} image: ${error.message}`);
    createdPaths.push(path);
    return path;
  }

  return null;
}

async function removeImages(supabase: SupabaseClient, paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove(paths);
  if (error) console.error('Failed to clean up uploaded images:', error);
}
