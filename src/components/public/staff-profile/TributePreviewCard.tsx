'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function TributePreviewCard({
  name,
  relationship,
  submittedAtLabel,
  tributeText,
}: {
  name: string;
  relationship: string | null;
  submittedAtLabel: string;
  tributeText: string;
}) {
  const [open, setOpen] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLParagraphElement>(null);

  const recomputeReadMore = useCallback(() => {
    if (!measureRef.current) return;

    const styles = window.getComputedStyle(measureRef.current);
    const lineHeightRaw = parseFloat(styles.lineHeight);
    const fontSizeRaw = parseFloat(styles.fontSize);
    const lineHeight =
      Number.isFinite(lineHeightRaw) && lineHeightRaw > 0
        ? lineHeightRaw
        : Number.isFinite(fontSizeRaw) && fontSizeRaw > 0
          ? fontSizeRaw * 1.75
          : 28;

    const fullHeight = measureRef.current.getBoundingClientRect().height;
    const fullLineCount = fullHeight / lineHeight;
    const maxLines = window.matchMedia('(max-width: 767px)').matches ? 5 : 3;

    setShowReadMore(fullLineCount - maxLines > 0.1);
  }, []);

  useEffect(() => {
    recomputeReadMore();

    const handleResize = () => recomputeReadMore();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (wrapperRef.current) {
      observer = new ResizeObserver(() => {
        recomputeReadMore();
      });
      observer.observe(wrapperRef.current);
    }

    if (typeof document !== 'undefined' && 'fonts' in document) {
      void (document as Document & { fonts: FontFaceSet }).fonts.ready.then(() => {
        recomputeReadMore();
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
    };
  }, [recomputeReadMore]);

  return (
    <>
      <article className="border border-gray-200 p-4">
        <header className="mb-2 text-base text-gray-600">
          <span className="font-semibold text-gray-800">{name}</span>
          {relationship ? ` (${relationship})` : ''}
          {` • ${submittedAtLabel}`}
        </header>

        <div ref={wrapperRef} className="relative">
          <p className="line-clamp-5 md:line-clamp-3 whitespace-pre-line text-base text-gray-700">
            {tributeText}
          </p>
          <p
            ref={measureRef}
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 whitespace-pre-line text-base leading-7 text-gray-700 opacity-0"
          >
            {tributeText}
          </p>
        </div>

        {showReadMore ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-3 text-base font-semibold text-brand-navy hover:underline"
          >
            Read more
          </button>
        ) : null}
      </article>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl sm:rounded-none">
          <DialogHeader className="pr-12 text-left sm:pr-0">
            <DialogTitle className="text-lg text-brand-navy">Tribute</DialogTitle>
            <DialogDescription className="text-base text-gray-600">
              <span className="font-semibold text-gray-800">{name}</span>
              {relationship ? ` (${relationship})` : ''}
              {` • ${submittedAtLabel}`}
            </DialogDescription>
          </DialogHeader>
          <p className="whitespace-pre-line text-base leading-7 text-gray-700">{tributeText}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
