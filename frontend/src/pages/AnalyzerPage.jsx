import { useRef, useState } from 'react';
import DuplicatesList from '../components/DuplicatesList';
import RecommendationsList from '../components/RecommendationsList';
import StrengthGauge from '../components/StrengthGauge';
import { analyzeCode } from '../services/api';

const LANGUAGES = [
  { value: 'python',     label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java',       label: 'Java' },
  { value: 'cpp',        label: 'C++' },
  { value: 'c',          label: 'C' },
  { value: 'go',         label: 'Go' },
  { value: 'rust',       label: 'Rust' },
];

const PLACEHOLDER = `# Paste your code here — e.g. Python example:

def calculate_total(items):
    total = 0
    for item in items:
        total = total + item['price']
    return total

def get_sum(items):
    total = 0
    for item in items:
        total = total + item['price']
    return total

class Order:
    def __init__(self, items):
        self.items = items

    def total(self):
        t = 0
        for i in self.items:
            t += i['price']
        return t
`;

const AnalyzerPage = () => {
  const [code, setCode]               = useState('');
  const [language, setLanguage]       = useState('python');
  const [loading, setLoading]         = useState(false);
  const [result, setResult]           = useState(null);
  const [error, setError]             = useState('');
  const [analyzed, setAnalyzed]       = useState(false);
  const resultsRef                    = useRef(null);

  const handleAnalyze = async () => {
    if (!code.trim()) {
      setError('Please paste some code first.');
      return;
    }
    setError('');
    setLoading(true);
    setResult(null);
    try {
      const data = await analyzeCode(code, language);
      setResult(data);
      setAnalyzed(true);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (err) {
      // Change this error message in production
      const msg = err.response?.data?.error || err.message || 'Analysis failed. Make sure the Django server is running.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setCode('');
    setResult(null);
    setError('');
    setAnalyzed(false);
  };

  const scoreColor = result
    ? result.strength_score >= 71 ? '#10b981'
    : result.strength_score >= 41 ? '#f59e0b'
    : '#ef4444'
    : 'var(--primary)';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 4rem' }}>

      {/* Hero */}
      <div className="hero-section">
        <h1 className="hero-title">AI Code Analyzer</h1>
        <p className="hero-subtitle">
          Paste any code snippet to instantly get a strength score, detect repeated blocks,
          and receive AI-powered recommendations.
        </p>
      </div>

      {/* Input Panel */}
      <div className="glass-card p-4 mb-4">
        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div className="section-header" style={{ marginBottom: 0, border: 'none', paddingBottom: 0, flex: 1 }}>
            <div className="section-icon" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary)' }}>
              <i className="bi bi-code-slash"></i>
            </div>
            <span>Code Input</span>
          </div>

          <select
            className="lang-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>

          {analyzed && (
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                borderRadius: '8px',
                padding: '6px 14px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <i className="bi bi-x-circle" style={{ marginRight: 5 }}></i>Clear
            </button>
          )}
        </div>

        {/* Textarea */}
        <textarea
          id="code-input"
          className="form-control code-editor w-100"
          rows={16}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
        />

        {/* Line / char count */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.5rem', fontSize:'0.75rem', color:'var(--text-muted)' }}>
          <span>{code.split('\n').length} lines · {code.length.toLocaleString()} chars</span>
          {code.trim() && <span style={{ color:'var(--primary)', cursor:'pointer' }} onClick={() => setCode('')}>Clear code</span>}
        </div>

        {/* Error */}
        {error && <div className="error-alert mt-3"><i className="bi bi-exclamation-circle me-2"></i>{error}</div>}

        {/* Analyze btn */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
          <button
            id="analyze-btn"
            className="btn-analyze"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Analyzing…
              </>
            ) : (
              <><i className="bi bi-hourglass-bottom"></i>Analyze Code</>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card">
          <div className="loading-overlay">
            <div className="spinner-ring"></div>
            <span>Running AI analysis — this may take a few seconds…</span>
          </div>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div ref={resultsRef}>
          {/* Summary bar */}
          <div
            className="glass-card p-3 mb-4"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
              borderColor: scoreColor,
              background: `linear-gradient(135deg, var(--bg-card) 60%, ${scoreColor}10)`,
            }}
          >
            <i className="bi bi-bar-chart-fill" style={{ color: scoreColor, fontSize: '1.3rem' }}></i>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Overall Strength</div>
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: scoreColor }}>
                {result.strength_score}/100 — {result.strength_label}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span className="score-pill" style={{ background: 'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5' }}>
                <i className="bi bi-copy"></i> {result.duplicate_count} duplicate{result.duplicate_count !== 1 ? 's' : ''}
              </span>
              <span className="score-pill" style={{ background: 'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc' }}>
                <i className="bi bi-robot"></i> {result.recommendations?.length ?? 0} suggestions
              </span>
            </div>
          </div>

          {/* Three columns */}
          <div className="row g-4">
            {/* Strength Gauge */}
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100">
                <div className="section-header">
                  <div className="section-icon" style={{ background: '#10b98120', color: '#10b981' }}>
                    <i className="bi bi-speedometer2"></i>
                  </div>
                  Code Strength
                </div>
                <StrengthGauge
                  score={result.strength_score}
                  label={result.strength_label}
                  breakdown={result.strength_breakdown}
                />
              </div>
            </div>

            {/* Duplicates */}
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100">
                <div className="section-header">
                  <div className="section-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}>
                    <i className="bi bi-files"></i>
                  </div>
                  Duplicate Blocks
                  {result.duplicate_count > 0 && (
                    <span className="ms-auto score-pill" style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5' }}>
                      {result.duplicate_count}
                    </span>
                  )}
                </div>
                <DuplicatesList duplicates={result.duplicates} />
              </div>
            </div>

            {/* AI Recommendations */}
            <div className="col-lg-4">
              <div className="glass-card p-4 h-100">
                <div className="section-header">
                  <div className="section-icon" style={{ background: '#6366f120', color: '#6366f1' }}>
                    <i className="bi bi-stars"></i>
                  </div>
                  AI Recommendations
                </div>
                <RecommendationsList recommendations={result.recommendations} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyzerPage;
