/** @type {import('next').NextConfig} */

// Signed image URLs come from the project's own Supabase host.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      ...(supabaseHostname
        ? [{ protocol: 'https', hostname: supabaseHostname, port: '', pathname: '/storage/v1/object/sign/**' }]
        : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
