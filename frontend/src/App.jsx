import AnalyzerPage from './pages/AnalyzerPage';

const App = () => {
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav className="app-navbar">
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" className="brand">
            <div className="brand-icon">
              <i className="bi bi-cpu-fill"></i>
            </div>
            CodeAI Analyzer
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="nav-badge">Gemini AI</span>
            <a
              href="https://aistudio.google.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-muted)'}
            >
              <i className="bi bi-box-arrow-up-right me-1"></i>Get API Key
            </a>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main>
        <AnalyzerPage />
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem 1rem',
        color: 'var(--text-muted)',
        fontSize: '0.8rem',
        borderTop: '1px solid var(--border)',
      }}>
        <span>Built with Django · React · Bootstrap 5 . Uses Gemini AI</span> {/* needs to be changed when agreement is made with skynet */}
        <span>copyright © 2026 CodeAI Analyzer. All rights reserved. product by Skynet technology</span>
        <span style={{ margin: '0 0.75rem', opacity: 0.3 }}>|</span>

        {/* Note: The backend server must be running for the AI analysis to work (this code is to be removed in production)*/}
        <span>Run <code style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', padding: '1px 6px', borderRadius: '4px' }}>python manage.py runserver</code> to activate AI analysis</span>
      </footer>
    </div>
  );
};

export default App;
