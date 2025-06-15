import type { NextApiRequest, NextApiResponse } from 'next';

// Import your doc-compiler logic
// For now, we'll create a simplified version that works with the existing tools

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
    // For MVP, we'll use a simplified version using fetch + cheerio
    const compiledContent = await compileDocumentationSimple(url);
    
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

// Simplified compilation function for the web app
async function compileDocumentationSimple(url: string) {
  // For now, we'll use a simple fetch without JSDOM to avoid dependency issues
  
  console.log(`🚀 Compiling documentation from: ${url}`);
  
  // Fetch the main page
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  
  // Simple text extraction without JSDOM for now
  const title = extractTitle(html);
  const cleanContent = extractContent(html);

  // Build the compiled documentation
  const compiledContent = `# ${title}

**Source:** ${url}
**Compiled for AI consumption**
**Compiled:** ${new Date().toISOString()}

---

## Overview

This documentation has been compiled from ${url} for AI consumption.

---

${cleanContent}

---

*Compiled with Doc Compiler for AI-friendly format*
`;

  return {
    content: compiledContent,
    metadata: {
      title,
      sourceUrl: url,
      compiledAt: new Date().toISOString(),
      totalPages: 1
    }
  };
}

function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  
  return titleMatch?.[1]?.trim() || h1Match?.[1]?.trim() || 'Documentation';
}

function extractContent(html: string): string {
  // Remove script and style tags
  let content = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  content = content.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Extract text content from HTML tags
  content = content.replace(/<[^>]+>/g, ' ');
  
  // Clean up whitespace
  content = content.replace(/\s+/g, ' ').trim();
  
  // Take first 2000 characters for preview
  return content.substring(0, 2000) + '...';
}