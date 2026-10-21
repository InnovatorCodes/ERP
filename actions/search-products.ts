"use server";

import { authorize, ROLES } from "@/lib/auth";
import { Product } from "@/types/products";
import { getSignedUrls } from "./get-signed-urls";

// Only these columns may be filtered on from the client.
const FILTERABLE_COLUMNS = new Set(['model_family_configuration', 'recliner_mechanism_mode']);

function safeFilters(filters?: Record<string, string>): [string, string][] {
  return Object.entries(filters ?? {}).filter(
    ([key, value]) => FILTERABLE_COLUMNS.has(key) && typeof value === 'string' && value !== '' && value !== 'all'
  );
}

export async function getProducts(
  productType: "sofa" | "bed",
  filters: Record<string, string>,
  page: number = 1,
  pageSize: number = 10,
  query?: string
): Promise<{ products: Product[], totalCount: number }> {
  const auth = await authorize(ROLES.STAFF);
  if (!auth.ok) return { products: [], totalCount: 0 };
  const supabase = auth.supabase;
  const tableName = productType === 'sofa' ? 'sofa_products' : 'bed_products';

  let queryBuilder = supabase.from(tableName).select('*', { count: 'exact' });

  if (query && query.trim()) {
    queryBuilder = queryBuilder.ilike('model_name', `%${query}%`);
  }

  for (const [key, value] of safeFilters(filters)) {
    queryBuilder = queryBuilder.eq(key, value);
  }

  const { data: products, error, count } = await queryBuilder
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error(`Error fetching ${productType}s:`, error);
    return { products: [], totalCount: 0 };
  }

  if (!products) {
    return { products: [], totalCount: 0 };
  }

  // Extract all image paths that need signing
  const imagePaths = products.flatMap(p => {
    const paths = [];
    if (p.reference_image_url) paths.push(p.reference_image_url);
    if (p.measurement_drawing_url) paths.push(p.measurement_drawing_url);
    return paths;
  });

  // Get all signed URLs in one go
  const signedUrlMap = await getSignedUrls(imagePaths);

  // Map the signed URLs back to the products
  const productsWithSignedUrls = products.map(product => ({
    ...product,
    reference_image_url: product.reference_image_url ? signedUrlMap[product.reference_image_url] : null,
    measurement_drawing_url: product.measurement_drawing_url ? signedUrlMap[product.measurement_drawing_url] : null,
  }));

  return { products: productsWithSignedUrls, totalCount: count ?? 0 };
}

export async function searchProducts(
  query: string,
  productType: "sofa" | "bed",
  filters?: Record<string, string>
): Promise<Product[]> {
  const auth = await authorize(ROLES.STAFF);
  if (!auth.ok) return [];
  const supabase = auth.supabase;
  let queryBuilder = supabase.from(productType === 'sofa' ? 'sofa_products' : 'bed_products').select('*');

  if (query.trim()) {
    queryBuilder = queryBuilder.ilike('model_name', `%${query}%`);
  }

  for (const [key, value] of safeFilters(filters)) {
    queryBuilder = queryBuilder.eq(key, value);
  }

  const { data: products, error } = await queryBuilder.limit(50);

  if (error) {
    console.error("Error searching products:", error);
    return [];
  }

  if (!products) {
    return [];
  }

  // Extract all image paths that need signing
  const imagePaths = products.flatMap(p => {
    const paths = [];
    if (p.reference_image_url) paths.push(p.reference_image_url);
    if (p.measurement_drawing_url) paths.push(p.measurement_drawing_url);
    return paths;
  });

  // Get all signed URLs in one go
  const signedUrlMap = await getSignedUrls(imagePaths);

  // Map the signed URLs back to the products
  const productsWithSignedUrls = products.map(product => ({
    ...product,
    reference_image_url: product.reference_image_url ? signedUrlMap[product.reference_image_url] : null,
    measurement_drawing_url: product.measurement_drawing_url ? signedUrlMap[product.measurement_drawing_url] : null,
  }));

  return productsWithSignedUrls;
}
