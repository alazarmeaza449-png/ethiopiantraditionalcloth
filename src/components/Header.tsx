import React, { useState } from 'react';
import { Menu, ShoppingBag, Shield, X, ChevronDown, User } from 'lucide-react';
import { Category, Currency, CustomerProfile } from '../types';

interface HeaderProps {
  activeCategory: Category | 'All';
  onSelectCategory: (cat: Category | 'All', subCategory?: string) => void;
  currency: Currency;
  onCurrencyChange: (currency: Currency) => void;
  cartCount: number;
  onOpenCart: () => void;
  onOpenProfile: () => void;
  activeProfile: CustomerProfile | null;
  isAdminView: boolean;
  onExitAdmin: () => void;
}

const MEGA_MENU_DATA: Record<
  Category,
  { tagline: string; items: { label: string; subCategory: string }[] }
> = {
  Women: {
    tagline: 'Hand-spun Menen gowns & ceremonial shawls',
    items: [
      { label: 'Habesha Kemis', subCategory: 'Habesha Kemis' },
      { label: 'Zuria Royal Gowns', subCategory: 'Zuria' },
      { label: 'Netela & Gabi Shawls', subCategory: 'Netela & Gabi Shawls' },
    ],
  },
  Men: {
    tagline: 'Tailored cotton tunics & imperial Kaba capes',
    items: [
      { label: 'Ejetabab Tunics', subCategory: 'Ejetabab Tunics' },
      { label: 'Embroidered Suits', subCategory: 'Embroidered Suits' },
      { label: 'Formal Kaba Capes', subCategory: 'Formal Kaba Capes' },
    ],
  },
  'Couples & Weddings': {
    tagline: 'Harmonized loom-matched Mels & bridal ensembles',
    items: [
      { label: 'Mels Matching Sets', subCategory: 'Mels Matching Sets' },
      { label: 'Ceremonial Sets', subCategory: 'Ceremonial Sets' },
    ],
  },
  Kids: {
    tagline: 'Heirloom organic cotton attire for celebrations',
    items: [{ label: 'Festive Kemis & Tunics', subCategory: 'Festive Kemis & Tunics' }],
  },
  Accessories: {
    tagline: 'Hand-forged filigree Meskel crosses & brass cuffs',
    items: [{ label: 'Traditional Jewelry', subCategory: 'Traditional Jewelry' }],
  },
};

const NAV_CATEGORIES: { label: string; category: Category }[] = [
  { label: 'Women', category: 'Women' },
  { label: 'Men', category: 'Men' },
  { label: 'Weddings', category: 'Couples & Weddings' },
  { label: 'Kids', category: 'Kids' },
  { label: 'Accessories', category: 'Accessories' },
];

export const Header: React.FC<HeaderProps> = ({
  activeCategory,
  onSelectCategory,
  currency,
  onCurrencyChange,
  cartCount,
  onOpenCart,
  onOpenProfile,
  activeProfile,
  isAdminView,
  onExitAdmin,
}) => {
  const [hoveredCat, setHoveredCat] = useState<Category | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleNavClick = (cat: Category | 'All', sub?: string) => {
    onSelectCategory(cat, sub);
    setHoveredCat(null);
    setMobileOpen(false);
    const el = document.getElementById('collection-catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className="sticky top-0 z-40 w-full bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#E6E0D4]"
      onMouseLeave={() => setHoveredCat(null)}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            if (isAdminView) onExitAdmin();
            onSelectCategory('All');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="font-serif text-lg sm:text-xl font-semibold tracking-tight text-[#1A1817] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B27] rounded-sm"
        >
          Ethiopian Traditional Cloth
        </a>

        {/* Zone 2: Single-line Category Navigation with Mega-Menu */}
        {!isAdminView ? (
          <nav
            aria-label="Primary collections"
            className="hidden md:flex items-center gap-6 lg:gap-7 text-sm font-medium text-[#4A453F]"
          >
            {NAV_CATEGORIES.map(({ label, category }) => {
              const isActive = activeCategory === category;
              return (
                <div
                  key={category}
                  className="relative"
                  onMouseEnter={() => setHoveredCat(category)}
                >
                  <button
                    type="button"
                    onClick={() => handleNavClick(category)}
                    className={`inline-flex items-center gap-1 py-2 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      isActive
                        ? 'border-[#C59B27] text-[#1A1817]'
                        : 'border-transparent hover:text-[#1A1817] hover:border-[#C59B27]/50'
                    }`}
                  >
                    <span>{label}</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-50" />
                  </button>
                </div>
              );
            })}
          </nav>
        ) : (
          <div className="hidden md:flex items-center text-sm text-[#6B655E] whitespace-nowrap shrink-0">
            Atelier Management Console · Addis Ababa
          </div>
        )}

        {/* Zone 3: Currency Switcher, Admin View, & Shopping Bag */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Currency Switcher */}
          <div
            className="hidden sm:inline-flex items-center bg-[#F3EFE8] border border-[#E6E0D4] rounded-md p-0.5"
            role="group"
            aria-label="Currency selector"
          >
            <button
              type="button"
              onClick={() => onCurrencyChange('ETB')}
              className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currency === 'ETB'
                  ? 'bg-[#1A1817] text-[#FAF8F5]'
                  : 'text-[#6B655E] hover:text-[#1A1817]'
              }`}
            >
              ETB
            </button>
            <button
              type="button"
              onClick={() => onCurrencyChange('USD')}
              className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currency === 'USD'
                  ? 'bg-[#1A1817] text-[#FAF8F5]'
                  : 'text-[#6B655E] hover:text-[#1A1817]'
              }`}
            >
              USD
            </button>
          </div>

          {/* Customer Account & Orders Button */}
          {!isAdminView && (
            <button
              type="button"
              onClick={onOpenProfile}
              aria-label="Open my account and order tracking"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-white text-[#1A1817] border-[#E6E0D4] hover:border-[#C59B27] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-[#C59B27]" />
              <span className="hidden sm:inline">
                {activeProfile
                  ? `${activeProfile.name.split(' ')[0]} · Orders`
                  : 'My Account'}
              </span>
            </button>
          )}

          {/* Only show Exit Admin button when owner is already inside Admin Console */}
          {isAdminView && (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border bg-[#1A1817] text-[#FAF8F5] border-[#1A1817] hover:bg-[#2F2B29] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Storefront</span>
            </button>
          )}

          {/* Shopping Bag */}
          {!isAdminView && (
            <button
              type="button"
              onClick={onOpenCart}
              aria-label="Open shopping bag"
              className="relative inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-[#1A1817] text-[#FAF8F5] hover:bg-[#2F2B29] rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#C59B27]" />
              <span className="hidden sm:inline">Bag</span>
              <span className="font-mono tabular-nums text-[#C59B27] font-semibold">
                ({cartCount})
              </span>
            </button>
          )}

          {/* Mobile Menu Toggle */}
          {!isAdminView && (
            <button
              type="button"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 text-[#1A1817] hover:bg-[#F3EFE8] rounded-md transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Desktop Mega-Menu Dropdown */}
      {!isAdminView && hoveredCat && (
        <div className="hidden md:block absolute left-0 right-0 bg-[#FAF8F5]/98 backdrop-blur-lg border-b border-[#E6E0D4] shadow-lg">
          <div className="max-w-7xl mx-auto px-8 py-6 grid grid-cols-12 gap-8 items-center">
            <div className="col-span-4 border-r border-[#E6E0D4] pr-6">
              <p className="font-serif text-2xl font-semibold text-[#1A1817]">
                {hoveredCat}
              </p>
              <p className="text-sm text-[#6B655E] mt-1">
                {MEGA_MENU_DATA[hoveredCat].tagline}
              </p>
              <button
                type="button"
                onClick={() => handleNavClick(hoveredCat)}
                className="mt-4 text-xs font-semibold text-[#A67F1A] hover:text-[#1A1817] underline underline-offset-4 cursor-pointer"
              >
                View All {hoveredCat} Pieces →
              </button>
            </div>
            <div className="col-span-8 flex flex-wrap gap-6">
              {MEGA_MENU_DATA[hoveredCat].items.map((item) => (
                <button
                  key={item.subCategory}
                  type="button"
                  onClick={() => handleNavClick(hoveredCat, item.subCategory)}
                  className="group text-left px-4 py-3 rounded-md border border-[#E6E0D4] bg-white hover:border-[#C59B27] transition-colors min-w-[200px] cursor-pointer"
                >
                  <div className="text-sm font-semibold text-[#1A1817] group-hover:text-[#A67F1A] transition-colors">
                    {item.label}
                  </div>
                  <div className="text-xs text-[#6B655E] mt-0.5">
                    Hand-woven · Custom sizing available
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {!isAdminView && mobileOpen && (
        <div className="md:hidden bg-[#FAF8F5] border-b border-[#E6E0D4] px-4 py-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E6E0D4]">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenProfile();
              }}
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#1A1817]"
            >
              <User className="w-4 h-4 text-[#C59B27]" />
              <span className="inline-flex items-center gap-2">
                {activeProfile
                  ? `${activeProfile.name.split(' ')[0]} · My Orders`
                  : 'My Account / Track Order'}
              </span>
            </button>
            <div className="inline-flex items-center bg-[#F3EFE8] border border-[#E6E0D4] rounded-md p-0.5">
              <button
                type="button"
                onClick={() => onCurrencyChange('ETB')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  currency === 'ETB' ? 'bg-[#1A1817] text-white' : 'text-[#6B655E]'
                }`}
              >
                ETB
              </button>
              <button
                type="button"
                onClick={() => onCurrencyChange('USD')}
                className={`px-2.5 py-1 text-xs font-mono rounded ${
                  currency === 'USD' ? 'bg-[#1A1817] text-white' : 'text-[#6B655E]'
                }`}
              >
                USD
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {NAV_CATEGORIES.map(({ label, category }) => (
              <div key={category} className="space-y-1">
                <button
                  type="button"
                  onClick={() => handleNavClick(category)}
                  className="w-full text-left py-2 text-base font-serif font-semibold text-[#1A1817]"
                >
                  {label}
                </button>
                <div className="pl-3 flex flex-wrap gap-2 pb-1">
                  {MEGA_MENU_DATA[category].items.map((sub) => (
                    <button
                      key={sub.subCategory}
                      type="button"
                      onClick={() => handleNavClick(category, sub.subCategory)}
                      className="text-xs text-[#6B655E] hover:text-[#1A1817] py-1 px-2.5 bg-[#F3EFE8] rounded"
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};
