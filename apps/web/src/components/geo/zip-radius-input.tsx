'use client';

export function ZipRadiusInput({
  value,
  onChange,
}: {
  value: { zip: string; radius: 5 | 10 | 25 | 50 } | null;
  onChange: (v: { zip: string; radius: 5 | 10 | 25 | 50 }) => void;
}) {
  const zip = value?.zip || '';
  const radius = value?.radius || 10;

  return (
    <div className="flex gap-3">
      <div className="glass rounded-lg p-2 flex-1">
        <input
          type="text"
          maxLength={5}
          placeholder="5-digit ZIP"
          value={zip}
          onChange={(e) => {
            const newZip = e.target.value.replace(/\D/g, '');
            onChange({ zip: newZip, radius });
          }}
          className="w-full bg-transparent border-none outline-none px-3 py-2"
        />
      </div>
      <div className="glass rounded-lg p-2 w-32">
        <select
          value={radius.toString()}
          onChange={(e) => onChange({ zip, radius: parseInt(e.target.value) as 5 | 10 | 25 | 50 })}
          className="w-full bg-transparent border-none outline-none px-3 py-2"
        >
          <option value="5" className="bg-bg-surface">5 miles</option>
          <option value="10" className="bg-bg-surface">10 miles</option>
          <option value="25" className="bg-bg-surface">25 miles</option>
          <option value="50" className="bg-bg-surface">50 miles</option>
        </select>
      </div>
    </div>
  );
}
