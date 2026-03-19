'use client';

import { FormEvent, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function PeopleToolbar({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialQuery);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams(searchParams.toString());
    const trimmed = query.trim();

    if (trimmed) {
      params.set('q', trimmed);
    } else {
      params.delete('q');
    }

    params.delete('page');

    const next = params.toString();
    router.push(next ? `${pathname}?${next}` : pathname);
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
      <Button type="button" variant="outline" className="rounded-none border-gray-300">
        <SlidersHorizontal className="h-4 w-4" />
        Filter
      </Button>

      <div className="relative w-full sm:w-[320px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search faculty"
          className="h-10 rounded-none border-gray-300 pl-9"
          aria-label="Search faculty"
        />
      </div>
    </form>
  );
}
