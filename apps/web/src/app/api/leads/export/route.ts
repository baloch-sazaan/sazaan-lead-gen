import { NextResponse } from 'next/server';
import Papa from 'papaparse';
import { createServerClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { leadIds } = await req.json();
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: 'No leads' }, { status: 400 });
  }

  const { data: leads, error } = await supabase
    .from('leads_enriched')
    .select(`
      business_name, niche, street_address, city, state_code, state_name,
      zip_code, metro_area, timezone, phone, phone_normalized,
      website_url, website_status, instagram_url, facebook_url,
      yelp_url, yelp_rating, yelp_review_count,
      qualification_score, pipeline_status, notes,
      latitude, longitude
    `)
    .in('id', leadIds);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const csv = Papa.unparse(leads || [], {
    header: true,
    columns: [
      'business_name', 'niche', 'street_address', 'city', 'state_code', 'state_name',
      'zip_code', 'metro_area', 'timezone',
      'phone', 'phone_normalized',
      'website_url', 'website_status',
      'instagram_url', 'facebook_url',
      'yelp_url', 'yelp_rating', 'yelp_review_count',
      'qualification_score', 'pipeline_status', 'notes',
      'latitude', 'longitude',
    ],
  });

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="sazaan-leads-${Date.now()}.csv"`,
    },
  });
}
