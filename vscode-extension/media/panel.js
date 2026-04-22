// VS Code VSWebview API
const vscode = acquireVsCodeApi();

// Elements
const loadingEl = document.getElementById('loading');
const contentEl = document.getElementById('content');
const errorEl = document.getElementById('error');

const gaugeFill = document.getElementById('gauge-fill');
const scoreText = document.getElementById('score-text');
const scoreLabel = document.getElementById('score-label');
const breakdownGrid = document.getElementById('breakdown-grid');

const dupBadge = document.getElementById('dup-badge');
const dupList = document.getElementById('duplicates-list');

const recList = document.getElementById('recommendations-list');

// Listen for messages from extension
window.addEventListener('message', event => {
    const message = event.data;

    switch (message.command) {
        case 'setLoading':
            setLoading(message.isLoading);
            break;
        case 'showResults':
            showResults(message.data);
            break;
        case 'setError':
            showError(message.error);
            break;
    }
});

function setLoading(isLoading) {
    if (isLoading) {
        loadingEl.classList.remove('hidden');
        contentEl.classList.add('hidden');
        errorEl.classList.add('hidden');
    }
}

function showError(msg) {
    loadingEl.classList.add('hidden');
    contentEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
    errorEl.textContent = msg;
}

function showResults(data) {
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    contentEl.classList.remove('hidden');

    // --- Strength Gauge ---
    const score = data.strength_score || 0;
    const color = score >= 71 ? 'var(--gauge-green)' : (score >= 41 ? 'var(--gauge-amber)' : 'var(--gauge-red)');
    
    scoreText.textContent = Math.round(score);
    scoreText.style.fill = color;
    scoreLabel.textContent = data.strength_label || '';
    scoreLabel.style.color = color;
    
    // Animate arc (251.2 is half-circle circumference for r=80)
    const strokeOffset = 251.2 - (score / 100) * 251.2;
    // Slight delay so the DOM paints before animating
    setTimeout(() => {
        gaugeFill.style.strokeDashoffset = strokeOffset;
        gaugeFill.style.stroke = color;
    }, 50);

    // Breakdown bars
    const bd = data.strength_breakdown || {};
    breakdownGrid.innerHTML = `
        ${createBreakdownItem('Complexity', bd.complexity, 35)}
        ${createBreakdownItem('Maintainability', bd.maintainability, 25)}
        ${createBreakdownItem('Clean Imports', bd.clean_imports, 15)}
        ${createBreakdownItem('Comments', bd.comment_ratio, 15)}
    `;

    // --- Duplicates ---
    const dcount = data.duplicate_count || 0;
    if (dcount > 0) {
        dupBadge.classList.remove('hidden');
        dupBadge.textContent = dcount;
        dupList.innerHTML = (data.duplicates || []).map((d, i) => `
            <div class="dup-item">
                <a href="#" onclick="jumpTo(event, ${d.start_line})">Lines ${d.start_line}–${d.end_line}</a>
                <span style="color:var(--vscode-descriptionForeground); margin-left:6px;">(dup of ln ${d.duplicate_of_line})</span>
                <div class="code-preview">${escapeHtml(d.content).substring(0, 100)}...</div>
            </div>
        `).join('');
    } else {
        dupBadge.classList.add('hidden');
        dupList.innerHTML = `<span style="color:var(--gauge-green);">✓ No duplicate code detected.</span>`;
    }

    // --- Recommendations ---
    const recs = data.recommendations || [];
    if (recs.length > 0) {
        recList.innerHTML = recs.map(r => `
            <div class="rec-item">
                <div class="rec-icon">✦</div>
                <div>${escapeHtml(r)}</div>
            </div>
        `).join('');
    } else {
        recList.innerHTML = `<span style="color:var(--vscode-descriptionForeground);">No recommendations.</span>`;
    }
}

function createBreakdownItem(label, val, max) {
    if (val === undefined) return '';
    const pct = Math.min((val / max) * 100, 100);
    const color = pct >= 70 ? 'var(--gauge-green)' : (pct >= 40 ? 'var(--gauge-amber)' : 'var(--gauge-red)');
    return `
        <div class="bd-item">
            <div style="display:flex; justify-content:space-between;" class="bd-label">
                <span>${label}</span>
                <span style="color:var(--vscode-foreground);">${Number(val).toFixed(0)}</span>
            </div>
            <div style="background:var(--vscode-editorIndentGuide-background); height:4px; border-radius:2px;">
                <div class="bd-bar" style="width:${pct}%; background:${color};"></div>
            </div>
        </div>
    `;
}

// Post message back to extension to reveal line in editor
function jumpTo(event, line) {
    event.preventDefault();
    vscode.postMessage({ command: 'jumpToLine', line });
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}
