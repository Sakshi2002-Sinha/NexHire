"""In-memory sliding-window rate limiter.

Accurate for one process. With several workers each keeps its own counters, so
the next step is the same interface backed by a Redis sorted set.
"""
import threading
import time
from collections import defaultdict, deque


class SlidingWindowLimiter:
    def __init__(self, limit: int, window_seconds: float = 60.0, clock=time.monotonic):
        self.limit = limit
        self.window = window_seconds
        self.clock = clock
        self._hits: dict[str, deque[float]] = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key: str) -> bool:
        now = self.clock()
        with self._lock:
            hits = self._hits[key]
            while hits and now - hits[0] >= self.window:
                hits.popleft()
            if len(hits) >= self.limit:
                return False
            hits.append(now)
            # Drop idle keys occasionally so memory cannot grow without bound.
            if len(self._hits) > 10_000:
                for stale in [k for k, v in self._hits.items() if not v or now - v[-1] >= self.window]:
                    del self._hits[stale]
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()
