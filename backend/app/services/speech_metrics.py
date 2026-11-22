"""Delivery metrics for spoken answers. Calculated locally, so they use no AI calls."""
import re
from collections import Counter

# "like" is excluded because it is usually a legitimate word and would inflate the count.
_FILLERS = re.compile(
    r"\b(um+|uh+|hmm+|you know|i mean|sort of|kind of|basically|actually|literally)\b",
    re.I,
)
_WORD = re.compile(r"[\w'+#.-]+")
SLOW_BELOW = 110
FAST_ABOVE = 170


def compute_speech_metrics(text: str, duration_seconds: float, long_pauses: int) -> dict:
    words = len(_WORD.findall(text))
    wpm = round(words / (duration_seconds / 60))
    fillers = Counter(match.lower() for match in _FILLERS.findall(text))
    pace = "slow" if wpm < SLOW_BELOW else "fast" if wpm > FAST_ABOVE else "good"
    return {
        "words": words,
        "words_per_minute": wpm,
        "filler_words": sum(fillers.values()),
        "filler_breakdown": dict(fillers.most_common(5)),
        "long_pauses": long_pauses,
        "duration_seconds": round(duration_seconds),
        "pace": pace,
    }
