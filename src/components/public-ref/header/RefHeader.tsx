import { listPublicResearchGroups } from '@/server/public/queries/researchPublic';
import { RefHeaderTop } from './RefHeaderTop';
import { RefNavbar } from './RefNavbar';
import { RefMobileMenu } from './RefMobileMenu';

export async function RefHeader() {
  const researchGroups = await listPublicResearchGroups();

  return (
    <header className="sticky top-0 z-50 flex flex-col bg-white">
      <RefHeaderTop />
      <RefNavbar researchGroups={researchGroups} />
      <RefMobileMenu researchGroups={researchGroups} />
    </header>
  );
}
