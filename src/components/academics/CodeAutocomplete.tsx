'use client';

import * as React from 'react';
import { ProgrammeCode } from '@prisma/client';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { lookupCourseByCode } from '@/server/actions/postgraduateCourses';
import { useDebounce } from '@/hooks/useDebounce';

interface CodeAutocompleteProps {
  programmeCode: ProgrammeCode;
  value: string;
  onChange: (value: string) => void;
  onSelectExact: (code: string) => void;
  disabled?: boolean;
}

export function CodeAutocomplete({
  programmeCode,
  value,
  onChange,
  onSelectExact,
  disabled,
}: CodeAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const debouncedSearch = useDebounce(search, 300);

  const [results, setResults] = React.useState<Array<{ code: string; title: string }>>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    lookupCourseByCode({ programmeCode, codePrefix: debouncedSearch })
      .then((res) => {
        if (active) {
          setResults(res);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, programmeCode]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between"
        >
          {value || 'Select or type a course code...'}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type code (e.g. PHY701)..."
            value={search}
            onValueChange={(val) => {
              setSearch(val);
              onChange(val.toUpperCase()); // update the actual form value as they type
            }}
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? 'Searching...'
                : search.length < 2
                  ? 'Type at least 2 chars'
                  : 'No exact matches found.'}
            </CommandEmpty>
            <CommandGroup>
              {results.map((course) => (
                <CommandItem
                  key={course.code}
                  value={course.code}
                  onSelect={(currentValue) => {
                    onChange(currentValue.toUpperCase());
                    onSelectExact(currentValue.toUpperCase());
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === course.code ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  {course.code} - {course.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
