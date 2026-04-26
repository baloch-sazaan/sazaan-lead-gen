import { request } from 'undici';

export async function checkWebsiteHealth(url: string) {
  if (!url) return { status: 'no_website' as const };

  try {
    const start = Date.now();
    const response = await request(url, {
      method: 'GET',
      headersTimeout: 10000,
      bodyTimeout: 10000,
      maxRedirections: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    const loadTime = Date.now() - start;
    const statusCode = response.statusCode;

    if (statusCode === 404) return { status: 'broken_404' as const, loadTime };
    if (statusCode >= 500) return { status: 'broken_500' as const, loadTime };
    if (loadTime > 5000) return { status: 'slow' as const, loadTime };

    const html = await response.body.text();
    const techStack = detectTechStack(html);

    return { status: 'valid' as const, loadTime, techStack };
  } catch (err: any) {
    if (err.code === 'ENOTFOUND') return { status: 'broken_dns' as const };
    if (err.message?.includes('CERT')) return { status: 'ssl_error' as const };
    if (err.code === 'UND_ERR_HEADERS_TIMEOUT') return { status: 'timeout' as const };
    return { status: 'error' as const };
  }
}

function detectTechStack(html: string) {
  return {
    wordpress: /wp-content|wp-includes|\/wp-json\//i.test(html),
    wix: /wix\.com|_wixCIDX|static\.wixstatic\.com/i.test(html),
    squarespace: /squarespace\.com|sqsp\.net/i.test(html),
    shopify: /cdn\.shopify\.com|myshopify\.com/i.test(html),
    webflow: /webflow\.com|webflow\.io/i.test(html),
    nextjs: /__NEXT_DATA__|_next\/static/i.test(html),
    godaddy: /godaddy|secureserver/i.test(html),
  };
}
