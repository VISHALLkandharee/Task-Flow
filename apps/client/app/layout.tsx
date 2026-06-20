import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/lib/providers';
import ToastContainer from '@/components/ui/ToastContainer';

export const metadata: Metadata = {
  title: 'TaskFlow — Team Task Manager',
  description: 'Manage your team projects and tasks efficiently',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}