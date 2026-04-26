'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GeoTargetSelector, GeoTarget } from './geo-target-selector';

export function JobTriggerForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [niche, setNiche] = useState<'cafe' | 'clinic'>('cafe');
  const [geoTarget, setGeoTarget] = useState<GeoTarget | null>(null);
  const [sources, setSources] = useState<string[]>(['yelp', 'yellow_pages']);

  const toggleSource = (source: string) => {
    setSources(prev => 
      prev.includes(source) 
        ? prev.filter(s => s !== source)
        : [...prev, source]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!geoTarget) {
      setError('Please select a geographic target.');
      return;
    }
    
    if (sources.length === 0) {
      setError('Please select at least one source.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/jobs/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche, geoTarget, sources }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to trigger job');
      }

      router.refresh();
      // Reset form
      setGeoTarget(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 glass-panel p-6 rounded-xl border border-white/[0.05]">
      <h2 className="text-xl font-display font-semibold text-text-primary">New Ingestion Job</h2>
      
      {error && (
        <div className="p-3 rounded-lg bg-accent-danger/20 border border-accent-danger/50 text-accent-danger text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Niche</label>
          <select 
            value={niche} 
            onChange={(e) => setNiche(e.target.value as 'cafe' | 'clinic')}
            className="w-full glass rounded-lg px-3 py-2 outline-none text-text-primary"
          >
            <option value="cafe" className="bg-bg-surface">Cafe / Coffee Shop</option>
            <option value="clinic" className="bg-bg-surface">Medical Clinic / Medspa</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Location Targeting</label>
          <GeoTargetSelector value={geoTarget} onChange={setGeoTarget} />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-muted mb-2">Sources</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={sources.includes('yelp')}
                onChange={() => toggleSource('yelp')}
                className="w-4 h-4 rounded border-white/20 bg-transparent text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-primary">Yelp</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={sources.includes('yellow_pages')}
                onChange={() => toggleSource('yellow_pages')}
                className="w-4 h-4 rounded border-white/20 bg-transparent text-accent-primary focus:ring-accent-primary"
              />
              <span className="text-sm text-text-primary">Yellow Pages</span>
            </label>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 rounded-lg bg-accent-primary hover:bg-accent-glow text-white font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Starting Job...' : 'Trigger Scraping Job'}
      </button>
    </form>
  );
}
