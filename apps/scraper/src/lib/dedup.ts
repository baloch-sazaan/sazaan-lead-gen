import { createClient } from '@supabase/supabase-js';
import type { Database } from '@sazaan/shared';

const supabase = createClient<Database>(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function dedupAndInsert(leads: any[]) {
  // Step 1: dedup within incoming batch by normalized phone
  const seen = new Map<string, any>();
  for (const lead of leads) {
    if (!lead.phone_normalized) {
      // No phone — fall back to name+city key
      const key = `name:${lead.business_name?.toLowerCase()}:${lead.city?.toLowerCase()}:${lead.state_code}`;
      if (!seen.has(key)) seen.set(key, lead);
      continue;
    }
    const key = `phone:${lead.phone_normalized}`;
    if (seen.has(key)) {
      // Merge: prefer record with more data
      const existing = seen.get(key);
      seen.set(key, mergeLeads(existing, lead));
    } else {
      seen.set(key, lead);
    }
  }

  const deduped = Array.from(seen.values());

  // Step 2: insert with upsert. Use yelp_id, yellow_pages_id, or phone_normalized as conflict key
  let inserted = 0;
  let skipped = 0;

  for (const lead of deduped) {
    // Determine conflict key
    let conflictColumn = 'yelp_id';
    if (!lead.yelp_id && lead.yellow_pages_id) conflictColumn = 'yellow_pages_id';

    if (!lead.yelp_id && !lead.yellow_pages_id) {
      // No external ID — check by phone first
      if (lead.phone_normalized) {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('phone_normalized', lead.phone_normalized)
          .maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }
      }
      // Insert without conflict key
      const { error } = await supabase.from('leads').insert(lead);
      if (error) {
        if (error.code === '23505') skipped++;
        else console.error('Insert error:', error);
      } else {
        inserted++;
      }
      continue;
    }

    const { error } = await supabase
      .from('leads')
      .upsert(lead, { onConflict: conflictColumn, ignoreDuplicates: true });

    if (error) {
      if (error.code === '23505') skipped++;
      else console.error('Upsert error:', error);
    } else {
      inserted++;
    }
  }

  return { inserted, skipped };
}

function mergeLeads(a: any, b: any) {
  // Prefer non-null values, prefer Yelp data for ratings
  return {
    ...a,
    ...b,
    business_name: a.business_name || b.business_name,
    phone: a.phone || b.phone,
    website_url: a.website_url || b.website_url,
    street_address: a.street_address || b.street_address,
    yelp_id: a.yelp_id || b.yelp_id,
    yelp_url: a.yelp_url || b.yelp_url,
    yellow_pages_id: a.yellow_pages_id || b.yellow_pages_id,
    yellow_pages_url: a.yellow_pages_url || b.yellow_pages_url,
    yelp_rating: a.yelp_rating ?? b.yelp_rating,
    yelp_review_count: Math.max(a.yelp_review_count || 0, b.yelp_review_count || 0),
    primary_source: a.yelp_id ? 'yelp' : (b.yelp_id ? 'yelp' : a.primary_source),
  };
}
