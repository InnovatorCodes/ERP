// Helpers for product images in the private `order-images` bucket. The
// database stores storage paths ("reference/<uuid>.jpg"); the browser only
// ever sees short-lived signed URLs.

export const IMAGE_BUCKET = 'order-images';

export type ImageFolder = 'reference' | 'measurement';

const FOLDERS: readonly string[] = ['reference', 'measurement'];

/** A path we created: "<folder>/<single file name>", nothing else. */
export function isAllowedImagePath(path: string): boolean {
  const parts = path.split('/');
  return parts.length === 2 && FOLDERS.includes(parts[0]) && /^[\w.-]+$/.test(parts[1]) && !parts[1].startsWith('.');
}

/** New random path for an upload, keeping only a sanitised file extension. */
export function newImagePath(folder: ImageFolder, fileName: string): string {
  const extension = (fileName.split('.').pop() ?? '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 5) || 'bin';
  return `${folder}/${crypto.randomUUID()}.${extension}`;
}

/**
 * Turns a signed URL that the app handed to the browser back into its
 * storage path. Returns null for anything that isn't a signed URL for one of
 * our own image paths, so a client can't point a product at arbitrary files.
 */
export function storagePathFromSignedUrl(value: FormDataEntryValue | null | undefined): string | null {
  if (typeof value !== 'string' || value === '' || value === 'null') return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.host !== new URL(supabaseUrl).host) return null;

  const prefix = `/storage/v1/object/sign/${IMAGE_BUCKET}/`;
  if (!url.pathname.startsWith(prefix)) return null;

  const path = decodeURIComponent(url.pathname.slice(prefix.length));
  return isAllowedImagePath(path) ? path : null;
}
