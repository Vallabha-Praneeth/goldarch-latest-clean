/**
 * Public Quote View Page
 * Accessible via shareable link
 * Path: /quote/[token]
 */

import PublicQuoteView from '@/components/quote/PublicQuoteView';

export default function QuotePage({ params }: { params: Promise<{ token: string }> }) {
  return <PublicQuoteView params={params} />;
}
