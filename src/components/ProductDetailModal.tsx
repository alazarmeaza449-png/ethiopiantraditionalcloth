import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Ruler,
  Clock,
  Check,
  ZoomIn,
  ZoomOut,
  Plus,
  ShoppingBag,
  Sparkles,
  Layers,
  Share2,
  Copy,
  MessageCircle,
} from 'lucide-react';
import {
  CartItem,
  Currency,
  CustomMeasurements,
  FabricChoice,
  Product,
  StandardSize,
} from '../types';
import { formatMoney, STUDIO_IMAGES } from '../data/initialData';
import { LuxuryImage } from './TibebMotif';

interface ProductDetailModalProps {
  product: Product | null;
  allProducts: Product[];
  currency: Currency;
  onClose: () => void;
  onAddToCart: (items: Omit<CartItem, 'cartItemId'>[]) => void;
  onOpenCart?: () => void;
}

const STANDARD_SIZES: StandardSize[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

const EMPTY_MEASUREMENTS: CustomMeasurements = {
  heightCm: '',
  bustChestCm: '',
  waistCm: '',
  hipCm: '',
  sleeveLengthCm: '',
  garmentLengthCm: '',
  notes: '',
};

const LOUPE_SIZE = 180;
const LOUPE_ZOOM = 2.8;

const DEFAULT_LENS_METRICS = {
  xPct: 50,
  yPct: 50,
  pxX: 180,
  pxY: 240,
  width: 360,
  height: 480,
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  allProducts,
  currency,
  onClose,
  onAddToCart,
  onOpenCart,
}) => {
  const galleryFrameRef = useRef<HTMLDivElement | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isHoveringPattern, setIsHoveringPattern] = useState(false);
  const [isHoveringControls, setIsHoveringControls] = useState(false);
  const [showTextureOverlay, setShowTextureOverlay] = useState(false);
  const [lensMetrics, setLensMetrics] = useState(DEFAULT_LENS_METRICS);
  const [loupeImageError, setLoupeImageError] = useState(false);
  const [macroImageError, setMacroImageError] = useState(false);
  const [sizingMode, setSizingMode] = useState<'standard' | 'custom'>('standard');
  const [selectedSize, setSelectedSize] = useState<StandardSize>('M');
  const [measurements, setMeasurements] =
    useState<CustomMeasurements>(EMPTY_MEASUREMENTS);
  const [measurementError, setMeasurementError] = useState('');
  const [selectedUpsells, setSelectedUpsells] = useState<string[]>([]);
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    if (!product) return;
    setActiveImageIdx(0);
    setIsZoomed(false);
    setIsHoveringPattern(false);
    setIsHoveringControls(false);
    setShowTextureOverlay(false);
    setLensMetrics(DEFAULT_LENS_METRICS);
    setLoupeImageError(false);
    setMacroImageError(false);
    setSizingMode('standard');
    setSelectedSize(product.isOneSizeOnly ? 'One Size' : 'M');
    setMeasurements(EMPTY_MEASUREMENTS);
    setMeasurementError('');
    setSelectedUpsells([]);
    setAddedFeedback(false);
    setShareOpen(false);
    setCopiedShare(false);
  }, [product]);

  if (!product) return null;

  const upsellProducts = (product.upsellIds || [])
    .map((id) => allProducts.find((p) => p.id === id))
    .filter((p): p is Product => Boolean(p));

  const defaultFabric: FabricChoice =
    product.availableFabrics[0] || product.fabricType;
  const defaultTibeb =
    product.tibebColors[0]?.name || 'Traditional Signature Finish';

  const unitETB = product.priceETB;
  const unitUSD = product.priceUSD;

  const toggleUpsell = (id: string) => {
    setSelectedUpsells((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleMeasurementChange = (
    field: keyof CustomMeasurements,
    value: string
  ) => {
    setMeasurementError('');
    setMeasurements((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (sizingMode === 'custom') {
      const required: (keyof CustomMeasurements)[] = [
        'heightCm',
        'bustChestCm',
        'waistCm',
        'hipCm',
        'sleeveLengthCm',
        'garmentLengthCm',
      ];
      const missing = required.some((f) => !String(measurements[f] || '').trim());
      if (missing) {
        setMeasurementError(
          'Please enter all 6 body measurements (in cm) for bespoke tailoring.'
        );
        return;
      }
    }

    const itemsToAdd: Omit<CartItem, 'cartItemId'>[] = [
      {
        productId: product.id,
        name: product.name,
        category: product.category,
        image: product.images[0],
        priceETB: unitETB,
        priceUSD: unitUSD,
        quantity: 1,
        sizingMode,
        standardSize: sizingMode === 'standard' ? selectedSize : undefined,
        customMeasurements:
          sizingMode === 'custom' ? { ...measurements } : undefined,
        selectedFabric: defaultFabric,
        selectedTibebColor: defaultTibeb,
        weavingTime: product.weavingTime,
      },
    ];

    selectedUpsells.forEach((upsellId) => {
      const up = allProducts.find((p) => p.id === upsellId);
      if (up) {
        itemsToAdd.push({
          productId: up.id,
          name: up.name,
          category: up.category,
          image: up.images[0],
          priceETB: up.priceETB,
          priceUSD: up.priceUSD,
          quantity: 1,
          sizingMode: 'standard',
          standardSize: up.isOneSizeOnly ? 'One Size' : 'M',
          selectedFabric: up.availableFabrics[0] || up.fabricType,
          selectedTibebColor:
            up.tibebColors[0]?.name || 'Traditional Signature Finish',
          weavingTime: up.weavingTime,
        });
      }
    });

    onAddToCart(itemsToAdd);
    setAddedFeedback(true);
  };

  const activeImage = product.images[activeImageIdx] || product.images[0];
  const macroTextureImage =
    product.images.find((img) => img.includes('fabric_tibeb_macro')) ||
    STUDIO_IMAGES.fabricMacro ||
    activeImage;
  const activeTibebOption = product.tibebColors[0];

  const updatePointerMetrics = (clientX: number, clientY: number) => {
    const el = galleryFrameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const pxX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pxY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    setLensMetrics({
      xPct: (pxX / rect.width) * 100,
      yPct: (pxY / rect.height) * 100,
      pxX,
      pxY,
      width: rect.width,
      height: rect.height,
    });
  };

  const revealActive = isHoveringPattern || isZoomed || showTextureOverlay;

  const productUrl = `${window.location.origin}/?product=${encodeURIComponent(
    product.id
  )}`;
  const sharePriceLabel = formatMoney(unitETB, unitUSD, currency);
  const shortGarmentDescription =
    product.description.length > 140
      ? `${product.description.slice(0, 137).replace(/\s+\S*$/, '')}…`
      : product.description;

  const shareMessagePreview = [
    `${product.name} — Ethiopian Traditional Cloth`,
    shortGarmentDescription,
    `Crafted in ${defaultFabric} (${sharePriceLabel}). Standard & custom cm tailoring available.`,
    `View outfit: ${productUrl}`,
  ].join('\n\n');

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    shareMessagePreview
  )}`;
  const twitterShareText = `Discover the ${product.name} from Ethiopian Traditional Cloth — ${shortGarmentDescription} (${sharePriceLabel})`;
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    twitterShareText
  )}&url=${encodeURIComponent(productUrl)}`;

  const handleCopyShareMessage = () => {
    navigator.clipboard?.writeText(shareMessagePreview);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1817]/70 backdrop-blur-sm p-0 sm:p-4 lg:p-8 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={product.name}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-6xl bg-[#FAF8F5] sm:rounded-lg border border-[#E6E0D4] shadow-2xl overflow-hidden max-h-full sm:max-h-[92vh] flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
          if (shareOpen) setShareOpen(false);
        }}
      >
        {/* Top Modal Bar */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 bg-white border-b border-[#E6E0D4] shrink-0">
          <div className="flex items-center gap-2 text-xs text-[#6B655E]">
            <span>{product.category}</span>
            <span aria-hidden="true">/</span>
            <span className="text-[#1A1817] font-medium">{product.subCategory}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShareOpen((prev) => !prev);
              }}
              aria-expanded={shareOpen}
              aria-label="Share this garment on WhatsApp or Twitter"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                shareOpen
                  ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817]'
                  : 'bg-[#FAF8F5] text-[#1A1817] border-[#E6E0D4] hover:border-[#C59B27]'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-[#C59B27]" />
              <span>Share</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close product details"
              className="p-2 text-[#6B655E] hover:text-[#1A1817] hover:bg-[#F3EFE8] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Pre-filled Social Share Popover */}
          {shareOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute right-4 sm:right-6 top-full mt-2 z-30 w-[calc(100%-2rem)] sm:w-96 bg-white border border-[#E6E0D4] rounded-lg shadow-2xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#1A1817]">
                    Share Garment
                  </h3>
                  <p className="text-[11px] text-[#6B655E]">
                    Pre-filled with product description &amp; direct link
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShareOpen(false)}
                  aria-label="Close share menu"
                  className="p-1 text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-[#FAF8F5] border border-[#E6E0D4] rounded-md text-xs text-[#4A453F] whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                {shareMessagePreview}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={whatsappShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#164A3B] hover:bg-[#113A2E] text-white text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <a
                  href={twitterShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-xs font-semibold rounded-md transition-colors whitespace-nowrap"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Twitter / X</span>
                </a>
              </div>

              <button
                type="button"
                onClick={handleCopyShareMessage}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F3EFE8] hover:bg-[#EAE3D7] border border-[#E6E0D4] text-[#1A1817] text-xs font-medium rounded-md transition-colors cursor-pointer"
              >
                {copiedShare ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#164A3B]" />
                    <span>Copied Message &amp; Link</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#6B655E]" />
                    <span>Copy Message &amp; Link</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Scrollable Two-Column PDP */}
        <div className="overflow-y-auto grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Multi-Angle Gallery + Zoom-to-Reveal Fabric Texture */}
          <div className="lg:col-span-6 bg-[#F3EFE8] p-5 sm:p-8 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-[#E6E0D4]">
            <div
              ref={galleryFrameRef}
              onMouseEnter={(e) => {
                setIsHoveringPattern(true);
                updatePointerMetrics(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                updatePointerMetrics(e.clientX, e.clientY);
              }}
              onMouseLeave={() => {
                setIsHoveringPattern(false);
                setIsHoveringControls(false);
              }}
              className="relative aspect-[3/4] w-full rounded-md overflow-hidden bg-white border border-[#E6E0D4] select-none"
            >
              <div
                onClick={() => setIsZoomed((z) => !z)}
                className={`w-full h-full overflow-hidden ${
                  isZoomed ? 'cursor-zoom-out' : 'cursor-crosshair'
                }`}
                title="Hover over woven patterns for macro texture reveal, or click to lock zoom"
              >
                <LuxuryImage
                  key={activeImage}
                  src={activeImage}
                  alt={`${product.name} view ${activeImageIdx + 1}`}
                  fallbackTitle={product.name}
                  style={
                    isZoomed
                      ? {
                          transformOrigin: `${lensMetrics.xPct}% ${lensMetrics.yPct}%`,
                        }
                      : undefined
                  }
                  className={`w-full h-full object-cover transition-transform duration-200 ease-out motion-reduce:transition-none ${
                    isZoomed ? 'scale-[2.25]' : 'scale-100'
                  }`}
                />
              </div>

              {/* Subtle Hover Focus Vignette */}
              <div
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 bg-[#1A1817]/15 transition-opacity duration-200 motion-reduce:transition-none ${
                  isHoveringPattern && !isHoveringControls && !isZoomed
                    ? 'opacity-100'
                    : 'opacity-0'
                }`}
              />

              {/* Pointer-Tracking High-Resolution Optical Weave Loupe */}
              {!isZoomed && !loupeImageError && activeImage && (
                <div
                  aria-hidden="true"
                  style={{
                    width: LOUPE_SIZE,
                    height: LOUPE_SIZE,
                    transform: `translate3d(${lensMetrics.pxX - LOUPE_SIZE / 2}px, ${
                      lensMetrics.pxY - LOUPE_SIZE / 2
                    }px, 0)`,
                  }}
                  className={`pointer-events-none absolute top-0 left-0 rounded-full overflow-hidden border-2 border-[#C59B27] shadow-2xl bg-[#1A1817] transition-opacity duration-150 motion-reduce:transition-none ${
                    isHoveringPattern && !isHoveringControls
                      ? 'opacity-100'
                      : 'opacity-0'
                  }`}
                >
                  <img
                    src={activeImage}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setLoupeImageError(true)}
                    style={{
                      width: lensMetrics.width,
                      height: lensMetrics.height,
                      maxWidth: 'none',
                      transformOrigin: '0 0',
                      transform: `translate3d(${
                        LOUPE_SIZE / 2 - lensMetrics.pxX * LOUPE_ZOOM
                      }px, ${
                        LOUPE_SIZE / 2 - lensMetrics.pxY * LOUPE_ZOOM
                      }px, 0) scale(${LOUPE_ZOOM})`,
                    }}
                    className="object-cover"
                  />
                  {/* Tactile Hand-Woven Thread Grain Layer */}
                  {!macroImageError && macroTextureImage && (
                    <img
                      src={macroTextureImage}
                      alt=""
                      referrerPolicy="no-referrer"
                      onError={() => setMacroImageError(true)}
                      style={{
                        objectPosition: `${lensMetrics.xPct}% ${lensMetrics.yPct}%`,
                      }}
                      className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-[0.16] mix-blend-overlay scale-150"
                    />
                  )}
                  <div className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/35" />
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="w-3 h-px bg-[#C59B27]/80" />
                    <span className="absolute h-3 w-px bg-[#C59B27]/80" />
                  </div>
                </div>
              )}

              {/* High-Resolution Fabric Texture Detail Overlay Card */}
              <div
                className={`pointer-events-none absolute top-3 left-3 right-3 sm:right-auto sm:max-w-[290px] bg-[#FAF8F5]/95 backdrop-blur-md border border-[#E6E0D4] rounded-md p-2.5 shadow-lg transition-all duration-200 motion-reduce:transition-none ${
                  revealActive
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 -translate-y-1'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded overflow-hidden border border-[#C59B27]/60 bg-[#F3EFE8] shrink-0">
                    {!macroImageError && macroTextureImage ? (
                      <img
                        src={macroTextureImage}
                        alt={`${defaultFabric} weave macro`}
                        referrerPolicy="no-referrer"
                        onError={() => setMacroImageError(true)}
                        style={{
                          objectPosition: `${lensMetrics.xPct}% ${lensMetrics.yPct}%`,
                        }}
                        className="w-full h-full object-cover scale-[1.85]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Layers className="w-4 h-4 text-[#C59B27]" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-[#1A1817] truncate">
                      High-Res Weave Detail
                    </div>
                    <div className="text-[11px] text-[#4A453F] truncate mt-0.5">
                      {defaultFabric}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6B655E] truncate">
                      {activeTibebOption && (
                        <span
                          className="w-2.5 h-2.5 rounded-xs border border-black/15 shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${activeTibebOption.swatchHex} 50%, ${activeTibebOption.accentHex} 50%)`,
                          }}
                        />
                      )}
                      <span className="truncate">{defaultTibeb}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] font-mono text-[#8A6A16] tabular-nums">
                      {isZoomed ? '2.25× Locked Pan' : `${LOUPE_ZOOM}× Pattern Reveal`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom-Right Weave Inspection Controls */}
              <div
                onMouseEnter={() => setIsHoveringControls(true)}
                onMouseLeave={() => setIsHoveringControls(false)}
                className="absolute bottom-3 right-3 flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={() => setShowTextureOverlay((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md border rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showTextureOverlay
                      ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817]'
                      : 'bg-[#FAF8F5]/92 text-[#1A1817] border-[#E6E0D4] hover:border-[#C59B27]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>{showTextureOverlay ? 'Hide Texture' : 'Weave Texture'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsZoomed((z) => !z)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md border rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isZoomed
                      ? 'bg-[#1A1817] text-[#FAF8F5] border-[#1A1817]'
                      : 'bg-[#FAF8F5]/92 text-[#1A1817] border-[#E6E0D4] hover:border-[#C59B27]'
                  }`}
                >
                  {isZoomed ? (
                    <ZoomOut className="w-3.5 h-3.5 text-[#C59B27]" />
                  ) : (
                    <ZoomIn className="w-3.5 h-3.5 text-[#C59B27]" />
                  )}
                  <span>{isZoomed ? 'Reset Zoom' : 'Hover / Inspect'}</span>
                </button>
              </div>
            </div>

            {/* Thumbnail Switcher */}
            <div className="grid grid-cols-3 gap-3">
              {product.images.map((img, idx) => {
                const labels = ['Lookbook View', 'Fabric Close-Up', 'Detail Angle'];
                const isSelected = activeImageIdx === idx;
                return (
                  <button
                    key={`${img}-${idx}`}
                    type="button"
                    onClick={() => {
                      setActiveImageIdx(idx);
                      setIsZoomed(false);
                      setLoupeImageError(false);
                    }}
                    className={`group relative rounded-md overflow-hidden border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'border-[#C59B27] ring-2 ring-[#C59B27]/30'
                        : 'border-[#E6E0D4] opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full bg-white overflow-hidden">
                      <LuxuryImage
                        src={img}
                        alt={labels[idx] || `Angle ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="px-2 py-1.5 bg-white text-[11px] font-medium text-[#4A453F] truncate">
                      {labels[idx] || `Angle ${idx + 1}`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Contiguous Purchase Module */}
          <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col gap-6">
            <div>
              {/* Weaving Lead Time & Stock Metadata (Clean unboxed text) */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B655E]">
                <span className="inline-flex items-center gap-1.5 text-[#164A3B] font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Hand-Weaving Lead Time: {product.weavingTime}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.stockStatus}</span>
              </div>

              <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold text-[#1A1817] leading-tight">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-[#1A1817] tabular-nums">
                  {formatMoney(unitETB, unitUSD, currency)}
                </span>
                <span className="text-xs font-mono text-[#6B655E] tabular-nums">
                  ({currency === 'USD'
                    ? formatMoney(unitETB, unitUSD, 'ETB')
                    : formatMoney(unitETB, unitUSD, 'USD')})
                </span>
              </div>

              <p className="mt-4 text-sm text-[#4A453F] leading-relaxed">
                {product.description}
              </p>
              <p className="mt-2 text-xs text-[#6B655E] italic">
                {product.artisanNote}
              </p>
            </div>

            {/* Size Selection (Standard or Custom Measurements) */}
            <div className="pt-5 border-t border-[#E6E0D4]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <span className="text-xs font-semibold text-[#1A1817]">
                  Choose Your Size
                </span>

                {!product.isOneSizeOnly && (
                  <div className="inline-flex bg-[#F3EFE8] border border-[#E6E0D4] rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSizingMode('standard');
                        setMeasurementError('');
                      }}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        sizingMode === 'standard'
                          ? 'bg-white text-[#1A1817] shadow-xs'
                          : 'text-[#6B655E] hover:text-[#1A1817]'
                      }`}
                    >
                      Standard (XS–XXL)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSizingMode('custom')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                        sizingMode === 'custom'
                          ? 'bg-[#1A1817] text-[#FAF8F5]'
                          : 'text-[#6B655E] hover:text-[#1A1817]'
                      }`}
                    >
                      <Ruler className="w-3 h-3 text-[#C59B27]" />
                      <span>Custom Size (cm)</span>
                    </button>
                  </div>
                )}
              </div>

              {product.isOneSizeOnly ? (
                <div className="px-4 py-2.5 bg-white border border-[#E6E0D4] rounded-md text-xs text-[#4A453F]">
                  Traditional Adjustable Fit — One Size Fits All
                </div>
              ) : sizingMode === 'standard' ? (
                <div className="grid grid-cols-6 gap-2">
                  {STANDARD_SIZES.map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        setSelectedSize(sz);
                        setAddedFeedback(false);
                      }}
                      className={`py-2.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                        selectedSize === sz
                          ? 'bg-[#1A1817] text-white border-[#1A1817]'
                          : 'bg-white text-[#1A1817] border-[#E6E0D4] hover:border-[#C59B27]'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-[#E6E0D4] rounded-md p-4 space-y-3">
                  <p className="text-xs text-[#6B655E]">
                    Enter your measurements in centimeters (cm) for tailored stitching. Need sizing help? Call or WhatsApp{' '}
                    <span className="font-mono text-[#1A1817] font-medium">0941884443</span>.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { key: 'heightCm', label: 'Height (cm)', placeholder: '168' },
                      { key: 'bustChestCm', label: 'Bust / Chest (cm)', placeholder: '92' },
                      { key: 'waistCm', label: 'Waist (cm)', placeholder: '72' },
                      { key: 'hipCm', label: 'Hip (cm)', placeholder: '98' },
                      { key: 'sleeveLengthCm', label: 'Sleeve Length (cm)', placeholder: '59' },
                      { key: 'garmentLengthCm', label: 'Dress / Tunic Length', placeholder: '142' },
                    ].map((field) => (
                      <div key={field.key}>
                        <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                          {field.label}
                        </label>
                        <input
                          type="text"
                          value={
                            measurements[field.key as keyof CustomMeasurements] || ''
                          }
                          onChange={(e) =>
                            handleMeasurementChange(
                              field.key as keyof CustomMeasurements,
                              e.target.value
                            )
                          }
                          placeholder={field.placeholder}
                          className="w-full px-2.5 py-2 text-xs font-mono bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-[#4A453F] mb-1">
                      Tailoring Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={measurements.notes || ''}
                      onChange={(e) =>
                        handleMeasurementChange('notes', e.target.value)
                      }
                      placeholder="E.g. Heel height 6cm, relaxed shoulder fit"
                      className="w-full px-2.5 py-2 text-xs bg-[#FAF8F5] border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                  {measurementError && (
                    <p className="text-xs text-[#A64B2A] font-medium">
                      {measurementError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Primary Add to Bag CTA (Right under Size Selection for immediate checkout) */}
            <div className="pt-2 space-y-2.5">
              {(() => {
                const upsellTotalETB = upsellProducts
                  .filter((u) => selectedUpsells.includes(u.id))
                  .reduce((sum, u) => sum + u.priceETB, 0);
                const upsellTotalUSD = upsellProducts
                  .filter((u) => selectedUpsells.includes(u.id))
                  .reduce((sum, u) => sum + u.priceUSD, 0);
                const ctaTotalLabel = formatMoney(
                  unitETB + upsellTotalETB,
                  unitUSD + upsellTotalUSD,
                  currency
                );
                return (
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <button
                      type="button"
                      disabled={product.stockStatus === 'Out of Stock'}
                      onClick={handleAdd}
                      className={`flex-1 py-3.5 px-6 rounded-md text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                        product.stockStatus === 'Out of Stock'
                          ? 'bg-[#E6E0D4] text-[#6B655E] cursor-not-allowed'
                          : addedFeedback
                          ? 'bg-[#164A3B] text-white'
                          : 'bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5]'
                      }`}
                    >
                      {addedFeedback ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Added to Your Bag</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4 text-[#C59B27]" />
                          <span>
                            {product.stockStatus === 'Out of Stock'
                              ? 'Currently Out of Stock'
                              : `Add to Bag · ${ctaTotalLabel}${
                                  selectedUpsells.length > 0
                                    ? ` (${1 + selectedUpsells.length} items)`
                                    : ''
                                }`}
                          </span>
                        </>
                      )}
                    </button>

                    {addedFeedback && onOpenCart && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCart();
                        }}
                        className="py-3.5 px-5 rounded-md text-sm font-semibold bg-[#C59B27] hover:bg-[#B0881E] text-[#1A1817] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        View Bag &amp; Checkout
                      </button>
                    )}
                  </div>
                );
              })()}
              <p className="text-[11px] text-center text-[#6B655E]">
                Free Addis Ababa delivery · Worldwide DHL Express · Track order in My Account
              </p>
            </div>

            {/* Optional Matching Pieces */}
            {upsellProducts.length > 0 && (
              <div className="pt-5 border-t border-[#E6E0D4]">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1A1817] mb-3">
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Add Matching Pieces (Optional)</span>
                </div>
                <div className="space-y-2.5">
                  {upsellProducts.map((up) => {
                    const checked = selectedUpsells.includes(up.id);
                    return (
                      <button
                        key={up.id}
                        type="button"
                        onClick={() => {
                          toggleUpsell(up.id);
                          setAddedFeedback(false);
                        }}
                        className={`w-full flex items-center justify-between gap-3 p-2.5 rounded-md border text-left transition-colors cursor-pointer ${
                          checked
                            ? 'border-[#C59B27] bg-[#FFFDF8]'
                            : 'border-[#E6E0D4] bg-white hover:border-[#C59B27]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-12 rounded overflow-hidden bg-[#F3EFE8] shrink-0">
                            <LuxuryImage
                              src={up.images[0]}
                              alt={up.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-[#1A1817] truncate">
                              {up.name}
                            </div>
                            <div className="text-[11px] text-[#6B655E] tabular-nums">
                              {formatMoney(up.priceETB, up.priceUSD, currency)}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-semibold shrink-0 ${
                            checked
                              ? 'bg-[#164A3B] text-white'
                              : 'bg-[#F3EFE8] text-[#1A1817]'
                          }`}
                        >
                          {checked ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Add</span>
                            </>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
