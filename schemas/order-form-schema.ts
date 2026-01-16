// app/order/order-form-schema.ts (or schemas/order-form-schema.ts)
import * as z from 'zod/v4';

// Helper for number preprocessing
const numberOrEmptyString = z.preprocess(
  (val) => (val === '' ? undefined : Number(val)),
  z.number().optional().or(z.literal(NaN))
).pipe(z.number().optional());

// Zod Schema Definitions for Products ---
export const sofaProductSchema = z.object({
  product_type: z.literal('sofa', {
    error: 'Product type must be "sofa"',
  }),
  is_existing_model: z.boolean({
    error: 'Model type is required',
  }),
  quantity: z.number({
    error: 'Quantity is required',
  }).min(1, { error: 'Quantity must be at least 1' }),
  sofa_product_id: z.string().optional(), // This should still be optional as it's only for existing models

  // --- Fields required for NEW sofa models ---
  model_name: z.string().min(1, { error: 'Model Name is required for new sofas.' }).optional(),
  // Changed .string().url to .url here
  reference_image_url: z.string().url({ error: 'Invalid URL format' }).min(1, { error: 'Reference Image URL is required for new sofas.' }).optional().or(z.literal('')),
  // Changed .string().url to .url here
  measurement_drawing_url: z.string().url({ error: 'Invalid URL format' }).min(1, { error: 'Measurement Drawing URL is required for new sofas.' }).optional().or(z.literal('')),
  description: z.string().min(1, { error: 'Description is required for new sofas.' }).optional(),

  // Optional fields that may or may not be required based on other complex logic
  recliner_mechanism_mode: z.enum(['manual', 'motorized_single', 'motorized_double'], { error: 'Invalid recliner mechanism mode' }).optional(),
  recliner_mechanism_flip: z.enum(['single_flip', 'double_flip', 'double_motor_with_headrest'], { error: 'Invalid recliner mechanism flip' }).optional(),
  wood_to_floor: z.boolean().optional().or(z.null()),
  headrest_mode: z.enum(['manual', 'motorized'], { error: 'Invalid headrest mode' }).optional(),
  cup_holder: z.enum(['normal_push_back', 'chiller_cup'], { error: 'Invalid cup holder type' }).optional(),
  snack_swivel_tray: z.boolean().optional(),
  daybed_headrest_mode: z.enum(['manual', 'motorized'], { error: 'Invalid daybed headrest mode' }).optional(),
  daybed_position: z.enum(['rhs', 'lhs'], { error: 'Invalid daybed position' }).optional(),
  armrest_storage: z.boolean().optional(),
  storage_side: z.enum(['rhs_arm', 'lhs_arm', 'both_arm'], { error: 'Invalid storage side' }).optional(),
  foam_density_seating: numberOrEmptyString,
  foam_density_backrest: numberOrEmptyString,
  belt_details: z.enum(['elastic_belt', 'zig_zag_spring', 'pocket_spring'], { error: 'Invalid belt details' }).optional(),
  leg_type: z.enum(['wood', 'pvd', 'ss'], { error: 'Invalid leg type' }).optional(),
  pvd_color: z.string().optional(),
  chester_option: z.enum(['with_button', 'without_button'], { error: 'Invalid chester option' }).optional(),
  armrest_panels: z.string().optional(),
  polish_color: z.string().optional().or(z.null()),
  polish_finish: z.enum(['matt_finish', 'glossy_finish', 'no_polish'], { error: 'Invalid polish finish' }).optional(),
  seat_width: numberOrEmptyString,
  seat_depth: numberOrEmptyString,
  seat_height: numberOrEmptyString,
  armrest_width: numberOrEmptyString,
  armrest_depth: numberOrEmptyString,
  upholstery: z.enum(['fabric', 'pu', 'leather_bloom', 'leather_floater', 'leather_floater_max', 'leather_platinum_max', 'leather_european_nappa', 'leather_smoothy_nappa', 'pu_leather'], { error: 'Invalid upholstery type' }).optional(),
  upholstery_color: z.string().optional(),
  total_width: numberOrEmptyString,
  total_depth: numberOrEmptyString,
  total_height: numberOrEmptyString,
});

export const bedProductSchema = z.object({
  product_type: z.literal('bed', {
    error: 'Product type must be "bed"',
  }),
  is_existing_model: z.boolean({
    error: 'Model type is required',
  }),
  quantity: z.number({
    error: 'Quantity is required',
  }).min(1, { error: 'Quantity must be at least 1' }),
  bed_product_id: z.string().optional(), // This should still be optional as it's only for existing models

  // --- Fields required for NEW bed models ---
  model_name: z.string().min(1, { error: 'Model Name is required for new beds.' }).optional(),
  description: z.string().min(1, { error: 'Description is required for new beds.' }).optional(),
  // Changed .string().url to .url here
  reference_image_url: z.string().url({ error: 'Invalid URL format' }).min(1, { error: 'Reference Image URL is required for new beds.' }).optional().or(z.literal('')),
  // Changed .string().url to .url here
  measurement_drawing_url: z.string().url({ error: 'Invalid URL format' }).min(1, { error: 'Measurement Drawing URL is required for new beds.' }).optional().or(z.literal('')),

  // Optional fields
  headboard_type: z.enum(['medium_back_4ft', 'high_back_4_5ft'], { error: 'Invalid headboard type' }).optional(),
  storage_option: z.enum(['hydraulic', 'channel', 'motorised', 'without_storage'], { error: 'Invalid storage option' }).optional(),
  bed_portion: z.enum(['single', 'double'], { error: 'Invalid bed portion' }).optional(),
  upholstery: z.enum(['fabric', 'pu', 'leather_bloom', 'leather_floater', 'leather_floater_max', 'leather_platinum_max', 'leather_european_nappa', 'leather_smoothy_nappa', 'pu_leather'], { error: 'Invalid upholstery type' }).optional(),
  upholstery_color: z.string().optional(),
  polish_color: z.string().optional(),
  polish_finish: z.enum(['matt_finish', 'glossy_finish'], { error: 'Invalid polish finish' }).optional(),
  bed_size: z.enum(['king', 'queen', 'customized'], { error: 'Invalid bed size' }).optional(),
  customized_mattress_size: z.string().optional(),
  total_width: numberOrEmptyString,
  total_depth: numberOrEmptyString,
  total_height: numberOrEmptyString,
});

export const productSchema = z.union([sofaProductSchema, bedProductSchema]).superRefine((data, ctx) => {
  if (data.product_type === 'sofa') {
    if (data.is_existing_model) {
      if (!data.sofa_product_id) {
        ctx.addIssue({
          message: 'Existing sofa models require a selection.',
          path: ['sofa_product_id'],
        });
      }
    } else { // It's a NEW sofa model
      if (!data.model_name || data.model_name.trim() === '') {
        ctx.addIssue({
          message: 'Model Name is required for new sofa specifications.',
          path: ['model_name'],
        });
      }
      if (!data.reference_image_url || data.reference_image_url.trim() === '') {
        ctx.addIssue({
          message: 'Reference Image URL is required for new sofa specifications.',
          path: ['reference_image_url'],
        });
      }
      if (!data.measurement_drawing_url || data.measurement_drawing_url.trim() === '') {
        ctx.addIssue({
          message: 'Measurement Drawing URL is required for new sofa specifications.',
          path: ['measurement_drawing_url'],
        });
      }
      if (!data.description || data.description.trim() === '') {
        ctx.addIssue({
          message: 'Description is required for new sofa specifications.',
          path: ['description'],
        });
      }
      // Add similar checks for other fields that are *always* required for new sofa models
      // e.g., if total_width is always required for new sofas:
      // if (typeof data.total_width !== 'number' || isNaN(data.total_width)) {
      //   ctx.addIssue({
      //     message: 'Total Width is required for new sofa specifications.',
      //     path: ['total_width'],
      //   });
      // }
    }
  } else if (data.product_type === 'bed') {
    if (data.is_existing_model) {
      if (!data.bed_product_id) {
        ctx.addIssue({
          message: 'Existing bed models require a selection.',
          path: ['bed_product_id'],
        });
      }
    } else { // It's a NEW bed model
      if (!data.model_name || data.model_name.trim() === '') {
        ctx.addIssue({
          message: 'Model Name is required for new bed specifications.',
          path: ['model_name'],
        });
      }
      if (!data.description || data.description.trim() === '') {
        ctx.addIssue({
          message: 'Description is required for new bed specifications.',
          path: ['description'],
        });
      }
      if (!data.reference_image_url || data.reference_image_url.trim() === '') {
        ctx.addIssue({
          message: 'Reference Image URL is required for new bed specifications.',
          path: ['reference_image_url'],
        });
      }
      if (!data.measurement_drawing_url || data.measurement_drawing_url.trim() === '') {
        ctx.addIssue({
          message: 'Measurement Drawing URL is required for new bed specifications.',
          path: ['measurement_drawing_url'],
        });
      }
      // Add similar checks for other fields that are *always* required for new bed models
    }
  }
});

export const formSchema = z.object({
  selectedCustomer: z.string().min(1, { error: 'Please select a customer.' }),
  totalProducts: z.number({
    error: 'Number of products is required',
  }).min(1, { error: 'At least one product is required.' }).default(1),
  products: z.array(productSchema).min(1, { error: 'At least one product is required.' }),
});

export type FormValues = z.infer<typeof formSchema>;
