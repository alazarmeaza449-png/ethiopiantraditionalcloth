import React, { useMemo, useState } from 'react';
import {
  X,
  User,
  Package,
  Search,
  Check,
  Pencil,
  Ruler,
  MapPin,
  LogOut,
  UserPlus,
  KeyRound,
  Copy,
} from 'lucide-react';
import {
  Currency,
  CustomerProfile,
  Order,
  OrderStatus,
} from '../types';
import { formatMoney } from '../data/initialData';
import { LuxuryImage } from './TibebMotif';
import { validateEmail } from '../utils/validation';

interface CustomerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: CustomerProfile | null;
  onCreateOrUpdateProfile: (
    data: Omit<CustomerProfile, 'customerId' | 'createdAt'>,
    existingCustomerId?: string
  ) => CustomerProfile;
  onSignInLookup: (identifier: string) => { ok: boolean; error?: string };
  onSignOut: () => void;
  orders: Order[];
  currency: Currency;
}

const FULFILLMENT_STAGES: OrderStatus[] = [
  'Pending',
  'Hand-Weaving / Tailoring',
  'Quality Check',
  'Shipped',
  'Delivered',
];

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  isOpen,
  onClose,
  activeProfile,
  onCreateOrUpdateProfile,
  onSignInLookup,
  onSignOut,
  orders,
  currency,
}) => {
  const [authTab, setAuthTab] = useState<'create' | 'lookup'>('create');
  const [lookupInput, setLookupInput] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Registration / Edit form fields (empty by default, zero mockups)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [cityCountry, setCityCountry] = useState('');
  const [formEmailError, setFormEmailError] = useState<string | null>(null);
  const [formGeneralError, setFormGeneralError] = useState<string | null>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Order history search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'delivered'>(
    'all'
  );

  // Strictly isolate orders to ONLY the active customer's unique customerId
  const myOrders = useMemo(() => {
    if (!activeProfile) return [];
    return orders.filter(
      (order) => order.customerId === activeProfile.customerId
    );
  }, [orders, activeProfile]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return myOrders.filter((order) => {
      if (statusTab === 'active' && order.status === 'Delivered') {
        return false;
      }
      if (statusTab === 'delivered' && order.status !== 'Delivered') {
        return false;
      }
      if (!q) return true;
      return (
        order.id.toLowerCase().includes(q) ||
        order.items.some((item) => item.name.toLowerCase().includes(q))
      );
    });
  }, [myOrders, searchQuery, statusTab]);

  const stats = useMemo(() => {
    const activeCount = myOrders.filter((o) => o.status !== 'Delivered').length;
    const deliveredCount = myOrders.filter(
      (o) => o.status === 'Delivered'
    ).length;
    return {
      total: myOrders.length,
      active: activeCount,
      delivered: deliveredCount,
    };
  }, [myOrders]);

  if (!isOpen) return null;

  const startEditing = () => {
    if (!activeProfile) return;
    setName(activeProfile.name);
    setEmail(activeProfile.email);
    setPhone(activeProfile.phone);
    setShippingAddress(activeProfile.shippingAddress);
    setCityCountry(activeProfile.cityCountry);
    setFormEmailError(null);
    setFormGeneralError(null);
    setIsEditingProfile(true);
  };

  const handleProfileFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFormEmailError(emailErr);
      return;
    }
    setFormEmailError(null);

    if (!name.trim() || !phone.trim() || !shippingAddress.trim() || !cityCountry.trim()) {
      setFormGeneralError('Please complete all required profile fields.');
      return;
    }
    setFormGeneralError(null);

    onCreateOrUpdateProfile(
      {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        shippingAddress: shippingAddress.trim(),
        cityCountry: cityCountry.trim(),
      },
      isEditingProfile && activeProfile ? activeProfile.customerId : undefined
    );

    setIsEditingProfile(false);
    setName('');
    setEmail('');
    setPhone('');
    setShippingAddress('');
    setCityCountry('');
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupInput.trim()) {
      setLookupError('Enter your Customer ID (e.g. ETC-...) or registered email.');
      return;
    }
    const res = onSignInLookup(lookupInput.trim());
    if (!res.ok) {
      setLookupError(
        res.error || 'No profile found matching that Customer ID or email.'
      );
      return;
    }
    setLookupError(null);
    setLookupInput('');
  };

  const handleCopyId = () => {
    if (!activeProfile) return;
    navigator.clipboard?.writeText(activeProfile.customerId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1817]/70 backdrop-blur-sm p-0 sm:p-4 lg:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Customer Profile and Order History"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-[#FAF8F5] sm:rounded-lg border border-[#E6E0D4] shadow-2xl overflow-hidden max-h-full sm:max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Bar */}
        <div className="px-6 py-4 bg-white border-b border-[#E6E0D4] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#F3EFE8] border border-[#E6E0D4] flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-[#C59B27]" />
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#1A1817]">
                My Account &amp; Order Tracking
              </h2>
              <p className="text-xs text-[#6B655E]">
                {activeProfile
                  ? `Signed in · Customer ID: ${activeProfile.customerId}`
                  : 'Create an account or enter your email / Customer ID to check your orders'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close my account"
            className="p-2 text-[#6B655E] hover:text-[#1A1817] hover:bg-[#F3EFE8] rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!activeProfile ? (
            /* NO ACTIVE PROFILE: NEW OR RETURNING CUSTOMER */
            <div className="max-w-xl mx-auto bg-white border border-[#E6E0D4] rounded-lg p-6 space-y-5">
              <div className="flex border-b border-[#E6E0D4]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('create');
                    setLookupError(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'create'
                      ? 'border-[#C59B27] text-[#1A1817]'
                      : 'border-transparent text-[#6B655E] hover:text-[#1A1817]'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>New Customer</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('lookup');
                    setFormEmailError(null);
                    setFormGeneralError(null);
                  }}
                  className={`flex-1 pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    authTab === 'lookup'
                      ? 'border-[#C59B27] text-[#1A1817]'
                      : 'border-transparent text-[#6B655E] hover:text-[#1A1817]'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Returning Customer</span>
                </button>
              </div>

              {authTab === 'create' ? (
                <form
                  noValidate
                  onSubmit={handleProfileFormSubmit}
                  className="space-y-3.5 text-xs"
                >
                  <p className="text-[#6B655E]">
                    Register your details to receive a unique Customer ID. Your ID ensures only you can access your order history, custom measurements, and status updates.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (formEmailError) setFormEmailError(null);
                        }}
                        placeholder="you@example.com"
                        className={`w-full px-3 py-2 bg-[#FAF8F5] border rounded focus:outline-none ${
                          formEmailError
                            ? 'border-[#A64B2A]'
                            : 'border-[#E6E0D4] focus:border-[#C59B27]'
                        }`}
                      />
                      {formEmailError && (
                        <p className="mt-1 text-[11px] text-[#A64B2A]">
                          {formEmailError}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                        Phone / WhatsApp
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+251 / +1..."
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
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
                        placeholder="City, Country"
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Delivery address"
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>

                  {formGeneralError && (
                    <p className="text-[11px] text-[#A64B2A]">
                      {formGeneralError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1A1817] hover:bg-[#2F2B29] text-white font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Create My Account
                  </button>
                </form>
              ) : (
                <form
                  noValidate
                  onSubmit={handleLookupSubmit}
                  className="space-y-4 text-xs"
                >
                  <p className="text-[#6B655E]">
                    Already placed an order or created an account? Enter your email address or Customer ID (e.g. <span className="font-mono text-[#1A1817]">ETC-XXXX</span>).
                  </p>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                      Email Address or Customer ID
                    </label>
                    <input
                      type="text"
                      value={lookupInput}
                      onChange={(e) => {
                        setLookupInput(e.target.value);
                        if (lookupError) setLookupError(null);
                      }}
                      placeholder="you@example.com or ETC-..."
                      className="w-full px-3 py-2.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                    />
                    {lookupError && (
                      <p className="mt-1.5 text-[11px] text-[#A64B2A]">
                        {lookupError}
                      </p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#1A1817] hover:bg-[#2F2B29] text-white font-semibold rounded-md transition-colors cursor-pointer"
                  >
                    Find My Orders
                  </button>
                </form>
              )}
            </div>
          ) : (
            /* AUTHENTICATED / ACTIVE PROFILE VIEW — ISOLATED TO ONLY THIS CUSTOMER'S ID */
            <>
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Profile Info Card */}
                <div className="lg:col-span-7 bg-white border border-[#E6E0D4] rounded-lg p-5">
                  {isEditingProfile ? (
                    <form
                      noValidate
                      onSubmit={handleProfileFormSubmit}
                      className="space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-[#F0EAE0]">
                        <span className="font-semibold text-[#1A1817]">
                          Edit Profile ({activeProfile.customerId})
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingProfile(false)}
                          className="text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] text-[#4A453F] mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#4A453F] mb-1">
                            Email Address
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (formEmailError) setFormEmailError(null);
                            }}
                            className={`w-full px-3 py-1.5 bg-[#FAF8F5] border rounded focus:outline-none ${
                              formEmailError
                                ? 'border-[#A64B2A]'
                                : 'border-[#E6E0D4] focus:border-[#C59B27]'
                            }`}
                          />
                          {formEmailError && (
                            <p className="mt-1 text-[11px] text-[#A64B2A]">
                              {formEmailError}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#4A453F] mb-1">
                            Phone / WhatsApp
                          </label>
                          <input
                            type="text"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] text-[#4A453F] mb-1">
                            City &amp; Country
                          </label>
                          <input
                            type="text"
                            value={cityCountry}
                            onChange={(e) => setCityCountry(e.target.value)}
                            className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] text-[#4A453F] mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="w-full px-3 py-1.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                        />
                      </div>

                      {formGeneralError && (
                        <p className="text-[11px] text-[#A64B2A]">
                          {formGeneralError}
                        </p>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="px-4 py-1.5 bg-[#1A1817] text-white font-semibold rounded hover:bg-[#2F2B29] cursor-pointer"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-[11px] font-mono text-[#A67F1A] font-semibold">
                          <span>Customer ID: {activeProfile.customerId}</span>
                          <button
                            type="button"
                            onClick={handleCopyId}
                            title="Copy Customer ID"
                            className="text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
                          >
                            {copiedId ? (
                              <Check className="w-3.5 h-3.5 text-[#164A3B]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-[#1A1817]">
                          {activeProfile.name}
                        </h3>
                        <div className="text-xs text-[#4A453F]">
                          {activeProfile.email} · {activeProfile.phone}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#6B655E] pt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#C59B27] shrink-0" />
                          <span>
                            {activeProfile.shippingAddress},{' '}
                            {activeProfile.cityCountry}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={startEditing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E6E0D4] rounded hover:border-[#C59B27] text-[#1A1817] cursor-pointer"
                        >
                          <Pencil className="w-3 h-3 text-[#C59B27]" />
                          <span>Edit Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={onSignOut}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E6E0D4] rounded hover:border-[#A64B2A] text-[#6B655E] hover:text-[#A64B2A] cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3 Summary Stats */}
                <div className="lg:col-span-5 grid grid-cols-3 gap-3">
                  <div className="bg-white border border-[#E6E0D4] rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-[11px] text-[#6B655E]">My Orders</span>
                    <span className="font-serif text-2xl font-semibold text-[#1A1817] tabular-nums mt-2">
                      {stats.total}
                    </span>
                  </div>
                  <div className="bg-white border border-[#E6E0D4] rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-[11px] text-[#6B655E]">
                      In Progress
                    </span>
                    <span className="font-serif text-2xl font-semibold text-[#A67F1A] tabular-nums mt-2">
                      {stats.active}
                    </span>
                  </div>
                  <div className="bg-white border border-[#E6E0D4] rounded-lg p-4 flex flex-col justify-between">
                    <span className="text-[11px] text-[#6B655E]">Delivered</span>
                    <span className="font-serif text-2xl font-semibold text-[#164A3B] tabular-nums mt-2">
                      {stats.delivered}
                    </span>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#E6E0D4]">
                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: 'all', label: 'My Orders' },
                      { id: 'active', label: 'In Progress' },
                      { id: 'delivered', label: 'Delivered' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setStatusTab(tab.id)}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        statusTab === tab.id
                          ? 'bg-[#1A1817] text-[#FAF8F5]'
                          : 'bg-white border border-[#E6E0D4] text-[#4A453F] hover:border-[#C59B27]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#6B655E] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search my order ID or garment..."
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#E6E0D4] rounded-md focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              {/* Strictly Filtered Order History Cards */}
              {filteredOrders.length === 0 ? (
                <div className="bg-white border border-[#E6E0D4] rounded-lg p-12 text-center space-y-2">
                  <Package
                    className="w-8 h-8 text-[#C59B27] mx-auto"
                    strokeWidth={1.5}
                  />
                  <h3 className="font-serif text-xl font-semibold text-[#1A1817]">
                    {myOrders.length === 0
                      ? 'No Orders Placed Yet'
                      : 'No Matching Orders'}
                  </h3>
                  <p className="text-xs text-[#6B655E]">
                    {myOrders.length === 0
                      ? `Orders placed under Customer ID ${activeProfile.customerId} will appear here with live tailoring status.`
                      : 'Try clearing your search or status filter.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((order) => {
                    const currentStageIdx = FULFILLMENT_STAGES.indexOf(
                      order.status
                    );
                    const formattedDate = new Date(
                      order.createdAt
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    return (
                      <div
                        key={order.id}
                        className="bg-white border border-[#E6E0D4] rounded-lg p-5 space-y-5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0EAE0]">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="font-mono font-semibold text-[#1A1817]">
                                {order.id}
                              </span>
                              <span aria-hidden="true" className="text-[#BDB5AA]">
                                ·
                              </span>
                              <span className="text-[#6B655E]">
                                {formattedDate}
                              </span>
                              <span aria-hidden="true" className="text-[#BDB5AA]">
                                ·
                              </span>
                              <span className="font-mono text-[11px] text-[#6B655E]">
                                {order.customerId}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#6B655E] mt-1">
                              {order.deliveryMethod === 'addis_express'
                                ? 'Addis Ababa Express Delivery'
                                : 'International DHL Express'}{' '}
                              · {order.cityCountry}
                            </div>
                          </div>

                          <div className="sm:text-right">
                            <div className="text-sm font-semibold text-[#1A1817] tabular-nums">
                              {formatMoney(
                                order.totalETB,
                                order.totalUSD,
                                currency
                              )}
                            </div>
                            <div
                              className={`text-xs font-semibold mt-0.5 ${
                                order.status === 'Delivered'
                                  ? 'text-[#164A3B]'
                                  : order.status === 'Pending'
                                  ? 'text-[#A64B2A]'
                                  : 'text-[#A67F1A]'
                              }`}
                            >
                              Status: {order.status}
                            </div>
                          </div>
                        </div>

                        {/* 5-Stage Fulfillment Stepper */}
                        <div className="grid grid-cols-5 gap-1.5">
                          {FULFILLMENT_STAGES.map((stage, idx) => {
                            const completed = idx <= currentStageIdx;
                            const isCurrent = idx === currentStageIdx;
                            return (
                              <div key={stage} className="space-y-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-colors ${
                                    completed
                                      ? order.status === 'Delivered'
                                        ? 'bg-[#164A3B]'
                                        : 'bg-[#C59B27]'
                                      : 'bg-[#F3EFE8]'
                                  }`}
                                />
                                <div
                                  className={`text-[10px] sm:text-[11px] leading-tight flex items-center gap-1 ${
                                    isCurrent
                                      ? 'font-semibold text-[#1A1817]'
                                      : completed
                                      ? 'text-[#4A453F]'
                                      : 'text-[#9B948B]'
                                  }`}
                                >
                                  {completed && (
                                    <Check className="w-3 h-3 text-[#164A3B] shrink-0 hidden sm:inline" />
                                  )}
                                  <span className="truncate">{stage}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Itemized Pieces */}
                        <div className="divide-y divide-[#F0EAE0] border-t border-[#F0EAE0]">
                          {order.items.map((item) => (
                            <div
                              key={item.cartItemId}
                              className="pt-3 mt-3 first:mt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-12 h-14 rounded overflow-hidden bg-[#F3EFE8] shrink-0">
                                  <LuxuryImage
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-serif text-base font-semibold text-[#1A1817] truncate">
                                    {item.quantity}× {item.name}
                                  </div>
                                  <div className="text-[11px] text-[#6B655E]">
                                    {item.selectedFabric} ·{' '}
                                    {item.selectedTibebColor}
                                  </div>
                                  {item.sizingMode === 'custom' &&
                                  item.customMeasurements ? (
                                    <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono text-[#164A3B]">
                                      <Ruler className="w-3 h-3 shrink-0" />
                                      <span>
                                        Custom:{' '}
                                        {item.customMeasurements.heightCm}cm H ·{' '}
                                        {item.customMeasurements.bustChestCm}cm B ·{' '}
                                        {item.customMeasurements.waistCm}cm W ·{' '}
                                        {item.customMeasurements.hipCm}cm Hip
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="mt-1 text-[11px] text-[#4A453F]">
                                      Standard Size: {item.standardSize}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-xs font-mono tabular-nums font-medium text-[#1A1817] shrink-0">
                                {formatMoney(
                                  item.priceETB * item.quantity,
                                  item.priceUSD * item.quantity,
                                  currency
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
