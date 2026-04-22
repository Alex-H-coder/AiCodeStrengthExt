import React from 'react';

const DuplicatesList = ({ duplicates = [] }) => {
  if (duplicates.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-check2-circle" style={{ color: '#10b981', opacity: 1 }}></i>
        <div style={{ fontWeight: 600, color: '#10b981', marginBottom: 4 }}>No Duplicates Found</div>
        <div style={{ fontSize: '0.82rem' }}>Your code has no repeated blocks — great job!</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <i className="bi bi-exclamation-triangle-fill" style={{ color: '#f59e0b', marginRight: 6 }}></i>
        {duplicates.length} repeated block{duplicates.length > 1 ? 's' : ''} detected — consider extracting into shared functions.
      </div>

      <div className="accordion dup-accordion" id="dupAccordion">
        {duplicates.map((dup, idx) => (
          <div className="accordion-item" key={idx}>
            <h2 className="accordion-header">
              <button
                className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`}
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#dupCollapse${idx}`}
                aria-expanded={idx === 0}
                aria-controls={`dupCollapse${idx}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <span
                    style={{
                      background: 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: '#fca5a5',
                      borderRadius: '6px',
                      padding: '1px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    #{idx + 1}
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.83rem' }}>
                    Lines <strong style={{ color: 'var(--text-primary)' }}>{dup.start_line}–{dup.end_line}</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>
                      (duplicate of line {dup.duplicate_of_line})
                    </span>
                  </span>
                </span>
              </button>
            </h2>
            <div
              id={`dupCollapse${idx}`}
              className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
              data-bs-parent="#dupAccordion"
            >
              <div className="accordion-body">
                <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginBottom: '6px', fontFamily: 'Inter, sans-serif' }}>
                  Repeated block preview:
                </div>
                {dup.content}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DuplicatesList;
