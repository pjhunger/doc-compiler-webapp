import type { NextApiRequest, NextApiResponse } from 'next';

interface DiscoverRequest {
  url: string;
}

interface PageInfo {
  url: string;
  title: string;
  category: string;
  description?: string;
  estimatedSize: string;
}

interface DiscoverResponse {
  success: boolean;
  data?: {
    baseUrl: string;
    title: string;
    totalPages: number;
    categories: {
      [category: string]: PageInfo[];
    };
    estimatedTotalSize: string;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DiscoverResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { url }: DiscoverRequest = req.body;

  if (!url) {
    return res.status(400).json({ 
      success: false, 
      error: 'URL is required' 
    });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ 
      success: false, 
      error: 'Invalid URL format' 
    });
  }

  try {
    console.log(`🔍 Discovering documentation structure for: ${url}`);
    
    const discoveryResult = await discoverDocumentationStructure(url);
    
    return res.status(200).json({
      success: true,
      data: discoveryResult
    });
  } catch (error) {
    console.error('Discovery error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Discovery failed' 
    });
  }
}

async function discoverDocumentationStructure(url: string) {
  const results = await Promise.allSettled([
    discoverSitemap(url),
    fetchMainPageInfo(url),
    discoverNavigationLinks(url)
  ]);
  
  const sitemapResult = results[0].status === 'fulfilled' ? results[0].value : [];
  const mainPageInfo = results[1].status === 'fulfilled' ? results[1].value : null;
  const navigationResult = results[2].status === 'fulfilled' ? results[2].value : [];
  
  if (!mainPageInfo) {
    throw new Error('Failed to fetch main page information');
  }
  
  // Combine main page with sitemap URLs and navigation links
  const allUrls = [url, ...sitemapResult, ...navigationResult].filter((u, i, arr) => arr.indexOf(u) === i);
  
  console.log(`📊 Analyzing ${allUrls.length} pages for categorization`);
  
  // Analyze pages in batches to get metadata
  const pageInfoPromises = allUrls.slice(0, 50).map(async (pageUrl) => { // Limit to 50 for discovery
    try {
      const info = await getPageInfo(pageUrl);
      return info;
    } catch (error) {
      console.warn(`Failed to analyze ${pageUrl}:`, error);
      return null;
    }
  });
  
  const pages = (await Promise.all(pageInfoPromises)).filter(Boolean) as PageInfo[];
  
  // Categorize pages
  const categories = categorizePages(pages);
  
  // Calculate total estimated size
  const totalEstimatedChars = pages.reduce((sum, page) => {
    const sizeStr = page.estimatedSize.toLowerCase();
    let chars = 0;
    
    if (sizeStr.includes('k')) {
      // Extract number before 'k' and multiply by 1000
      const kValue = parseFloat(sizeStr.replace(/[^\d.]/g, ''));
      chars = kValue * 1000;
    } else {
      // Extract raw character count
      chars = parseInt(sizeStr.replace(/[^\d]/g, '')) || 0;
    }
    
    return sum + chars;
  }, 0);
  
  return {
    baseUrl: url,
    title: mainPageInfo.title,
    totalPages: pages.length,
    categories,
    estimatedTotalSize: formatSize(totalEstimatedChars)
  };
}

async function discoverSitemap(baseUrl: string): Promise<string[]> {
  const sitemapUrls = [
    `${new URL(baseUrl).origin}/sitemap.xml`,
    `${new URL(baseUrl).origin}/sitemap_index.xml`,
    `${new URL(baseUrl).origin}/docs/sitemap.xml`
  ];
  
  for (const sitemapUrl of sitemapUrls) {
    try {
      const response = await fetch(sitemapUrl, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DocCompiler/1.0)' },
        signal: AbortSignal.timeout(8000)
      });
      
      if (response.ok) {
        const xml = await response.text();
        const urls = extractUrlsFromSitemap(xml);
        console.log(`🗺 Found ${urls.length} URLs in sitemap`);
        return urls.filter(url => {
          const lowerUrl = url.toLowerCase();
          return lowerUrl.includes('/docs') || 
                 lowerUrl.includes('/api') || 
                 lowerUrl.includes('/guide') ||
                 lowerUrl.includes('/reference') ||
                 lowerUrl.includes('/tutorial') ||
                 lowerUrl.includes('/examples') ||
                 lowerUrl.includes('/ref/') ||
                 lowerUrl.includes('/documentation') ||
                 // Don't filter too aggressively - let's be more inclusive
                 (!lowerUrl.includes('/blog') && 
                  !lowerUrl.includes('/changelog') && 
                  !lowerUrl.includes('/careers') &&
                  !lowerUrl.includes('/about') &&
                  !lowerUrl.includes('/contact') &&
                  !lowerUrl.includes('/privacy') &&
                  !lowerUrl.includes('/terms'));
        });
      }
    } catch (error) {
      console.warn(`Sitemap not found: ${sitemapUrl}`);
    }
  }
  
  return [];
}

// Discover navigation links from the main page
async function discoverNavigationLinks(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(baseUrl, { 
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DocCompiler/1.0)' },
      signal: AbortSignal.timeout(10000)
    });
    
    if (response.ok) {
      const html = await response.text();
      const navigationUrls = extractNavigationLinks(html, baseUrl);
      console.log(`🧭 Found ${navigationUrls.length} navigation links`);
      return navigationUrls;
    }
  } catch (error) {
    console.warn(`Navigation discovery failed: ${baseUrl}`);
  }
  
  return [];
}

function extractNavigationLinks(html: string, baseUrl: string): string[] {
  const urls: string[] = [];
  const baseUrlObj = new URL(baseUrl);
  
  // Look for navigation patterns
  const navPatterns = [
    /<nav[^>]*>([\s\S]*?)<\/nav>/gi,
    /<header[^>]*>([\s\S]*?)<\/header>/gi,
    /<div[^>]*class[^>]*nav[^>]*>([\s\S]*?)<\/div>/gi,
    /<ul[^>]*class[^>]*menu[^>]*>([\s\S]*?)<\/ul>/gi
  ];
  
  navPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const navSection = match[1];
      const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]+)<\/a>/gi;
      let linkMatch;
      
      while ((linkMatch = linkRegex.exec(navSection)) !== null) {
        try {
          let href = linkMatch[1];
          const linkText = linkMatch[2].toLowerCase();
          
          // Skip non-documentation links
          if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) {
            continue;
          }
          
          // Convert relative URLs to absolute
          if (href.startsWith('/')) {
            href = `${baseUrlObj.origin}${href}`;
          } else if (!href.startsWith('http')) {
            href = new URL(href, baseUrl).href;
          }
          
          // Only include same-origin documentation links
          if (href.startsWith(baseUrlObj.origin) && 
              (linkText.includes('guide') || 
               linkText.includes('api') || 
               linkText.includes('reference') || 
               linkText.includes('example') || 
               linkText.includes('tutorial') ||
               linkText.includes('docs') ||
               linkText.includes('documentation'))) {
            urls.push(href);
          }
        } catch (error) {
          // Skip malformed URLs
        }
      }
    }
  });
  
  return Array.from(new Set(urls)); // Remove duplicates
}

function extractUrlsFromSitemap(xml: string): string[] {
  const urlRegex = /<loc>([^<]+)<\/loc>/g;
  const urls: string[] = [];
  let match;
  
  while ((match = urlRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

async function fetchMainPageInfo(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  
  return {
    title: extractTitle(html),
    description: extractDescription(html)
  };
}

async function getPageInfo(url: string): Promise<PageInfo> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  const title = extractTitle(html);
  const description = extractDescription(html);
  const estimatedSize = estimateContentSize(html);
  const category = categorizeUrl(url);
  
  console.log(`📊 ${url} -> ${estimatedSize} (${category})`);
  
  return {
    url,
    title,
    category,
    description,
    estimatedSize
  };
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  
  return titleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || 'Documentation Page';
}

function extractDescription(html: string): string {
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  const firstPara = html.match(/<p[^>]*>([^<]{50,200})<\/p>/i);
  
  return metaDesc?.[1]?.trim() || firstPara?.[1]?.trim() || '';
}

function estimateContentSize(html: string): string {
  // Remove script, style, nav, footer tags first
  let content = html.replace(/<(?:script|style|nav|footer|header)\b[^<]*(?:(?!<\/(?:script|style|nav|footer|header)>)<[^<]*)*<\/(?:script|style|nav|footer|header)>/gi, '');
  
  // Remove HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Extract text content and clean whitespace
  const textContent = content.replace(/<[^>]+>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
  
  // Estimate final markdown size (usually ~70% of cleaned text due to formatting)
  const estimatedMarkdown = Math.round(textContent.length * 0.7);
  
  return formatSize(estimatedMarkdown);
}

function formatSize(chars: number): string {
  if (chars < 1000) return `${chars} chars`;
  if (chars < 10000) return `${Math.round(chars / 100) / 10}k chars`;
  return `${Math.round(chars / 1000)}k chars`;
}

function categorizeUrl(url: string): string {
  const path = url.toLowerCase();
  
  // More comprehensive API Reference detection
  if (path.includes('/api/') || 
      path.includes('/reference/') || 
      path.includes('/ref/') ||
      path.match(/\/api$/) ||
      path.includes('reference')) {
    return 'API Reference';
  }
  
  // Examples detection
  if (path.includes('/example/') || 
      path.includes('/examples/') ||
      path.includes('/sample/') ||
      path.includes('example')) {
    return 'Examples';
  }
  
  // Guides and tutorials
  if (path.includes('/guide/') || 
      path.includes('/guides/') ||
      path.includes('/tutorial/') ||
      path.includes('/tutorials/') ||
      path.includes('guide') ||
      path.includes('tutorial')) {
    return 'Guides & Tutorials';
  }
  
  // Getting started
  if (path.includes('/quick') || 
      path.includes('/start') || 
      path.includes('/getting') ||
      path.includes('quickstart') ||
      path.includes('introduction')) {
    return 'Getting Started';
  }
  
  // Concepts and overview
  if (path.includes('/concept/') || 
      path.includes('/concepts/') ||
      path.includes('/overview/') ||
      path.includes('concept') ||
      path.includes('overview')) {
    return 'Concepts';
  }
  
  return 'General Documentation';
}

function categorizePages(pages: PageInfo[]): { [category: string]: PageInfo[] } {
  const categories: { [category: string]: PageInfo[] } = {};
  
  pages.forEach(page => {
    if (!categories[page.category]) {
      categories[page.category] = [];
    }
    categories[page.category].push(page);
  });
  
  // Sort categories by priority
  const sortedCategories: { [category: string]: PageInfo[] } = {};
  const priorityOrder = [
    'Getting Started',
    'API Reference', 
    'Guides & Tutorials',
    'Examples',
    'Concepts',
    'General Documentation'
  ];
  
  priorityOrder.forEach(category => {
    if (categories[category]) {
      sortedCategories[category] = categories[category];
    }
  });
  
  // Add any remaining categories
  Object.keys(categories).forEach(category => {
    if (!sortedCategories[category]) {
      sortedCategories[category] = categories[category];
    }
  });
  
  return sortedCategories;
}