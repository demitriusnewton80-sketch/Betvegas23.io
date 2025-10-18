
export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'sports-bot' | 'infrastructure' | 'api-access' | 'data-feed' | 'hardware' | 'software';
  price: number;
  stock: number;
  supplier: string;
  specifications?: {
    [key: string]: string | number;
  };
  awsIntegration?: {
    arn: string;
    resourceType: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  products: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  paymentMethod: 'wallet' | 'credit-card' | 'crypto';
  shippingAddress?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  completedAt?: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  updatedAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
}
