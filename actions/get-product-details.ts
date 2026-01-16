'use server';

import { z } from 'zod';
import { createClient } from '@/utils/supabase/server';
import { Product } from '@/types/products'; // Import Product type

const formSchema = z.object({
  id: z.number(),
  type: z.enum(['sofa', 'bed']),
});

export default async function getProductDetails(id: number, type: 'sofa' | 'bed') {
  const supabase = await createClient();

  const validatedFields = formSchema.safeParse({
    id: id,
    type: type,
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }
  const tableName= validatedFields.data.type === 'sofa' ? 'sofa_products' : 'bed_products';
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', validatedFields.data.id)
    .single();

  if (error || !data) {
    return {
      errors: {
        database: ['Failed to fetch product details or product not found.'],
      },
    };
  }

  // Generate signed URLs for images
  const product: Product = data as Product;
  let reference_image_url: string | null = null;
  let measurement_drawing_url: string | null = null;

  if (product.reference_image_url) {
    const { data: signedUrlData } = await supabase.storage
      .from('order-images')
      .createSignedUrl(product.reference_image_url, 3600); // URL valid for 1 hour
    if (signedUrlData) {
      reference_image_url = signedUrlData.signedUrl;
    }
  }

  if (product.measurement_drawing_url) {
    const { data: signedUrlData } = await supabase.storage
      .from('order-images')
      .createSignedUrl(product.measurement_drawing_url, 3600); // URL valid for 1 hour
    if (signedUrlData) {
      measurement_drawing_url = signedUrlData.signedUrl;
    }
  }

  return {
    data: {
      ...product,
      reference_image_url,
      measurement_drawing_url,
    },
  };
}
