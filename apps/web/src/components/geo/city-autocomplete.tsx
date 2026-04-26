'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Command, CommandInput, CommandList, CommandItem } from 'cmdk';

export function CityAutocomplete({
  value,
  onChange,
}: {
  value: { city: string; state_code: string } | null;
  onChange: (v: { city: string; state_code: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ city: string; state_code: string; population: number }>>([]);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    const fetchCities = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('geo_zips')
        .select('city, state_code, population')
        .ilike('city', `${query}%`)
        .order('population', { ascending: false })
        .limit(20);

      // Dedup by city+state
      const unique = new Map<string, { city: string; state_code: string; population: number }>();
      (data || []).forEach((r) => {
        const key = `${r.city},${r.state_code}`;
        if (!unique.has(key)) unique.set(key, r as any);
      });
      setResults(Array.from(unique.values()));
    };

    const timer = setTimeout(fetchCities, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="glass rounded-lg p-2">
      <Command shouldFilter={false}>
        <CommandInput
          value={query}
          onValueChange={setQuery}
          placeholder={value ? `${value.city}, ${value.state_code}` : 'Type a city name...'}
          className="w-full bg-transparent border-none outline-none px-3 py-2"
        />
        {results.length > 0 && (
          <CommandList className="max-h-60 overflow-y-auto mt-2">
            {results.map((r) => (
              <CommandItem
                key={`${r.city}-${r.state_code}`}
                onSelect={() => {
                  onChange({ city: r.city, state_code: r.state_code });
                  setQuery('');
                  setResults([]);
                }}
                className="px-3 py-2 hover:bg-white/[0.04] cursor-pointer rounded"
              >
                <span className="font-medium">{r.city}</span>
                <span className="text-text-muted ml-2">{r.state_code}</span>
                {r.population && (
                  <span className="text-text-muted ml-auto text-xs">
                    {r.population.toLocaleString()} pop.
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandList>
        )}
      </Command>
    </div>
  );
}
