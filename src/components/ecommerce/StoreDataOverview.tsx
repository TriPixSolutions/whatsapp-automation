'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Package,
  ShoppingBag,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Layers,
  MessageCircle,
  ExternalLink,
  Store,
  X,
  Clock,
} from 'lucide-react';

export interface UnifiedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  isValidForWhatsApp: boolean;
  dateAdded: string;
  platform: 'shopify' | 'woocommerce';
  ordersCount?: number;
  totalSpent?: string;
}

export interface UnifiedOrder {
  id: string;
  customerName: string;
  status: string;
  totalAmount: string;
  date: string;
  platform: 'shopify' | 'woocommerce';
  itemCount?: number;
}

export interface UnifiedProduct {
  id: string;
  name: string;
  image: string | null;
  price: string;
  stockStatus: string;
  platform: 'shopify' | 'woocommerce';
}

interface StoreDataOverviewProps {
  hasShopify?: boolean;
  hasWooCommerce?: boolean;
  onRefreshIntegrations?: () => void;
}

function StoreDataOverviewComponent({
  hasShopify = false,
  hasWooCommerce = false,
  onRefreshIntegrations,
}: StoreDataOverviewProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders' | 'products'>('customers');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'shopify' | 'woocommerce'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  const [customers, setCustomers] = useState<UnifiedCustomer[]>([]);
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [products, setProducts] = useState<UnifiedProduct[]>([]);

  const isConnected = hasShopify || hasWooCommerce;

  // Fetch data from /api/ecommerce/sync
  const fetchData = async (platformFilter: string = selectedPlatform) => {
    if (!isConnected) return;

    setLoading(true);
    setError(null);
    setErrorDetails(null);

    try {
      const res = await fetch(`/api/ecommerce/sync?platform=${platformFilter}`, {
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Failed to fetch data. Please check your API keys.', {
          cause: json.details,
        });
      }

      setCustomers(json.data?.customers || []);
      setOrders(json.data?.orders || []);
      setProducts(json.data?.products || []);
      setLastSynced(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setCurrentPage(1);
    } catch (err: any) {
      console.error('[StoreDataOverview] Sync error:', err);
      setError(err.message || 'Failed to fetch data. Please check your API keys.');
      if (err.cause) {
        setErrorDetails(err.cause);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch when connected platforms are loaded
  useEffect(() => {
    if (isConnected) {
      fetchData(selectedPlatform);
    }
  }, [isConnected, selectedPlatform]);

  // Reset page on search or tab change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  // ─── Filtered Data Lists ───────────────────────────────────────────────────
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customers.filter((c) => {
      const matchesPlatform = selectedPlatform === 'all' || c.platform === selectedPlatform;
      if (!matchesPlatform) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.whatsappNumber.includes(q)
      );
    });
  }, [customers, searchQuery, selectedPlatform]);

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      const matchesPlatform = selectedPlatform === 'all' || o.platform === selectedPlatform;
      if (!matchesPlatform) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q) ||
        o.totalAmount.toLowerCase().includes(q)
      );
    });
  }, [orders, searchQuery, selectedPlatform]);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesPlatform = selectedPlatform === 'all' || p.platform === selectedPlatform;
      if (!matchesPlatform) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.price.toLowerCase().includes(q) ||
        p.stockStatus.toLowerCase().includes(q)
      );
    });
  }, [products, searchQuery, selectedPlatform]);

  // Get active dataset for pagination
  const currentDataset = useMemo(() => {
    if (activeTab === 'customers') return filteredCustomers;
    if (activeTab === 'orders') return filteredOrders;
    return filteredProducts;
  }, [activeTab, filteredCustomers, filteredOrders, filteredProducts]);

  const totalPages = Math.ceil(currentDataset.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentDataset.slice(start, start + pageSize);
  }, [currentDataset, currentPage, pageSize]);

  // Status badge styling helper
  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('completed') || s.includes('paid') || s.includes('fulfilled')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s.includes('pending') || s.includes('authorized') || s.includes('unpaid')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s.includes('processing') || s.includes('partial')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s.includes('cancelled') || s.includes('refund') || s.includes('failed')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-slate-50 text-slate-600 border-slate-200';
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6 p-6 lg:p-7">
      {/* ─── Header & Top Controls ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                <span>Store Catalog &amp; Customer Directory</span>
                {isConnected && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Sync
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                Synced store customers, transactions, and inventory ready for automated WhatsApp messaging
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          {lastSynced && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mr-1 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>Synced {lastSynced}</span>
            </div>
          )}

          {/* Platform filter pills (if both connected) */}
          {hasShopify && hasWooCommerce && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                onClick={() => setSelectedPlatform('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedPlatform === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedPlatform('shopify')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedPlatform === 'shopify' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Shopify
              </button>
              <button
                onClick={() => setSelectedPlatform('woocommerce')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  selectedPlatform === 'woocommerce' ? 'bg-white text-indigo-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                WooCommerce
              </button>
            </div>
          )}

          {/* Sync Latest Data Button */}
          <button
            onClick={() => fetchData(selectedPlatform)}
            disabled={loading || !isConnected}
            className="flex items-center gap-2 text-xs font-bold text-white bg-slate-950 hover:bg-slate-800 px-4 py-2 rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync Store Data'}</span>
          </button>
        </div>
      </div>

      {/* ─── Error Alert Banner ───────────────────────────────────────────── */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs space-y-1">
            <p className="font-bold text-rose-900">{error}</p>
            {errorDetails && <p className="text-rose-700 leading-relaxed font-mono text-[11px]">{errorDetails}</p>}
            <p className="text-[11px] text-rose-600 pt-1">
              Verify your API credentials in the connection cards above. Ensure your token has read permissions for customers, orders, and products.
            </p>
          </div>
          <button
            onClick={() => fetchData(selectedPlatform)}
            className="text-xs font-bold text-rose-700 hover:text-rose-900 underline flex-shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* ─── If Not Connected Warning ─────────────────────────────────────── */}
      {!isConnected && (
        <div className="bg-[#F8FAFC] border border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7C3AED] flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-[#0D0F2D]">No E-Commerce Store Connected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Connect your Shopify or WooCommerce store using the setup cards above. Once connected, your customer contacts, orders, and catalog will automatically sync here.
          </p>
        </div>
      )}

      {/* ─── Connected View (Tabs & Tables) ────────────────────────────────── */}
      {isConnected && (
        <div className="space-y-4">
          {/* Tabs Navigation & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'customers'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Customers</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                    activeTab === 'customers'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {filteredCustomers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Orders</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                    activeTab === 'orders'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {filteredOrders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'products'
                    ? 'bg-white text-slate-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>Products</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold ${
                    activeTab === 'products'
                      ? 'bg-slate-100 text-slate-900'
                      : 'bg-slate-200/70 text-slate-500'
                  }`}
                >
                  {filteredProducts.length}
                </span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'customers'
                    ? 'Search customer name, email, or phone...'
                    : activeTab === 'orders'
                    ? 'Search order ID, customer, status...'
                    : 'Search product title, SKU, price...'
                }
                className="w-full text-xs pl-8 pr-8 py-2 bg-slate-50 border border-slate-200/80 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ─── Data Tables ─────────────────────────────────────────────────── */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
            <div className="overflow-x-auto">
              {/* 1. CUSTOMERS TABLE */}
              {activeTab === 'customers' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Email Address</th>
                      <th className="py-3 px-4">Phone (WhatsApp Automation)</th>
                      <th className="py-3 px-4">Date Added</th>
                      <th className="py-3 px-4 text-right">Store Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <SkeletonRows columns={5} />
                    ) : paginatedData.length === 0 ? (
                      <EmptyRow colSpan={5} message={searchQuery ? 'No customers matching search query.' : 'No customer records found in connected store.'} />
                    ) : (
                      (paginatedData as UnifiedCustomer[]).map((c) => (
                        <tr key={`${c.platform}_${c.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-purple-100 text-[#7C3AED] font-bold flex items-center justify-center text-[11px] flex-shrink-0">
                                {c.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-[#0D0F2D]">{c.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{c.email}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-semibold ${c.isValidForWhatsApp ? 'text-[#0D0F2D]' : 'text-slate-400 italic'}`}>
                                {c.phone}
                              </span>
                              {c.isValidForWhatsApp ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <MessageCircle className="w-2.5 h-2.5 text-emerald-600" /> WhatsApp Ready
                                </span>
                              ) : (
                                <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                  No Number
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{formatDate(c.dateAdded)}</td>
                          <td className="py-3 px-4 text-right">
                            <PlatformBadge platform={c.platform} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 2. ORDERS TABLE */}
              {activeTab === 'orders' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Order ID</th>
                      <th className="py-3 px-4">Customer Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Total Amount</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Store Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <SkeletonRows columns={6} />
                    ) : paginatedData.length === 0 ? (
                      <EmptyRow colSpan={6} message={searchQuery ? 'No orders matching search query.' : 'No orders found in connected store.'} />
                    ) : (
                      (paginatedData as UnifiedOrder[]).map((o) => (
                        <tr key={`${o.platform}_${o.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[#7C3AED]">{o.id}</td>
                          <td className="py-3 px-4 font-medium text-[#0D0F2D]">{o.customerName}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(o.status)}`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#0D0F2D]">{o.totalAmount}</td>
                          <td className="py-3 px-4 text-slate-500">{formatDate(o.date)}</td>
                          <td className="py-3 px-4 text-right">
                            <PlatformBadge platform={o.platform} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}

              {/* 3. PRODUCTS TABLE */}
              {activeTab === 'products' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4">Stock Status</th>
                      <th className="py-3 px-4 text-right">Store Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <SkeletonRows columns={4} />
                    ) : paginatedData.length === 0 ? (
                      <EmptyRow colSpan={4} message={searchQuery ? 'No products matching search query.' : 'No products found in connected store.'} />
                    ) : (
                      (paginatedData as UnifiedProduct[]).map((p) => (
                        <tr key={`${p.platform}_${p.id}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {p.image ? (
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center flex-shrink-0">
                                  <Package className="w-4 h-4" />
                                </div>
                              )}
                              <span className="font-bold text-[#0D0F2D] line-clamp-1">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-bold text-[#0D0F2D]">{p.price}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                p.stockStatus === 'In Stock'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : p.stockStatus === 'Out of Stock'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  p.stockStatus === 'In Stock'
                                    ? 'bg-emerald-500'
                                    : p.stockStatus === 'Out of Stock'
                                    ? 'bg-rose-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {p.stockStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <PlatformBadge platform={p.platform} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* ─── Pagination Bar ────────────────────────────────────────────── */}
            {!loading && currentDataset.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-[#F8FAFC] text-xs text-slate-500">
                <div>
                  Showing <span className="font-bold text-[#0D0F2D]">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                  <span className="font-bold text-[#0D0F2D]">
                    {Math.min(currentPage * pageSize, currentDataset.length)}
                  </span>{' '}
                  of <span className="font-bold text-[#0D0F2D]">{currentDataset.length}</span> entries
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>

                  <span className="text-xs font-bold text-[#0D0F2D] px-2">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    disabled={currentPage >= totalPages}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Platform Badge Helper ───────────────────────────────────────────────────
function PlatformBadge({ platform }: { platform: 'shopify' | 'woocommerce' }) {
  if (platform === 'shopify') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
        <ShoppingBag className="w-2.5 h-2.5 text-emerald-600" /> Shopify
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 border border-indigo-200/80">
      🛒 WooCommerce
    </span>
  );
}

// ─── Loading Skeleton Rows ───────────────────────────────────────────────────
function SkeletonRows({ columns }: { columns: number }) {
  return (
    <>
      {[1, 2, 3, 4, 5].map((row) => (
        <tr key={row} className="animate-pulse">
          {Array.from({ length: columns }).map((_, col) => (
            <td key={col} className="py-3.5 px-4">
              <div className="h-3.5 bg-slate-200 rounded-md w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ─── Empty State Row ─────────────────────────────────────────────────────────
function EmptyRow({ colSpan, message }: { colSpan: number; message: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-12 text-center text-slate-400">
        <p className="text-xs">{message}</p>
      </td>
    </tr>
  );
}

export const StoreDataOverview = React.memo(StoreDataOverviewComponent);
