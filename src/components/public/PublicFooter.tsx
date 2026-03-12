import Link from 'next/link';
import Image from 'next/image';
import { Linkedin, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

const socialLinks = [
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'X (Twitter)' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Youtube, href: '#', label: 'YouTube' },
];

const aboutLinks = [
  { label: 'Mission and Vision', href: '/about' },
  { label: 'Strategy Document', href: '/about' },
  { label: 'Handbook', href: '/resources' },
  { label: 'Legacy Gallery', href: '/about' },
];

const quickLinks = [
  { label: 'PEPSA', href: '#' },
  { label: 'ePortal', href: 'https://eportal.oauife.edu.ng' },
  { label: 'NetQue', href: 'https://netque.oauife.edu.ng' },
  { label: 'Alumni', href: '#' },
  { label: 'Resources', href: '/resources' },
];

export function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-ink text-brand-white">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          {/* ── Left block: logo + social + CTA ── */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Image
              src="/assets/logoSecondary.svg"
              alt="Department of Physics and Engineering Physics"
              width={360}
              height={64}
              className="h-10 sm:h-12 w-auto"
            />

            {/* Social icons */}
            <div className="flex items-center gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <Link
                    key={social.label}
                    href={social.href}
                    className="text-gray-400 hover:text-brand-yellow transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>

            <Link
              href="#"
              className="inline-block bg-brand-yellow text-brand-ink text-sm font-semibold px-6 py-2.5 rounded hover:bg-yellow-500 transition-colors w-fit"
            >
              GIVE TO PHYSICS
            </Link>
          </div>

          {/* ── About Us column ── */}
          <div className="lg:col-span-2">
            <h3 className="font-serif font-semibold text-base mb-4">About Us</h3>
            <ul className="space-y-2.5">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-yellow transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Contact column ── */}
          <div className="lg:col-span-3">
            <h3 className="font-serif font-semibold text-base mb-4">Contact</h3>
            <address className="not-italic text-sm text-gray-400 space-y-1.5">
              <p>Faculty of Science</p>
              <p>University Road 2</p>
              <p>Whitehouse Building</p>
              <p>220282 Ile-Ife, Nigeria</p>
              <p className="pt-2">
                <Link
                  href="mailto:peph@oauife.edu.ng"
                  className="hover:text-brand-yellow transition-colors"
                >
                  peph@oauife.edu.ng
                </Link>
              </p>
              <p>
                <Link
                  href="tel:+2349036368824"
                  className="hover:text-brand-yellow transition-colors"
                >
                  +234 903 636 8824
                </Link>
              </p>
            </address>
          </div>

          {/* ── Quick Links column ── */}
          <div className="lg:col-span-3">
            <h3 className="font-serif font-semibold text-base mb-4">Quick Links</h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-brand-yellow transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom divider + copyright ── */}
        <div className="border-t border-white/10 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>&copy; {currentYear} All Rights Reserved</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-brand-yellow transition-colors">
              Privacy Policy
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="#" className="hover:text-brand-yellow transition-colors">
              Terms of Use
            </Link>
            <span className="text-gray-600">/</span>
            <Link href="#" className="hover:text-brand-yellow transition-colors">
              Accessibility Statement
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
