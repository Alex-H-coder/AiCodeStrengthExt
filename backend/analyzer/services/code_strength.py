"""
Code Strength Scorer
====================
Calculates a 0-100 strength score for code snippets.

Scoring breakdown:
  - Complexity (35pts): Cyclomatic complexity via radon
  - Maintainability (25pts): Maintainability Index via radon
  - Comment ratio (15pts): Comments vs code lines
  - Clean imports (15pts): Unused imports via pyflakes AST check
  - Code length (10pts): Penalises excessively long functions
"""
import ast
import re
import logging

logger = logging.getLogger(__name__)


def _count_comment_lines(code: str, language: str) -> tuple[int, int]:
    """Returns (comment_lines, total_lines)."""
    lines = code.splitlines()
    total = len(lines)
    if language == 'python':
        comment_lines = sum(1 for l in lines if l.strip().startswith('#'))
    elif language in ('javascript', 'typescript', 'java', 'c', 'cpp'):
        comment_lines = sum(
            1 for l in lines
            if l.strip().startswith('//') or l.strip().startswith('*') or l.strip().startswith('/*')
        )
    else:
        comment_lines = sum(1 for l in lines if l.strip().startswith('#') or l.strip().startswith('//'))
    return comment_lines, max(total, 1)


def _cyclomatic_complexity_score(code: str, language: str) -> float:
    """
    Returns a score 0-35 based on cyclomatic complexity.
    Lower complexity => higher score.
    Uses radon for Python; estimates for other languages.
    """
    if language == 'python':
        try:
            from radon.complexity import cc_visit
            results = cc_visit(code)
            if not results:
                return 35.0
            avg_cc = sum(r.complexity for r in results) / len(results)
            # CC 1 = perfect (35), CC 10+ = worst (0)
            score = max(0.0, 35.0 - (avg_cc - 1) * (35 / 9))
            return round(score, 2)
        except Exception:
            pass

    # Generic estimate: count branching keywords
    branch_keywords = ['if ', 'elif ', 'else:', 'for ', 'while ', 'case ', 'catch ', 'except ', '&&', '||', '??']
    lines = code.splitlines()
    branches = sum(
        sum(1 for kw in branch_keywords if kw in line)
        for line in lines
    )
    normalized = min(branches / max(len(lines), 1) * 10, 10)
    return round(max(0.0, 35.0 - normalized * 3.5), 2)


def _maintainability_score(code: str, language: str) -> float:
    """Returns a score 0-25 based on Maintainability Index (Python only)."""
    if language == 'python':
        try:
            from radon.metrics import mi_visit
            mi = mi_visit(code, multi=True)
            # MI ranges 0-100; map to 0-25
            score = (mi / 100) * 25
            return round(max(0.0, min(25.0, score)), 2)
        except Exception:
            pass
    # Fallback: estimate from average line length
    lines = [l for l in code.splitlines() if l.strip()]
    if not lines:
        return 15.0
    avg_len = sum(len(l) for l in lines) / len(lines)
    # Penalty for very long lines
    score = max(0.0, 25.0 - max(0.0, avg_len - 40) * 0.3)
    return round(min(25.0, score), 2)


def _comment_ratio_score(code: str, language: str) -> float:
    """Returns a score 0-15 based on comment ratio."""
    comment_lines, total_lines = _count_comment_lines(code, language)
    ratio = comment_lines / total_lines
    # Ideal ratio: 10-30% comments
    if ratio < 0.05:
        score = ratio * 150  # ramp up from 0
    elif ratio <= 0.30:
        score = 15.0
    else:
        score = max(0.0, 15.0 - (ratio - 0.30) * 30)
    return round(score, 2)


def _clean_imports_score(code: str, language: str) -> float:
    """Returns a score 0-15: penalises unused imports (Python only)."""
    if language != 'python':
        return 10.0  # neutral for other languages
    try:
        import pyflakes.api as pf_api
        import pyflakes.checker as pf_checker
        import io

        tree = ast.parse(code)
        w = pf_checker.Checker(tree, '<string>')
        unused = [m for m in w.messages if 'imported but unused' in str(m) or 'redefined' in str(m).lower()]
        penalty = len(unused) * 3
        return round(max(0.0, 15.0 - penalty), 2)
    except SyntaxError:
        return 0.0  # syntax error is a big deal
    except Exception:
        return 10.0


def _function_length_score(code: str, language: str) -> float:
    """Returns a score 0-10: penalises very long functions/methods."""
    if language == 'python':
        try:
            tree = ast.parse(code)
            lengths = []
            for node in ast.walk(tree):
                if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    end = getattr(node, 'end_lineno', node.lineno + 10)
                    lengths.append(end - node.lineno)
            if not lengths:
                return 10.0
            max_len = max(lengths)
            if max_len <= 20:
                return 10.0
            elif max_len <= 50:
                return 7.0
            elif max_len <= 100:
                return 4.0
            else:
                return 1.0
        except Exception:
            pass
    # Generic: just check total line count per "function-like" block
    total_lines = len(code.splitlines())
    if total_lines <= 50:
        return 10.0
    elif total_lines <= 150:
        return 6.0
    return 3.0


def calculate_strength(code: str, language: str = 'python') -> dict:
    """
    Main entry point. Returns a dict with overall score and breakdown.
    
    Returns:
        {
            "score": float (0-100),
            "label": "Weak" | "Fair" | "Good" | "Strong" | "Excellent",
            "breakdown": {
                "complexity": float,
                "maintainability": float,
                "comment_ratio": float,
                "clean_imports": float,
                "function_length": float,
            }
        }
    """
    language = language.lower()

    breakdown = {
        "complexity": _cyclomatic_complexity_score(code, language),
        "maintainability": _maintainability_score(code, language),
        "comment_ratio": _comment_ratio_score(code, language),
        "clean_imports": _clean_imports_score(code, language),
        "function_length": _function_length_score(code, language),
    }

    score = sum(breakdown.values())
    score = round(min(100.0, max(0.0, score)), 1)

    if score >= 85:
        label = "Excellent"
    elif score >= 70:
        label = "Strong"
    elif score >= 50:
        label = "Good"
    elif score >= 30:
        label = "Fair"
    else:
        label = "Weak"

    return {"score": score, "label": label, "breakdown": breakdown}
