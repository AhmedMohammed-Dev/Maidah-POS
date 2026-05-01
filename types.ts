
export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  SERVED = 'SERVED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED'
}

// Category enum removed to allow dynamic categories
// Categories are now managed as strings in the store

export type Role = 'ADMIN' | 'CASHIER' | 'WAITER' | 'DRIVER';

export interface User {
  id: string;
  username: string;
  password?: string;
  pin?: string;
  name: string;
  role: Role;
}

export interface Customer {
    id: string;
    name: string;
    phone: string;
    address: string;
    notes?: string;
    totalOrders: number;
    lastOrderDate: Date;
}

export interface ProductSize {
  name: string;
  price: number;
}

export interface RecipeItem {
    ingredientId: string;
    quantity: number; // Amount needed per product unit
    sizeName?: string; // Optional: Link ingredient to specific size
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string; // Changed from Category enum to string
  image: string;
  description?: string;
  sizes?: ProductSize[];
  recipe?: RecipeItem[]; // Linked Ingredients
  isAvailable?: boolean; // New: To quickly toggle stock availability
  prepTime?: number; // New: Preparation time in minutes
  calories?: number; // New: Calories count
}

export interface CartItem extends Product {
  quantity: number;
  notes?: string;
  selectedSize?: ProductSize;
  isDonation?: boolean; // New Flag for Donations
}

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';

export interface Order {
  id: string;
  tableNumber: number | string;
  orderType?: OrderType; // New field to strictly categorize order
  items: CartItem[];
  status: OrderStatus;
  total: number;
  createdAt: Date;
  customerName?: string;
  customerPhone?: string; // New for delivery
  customerAddress?: string; // New for delivery
  createdBy?: string;
  shiftId?: string; // Link order to a specific shift
  waiterId?: string; // Captain
  driverId?: string; // Delivery Driver
  paymentMethod?: 'CASH' | 'QR' | 'CARD'; // Payment Method
}

// --- NEW TYPES FOR INVENTORY & ACCOUNTING ---

export interface Ingredient {
    id: string;
    name: string;
    unit: string; // e.g., kg, liter, piece
    costPerUnit: number;
    currentStock: number;
    minStockLevel: number;
}

export interface Supplier {
    id: string;
    name: string;
    phone: string;
    contactPerson?: string;
}

export interface Expense {
    id: string;
    description: string;
    amount: number;
    date: Date;
    category: 'PURCHASE' | 'SALARY' | 'UTILITY' | 'OTHER';
    shiftId?: string;
}

export interface Shift {
    id: string;
    userId: string;
    userName: string;
    startTime: Date;
    endTime?: Date;
    startCash: number;
    endCash?: number;
    systemCash?: number; // Calculated by system
    difference?: number; // Surplus or Shortage
    status: 'OPEN' | 'CLOSED';
    stats?: {
        totalSales: number;
        cashSales: number;
        cardSales: number;
        expensesTotal: number;
    }
}

export interface AppSettings {
  restaurantName: string;
  logo?: string; 
  address: string;
  phone: string;
  currency: string;
  taxRate: number;
  printerWidth: '80mm' | '58mm';
  autoPrint: boolean;
  receiptHeader: string;
  receiptFooter: string;
  deviceId: string;
  isActivated: boolean;
  licenseExpiryDate: string | null;
  defaultStartCash: number; 
  
  // Cost Control Settings
  costPercentageDanger: number; 
  costPercentageHigh: number;   
  costPercentageIdeal: number;  
  
  // Language
  language: 'ar' | 'en';
}
