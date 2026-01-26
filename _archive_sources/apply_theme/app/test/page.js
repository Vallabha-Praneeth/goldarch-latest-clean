'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function TestPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('[TEST] Starting fetch...');

        const { data: suppliers, error: suppliersError, count } = await supabase
          .from('suppliers')
          .select('*, category:categories(name)', { count: 'exact' });

        if (suppliersError) throw suppliersError;

        console.log('[TEST] Success! Found', count, 'suppliers');

        setData({
          count,
          suppliers: suppliers.slice(0, 5),
          categories: [...new Set(suppliers.map(s => s.category?.name).filter(Boolean))]
        });
      } catch (e) {
        console.error('[TEST] Error:', e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-aurora relative overflow-hidden flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="card-surface rounded-3xl p-10 text-center max-w-xl w-full">
          <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-4">
            Diagnostics
          </p>
          <h1 className="text-2xl font-display font-semibold text-gray-900 dark:text-foreground">
            Testing Supabase Connection...
          </h1>
          <div className="mt-6 text-sm text-gray-600 dark:text-muted-foreground font-mono">
            ⏳ Loading...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-aurora relative overflow-hidden flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
        <div className="card-surface rounded-3xl p-10 text-left max-w-2xl w-full">
          <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-4">
            Diagnostics
          </p>
          <h1 className="text-2xl font-display font-semibold text-rose-600 mb-4">
            ❌ Error
          </h1>
          <pre className="whitespace-pre-wrap text-sm text-rose-500 font-mono bg-rose-50/60 dark:bg-rose-500/10 p-4 rounded-2xl border border-rose-200/60 dark:border-rose-500/20">
            {error}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-aurora relative overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="max-w-4xl mx-auto space-y-8 relative">
        <div className="card-surface rounded-3xl p-8">
          <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-4">
            Diagnostics
          </p>
          <h1 className="text-2xl font-display font-semibold text-emerald-600 mb-2">
            ✅ Connection Successful
          </h1>
          <p className="text-sm text-gray-600 dark:text-muted-foreground">
            Supabase read operations are returning expected data.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card-surface rounded-2xl p-6 space-y-3">
            <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-muted-foreground">
              Summary
            </h2>
            <p className="text-base text-gray-900 dark:text-foreground">
              Total Suppliers: <strong>{data.count}</strong>
            </p>
            <p className="text-base text-gray-900 dark:text-foreground">
              Total Categories: <strong>{data.categories.length}</strong>
            </p>
          </div>
          <div className="card-surface rounded-2xl p-6">
            <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-muted-foreground mb-3">
              Categories
            </h2>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-muted-foreground font-mono">
              {data.categories.map((cat, i) => (
                <li key={i}>• {cat}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="card-surface rounded-2xl p-6">
          <h2 className="text-sm font-mono uppercase tracking-[0.3em] text-gray-500 dark:text-muted-foreground mb-4">
            First 5 Suppliers
          </h2>
          <div className="space-y-4">
            {data.suppliers.map((supplier, i) => (
              <div key={i} className="pb-4 border-b border-white/40 dark:border-white/10">
                <p className="font-semibold text-gray-900 dark:text-foreground">{supplier.name}</p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  Category: {supplier.category?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                  City: {supplier.city || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
