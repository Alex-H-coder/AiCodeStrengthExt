import * as vscode from 'vscode';
import axios from 'axios';
import { AnalyzerPanel } from './panel/AnalyzerPanel';

// Store references to editor decorations
let duplicateDecorations: vscode.TextEditorDecorationType | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('AI Code Analyzer extension is now active!');

    // Command: Analyze Current File
    const analyzeCmd = vscode.commands.registerCommand('aiCodeAnalyzer.analyze', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active file to analyze.');
            return;
        }
        await performAnalysis(editor.document, context);
    });

    // Command: Analyze Selection
    const analyzeSelectionCmd = vscode.commands.registerCommand('aiCodeAnalyzer.analyzeSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const selection = editor.selection;
        if (selection.isEmpty) {
            vscode.window.showInformationMessage('No code selected. Analyzing the whole file instead.');
            await performAnalysis(editor.document, context);
            return;
        }
        
        // Tricky: we pass the whole document to get correct line numbers, 
        // but maybe in the future we slice it. For now, let's just analyze the whole file.
        vscode.window.showInformationMessage('Analyzing file (selection-specific analysis coming soon)...');
        await performAnalysis(editor.document, context);
    });

    // Auto-analyze on save if configured
    const onSave = vscode.workspace.onDidSaveTextDocument(async (document) => {
        const config = vscode.workspace.getConfiguration('aiCodeAnalyzer');
        if (config.get<boolean>('analyzeOnSave')) {
            await performAnalysis(document, context);
        }
    });

    context.subscriptions.push(analyzeCmd, analyzeSelectionCmd, onSave);
}

async function performAnalysis(document: vscode.TextDocument, context: vscode.ExtensionContext) {
    // Only text files, not output panels
    if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
        return;
    }

    const code = document.getText();
    if (!code.trim()) {
        return;
    }

    const config = vscode.workspace.getConfiguration('aiCodeAnalyzer');
    const apiUrl = config.get<string>('apiUrl', 'http://127.0.0.1:8000');
    // Map VS Code language IDs to our backend names (fallback to python)
    const language = document.languageId || 'python';

    // Show panel right away in loading state
    AnalyzerPanel.createOrShow(context.extensionUri);
    AnalyzerPanel.currentPanel?.setLoading(true);

    try {
        const response = await axios.post(`${apiUrl}/api/analyze/`, {
            code,
            language
        });

        const data = response.data;
        
        // 1. Send data to WebView
        AnalyzerPanel.currentPanel?.showResults(data);

        // 2. Highlight duplicates in editor
        highlightDuplicates(document, data.duplicates || []);

    } catch (error: any) {
        console.error('Analysis failed:', error);
        let msg = 'Analysis failed. Make sure the Django backend is running at ' + apiUrl;
        if (error.response && error.response.data && error.response.data.error) {
            msg = `Analysis failed: ${error.response.data.error}`;
        }
        vscode.window.showErrorMessage(msg);
        AnalyzerPanel.currentPanel?.setError(msg);
    }
}

function highlightDuplicates(document: vscode.TextDocument, duplicates: any[]) {
    // Clear old decorations
    if (duplicateDecorations) {
        duplicateDecorations.dispose();
    }

    // Create new decoration type
    duplicateDecorations = vscode.window.createTextEditorDecorationType({
        backgroundColor: 'rgba(245, 158, 11, 0.2)', // Amber highlight
        isWholeLine: true,
        overviewRulerColor: 'rgba(245, 158, 11, 0.8)',
        overviewRulerLane: vscode.OverviewRulerLane.Right,
        border: '1px solid rgba(245, 158, 11, 0.5)',
        borderRadius: '2px'
    });

    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || activeEditor.document.uri.toString() !== document.uri.toString()) {
        return; // Editor changed or closed
    }

    const ranges: vscode.Range[] = [];

    for (const dup of duplicates) {
        // Backend lines are 1-indexed, VS Code ranges are 0-indexed
        const startLine = Math.max(0, dup.start_line - 1);
        const endLine = Math.min(document.lineCount - 1, dup.end_line - 1);
        
        // Ensure range is valid
        if (startLine <= endLine) {
            // Create range covering whole lines
            const startPos = new vscode.Position(startLine, 0);
            const endPos = document.lineAt(endLine).range.end;
            
            ranges.push(new vscode.Range(startPos, endPos));
        }
    }

    activeEditor.setDecorations(duplicateDecorations, ranges);
}

export function deactivate() {
    if (duplicateDecorations) {
        duplicateDecorations.dispose();
    }
}
