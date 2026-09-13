'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { StoreDataHeader } from './StoreDataHeader';
import { CustomersTable, CustomerRow } from './CustomersTable';
import { OrdersTable, OrderRow } from './OrdersTable';
import { ProductsTable, ProductRow } from './ProductsTable';

interface StoreDataOverviewProps {
  hasShopify?: boolean;
  hasWooCommerce?: boolean;
  onRefreshIntegrations?: () => void;
}

export function StoreDataOverview({
  hasShopify = false,
  hasWooCommerce = false,
  onRefreshIntegrations,
}: StoreDataOverviewProps) {
  const [activeTab, setActiveTab] = useState<'customers' | 'orders' | 'products'>('customers');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);

  const isConnected = hasShopify || hasWooCommerce;

  const fetchData = useCallback(async () => {
    if (!isConnected) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ecommerce/sync?platform=all', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data.customers) ? data.customers : []);
        setOrders(Array.isArray(data.orders) ? data.orders : []);
        setProducts(Array.isArray(data.products) ? data.products : []);
      }
    } catch (e) {
      console.warn('Failed to sync store data:', e);
    } finally {
      setLoading(false);
    }
  }, [isConnected]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [customers, search]);

  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q));
  }, [products, search]);

  if (!isConnected) {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-5 sm:p-6 space-y-4">
        <StoreDataHeader
          isConnected={isConnected}
          loading={loading}
          searchQuery={search}
          onSearchChange={setSearch}
          onSync={fetchData}
        />

        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          {(['customers', 'orders', 'products'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab} (
              {tab === 'customers'
                ? filteredCustomers.length
                : tab === 'orders'
                ? filteredOrders.length
                : filteredProducts.length}
              )
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200/80 overflow-hidden bg-white">
          {activeTab === 'customers' && (
            <CustomersTable loading={loading} data={filteredCustomers} />
          )}
          {activeTab === 'orders' && (
            <OrdersTable loading={loading} data={filteredOrders} />
          )}
          {activeTab === 'products' && (
            <ProductsTable loading={loading} data={filteredProducts} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
