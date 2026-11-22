export function scoreLabel(score) {
  if (score == null) return "Not scored";
  if (score >= 8) return "Strong";
  if (score >= 6) return "Solid";
  if (score >= 4) return "Developing";
  return "Needs work";
}

export function formatScore(score) {
  return score == null ? "–" : Number(score).toFixed(1).replace(/\.0$/, "");
}
