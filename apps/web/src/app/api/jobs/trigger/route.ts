import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { GeoTarget } from '@/components/jobs/geo-target-selector';

export async function POST(req: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { niche, geoTarget, sources } = body as { 
      niche: string; 
      geoTarget: GeoTarget; 
      sources: string[] 
    };

    if (!niche || !geoTarget || !sources || sources.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Prepare ingestion job record
    const job: any = {
      niche,
      sources,
      status: 'pending',
    };

    if (geoTarget.kind === 'state') {
      job.state_code = geoTarget.state_code;
    } else if (geoTarget.kind === 'city') {
      job.city = geoTarget.city;
      job.state_code = geoTarget.state_code;
    } else if (geoTarget.kind === 'zip_radius') {
      job.zip_code = geoTarget.zip_code;
      job.zip_radius_miles = geoTarget.zip_radius_miles;
    } else {
      return NextResponse.json({ error: 'Invalid geo target kind' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ingestion_jobs')
      .insert(job)
      .select()
      .single();

    if (error) {
      console.error('Failed to create ingestion job:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Trigger job error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
