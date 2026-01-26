'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function DebugPage() {
  const [status, setStatus] = useState('Loading...');
  const [details, setDetails] = useState({});

  useEffect(() => {
    (async () => {
      try {
        setStatus('Testing Supabase connection...');

        // Test 1: Check if supabase client exists
        setDetails(prev => ({ ...prev, clientExists: !!supabase }));

        // Test 2: Try to fetch suppliers
        const { data, error } = await supabase
          .from('suppliers')
          .select('*')
          .limit(5);

        if (error) {
          setStatus('Error!');
          setDetails(prev => ({
            ...prev,
            error: error.message,
            errorDetails: JSON.stringify(error, null, 2)
          }));
        } else {
          setStatus('Success!');
          setDetails(prev => ({
            ...prev,
            count: data.length,
            sample: data.length > 0 ? data[0] : null,
            allData: JSON.stringify(data, null, 2)
          }));
        }

        // Test 3: Check environment variables
        setDetails(prev => ({
          ...prev,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
          supabaseKeyExists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        }));

      } catch (e) {
        setStatus('Exception!');
        setDetails(prev => ({
          ...prev,
          exception: e.message,
          stack: e.stack
        }));
      }
    })();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', background: '#000', color: '#0f0', minHeight: '100vh' }}>
      <h1>Debug Page</h1>
      <h2>Status: {status}</h2>
      <pre style={{ background: '#222', padding: '20px', overflow: 'auto' }}>
        {JSON.stringify(details, null, 2)}
      </pre>
    </div>
  );
}
