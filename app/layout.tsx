import './globals.css';
import { Toaster } from 'sonner';

export const metadata = {
  title: 'Golf Sim',
  description: 'Next.js + TS migration of Golf Simulator',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Toaster richColors position="top-right" />
        {children}
      </body>
    </html>
  );
}


