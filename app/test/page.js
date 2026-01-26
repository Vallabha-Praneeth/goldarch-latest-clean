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
      <div style={{ padding: '40px', fontFamily: 'monospace', background: '#000', color: '#0f0', minHeight: '100vh' }}>
        <h1>Testing Supabase Connection...</h1>
        <div className="spinner" style={{ marginTop: '20px' }}>⏳ Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'monospace', background: '#000', color: '#f00', minHeight: '100vh' }}>
        <h1>❌ Error!</h1>
        <pre style={{ background: '#222', padding: '20px', color: '#f00' }}>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'monospace', background: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>✅ Connection Successful!</h1>

      <h2 style={{ marginTop: '30px' }}>Summary:</h2>
      <div style={{ background: '#222', padding: '20px', marginTop: '10px' }}>
        <p>Total Suppliers: <strong>{data.count}</strong></p>
        <p>Total Categories: <strong>{data.categories.length}</strong></p>
      </div>

      <h2 style={{ marginTop: '30px' }}>Categories:</h2>
      <ul style={{ background: '#222', padding: '20px', marginTop: '10px' }}>
        {data.categories.map((cat, i) => (
          <li key={i}>{cat}</li>
        ))}
      </ul>

      <h2 style={{ marginTop: '30px' }}>First 5 Suppliers:</h2>
      <div style={{ background: '#222', padding: '20px', marginTop: '10px' }}>
        {data.suppliers.map((supplier, i) => (
          <div key={i} style={{ marginBottom: '15px', borderBottom: '1px solid #444', paddingBottom: '10px' }}>
            <strong>{supplier.name}</strong>
            <br />
            <small>Category: {supplier.category?.name || 'N/A'}</small>
            <br />
            <small>City: {supplier.city || 'N/A'}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
