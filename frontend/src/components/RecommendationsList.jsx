import React from 'react';

const ICONS = ['lightbulb', 'arrow-up-circle', 'shield-check', 'lightning-charge',
               'recycle', 'clipboard2-check', 'stars', 'gear'];

const RecommendationsList = ({ recommendations = [] }) => {
  if (recommendations.length === 0) {
    return (
      <div className="empty-state">
        <i className="bi bi-robot"></i>
        <div>Run an analysis to get AI recommendations.</div>
      </div>
    );
  }

  return (
    <div>
      {recommendations.map((rec, idx) => (
        <div className="rec-item" key={idx} style={{ animationDelay: `${idx * 60}ms` }}>
          <div className="rec-icon">
            <i className={`bi bi-${ICONS[idx % ICONS.length]}`}></i>
          </div>
          <div className="rec-text">{rec}</div>
        </div>
      ))}
    </div>
  );
};

export default RecommendationsList;
