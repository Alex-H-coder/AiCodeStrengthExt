"""
AI Recommendations via Google Gemini 1.5 Flash
================================================
Sends code + analysis summary to Gemini and returns
a list of actionable recommendations.
"""
import logging
import os
from django.conf import settings

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are an expert code reviewer. 
Given a code snippet and its quality analysis metrics, provide 5-7 concise, 
actionable recommendations to improve the code quality.

Format your response as a JSON array of strings, for example:
["Recommendation 1", "Recommendation 2", ...]

Focus on:
- Code structure and readability
- Performance improvements
- Bug-prone patterns
- Best practices for the language
- Refactoring opportunities

Be specific and practical. Keep each recommendation under 120 characters."""


def get_recommendations(code: str, language: str, strength_score: float,
                         breakdown: dict, duplicate_count: int) -> list[str]:
    """
    Call Gemini 1.5 Flash to get code recommendations.
    Falls back to rule-based recommendations if Gemini is unavailable.

    Args:
        code: Source code snippet
        language: Programming language
        strength_score: Overall score 0-100
        breakdown: Score breakdown dict
        duplicate_count: Number of duplicate blocks found

    Returns:
        List of recommendation strings
    """
    api_key = getattr(settings, 'GEMINI_API_KEY', '') or os.environ.get('GEMINI_API_KEY', '')

    if api_key and api_key != 'your-gemini-api-key-here':
        try:
            return _call_gemini(api_key, code, language, strength_score, breakdown, duplicate_count)
        except Exception as e:
            logger.warning(f"Gemini API call failed: {e}. Falling back to rule-based recommendations.")

    return _rule_based_recommendations(code, language, strength_score, breakdown, duplicate_count)


def _call_gemini(api_key: str, code: str, language: str, strength_score: float,
                  breakdown: dict, duplicate_count: int) -> list[str]:
    """Make actual Gemini API call."""
    import google.generativeai as genai
    import json

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # Truncate code if too long (Gemini has token limits)
    code_preview = code[:3000] + ('\n... [truncated]' if len(code) > 3000 else '')

    summary = (
        f"Language: {language}\n"
        f"Overall strength score: {strength_score}/100\n"
        f"Cyclomatic complexity score: {breakdown.get('complexity', 'N/A')}/35\n"
        f"Maintainability score: {breakdown.get('maintainability', 'N/A')}/25\n"
        f"Comment ratio score: {breakdown.get('comment_ratio', 'N/A')}/15\n"
        f"Clean imports score: {breakdown.get('clean_imports', 'N/A')}/15\n"
        f"Function length score: {breakdown.get('function_length', 'N/A')}/10\n"
        f"Duplicate code blocks found: {duplicate_count}\n"
    )

    prompt = f"{SYSTEM_PROMPT}\n\n### Analysis Summary:\n{summary}\n\n### Code:\n```{language}\n{code_preview}\n```"

    response = model.generate_content(prompt)
    text = response.text.strip()

    # Parse JSON array from response
    # Try to extract JSON array even if wrapped in markdown
    import re
    json_match = re.search(r'\[.*?\]', text, re.DOTALL)
    if json_match:
        try:
            recs = json.loads(json_match.group())
            if isinstance(recs, list):
                return [str(r) for r in recs[:8]]
        except json.JSONDecodeError:
            pass

    # Fallback: split by newlines if not valid JSON
    lines = [l.strip().lstrip('•-*1234567890.').strip() for l in text.splitlines() if l.strip()]
    return [l for l in lines if len(l) > 10][:8]


def _rule_based_recommendations(code: str, language: str, strength_score: float,
                                  breakdown: dict, duplicate_count: int) -> list[str]:
    """Fallback rule-based recommendations when Gemini is unavailable."""
    recs = []
    lines = code.splitlines()

    if duplicate_count > 0:
        recs.append(
            f"Extract {duplicate_count} repeated code block(s) into reusable functions to reduce duplication."
        )

    if breakdown.get('complexity', 35) < 20:
        recs.append("Reduce function complexity: break large functions into smaller, single-responsibility units.")

    if breakdown.get('comment_ratio', 15) < 8:
        recs.append("Add docstrings/comments to explain intent, parameters, and return values of functions.")

    if breakdown.get('clean_imports', 15) < 10:
        recs.append("Remove unused imports to keep the namespace clean and improve load performance.")

    if breakdown.get('function_length', 10) < 5:
        recs.append("Shorten long functions — aim for functions under 30 lines for better readability.")

    long_lines = [i + 1 for i, l in enumerate(lines) if len(l) > 120]
    if long_lines:
        recs.append(f"Shorten lines > 120 chars (found at: {long_lines[:5]}) to improve readability.")

    if language == 'python':
        if 'except:' in code or 'except Exception:' in code:
            recs.append("Avoid bare `except:` clauses — catch specific exceptions for clearer error handling.")
        if 'global ' in code:
            recs.append("Minimize use of `global` variables — prefer passing state as function parameters.")

    if strength_score >= 80:
        recs.append("🎉 Great code quality! Consider adding unit tests and type hints if not already present.")
    elif strength_score >= 60:
        recs.append("Good foundation. Consider enabling a linter (flake8/eslint) in your CI pipeline.")
    else:
        recs.append("Consider a comprehensive refactor following SOLID principles for long-term maintainability.")

    return recs[:7] if recs else ["No specific issues detected. Keep following best practices!"]
