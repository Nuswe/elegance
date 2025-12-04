export enum OrderStatus {
  PENDING = 'Pending',
  PARTIAL = 'Partially Paid',
  PAID = 'Fully Paid'
}

export enum ProductCategory {
  CLOTHES = 'Clothes',
  SHOES = 'Shoes',
  BAGS = 'Bags',
  ACCESSORIES = 'Accessories',
  SHEIN_ORDER = 'Shein Custom Order'
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory | string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  image?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalSpent: number;
  currentDebt: number;
}

export interface Installment {
  id: string;
  amount: number;
  date: string;
  note?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  priceAtSale: number;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string; // Denormalized for easier display
  date: string;
  items: OrderItem[];
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  installments: Installment[];
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  note: string;
}

export interface DashboardStats {
  totalSales: number;
  totalProfit: number;
  pendingPayments: number;
  lowStockCount: number;
}