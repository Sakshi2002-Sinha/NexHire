from pypdf import PdfReader
from pypdf.errors import PyPdfError

MAX_PAGES = 10
MAX_TEXT_CHARS = 20_000


class InvalidResume(ValueError):
    """The upload is not a readable, text-based PDF."""


def extract_text_from_pdf(pdf_file) -> str:
    try:
        reader = PdfReader(pdf_file)
        if reader.is_encrypted:
            raise InvalidResume("Password-protected PDFs are not supported.")
        if len(reader.pages) > MAX_PAGES:
            raise InvalidResume(f"Resume must be {MAX_PAGES} pages or fewer.")
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except InvalidResume:
        raise
    except (PyPdfError, ValueError, KeyError, IndexError, TypeError, OSError) as exc:
        raise InvalidResume("Could not read this PDF.") from exc
    if not text:
        raise InvalidResume("No text found. Scanned resumes are not supported yet.")
    # Postgres TEXT cannot store NUL bytes, which some PDFs produce.
    return text.replace("\x00", "")[:MAX_TEXT_CHARS]
