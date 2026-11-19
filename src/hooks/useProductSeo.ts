import { useEffect } from 'react';
import { formatMoney, STUDIO_IMAGES } from '../data/initialData';
import { Category, Currency, Product } from '../types';

export interface UseProductSeoOptions {
  selectedProduct: Product | null;
  activeCategory: Category | 'All';
  products: Product[];
  currency: Currency;
  isAdminRoute?: boolean;
}

const SITE_NAME = 'Ethiopian Traditional Cloth';
const DEFAULT_TITLE = 'Ethiopian Traditional Cloth – Hand-Woven Habesha Kemis';
const DEFAULT_DESCRIPTION =
  "Shop authentic hand-woven Ethiopian Traditional Cloth—Habesha Kemis, Zuria, Men's Kaba, and custom Mels wedding attire shipped worldwide.";
const DEFAULT_KEYWORDS =
  'Ethiopian Traditional Cloth, Habesha Kemis, Zuria dress, Ethiopian wedding clothes, Mels attire, Netela shawl, Gabi, Ejetabab tunic, Ethiopian Kaba, Tibeb weaving, Addis Ababa couture';

function truncateAtWordBoundary(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  const sliced = normalized.slice(0, maxLength - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const cleanCut = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return `${cleanCut.replace(/[,.;:\-–—]+$/, '').trim()}…`;
}

function buildProductTitle(product: Product): string {
  const branded = `${product.name} | ${SITE_NAME}`;
  if (branded.length <= 64) return branded;
  const shortBrand = `${product.name} | Ethiopian Cloth`;
  if (shortBrand.length <= 64) return shortBrand;
  return truncateAtWordBoundary(product.name, 60);
}

function buildProductDescription(product: Product, currency: Currency): string {
  const priceLabel = formatMoney(product.priceETB, product.priceUSD, currency);
  const summary = `Shop ${product.name} in ${product.fabricType} (${priceLabel}). ${product.description}`;
  return truncateAtWordBoundary(summary, 158);
}

function resolveShareableImageUrl(src: string | undefined, origin: string): string {
  const fallback = `${origin}${STUDIO_IMAGES.hero}`;
  if (!src || src.startsWith('data:')) return fallback;
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${origin}${src.startsWith('/') ? src : `/${src}`}`;
}

function upsertMetaTag(
  attribute: 'name' | 'property',
  key: string,
  content: string
) {
  let tag = document.querySelector(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export function useProductSeo({
  selectedProduct,
  activeCategory,
  products,
  currency,
  isAdminRoute = false,
}: UseProductSeoOptions): void {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = isAdminRoute
      ? `${origin}/admin`
      : selectedProduct
      ? `${origin}/?product=${encodeURIComponent(selectedProduct.id)}`
      : activeCategory !== 'All'
      ? `${origin}/?category=${encodeURIComponent(activeCategory)}`
      : `${origin}/`;

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    let title = DEFAULT_TITLE;
    let description = DEFAULT_DESCRIPTION;
    let keywords = DEFAULT_KEYWORDS;
    let ogType = 'website';
    let ogImage = `${origin}${STUDIO_IMAGES.hero}`;
    let robots = 'index, follow, max-image-preview:large';

    if (isAdminRoute) {
      title = `Atelier Admin | ${SITE_NAME}`;
      description = 'Private storefront administration portal.';
      robots = 'noindex, nofollow';
    } else if (selectedProduct) {
      title = buildProductTitle(selectedProduct);
      description = buildProductDescription(selectedProduct, currency);
      keywords = `${selectedProduct.name}, ${selectedProduct.subCategory}, ${selectedProduct.fabricType}, ${selectedProduct.category} Ethiopian clothing, ${DEFAULT_KEYWORDS}`;
      ogType = 'product';
      ogImage = resolveShareableImageUrl(selectedProduct.images[0], origin);
    } else if (activeCategory !== 'All') {
      title = `${activeCategory} Collection | ${SITE_NAME}`;
      description = truncateAtWordBoundary(
        `Explore authentic hand-woven ${activeCategory} Ethiopian traditional clothing crafted from highland cotton with custom sizing at ${SITE_NAME}.`,
        158
      );
      keywords = `${activeCategory}, ${DEFAULT_KEYWORDS}`;
    }

    document.title = title;
    upsertMetaTag('name', 'description', description);
    upsertMetaTag('name', 'keywords', keywords);
    upsertMetaTag('name', 'robots', robots);
    upsertMetaTag('property', 'og:type', ogType);
    upsertMetaTag('property', 'og:url', canonicalUrl);
    upsertMetaTag('property', 'og:title', title);
    upsertMetaTag('property', 'og:description', description);
    upsertMetaTag('property', 'og:image', ogImage);
    upsertMetaTag('name', 'twitter:title', title);
    upsertMetaTag('name', 'twitter:description', description);
    upsertMetaTag('name', 'twitter:image', ogImage);

    // Dynamic Product / Collection Schema.org JSON-LD
    const scriptId = 'dynamic-seo-jsonld';
    let scriptEl = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement('script');
      scriptEl.id = scriptId;
      scriptEl.type = 'application/ld+json';
      document.head.appendChild(scriptEl);
    }

    if (isAdminRoute) {
      scriptEl.textContent = '';
    } else if (selectedProduct) {
      const price =
        currency === 'ETB' ? selectedProduct.priceETB : selectedProduct.priceUSD;
      const availability =
        selectedProduct.stockStatus === 'Out of Stock'
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock';
      const schemaImages = selectedProduct.images
        .filter((img) => Boolean(img) && !img.startsWith('data:'))
        .map((img) => resolveShareableImageUrl(img, origin));

      scriptEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        sku: selectedProduct.id,
        name: selectedProduct.name,
        description: selectedProduct.description,
        image: schemaImages.length > 0 ? schemaImages : [ogImage],
        category: `${selectedProduct.category} > ${selectedProduct.subCategory}`,
        brand: {
          '@type': 'Brand',
          name: SITE_NAME,
        },
        material: selectedProduct.fabricType,
        offers: {
          '@type': 'Offer',
          url: canonicalUrl,
          priceCurrency: currency,
          price,
          availability,
          itemCondition: 'https://schema.org/NewCondition',
        },
      });
    } else {
      const visible =
        activeCategory === 'All'
          ? products
          : products.filter((p) => p.category === activeCategory);

      scriptEl.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name:
          activeCategory === 'All'
            ? `${SITE_NAME} Featured Catalog`
            : `${SITE_NAME} – ${activeCategory}`,
        numberOfItems: visible.length,
        itemListElement: visible.slice(0, 10).map((p, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: p.name,
          url: `${origin}/?product=${encodeURIComponent(p.id)}`,
        })),
      });
    }
  }, [selectedProduct, activeCategory, products, currency, isAdminRoute]);

  // Restore default SEO metadata if root unmounts
  useEffect(() => {
    return () => {
      document.title = DEFAULT_TITLE;
      upsertMetaTag('name', 'description', DEFAULT_DESCRIPTION);
      upsertMetaTag('name', 'keywords', DEFAULT_KEYWORDS);
      upsertMetaTag('name', 'robots', 'index, follow, max-image-preview:large');
      upsertMetaTag('property', 'og:type', 'website');
      upsertMetaTag('property', 'og:title', DEFAULT_TITLE);
      upsertMetaTag('property', 'og:description', DEFAULT_DESCRIPTION);
      upsertMetaTag('name', 'twitter:title', DEFAULT_TITLE);
      upsertMetaTag('name', 'twitter:description', DEFAULT_DESCRIPTION);
    };
  }, []);
}
