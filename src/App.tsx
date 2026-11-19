import { useEffect, useMemo, useState } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { CatalogSection } from './components/CatalogSection';
import { ProductDetailModal } from './components/ProductDetailModal';
import { HeritageFooter } from './components/HeritageFooter';
import { CartDrawer } from './components/CartDrawer';
import { InquiryDrawer } from './components/InquiryDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminAuthGate } from './components/AdminAuthGate';
import { CustomerProfileModal } from './components/CustomerProfileModal';
import { SeoManager } from './components/SeoManager';
import {
  CartItem,
  Category,
  Currency,
  CustomerInquiry,
  CustomerProfile,
  Order,
  OrderStatus,
  Product,
} from './types';
import { generateCustomerId, storage } from './utils/storage';

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => storage.loadProducts());
  const [cart, setCart] = useState<CartItem[]>(() => storage.loadCart());
  const [orders, setOrders] = useState<Order[]>(() => storage.loadOrders());
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>(() =>
    storage.loadInquiries()
  );
  const [currency, setCurrency] = useState<Currency>(() =>
    storage.loadCurrency()
  );
  const [newsletterEmails, setNewsletterEmails] = useState<string[]>(() =>
    storage.loadNewsletter()
  );
  const [profiles, setProfiles] = useState<CustomerProfile[]>(() =>
    storage.loadProfiles()
  );
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(() =>
    storage.loadActiveCustomerId()
  );

  const activeProfile = useMemo(
    () =>
      activeCustomerId
        ? profiles.find((p) => p.customerId === activeCustomerId) || null
        : null,
    [profiles, activeCustomerId]
  );

  // Navigation & UI state (Admin is hidden; accessible only via /admin or Ctrl/Cmd+Shift+A)
  const checkAdminUrl = () =>
    window.location.pathname === '/admin' ||
    new URLSearchParams(window.location.search).get('admin') === '1';

  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(checkAdminUrl);
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    try {
      return window.sessionStorage.getItem('etc_admin_token');
    } catch {
      return null;
    }
  });
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (checkAdminUrl()) return null;
    const pid = new URLSearchParams(window.location.search).get('product');
    return pid ? products.find((p) => p.id === pid) || null : null;
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      const admin = checkAdminUrl();
      setIsAdminRoute(admin);
      if (!admin) {
        const pid = new URLSearchParams(window.location.search).get('product');
        setSelectedProduct(pid ? products.find((p) => p.id === pid) || null : null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsAdminRoute((prev) => {
          const next = !prev;
          window.history.pushState({}, '', next ? '/admin' : '/');
          return next;
        });
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [products]);

  const exitAdminView = () => {
    setIsAdminRoute(false);
    if (window.location.pathname === '/admin' || window.location.search.includes('admin=1')) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleAdminAuthenticated = (token: string) => {
    setAdminToken(token);
    setIsAdminAuthenticated(true);
  };

  const handleAdminSignOut = async () => {
    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch {
      // Ignore network errors on logout
    }
    try {
      window.sessionStorage.removeItem('etc_admin_token');
    } catch {
      // Ignore storage errors
    }
    setAdminToken(null);
    setIsAdminAuthenticated(false);
    exitAdminView();
  };

  // Live real-time catalog synchronization from server (SSE + initial fetch)
  useEffect(() => {
    let active = true;

    fetch('/api/products', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data && Array.isArray(data.products)) {
          setProducts(data.products);
          if (!checkAdminUrl()) {
            const pid = new URLSearchParams(window.location.search).get('product');
            if (pid) {
              const matched = (data.products as Product[]).find((p) => p.id === pid);
              if (matched) setSelectedProduct(matched);
            }
          }
        }
      })
      .catch(() => {
        // Fallback to cached localStorage products if offline
      });

    const eventSource = new EventSource('/api/products/stream');
    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          products?: Product[];
        };
        if (active && payload.type === 'sync' && Array.isArray(payload.products)) {
          setProducts(payload.products);
        }
      } catch {
        // Ignore malformed SSE payload
      }
    };

    return () => {
      active = false;
      eventSource.close();
    };
  }, []);

  // Persist to localStorage on updates
  useEffect(() => {
    storage.saveProducts(products);
  }, [products]);

  useEffect(() => {
    storage.saveCart(cart);
  }, [cart]);

  useEffect(() => {
    storage.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    storage.saveInquiries(inquiries);
  }, [inquiries]);

  useEffect(() => {
    storage.saveCurrency(currency);
  }, [currency]);

  useEffect(() => {
    storage.saveNewsletter(newsletterEmails);
  }, [newsletterEmails]);

  useEffect(() => {
    storage.saveProfiles(profiles);
  }, [profiles]);

  useEffect(() => {
    storage.saveActiveCustomerId(activeCustomerId);
  }, [activeCustomerId]);

  const handleSubscribeNewsletter = (email: string) => {
    setNewsletterEmails((prev) =>
      prev.includes(email) ? prev : [email, ...prev]
    );
  };

  const handleSelectCategory = (
    cat: Category | 'All',
    subCategory?: string | null
  ) => {
    if (isAdminRoute) exitAdminView();
    setActiveCategory(cat);
    setActiveSubCategory(subCategory ?? null);
  };

  const handleOpenProduct = (product: Product) => {
    setSelectedProduct(product);
    if (!isAdminRoute) {
      window.history.pushState({}, '', `/?product=${encodeURIComponent(product.id)}`);
    }
  };

  const handleCloseProduct = () => {
    setSelectedProduct(null);
    if (!isAdminRoute && new URLSearchParams(window.location.search).has('product')) {
      window.history.pushState({}, '', '/');
    }
  };

  const handleAddToCart = (incoming: Omit<CartItem, 'cartItemId'>[]) => {
    setCart((prev) => {
      const next = [...prev];
      incoming.forEach((item) => {
        // Merge identical standard-sized items; keep custom-measured items distinct
        const existingIdx =
          item.sizingMode === 'standard'
            ? next.findIndex(
                (c) =>
                  c.productId === item.productId &&
                  c.sizingMode === 'standard' &&
                  c.standardSize === item.standardSize &&
                  c.selectedFabric === item.selectedFabric &&
                  c.selectedTibebColor === item.selectedTibebColor
              )
            : -1;

        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            quantity: next[existingIdx].quantity + item.quantity,
          };
        } else {
          next.push({
            ...item,
            cartItemId: `ci-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          });
        }
      });
      return next;
    });
  };

  const handleUpdateCartQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartItemId === cartItemId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const createUniqueId = (existing: CustomerProfile[]): string => {
    let candidate = generateCustomerId();
    while (existing.some((p) => p.customerId === candidate)) {
      candidate = generateCustomerId();
    }
    return candidate;
  };

  const handleCreateOrUpdateProfile = (
    data: Omit<CustomerProfile, 'customerId' | 'createdAt'>,
    existingCustomerId?: string
  ): CustomerProfile => {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (existingCustomerId) {
      const current = profiles.find((p) => p.customerId === existingCustomerId);
      const updated: CustomerProfile = {
        customerId: existingCustomerId,
        createdAt: current?.createdAt || new Date().toISOString(),
        ...data,
        email: normalizedEmail,
      };
      setProfiles((prev) =>
        prev.map((p) => (p.customerId === existingCustomerId ? updated : p))
      );
      setActiveCustomerId(updated.customerId);
      return updated;
    }

    const existingByEmail = profiles.find(
      (p) => p.email.toLowerCase() === normalizedEmail
    );
    if (existingByEmail) {
      const updated: CustomerProfile = {
        ...existingByEmail,
        ...data,
        email: normalizedEmail,
      };
      setProfiles((prev) =>
        prev.map((p) =>
          p.customerId === existingByEmail.customerId ? updated : p
        )
      );
      setActiveCustomerId(updated.customerId);
      return updated;
    }

    const created: CustomerProfile = {
      customerId: createUniqueId(profiles),
      createdAt: new Date().toISOString(),
      ...data,
      email: normalizedEmail,
    };
    setProfiles((prev) => [created, ...prev]);
    setActiveCustomerId(created.customerId);
    return created;
  };

  const handleSignInLookup = (
    identifier: string
  ): { ok: boolean; error?: string } => {
    const clean = identifier.trim();
    const matched = profiles.find(
      (p) =>
        p.customerId.toUpperCase() === clean.toUpperCase() ||
        p.email.toLowerCase() === clean.toLowerCase()
    );
    if (!matched) {
      return {
        ok: false,
        error: 'No customer profile found matching that Customer ID or email.',
      };
    }
    setActiveCustomerId(matched.customerId);
    return { ok: true };
  };

  const handleSignOut = () => {
    setActiveCustomerId(null);
  };

  const handlePlaceOrder = (
    orderData: Omit<Order, 'id' | 'customerId' | 'createdAt' | 'status'>
  ): Order => {
    const normalizedEmail = orderData.customerEmail.trim().toLowerCase();
    let ownerProfile = activeProfile;

    if (!ownerProfile) {
      ownerProfile =
        profiles.find((p) => p.email.toLowerCase() === normalizedEmail) || null;
    }

    if (ownerProfile) {
      const updatedProfile: CustomerProfile = {
        ...ownerProfile,
        name: orderData.customerName,
        email: normalizedEmail,
        phone: orderData.customerPhone,
        shippingAddress: orderData.shippingAddress,
        cityCountry: orderData.cityCountry,
      };
      setProfiles((prev) =>
        prev.map((p) =>
          p.customerId === ownerProfile!.customerId ? updatedProfile : p
        )
      );
      setActiveCustomerId(updatedProfile.customerId);
      ownerProfile = updatedProfile;
    } else {
      ownerProfile = {
        customerId: createUniqueId(profiles),
        createdAt: new Date().toISOString(),
        name: orderData.customerName,
        email: normalizedEmail,
        phone: orderData.customerPhone,
        shippingAddress: orderData.shippingAddress,
        cityCountry: orderData.cityCountry,
      };
      setProfiles((prev) => [ownerProfile!, ...prev]);
      setActiveCustomerId(ownerProfile.customerId);
    }

    const newOrder: Order = {
      ...orderData,
      customerEmail: normalizedEmail,
      customerId: ownerProfile.customerId,
      id: `ETC-${new Date().getFullYear()}-${Math.floor(1050 + Math.random() * 8900)}`,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCart([]);
    return newOrder;
  };

  // Admin real-time product handlers (server-persisted & broadcast to all storefronts)
  const buildAdminHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (adminToken && adminToken !== 'cookie-session') {
      headers.Authorization = `Bearer ${adminToken}`;
    }
    return headers;
  };

  const handleAddProduct = async (product: Product): Promise<void> => {
    const res = await fetch('/api/products', {
      method: 'POST',
      credentials: 'same-origin',
      headers: buildAdminHeaders(),
      body: JSON.stringify(product),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setIsAdminAuthenticated(false);
      }
      throw new Error(data?.error || 'Failed to publish product.');
    }
    if (Array.isArray(data.products)) {
      setProducts(data.products);
    } else if (data.product) {
      setProducts((prev) => [data.product, ...prev]);
    }
  };

  const handleUpdateProduct = async (updated: Product): Promise<void> => {
    const res = await fetch(`/api/products/${encodeURIComponent(updated.id)}`, {
      method: 'PUT',
      credentials: 'same-origin',
      headers: buildAdminHeaders(),
      body: JSON.stringify(updated),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setIsAdminAuthenticated(false);
      }
      throw new Error(data?.error || 'Failed to update product.');
    }
    if (Array.isArray(data.products)) {
      setProducts(data.products);
    } else {
      setProducts((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p))
      );
    }
  };

  const handleDeleteProduct = async (productId: string): Promise<void> => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
      headers: buildAdminHeaders(),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        setIsAdminAuthenticated(false);
      }
      throw new Error(data?.error || 'Failed to delete product.');
    }
    if (Array.isArray(data.products)) {
      setProducts(data.products);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  // Inquiry handlers
  const handleSubmitInquiry = (
    payload: Omit<
      CustomerInquiry,
      'id' | 'customerId' | 'createdAt' | 'status'
    > & { email: string }
  ) => {
    const normalizedEmail = payload.email.trim().toLowerCase();
    let ownerProfile = activeProfile;

    if (!ownerProfile) {
      ownerProfile =
        profiles.find((p) => p.email.toLowerCase() === normalizedEmail) || null;
    }

    if (!ownerProfile) {
      ownerProfile = {
        customerId: createUniqueId(profiles),
        createdAt: new Date().toISOString(),
        name: payload.customerName,
        email: normalizedEmail,
        phone: '',
        shippingAddress: '',
        cityCountry: '',
      };
      setProfiles((prev) => [ownerProfile!, ...prev]);
      setActiveCustomerId(ownerProfile.customerId);
    }

    const created: CustomerInquiry = {
      id: `INQ-${Math.floor(1000 + Math.random() * 8999)}`,
      customerId: ownerProfile.customerId,
      createdAt: new Date().toISOString(),
      customerName: payload.customerName,
      contact: payload.contact,
      occasion: payload.occasion,
      preferredColors: payload.preferredColors,
      message: payload.message,
      status: 'New',
    };
    setInquiries((prev) => [created, ...prev]);
  };

  const handleReplyInquiry = (inquiryId: string, replyText: string) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId
          ? {
              ...inq,
              status: 'Replied',
              adminReply: replyText,
              repliedAt: new Date().toISOString(),
            }
          : inq
      )
    );
  };

  const handleArchiveInquiry = (inquiryId: string) => {
    setInquiries((prev) =>
      prev.map((inq) =>
        inq.id === inquiryId ? { ...inq, status: 'Archived' } : inq
      )
    );
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A1817]">
      <SeoManager
        activeCategory={activeCategory}
        selectedProduct={selectedProduct}
        products={products}
        currency={currency}
        isAdminRoute={isAdminRoute}
      />
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        currency={currency}
        onCurrencyChange={setCurrency}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        activeProfile={activeProfile}
        isAdminView={isAdminRoute && isAdminAuthenticated}
        onExitAdmin={exitAdminView}
      />

      {isAdminRoute ? (
        isAdminAuthenticated ? (
          <AdminDashboard
            products={products}
            orders={orders}
            inquiries={inquiries}
            newsletterEmails={newsletterEmails}
            currency={currency}
            adminToken={adminToken}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onReplyInquiry={handleReplyInquiry}
            onArchiveInquiry={handleArchiveInquiry}
            onBackToStorefront={exitAdminView}
            onAdminSignOut={handleAdminSignOut}
          />
        ) : (
          <AdminAuthGate
            onAuthenticated={handleAdminAuthenticated}
            onBackToStorefront={exitAdminView}
          />
        )
      ) : (
        <>
          <main className="flex-1">
            <HeroSection
              onExploreClick={() =>
                document
                  .getElementById('collection-catalog')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              onBookBespokeClick={() => setInquiryOpen(true)}
            />

            <CatalogSection
              products={products}
              activeCategory={activeCategory}
              activeSubCategory={activeSubCategory}
              onCategoryChange={handleSelectCategory}
              currency={currency}
              onSelectProduct={handleOpenProduct}
            />
          </main>

          <HeritageFooter
            onSelectCategory={(cat) => handleSelectCategory(cat)}
            onOpenInquiry={() => setInquiryOpen(true)}
            newsletterEmails={newsletterEmails}
            onSubscribeNewsletter={handleSubscribeNewsletter}
          />

          <ProductDetailModal
            product={selectedProduct}
            allProducts={products}
            currency={currency}
            onClose={handleCloseProduct}
            onAddToCart={handleAddToCart}
            onOpenCart={() => setCartOpen(true)}
          />

          <CartDrawer
            isOpen={cartOpen}
            onClose={() => setCartOpen(false)}
            cart={cart}
            currency={currency}
            onCurrencyChange={setCurrency}
            onUpdateQuantity={handleUpdateCartQuantity}
            onRemoveItem={handleRemoveCartItem}
            activeProfile={activeProfile}
            onPlaceOrder={handlePlaceOrder}
          />

          <InquiryDrawer
            isOpen={inquiryOpen}
            onOpen={() => setInquiryOpen(true)}
            onClose={() => setInquiryOpen(false)}
            activeProfile={activeProfile}
            inquiries={inquiries}
            onSubmitInquiry={handleSubmitInquiry}
          />

          <CustomerProfileModal
            isOpen={profileOpen}
            onClose={() => setProfileOpen(false)}
            activeProfile={activeProfile}
            onCreateOrUpdateProfile={handleCreateOrUpdateProfile}
            onSignInLookup={handleSignInLookup}
            onSignOut={handleSignOut}
            orders={orders}
            currency={currency}
          />
        </>
      )}
    </div>
  );
}
