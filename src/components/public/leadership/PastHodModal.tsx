'use client';

import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Prose } from '@/components/public/Prose';
import { formatPersonName } from '@/lib/name';

export interface PastHodModalItem {
  id: string;
  startYear: number | string;
  endYear: number | string | null;
  staff: {
    title?: string | null;
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
    profileImageUrl?: string | null;
  };
  address?: {
    title?: string | null;
    body?: string | null;
  } | null;
}

interface PastHodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PastHodModalItem | null;
}

function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function PastHodModal({ open, onOpenChange, item }: PastHodModalProps) {
  if (!item) {
    return null;
  }

  const baseName = formatPersonName({
    firstName: item.staff.firstName,
    middleName: item.staff.middleName,
    lastName: item.staff.lastName,
  });
  const name = [item.staff.title, baseName].filter(Boolean).join(' ') || 'Unknown Staff';
  const tenure = `${item.startYear}–${item.endYear ?? 'Present'}`;
  const addressTitle = item.address?.title?.trim();
  const addressBody = item.address?.body?.trim();
  const hasAddress = Boolean(addressTitle || addressBody);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-3xl max-h-[85vh] overflow-y-auto p-0">
        <div className="border-b border-gray-200 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-brand-navy">{name}</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">{tenure}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 p-6">
          <div className="relative w-full aspect-[3/4] bg-gray-100 border border-gray-200">
            {item.staff.profileImageUrl ? (
              <Image
                src={item.staff.profileImageUrl}
                alt={name}
                fill
                sizes="(max-width: 768px) 100vw, 260px"
                className="object-cover"
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                No Image
              </div>
            )}
          </div>

          <div className="space-y-4">
            {hasAddress ? (
              <>
                <h3 className="text-lg font-semibold text-brand-navy">
                  {addressTitle || 'Address'}
                </h3>
                {addressBody ? (
                  looksLikeHtml(addressBody) ? (
                    <Prose html={addressBody} className="prose-sm rounded-none" />
                  ) : (
                    <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {addressBody}
                    </div>
                  )
                ) : (
                  <p className="text-gray-500">No address available.</p>
                )}
              </>
            ) : (
              <p className="text-gray-500">No address available.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
