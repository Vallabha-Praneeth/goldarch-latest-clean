import { ThemeProvider } from '../lib/theme-context';
import './globals.css';

export const metadata = {
  title: 'Gold.Arch Construction CRM',
  description: 'Supplier and project management for Gold.Arch Construction',
  openGraph: {
    title: 'Gold.Arch Construction CRM',
    description: 'Supplier and project management for Gold.Arch Construction',
    type: 'website',
    images: [
      {
        url: '/placeholder.jpg',
        width: 1200,
        height: 630,
        alt: 'Gold.Arch supplier network preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gold.Arch Construction CRM',
    description: 'Supplier and project management for Gold.Arch Construction',
    images: ['/placeholder.jpg'],
  },
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
    shortcut: '/icon-light-32x32.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
