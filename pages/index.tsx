import { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
          📚 Doc Compiler
        </h1>

        <p className="description">
          Verwandel jede Dokumentations-Website in ein AI-freundliches Format
        </p>

        <div className="features">
          <div className="feature">
            <h3>🗺️ Sitemap Discovery</h3>
            <p>Automatisches Finden aller Dokumentationsseiten</p>
          </div>
          <div className="feature">
            <h3>🤖 AI-optimiert</h3>
            <p>Perfekt strukturiert für Claude, ChatGPT & Co.</p>
          </div>
          <div className="feature">
            <h3>⚡ Schnell</h3>
            <p>Innerhalb von Sekunden fertig</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="form">
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
              {isLoading ? '🔄 Kompiliert...' : '🚀 Kompilieren'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error">
            <p>❌ Fehler: {error}</p>
          </div>
        )}

        {result && (
          <div className="result">
            <div className="result-header">
              <h2>✅ Fertig!</h2>
              <button onClick={downloadMarkdown} className="download-btn">
                📥 Download .md
              </button>
            </div>
            <pre className="result-content">{result.substring(0, 2000)}...</pre>
            <p className="result-info">
              Vollständige Dokumentation: {result.length.toLocaleString()} Zeichen
            </p>
          </div>
        )}

        <div className="examples">
          <h3>💡 Beispiele zum Ausprobieren:</h3>
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
          Made with ❤️ for the AI community • 
          <a href="https://github.com/yourusername/doc-compiler" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </p>
      </footer>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: #0a0a0a;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          position: relative;
          overflow: hidden;
        }

        .container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 80%, rgba(255, 230, 0, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 235, 59, 0.08) 0%, transparent 50%);
          animation: wave 8s ease-in-out infinite;
          z-index: 1;
        }

        .container::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.3;
          z-index: 2;
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

        .main {
          padding: 3rem 1rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          max-width: 600px;
          width: 100%;
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
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 1.5rem;
          margin-bottom: 4rem;
          width: 100%;
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

        .form {
          width: 100%;
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
        }
      `}</style>
    </div>
  );
}