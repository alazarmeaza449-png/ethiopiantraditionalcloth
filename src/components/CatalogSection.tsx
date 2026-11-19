import React, { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, ArrowUpRight, X } from 'lucide-react';
import { Category, Currency, Product } from '../types';
import { formatMoney } from '../data/initialData';
import { LuxuryImage } from './TibebMotif';

interface CatalogSectionProps {
  products: Product[];
  activeCategory: Category | 'All';
  activeSubCategory: string | null;
  onCategoryChange: (cat: Category | 'All', sub?: string | null) => void;
  currency: Currency;
  onSelectProduct: (product: Product) => void;
}

const CATEGORY_TABS: (Category | 'All')[] = [
  'All',
  'Women',
  'Men',
  'Couples & Weddings',
  'Kids',
  'Accessories',
];

export const CatalogSection: React.FC<CatalogSectionProps> = ({
  products,
  activeCategory,
  activeSubCategory,
  onCategoryChange,
  currency,
  onSelectProduct,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const subCategories = useMemo(() => {
    const relevant =
      activeCategory === 'All'
        ? products
        : products.filter((p) => p.category === activeCategory);
    return Array.from(new Set(relevant.map((p) => p.subCategory)));
  }, [products, activeCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCat =
        activeCategory === 'All' || product.category === activeCategory;
      const matchesSub =
        !activeSubCategory || product.subCategory === activeSubCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        product.name.toLowerCase().includes(q) ||
        product.subCategory.toLowerCase().includes(q) ||
        product.fabricType.toLowerCase().includes(q);
      return matchesCat && matchesSub && matchesSearch;
    });
  }, [products, activeCategory, activeSubCategory, searchQuery]);

  return (
    <section
      id="collection-catalog"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20"
    >
      {/* Simple 3-Step Ordering Guide for First-Time Clients */}
      <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-[#E6E0D4] pb-10">
        <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#A67F1A]">
            01. Pick Your Outfit
          </div>
          <p className="mt-1.5 text-sm font-medium text-[#1A1817]">
            Browse hand-woven Ethiopian styles
          </p>
          <p className="mt-1 text-xs text-[#6B655E]">
            Click any garment below to inspect its woven pattern and pick your size.
          </p>
        </div>

        <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#A67F1A]">
            02. Pick Standard or Custom Size
          </div>
          <p className="mt-1.5 text-sm font-medium text-[#1A1817]">
            Order XS–XXL or enter your cm measurements
          </p>
          <p className="mt-1 text-xs text-[#6B655E]">
            Our Shiromieda tailors stitch to your exact fit or standard ready-to-wear sizes.
          </p>
        </div>

        <div className="bg-white border border-[#E6E0D4] rounded-lg p-5">
          <div className="text-xs font-semibold text-[#A67F1A]">
            03. Fast Delivery &amp; Order Tracking
          </div>
          <p className="mt-1.5 text-sm font-medium text-[#1A1817]">
            Free in Addis Ababa · DHL worldwide
          </p>
          <p className="mt-1 text-xs text-[#6B655E]">
            Track every weaving and shipping update anytime inside My Account.
          </p>
        </div>
      </div>

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#E6E0D4]">
        <div>
          <p className="text-xs font-medium text-[#A67F1A] mb-2">
            Hand-Woven Ethiopian Garments
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1817] tracking-tight">
            Browse Our Collection
          </h2>
        </div>

        {/* Search Input with One-Tap Clear */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#6B655E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Kemis, Zuria, Kaba..."
            aria-label="Search garments"
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-[#E6E0D4] rounded-md text-[#1A1817] placeholder:text-[#8E877E] focus:outline-none focus:border-[#C59B27]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Interactive Category Tabs */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat, null)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#1A1817] text-[#FAF8F5]'
                    : 'bg-[#F3EFE8] text-[#4A453F] hover:text-[#1A1817] hover:bg-[#EAE3D7]'
                }`}
              >
                {cat === 'All' ? 'All Collections' : cat}
              </button>
            );
          })}
        </div>

        {/* Sub-category filter row when applicable */}
        {subCategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 text-[#6B655E] mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Style:</span>
            </span>
            <button
              type="button"
              onClick={() => onCategoryChange(activeCategory, null)}
              className={`px-3 py-1 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                !activeSubCategory
                  ? 'border-[#C59B27] bg-white text-[#1A1817] font-medium'
                  : 'border-transparent text-[#6B655E] hover:text-[#1A1817]'
              }`}
            >
              All Styles
            </button>
            {subCategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => onCategoryChange(activeCategory, sub)}
                className={`px-3 py-1 rounded border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeSubCategory === sub
                    ? 'border-[#C59B27] bg-white text-[#1A1817] font-medium'
                    : 'border-transparent text-[#6B655E] hover:text-[#1A1817]'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="mt-12 py-16 text-center bg-white border border-[#E6E0D4] rounded-lg">
          <p className="font-serif text-2xl text-[#1A1817]">No garments match your filter</p>
          <p className="text-sm text-[#6B655E] mt-2">
            Clear your search or select another category to explore our hand-woven pieces.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              onCategoryChange('All', null);
            }}
            className="mt-5 px-5 py-2.5 text-sm font-medium bg-[#1A1817] text-white rounded-md hover:bg-[#2F2B29] transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7 lg:gap-8">
          {filteredProducts.map((product) => {
            const isOut = product.stockStatus === 'Out of Stock';
            return (
              <article
                key={product.id}
                onClick={() => onSelectProduct(product)}
                className="group cursor-pointer flex flex-col bg-white border border-[#E6E0D4] rounded-lg overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#C59B27]/60"
              >
                {/* Uniform Aspect Ratio Image Frame with Hover Texture Zoom */}
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#F3EFE8]">
                  <LuxuryImage
                    src={product.images[0]}
                    alt={product.name}
                    fallbackTitle={product.name}
                    className="w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  />

                  {/* Subtle glassmorphic quick-inspect CTA on hover */}
                  <div className="hidden sm:block absolute inset-x-4 bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                    <div className="w-full py-2.5 px-4 bg-[#FAF8F5]/95 backdrop-blur-md border border-[#E6E0D4] rounded-md flex items-center justify-between text-xs font-semibold text-[#1A1817]">
                      <span>Choose Size &amp; Add to Bag</span>
                      <ArrowUpRight className="w-4 h-4 text-[#C59B27]" />
                    </div>
                  </div>
                </div>

                {/* Clean Unboxed Card Metadata (Zero-Pill Rule) */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[#6B655E]">
                      <span>{product.subCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span>{product.weavingTime}</span>
                      {isOut && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#A64B2A] font-medium">Out of Stock</span>
                        </>
                      )}
                    </div>

                    <h3 className="mt-1.5 font-serif text-xl font-semibold text-[#1A1817] leading-snug group-hover:text-[#A67F1A] transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F0EAE0] flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-[#1A1817] tabular-nums">
                      {formatMoney(product.priceETB, product.priceUSD, currency)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#A67F1A] group-hover:text-[#1A1817] transition-colors">
                      <span>{isOut ? 'View Details' : 'Select & Order'}</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};
