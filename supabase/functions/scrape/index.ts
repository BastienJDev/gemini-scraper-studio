import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Priority paths to crawl for news/content
const PRIORITY_PATHS = [
  '/actualites', '/actualite', '/news', '/blog', '/articles',
  '/publications', '/presse', '/communiques', '/evenements',
  '/a-la-une', '/nos-actualites', '/dernieres-actualites'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, deep = true } = await req.json();
    
    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping URL:', url, 'Deep:', deep);

    const baseUrl = new URL(url);
    const allContent: string[] = [];
    const visitedUrls = new Set<string>();
    let title = '';
    let description = '';

    // Scrape the main page first
    const mainResult = await scrapePage(url);
    if (mainResult.success) {
      title = mainResult.title || '';
      description = mainResult.description || '';
      if (mainResult.content && mainResult.content.length > 100) {
        allContent.push(`[PAGE PRINCIPALE]\n${mainResult.content}`);
      }
      visitedUrls.add(url);
    } else {
      return new Response(
        JSON.stringify({ success: false, error: mainResult.error, url }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deep scraping: follow internal links and priority paths
    if (deep) {
      // First, try priority paths (actualités, news, etc.)
      const priorityUrls = PRIORITY_PATHS
        .map(path => {
          try {
            return new URL(path, baseUrl.origin).href;
          } catch {
            return null;
          }
        })
        .filter((u): u is string => u !== null && !visitedUrls.has(u));

      // Also get promising internal links from the main page
      const internalLinks = (mainResult.links || [])
        .filter(link => {
          try {
            const linkUrl = new URL(link, url);
            // Same domain, not visited, and looks like content (not assets)
            return linkUrl.hostname === baseUrl.hostname && 
                   !visitedUrls.has(linkUrl.href) &&
                   !link.match(/\.(css|js|png|jpg|jpeg|gif|svg|pdf|doc|ico)$/i) &&
                   !link.includes('login') &&
                   !link.includes('contact');
          } catch {
            return false;
          }
        })
        .slice(0, 8);

      // Combine and deduplicate URLs
      const urlsToScrape = [...new Set([...priorityUrls, ...internalLinks])].slice(0, 6);
      console.log('Deep scraping', urlsToScrape.length, 'additional URLs');

      // Scrape additional pages in parallel (max 3 at a time for performance)
      for (let i = 0; i < urlsToScrape.length; i += 3) {
        const batch = urlsToScrape.slice(i, i + 3);
        const results = await Promise.all(
          batch.map(async (pageUrl) => {
            if (visitedUrls.has(pageUrl)) return null;
            visitedUrls.add(pageUrl);
            
            const result = await scrapePage(pageUrl);
            if (result.success && result.content && result.content.length > 300) {
              const pagePath = new URL(pageUrl).pathname;
              return `[PAGE: ${pagePath}]\n${result.content}`;
            }
            return null;
          })
        );

        results.forEach(content => {
          if (content) allContent.push(content);
        });
      }
    }

    const combinedContent = allContent.join('\n\n---\n\n');
    console.log('Total scraped content length:', combinedContent.length, 'from', allContent.length, 'pages');

    return new Response(
      JSON.stringify({ 
        success: true,
        title,
        description,
        content: combinedContent,
        pagesScraped: allContent.length,
        url
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scraping error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to scrape website';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function scrapePage(url: string): Promise<{
  success: boolean;
  title?: string;
  description?: string;
  content?: string;
  links?: string[];
  error?: string;
}> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const html = await response.text();
    
    return {
      success: true,
      title: extractTitle(html),
      description: extractMetaDescription(html),
      content: extractTextFromHtml(html),
      links: extractLinks(html, url),
    };

  } catch (error) {
    clearTimeout(timeoutId);
    const errorMsg = error instanceof Error ? error.message : 'Fetch failed';
    return { success: false, error: errorMsg };
  }
}

function extractTextFromHtml(html: string): string {
  // Remove scripts, styles, and navigation elements
  let text = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Try to extract main content areas first
  const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  const articleMatches = text.match(/<article[^>]*>([\s\S]*?)<\/article>/gi);
  
  let priorityContent = '';
  if (mainMatch) {
    priorityContent = mainMatch[1];
  } else if (articleMatches) {
    priorityContent = articleMatches.join(' ');
  }

  // Use priority content if substantial, otherwise full page
  const sourceText = (priorityContent.length > 500) ? priorityContent : text;

  // Remove nav/footer/header from source
  let cleanedText = sourceText
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Convert to readable text with structure
  let plainText = cleanedText
    .replace(/<h1[^>]*>/gi, '\n\n## ')
    .replace(/<\/h1>/gi, '\n')
    .replace(/<h2[^>]*>/gi, '\n\n### ')
    .replace(/<\/h2>/gi, '\n')
    .replace(/<h3[^>]*>/gi, '\n\n#### ')
    .replace(/<\/h3>/gi, '\n')
    .replace(/<h[4-6][^>]*>/gi, '\n\n##### ')
    .replace(/<\/h[4-6]>/gi, '\n')
    .replace(/<p[^>]*>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/li>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  // Remove duplicate lines (menus, etc.)
  const lines = plainText.split('\n');
  const uniqueLines: string[] = [];
  const seenLines = new Set<string>();
  
  for (const line of lines) {
    const normalized = line.trim().toLowerCase();
    if (normalized.length > 15 && !seenLines.has(normalized)) {
      seenLines.add(normalized);
      uniqueLines.push(line);
    } else if (normalized.length <= 15 || line.startsWith('#')) {
      uniqueLines.push(line);
    }
  }

  return uniqueLines.join('\n').substring(0, 25000); // 25K per page
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  
  const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  
  return '';
}

function extractMetaDescription(html: string): string {
  const metaMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (metaMatch) return metaMatch[1].trim();
  
  const metaMatch2 = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i);
  if (metaMatch2) return metaMatch2[1].trim();
  
  const ogMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i);
  if (ogMatch) return ogMatch[1].trim();
  
  return '';
}

function extractLinks(html: string, baseUrl: string): string[] {
  const linkRegex = /<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    try {
      const href = match[1];
      if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
        continue;
      }
      const absoluteUrl = new URL(href, baseUrl).href;
      if (!links.includes(absoluteUrl)) {
        links.push(absoluteUrl);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return links.slice(0, 30);
}
