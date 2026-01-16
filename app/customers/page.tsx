import CustomerClientPage from '@/components/customers/customer-client-page';
import { searchCustomers } from '@/actions/filter-customers';

export const dynamic = 'force-dynamic';

export default async function CustomerPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;

  const filters = {
    searchTerm: Array.isArray(resolvedSearchParams.search)
      ? resolvedSearchParams.search[0]
      : resolvedSearchParams.search ?? '',
    status: Array.isArray(resolvedSearchParams.status)
      ? resolvedSearchParams.status[0]
      : resolvedSearchParams.status ?? 'All',
    address: Array.isArray(resolvedSearchParams.address)
      ? resolvedSearchParams.address[0]
      : resolvedSearchParams.address ?? '',
  };

  const initialCustomers = await searchCustomers(filters);

  return (
    <CustomerClientPage
      initialCustomers={initialCustomers}
      initialFilters={filters}
    />
  );
}
