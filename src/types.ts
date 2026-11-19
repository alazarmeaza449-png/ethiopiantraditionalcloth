export type Currency = 'ETB' | 'USD';

export type Category =
  | 'Women'
  | 'Men'
  | 'Couples & Weddings'
  | 'Kids'
  | 'Accessories';

export type StandardSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | 'One Size';

export type FabricChoice = 'Hand-Spun Cotton (Menen)' | 'Silk-Blend Shemma' | 'Heavy Gabi Weave' | 'Solid Brass & Gold Filigree';

export type StockStatus = 'In Stock' | 'Made to Order' | 'Limited Run' | 'Out of Stock';

export type OrderStatus =
  | 'Pending'
  | 'Hand-Weaving / Tailoring'
  | 'Quality Check'
  | 'Shipped'
  | 'Delivered';

export type DeliveryMethod = 'addis_express' | 'dhl_international';

export interface TibebColorOption {
  name: string;
  swatchHex: string;
  accentHex: string;
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  subCategory: string;
  priceETB: number;
  priceUSD: number;
  fabricType: string;
  availableFabrics: FabricChoice[];
  tibebColors: TibebColorOption[];
  weavingTime: string;
  stockStatus: StockStatus;
  images: string[];
  description: string;
  artisanNote: string;
  featured?: boolean;
  upsellIds?: string[];
  isOneSizeOnly?: boolean;
}

export interface CustomMeasurements {
  heightCm: string;
  bustChestCm: string;
  waistCm: string;
  hipCm: string;
  sleeveLengthCm: string;
  garmentLengthCm: string;
  notes?: string;
}

export interface CartItem {
  cartItemId: string;
  productId: string;
  name: string;
  category: Category;
  image: string;
  priceETB: number;
  priceUSD: number;
  quantity: number;
  sizingMode: 'standard' | 'custom';
  standardSize?: StandardSize;
  customMeasurements?: CustomMeasurements;
  selectedFabric: FabricChoice;
  selectedTibebColor: string;
  weavingTime: string;
}

export interface Order {
  id: string;
  customerId: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  cityCountry: string;
  deliveryMethod: DeliveryMethod;
  promoCode?: string;
  discountETB: number;
  discountUSD: number;
  shippingETB: number;
  shippingUSD: number;
  totalETB: number;
  totalUSD: number;
  currencyUsed: Currency;
  status: OrderStatus;
  items: CartItem[];
}

export interface CustomerInquiry {
  id: string;
  customerId: string;
  createdAt: string;
  customerName: string;
  contact: string;
  occasion: string;
  preferredColors: string;
  message: string;
  status: 'New' | 'Replied' | 'Archived';
  adminReply?: string;
  repliedAt?: string;
}

export interface StyleTrendPattern {
  patternName: string;
  fabricPairing: string;
  demandSignal: string;
  momentumLabel: string;
  loomRecommendation: string;
}

export interface StyleTrendColorCombo {
  paletteName: string;
  primaryColorHex: string;
  accentColorHex: string;
  targetOccasion: string;
  rationale: string;
}

export interface StyleTrendReport {
  executiveSummary: string;
  risingWeavingPatterns: StyleTrendPattern[];
  trendingColorCombinations: StyleTrendColorCombo[];
  atelierActionPlan: string[];
  generatedAt: string;
  model?: string;
}

export interface CustomerProfile {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  shippingAddress: string;
  cityCountry: string;
  createdAt: string;
}

