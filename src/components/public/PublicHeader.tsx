import Link from 'next/link';
import Image from 'next/image';
import { PublicNavMain } from './PublicNavMain';
import { listPublicResearchGroups } from '@/server/public/queries/researchPublic';

const utilityLinks = [
  { label: 'ePortal', href: 'https://eportal.oauife.edu.ng' },
  { label: 'NetQue', href: 'https://netque.oauife.edu.ng' },
  { label: 'PEPSA', href: '#' },
  { label: 'Our Alumni', href: '#' },
];

export async function PublicHeader() {
  const researchGroups = await listPublicResearchGroups();

  return (
    <header>
      {/* ── White utility bar ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <Image
              src="/assets/logoPrimary.svg"
              alt="Department of Physics and Engineering Physics"
              width={360}
              height={64}
              className="h-10 sm:h-12 w-auto"
              priority
            />
          </Link>

          {/* Right side: utility links + CTA */}
          <div className="hidden lg:flex items-center gap-6">
            {utilityLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-gray-600 hover:text-brand-navy transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="#"
              className="bg-brand-yellow text-brand-ink text-sm font-semibold px-5 py-2 hover:bg-yellow-500 transition-colors"
            >
              Give to Physics
            </Link>
          </div>
        </div>
      </div>

      {/* ── Navy nav bar ── */}
      <div className="bg-brand-navy">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <PublicNavMain researchGroups={researchGroups} />
        </div>
      </div>
    </header>
  );
}
