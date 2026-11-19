import React, { useEffect, useState } from 'react';
import { Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';

interface AdminAuthGateProps {
  onAuthenticated: (token: string) => void;
  onBackToStorefront: () => void;
}

export const AdminAuthGate: React.FC<AdminAuthGateProps> = ({
  onAuthenticated,
  onBackToStorefront,
}) => {
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    const existingToken = window.sessionStorage.getItem('etc_admin_token');

    fetch('/api/admin/session', {
      credentials: 'same-origin',
      headers: existingToken
        ? { Authorization: `Bearer ${existingToken}` }
        : undefined,
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        setIsConfigured(Boolean(data.configured));
        if (data.authenticated && existingToken) {
          onAuthenticated(existingToken);
        } else if (data.authenticated) {
          onAuthenticated('cookie-session');
        }
      })
      .catch(() => {
        if (active) setIsConfigured(true);
      })
      .finally(() => {
        if (active) setChecking(false);
      });

    return () => {
      active = false;
    };
  }, [onAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessKey.trim()) {
      setError('Enter your private admin access key.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: accessKey.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        if (data.configured === false) {
          setIsConfigured(false);
        }
        setError(data?.error || 'Unable to verify admin access key.');
        return;
      }

      const token = data.token as string;
      window.sessionStorage.setItem('etc_admin_token', token);
      setAccessKey('');
      onAuthenticated(token);
    } catch {
      setError('Unable to reach verification server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6 bg-[#FAF8F5]">
      <div className="w-full max-w-md bg-white border border-[#E6E0D4] rounded-lg shadow-xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2 text-center">
          <div className="w-11 h-11 rounded-full bg-[#FAF8F5] border border-[#E6E0D4] flex items-center justify-center mx-auto">
            <Lock className="w-5 h-5 text-[#C59B27]" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-[#1A1817]">
            Owner Atelier Access
          </h1>
          <p className="text-xs text-[#6B655E]">
            Restricted to the owner of Ethiopian Traditional Cloth · Shiromieda, Addis Ababa
          </p>
        </div>

        {checking ? (
          <div className="py-6 text-center text-xs text-[#6B655E]">
            Verifying security session...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {isConfigured === false && (
              <div className="p-3.5 bg-[#FAF8F5] border border-[#A64B2A]/40 rounded-md flex items-start gap-2.5 text-xs text-[#4A453F]">
                <AlertCircle className="w-4 h-4 text-[#A64B2A] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-[#1A1817]">
                    Admin Secret Not Configured:
                  </span>{' '}
                  Add <code className="font-mono text-[#1A1817]">ADMIN_ACCESS_KEY</code> in Settings → Secrets (or your hosting environment variables) to unlock owner login.
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="admin-access-key"
                className="block text-xs font-medium text-[#4A453F] mb-1.5"
              >
                Admin Access Key
              </label>
              <div className="relative">
                <input
                  id="admin-access-key"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={accessKey}
                  onChange={(e) => {
                    setAccessKey(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter your private admin key"
                  className="w-full pl-3.5 pr-10 py-2.5 text-sm bg-[#FAF8F5] border border-[#E6E0D4] rounded-md focus:outline-none focus:border-[#C59B27]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  aria-label={showKey ? 'Hide access key' : 'Show access key'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
                >
                  {showKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-[#A64B2A]">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#1A1817] hover:bg-[#2F2B29] disabled:opacity-60 text-[#FAF8F5] text-xs font-semibold rounded-md transition-colors cursor-pointer"
            >
              {submitting ? 'Verifying...' : 'Unlock Admin Console'}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#F0EAE0] text-center">
          <button
            type="button"
            onClick={onBackToStorefront}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B655E] hover:text-[#1A1817] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Storefront</span>
          </button>
        </div>
      </div>
    </main>
  );
};
