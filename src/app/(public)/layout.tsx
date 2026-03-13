import { RefHeader } from '@/components/public-ref/header/RefHeader';
import { PublicFooter } from '@/components/public/PublicFooter';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <RefHeader />
      <main className="min-h-screen">{children}</main>
      <PublicFooter />
    </>
  );
}
