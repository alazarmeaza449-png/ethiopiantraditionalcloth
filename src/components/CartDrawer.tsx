import React, { useState } from 'react';
import {
  X,
  Trash2,
  Plus,
  Minus,
  Tag,
  Truck,
  CheckCircle2,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import {
  CartItem,
  Currency,
  CustomerProfile,
  DeliveryMethod,
  Order,
} from '../types';
import { formatMoney } from '../data/initialData';
import { LuxuryImage } from './TibebMotif';
import { validateEmail } from '../utils/validation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  activeProfile: CustomerProfile | null;
  onPlaceOrder: (order: Omit<Order, 'id' | 'customerId' | 'createdAt' | 'status'>) => Order;
}

const PROMO_CODES: Record<string, { type: 'percent' | 'fixedUSD'; value: number; label: string }> = {
  SHEMMA10: { type: 'percent', value: 0.1, label: '10% Heritage Welcome' },
  ADDIS500: { type: 'fixedUSD', value: 15, label: '$15 / 900 ETB Off' },
};

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  currency,
  onCurrencyChange,
  onUpdateQuantity,
  onRemoveItem,
  activeProfile,
  onPlaceOrder,
}) => {
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState('');
  const [deliveryMethod, setDeliveryMethod] =
    useState<DeliveryMethod>('addis_express');
  const [step, setStep] = useState<'cart' | 'checkout' | 'confirmed'>('cart');
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  // Checkout customer fields
  const [customerName, setCustomerName] = useState(activeProfile?.name || '');
  const [customerEmail, setCustomerEmail] = useState(activeProfile?.email || '');
  const [customerPhone, setCustomerPhone] = useState(activeProfile?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(
    activeProfile?.shippingAddress || ''
  );
  const [cityCountry, setCityCountry] = useState(
    activeProfile?.cityCountry || ''
  );
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  if (!isOpen) return null;

  const subtotalETB = cart.reduce(
    (sum, item) => sum + item.priceETB * item.quantity,
    0
  );
  const subtotalUSD = cart.reduce(
    (sum, item) => sum + item.priceUSD * item.quantity,
    0
  );

  let discountETB = 0;
  let discountUSD = 0;
  if (appliedPromo && PROMO_CODES[appliedPromo]) {
    const rule = PROMO_CODES[appliedPromo];
    if (rule.type === 'percent') {
      discountETB = Math.round(subtotalETB * rule.value);
      discountUSD = Number((subtotalUSD * rule.value).toFixed(2));
    } else {
      discountUSD = Math.min(subtotalUSD, rule.value);
      discountETB = Math.min(subtotalETB, rule.value * 60);
    }
  }

  const shippingETB = deliveryMethod === 'dhl_international' ? 2700 : 0;
  const shippingUSD = deliveryMethod === 'dhl_international' ? 45 : 0;

  const totalETB = Math.max(0, subtotalETB - discountETB + shippingETB);
  const totalUSD = Math.max(
    0,
    Number((subtotalUSD - discountUSD + shippingUSD).toFixed(2))
  );

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (PROMO_CODES[code]) {
      setAppliedPromo(code);
      setPromoError('');
    } else {
      setPromoError('Invalid code. Try SHEMMA10 or ADDIS500.');
    }
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailValidation = validateEmail(customerEmail);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    setEmailError(null);

    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !shippingAddress.trim() ||
      !cityCountry.trim()
    ) {
      setFormError('Please fill in all recipient & delivery details.');
      return;
    }

    const order = onPlaceOrder({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
      shippingAddress: shippingAddress.trim(),
      cityCountry: cityCountry.trim(),
      deliveryMethod,
      promoCode: appliedPromo || undefined,
      discountETB,
      discountUSD,
      shippingETB,
      shippingUSD,
      totalETB,
      totalUSD,
      currencyUsed: currency,
      items: cart,
    });

    setConfirmedOrder(order);
    setStep('confirmed');
    setFormError('');
  };

  const handleResetAndClose = () => {
    setStep('cart');
    setConfirmedOrder(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-[#1A1817]/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label="Shopping Bag"
      onClick={handleResetAndClose}
    >
      <div
        className="w-full max-w-lg bg-[#FAF8F5] h-full flex flex-col border-l border-[#E6E0D4] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 bg-white border-b border-[#E6E0D4] flex items-center justify-between gap-4 shrink-0">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1A1817]">
              {step === 'cart'
                ? 'Your Shopping Bag'
                : step === 'checkout'
                ? 'Delivery Details'
                : 'Order Confirmed'}
            </h2>
            <p className="text-xs text-[#6B655E]">
              {step === 'confirmed'
                ? 'Your order has been received by Ethiopian Traditional Cloth'
                : step === 'checkout'
                ? 'Step 2 of 2 · Enter where we should deliver your outfit'
                : `Step 1 of 2 · ${cart.reduce((s, i) => s + i.quantity, 0)} item(s) ready`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Currency Switcher inside drawer */}
            {step !== 'confirmed' && (
              <div className="inline-flex items-center bg-[#F3EFE8] border border-[#E6E0D4] rounded p-0.5">
                <button
                  type="button"
                  onClick={() => onCurrencyChange('ETB')}
                  className={`px-2 py-1 text-[11px] font-mono rounded cursor-pointer ${
                    currency === 'ETB' ? 'bg-[#1A1817] text-white' : 'text-[#6B655E]'
                  }`}
                >
                  ETB
                </button>
                <button
                  type="button"
                  onClick={() => onCurrencyChange('USD')}
                  className={`px-2 py-1 text-[11px] font-mono rounded cursor-pointer ${
                    currency === 'USD' ? 'bg-[#1A1817] text-white' : 'text-[#6B655E]'
                  }`}
                >
                  USD
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleResetAndClose}
              aria-label="Close bag"
              className="p-2 text-[#6B655E] hover:text-[#1A1817] hover:bg-[#F3EFE8] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {step === 'confirmed' && confirmedOrder ? (
            <div className="space-y-6">
              <div className="bg-white border border-[#164A3B]/30 rounded-lg p-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-[#164A3B] mx-auto mb-3" />
                <p className="text-xs font-mono text-[#164A3B] font-semibold">
                  Order #{confirmedOrder.id}
                </p>
                <h3 className="font-serif text-2xl font-semibold text-[#1A1817] mt-1">
                  Thank You! Order Confirmed
                </h3>
                <p className="text-xs text-[#6B655E] mt-2 leading-relaxed">
                  Our Shiromieda team has received your order for{' '}
                  <span className="font-medium text-[#1A1817]">
                    {confirmedOrder.customerEmail}
                  </span>
                  . Use your Customer ID below anytime in <strong className="text-[#1A1817]">My Account</strong> to track weaving and delivery progress.
                </p>
              </div>

              <div className="bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-3 text-xs">
                <div className="font-semibold text-[#1A1817] pb-2 border-b border-[#F0EAE0]">
                  Order Summary
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B655E]">Your Customer ID</span>
                  <span className="font-mono font-semibold text-[#A67F1A]">
                    {confirmedOrder.customerId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B655E]">Recipient</span>
                  <span className="font-medium text-[#1A1817]">
                    {confirmedOrder.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B655E]">Delivery</span>
                  <span className="font-medium text-[#1A1817]">
                    {confirmedOrder.deliveryMethod === 'addis_express'
                      ? 'Addis Ababa Express (1–2 Days)'
                      : 'International DHL Express (4–6 Days)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6B655E]">Destination</span>
                  <span className="font-medium text-[#1A1817]">
                    {confirmedOrder.cityCountry}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#F0EAE0] text-sm font-semibold text-[#1A1817]">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatMoney(
                      confirmedOrder.totalETB,
                      confirmedOrder.totalUSD,
                      confirmedOrder.currencyUsed
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3 bg-[#1A1817] text-white text-sm font-semibold rounded-md hover:bg-[#2F2B29] transition-colors cursor-pointer"
              >
                Back to Store
              </button>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <ShoppingBag className="w-10 h-10 text-[#C59B27] mx-auto" strokeWidth={1.5} />
              <p className="font-serif text-2xl text-[#1A1817]">
                Your bag is empty
              </p>
              <p className="text-xs text-[#6B655E] max-w-xs mx-auto">
                Tap any outfit in our collection to choose your fabric, border color, and standard or custom size.
              </p>
              <button
                type="button"
                onClick={() => {
                  handleResetAndClose();
                  document
                    .getElementById('collection-catalog')
                    ?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-xs font-semibold rounded-md transition-colors cursor-pointer"
              >
                <span>Browse Collection</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C59B27]" />
              </button>
            </div>
          ) : step === 'cart' ? (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId}
                    className="flex gap-4 p-3.5 bg-white border border-[#E6E0D4] rounded-lg"
                  >
                    <div className="w-20 h-24 rounded overflow-hidden bg-[#F3EFE8] shrink-0">
                      <LuxuryImage
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-serif text-base font-semibold text-[#1A1817] leading-snug truncate">
                            {item.name}
                          </h3>
                          <button
                            type="button"
                            onClick={() => onRemoveItem(item.cartItemId)}
                            aria-label={`Remove ${item.name}`}
                            className="text-[#8E877E] hover:text-[#A64B2A] transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-[11px] text-[#6B655E] mt-0.5">
                          {item.selectedFabric} · {item.selectedTibebColor}
                        </p>

                        {item.sizingMode === 'standard' ? (
                          <p className="text-[11px] text-[#4A453F] mt-1 font-medium">
                            Size: {item.standardSize}
                          </p>
                        ) : (
                          <p className="text-[11px] text-[#164A3B] mt-1 font-mono">
                            Custom Fit: {item.customMeasurements?.heightCm}cm H ·{' '}
                            {item.customMeasurements?.bustChestCm}cm B ·{' '}
                            {item.customMeasurements?.waistCm}cm W
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div className="inline-flex items-center border border-[#E6E0D4] rounded bg-[#FAF8F5]">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, -1)}
                            aria-label="Decrease quantity"
                            className="p-1.5 text-[#4A453F] hover:text-[#1A1817] cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-mono tabular-nums">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(item.cartItemId, 1)}
                            aria-label="Increase quantity"
                            className="p-1.5 text-[#4A453F] hover:text-[#1A1817] cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-sm font-semibold text-[#1A1817] tabular-nums">
                          {formatMoney(
                            item.priceETB * item.quantity,
                            item.priceUSD * item.quantity,
                            currency
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Options */}
              <div className="bg-white border border-[#E6E0D4] rounded-lg p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#1A1817]">
                  <Truck className="w-4 h-4 text-[#C59B27]" />
                  <span>Delivery Method</span>
                </div>

                <label className="flex items-center justify-between p-2.5 rounded border border-[#E6E0D4] cursor-pointer hover:border-[#C59B27]">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'addis_express'}
                      onChange={() => setDeliveryMethod('addis_express')}
                      className="accent-[#1A1817]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#1A1817]">
                        Addis Ababa Express Delivery
                      </div>
                      <div className="text-[11px] text-[#6B655E]">
                        Courier dispatch from Shiromieda across Addis Ababa (1–2 Days)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#164A3B]">
                    Free
                  </span>
                </label>

                <label className="flex items-center justify-between p-2.5 rounded border border-[#E6E0D4] cursor-pointer hover:border-[#C59B27]">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      checked={deliveryMethod === 'dhl_international'}
                      onChange={() => setDeliveryMethod('dhl_international')}
                      className="accent-[#1A1817]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#1A1817]">
                        International DHL Express
                      </div>
                      <div className="text-[11px] text-[#6B655E]">
                        Tracked door-to-door worldwide (USA, UK, EU, UAE)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#1A1817] tabular-nums">
                    {formatMoney(2700, 45, currency)}
                  </span>
                </label>
              </div>

              {/* Promo Code */}
              <div className="bg-white border border-[#E6E0D4] rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A1817]">
                    <Tag className="w-3.5 h-3.5 text-[#C59B27]" />
                    <span>Promo Code</span>
                  </span>
                  <span className="text-[11px] text-[#6B655E]">
                    Try <code className="font-mono text-[#1A1817]">SHEMMA10</code>
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 text-xs font-mono uppercase bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 text-xs font-semibold bg-[#F3EFE8] hover:bg-[#EAE3D7] text-[#1A1817] rounded border border-[#E6E0D4] cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
                {promoError && (
                  <p className="text-[11px] text-[#A64B2A]">{promoError}</p>
                )}
                {appliedPromo && (
                  <p className="text-[11px] text-[#164A3B] font-medium">
                    Applied {appliedPromo} ({PROMO_CODES[appliedPromo].label})
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Checkout Customer Details Form */
            <form id="checkout-form" noValidate onSubmit={handleCheckoutSubmit} className="space-y-4">
              <div className="bg-white border border-[#E6E0D4] rounded-lg p-4 space-y-3">
                <h3 className="text-xs font-semibold text-[#1A1817]">
                  Recipient &amp; Shipping Information
                </h3>
                <div>
                  <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="E.g. Bethlehem Haile"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => {
                        setCustomerEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="name@example.com"
                      aria-invalid={Boolean(emailError)}
                      className={`w-full px-3 py-2 text-xs bg-[#FAF8F5] border rounded focus:outline-none ${
                        emailError
                          ? 'border-[#A64B2A] focus:border-[#A64B2A]'
                          : 'border-[#E6E0D4] focus:border-[#C59B27]'
                      }`}
                    />
                    {emailError && (
                      <p className="mt-1 text-[11px] text-[#A64B2A]">
                        {emailError}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="09XXXXXXXX or +251..."
                      className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                    Street Address / Sub-City
                  </label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Sub-city, Woreda, or street address"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                    City &amp; Country
                  </label>
                  <input
                    type="text"
                    required
                    value={cityCountry}
                    onChange={(e) => setCityCountry(e.target.value)}
                    placeholder="Addis Ababa, Ethiopia or Washington DC, USA"
                    className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                {formError && (
                  <p className="text-xs text-[#A64B2A]">{formError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setStep('cart')}
                className="text-xs font-medium text-[#6B655E] hover:text-[#1A1817] underline cursor-pointer"
              >
                ← Return to Bag
              </button>
            </form>
          )}
        </div>

        {/* Drawer Footer Totals */}
        {cart.length > 0 && step !== 'confirmed' && (
          <div className="p-6 bg-white border-t border-[#E6E0D4] space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-[#6B655E]">
                <span>Subtotal</span>
                <span className="tabular-nums font-medium text-[#1A1817]">
                  {formatMoney(subtotalETB, subtotalUSD, currency)}
                </span>
              </div>
              {discountUSD > 0 && (
                <div className="flex justify-between text-[#164A3B]">
                  <span>Discount ({appliedPromo})</span>
                  <span className="tabular-nums font-medium">
                    -{formatMoney(discountETB, discountUSD, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[#6B655E]">
                <span>
                  {deliveryMethod === 'addis_express'
                    ? 'Addis Express Shipping'
                    : 'DHL International Shipping'}
                </span>
                <span className="tabular-nums font-medium text-[#1A1817]">
                  {shippingUSD === 0
                    ? 'Free'
                    : formatMoney(shippingETB, shippingUSD, currency)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#F0EAE0] text-base font-semibold text-[#1A1817]">
                <span>Total</span>
                <span className="tabular-nums">
                  {formatMoney(totalETB, totalUSD, currency)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeProfile) {
                    setCustomerName(activeProfile.name);
                    setCustomerEmail(activeProfile.email);
                    setCustomerPhone(activeProfile.phone);
                    setShippingAddress(activeProfile.shippingAddress);
                    setCityCountry(activeProfile.cityCountry);
                  } else {
                    setCustomerName('');
                    setCustomerEmail('');
                    setCustomerPhone('');
                    setShippingAddress('');
                    setCityCountry('');
                  }
                  setStep('checkout');
                }}
                className="w-full py-3.5 px-6 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4 text-[#C59B27]" />
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                className="w-full py-3.5 px-6 bg-[#C59B27] hover:bg-[#B0881E] text-[#1A1817] text-sm font-semibold rounded-md transition-colors cursor-pointer"
              >
                Place Order Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
