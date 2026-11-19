import React from 'react';
import { ArrowRight } from 'lucide-react';
import { STUDIO_IMAGES } from '../data/initialData';
import { LuxuryImage, TibebBorder } from './TibebMotif';

interface HeroSectionProps {
  onExploreClick: () => void;
  onBookBespokeClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onBookBespokeClick,
}) => {
  return (
    <section id="top" className="relative bg-[#1A1817] text-[#FAF8F5] overflow-hidden">
      {/* Full-bleed editorial image with measured scrim */}
      <div className="relative min-h-[540px] lg:min-h-[640px] flex items-center">
        <LuxuryImage
          src={STUDIO_IMAGES.hero}
          alt="Ethiopian model wearing hand-woven ivory Habesha Kemis with burnished antique gold Tibeb borders"
          fallbackTitle="Ethiopian Traditional Cloth Ceremonial Lookbook"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Measured Contrast Scrim for WCAG AA readability */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#1A1817]/90 via-[#1A1817]/55 to-[#1A1817]/15"
          aria-hidden="true"
        />

        {/* Subtle Tibeb Gold Frame Motif */}
        <div
          className="hidden lg:block absolute inset-5 border border-[#C59B27]/35 pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8 lg:px-14 py-16 sm:py-24 w-full">
          <div className="max-w-xl">
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#E5C76B] mb-4">
              Addis Ababa Atelier · Hand-Spun Shemma &amp; Royal Tibeb
            </p>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-[3.75rem] font-semibold leading-[1.08] tracking-tight text-[#FAF8F5] [text-wrap:balance]">
              Woven by Heritage, Tailored for Today
            </h1>

            <p className="mt-5 text-base sm:text-lg text-[#EAE4DA] leading-relaxed max-w-lg">
              Authentic Ethiopian Habesha Kemis, Zuria gowns, and tailored men&apos;s Kaba &amp; Ejetabab outfits—hand-woven from raw cotton and made to fit your standard or custom size.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onExploreClick}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-[#C59B27] hover:bg-[#B0881E] text-[#1A1817] text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Shop Collection</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBookBespokeClick}
                className="inline-flex items-center px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-[#FAF8F5] border border-white/25 text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Request Custom Order
              </button>
            </div>

            <p className="mt-5 text-xs text-[#D8D1C5]">
              Standard XS–XXL or Custom Tailoring · Free Addis Ababa Delivery · Worldwide DHL
            </p>
          </div>
        </div>
      </div>

      {/* Subtle Tibeb border motif anchored along bottom edge */}
      <div className="bg-[#FAF8F5] pt-2">
        <TibebBorder tone="gold" />
      </div>
    </section>
  );
};
