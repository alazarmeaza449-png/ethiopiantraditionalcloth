import React from 'react';
import { useProductSeo } from '../hooks/useProductSeo';
import { Category, Currency, Product } from '../types';

interface SeoManagerProps {
  activeCategory: Category | 'All';
  selectedProduct: Product | null;
  products: Product[];
  currency: Currency;
  isAdminRoute?: boolean;
}

export const SeoManager: React.FC<SeoManagerProps> = ({
  activeCategory,
  selectedProduct,
  products,
  currency,
  isAdminRoute = false,
}) => {
  useProductSeo({
    activeCategory,
    selectedProduct,
    products,
    currency,
    isAdminRoute,
  });

  return null;
};
