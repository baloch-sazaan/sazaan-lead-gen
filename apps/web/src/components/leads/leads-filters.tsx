'use client';

import { useLeadFilters } from '@/lib/hooks/use-filters';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Search, Filter, SlidersHorizontal, MapPin, Globe, Star } from 'lucide-react';
import { StateMultiselect } from '@/components/geo/state-multiselect';
import { CityAutocomplete } from '@/components/geo/city-autocomplete';
import { ZipRadiusInput } from '@/components/geo/zip-radius-input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const WEBSITE_STATUSES = [
  { id: 'valid', label: 'Healthy' },
  { id: 'slow', label: 'Slow' },
  { id: 'broken_404', label: '404 Broken' },
  { id: 'broken_dns', label: 'DNS Error' },
  { id: 'ssl_error', label: 'SSL Error' },
  { id: 'no_website', label: 'No Website' },
];

const PIPELINE_STATUSES = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'interested', label: 'Interested' },
  { id: 'not_interested', label: 'Not Interested' },
  { id: 'converted', label: 'Converted' },
];

export function LeadsFilters() {
  const [filters, setFilters] = useLeadFilters();

  return (
    <div className="space-y-6 p-6 glass rounded-2xl border border-white/5 shadow-2xl">
      {/* Search & Niche */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
        <div className="relative flex-1 w-full lg:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
          <Input 
            placeholder="Search business name or city..." 
            className="pl-10 glass bg-white/5 border-white/10"
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
          />
        </div>
        <Tabs value={filters.niche} onValueChange={(v) => setFilters({ niche: v })} className="w-full lg:w-auto">
          <TabsList className="glass bg-white/5 border-white/10 w-full lg:w-auto">
            <TabsTrigger value="all" className="flex-1 lg:flex-none">All Niches</TabsTrigger>
            <TabsTrigger value="cafe" className="flex-1 lg:flex-none">Cafes</TabsTrigger>
            <TabsTrigger value="clinic" className="flex-1 lg:flex-none">Clinics</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Geo Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="glass bg-white/5 border-white/10 gap-2 h-10 px-4">
              <MapPin size={16} className="text-accent-primary" />
              Geo Filter
              {(filters.states.length > 0 || filters.cities.length > 0 || filters.zipCenter) && (
                <Badge variant="secondary" className="ml-1 bg-accent-primary text-white h-5 min-w-5 p-0 flex items-center justify-center">
                  {filters.states.length + filters.cities.length + (filters.zipCenter ? 1 : 0)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[350px] glass border-white/10 bg-bg-surface/95 backdrop-blur-2xl p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">States</Label>
                <StateMultiselect 
                  value={filters.states} 
                  onChange={(states) => setFilters({ states })} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">City</Label>
                <CityAutocomplete 
                  value={filters.cities[0] ? { city: filters.cities[0], state_code: '' } : null}
                  onChange={(c) => setFilters({ cities: [c.city] })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-text-muted tracking-widest">ZIP Radius</Label>
                <ZipRadiusInput 
                  value={filters.zipCenter ? { zip: filters.zipCenter, radius: filters.zipRadius as any } : null}
                  onChange={(v) => setFilters({ zipCenter: v.zip, zipRadius: v.radius })}
                />
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
              onClick={() => setFilters({ states: [], cities: [], zipCenter: '', zipRadius: 0 })}
            >
              Clear Geo Filters
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pt-2">
        {/* Website Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <Globe size={14} className="text-accent-primary" />
            <span className="text-xs uppercase tracking-wider">Website Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {WEBSITE_STATUSES.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox 
                  id={`status-${s.id}`}
                  checked={filters.websiteStatus.includes(s.id)}
                  onCheckedChange={(checked) => {
                    const next = checked 
                      ? [...filters.websiteStatus, s.id]
                      : filters.websiteStatus.filter(x => x !== s.id);
                    setFilters({ websiteStatus: next });
                  }}
                  className="border-white/20 data-[state=checked]:bg-accent-primary"
                />
                <Label htmlFor={`status-${s.id}`} className="text-[10px] font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                  {s.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Slider */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <Star size={14} className="text-accent-warning fill-accent-warning/20" />
              <span className="text-xs uppercase tracking-wider">Rating</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-accent-warning bg-accent-warning/10 px-1.5 py-0.5 rounded border border-accent-warning/20">
              {filters.minRating / 10} - {filters.maxRating / 10} ★
            </span>
          </div>
          <Slider 
            min={0} 
            max={50} 
            step={5}
            value={[filters.minRating, filters.maxRating]}
            onValueChange={([min, max]) => setFilters({ minRating: min, maxRating: max })}
            className="pt-2"
          />
        </div>

        {/* Score Slider */}
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text-primary font-semibold">
              <SlidersHorizontal size={14} className="text-accent-success" />
              <span className="text-xs uppercase tracking-wider">Min. Score</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-accent-success bg-accent-success/10 px-1.5 py-0.5 rounded border border-accent-success/20">
              {filters.minScore}+
            </span>
          </div>
          <Slider 
            min={0} 
            max={100} 
            step={5}
            value={[filters.minScore]}
            onValueChange={([val]) => setFilters({ minScore: val })}
            className="pt-2"
          />
        </div>

        {/* Pipeline Status */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <Filter size={14} className="text-accent-info" />
            <span className="text-xs uppercase tracking-wider">Pipeline</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PIPELINE_STATUSES.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox 
                  id={`pipeline-${s.id}`}
                  checked={filters.pipelineStatus.includes(s.id)}
                  onCheckedChange={(checked) => {
                    const next = checked 
                      ? [...filters.pipelineStatus, s.id]
                      : filters.pipelineStatus.filter(x => x !== s.id);
                    setFilters({ pipelineStatus: next });
                  }}
                  className="border-white/20 data-[state=checked]:bg-accent-info"
                />
                <Label htmlFor={`pipeline-${s.id}`} className="text-[10px] font-medium text-text-secondary cursor-pointer hover:text-text-primary transition-colors">
                  {s.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
