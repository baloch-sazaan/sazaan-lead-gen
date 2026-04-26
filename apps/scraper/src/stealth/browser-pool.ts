import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { US_USER_AGENTS } from './user-agents';

chromium.use(StealthPlugin());

export async function createStealthBrowser() {
  const useProxy = process.env.USE_PROXY === 'true';
  const proxyUrl = process.env.PROXY_URL;

  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--no-first-run',
      '--disable-gpu',
    ],
    proxy: useProxy && proxyUrl ? { server: proxyUrl } : undefined,
  });

  const userAgent = US_USER_AGENTS[Math.floor(Math.random() * US_USER_AGENTS.length)];

  const context = await browser.newContext({
    userAgent,
    viewport: {
      width: 1280 + Math.floor(Math.random() * 200),
      height: 800 + Math.floor(Math.random() * 200),
    },
    locale: 'en-US',
    timezoneId: 'America/New_York',  // US timezone — critical when scraping US sites from Karachi
    geolocation: { latitude: 40.7128, longitude: -74.0060 }, // NYC
    permissions: [],
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
  });

  // Block heavy assets
  await context.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (['image', 'media', 'font'].includes(type)) return route.abort();
    return route.continue();
  });

  return { browser, context };
}
