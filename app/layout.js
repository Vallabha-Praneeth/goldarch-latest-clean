import { ThemeProvider } from '../lib/theme-context';
import { Providers } from '../components/providers';
import './globals.css';

export const metadata = {
  title: 'Gold.Arch Construction CRM',
  description: 'Supplier and project management for Gold.Arch Construction',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
