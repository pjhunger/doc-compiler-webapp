import { useState } from 'react';
import Head from 'next/head';

interface PageInfo {
  url: string;
  title: string;
  category: string;
  description?: string;
  estimatedSize: string;
}

interface DiscoveryData {
  baseUrl: string;
  title: string;
  totalPages: number;
  categories: { [category: string]: PageInfo[] };
  estimatedTotalSize: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [discoveryData, setDiscoveryData] = useState<DiscoveryData | null>(null);
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscovery = async () => {
    setIsDiscovering(true);
    setError('');
    setDiscoveryData(null);

    try {
      const response = await fetch('/api/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setDiscoveryData(data.data);
      // Pre-select all pages
      const allPages = Object.values(data.data.categories).flat().map((page) => (page as PageInfo).url);
      setSelectedPages(new Set(allPages));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Entdeckung fehlgeschlagen');
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleAdvancedCompile = async () => {
    if (!discoveryData || selectedPages.size === 0) return;
    
    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: discoveryData.baseUrl,
          selectedPages: Array.from(selectedPages)
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kompilierung fehlgeschlagen');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePageSelection = (pageUrl: string) => {
    const newSelected = new Set(selectedPages);
    if (newSelected.has(pageUrl)) {
      newSelected.delete(pageUrl);
    } else {
      newSelected.add(pageUrl);
    }
    setSelectedPages(newSelected);
  };

  const toggleCategorySelection = (pages: PageInfo[], selectAll: boolean) => {
    const newSelected = new Set(selectedPages);
    pages.forEach(page => {
      if (selectAll) {
        newSelected.add(page.url);
      } else {
        newSelected.delete(page.url);
      }
    });
    setSelectedPages(newSelected);
  };

  const resetDiscovery = () => {
    setDiscoveryData(null);
    setSelectedPages(new Set());
    setError('');
    setResult('');
  };

  const downloadMarkdown = () => {
    const blob = new Blob([result], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'compiled-docs.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container">
      <Head>
        <title>Doc Compiler - AI-friendly Documentation</title>
        <meta name="description" content="Compile documentation websites into AI-friendly formats" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="main">
        <h1 className="title">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem', verticalAlign: 'middle'}}>
            <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Doc Compiler
        </h1>

        <p className="description">
          Verwandel jede Dokumentations-Website in ein AI-freundliches Format
        </p>

        <div className="features">
          <div className="feature">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11H15M9 15H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Smart Discovery</h3>
            <p>Automatic sitemap crawling finds all documentation pages efficiently</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.813 15.904L9 18.75L10.813 17.594C12.459 16.465 14.486 16.086 16.407 16.531C18.328 16.976 19.964 18.217 20.875 19.906C21.786 21.595 21.875 23.562 21.125 25.313" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 1V3M21 12H23M12 21V23M4.22 4.22L5.64 5.64M18.36 5.64L19.78 4.22M1 12H3M4.22 19.78L5.64 18.36M18.36 18.36L19.78 19.78" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>AI-Optimized</h3>
            <p>Clean, structured output designed specifically for LLM consumption</p>
          </div>
          <div className="feature">
            <div className="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3>Selective Extraction</h3>
            <p>Choose exactly which pages to include for context-optimized results</p>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="mode-toggle">
          <button 
            type="button"
            className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
            onClick={() => { setMode('simple'); resetDiscovery(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Einfach
          </button>
          <button 
            type="button"
            className={`mode-btn ${mode === 'advanced' ? 'active' : ''}`}
            onClick={() => { setMode('advanced'); resetDiscovery(); }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
              <path d="M12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3ZM12 8C13.1046 8 14 8.89543 14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8ZM12 14C13.1046 14 14 14.8954 14 16C14 17.1046 13.1046 18 12 18C10.8954 18 10 17.1046 10 16C10 14.8954 10.8954 14 12 14Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Erweitert
          </button>
        </div>

        {mode === 'simple' ? (
          <form onSubmit={handleSimpleSubmit} className="form">
            <div className="input-group">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://docs.example.com"
                required
                className="url-input"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                disabled={isLoading || !url}
                className="submit-btn"
              >
                {isLoading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem', animation: 'spin 1s linear infinite'}}>
                      <path d="M21 12A9 9 0 11.818 8.218L2.75 9.282" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Kompiliert...
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Kompilieren
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="advanced-mode">
            {!discoveryData ? (
              <div className="discovery-section">
                <div className="input-group">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://docs.example.com"
                    required
                    className="url-input"
                    disabled={isDiscovering}
                  />
                  <button 
                    type="button"
                    onClick={handleDiscovery}
                    disabled={isDiscovering || !url}
                    className="discover-btn"
                  >
                    {isDiscovering ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem', animation: 'spin 1s linear infinite'}}>
                          <path d="M21 12A9 9 0 11.818 8.218L2.75 9.282" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Analysiere...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Analysieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="selection-section">
                <div className="discovery-header">
                  <h3>📚 {discoveryData.title}</h3>
                  <p>Gefunden: {discoveryData.totalPages} Seiten • Geschätzte Größe: {discoveryData.estimatedTotalSize}</p>
                  <button 
                    type="button"
                    onClick={resetDiscovery}
                    className="reset-btn"
                  >
                    ← Neue Analyse
                  </button>
                </div>
                
                <div className="page-categories">
                  {Object.entries(discoveryData.categories).map(([category, pages]) => {
                    const allSelected = pages.every(page => selectedPages.has(page.url));
                    const someSelected = pages.some(page => selectedPages.has(page.url));
                    
                    return (
                      <div key={category} className="category-section">
                        <div className="category-header">
                          <label className="category-checkbox">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              ref={input => {
                                if (input) input.indeterminate = someSelected && !allSelected;
                              }}
                              onChange={(e) => toggleCategorySelection(pages, e.target.checked)}
                            />
                            <h4>{category} ({pages.length})</h4>
                          </label>
                        </div>
                        
                        <div className="pages-list">
                          {pages.map(page => (
                            <label key={page.url} className="page-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedPages.has(page.url)}
                                onChange={() => togglePageSelection(page.url)}
                              />
                              <div className="page-info">
                                <div className="page-title">{page.title}</div>
                                <div className="page-meta">
                                  {page.description && <span className="page-desc">{page.description}</span>}
                                  <span className="page-size">{page.estimatedSize}</span>
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="compile-section">
                  <button 
                    type="button"
                    onClick={handleAdvancedCompile}
                    disabled={isLoading || selectedPages.size === 0}
                    className="submit-btn"
                  >
                    {isLoading ? (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem', animation: 'spin 1s linear infinite'}}>
                          <path d="M21 12A9 9 0 11.818 8.218L2.75 9.282" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Kompiliert {selectedPages.size} Seiten...
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                          <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        {selectedPages.size} Seiten Kompilieren
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error">
            <div style={{display: 'flex', alignItems: 'center'}}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2"/>
                <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Fehler: {error}
            </div>
          </div>
        )}

        {result && (
          <div className="result">
            <div className="result-header">
              <h2 style={{display: 'flex', alignItems: 'center'}}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                  <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Fertig!
              </h2>
              <button onClick={downloadMarkdown} className="download-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
                  <path d="M21 15V19A2 2 0 0119 21H5A2 2 0 013 19V15M7 10L12 15L17 10M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Download .md
              </button>
            </div>
            <pre className="result-content">{result.substring(0, 2000)}...</pre>
            <p className="result-info">
              Vollständige Dokumentation: {result.length.toLocaleString()} Zeichen
            </p>
          </div>
        )}

        <div className="examples">
          <h3 style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.5rem'}}>
              <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="1" x2="12" y2="3" stroke="currentColor" strokeWidth="2"/>
              <line x1="12" y1="21" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" stroke="currentColor" strokeWidth="2"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" stroke="currentColor" strokeWidth="2"/>
              <line x1="1" y1="12" x2="3" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="21" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="2"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" stroke="currentColor" strokeWidth="2"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Beispiele zum Ausprobieren:
          </h3>
          <div className="example-links">
            <button onClick={() => setUrl('https://docs.stripe.com/api')} className="example-btn">
              Stripe API Docs
            </button>
            <button onClick={() => setUrl('https://docs.openai.com/api')} className="example-btn">
              OpenAI API Docs
            </button>
            <button onClick={() => setUrl('https://docs.anthropic.com')} className="example-btn">
              Anthropic Docs
            </button>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>
          Made with 
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginLeft: '0.25rem', marginRight: '0.25rem', verticalAlign: 'middle'}}>
            <path d="M20.84 4.61A5.5 5.5 0 0016.5 2C14.86 2 13.5 2.93 12 4.86 10.5 2.93 9.14 2 7.5 2A5.5 5.5 0 003.16 4.61C2.42 5.35 2 6.36 2 7.44 2 8.52 2.42 9.53 3.16 10.27L12 19.1L20.84 10.27C21.58 9.53 22 8.52 22 7.44 22 6.36 21.58 5.35 20.84 4.61Z" fill="#ef4444"/>
          </svg>
          for the AI community • 
          <a href="https://github.com/pjhunger" target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{marginRight: '0.25rem', verticalAlign: 'middle'}}>
              <path d="M9 19C4 20.5 4 16.5 2 16M22 16V19.5C22 20.8807 20.8807 22 19.5 22H15.5C14.1193 22 13 20.8807 13 19.5V18.5C13 17.1193 14.1193 16 15.5 16H19.5C20.8807 16 22 17.1193 22 19.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M16 22V18.13A3.37 3.37 0 0015.3 16.17C13.2 15.8 9 14.65 9 9.5A7.92 7.92 0 0111 4.9A7.23 7.23 0 0112 1.27A3.5 3.5 0 0116 2.5V4.09C18.09 4.8 19.5 7.13 19.5 9.5C19.5 14.65 15.3 15.8 13.2 16.17A3.37 3.37 0 0012.7 18.13V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            GitHub
          </a>
        </p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          width: 100vw;
          padding: 0;
          display: flex;
          flex-direction: column;
          background: #0a0a0a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .container::before {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 60%),
            radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.25) 0%, transparent 60%),
            radial-gradient(circle at 40% 40%, rgba(239, 68, 68, 0.2) 0%, transparent 60%);
          filter: blur(80px);
          animation: wave 12s ease-in-out infinite;
          z-index: 1;
        }

        .container::after {
          content: '';
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.6;
          z-index: 2;
          animation: grain 8s ease-in-out infinite;
        }

        @keyframes grain {
          0%, 100% { 
            transform: translate(0, 0); 
          }
          25% { 
            transform: translate(-1px, 1px); 
          }
          50% { 
            transform: translate(1px, -1px); 
          }
          75% { 
            transform: translate(-1px, -1px); 
          }
        }

        @keyframes wave {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(1deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(-1deg);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .main {
          padding: 4rem 2rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          max-width: 900px;
          width: 100%;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }

        .title {
          margin: 0 0 1rem 0;
          line-height: 1.1;
          font-size: 3.5rem;
          font-weight: 300;
          text-align: center;
          color: #ffffff;
          letter-spacing: -0.02em;
        }

        .description {
          text-align: center;
          line-height: 1.6;
          font-size: 1.125rem;
          font-weight: 400;
          color: rgba(255,255,255,0.7);
          margin-bottom: 3rem;
          max-width: 480px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
          margin-bottom: 4rem;
          width: 100%;
          max-width: 720px;
        }

        .feature {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border-radius: 12px;
          padding: 1.5rem 1rem;
          text-align: center;
          color: white;
          border: 1px solid rgba(255,255,255,0.08);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255, 230, 0, 0.3);
          transform: translateY(-2px);
        }

        .feature h3 {
          margin: 0 0 0.75rem 0;
          font-size: 1.125rem;
          font-weight: 500;
        }

        .feature p {
          margin: 0;
          opacity: 0.8;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .feature-icon {
          margin-bottom: 1rem;
          color: rgba(255, 255, 255, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .mode-toggle {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          justify-content: center;
        }

        .mode-btn {
          padding: 0.75rem 1.5rem;
          border: 1px solid rgba(255,255,255,0.2);
          background: rgba(255,255,255,0.05);
          color: rgba(255,255,255,0.7);
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-family: inherit;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
        }

        .mode-btn:hover {
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .mode-btn.active {
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #000;
          border-color: #ffd700;
        }

        .form {
          width: 100%;
          margin-bottom: 2rem;
        }

        .advanced-mode {
          width: 100%;
        }

        .discovery-section {
          margin-bottom: 2rem;
        }

        .input-group {
          display: flex;
          gap: 0.75rem;
          width: 100%;
        }

        .url-input {
          flex: 1;
          padding: 1rem 1.25rem;
          font-size: 0.95rem;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          color: white;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .url-input::placeholder {
          color: rgba(255,255,255,0.4);
        }

        .url-input:focus {
          outline: none;
          border-color: rgba(255, 230, 0, 0.4);
          background: rgba(255,255,255,0.08);
          box-shadow: 0 0 0 1px rgba(255, 230, 0, 0.2);
        }

        .submit-btn {
          padding: 1rem 1.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
          color: #000;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          display: flex;
          align-items: center;
        }

        .submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ffed4e 0%, #ffd700 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(255, 215, 0, 0.3);
        }

        .submit-btn:disabled {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.3);
          cursor: not-allowed;
          transform: none;
        }

        .discover-btn {
          padding: 1rem 1.75rem;
          font-size: 0.9rem;
          font-weight: 500;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          display: flex;
          align-items: center;
        }

        .discover-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
        }

        .discover-btn:disabled {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.3);
          cursor: not-allowed;
          transform: none;
        }

        .selection-section {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 2rem;
          border: 1px solid rgba(255,255,255,0.08);
          margin-bottom: 2rem;
        }

        .discovery-header {
          margin-bottom: 2rem;
          text-align: center;
        }

        .discovery-header h3 {
          margin: 0 0 0.5rem 0;
          color: white;
          font-size: 1.25rem;
        }

        .discovery-header p {
          margin: 0 0 1rem 0;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }

        .reset-btn {
          background: rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .reset-btn:hover {
          background: rgba(255,255,255,0.15);
          color: white;
        }

        .page-categories {
          margin-bottom: 2rem;
        }

        .category-section {
          margin-bottom: 1.5rem;
        }

        .category-header {
          margin-bottom: 0.75rem;
        }

        .category-checkbox {
          display: flex;
          align-items: center;
          cursor: pointer;
          color: white;
        }

        .category-checkbox input {
          margin-right: 0.75rem;
          width: 16px;
          height: 16px;
        }

        .category-checkbox h4 {
          margin: 0;
          font-size: 1rem;
          font-weight: 500;
        }

        .pages-list {
          margin-left: 2rem;
          border-left: 1px solid rgba(255,255,255,0.1);
          padding-left: 1rem;
        }

        .page-checkbox {
          display: flex;
          align-items: flex-start;
          cursor: pointer;
          color: rgba(255,255,255,0.8);
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .page-checkbox:hover {
          background: rgba(255,255,255,0.05);
        }

        .page-checkbox input {
          margin-right: 0.75rem;
          margin-top: 0.125rem;
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }

        .page-info {
          flex: 1;
        }

        .page-title {
          font-size: 0.9rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          color: white;
        }

        .page-meta {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .page-desc {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.6);
          flex: 1;
        }

        .page-size {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.1);
          padding: 0.125rem 0.5rem;
          border-radius: 12px;
          white-space: nowrap;
        }

        .compile-section {
          text-align: center;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #fca5a5;
          padding: 1rem 1.25rem;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          width: 100%;
          font-size: 0.9rem;
        }

        .result {
          background: rgba(255,255,255,0.04);
          backdrop-filter: blur(20px);
          border-radius: 16px;
          padding: 2rem;
          width: 100%;
          margin-bottom: 2rem;
          color: white;
          border: 1px solid rgba(255,255,255,0.08);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .result-header h2 {
          margin: 0;
        }

        .download-btn {
          background: rgba(255,255,255,0.1);
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          font-family: inherit;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
        }

        .download-btn:hover {
          background: rgba(255,255,255,0.15);
          border-color: rgba(255, 230, 0, 0.4);
        }

        .result-content {
          background: rgba(0,0,0,0.3);
          padding: 1.25rem;
          border-radius: 12px;
          white-space: pre-wrap;
          overflow-x: auto;
          font-size: 0.85rem;
          line-height: 1.5;
          margin-bottom: 1rem;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
          border: 1px solid rgba(255,255,255,0.1);
        }

        .result-info {
          margin: 0;
          opacity: 0.8;
          font-size: 0.9rem;
        }

        .examples {
          width: 100%;
          text-align: center;
        }

        .examples h3 {
          color: rgba(255,255,255,0.9);
          margin-bottom: 1.25rem;
          font-weight: 500;
          font-size: 1rem;
        }

        .example-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          justify-content: center;
        }

        .example-btn {
          background: rgba(255,255,255,0.06);
          color: rgba(255,255,255,0.8);
          border: 1px solid rgba(255,255,255,0.12);
          padding: 0.5rem 1rem;
          border-radius: 24px;
          cursor: pointer;
          font-size: 0.85rem;
          font-family: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .example-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255, 230, 0, 0.3);
          color: white;
          transform: translateY(-1px);
        }

        .footer {
          width: 100%;
          height: 80px;
          border-top: 1px solid rgba(255,255,255,0.08);
          display: flex;
          justify-content: center;
          align-items: center;
          color: rgba(255,255,255,0.5);
          position: relative;
          z-index: 10;
        }

        .footer a {
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          margin-left: 0.5rem;
          transition: color 0.2s ease;
        }

        .footer a:hover {
          color: rgba(255, 230, 0, 0.8);
        }

        @media (max-width: 600px) {
          .title {
            font-size: 2.75rem;
          }
          
          .description {
            font-size: 1rem;
          }
          
          .input-group {
            flex-direction: column;
            gap: 1rem;
          }
          
          .features {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .main {
            padding: 2rem 1rem;
          }

          .mode-toggle {
            flex-direction: column;
            align-items: center;
          }

          .mode-btn {
            width: 100%;
            max-width: 200px;
            justify-content: center;
          }

          .pages-list {
            margin-left: 1rem;
            padding-left: 0.5rem;
          }

          .page-meta {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
}