// app/place-order/page.tsx
// This file will act as your Server Component wrapper

import PlaceOrderPage from '@/components/place-order/order-page-client'; // Corrected import path

export default async function OrderPageServer() {
  return (
    <PlaceOrderPage/>
  );
}

// Optional: Add generateMetadata for SEO
export async function generateMetadata() {
  return {
    title: 'Place New Order',
    description: 'Create and submit new customer orders.',
  };
}
