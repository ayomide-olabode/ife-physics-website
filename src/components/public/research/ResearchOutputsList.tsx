'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, SlidersHorizontal } from 'lucide-react';

type ResearchOutputItem = {
  id: string;
  title: string;
  year: number | null;
  fullDate: string | Date | null;
  outputType: string;
  authors: string;
  sourceTitle: string | null;
  venue: string | null;
  publisher: string | null;
  doi: string | null;
  url: string | null;
};

type PaginatedResponse = {
  items: ResearchOutputItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

function formatOutputType(outputType: string) {
  return outputType
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getYear(item: ResearchOutputItem) {
  if (item.fullDate) {
    return new Date(item.fullDate).getFullYear();
  }
  return item.year;
}

export function ResearchOutputsList({
  groupId,
  initial,
}: {
  groupId: string;
  initial: PaginatedResponse;
}) {
  const [items, setItems] = useState<ResearchOutputItem[]>(initial.items);
  const [page, setPage] = useState(initial.page);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [total, setTotal] = useState(initial.total);
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [searching, setSearching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const filteredItems = useMemo(
    () => (linkedOnly ? items.filter((item) => item.url || item.doi) : items),
    [items, linkedOnly],
  );

  const fetchPage = async (targetPage: number, q: string) => {
    const params = new URLSearchParams();
    params.set('page', String(targetPage));
    if (q.trim()) {
      params.set('q', q.trim());
    }
    const res = await fetch(`/api/public/research/groups/${groupId}/outputs?${params.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (!res.ok) {
      throw new Error('Failed to fetch research outputs');
    }
    const payload = (await res.json()) as PaginatedResponse;
    return payload;
  };

  const handleSearch = async () => {
    try {
      setSearching(true);
      const payload = await fetchPage(1, queryInput);
      setItems(payload.items);
      setTotal(payload.total);
      setPage(payload.page);
      setHasMore(payload.hasMore);
      setActiveQuery(queryInput.trim());
    } catch {
      // Keep existing results on transient fetch error.
    } finally {
      setSearching(false);
    }
  };

  const handleLoadMore = async () => {
    try {
      setLoadingMore(true);
      const payload = await fetchPage(page + 1, activeQuery);
      setItems((prev) => [...prev, ...payload.items]);
      setTotal(payload.total);
      setPage(payload.page);
      setHasMore(payload.hasMore);
    } catch {
      // Keep already-rendered list if next page fetch fails.
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row gap-3">
        <Button
          type="button"
          variant="outline"
          className="rounded-none w-full md:w-auto"
          onClick={() => setLinkedOnly((prev) => !prev)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          {linkedOnly ? 'Filter: Linked Only' : 'Filter: All'}
        </Button>

        <div className="relative flex-1">
          <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                void handleSearch();
              }
            }}
            placeholder="Search title, authors, year, source..."
            className="pl-9 rounded-none"
          />
        </div>

        <Button type="button" className="rounded-none" onClick={handleSearch} disabled={searching}>
          {searching ? 'Searching...' : 'Search'}
        </Button>
      </div>

      <div className="text-sm text-gray-500">
        Showing {filteredItems.length} of {total} research outputs
      </div>

      {filteredItems.length === 0 ? (
        <div className="border border-gray-200 bg-white p-6 text-sm text-gray-500 rounded-none">
          No research outputs found.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const year = getYear(item);
            const source = item.sourceTitle || item.venue || item.publisher || null;

            return (
              <article
                key={item.id}
                className="border border-gray-200 bg-white p-4 rounded-none space-y-1"
              >
                <h3 className="text-brand-navy font-semibold leading-snug">{item.title}</h3>
                <p className="text-xs text-gray-500">
                  {year ?? 'n.d.'} • {formatOutputType(item.outputType)}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">{item.authors}</p>
                {source && <p className="text-sm italic text-gray-600">{source}</p>}
                {(item.url || item.doi) && (
                  <p className="text-sm text-gray-600 break-all">
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-navy hover:underline"
                      >
                        {item.url}
                      </a>
                    ) : (
                      <a
                        href={`https://doi.org/${item.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-navy hover:underline"
                      >
                        https://doi.org/{item.doi}
                      </a>
                    )}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {hasMore && !linkedOnly && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            className="rounded-none"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load more'}
          </Button>
        </div>
      )}
    </div>
  );
}
