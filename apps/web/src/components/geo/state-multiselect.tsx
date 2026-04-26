'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export function StateMultiselect({
  value,
  onChange,
  single = false,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  single?: boolean;
}) {
  const [states, setStates] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    const fetchStates = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('us_states').select('code, name').order('name');
      if (data) setStates(data);
    };
    fetchStates();
  }, []);

  return (
    <div className="glass rounded-lg p-2">
      <select
        multiple={!single}
        value={single ? value[0] || '' : value}
        onChange={(e) => {
          if (single) {
            onChange([e.target.value]);
          } else {
            const selected = Array.from(e.target.selectedOptions, option => option.value);
            onChange(selected);
          }
        }}
        className="w-full bg-transparent border-none outline-none px-3 py-2 text-text-primary"
      >
        {single && <option value="" disabled className="bg-bg-surface">Select a state...</option>}
        {states.map((s) => (
          <option key={s.code} value={s.code} className="bg-bg-surface">
            {s.name} ({s.code})
          </option>
        ))}
      </select>
    </div>
  );
}
