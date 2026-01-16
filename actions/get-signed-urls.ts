'use server';

import { createClient } from '@/utils/supabase/server';

export async function getSignedUrls(paths: string[]): Promise<{ [key: string]: string | null }> {
  if (!paths || paths.length === 0) {
    return {};
  }

  const supabase = await createClient();
  const thirtyMinutesInSeconds = 30 * 60;

  const { data, error } = await supabase.storage
    .from('order-images')
    .createSignedUrls(paths, thirtyMinutesInSeconds);

  if (error) {
    console.error('Error creating signed URLs:', error);
    // Return an object with nulls for all paths on error
    return paths.reduce((acc, path) => {
      acc[path] = null;
      return acc;
    }, {} as { [key: string]: string | null });
  }

  // Create a map of path to signed URL
  const urlMap = data.reduce((acc, item) => {
    if (item.path) {
      if (item.error) {
        console.error(`Failed to sign URL for ${item.path}:`, item.error);
        acc[item.path] = null;
      } else {
        acc[item.path] = item.signedUrl;
      }
    }
    return acc;
  }, {} as { [key: string]: string | null });

  // Ensure all original paths have a corresponding key in the map
  for (const path of paths) {
    if (!(path in urlMap)) {
      urlMap[path] = null;
    }
  }

  return urlMap;
}
