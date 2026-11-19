import React, { useEffect, useMemo, useState } from 'react';
import { MessageSquare, X, Send, CheckCircle2 } from 'lucide-react';
import { CustomerInquiry, CustomerProfile } from '../types';
import { validateEmail } from '../utils/validation';

interface InquiryDrawerProps {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  activeProfile: CustomerProfile | null;
  inquiries: CustomerInquiry[];
  onSubmitInquiry: (
    payload: Omit<CustomerInquiry, 'id' | 'customerId' | 'createdAt' | 'status'> & {
      email: string;
    }
  ) => void;
}

export const InquiryDrawer: React.FC<InquiryDrawerProps> = ({
  isOpen,
  onOpen,
  onClose,
  activeProfile,
  inquiries,
  onSubmitInquiry,
}) => {
  const [customerName, setCustomerName] = useState(activeProfile?.name || '');
  const [email, setEmail] = useState(activeProfile?.email || '');
  const [phone, setPhone] = useState(activeProfile?.phone || '');
  const [occasion, setOccasion] = useState('Mels / Wedding Ensemble');
  const [preferredColors, setPreferredColors] = useState('');
  const [message, setMessage] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (activeProfile) {
      setCustomerName(activeProfile.name);
      setEmail(activeProfile.email);
      setPhone(activeProfile.phone);
    } else {
      setCustomerName('');
      setEmail('');
      setPhone('');
    }
  }, [activeProfile]);

  // Strictly show ONLY inquiries belonging to the active person's customerId
  const myInquiries = useMemo(() => {
    if (!activeProfile) return [];
    return inquiries.filter(
      (inq) => inq.customerId === activeProfile.customerId
    );
  }, [inquiries, activeProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedName = customerName.trim() || activeProfile?.name || '';
    const resolvedEmail = email.trim() || activeProfile?.email || '';

    const emailValidation = validateEmail(resolvedEmail);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    if (!resolvedName || !message.trim()) {
      setFormError('Please enter your name and message to chat with the admin.');
      return;
    }

    setEmailError(null);
    setFormError(null);

    const formattedContact = phone.trim()
      ? `${resolvedEmail} · ${phone.trim()}`
      : resolvedEmail;

    onSubmitInquiry({
      customerName: resolvedName,
      email: resolvedEmail,
      contact: formattedContact,
      occasion,
      preferredColors: preferredColors.trim() || 'Classic Ivory & Burnished Gold',
      message: message.trim(),
    });

    setPreferredColors('');
    setMessage('');
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <>
      {/* Floating Help & Custom Order Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => {
            if (activeProfile) {
              setCustomerName(activeProfile.name);
              setEmail(activeProfile.email);
              setPhone(activeProfile.phone);
            }
            onOpen();
          }}
          className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2.5 px-4 py-3 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-xs font-semibold rounded-md shadow-xl border border-[#C59B27]/50 transition-all cursor-pointer"
        >
          <MessageSquare className="w-4 h-4 text-[#C59B27]" />
          <span>Need Help? Message Us</span>
        </button>
      )}

      {/* Slide-over Help & Custom Order Drawer */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[#1A1817]/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label="Contact Store and Custom Orders"
          onClick={onClose}
        >
          <div
            className="w-full max-w-md bg-[#FAF8F5] h-full flex flex-col border-l border-[#E6E0D4] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-white border-b border-[#E6E0D4] flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-[#1A1817]">
                  Contact Us &amp; Custom Orders
                </h2>
                <p className="text-xs text-[#6B655E]">
                  {activeProfile
                    ? `Your private messages · ID: ${activeProfile.customerId}`
                    : 'Ask about sizing, group weddings, or delivery'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close message drawer"
                className="p-2 text-[#6B655E] hover:text-[#1A1817] rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Direct Phone & Email Bar */}
              <div className="p-3.5 bg-white border border-[#E6E0D4] rounded-lg text-xs space-y-1">
                <div className="font-semibold text-[#1A1817]">
                  Direct Contact · Shiromieda, Addis Ababa
                </div>
                <div className="text-[#6B655E]">
                  Call / WhatsApp:{' '}
                  <a
                    href="tel:0941884443"
                    className="font-mono text-[#1A1817] underline underline-offset-2"
                  >
                    0941884443
                  </a>
                </div>
                <div className="text-[#6B655E]">
                  Email:{' '}
                  <a
                    href="mailto:zekariyasgenene@gmail.com"
                    className="text-[#1A1817] underline underline-offset-2"
                  >
                    zekariyasgenene@gmail.com
                  </a>
                </div>
              </div>

              {submitted && (
                <div className="p-4 bg-white border border-[#164A3B]/40 rounded-lg flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#164A3B] shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="font-semibold text-[#1A1817]">
                      Message Sent!
                    </div>
                    <p className="text-[#6B655E] mt-0.5">
                      We received your question and saved it under your account. Replies appear right below.
                    </p>
                  </div>
                </div>
              )}

              <form noValidate onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#4A453F] mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Your full name"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#4A453F] mb-1">
                      Email Address <span className="text-[#A64B2A]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError(null);
                      }}
                      placeholder="name@example.com"
                      aria-invalid={Boolean(emailError)}
                      className={`w-full px-3 py-2 text-xs bg-white border rounded focus:outline-none ${
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
                    <label className="block text-xs font-medium text-[#4A453F] mb-1">
                      WhatsApp / Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+251 / +1..."
                      className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A453F] mb-1">
                    Occasion / Garment Type
                  </label>
                  <select
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  >
                    <option>Mels / Wedding Ensemble</option>
                    <option>Bridal Party / Group Loom Batch</option>
                    <option>Custom Habesha Kemis or Zuria</option>
                    <option>Men's Ceremonial Kaba &amp; Ejetabab</option>
                    <option>Holiday / Timket Family Set</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A453F] mb-1">
                    Preferred Tibeb Colors &amp; Fabric
                  </label>
                  <input
                    type="text"
                    value={preferredColors}
                    onChange={(e) => setPreferredColors(e.target.value)}
                    placeholder="E.g. Ivory Menen with Emerald & Gold Tibeb"
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#4A453F] mb-1">
                    Your Question or Custom Request
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    placeholder="Share your event date, sizing question, or preferred outfit details..."
                    className="w-full px-3 py-2 text-xs bg-white border border-[#E6E0D4] rounded focus:outline-none focus:border-[#C59B27]"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-[#A64B2A]">{formError}</p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 bg-[#1A1817] hover:bg-[#2F2B29] text-[#FAF8F5] text-xs font-semibold rounded-md flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Send Message</span>
                </button>
              </form>

              {/* Private Conversation Thread Isolated to Active Customer ID */}
              {myInquiries.length > 0 && (
                <div className="pt-5 border-t border-[#E6E0D4] space-y-3">
                  <div className="text-xs font-semibold text-[#1A1817]">
                    My Messages &amp; Replies
                  </div>
                  {myInquiries.map((inq) => (
                    <div
                      key={inq.id}
                      className="p-3 bg-white border border-[#E6E0D4] rounded-md text-xs space-y-2"
                    >
                      <div className="flex justify-between text-[#6B655E]">
                        <span className="font-medium text-[#1A1817]">
                          {inq.customerName}
                        </span>
                        <span className="font-mono">{inq.id}</span>
                      </div>
                      <p className="text-[#4A453F]">{inq.message}</p>
                      {inq.adminReply ? (
                        <div className="p-2.5 bg-[#FAF8F5] border border-[#E6E0D4] rounded text-[#164A3B]">
                          <span className="font-semibold">Store Team: </span>
                          {inq.adminReply}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#8E877E]">
                          Waiting for reply
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
