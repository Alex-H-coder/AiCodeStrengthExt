"""
Duplicate Code Block Detector
==============================
Uses a sliding-window hashing approach (rolling hash) to find
repeated code blocks within a single file/snippet.

Returns a list of:
  {
    "start_line": int,
    "end_line": int,
    "duplicate_of_line": int,
    "content": str
  }
"""
import hashlib
import logging

logger = logging.getLogger(__name__)

# Minimum number of lines in a block to be considered a duplicate
MIN_BLOCK_SIZE = 3


def _normalize_line(line: str) -> str:
    """Strip whitespace and collapse internal spaces for comparison."""
    return ' '.join(line.split()).lower()


def _hash_block(lines: list[str]) -> str:
    """Create a fingerprint for a block of lines."""
    normalized = '\n'.join(_normalize_line(l) for l in lines if _normalize_line(l))
    return hashlib.md5(normalized.encode()).hexdigest()


def find_duplicates(code: str, language: str = 'python', min_lines: int = MIN_BLOCK_SIZE) -> list[dict]:
    """
    Detects repeated code blocks using sliding-window hashing.

    Args:
        code: Source code string
        language: Programming language (informational)
        min_lines: Minimum block size to consider

    Returns:
        List of duplicate block descriptors.
    """
    if not code or not code.strip():
        return []

    all_lines = code.splitlines()
    # Remove blank-only lines from consideration but keep original indices
    meaningful = [(i + 1, line) for i, line in enumerate(all_lines) if line.strip()]

    if len(meaningful) < min_lines * 2:
        return []

    # Build hash map: hash -> first occurrence starting line number
    hash_map: dict[str, int] = {}
    duplicates: list[dict] = []
    seen_pairs: set[tuple[int, int]] = set()

    window = min_lines

    for i in range(len(meaningful) - window + 1):
        block = [line for _, line in meaningful[i:i + window]]
        block_hash = _hash_block(block)
        start_orig = meaningful[i][0]
        end_orig = meaningful[i + window - 1][0]

        if block_hash in hash_map:
            original_start = hash_map[block_hash]
            pair_key = (original_start, start_orig)
            if pair_key not in seen_pairs:
                seen_pairs.add(pair_key)
                content_preview = '\n'.join(block[:5])
                if len(block) > 5:
                    content_preview += f'\n... ({len(block) - 5} more lines)'
                duplicates.append({
                    "start_line": start_orig,
                    "end_line": end_orig,
                    "duplicate_of_line": original_start,
                    "content": content_preview,
                })
        else:
            hash_map[block_hash] = start_orig

    # De-duplicate overlapping ranges — keep the largest
    return _deduplicate(duplicates)


def _deduplicate(duplicates: list[dict]) -> list[dict]:
    """Remove overlapping duplicate ranges, preferring larger blocks."""
    if not duplicates:
        return []

    sorted_dups = sorted(duplicates, key=lambda d: (d['start_line'], -(d['end_line'] - d['start_line'])))
    result = []
    last_end = -1

    for dup in sorted_dups:
        if dup['start_line'] > last_end:
            result.append(dup)
            last_end = dup['end_line']

    return result
