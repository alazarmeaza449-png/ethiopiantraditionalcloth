import React, { useMemo, useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Scissors,
  Mail,
  Plus,
  Pencil,
  Trash2,
  X,
  Ruler,
  Search,
  Send,
  ArrowLeft,
  TrendingUp,
  LogOut,
  Upload,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { HabeshaStyleTrendPanel } from './HabeshaStyleTrendPanel';
import {
  Category,
  Currency,
  CustomerInquiry,
  FabricChoice,
  Order,
  OrderStatus,
  Product,
  StockStatus,
} from '../types';
import {
  formatMoney,
  STUDIO_IMAGES,
  TIBEB_PRESETS,
} from '../data/initialData';
import { LuxuryImage } from './TibebMotif';

interface AdminDashboardProps {
  products: Product[];
  orders: Order[];
  inquiries: CustomerInquiry[];
  newsletterEmails: string[];
  currency: Currency;
  adminToken: string | null;
  onAddProduct: (product: Product) => Promise<void>;
  onUpdateProduct: (product: Product) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onUpdateOrderStatus: (orderId: string, status: OrderStatus) => void;
  onReplyInquiry: (inquiryId: string, replyText: string) => void;
  onArchiveInquiry: (inquiryId: string) => void;
  onBackToStorefront: () => void;
  onAdminSignOut: () => void;
}

type AdminTab = 'overview' | 'trends' | 'inventory' | 'orders' | 'inbox';

const ORDER_STATUSES: OrderStatus[] = [
  'Pending',
  'Hand-Weaving / Tailoring',
  'Quality Check',
  'Shipped',
  'Delivered',
];

const CATEGORIES: Category[] = [
  'Women',
  'Men',
  'Couples & Weddings',
  'Kids',
  'Accessories',
];

const STOCK_STATUSES: StockStatus[] = [
  'In Stock',
  'Made to Order',
  'Limited Run',
  'Out of Stock',
];

const FABRIC_CHOICES: FabricChoice[] = [
  'Hand-Spun Cotton (Menen)',
  'Silk-Blend Shemma',
  'Heavy Gabi Weave',
  'Solid Brass & Gold Filigree',
];

const STATUS_STYLE: Record<OrderStatus, string> = {
  Pending: 'text-[#A64B2A] bg-[#A64B2A]/10 border-[#A64B2A]/25',
  'Hand-Weaving / Tailoring':
    'text-[#9A7414] bg-[#C59B27]/15 border-[#C59B27]/35',
  'Quality Check': 'text-[#1A1817] bg-[#F3EFE8] border-[#D6CFC2]',
  Shipped: 'text-[#164A3B] bg-[#164A3B]/10 border-[#164A3B]/25',
  Delivered: 'text-[#164A3B] bg-[#164A3B]/15 border-[#164A3B]/35',
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  orders,
  inquiries,
  newsletterEmails,
  currency,
  adminToken,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onUpdateOrderStatus,
  onReplyInquiry,
  onArchiveInquiry,
  onBackToStorefront,
  onAdminSignOut,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [productSearch, setProductSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'All'>(
    'All'
  );
  const [inspectingOrder, setInspectingOrder] = useState<Order | null>(null);

  // Add / Edit Product Modal State
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('Women');
  const [formSubCategory, setFormSubCategory] = useState('Habesha Kemis');
  const [formPriceETB, setFormPriceETB] = useState('18500');
  const [formPriceUSD, setFormPriceUSD] = useState('310');
  const [formFabric, setFormFabric] = useState<FabricChoice>(
    'Hand-Spun Cotton (Menen)'
  );
  const [formWeavingTime, setFormWeavingTime] = useState('10–14 Days');
  const [formStockStatus, setFormStockStatus] =
    useState<StockStatus>('Made to Order');
  const [formImageUrl, setFormImageUrl] = useState(STUDIO_IMAGES.womenKemisGold);
  const [formDescription, setFormDescription] = useState('');
  const [formIsOneSizeOnly, setFormIsOneSizeOnly] = useState(false);
  const [formTibebNames, setFormTibebNames] = useState<string[]>([
    TIBEB_PRESETS.goldObsidian.name,
    TIBEB_PRESETS.emeraldGold.name,
  ]);
  const [productSaving, setProductSaving] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const [productToast, setProductToast] = useState<string | null>(null);

  // Inquiry Reply State
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Analytics Computation
  const analytics = useMemo(() => {
    const totalETB = orders.reduce((s, o) => s + o.totalETB, 0);
    const totalUSD = orders.reduce((s, o) => s + o.totalUSD, 0);
    const activeOrders = orders.filter((o) => o.status !== 'Delivered').length;
    const customQueue = orders.filter(
      (o) =>
        o.status !== 'Delivered' &&
        o.items.some((item) => item.sizingMode === 'custom')
    ).length;

    const categoryTotals: Record<string, number> = {};
    orders.forEach((o) => {
      o.items.forEach((item) => {
        categoryTotals[item.category] =
          (categoryTotals[item.category] || 0) + item.priceUSD * item.quantity;
      });
    });

    const sortedCats = Object.entries(categoryTotals).sort(
      (a, b) => b[1] - a[1]
    );
    const bestCategory = sortedCats[0]?.[0] || 'No orders yet';
    const maxCatRev = sortedCats[0]?.[1] || 1;

    return {
      totalETB,
      totalUSD,
      activeOrders,
      customQueue,
      bestCategory,
      categoryBreakdown: sortedCats,
      maxCatRev,
    };
  }, [orders]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.subCategory.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (o) => orderStatusFilter === 'All' || o.status === orderStatusFilter
    );
  }, [orders, orderStatusFilter]);

  const showToast = (msg: string) => {
    setProductToast(msg);
    setTimeout(() => setProductToast(null), 4000);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName('');
    setFormCategory('Women');
    setFormSubCategory('Habesha Kemis');
    setFormPriceETB('18500');
    setFormPriceUSD('310');
    setFormFabric('Hand-Spun Cotton (Menen)');
    setFormWeavingTime('10–14 Days');
    setFormStockStatus('Made to Order');
    setFormImageUrl(STUDIO_IMAGES.womenKemisGold);
    setFormDescription(
      'Hand-loomed in Shiromieda, Addis Ababa from breathable Ethiopian highland cotton with authentic geometric Tibeb weaving.'
    );
    setFormIsOneSizeOnly(false);
    setFormTibebNames([
      TIBEB_PRESETS.goldObsidian.name,
      TIBEB_PRESETS.emeraldGold.name,
      TIBEB_PRESETS.terracottaGold.name,
    ]);
    setProductError(null);
    setProductModalOpen(true);
  };

  const openDraftModalFromTrend = (preset: {
    name: string;
    fabric: FabricChoice;
    description: string;
  }) => {
    setEditingProduct(null);
    setFormName(preset.name);
    setFormCategory('Women');
    setFormSubCategory('Habesha Kemis');
    setFormPriceETB('21500');
    setFormPriceUSD('360');
    setFormFabric(preset.fabric);
    setFormWeavingTime('12–16 Days');
    setFormStockStatus('Made to Order');
    setFormImageUrl(
      preset.fabric === 'Silk-Blend Shemma'
        ? STUDIO_IMAGES.womenZuriaEmerald
        : STUDIO_IMAGES.womenKemisGold
    );
    setFormDescription(preset.description);
    setFormIsOneSizeOnly(false);
    setFormTibebNames([
      TIBEB_PRESETS.goldObsidian.name,
      TIBEB_PRESETS.emeraldGold.name,
    ]);
    setProductError(null);
    setProductModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormCategory(product.category);
    setFormSubCategory(product.subCategory);
    setFormPriceETB(String(product.priceETB));
    setFormPriceUSD(String(product.priceUSD));
    setFormFabric(
      (product.availableFabrics[0] as FabricChoice) ||
        'Hand-Spun Cotton (Menen)'
    );
    setFormWeavingTime(product.weavingTime);
    setFormStockStatus(product.stockStatus);
    setFormImageUrl(product.images[0] || STUDIO_IMAGES.womenKemisGold);
    setFormDescription(product.description);
    setFormIsOneSizeOnly(Boolean(product.isOneSizeOnly));
    setFormTibebNames(
      product.tibebColors?.map((c) => c.name) || [TIBEB_PRESETS.goldObsidian.name]
    );
    setProductError(null);
    setProductModalOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setProductError('Please select a valid image file (JPG, PNG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 960;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setFormImageUrl(dataUrl);
          setProductError(null);
        }
      };
      img.onerror = () => {
        setProductError('Unable to process the selected image file.');
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const etb = Math.max(0, Number(formPriceETB) || 0);
    const usd = Math.max(0, Number(formPriceUSD) || 0);
    if (!formName.trim()) {
      setProductError('Please enter a garment name.');
      return;
    }

    const allTibebOptions = Object.values(TIBEB_PRESETS);
    const selectedTibeb = allTibebOptions.filter((t) =>
      formTibebNames.includes(t.name)
    );
    const finalTibeb =
      selectedTibeb.length > 0 ? selectedTibeb : [TIBEB_PRESETS.goldObsidian];

    setProductSaving(true);
    setProductError(null);

    try {
      if (editingProduct) {
        const updated: Product = {
          ...editingProduct,
          name: formName.trim(),
          category: formCategory,
          subCategory: formSubCategory.trim() || formCategory,
          priceETB: etb,
          priceUSD: usd,
          fabricType: formFabric,
          availableFabrics: Array.from(
            new Set([formFabric, ...editingProduct.availableFabrics])
          ),
          tibebColors: finalTibeb,
          weavingTime: formWeavingTime.trim() || '10–14 Days',
          stockStatus: formStockStatus,
          images: [
            formImageUrl.trim() || STUDIO_IMAGES.womenKemisGold,
            STUDIO_IMAGES.fabricMacro,
          ],
          description: formDescription.trim(),
          isOneSizeOnly: formIsOneSizeOnly,
        };
        await onUpdateProduct(updated);
        showToast(`"${updated.name}" updated live on the storefront.`);
      } else {
        const created: Product = {
          id: `etc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: formName.trim(),
          category: formCategory,
          subCategory: formSubCategory.trim() || formCategory,
          priceETB: etb,
          priceUSD: usd,
          fabricType: formFabric,
          availableFabrics:
            formFabric === 'Solid Brass & Gold Filigree'
              ? ['Solid Brass & Gold Filigree']
              : Array.from(new Set([formFabric, 'Silk-Blend Shemma'])),
          tibebColors: finalTibeb,
          weavingTime: formWeavingTime.trim() || '10–14 Days',
          stockStatus: formStockStatus,
          images: [
            formImageUrl.trim() || STUDIO_IMAGES.womenKemisGold,
            STUDIO_IMAGES.fabricMacro,
          ],
          description:
            formDescription.trim() ||
            'Hand-woven Ethiopian luxury garment crafted in our Shiromieda, Addis Ababa atelier.',
          artisanNote: 'Crafted in our Shiromieda, Addis Ababa atelier.',
          featured: true,
          upsellIds: ['hc-netela-03', 'hc-jewelry-10'],
          isOneSizeOnly: formIsOneSizeOnly,
        };
        await onAddProduct(created);
        setActiveTab('inventory');
        showToast(`"${created.name}" published live in real time.`);
      }
      setProductModalOpen(false);
    } catch (err: unknown) {
      setProductError(
        err instanceof Error ? err.message : 'Unable to save product.'
      );
    } finally {
      setProductSaving(false);
    }
  };

  const handleDeleteClick = async (product: Product) => {
    try {
      await onDeleteProduct(product.id);
      showToast(`"${product.name}" removed from storefront.`);
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : 'Failed to remove product.'
      );
    }
  };

  const newInquiryCount = inquiries.filter((i) => i.status === 'New').length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF8F5] flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-[#E6E0D4] p-4 sm:p-5 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div>
            <div className="text-xs font-medium text-[#A67F1A]">
              Atelier Console
            </div>
            <div className="font-serif text-xl font-semibold text-[#1A1817] mt-0.5">
              Shiromieda Flagship Studio
            </div>
          </div>

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              {
                id: 'trends',
                label: 'Habesha Style Trend',
                icon: TrendingUp,
              },
              {
                id: 'inventory',
                label: `Inventory (${products.length})`,
                icon: Package,
              },
              {
                id: 'orders',
                label: `Orders & Tailoring (${orders.length})`,
                icon: Scissors,
              },
              {
                id: 'inbox',
                label: `Inquiries${newInquiryCount ? ` (${newInquiryCount})` : ''}`,
                icon: Mail,
              },
            ].map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id as AdminTab)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1A1817] text-[#FAF8F5]'
                      : 'text-[#4A453F] hover:bg-[#F3EFE8] hover:text-[#1A1817]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? 'text-[#C59B27]' : 'text-[#6B655E]'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="hidden lg:flex flex-col gap-2">
          <button
            type="button"
            onClick={onBackToStorefront}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-[#4A453F] hover:text-[#1A1817] border border-[#E6E0D4] rounded-md hover:border-[#C59B27] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
          <button
            type="button"
            onClick={onAdminSignOut}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#A64B2A] hover:bg-[#A64B2A]/10 border border-[#A64B2A]/25 rounded-md transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock &amp; Sign Out Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 p-5 sm:p-8 max-w-6xl w-full mx-auto space-y-6">
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E6E0D4]">
          <div className="text-xs text-[#6B655E]">
            <span>Admin</span>
            <span className="mx-2">/</span>
            <span className="text-[#1A1817] font-semibold capitalize">
              {activeTab === 'orders'
                ? 'Orders & Custom Measurements'
                : activeTab === 'inbox'
                ? 'Customer Messages Inbox'
                : activeTab === 'trends'
                ? 'Habesha Style Trend (AI Forecast)'
                : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAdminSignOut}
              className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 border border-[#A64B2A]/30 text-[#A64B2A] text-xs font-medium rounded-md cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock</span>
            </button>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Real-time Save Confirmation Banner */}
        {productToast && (
          <div className="bg-white border border-[#164A3B]/40 rounded-lg px-4 py-3 flex items-center gap-2.5 text-xs text-[#164A3B] font-medium">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{productToast}</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW ANALYTICS */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
                <div className="text-xs text-[#6B655E]">Total Revenue</div>
                <div className="mt-2 font-serif text-2xl font-semibold text-[#1A1817] tabular-nums">
                  {formatMoney(analytics.totalETB, analytics.totalUSD, currency)}
                </div>
                <div className="mt-1 text-xs font-mono text-[#6B655E] tabular-nums">
                  {currency === 'USD'
                    ? formatMoney(analytics.totalETB, analytics.totalUSD, 'ETB')
                    : formatMoney(analytics.totalETB, analytics.totalUSD, 'USD')}
                </div>
              </div>

              <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
                <div className="text-xs text-[#6B655E]">Active Orders</div>
                <div className="mt-2 font-serif text-2xl font-semibold text-[#1A1817] tabular-nums">
                  {analytics.activeOrders}
                </div>
                <div className="mt-1 text-xs text-[#6B655E] tabular-nums">
                  Across {orders.length} total commissions
                </div>
              </div>

              <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
                <div className="text-xs text-[#6B655E]">
                  Custom Tailoring Queue
                </div>
                <div className="mt-2 font-serif text-2xl font-semibold text-[#164A3B] tabular-nums">
                  {analytics.customQueue}
                </div>
                <div className="mt-1 text-xs text-[#6B655E]">
                  Orders with custom cm specs
                </div>
              </div>

              <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
                <div className="text-xs text-[#6B655E]">
                  Best-Selling Category
                </div>
                <div className="mt-2 font-serif text-2xl font-semibold text-[#1A1817] truncate">
                  {analytics.bestCategory}
                </div>
                <div className="mt-1 text-xs text-[#A67F1A]">
                  Top ceremonial revenue driver
                </div>
              </div>
            </div>

            {/* Category Breakdown & Tailoring Queue Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-4">
                <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                  Revenue by Category
                </h3>
                {analytics.categoryBreakdown.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6B655E]">
                    No customer orders recorded yet. Revenue by category will populate from real purchases.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analytics.categoryBreakdown.map(([cat, revUSD]) => {
                      const pct = Math.max(
                        8,
                        Math.round((revUSD / analytics.maxCatRev) * 100)
                      );
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-medium text-[#1A1817]">
                              {cat}
                            </span>
                            <span className="font-mono text-[#6B655E] tabular-nums">
                              {formatMoney(revUSD * 60, revUSD, currency)}
                            </span>
                          </div>
                          <div className="h-2 w-full bg-[#F3EFE8] rounded overflow-hidden">
                            <div
                              className="h-full bg-[#C59B27] rounded"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-7 bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                    Active Tailoring Queue
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    className="text-xs font-medium text-[#A67F1A] hover:text-[#1A1817] underline cursor-pointer"
                  >
                    Manage All Orders
                  </button>
                </div>

                {orders.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#6B655E]">
                    No real customer orders in queue yet.
                  </div>
                ) : (
                  <div className="divide-y divide-[#F0EAE0]">
                    {orders.slice(0, 4).map((order) => (
                      <div
                        key={order.id}
                        className="py-3 flex items-center justify-between gap-4 text-xs"
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-[#1A1817] truncate">
                            {order.customerName}{' '}
                            <span className="font-mono font-normal text-[#6B655E]">
                              ({order.id} · {order.customerId})
                            </span>
                          </div>
                          <div className="text-[#6B655E] truncate mt-0.5">
                            {order.items.map((i) => i.name).join(', ')}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInspectingOrder(order)}
                          className="px-2.5 py-1 text-[11px] font-medium border border-[#E6E0D4] rounded hover:border-[#C59B27] text-[#1A1817] shrink-0 cursor-pointer"
                        >
                          Inspect Fit
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Habesha Style Trend Quick Launch Banner on Overview */}
            <div className="bg-white border border-[#E6E0D4] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-[#C59B27] mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                    Habesha Style Trend — AI Weaving &amp; Palette Forecast
                  </h3>
                  <p className="text-xs text-[#6B655E] mt-0.5">
                    Use AI analysis across your {orders.length} sales orders and{' '}
                    {inquiries.length} bespoke inquiries to uncover gaining-momentum weaving patterns and Tibeb colorways.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('trends')}
                className="px-4 py-2 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Open Style Trend Analysis
              </button>
            </div>
          </div>
        )}

        {/* TAB 1B: AI-POWERED HABESHA STYLE TREND */}
        {activeTab === 'trends' && (
          <HabeshaStyleTrendPanel
            orders={orders}
            products={products}
            inquiries={inquiries}
            adminToken={adminToken}
            onDraftProductFromTrend={openDraftModalFromTrend}
          />
        )}

        {/* TAB 2: PRODUCT & INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="bg-white border border-[#E6E0D4] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#E6E0D4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-[#6B655E] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Filter garments by name or style..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                />
              </div>
              <span className="text-xs text-[#6B655E] tabular-nums">
                Showing {filteredProducts.length} of {products.length} garments
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E0D4] bg-[#FAF8F5] text-[11px] font-semibold text-[#6B655E]">
                    <th className="py-3 px-4">Garment</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Fabric &amp; Lead Time</th>
                    <th className="py-3 px-4 text-right">Price (ETB)</th>
                    <th className="py-3 px-4 text-right">Price (USD)</th>
                    <th className="py-3 px-4">Stock Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EAE0] text-xs">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#FAF8F5] transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-11 rounded overflow-hidden bg-[#F3EFE8] shrink-0">
                            <LuxuryImage
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-[#1A1817]">
                              {product.name}
                            </div>
                            <div className="text-[11px] text-[#6B655E]">
                              {product.subCategory}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-[#4A453F]">
                        {product.category}
                      </td>
                      <td className="py-2.5 px-4 text-[#4A453F]">
                        <div>{product.fabricType}</div>
                        <div className="text-[11px] text-[#6B655E]">
                          {product.weavingTime}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#1A1817]">
                        {product.priceETB.toLocaleString('en-US')} ETB
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-[#1A1817]">
                        ${product.priceUSD.toLocaleString('en-US')}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`text-xs font-medium ${
                            product.stockStatus === 'Out of Stock'
                              ? 'text-[#A64B2A]'
                              : product.stockStatus === 'In Stock'
                              ? 'text-[#164A3B]'
                              : 'text-[#9A7414]'
                          }`}
                        >
                          {product.stockStatus}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(product)}
                            aria-label={`Edit ${product.name}`}
                            className="p-1.5 text-[#4A453F] hover:text-[#1A1817] hover:bg-[#F3EFE8] rounded cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(product)}
                            aria-label={`Delete ${product.name}`}
                            className="p-1.5 text-[#6B655E] hover:text-[#A64B2A] hover:bg-[#A64B2A]/10 rounded cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ORDER & CUSTOM MEASUREMENT TRACKER */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {(['All', ...ORDER_STATUSES] as (OrderStatus | 'All')[]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-[#1A1817] text-white border-[#1A1817]'
                        : 'bg-white text-[#4A453F] border-[#E6E0D4] hover:border-[#C59B27]'
                    }`}
                  >
                    {st}
                  </button>
                )
              )}
            </div>

            <div className="bg-white border border-[#E6E0D4] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E6E0D4] bg-[#FAF8F5] text-[11px] font-semibold text-[#6B655E]">
                      <th className="py-3 px-4">Order &amp; Customer ID</th>
                      <th className="py-3 px-4">Customer &amp; Destination</th>
                      <th className="py-3 px-4">Pieces &amp; Tailoring</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4">Status Workflow</th>
                      <th className="py-3 px-4 text-right">Measurements</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EAE0] text-xs">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 px-4 text-center text-sm text-[#6B655E]"
                        >
                          {orders.length === 0
                            ? 'No orders placed yet. Real customer orders will appear here.'
                            : 'No orders match the selected status filter.'}
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => {
                        const hasCustom = order.items.some(
                          (i) => i.sizingMode === 'custom'
                        );
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-[#FAF8F5] transition-colors"
                          >
                            <td className="py-3 px-4 font-mono">
                              <div className="font-medium text-[#1A1817]">
                                {order.id}
                              </div>
                              <div className="text-[11px] text-[#A67F1A]">
                                {order.customerId}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="font-semibold text-[#1A1817]">
                                {order.customerName}
                              </div>
                              <div className="text-[11px] text-[#6B655E]">
                                {order.cityCountry}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div className="text-[#1A1817]">
                                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                              </div>
                              <div className="text-[11px] mt-0.5 text-[#6B655E]">
                                {hasCustom ? (
                                  <span className="text-[#164A3B] font-medium">
                                    Custom Body Measurements Included
                                  </span>
                                ) : (
                                  `Standard Size (${order.items
                                    .map((i) => i.standardSize)
                                    .join(', ')})`
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#1A1817]">
                              {formatMoney(
                                order.totalETB,
                                order.totalUSD,
                                currency
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <select
                                value={order.status}
                                onChange={(e) =>
                                  onUpdateOrderStatus(
                                    order.id,
                                    e.target.value as OrderStatus
                                  )
                                }
                                aria-label={`Update status for ${order.id}`}
                                className={`px-2.5 py-1.5 text-xs font-medium rounded border focus:outline-none cursor-pointer ${
                                  STATUS_STYLE[order.status]
                                }`}
                              >
                                {ORDER_STATUSES.map((st) => (
                                  <option
                                    key={st}
                                    value={st}
                                    className="bg-white text-[#1A1817]"
                                  >
                                    {st}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setInspectingOrder(order)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E6E0D4] rounded bg-white hover:border-[#C59B27] text-[#1A1817] cursor-pointer"
                              >
                                <Ruler className="w-3.5 h-3.5 text-[#C59B27]" />
                                <span>Inspect</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: CUSTOMER MESSAGES INBOX */}
        {activeTab === 'inbox' && (
          <div className="space-y-4">
            {/* Captured Newsletter Subscribers */}
            <div className="bg-white border border-[#E6E0D4] rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-semibold text-[#1A1817]">
                  Newsletter Dispatch Subscribers
                </h3>
                <p className="text-xs text-[#6B655E] mt-0.5">
                  {newsletterEmails.length === 0
                    ? 'No newsletter subscriptions captured yet.'
                    : newsletterEmails.join(' · ')}
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-[#164A3B] font-semibold shrink-0">
                {newsletterEmails.length} Registered
              </span>
            </div>

            {inquiries.length === 0 ? (
              <div className="bg-white border border-[#E6E0D4] rounded-lg p-12 text-center text-sm text-[#6B655E]">
                No bespoke inquiries received yet.
              </div>
            ) : (
              inquiries.map((inq) => (
                <div
                  key={inq.id}
                  className="bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#F0EAE0]">
                    <div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-mono text-[#6B655E]">{inq.id}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono text-[#A67F1A]">
                          {inq.customerId}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-semibold text-[#1A1817] text-sm">
                          {inq.customerName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-medium ${
                            inq.status === 'New'
                              ? 'text-[#A64B2A]'
                              : inq.status === 'Replied'
                              ? 'text-[#164A3B]'
                              : 'text-[#6B655E]'
                          }`}
                        >
                          {inq.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#6B655E] mt-1">
                        {inq.contact} · Occasion: {inq.occasion} · Colors:{' '}
                        {inq.preferredColors}
                      </div>
                    </div>

                    {inq.status !== 'Archived' && (
                      <button
                        type="button"
                        onClick={() => onArchiveInquiry(inq.id)}
                        className="text-xs text-[#6B655E] hover:text-[#1A1817] underline self-start cursor-pointer"
                      >
                        Archive
                      </button>
                    )}
                  </div>

                  <p className="text-sm text-[#1A1817] leading-relaxed">
                    {inq.message}
                  </p>

                  {inq.adminReply && (
                    <div className="p-3.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded-md text-xs space-y-1">
                      <div className="font-semibold text-[#164A3B]">
                        Atelier Reply Sent
                      </div>
                      <p className="text-[#4A453F]">{inq.adminReply}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      value={replyDrafts[inq.id] || ''}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({
                          ...prev,
                          [inq.id]: e.target.value,
                        }))
                      }
                      placeholder="Write a bespoke consultation reply..."
                      className="flex-1 px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const text = (replyDrafts[inq.id] || '').trim();
                        if (!text) return;
                        onReplyInquiry(inq.id, text);
                        setReplyDrafts((prev) => ({ ...prev, [inq.id]: '' }));
                      }}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1A1817] hover:bg-[#2F2B29] text-white text-xs font-semibold rounded-md transition-colors cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5 text-[#C59B27]" />
                      <span>Send Reply</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      {/* INSPECT ORDER & CUSTOM MEASUREMENTS MODAL */}
      {inspectingOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1817]/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setInspectingOrder(null)}
        >
          <div
            className="w-full max-w-2xl bg-[#FAF8F5] border border-[#E6E0D4] rounded-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#E6E0D4] flex items-center justify-between">
              <div>
                <div className="font-mono text-xs text-[#6B655E]">
                  {inspectingOrder.id} · Customer ID: {inspectingOrder.customerId}
                </div>
                <h3 className="font-serif text-xl font-semibold text-[#1A1817]">
                  {inspectingOrder.customerName} — Tailoring Specification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="p-2 text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div className="bg-white border border-[#E6E0D4] rounded-md p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#6B655E]">Contact:</span>{' '}
                  <span className="font-medium text-[#1A1817]">
                    {inspectingOrder.customerPhone} ·{' '}
                    {inspectingOrder.customerEmail}
                  </span>
                </div>
                <div>
                  <span className="text-[#6B655E]">Destination:</span>{' '}
                  <span className="font-medium text-[#1A1817]">
                    {inspectingOrder.shippingAddress},{' '}
                    {inspectingOrder.cityCountry}
                  </span>
                </div>
              </div>

              {inspectingOrder.items.map((item) => (
                <div
                  key={item.cartItemId}
                  className="bg-white border border-[#E6E0D4] rounded-md p-4 space-y-3"
                >
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="font-serif text-lg font-semibold text-[#1A1817]">
                        {item.name}
                      </div>
                      <div className="text-[#6B655E]">
                        {item.selectedFabric} · {item.selectedTibebColor} · Qty{' '}
                        {item.quantity}
                      </div>
                    </div>
                    <span className="font-mono font-semibold text-[#1A1817]">
                      {item.sizingMode === 'custom'
                        ? 'Custom Tailored'
                        : `Size ${item.standardSize}`}
                    </span>
                  </div>

                  {item.sizingMode === 'custom' && item.customMeasurements && (
                    <div className="pt-3 border-t border-[#F0EAE0] space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono tabular-nums">
                        <div className="p-2 bg-[#FAF8F5] rounded border border-[#E6E0D4]">
                          <div className="text-[10px] text-[#6B655E]">
                            Height
                          </div>
                          <div className="font-semibold text-[#1A1817]">
                            {item.customMeasurements.heightCm} cm
                          </div>
                        </div>
                        <div className="p-2 bg-[#FAF8F5] rounded border border-[#E6E0D4]">
                          <div className="text-[10px] text-[#6B655E]">
                            Bust / Chest
                          </div>
                          <div className="font-semibold text-[#1A1817]">
                            {item.customMeasurements.bustChestCm} cm
                          </div>
                        </div>
                        <div className="p-2 bg-[#FAF8F5] rounded border border-[#E6E0D4]">
                          <div className="text-[10px] text-[#6B655E]">
                            Waist
                          </div>
                          <div className="font-semibold text-[#1A1817]">
                            {item.customMeasurements.waistCm} cm
                          </div>
                        </div>
                        <div className="p-2 bg-[#FAF8F5] rounded border border-[#E6E0D4]">
                          <div className="text-[10px] text-[#6B655E]">Hip</div>
                          <div className="font-semibold text-[#1A1817]">
                            {item.customMeasurements.hipCm} cm
                          </div>
                        </div>
                        <div className="p-2 bg-[#FAF8F5] rounded border border-[#E6E0D4]">
                          <div className="text-[10px] text-[#6B655E]">
                            Sleeve Length
                          </div>
                          <div className="font-semibold text-[#1A1817]">
                            {item.customMeasurements.sleeveLengthCm} cm
                          </div>
                        </div>
                        <div className="p-2 bg-[#FAF8F5] rounded border border-[#E6E0D4]">
                          <div className="text-[10px] text-[#6B655E]">
                            Garment Length
                          </div>
                          <div className="font-semibold text-[#1A1817]">
                            {item.customMeasurements.garmentLengthCm} cm
                          </div>
                        </div>
                      </div>

                      {item.customMeasurements.notes && (
                        <div className="text-[#4A453F] italic">
                          Tailor Note: “{item.customMeasurements.notes}”
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT MODAL */}
      {productModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1817]/60 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setProductModalOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-[#FAF8F5] border border-[#E6E0D4] rounded-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#E6E0D4] flex items-center justify-between">
              <h3 className="font-serif text-xl font-semibold text-[#1A1817]">
                {editingProduct ? 'Edit Garment' : 'Add New Garment'}
              </h3>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="p-2 text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveProduct}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              <div>
                <label className="block font-medium text-[#4A453F] mb-1">
                  Garment Name
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="E.g. Sheba Gold Silk Zuria"
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Category
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) =>
                      setFormCategory(e.target.value as Category)
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Sub-Category / Style
                  </label>
                  <input
                    type="text"
                    required
                    value={formSubCategory}
                    onChange={(e) => setFormSubCategory(e.target.value)}
                    placeholder="Habesha Kemis, Kaba, Mels..."
                    className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Price (ETB)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPriceETB}
                    onChange={(e) => setFormPriceETB(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Price (USD)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPriceUSD}
                    onChange={(e) => setFormPriceUSD(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Primary Fabric
                  </label>
                  <select
                    value={formFabric}
                    onChange={(e) =>
                      setFormFabric(e.target.value as FabricChoice)
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  >
                    {FABRIC_CHOICES.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Weaving Lead Time
                  </label>
                  <input
                    type="text"
                    required
                    value={formWeavingTime}
                    onChange={(e) => setFormWeavingTime(e.target.value)}
                    placeholder="10–14 Days"
                    className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#4A453F] mb-1">
                    Stock Status
                  </label>
                  <select
                    value={formStockStatus}
                    onChange={(e) =>
                      setFormStockStatus(e.target.value as StockStatus)
                    }
                    className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  >
                    {STOCK_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block font-medium text-[#4A453F]">
                    Product Photo (Upload from Device, Paste URL, or Choose Preset)
                  </label>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F3EFE8] hover:bg-[#EAE3D7] border border-[#E6E0D4] rounded text-[11px] font-semibold text-[#1A1817] cursor-pointer">
                    <Upload className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-14 h-16 rounded border border-[#E6E0D4] overflow-hidden bg-[#F3EFE8] shrink-0">
                    <LuxuryImage
                      src={formImageUrl}
                      alt={formName || 'Garment preview'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <input
                    type="text"
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    placeholder="https://... or upload photo above"
                    className="flex-1 px-3 py-2 font-mono bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: 'Kemis Gold', url: STUDIO_IMAGES.womenKemisGold },
                    {
                      label: 'Zuria Emerald',
                      url: STUDIO_IMAGES.womenZuriaEmerald,
                    },
                    { label: 'Men Kaba', url: STUDIO_IMAGES.menEjetababKaba },
                    { label: 'Mels Couple', url: STUDIO_IMAGES.couplesMels },
                    {
                      label: 'Meskel Jewelry',
                      url: STUDIO_IMAGES.accessoriesMeskel,
                    },
                    { label: 'Kids Attire', url: STUDIO_IMAGES.kidsAttire },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setFormImageUrl(preset.url)}
                      className={`px-2 py-1 rounded border text-[11px] cursor-pointer ${
                        formImageUrl === preset.url
                          ? 'border-[#1A1817] bg-[#1A1817] text-white'
                          : 'border-[#E6E0D4] bg-white text-[#4A453F]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#4A453F] mb-1.5">
                  Tibeb Border Color Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.values(TIBEB_PRESETS).map((preset) => {
                    const checked = formTibebNames.includes(preset.name);
                    return (
                      <label
                        key={preset.name}
                        className={`flex items-center gap-2 px-3 py-2 rounded border cursor-pointer ${
                          checked
                            ? 'border-[#C59B27] bg-white text-[#1A1817]'
                            : 'border-[#E6E0D4] bg-[#FAF8F5] text-[#6B655E]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setFormTibebNames((prev) =>
                              prev.includes(preset.name)
                                ? prev.filter((n) => n !== preset.name)
                                : [...prev, preset.name]
                            )
                          }
                          className="accent-[#1A1817]"
                        />
                        <span
                          className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${preset.swatchHex} 50%, ${preset.accentHex} 50%)`,
                          }}
                        />
                        <span className="truncate">{preset.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#4A453F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formIsOneSizeOnly}
                  onChange={(e) => setFormIsOneSizeOnly(e.target.checked)}
                  className="accent-[#1A1817]"
                />
                <span>One Size Fits All (for Netela shawls, Gabi wraps, or jewelry)</span>
              </label>

              <div>
                <label className="block font-medium text-[#4A453F] mb-1">
                  Editorial Description
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              {productError && (
                <div className="p-3 rounded border border-[#A64B2A]/40 bg-white flex items-center gap-2 text-xs text-[#A64B2A]">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{productError}</span>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={productSaving}
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#4A453F] border border-[#E6E0D4] rounded-md bg-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={productSaving}
                  className="px-5 py-2 text-xs font-semibold bg-[#1A1817] hover:bg-[#2F2B29] disabled:opacity-60 text-white rounded-md cursor-pointer"
                >
                  {productSaving
                    ? 'Publishing Live...'
                    : editingProduct
                    ? 'Save Changes'
                    : 'Publish to Storefront'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
