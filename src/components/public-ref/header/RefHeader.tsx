import { RefHeaderTop } from './RefHeaderTop';
import { RefNavbar } from './RefNavbar';
import { RefMobileMenu } from './RefMobileMenu';

export function RefHeader() {
  return (
    <header className="flex flex-col z-50">
      <RefHeaderTop />
      <RefNavbar />
      <RefMobileMenu />
    </header>
  );
}
