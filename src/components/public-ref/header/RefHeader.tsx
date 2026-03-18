import { RefHeaderTop } from './RefHeaderTop';
import { RefNavbar } from './RefNavbar';
import { RefMobileMenu } from './RefMobileMenu';

export function RefHeader() {
  return (
    <header className="sticky top-0 z-50 flex flex-col bg-white">
      <RefHeaderTop />
      <RefNavbar />
      <RefMobileMenu />
    </header>
  );
}
