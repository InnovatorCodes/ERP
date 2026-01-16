export interface CustomerSearchResult {
  id: string;
  name: string;
  company?: string;
  address: string;
  avatar?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  customerType: 'b2b' | 'b2c' | 'architecture' | 'interior design';
  dateAdded: string;
  totalOrders: number;
  totalSpend: number;
  lastOrder: string;
}
