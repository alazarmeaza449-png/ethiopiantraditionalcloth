import { INITIAL_PRODUCTS } from '../data/initialData';
import {
  CartItem,
  Currency,
  CustomerInquiry,
  CustomerProfile,
  Order,
  Product,
  StyleTrendReport,
} from '../types';

const KEYS = {
  PRODUCTS: 'etc_products_v2',
  CART: 'etc_cart_v2',
  ORDERS: 'etc_orders_v2',
  INQUIRIES: 'etc_inquiries_v2',
  CURRENCY: 'etc_currency_v2',
  NEWSLETTER: 'etc_newsletter_v2',
  TRENDS: 'etc_trends_v2',
  PROFILES: 'etc_profiles_v2',
  ACTIVE_CUSTOMER_ID: 'etc_active_customer_id_v2',
};

function safeRead<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore quota errors cleanly
  }
}

export function generateCustomerId(): string {
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  return `ETC-${timePart}${rand}`;
}

export const storage = {
  loadProducts: (): Product[] => safeRead<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS),
  saveProducts: (products: Product[]) => safeWrite(KEYS.PRODUCTS, products),

  loadCart: (): CartItem[] => safeRead<CartItem[]>(KEYS.CART, []),
  saveCart: (cart: CartItem[]) => safeWrite(KEYS.CART, cart),

  // Real data only: orders & inquiries start empty until real customers submit them
  loadOrders: (): Order[] => safeRead<Order[]>(KEYS.ORDERS, []),
  saveOrders: (orders: Order[]) => safeWrite(KEYS.ORDERS, orders),

  loadInquiries: (): CustomerInquiry[] => safeRead<CustomerInquiry[]>(KEYS.INQUIRIES, []),
  saveInquiries: (inquiries: CustomerInquiry[]) => safeWrite(KEYS.INQUIRIES, inquiries),

  loadCurrency: (): Currency => safeRead<Currency>(KEYS.CURRENCY, 'USD'),
  saveCurrency: (currency: Currency) => safeWrite(KEYS.CURRENCY, currency),

  loadNewsletter: (): string[] => safeRead<string[]>(KEYS.NEWSLETTER, []),
  saveNewsletter: (emails: string[]) => safeWrite(KEYS.NEWSLETTER, emails),

  loadTrendReport: (): StyleTrendReport | null =>
    safeRead<StyleTrendReport | null>(KEYS.TRENDS, null),
  saveTrendReport: (report: StyleTrendReport | null) =>
    safeWrite(KEYS.TRENDS, report),

  // Multi-customer isolated profiles (no mockups)
  loadProfiles: (): CustomerProfile[] =>
    safeRead<CustomerProfile[]>(KEYS.PROFILES, []),
  saveProfiles: (profiles: CustomerProfile[]) => safeWrite(KEYS.PROFILES, profiles),

  loadActiveCustomerId: (): string | null =>
    safeRead<string | null>(KEYS.ACTIVE_CUSTOMER_ID, null),
  saveActiveCustomerId: (customerId: string | null) =>
    safeWrite(KEYS.ACTIVE_CUSTOMER_ID, customerId),
};
