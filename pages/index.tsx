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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          max-width: 800px;
          width: 100%;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
          text-align: center;
          color: white;
          text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }

        .description {
          text-align: center;
          line-height: 1.5;
          font-size: 1.5rem;
          color: rgba(255,255,255,0.9);
          margin-bottom: 2rem;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
          width: 100%;
        }

        .feature {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 1.5rem;
          text-align: center;
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .feature h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1.2rem;
        }

        .feature p {
          margin: 0;
          opacity: 0.9;
        }

        .form {
          width: 100%;
          margin-bottom: 2rem;
        }

        .input-group {
          display: flex;
          gap: 1rem;
          width: 100%;
        }

        .url-input {
          flex: 1;
          padding: 1rem;
          font-size: 1.1rem;
          border: none;
          border-radius: 10px;
          background: rgba(255,255,255,0.9);
          backdrop-filter: blur(10px);
        }

        .url-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(255,255,255,0.3);
        }

        .submit-btn {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: bold;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .submit-btn:hover:not(:disabled) {
          background: #45a049;
          transform: translateY(-2px);
        }

        .submit-btn:disabled {
          background: #cccccc;
          cursor: not-allowed;
          transform: none;
        }

        .error {
          background: rgba(255,0,0,0.1);
          border: 1px solid rgba(255,0,0,0.3);
          color: white;
          padding: 1rem;
          border-radius: 10px;
          margin-bottom: 1rem;
          width: 100%;
        }

        .result {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(10px);
          border-radius: 15px;
          padding: 2rem;
          width: 100%;
          margin-bottom: 2rem;
          color: white;
          border: 1px solid rgba(255,255,255,0.2);
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
          background: #2196F3;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 5px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .download-btn:hover {
          background: #1976D2;
        }

        .result-content {
          background: rgba(0,0,0,0.2);
          padding: 1rem;
          border-radius: 8px;
          white-space: pre-wrap;
          overflow-x: auto;
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 1rem;
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
          color: white;
          margin-bottom: 1rem;
        }

        .example-links {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          justify-content: center;
        }

        .example-btn {
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.3s ease;
        }

        .example-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: translateY(-1px);
        }

        .footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid rgba(255,255,255,0.2);
          display: flex;
          justify-content: center;
          align-items: center;
          color: rgba(255,255,255,0.8);
        }

        .footer a {
          color: rgba(255,255,255,0.9);
          text-decoration: none;
          margin-left: 0.5rem;
        }

        .footer a:hover {
          text-decoration: underline;
        }

        @media (max-width: 600px) {
          .title {
            font-size: 2.5rem;
          }
          
          .input-group {
            flex-direction: column;
          }
          
          .features {
            grid-template-columns: 1fr;
          }
          
          .example-links {
            flex-direction: column;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
}