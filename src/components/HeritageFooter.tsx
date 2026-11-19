import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { STUDIO_IMAGES } from '../data/initialData';
import { LuxuryImage, TibebBorder } from './TibebMotif';
import { Category } from '../types';
import { validateEmail } from '../utils/validation';

interface HeritageFooterProps {
  onSelectCategory: (cat: Category) => void;
  onOpenInquiry: () => void;
  newsletterEmails: string[];
  onSubscribeNewsletter: (email: string) => void;
}

export const HeritageFooter: React.FC<HeritageFooterProps> = ({
  onSelectCategory,
  onOpenInquiry,
  newsletterEmails,
  onSubscribeNewsletter,
}) => {
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [captureState, setCaptureState] = useState<'idle' | 'capturing' | 'captured'>('idle');
  const [capturedEmail, setCapturedEmail] = useState('');

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(emailInput);
    if (validationError) {
      setEmailError(validationError);
      return;
    }

    const normalized = emailInput.trim().toLowerCase();
    setEmailError(null);
    setCaptureState('capturing');

    setTimeout(() => {
      onSubscribeNewsletter(normalized);
      setCapturedEmail(normalized);
      setEmailInput('');
      setCaptureState('captured');
    }, 900);
  };

  return (
    <>
      {/* Artisan Heritage Story Section */}
      <section className="bg-[#F3EFE8] border-y border-[#E6E0D4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 relative rounded-lg overflow-hidden border border-[#E6E0D4] min-h-[320px]">
            <LuxuryImage
              src={STUDIO_IMAGES.fabricMacro}
              alt="Macro close-up of hand-loomed Ethiopian Menen cotton and antique gold Tibeb geometric weave"
              fallbackTitle="Hand-Loomed Tibeb Craftsmanship"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium text-[#A67F1A] mb-2">
              Shiromieda Atelier Heritage
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1A1817] leading-tight [text-wrap:balance]">
              Three Weeks on the Pit Loom, Generations in the Making
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#4A453F] leading-relaxed">
              Every Ethiopian Traditional Cloth garment begins with unbleached highland cotton hand-spun into fine <em>Menen</em> yarn by women artisans in Wollo and Gondar. Our master <em>Shemane</em> weavers then spend up to forty hours interlacing geometric <em>Tibeb</em> borders thread by thread using lustrous silk and antique gold zari.
            </p>

            <div className="mt-8 grid grid-cols-3 gap-4 pt-6 border-t border-[#DFD7C8]">
              <div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1817] tabular-nums">
                  100%
                </div>
                <div className="text-xs text-[#6B655E] mt-1">
                  Hand-Spun Cotton
                </div>
              </div>
              <div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1817] tabular-nums">
                  40+ hrs
                </div>
                <div className="text-xs text-[#6B655E] mt-1">
                  Loom Weaving Time
                </div>
              </div>
              <div>
                <div className="font-serif text-2xl sm:text-3xl font-semibold text-[#1A1817] tabular-nums">
                  DHL
                </div>
                <div className="text-xs text-[#6B655E] mt-1">
                  Global Diaspora Delivery
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TibebBorder tone="obsidian" className="bg-[#1A1817]" />

      {/* Showroom, Newsletter & Brand Footer */}
      <footer className="bg-[#1A1817] text-[#FAF8F5]">
        {/* Newsletter Subscription Band */}
        <div className="border-b border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-6 space-y-2">
              <p className="text-xs font-medium text-[#E5C76B]">
                New Arrivals &amp; Custom Order Updates
              </p>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-[#FAF8F5] [text-wrap:balance]">
                Get Notified About New Hand-Woven Releases
              </h3>
              <p className="text-xs sm:text-sm text-[#BDB5AA] max-w-lg">
                Sign up with your email to hear about seasonal collections, holiday outfits, and custom bridal bookings.
              </p>
            </div>

            <div className="lg:col-span-6">
              <AnimatePresence mode="wait">
                {captureState === 'captured' ? (
                  <motion.div
                    key="captured"
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="p-4 rounded-md bg-white/5 border border-[#C59B27]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-[#E5C76B] shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <div className="font-semibold text-[#FAF8F5]">
                          Email Captured — Welcome to the Atelier List
                        </div>
                        <p className="text-[#BDB5AA] mt-0.5">
                          <span className="font-mono text-[#E5C76B]">{capturedEmail}</span> is confirmed ({newsletterEmails.length} subscriber{newsletterEmails.length === 1 ? '' : 's'} registered).
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCaptureState('idle')}
                      className="text-xs font-medium text-[#E5C76B] hover:text-[#FAF8F5] underline underline-offset-4 self-start sm:self-center shrink-0 cursor-pointer"
                    >
                      Add another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    noValidate
                    onSubmit={handleNewsletterSubmit}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <label htmlFor="footer-newsletter-email" className="sr-only">
                          Email address
                        </label>
                        <input
                          id="footer-newsletter-email"
                          type="email"
                          value={emailInput}
                          disabled={captureState === 'capturing'}
                          onChange={(e) => {
                            setEmailInput(e.target.value);
                            if (emailError) setEmailError(null);
                          }}
                          placeholder="Enter your email address"
                          aria-invalid={Boolean(emailError)}
                          aria-describedby={emailError ? 'footer-newsletter-error' : undefined}
                          className={`w-full px-4 py-3 text-sm bg-white/5 border rounded-md text-[#FAF8F5] placeholder:text-[#8E877E] focus:outline-none transition-colors ${
                            emailError
                              ? 'border-[#E07A5F] focus:border-[#E07A5F]'
                              : 'border-white/15 focus:border-[#C59B27]'
                          }`}
                        />

                        {/* Simulated Email Capture Progress Shimmer */}
                        {captureState === 'capturing' && (
                          <motion.div
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.85, ease: [0.16, 1, 0.3, 1] }}
                            style={{ transformOrigin: 'left' }}
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#C59B27] rounded-b-md"
                          />
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={captureState === 'capturing'}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C59B27] hover:bg-[#B0881E] disabled:opacity-75 text-[#1A1817] text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {captureState === 'capturing' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Capturing...</span>
                          </>
                        ) : (
                          <>
                            <span>Subscribe</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    {emailError && (
                      <motion.p
                        id="footer-newsletter-error"
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-[#F2A08A]"
                      >
                        {emailError}
                      </motion.p>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Summary */}
          <div className="md:col-span-4 space-y-4">
            <div className="font-serif text-2xl font-semibold tracking-tight text-[#FAF8F5]">
              Ethiopian Traditional Cloth
            </div>
            <p className="text-sm text-[#BDB5AA] leading-relaxed max-w-sm">
              Luxury Ethiopian traditional fashion house bridging centuries-old hand-weaving artistry with modern bespoke tailoring for ceremonies worldwide.
            </p>
            <button
              type="button"
              onClick={onOpenInquiry}
              className="inline-flex items-center px-4 py-2.5 text-xs font-semibold text-[#1A1817] bg-[#C59B27] hover:bg-[#B0881E] rounded-md transition-colors cursor-pointer"
            >
              Message Us / Custom Order
            </button>
          </div>

          {/* Collections */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="font-sans text-xs font-semibold text-[#E5C76B]">
              Collections
            </h3>
            <ul className="space-y-2 text-sm text-[#BDB5AA]">
              {(
                [
                  'Women',
                  'Men',
                  'Couples & Weddings',
                  'Kids',
                  'Accessories',
                ] as Category[]
              ).map((cat) => (
                <li key={cat}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectCategory(cat);
                      document
                        .getElementById('collection-catalog')
                        ?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-[#FAF8F5] transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Addis Ababa Showroom */}
          <div className="md:col-span-5 space-y-3">
            <h3 className="font-sans text-xs font-semibold text-[#E5C76B]">
              Shiromieda Flagship Showroom
            </h3>
            <div className="space-y-2.5 text-sm text-[#BDB5AA]">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C59B27] mt-0.5 shrink-0" />
                <span>Shiromieda, Addis Ababa, Ethiopia</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#C59B27] shrink-0" />
                <span className="font-mono text-xs">
                  Mobile / WhatsApp:{' '}
                  <a
                    href="tel:0941884443"
                    className="text-[#FAF8F5] hover:text-[#E5C76B] underline underline-offset-2"
                  >
                    0941884443
                  </a>
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#C59B27] shrink-0" />
                <a
                  href="mailto:zekariyasgenene@gmail.com"
                  className="text-[#FAF8F5] hover:text-[#E5C76B] underline underline-offset-2"
                >
                  zekariyasgenene@gmail.com
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-[#C59B27] shrink-0" />
                <span>Mon–Sat · 9:30 AM – 7:00 PM EAT</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#8E877E]">
            <span>© 2026 Ethiopian Traditional Cloth. All rights reserved.</span>
            <span>Hand-woven in Ethiopia · Shipped Worldwide via DHL Express</span>
          </div>
        </div>
      </footer>
    </>
  );
};
