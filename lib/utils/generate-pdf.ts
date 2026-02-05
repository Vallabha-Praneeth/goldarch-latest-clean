'use client';

export async function downloadQuotePDF(
  element: HTMLElement,
  quoteNumber: string
): Promise<void> {
  const html2pdf = (await import('html2pdf.js')).default;
  const safeQuoteNumber = quoteNumber.replace(/[^\w.-]+/g, '-') || 'quote';

  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Quote-${safeQuoteNumber}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const },
  };

  return html2pdf().set(opt).from(element).save();
}
