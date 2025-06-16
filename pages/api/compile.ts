import type { NextApiRequest, NextApiResponse } from 'next';

// Import your doc-compiler logic
// Enhanced version with sitemap discovery and better content extraction

interface CompileRequest {
  url: string;
}

interface CompileResponse {
  success: boolean;
  content?: string;
  metadata?: {
    title: string;
    sourceUrl: string;
    compiledAt: string;
    totalPages: number;
  };
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CompileResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  const { url }: CompileRequest = req.body;

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
    // Enhanced compilation with sitemap discovery
    const compiledContent = await compileDocumentationEnhanced(url);
    
    return res.status(200).json({
      success: true,
      content: compiledContent.content,
      metadata: compiledContent.metadata
    });
  } catch (error) {
    console.error('Compilation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Compilation failed' 
    });
  }
}

// Enhanced compilation function with sitemap discovery and better content extraction
async function compileDocumentationEnhanced(url: string) {
  console.log(`🚀 Compiling documentation from: ${url}`);
  
  const results = await Promise.allSettled([
    discoverSitemap(url),
    fetchMainPage(url)
  ]);
  
  const sitemapResult = results[0].status === 'fulfilled' ? results[0].value : [];
  const mainPageResult = results[1].status === 'fulfilled' ? results[1].value : null;
  
  if (!mainPageResult) {
    throw new Error('Failed to fetch main page');
  }
  
  // Get unique documentation URLs
  const allUrls = [url, ...sitemapResult].filter((u, i, arr) => arr.indexOf(u) === i).slice(0, 15); // Limit to 15 pages
  
  console.log(`📄 Found ${allUrls.length} pages to process`);
  
  // Fetch all pages concurrently
  const pagePromises = allUrls.map(async (pageUrl) => {
    try {
      const pageData = await fetchMainPage(pageUrl);
      return { url: pageUrl, ...pageData };
    } catch (error) {
      console.warn(`Failed to fetch ${pageUrl}:`, error);
      return null;
    }
  });
  
  const pages = (await Promise.all(pagePromises)).filter(Boolean);
  
  // Build comprehensive documentation
  const compiledContent = buildComprehensiveDoc(pages, url);
  
  return {
    content: compiledContent,
    metadata: {
      title: pages[0]?.title || 'Documentation',
      sourceUrl: url,
      compiledAt: new Date().toISOString(),
      totalPages: pages.length
    }
  };
}

// Enhanced sitemap discovery
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
        signal: AbortSignal.timeout(10000)
      });
      
      if (response.ok) {
        const xml = await response.text();
        const urls = extractUrlsFromSitemap(xml);
        console.log(`🗺 Found ${urls.length} URLs in sitemap`);
        return urls.filter(url => url.includes('/docs') || url.includes('/api') || url.includes('/guide'));
      }
    } catch (error) {
      console.warn(`Sitemap not found: ${sitemapUrl}`);
    }
  }
  
  return [];
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

// Enhanced page fetching
async function fetchMainPage(url: string) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  
  return {
    title: extractTitle(html),
    content: extractContent(html),
    headings: extractHeadings(html),
    codeBlocks: extractCodeBlocks(html)
  };
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  
  return titleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || 'Documentation';
}

function extractHeadings(html: string): Array<{level: number, text: string}> {
  const headingRegex = /<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi;
  const headings: Array<{level: number, text: string}> = [];
  let match;
  
  while ((match = headingRegex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].trim()
    });
  }
  
  return headings;
}

function extractCodeBlocks(html: string): string[] {
  const codeRegex = /<(?:pre|code)[^>]*>([\s\S]*?)<\/(?:pre|code)>/gi;
  const codes: string[] = [];
  let match;
  
  while ((match = codeRegex.exec(html)) !== null) {
    const cleanCode = match[1].replace(/<[^>]+>/g, '').trim();
    if (cleanCode.length > 10) { // Only meaningful code blocks
      codes.push(cleanCode);
    }
  }
  
  return codes;
}

function extractContent(html: string): string {
  // Remove script, style, nav, footer tags
  let content = html.replace(/<(?:script|style|nav|footer|header)\b[^<]*(?:(?!<\/(?:script|style|nav|footer|header)>)<[^<]*)*<\/(?:script|style|nav|footer|header)>/gi, '');
  
  // Remove HTML comments
  content = content.replace(/<!--[\s\S]*?-->/g, '');
  
  // Convert common HTML elements to markdown-like format
  content = content.replace(/<h([1-6])[^>]*>([^<]+)<\/h[1-6]>/gi, (_, level, text) => {
    const hashes = '#'.repeat(parseInt(level));
    return `\n\n${hashes} ${text.trim()}\n\n`;
  });
  
  content = content.replace(/<p[^>]*>([^<]+)<\/p>/gi, '$1\n\n');
  content = content.replace(/<li[^>]*>([^<]+)<\/li>/gi, '- $1\n');
  content = content.replace(/<(?:strong|b)[^>]*>([^<]+)<\/(?:strong|b)>/gi, '**$1**');
  content = content.replace(/<(?:em|i)[^>]*>([^<]+)<\/(?:em|i)>/gi, '*$1*');
  content = content.replace(/<code[^>]*>([^<]+)<\/code>/gi, '`$1`');
  
  // Extract remaining text content
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ');
  content = content.replace(/\n\s+/g, '\n');
  content = content.replace(/\n{3,}/g, '\n\n');
  
  return content.trim();
}

function buildComprehensiveDoc(pages: any[], baseUrl: string): string {
  const mainPage = pages[0];
  
  // Generate table of contents
  const toc = generateTableOfContents(pages);
  
  let content = `# ${mainPage.title}\n\n`;
  content += `**Source:** ${baseUrl}\n`;
  content += `**Compiled for AI consumption**\n`;
  content += `**Pages processed:** ${pages.length}\n`;
  content += `**Compiled:** ${new Date().toISOString()}\n\n`;
  
  if (toc) {
    content += `## Table of Contents\n\n${toc}\n\n`;
  }
  
  content += `---\n\n`;
  
  // Add all pages with proper hierarchy
  pages.forEach((page, index) => {
    if (index === 0) {
      content += `## Overview\n\n${page.content}\n\n`;
    } else {
      const pageTitle = page.title.replace(mainPage.title, '').trim() || `Page ${index + 1}`;
      content += `## ${pageTitle}\n\n`;
      content += `**Source:** ${page.url}\n\n`;
      content += `${page.content}\n\n`;
    }
    
    // Add code examples if found
    if (page.codeBlocks && page.codeBlocks.length > 0) {
      content += `### Code Examples\n\n`;
      page.codeBlocks.forEach((code: string, i: number) => {
        content += `\`\`\`\n${code}\n\`\`\`\n\n`;
      });
    }
    
    content += `---\n\n`;
  });
  
  content += `*Compiled with Doc Compiler for AI-friendly format*\n`;
  
  return content;
}

function generateTableOfContents(pages: any[]): string {
  let toc = '';
  
  pages.forEach((page, index) => {
    const title = index === 0 ? 'Overview' : (page.title || `Page ${index + 1}`);
    toc += `${index + 1}. [${title}](#${title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')})\n`;
    
    // Add sub-headings
    if (page.headings && page.headings.length > 0) {
      page.headings.slice(0, 5).forEach((heading: any) => {
        const indent = '  '.repeat(heading.level - 1);
        toc += `${indent}- ${heading.text}\n`;
      });
    }
  });
  
  return toc;
}