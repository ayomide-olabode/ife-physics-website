'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/dashboard/DataTable';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { toastError, toastSuccess } from '@/lib/toast';
import { setFeaturedResearchOutput } from '@/server/actions/researchGroupOutputs';
import { Loader2, Star } from 'lucide-react';

type ResearchOutputRow = {
  id: string;
  outputType: string;
  title: string;
  authorsDisplay: string;
  year: number | null;
  doi: string | null;
  isFeatured: boolean;
};

export function ResearchGroupOutputsTableClient({
  groupId,
  items,
}: {
  groupId: string;
  items: ResearchOutputRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingOutputId, setPendingOutputId] = useState<string | null>(null);

  const handleToggleFeatured = (item: ResearchOutputRow) => {
    startTransition(async () => {
      setPendingOutputId(item.id);
      const outputId = item.isFeatured ? null : item.id;
      const res = await setFeaturedResearchOutput({ groupId, outputId });
      if (res.success) {
        toastSuccess(
          outputId ? 'Featured Research Output updated.' : 'Featured Research Output cleared.',
        );
        router.refresh();
      } else {
        toastError(res.error || 'Failed to update Featured Research Output.');
      }
      setPendingOutputId(null);
    });
  };

  const rows = items.map((item) => [
    <span key={`type-${item.id}`} className="text-xs font-semibold uppercase tracking-wide">
      {item.outputType.replace(/_/g, ' ')}
    </span>,
    <span key={`title-${item.id}`} className="font-medium line-clamp-1">
      {item.title}
    </span>,
    <span key={`authors-${item.id}`} className="text-sm text-muted-foreground line-clamp-1">
      {item.authorsDisplay}
    </span>,
    <span key={`year-${item.id}`} className="text-sm tabular-nums">
      {item.year ?? '—'}
    </span>,
    item.doi ? (
      <a
        key={`doi-${item.id}`}
        href={`https://doi.org/${item.doi}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-mono text-xs text-blue-600 hover:underline line-clamp-1"
      >
        {item.doi}
      </a>
    ) : (
      <span key={`doi-${item.id}`} className="text-sm text-muted-foreground">
        —
      </span>
    ),
    <button
      key={`featured-${item.id}`}
      type="button"
      onClick={() => handleToggleFeatured(item)}
      disabled={isPending}
      className="inline-flex items-center text-muted-foreground hover:text-yellow-500 disabled:opacity-60"
      title={item.isFeatured ? 'Clear featured research output' : 'Set as featured research output'}
    >
      {isPending && pendingOutputId === item.id ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Star className={`h-4 w-4 ${item.isFeatured ? 'fill-yellow-500 text-yellow-500' : ''}`} />
      )}
    </button>,
  ]);

  return (
    <DataTable
      headers={['Output Type', 'Title', 'Author', 'Year', 'DOI', 'Featured']}
      rows={rows}
      emptyState={
        <EmptyState
          title="No research outputs yet"
          description="When group members add research outputs, they will appear here."
        />
      }
    />
  );
}
