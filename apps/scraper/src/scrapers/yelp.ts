import { createStealthBrowser } from '../stealth/browser-pool';
import { readingDelay, navigationDelay, interactionDelay } from '../stealth/delays';
import { normalizePhone } from '../lib/normalize';
import { logger } from '../lib/logger';

interface ScrapeParams {
  niche: 'cafe' | 'clinic';
  city: string;
  state_code: string;
}

const NICHE_QUERY = {
  cafe: 'coffee+%26+cafes',
  clinic: 'medical+clinics',
};

export async function scrapeYelp(params: ScrapeParams) {
  const { browser, context } = await createStealthBrowser();
  const page = await context.newPage();
  const results: any[] = [];

  try {
    const searchQuery = NICHE_QUERY[params.niche];
    const location = `${params.city}, ${params.state_code}`.replace(/\s/g, '+');
    const url = `https://www.yelp.com/search?find_desc=${searchQuery}&find_loc=${location}`;

    logger.info({ url }, 'Yelp search');
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await readingDelay();

    // Yelp uses pagination — scrape first 3 pages (~30 results per page)
    for (let pageNum = 0; pageNum < 3; pageNum++) {
      // Wait for results - use stable h3 a for business links
      await page.waitForSelector('h3 a[href*="/biz/"]', { timeout: 15000 }).catch(() => {
        logger.warn('Yelp results not found on page');
      });

      // Get all business URLs on current page
      const businessUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('h3 a[href*="/biz/"]'));
        return links.map(a => (a as HTMLAnchorElement).href).filter(h => h.includes('/biz/'));
      });

      logger.info({ pageNum, count: businessUrls.length }, 'Yelp page collected URLs');

      // Visit each business detail page
      for (const bizUrl of businessUrls.slice(0, 30)) {
        try {
          await navigationDelay();
          await page.goto(bizUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
          await readingDelay();

          const detail = await page.evaluate(() => {
            const name = document.querySelector('h1')?.textContent?.trim() || null;

            // Phone
            const phone = Array.from(document.querySelectorAll('p, span'))
              .map(el => el.textContent?.trim())
              .find(t => t && /\(\d{3}\)\s?\d{3}-\d{4}/.test(t)) || null;

            // Address
            const addressEl = document.querySelector('address');
            const address = addressEl?.textContent?.trim() || null;

            // Website
            const websiteLink = Array.from(document.querySelectorAll('a[href*="/biz_redir"]'))
              .find(a => (a as HTMLAnchorElement).href.includes('url='));
            let website: string | null = null;
            if (websiteLink) {
              const url = new URL((websiteLink as HTMLAnchorElement).href);
              website = url.searchParams.get('url');
            }

            // Rating + review count
            const ratingText = document.querySelector('[aria-label*="star rating"]')?.getAttribute('aria-label') || '';
            const ratingMatch = ratingText.match(/([\d.]+)\s*star/);
            const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

            const reviewCountText = Array.from(document.querySelectorAll('span, a'))
              .map(el => el.textContent || '')
              .find(t => /\d+\s+reviews/i.test(t)) || '';
            const reviewMatch = reviewCountText.match(/(\d+)/);
            const review_count = reviewMatch ? parseInt(reviewMatch[1]) : 0;

            // Yelp ID from URL
            const pathMatch = window.location.pathname.match(/\/biz\/([^/?]+)/);
            const yelp_id = pathMatch ? pathMatch[1] : null;

            return {
              name,
              phone,
              address,
              website,
              rating,
              review_count,
              yelp_id,
              yelp_url: window.location.href.split('?')[0],
            };
          });

          if (detail.name && detail.yelp_id) {
            results.push({
              business_name: detail.name,
              niche: params.niche,
              street_address: detail.address,
              city: params.city,
              state_code: params.state_code,
              phone: detail.phone,
              phone_normalized: normalizePhone(detail.phone),
              website_url: detail.website,
              yelp_id: detail.yelp_id,
              yelp_url: detail.yelp_url,
              yelp_rating: detail.rating,
              yelp_review_count: detail.review_count,
              primary_source: 'yelp' as const,
              website_status: detail.website ? 'pending' : 'no_website',
            });
          }
        } catch (err) {
          logger.error({ err, bizUrl }, 'Yelp detail scrape error');
        }
      }

      // Go to next page
      if (pageNum < 2) {
        const nextButton = await page.$('a[aria-label="Next"]:not([aria-disabled="true"])');
        if (nextButton) {
          await nextButton.click();
          await navigationDelay();
        } else {
          break;
        }
      }
    }
  } finally {
    await browser.close();
  }

  return results;
}
