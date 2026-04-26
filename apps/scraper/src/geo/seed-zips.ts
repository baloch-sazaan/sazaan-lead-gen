import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { createClient } from '@supabase/supabase-js';

const METRO_MAPPING: Record<string, string> = {
  // Add common metros — extend as needed
  'Dallas,TX': 'DFW', 'Fort Worth,TX': 'DFW', 'Plano,TX': 'DFW',
  'Houston,TX': 'Greater Houston', 'Sugar Land,TX': 'Greater Houston',
  'Austin,TX': 'Austin Metro', 'Round Rock,TX': 'Austin Metro',
  'New York,NY': 'NYC Metro', 'Brooklyn,NY': 'NYC Metro', 'Queens,NY': 'NYC Metro',
  'Newark,NJ': 'NYC Metro', 'Jersey City,NJ': 'NYC Metro',
  'Los Angeles,CA': 'LA Metro', 'Long Beach,CA': 'LA Metro', 'Anaheim,CA': 'LA Metro',
  'San Francisco,CA': 'Bay Area', 'Oakland,CA': 'Bay Area', 'San Jose,CA': 'Bay Area',
  'Chicago,IL': 'Chicagoland', 'Naperville,IL': 'Chicagoland',
  'Miami,FL': 'South Florida', 'Fort Lauderdale,FL': 'South Florida',
  'Boston,MA': 'Greater Boston', 'Cambridge,MA': 'Greater Boston',
  'Seattle,WA': 'Puget Sound', 'Bellevue,WA': 'Puget Sound',
  'Atlanta,GA': 'Metro Atlanta', 'Marietta,GA': 'Metro Atlanta',
  'Phoenix,AZ': 'Phoenix Metro', 'Scottsdale,AZ': 'Phoenix Metro', 'Tempe,AZ': 'Phoenix Metro',
  'Denver,CO': 'Denver Metro', 'Aurora,CO': 'Denver Metro',
  'Washington,DC': 'DC Metro', 'Arlington,VA': 'DC Metro', 'Alexandria,VA': 'DC Metro',
};

async function seedZips() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const csvPath = path.join(__dirname, '../../data/uszips.csv');
  const rows: any[] = [];

  const { data: states } = await supabase.from('us_states').select('code');
  const validStates = new Set(states?.map(s => s.code) || []);

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(parse({ columns: true, skip_empty_lines: true }))
      .on('data', (row) => {
        if (!validStates.has(row.state_id)) return;
        const cityState = `${row.city},${row.state_id}`;
        rows.push({
          zip: row.zip,
          city: row.city,
          state_code: row.state_id,
          county: row.county_name || null,
          latitude: parseFloat(row.lat),
          longitude: parseFloat(row.lng),
          population: row.population ? parseInt(row.population) : null,
          metro_area: METRO_MAPPING[cityState] || null,
        });
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Loaded ${rows.length} ZIPs from CSV. Inserting in batches...`);

  const BATCH_SIZE = 1000;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('geo_zips')
      .upsert(batch, { onConflict: 'zip' });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE} failed:`, error);
    } else {
      console.log(`Inserted batch ${i / BATCH_SIZE + 1} of ${Math.ceil(rows.length / BATCH_SIZE)}`);
    }
  }

  console.log('ZIP seed complete.');
}

seedZips().catch(console.error);
