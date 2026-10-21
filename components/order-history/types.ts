export type OrderHistory = {
  id: number;
  customerName: string;
  orderDate: string;
  dueDate: string;
  deliveryDate: string | null;
  status: string;
  productName: string;
  productType: 'Sofa' | 'Bed';
};

export type OrderDetails = OrderHistory & {
  deliveryDate: string | null;
  shippingAddress: string;
  items: {
    name: string;
    sku: string;
    quantity: number;
  }[];
  timeline: {
    key: string;
    label: string;
    date: string;
  }[];
};
