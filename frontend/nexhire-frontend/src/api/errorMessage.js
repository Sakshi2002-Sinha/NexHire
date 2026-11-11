// Turn an axios error into text that's safe to render.
// FastAPI sends a string "detail" for most errors, but a list of
// objects for 422 validation errors, which React can't render.
export function getErrorMessage(err, fallback = "Something went wrong") {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;

  return fallback;
}
