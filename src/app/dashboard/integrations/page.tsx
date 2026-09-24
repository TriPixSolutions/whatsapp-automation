'use client';

import React, { useState, useEffect, useCallback, memo } from 'react';
import { useForm } from 'react-hook-form';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import {
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Plug,
  AlertCircle,
  X,
  Copy,
  ChevronRight,
  Loader2,
  RefreshCw,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { StoreDataOverview } from '@/components/ecommerce/StoreDataOverview';

interface ShopifyFormValues {
  storeName: string;
  accessToken: string;
  webhookSecret?: string;
}

interface WooFormValues {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
  webhookSecret?: string;
}

// ─── Shopify Connection Modal (Optimized with react-hook-form) ─────────────────
function ShopifyModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ShopifyFormValues>({
    defaultValues: { storeName: '', accessToken: '', webhookSecret: '' },
    mode: 'onTouched',
  });

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/shopify`;

  const onSubmit = async (values: ShopifyFormValues) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'shopify',
          storeName: values.storeName,
          accessToken: values.accessToken,
          webhookSecret: values.webhookSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. Please ensure your account has administrator or approved workspace privileges.');
        }
        throw new Error(data.error || data.details || 'Failed to connect Shopify store');
      }
      onSave({ storeName: values.storeName, connectedAt: new Date().toISOString() });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect Shopify');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      const isValid = await trigger(['storeName', 'accessToken']);
      if (!isValid) return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#96BF48]/10 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#96BF48]" />
            </div>
            <div>
              <h2 className="font-bold text-[#0D0F2D] text-sm">Connect Shopify</h2>
              <p className="text-xs text-slate-400">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#96BF48]' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Content (Keep DOM mounted for smooth 0ms keystroke latency) */}
        <form id="shopify-form" onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Guide */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <h3 className="font-bold text-[#0D0F2D] mb-3 text-sm">Create a Shopify Custom App</h3>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>In your Shopify Admin, go to <strong>Settings → Apps and sales channels → Develop apps</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Click <strong>Create an app</strong>, give it a name (e.g. <em>PassionFruit</em>).</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Under <strong>Admin API access scopes</strong>, enable: <code className="bg-slate-100 px-1 rounded">read_customers</code>, <code className="bg-slate-100 px-1 rounded">read_orders</code>, <code className="bg-slate-100 px-1 rounded">read_products</code>.</span>
              </li>
            </ol>
          </div>

          {/* Step 2: Credentials */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <h3 className="font-bold text-[#0D0F2D] mb-3 text-sm">Enter Shopify API Credentials</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Store Domain <span className="text-slate-400 font-normal">(e.g. mystore.myshopify.com)</span>
                </label>
                <input
                  {...register('storeName', {
                    required: 'Store domain is required',
                  })}
                  type="text"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96BF48]/30 focus:border-[#96BF48] transition-colors"
                  placeholder="mystore.myshopify.com"
                />
                {errors.storeName && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.storeName.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Admin API Access Token</label>
                <input
                  {...register('accessToken', {
                    required: 'Admin API access token is required',
                  })}
                  type="password"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96BF48]/30 focus:border-[#96BF48] transition-colors font-mono"
                  placeholder="shpat_..."
                />
                {errors.accessToken && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.accessToken.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Webhooks */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <h3 className="font-bold text-[#0D0F2D] mb-3 text-sm">Set up Webhooks (Automated Workflows)</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <p className="text-xs">In Shopify Admin → <strong>Settings → Notifications → Webhooks</strong>, create webhooks pointing to:</p>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs break-all">
                <span className="flex-1">{webhookUrl}</span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(webhookUrl)}
                  className="text-purple-600 hover:text-purple-800 flex-shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <ul className="space-y-1 text-xs">
                <li>• <strong>Customer created</strong> (Welcome WhatsApp message)</li>
                <li>• <strong>Order creation</strong> (Order confirmation & shipping updates)</li>
                <li>• <strong>Checkout abandonment</strong> (Cart recovery reminder)</li>
              </ul>
              <div className="mt-3">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Webhook Signing Secret <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  {...register('webhookSecret')}
                  type="password"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#96BF48]/30 focus:border-[#96BF48] transition-colors"
                  placeholder="Paste Shopify signing secret..."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#96BF48] hover:bg-[#7ea83a] px-5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              form="shopify-form"
              disabled={saving}
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-5 py-2 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying &amp; Connecting...
                </>
              ) : (
                'Connect Shopify'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── WooCommerce Connection Modal (Optimized with react-hook-form) ─────────────
function WooModal({ onClose, onSave }: { onClose: () => void; onSave: (d: any) => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<WooFormValues>({
    defaultValues: { siteUrl: '', consumerKey: '', consumerSecret: '', webhookSecret: '' },
    mode: 'onTouched',
  });

  const webhookUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/api/webhooks/woocommerce`;

  const onSubmit = async (values: WooFormValues) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          platform: 'woocommerce',
          siteUrl: values.siteUrl,
          consumerKey: values.consumerKey,
          consumerSecret: values.consumerSecret,
          webhookSecret: values.webhookSecret,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access denied. Please ensure your account has administrator or approved workspace privileges.');
        }
        throw new Error(data.error || data.details || 'Connection failed. Please check your WooCommerce credentials.');
      }
      onSave({ siteUrl: values.siteUrl, connectedAt: new Date().toISOString() });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to connect WooCommerce');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      const isValid = await trigger(['siteUrl', 'consumerKey', 'consumerSecret']);
      if (!isValid) return;
    }
    setStep((s) => s + 1);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center">
              <span className="text-lg">🛒</span>
            </div>
            <div>
              <h2 className="font-bold text-[#0D0F2D] text-sm">Connect WooCommerce</h2>
              <p className="text-xs text-slate-400">Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex gap-1.5 px-6 pt-4">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-[#7C3AED]' : 'bg-slate-200'}`}
            />
          ))}
        </div>

        {/* Form Content */}
        <form id="woo-form" onSubmit={handleSubmit(onSubmit)} className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Step 1: Guide */}
          <div className={step === 1 ? 'block' : 'hidden'}>
            <h3 className="font-bold text-[#0D0F2D] mb-3 text-sm">Generate API Keys in WooCommerce</h3>
            <ol className="space-y-3 text-sm text-slate-600">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                <span>In your WordPress Admin, go to <strong>WooCommerce → Settings → Advanced → REST API</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                <span>Click <strong>Add key</strong>, set Description to <em>PassionFruit</em>, User to an Administrator, and Permissions to <strong>Read/Write</strong>.</span>
              </li>
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                <span>Click <strong>Generate API key</strong> and copy the Consumer Key and Consumer Secret.</span>
              </li>
            </ol>
          </div>

          {/* Step 2: Credentials */}
          <div className={step === 2 ? 'block' : 'hidden'}>
            <h3 className="font-bold text-[#0D0F2D] mb-3 text-sm">Enter Your WooCommerce Store Credentials</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  WordPress Site URL <span className="text-slate-400 font-normal">(e.g. https://myshop.com)</span>
                </label>
                <input
                  {...register('siteUrl', {
                    required: 'WordPress site URL is required',
                  })}
                  type="text"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors"
                  placeholder="https://myshop.com"
                />
                {errors.siteUrl && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.siteUrl.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Consumer Key</label>
                <input
                  {...register('consumerKey', {
                    required: 'Consumer Key is required',
                  })}
                  type="password"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors font-mono"
                  placeholder="ck_..."
                />
                {errors.consumerKey && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.consumerKey.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Consumer Secret</label>
                <input
                  {...register('consumerSecret', {
                    required: 'Consumer Secret is required',
                  })}
                  type="password"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors font-mono"
                  placeholder="cs_..."
                />
                {errors.consumerSecret && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{errors.consumerSecret.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Webhooks & Automatic Sync */}
          <div className={step === 3 ? 'block' : 'hidden'}>
            <h3 className="font-bold text-[#0D0F2D] mb-3 text-sm">Automated Webhooks &amp; Security</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-800 space-y-0.5">
                  <p className="font-bold">Automatic Webhook Registration</p>
                  <p className="text-emerald-700 leading-relaxed">
                    When you click connect, Passion Fruit will verify your credentials and automatically register your WordPress webhooks for real-time customer and order sync.
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Your Webhook Target URL</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs break-all">
                  <span className="flex-1">{webhookUrl}</span>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(webhookUrl)}
                    className="text-purple-600 hover:text-purple-800 flex-shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom Webhook Secret <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  {...register('webhookSecret')}
                  type="password"
                  className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-colors font-mono"
                  placeholder="Custom secret key..."
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 flex justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-4 py-2 rounded-xl border border-slate-200 transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-5 py-2 rounded-xl transition-colors cursor-pointer"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="submit"
              form="woo-form"
              disabled={saving}
              className="flex items-center gap-2 text-xs font-bold text-white bg-[#7C3AED] hover:bg-[#6D28D9] px-5 py-2 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying &amp; Connecting...
                </>
              ) : (
                'Connect WooCommerce'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Memoized Platform Card Component (Prevents Unnecessary Re-renders) ───────
const PlatformCard = memo(function PlatformCard({
  name,
  icon,
  description,
  isConnected,
  connectedInfo,
  accentColor,
  onConnect,
  onDisconnect,
}: {
  name: string;
  icon: React.ReactNode;
  description: string;
  isConnected: boolean;
  connectedInfo?: string;
  accentColor: string;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${accentColor}`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-[#0D0F2D] text-sm">{name}</h3>
            {isConnected && connectedInfo && (
              <p className="text-[10px] text-slate-400 font-mono">{connectedInfo}</p>
            )}
          </div>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
            isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
          }`}
        >
          {isConnected ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          {isConnected ? 'Connected' : 'Not connected'}
        </div>
      </div>

      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>

      <div className="pt-2 border-t border-slate-100 flex gap-2">
        {isConnected ? (
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" /> Disconnect
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#6366F1] hover:from-[#6D28D9] hover:to-[#4F46E5] px-4 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Plug className="w-3 h-3" /> Connect
          </button>
        )}
      </div>
    </div>
  );
});

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function DashboardIntegrationsPage() {
  const [openModal, setOpenModal] = useState<null | 'shopify' | 'woocommerce'>(null);
  const [loading, setLoading] = useState(true);
  const [integrations, setIntegrations] = useState<any>({ shopify: {}, woocommerce: {} });

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/integrations', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(data.integrations || {});
      }
    } catch (e) {
      console.error('Failed to load integrations', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const handleDisconnect = useCallback(
    async (platform: string) => {
      await fetch(`/api/integrations?platform=${platform}`, { method: 'DELETE', credentials: 'include' });
      fetchIntegrations();
    },
    [fetchIntegrations]
  );

  return (
    <div className="min-h-screen bg-[#F4F6FB] flex font-sans text-[#0D0F2D]">
      <Sidebar />
      <div className="flex-1 ml-0 md:ml-60 flex flex-col">
        <Header title="E-Commerce Integrations" subtitle="Connect your store to trigger automated WhatsApp workflows" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 space-y-8">
          {/* Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShoppingBag className="w-4 h-4" />
              <span>Connect your e-commerce store to automate WhatsApp messages</span>
            </div>
            <button
              onClick={fetchIntegrations}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-6 h-6 animate-spin text-[#7C3AED]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PlatformCard
                name="Shopify"
                icon={<ShoppingBag className="w-6 h-6 text-[#96BF48]" />}
                description="Recover abandoned carts, send order confirmations, and dispatch shipping updates automatically to customer WhatsApp numbers."
                isConnected={integrations.shopify?.connected}
                connectedInfo={integrations.shopify?.storeName}
                accentColor="bg-[#96BF48]/10"
                onConnect={() => setOpenModal('shopify')}
                onDisconnect={() => handleDisconnect('shopify')}
              />
              <PlatformCard
                name="WooCommerce"
                icon={<span className="text-2xl">🛒</span>}
                description="Notify WordPress shoppers of order status changes, dispatch invoices, and re-engage lapsed buyers via WhatsApp."
                isConnected={integrations.woocommerce?.connected}
                connectedInfo={integrations.woocommerce?.siteUrl}
                accentColor="bg-purple-50"
                onConnect={() => setOpenModal('woocommerce')}
                onDisconnect={() => handleDisconnect('woocommerce')}
              />
            </div>
          )}

          {/* Store Data Overview (Customers, Orders, Products Live Sync) */}
          <StoreDataOverview
            key={`${integrations.shopify?.connected}_${integrations.woocommerce?.connected}`}
            hasShopify={Boolean(integrations.shopify?.connected)}
            hasWooCommerce={Boolean(integrations.woocommerce?.connected)}
            onRefreshIntegrations={fetchIntegrations}
          />

          {/* How it works */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#0D0F2D] text-sm mb-4">How Automation Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: '🛒', title: 'Customer Action', desc: 'A customer creates an account, places an order, or abandons their cart.' },
                { icon: '⚡', title: 'Webhook Fires', desc: 'Shopify or WooCommerce sends a real-time webhook to Passion Fruit.' },
                { icon: '💬', title: 'WhatsApp Sent', desc: 'An automated, personalised WhatsApp message is sent to the customer.' },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 p-4 bg-[#F4F6FB] rounded-2xl">
                  <span className="text-2xl">{step.icon}</span>
                  <div>
                    <p className="text-xs font-bold text-[#0D0F2D]">{step.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Webhook URLs reference */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-[#0D0F2D] text-sm mb-4">Your Webhook Endpoints</h3>
            <div className="space-y-3">
              {[
                { label: 'Shopify Webhook URL', url: '/api/webhooks/shopify' },
                { label: 'WooCommerce Webhook URL', url: '/api/webhooks/woocommerce' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 bg-[#F4F6FB] rounded-xl p-3 border border-slate-100">
                  <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] font-mono text-[#7C3AED] bg-purple-50 px-2 py-1 rounded-lg">{item.url}</code>
                    <button
                      onClick={() => typeof window !== 'undefined' && navigator.clipboard.writeText(window.location.origin + item.url)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Modals with React Hook Form for 0ms typing lag */}
      {openModal === 'shopify' && (
        <ShopifyModal
          onClose={() => setOpenModal(null)}
          onSave={() => { setOpenModal(null); fetchIntegrations(); }}
        />
      )}
      {openModal === 'woocommerce' && (
        <WooModal
          onClose={() => setOpenModal(null)}
          onSave={() => { setOpenModal(null); fetchIntegrations(); }}
        />
      )}
    </div>
  );
}
