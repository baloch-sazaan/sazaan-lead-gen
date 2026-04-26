import '../styles/globals.css';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sazaan Lead Engine',
  description: 'AI-Powered Lead Generation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-bg-base text-text-primary`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
