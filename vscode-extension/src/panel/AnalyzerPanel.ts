import * as vscode from 'vscode';

export class AnalyzerPanel {
    public static currentPanel: AnalyzerPanel | undefined;
    
    public static readonly viewType = 'aiAnalyzerPanel';

    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    public static createOrShow(extensionUri: vscode.Uri) {
        const column = vscode.window.activeTextEditor
            ? vscode.ViewColumn.Beside
            : vscode.ViewColumn.One;

        if (AnalyzerPanel.currentPanel) {
            AnalyzerPanel.currentPanel._panel.reveal(column);
            return;
        }

        const panel = vscode.window.createWebviewPanel(
            AnalyzerPanel.viewType,
            'AI Code Analyzer',
            column,
            {
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
                retainContextWhenHidden: true
            }
        );

        AnalyzerPanel.currentPanel = new AnalyzerPanel(panel, extensionUri);
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;

        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
        
        this._panel.webview.html = this._getHtmlForWebview();

        // Handle messages from the webview (e.g. clicking a duplicate line goes to code)
        this._panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'jumpToLine':
                        this.jumpToLine(message.line);
                        return;
                }
            },
            null,
            this._disposables
        );
    }

    public setLoading(isLoading: boolean) {
        this._panel.webview.postMessage({ command: 'setLoading', isLoading });
    }

    public showResults(data: any) {
        this._panel.webview.postMessage({ command: 'showResults', data });
    }

    public setError(errorMsg: string) {
        this._panel.webview.postMessage({ command: 'setError', error: errorMsg });
    }

    private jumpToLine(line: number) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // VS Code is 0-indexed, incoming is 1-indexed
            const targetLine = Math.max(0, line - 1);
            const pos = new vscode.Position(targetLine, 0);
            const range = new vscode.Range(pos, pos);
            editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            editor.selection = new vscode.Selection(pos, pos);
        }
    }

    public dispose() {
        AnalyzerPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    private _getHtmlForWebview() {
        const webview = this._panel.webview;
        
        // Local CSS and JS files
        const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'panel.css'));
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'media', 'panel.js'));

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Analyzer</title>
                <link href="${styleUri}" rel="stylesheet">
            </head>
            <body>
                <div id="loading" class="hidden">
                    <div class="spinner"></div>
                    <p>Analyzing code structure & fetching AI recommendations...</p>
                </div>
                
                <div id="error" class="hidden error-box"></div>

                <div id="content" class="hidden">
                    <!-- Gauge -->
                    <div class="card gauge-card">
                        <h3>Code Strength</h3>
                        <div class="gauge-container">
                            <svg class="gauge-svg" viewBox="0 0 200 120">
                                <path class="gauge-bg" d="M 20 100 A 80 80 0 0 1 180 100" />
                                <path id="gauge-fill" class="gauge-value" d="M 20 100 A 80 80 0 0 1 180 100" />
                                <text id="score-text" class="score-text" x="100" y="85">0</text>
                                <text class="max-text" x="100" y="105">/ 100</text>
                            </svg>
                            <div id="score-label" class="score-label"></div>
                        </div>
                        <div id="breakdown-grid" class="breakdown-grid"></div>
                    </div>

                    <!-- Duplicates -->
                    <div class="card">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <h3>Duplicate Blocks</h3>
                            <span id="dup-badge" class="badge dup-badge hidden">0</span>
                        </div>
                        <div id="duplicates-list" class="duplicates-list"></div>
                    </div>

                    <!-- Recommendations -->
                    <div class="card mb-large">
                        <h3>AI Recommendations</h3>
                        <div id="recommendations-list" class="recommendations-list"></div>
                    </div>
                </div>

                <script src="${scriptUri}"></script>
            </body>
            </html>`;
    }
}
