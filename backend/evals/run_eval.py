"""Benchmark the AI evaluator on labeled answers.

Measures whether strong > average > weak, and how stable scores are across repeat runs.
Run from backend/: python -m evals.run_eval --repeats 2
"""
import argparse
import json
import statistics
import time
from itertools import combinations
from pathlib import Path

from app.services import gemini_service as llm

LEVELS = ("weak", "average", "strong")
SECONDS_BETWEEN_CALLS = 4.5  # Stays under the 15 requests/minute budget.
RETRY_DELAYS = (15, 30)


def score_case(case: dict, repeats: int) -> dict[str, list[int]]:
    scores = {level: [] for level in LEVELS}
    for _ in range(repeats):
        for level in LEVELS:
            scores[level].append(_evaluate(case, level))
            time.sleep(SECONDS_BETWEEN_CALLS)
    return scores


def _evaluate(case: dict, level: str) -> int:
    """Wait out temporary provider errors, so one outage doesn't discard the whole benchmark."""
    for delay in RETRY_DELAYS:
        try:
            return llm.evaluate_answer(case["question"], case[level], case["role"], case["difficulty"])["score"]
        except llm.LLMUnavailable:
            time.sleep(delay)
    return llm.evaluate_answer(case["question"], case[level], case["role"], case["difficulty"])["score"]


def summarize(all_scores: list[dict[str, list[int]]]) -> dict:
    correct, pairs, spreads = 0, 0, []
    for scores in all_scores:
        means = {level: statistics.mean(values) for level, values in scores.items()}
        for lower, higher in combinations(LEVELS, 2):
            pairs += 1
            correct += means[higher] > means[lower]
        spreads.extend(max(values) - min(values) for values in scores.values())
    return {
        "ranking_accuracy": round(correct / pairs, 3),
        "pairs_checked": pairs,
        "mean_repeat_spread": round(statistics.mean(spreads), 2),
        "max_repeat_spread": max(spreads),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repeats", type=int, default=2)
    args = parser.parse_args()
    cases = json.loads((Path(__file__).parent / "golden_answers.json").read_text(encoding="utf-8"))
    all_scores = []
    for case in cases:
        scores = score_case(case, args.repeats)
        all_scores.append(scores)
        print(f"{case['role']}: {scores}")
    print(json.dumps(summarize(all_scores), indent=2))


if __name__ == "__main__":
    main()
