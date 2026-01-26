'use client';

import { QueryProvider } from '@/lib/query-provider';
import { AuthProvider } from '@/lib/auth-provider';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <AuthProvider>
        {children}
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryProvider>
  );
}
