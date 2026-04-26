import { createStealthBrowser } from '../stealth/browser-pool';
import { readingDelay, navigationDelay } from '../stealth/delays';
import { normalizePhone } from '../lib/normalize';
import { logger } from '../lib/logger';

interface ScrapeParams {
  niche: 'cafe' | 'clinic';
  city: string;
  state_code: string;
}

const NICHE_QUERY = {
  cafe: 'coffee-shops',
  clinic: 'medical-clinics',
};

export async function scrapeYellowPages(params: ScrapeParams) {
  const { browser, context } = await createStealthBrowser();
  const page = await context.newPage();
  const results: any[] = [];

  try {
    const search = NICHE_QUERY[params.niche];
    const geo = `${params.city.replace(/\s/g, '+')}%2C+${params.state_code}`;
    const url = `https://www.yellowpages.com/search?search_terms=${search}&geo_location_terms=${geo}`;

    logger.info({ url }, 'Yellow Pages search');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await readingDelay();

    // Yellow Pages: scrape first 3 pages
    for (let pageNum = 1; pageNum <= 3; pageNum++) {
      await page.waitForSelector('div.result, .v-card', { timeout: 15000 }).catch(() => {});

      const pageResults = await page.evaluate(() => {
        const cards = Array.from(document.querySelectorAll('div.result, .v-card'));
        return cards.map(card => {
          const name = card.querySelector('a.business-name span')?.textContent?.trim() || 
                       card.querySelector('.business-name')?.textContent?.trim() || null;
          const phone = card.querySelector('.phones.phone.primary')?.textContent?.trim() || 
                        card.querySelector('.phone')?.textContent?.trim() || null;
          const address = card.querySelector('.adr .street-address')?.textContent?.trim() || 
                          card.querySelector('.street-address')?.textContent?.trim() || null;
          const locality = card.querySelector('.adr .locality')?.textContent?.trim() || 
                           card.querySelector('.locality')?.textContent?.trim() || null;
          const websiteLink = card.querySelector('a.track-visit-website') as HTMLAnchorElement | null;
          const website = websiteLink?.href || null;
          const ypLink = card.querySelector('a.business-name') as HTMLAnchorElement | null;
          const ypUrl = ypLink?.href || null;
          const ratingEl = card.querySelector('.result-rating');
          const ratingClass = ratingEl?.className || '';
          // YP encodes rating in class name like 'four half', 'three', etc.
          const ratingMap: Record<string, number> = {
            'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
          };
          let rating: number | null = null;
          for (const [word, val] of Object.entries(ratingMap)) {
            if (ratingClass.includes(word)) {
              rating = val + (ratingClass.includes('half') ? 0.5 : 0);
              break;
            }
          }
          const reviewCountText = card.querySelector('.count')?.textContent?.trim();
          const reviewMatch = reviewCountText?.match(/(\d+)/);
          const review_count = reviewMatch ? parseInt(reviewMatch[1]) : 0;

          return { name, phone, address, locality, website, ypUrl, rating, review_count };
        });
      });

      logger.info({ pageNum, count: pageResults.length }, 'Yellow Pages page collected');

      for (const r of pageResults) {
        if (!r.name || !r.phone) continue;

        // Extract YP ID from URL
        const ypIdMatch = r.ypUrl?.match(/-(\d+)$/);
        const ypId = ypIdMatch ? ypIdMatch[1] : (r.ypUrl ? Buffer.from(r.ypUrl).toString('base64').slice(0, 32) : null);

        results.push({
          business_name: r.name,
          niche: params.niche,
          street_address: r.address,
          city: r.locality || params.city,
          state_code: params.state_code,
          phone: r.phone,
          phone_normalized: normalizePhone(r.phone),
          website_url: r.website,
          yellow_pages_id: ypId,
          yellow_pages_url: r.ypUrl,
          yelp_rating: r.rating,
          yelp_review_count: r.review_count,
          primary_source: 'yellow_pages' as const,
          website_status: r.website ? 'pending' : 'no_website',
        });
      }

      // Next page
      if (pageNum < 3) {
        const nextLink = await page.$('a.next');
        if (nextLink) {
          await nextLink.click();
          await navigationDelay();
        } else break;
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
