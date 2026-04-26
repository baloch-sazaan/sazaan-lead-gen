'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { StateMultiselect } from '@/components/geo/state-multiselect';
import { CityAutocomplete } from '@/components/geo/city-autocomplete';
import { ZipRadiusInput } from '@/components/geo/zip-radius-input';

export type GeoTarget =
  | { kind: 'state'; state_code: string }
  | { kind: 'city'; city: string; state_code: string }
  | { kind: 'zip_radius'; zip_code: string; zip_radius_miles: 5 | 10 | 25 | 50 };

export function GeoTargetSelector({
  value,
  onChange,
}: {
  value: GeoTarget | null;
  onChange: (v: GeoTarget) => void;
}) {
  const [mode, setMode] = useState<'state' | 'city' | 'zip'>('state');

  return (
    <div className="space-y-4">
      <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="state">State</TabsTrigger>
          <TabsTrigger value="city">City + State</TabsTrigger>
          <TabsTrigger value="zip">ZIP + Radius</TabsTrigger>
        </TabsList>

        <TabsContent value="state" className="pt-4">
          <StateMultiselect
            single
            value={value?.kind === 'state' ? [value.state_code] : []}
            onChange={(codes) => {
              if (codes[0]) onChange({ kind: 'state', state_code: codes[0] });
            }}
          />
          <p className="text-xs text-text-muted mt-2">
            Will scrape top 10 cities in the state by population
          </p>
        </TabsContent>

        <TabsContent value="city" className="pt-4 space-y-3">
          <CityAutocomplete
            value={value?.kind === 'city' ? { city: value.city, state_code: value.state_code } : null}
            onChange={(c) => onChange({ kind: 'city', city: c.city, state_code: c.state_code })}
          />
        </TabsContent>

        <TabsContent value="zip" className="pt-4 space-y-3">
          <ZipRadiusInput
            value={value?.kind === 'zip_radius'
              ? { zip: value.zip_code, radius: value.zip_radius_miles }
              : null}
            onChange={(v) => onChange({
              kind: 'zip_radius',
              zip_code: v.zip,
              zip_radius_miles: v.radius,
            })}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
