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
    <div className="min-h-screen bg-aurora relative overflow-hidden px-6 py-12">
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="max-w-4xl mx-auto space-y-6 relative">
        <div className="card-surface rounded-3xl p-8">
          <p className="text-xs font-mono uppercase tracking-[0.35em] text-gray-500 dark:text-muted-foreground mb-4">
            Diagnostics
          </p>
          <h1 className="text-2xl font-display font-semibold text-gray-900 dark:text-foreground">
            Debug Console
          </h1>
          <p className="text-sm text-gray-600 dark:text-muted-foreground mt-2">
            Status: <span className="font-mono">{status}</span>
          </p>
        </div>
        <div className="card-surface rounded-2xl p-6">
          <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-muted-foreground font-mono">
            {JSON.stringify(details, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
