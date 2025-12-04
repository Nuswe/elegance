import { Product, Customer, Order, OrderStatus, ProductCategory, Expense } from '../types';

const KEYS = {
  PRODUCTS: 'eb_products',
  CUSTOMERS: 'eb_customers',
  ORDERS: 'eb_orders',
  EXPENSES: 'eb_expenses',
  INIT: 'eb_init'
};

// Seed Data
const seedData = () => {
  if (localStorage.getItem(KEYS.INIT)) return;

  const products: Product[] = [
    { id: '1', name: 'Gold Silk Dress', category: ProductCategory.CLOTHES, buyPrice: 85000, sellPrice: 200000, stock: 5, image: 'https://picsum.photos/200/200?random=1' },
    { id: '2', name: 'Velvet Black Heels', category: ProductCategory.SHOES, buyPrice: 65000, sellPrice: 150000, stock: 2, image: 'https://picsum.photos/200/200?random=2' },
    { id: '3', name: 'Shein Batch #402', category: ProductCategory.SHEIN_ORDER, buyPrice: 350000, sellPrice: 600000, stock: 1, image: 'https://picsum.photos/200/200?random=3' },
    { id: '4', name: 'Pearl Necklace', category: ProductCategory.ACCESSORIES, buyPrice: 25000, sellPrice: 75000, stock: 10, image: 'https://picsum.photos/200/200?random=4' },
  ];

  const customers: Customer[] = [
    { id: '1', name: 'Sophia Loren', phone: '088 555 0101', address: '123 Luxury Ln, Blantyre', totalSpent: 0, currentDebt: 85000 },
    { id: '2', name: 'Audrey Hepburn', phone: '099 555 0102', address: '456 Classic Blvd, Lilongwe', totalSpent: 0, currentDebt: 0 },
  ];

  const orders: Order[] = [
    {
      id: '101',
      customerId: '1',
      customerName: 'Sophia Loren',
      date: new Date().toISOString(),
      items: [{ productId: '1', productName: 'Gold Silk Dress', quantity: 1, priceAtSale: 200000 }],
      totalAmount: 200000,
      paidAmount: 115000,
      status: OrderStatus.PARTIAL,
      installments: [{ id: 'inst_1', amount: 115000, date: new Date().toISOString(), note: 'Initial deposit' }]
    }
  ];

  const expenses: Expense[] = [
    { id: '1', category: 'Rent', amount: 150000, date: new Date().toISOString(), note: 'Shop monthly rent' },
    { id: '2', category: 'Utilities', amount: 25000, date: new Date().toISOString(), note: 'Electricity units' },
  ];

  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers));
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses));
  localStorage.setItem(KEYS.INIT, 'true');
};

export const storageService = {
  init: seedData,

  getProducts: (): Product[] => JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]'),
  saveProducts: (products: Product[]) => localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products)),

  getCustomers: (): Customer[] => JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]'),
  saveCustomers: (customers: Customer[]) => localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(customers)),

  getOrders: (): Order[] => JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]'),
  saveOrders: (orders: Order[]) => localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders)),

  getExpenses: (): Expense[] => JSON.parse(localStorage.getItem(KEYS.EXPENSES) || '[]'),
  saveExpenses: (expenses: Expense[]) => localStorage.setItem(KEYS.EXPENSES, JSON.stringify(expenses)),

  // Helper to recalculate customer debt based on orders
  recalcCustomerDebt: (customerId: string) => {
    const orders = JSON.parse(localStorage.getItem(KEYS.ORDERS) || '[]');
    const customerDebt = orders
      .filter((o: Order) => o.customerId === customerId)
      .reduce((acc: number, o: Order) => acc + (o.totalAmount - o.paidAmount), 0);
    
    const customers = JSON.parse(localStorage.getItem(KEYS.CUSTOMERS) || '[]');
    const updatedCustomers = customers.map((c: Customer) => 
      c.id === customerId ? { ...c, currentDebt: customerDebt } : c
    );
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updatedCustomers));
  }
};